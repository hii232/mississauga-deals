/**
 * THE one server-side fetch path for the listing feeds. Used by the /listings
 * SSR, the /gta SSR and the homepage top-deals fetch, so every page embeds
 * data from the SAME query the /api routes serve — after the field-probe fix
 * landed, all three pages kept serving dom:0 payloads for HOURS because each
 * had its own fetch with its own long-lived Next Data Cache entry:
 *
 *   - Next's Data Cache persists ACROSS DEPLOYMENTS on Vercel, keyed by URL.
 *     The /listings SSR was embedding a 199-row limit=200 response — a shape
 *     the API stopped producing three deploys earlier (the feed clamps to 100
 *     since #56). The fix was live in /api/listings while every page on the
 *     site still rendered the pre-fix data it had cached.
 *   - Requests here use limit=100 (the feed's real clamp), which also means
 *     the poisoned limit=200 cache keys can never be read again.
 *
 * Short revalidate (300s) because these are the money surfaces: a stale-data
 * window measured in hours turns every data fix into a "still broken" report.
 */
const FETCH_TIMEOUT_MS = 8000;

/**
 * Rows the pre-hydration server render actually paints (see slimForSSR).
 * Exported so a caller can ask the feed for EXACTLY that many rows instead of
 * a full 100-row page it then throws 70% of away — the Media $expand is the
 * dominant cost of a feed request (roughly 5 CDN size-variants per photo, so a
 * 100-row page drags ~18k media rows across the wire), and it scales linearly
 * with the row count. Only SSR-shaped callers should pass it; anything that
 * aggregates the whole feed (market-stats, sitemap) still wants full pages.
 */
export const SSR_CARD_ROWS = 30;

export async function fetchFeedPages(origin, path, {
  pages = 1,
  qs = '',
  revalidate = 300,
  timeoutMs = FETCH_TIMEOUT_MS,
  // 100 = the feed's own clamp, and the default for a reason (see above): it
  // is the one page size whose Data Cache keys are known-clean. Lower it only
  // for a caller that renders fewer rows than it fetches.
  limit = 100,
} = {}) {
  const url = (p) => `${origin}${path}?limit=${limit}&page=${p}${qs}`;
  const opts = { next: { revalidate }, signal: AbortSignal.timeout(timeoutMs) };

  // The first fetch must not THROW either: an AbortSignal timeout raises, and
  // an unwrapped raise here meant the caller's catch swallowed it silently —
  // /gta shipped an empty shell with nothing in the logs while the API side
  // completed and logged 200 after the page had already given up.
  let res;
  try {
    res = await fetch(url(1), opts);
  } catch (err) {
    console.error(`fetch-feed: ${path} page 1 failed (${err?.name || err})`);
    return { listings: [], first: null };
  }
  if (!res.ok) return { listings: [], first: null };
  const first = await res.json();
  const listings = [...(first.listings || [])];

  const totalPages = Number(first.pages) || 1;
  const want = Math.min(pages, totalPages);
  if (want > 1) {
    // Batched, not all-at-once. Firing 25 pages in parallel meant 25
    // concurrent heavy AMPRE queries — the upstream throttles the burst and
    // several pages blow their timeout, so full-feed consumers (market-stats)
    // kept computing on ~70% fills (measured live: activeCount 1,765 of
    // ~2,555 on a fresh compute). Small batches keep the upstream happy;
    // small consumers (pages: 2) are unaffected — one batch.
    const BATCH = 6;
    let dropped = 0;
    for (let start = 2; start <= want; start += BATCH) {
      const end = Math.min(start + BATCH - 1, want);
      const batch = await Promise.all(
        Array.from({ length: end - start + 1 }, (_, i) =>
          fetch(url(start + i), { next: { revalidate }, signal: AbortSignal.timeout(timeoutMs) })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      for (const pg of batch) {
        if (pg?.listings) listings.push(...pg.listings);
        else dropped++;
      }
    }
    if (dropped > 0) {
      console.error(`fetch-feed: ${dropped}/${want - 1} extra pages failed for ${path} (${listings.length} rows collected)`);
    }
  }
  return { listings, first };
}

/**
 * Trim processed listings down to what the server render actually uses.
 *
 * The /listings SSR was shipping 13 MB of HTML: ~200 full listing objects in
 * the RSC payload — every photo URL (up to ~40 per listing) and full MLS
 * remarks — while the server markup only ever renders the first page of 30
 * cards, each showing photos[0] and no remarks. Everything past that was
 * dead weight on every mobile visit, and Core Web Vitals pay for it.
 *
 * Safe because the container background-fetches the complete feed on mount
 * and REPLACES initialListings — this slice only shapes the pre-hydration
 * render and what crawlers read (the 30 rendered cards, unchanged). All
 * computed numbers (cash flow, cap rate, score, dom, hasSuite…) are kept;
 * only the two heavyweight raw-text fields are cut.
 */
export function slimForSSR(listings, max = SSR_CARD_ROWS) {
  return (listings || []).slice(0, max).map((l) => ({
    ...l,
    photos: l.photos?.length ? [l.photos[0]] : [],
    images: l.images?.length ? [l.images[0]] : [],
    remarks: '',
  }));
}
