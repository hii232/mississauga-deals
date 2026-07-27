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

export async function fetchFeedPages(origin, path, {
  pages = 1,
  qs = '',
  revalidate = 300,
  timeoutMs = FETCH_TIMEOUT_MS,
} = {}) {
  const url = (p) => `${origin}${path}?limit=100&page=${p}${qs}`;
  const opts = { next: { revalidate }, signal: AbortSignal.timeout(timeoutMs) };

  const res = await fetch(url(1), opts);
  if (!res.ok) return { listings: [], first: null };
  const first = await res.json();
  const listings = [...(first.listings || [])];

  const totalPages = Number(first.pages) || 1;
  const want = Math.min(pages, totalPages);
  if (want > 1) {
    const extra = await Promise.all(
      Array.from({ length: want - 1 }, (_, i) =>
        fetch(url(i + 2), { next: { revalidate }, signal: AbortSignal.timeout(timeoutMs) })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );
    for (const pg of extra) if (pg?.listings) listings.push(...pg.listings);
  }
  return { listings, first };
}
