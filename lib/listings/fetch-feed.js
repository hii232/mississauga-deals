/**
 * THE one server-side fetch path for the listing feeds. Used by the /listings
 * SSR, the /gta SSR and the homepage top-deals fetch, so every page embeds
 * data from the SAME query the /api routes serve - after the field-probe fix
 * landed, all three pages kept serving dom:0 payloads for HOURS because each
 * had its own fetch with its own long-lived Next Data Cache entry:
 *
 *   - Next's Data Cache persists ACROSS DEPLOYMENTS on Vercel, keyed by URL.
 *     The /listings SSR was embedding a 199-row limit=200 response - a shape
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
 * a full 100-row page it then throws 70% of away - the Media $expand is the
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
  // Page 1 and the extra pages are NOT worth the same, and used to share one
  // budget. Page 1 decides whether the caller gets ANY data - losing it
  // returns {listings: [], first: null} and the page renders an empty shell.
  // Extra pages only affect COMPLETENESS: drop three of twenty-five and the
  // homepage still shows four deals off ~2,200 rows.
  //
  // Observed 2026-07-31: production homepage rendered its "Top Investment
  // Deals" section with zero deals. Runtime log: `GET / 200 cache=STALE` +
  // `fetch-feed: /api/listings page 1 failed (TimeoutError)`, while
  // /api/listings itself answered 200 in the same window - healthy, just slow
  // on a cold cache (many cache=MISS). The homepage's own 5s budget was what
  // gave up. Earlier the same day: "3/25 extra pages failed ... 2198 rows
  // collected" - page 1 landing is the whole difference between a full deals
  // section and an empty one.
  //
  // Defaults to timeoutMs so NOTHING changes for callers that don't opt in
  // (/listings is force-dynamic - a longer page-1 wait would sit on every
  // visitor's TTFB; the sitemaps have a documented build-timeout scar). A
  // caller that walks many pages should opt in: it is the one shape where a
  // generous page 1 costs little relative to the batches that follow.
  firstPageTimeoutMs = timeoutMs,
  // 100 = the feed's own clamp, and the default for a reason (see above): it
  // is the one page size whose Data Cache keys are known-clean. Lower it only
  // for a caller that renders fewer rows than it fetches.
  limit = 100,
  // Wall-clock ceiling on the WHOLE walk, for callers that page a feed far
  // larger than a serverless invocation can finish in one go (the GTA feed is
  // ~24.5k rows / ~245 pages against a 60s function). 0 = no ceiling, which is
  // every existing caller, so nothing changes for them.
  //
  // Stopping early is reported, not hidden: the return value says whether the
  // walk actually covered the feed, so an aggregating caller can withhold its
  // figures instead of publishing a count over a truncated slice.
  budgetMs = 0,
} = {}) {
  const startedAt = Date.now();
  const url = (p) => `${origin}${path}?limit=${limit}&page=${p}${qs}`;
  const opts = { next: { revalidate }, signal: AbortSignal.timeout(firstPageTimeoutMs) };

  // The first fetch must not THROW either: an AbortSignal timeout raises, and
  // an unwrapped raise here meant the caller's catch swallowed it silently -
  // /gta shipped an empty shell with nothing in the logs while the API side
  // completed and logged 200 after the page had already given up.
  let res;
  try {
    res = await fetch(url(1), opts);
  } catch (err) {
    console.error(`fetch-feed: ${path} page 1 failed (${err?.name || err}) after ${firstPageTimeoutMs}ms`);
    return { listings: [], first: null, dropped: 1, requested: 1, totalPages: 0, walkedAll: false };
  }
  if (!res.ok) return { listings: [], first: null, dropped: 1, requested: 1, totalPages: 0, walkedAll: false };
  const first = await res.json();
  const listings = [...(first.listings || [])];

  const totalPages = Number(first.pages) || 1;
  const want = Math.min(pages, totalPages);
  let dropped = 0;
  let stoppedEarly = false;
  if (want > 1) {
    // Batched, not all-at-once. Firing 25 pages in parallel meant 25
    // concurrent heavy AMPRE queries - the upstream throttles the burst and
    // several pages blow their timeout, so full-feed consumers (market-stats)
    // kept computing on ~70% fills (measured live: activeCount 1,765 of
    // ~2,555 on a fresh compute). Small batches keep the upstream happy;
    // small consumers (pages: 2) are unaffected - one batch.
    const BATCH = 6;
    // Page-indexed collection (not straight appends) so the retry pass below
    // can slot a recovered page back into place - row order stays identical
    // to a clean sequential walk.
    const pageRows = new Map();
    const missed = [];
    let attemptedMax = 1;
    const getPage = (p) =>
      fetch(url(p), { next: { revalidate }, signal: AbortSignal.timeout(timeoutMs) })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
    for (let start = 2; start <= want; start += BATCH) {
      if (budgetMs > 0 && Date.now() - startedAt > budgetMs) { stoppedEarly = true; break; }
      const end = Math.min(start + BATCH - 1, want);
      const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      const batch = await Promise.all(pages.map(getPage));
      pages.forEach((p, i) => {
        if (batch[i]?.listings) pageRows.set(p, batch[i].listings);
        else missed.push(p);
      });
      attemptedMax = end;
    }

    // One bounded retry pass for pages the upstream throttled away. Live
    // capture 2026-08-08: the GTA screener walked 234/234 pages at 0.996
    // fill and TWO dropped pages - two transient blips out of 234 - cost the
    // entire publish. A dropped page here is usually a burst-throttle
    // casualty, not a bad page; asking again after a pause, in smaller
    // batches, recovers most of them. Skipped when the budget is spent -
    // the budget is the harder promise. Same pattern fetchAllListings
    // (retention channels) got on 2026-08-07.
    if (missed.length > 0 && !stoppedEarly) {
      const RETRY_BATCH = 3;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      for (let i = 0; i < missed.length; i += RETRY_BATCH) {
        if (budgetMs > 0 && Date.now() - startedAt > budgetMs) break;
        const pages = missed.slice(i, i + RETRY_BATCH);
        const batch = await Promise.all(pages.map(getPage));
        pages.forEach((p, j) => {
          if (batch[j]?.listings) pageRows.set(p, batch[j].listings);
        });
      }
    }

    // Reassemble in page order; dropped counts only ATTEMPTED pages that
    // still have no rows (un-attempted pages past a budget stop were never
    // counted as dropped before and still aren't).
    for (let p = 2; p <= attemptedMax; p++) {
      const rows = pageRows.get(p);
      if (rows) listings.push(...rows);
      else dropped++;
    }
    if (dropped > 0) {
      console.error(`fetch-feed: ${dropped}/${want - 1} extra pages failed for ${path} even after retry (${listings.length} rows collected)`);
    }
  }
  // walkedAll: every page of the feed was requested AND every request came
  // back. Anything less means the row set is a truncated slice of the market,
  // which is exactly the input an aggregate must refuse.
  // stoppedEarly is exposed separately so a caller can tell a BUDGET
  // truncation (a recency-biased prefix - never aggregate it) apart from a
  // fully-attempted walk with residual drops (a ~random few-% gap, which a
  // fill-ratio bar can judge on its own terms).
  return {
    listings,
    first,
    dropped,
    requested: want,
    totalPages,
    stoppedEarly,
    walkedAll: !stoppedEarly && dropped === 0 && want >= totalPages,
  };
}

/**
 * Trim processed listings down to what the server render actually uses.
 *
 * The /listings SSR was shipping 13 MB of HTML: ~200 full listing objects in
 * the RSC payload - every photo URL (up to ~40 per listing) and full MLS
 * remarks - while the server markup only ever renders the first page of 30
 * cards, each showing photos[0] and no remarks. Everything past that was
 * dead weight on every mobile visit, and Core Web Vitals pay for it.
 *
 * Safe because the container background-fetches the complete feed on mount
 * and REPLACES initialListings - this slice only shapes the pre-hydration
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
