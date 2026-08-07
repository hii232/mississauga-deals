/**
 * Fetch EVERY page of a listings API, not just the first.
 *
 * Both retention channels quietly ran on an 8% sample: the daily alert pool
 * and the weekly newsletter's top-10 both fetched `/api/listings` page 1 only
 * (limit 200) against ~2,500 active listings. A subscriber's saved search
 * only matched if a qualifying listing happened to sit in the 200 most
 * recently modified, and the "top 10 cash-flow deals" were the top of a
 * sample - the actual best deals in the other 92% never appeared.
 *
 * Mirrors the homepage/sitemap pattern: page 1 first (for the page count),
 * remaining pages in parallel. Page 1 failing throws - the caller should fail
 * loudly rather than email from an empty pool. A later page failing is logged
 * and skipped: a partial pool beats no send, and the miss is visible in logs
 * AND in the returned diagnostics, so a caller can decide whether a partial
 * run is trustworthy rather than treating `feedListingCount` at face value.
 */
// maxPages 30, limit 100: the feed clamps limit to 100 (media-expand limit,
// see /api/listings), so the old maxPages=15 - sized for 200-row pages -
// silently halved the pool to ~1,500 of ~2,555 active listings the moment the
// clamp shipped. The retention channels were quietly skipping ~40% of
// inventory again, the exact bug this helper exists to prevent.
export async function fetchAllListings(siteUrl, path = '/api/listings', opts = {}) {
  const {
    maxPages = 30,
    limit = 100,
    // Injectable for tests (real network calls otherwise) - same pattern as
    // send-bulk.js's injected clock, so pacing/retry behaviour is asserted
    // exactly rather than slept through.
    fetchImpl = fetch,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = opts;
  const pageUrl = (p) => `${siteUrl}${path}?limit=${limit}&page=${p}`;
  const getPage = (p) =>
    fetchImpl(pageUrl(p), { cache: 'no-store', signal: AbortSignal.timeout(15000) })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

  const first = await fetchImpl(pageUrl(1), { cache: 'no-store' });
  if (!first.ok) throw new Error(`Listings fetch failed (HTTP ${first.status}) for ${path}`);
  const ctype = first.headers.get('content-type') || '';
  if (!ctype.includes('application/json')) {
    throw new Error(`Listings API returned non-JSON (content-type: ${ctype || 'none'}) for ${path}`);
  }

  const data = await first.json();
  const pageRows = new Map([[1, data.listings || []]]); // page -> rows, so a retry can replace a miss in place
  const totalPages = Math.min(data.pages || 1, maxPages);

  if (totalPages > 1) {
    // Batched, not all-at-once - firing 25 parallel no-store fetches was the
    // same burst the upstream throttles (measured on the feed fan-out and the
    // photo backfill: bursts get pages dropped, and a dropped page here means
    // a subscriber's saved-search match silently never mails). 6 at a time
    // with a per-page timeout; a hung page costs 15s, not the whole route
    // budget.
    const BATCH = 6;
    let missedPages = [];
    for (let start = 2; start <= totalPages; start += BATCH) {
      const end = Math.min(start + BATCH - 1, totalPages);
      const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      const batch = await Promise.all(pages.map(getPage));
      pages.forEach((p, i) => {
        const d = batch[i];
        if (d?.listings?.length) pageRows.set(p, d.listings);
        else missedPages.push(p);
      });
    }

    // A page missing here is most often the upstream throttling a burst, not
    // a permanently bad page - production has shown 10/24 pages failing on a
    // single run (2026-08-06). One retry pass, in smaller batches and after a
    // short pause, gives the throttle time to clear before asking again.
    // Bounded on purpose: 3 pages at a time (half the primary batch), one
    // pass only - worst case adds ~ceil(missed/3) * 15s, which stays well
    // inside this route's 300s budget even with every retry timing out.
    if (missedPages.length > 0) {
      await sleep(1000);
      const RETRY_BATCH = 3;
      const stillMissed = [];
      for (let i = 0; i < missedPages.length; i += RETRY_BATCH) {
        const pages = missedPages.slice(i, i + RETRY_BATCH);
        const batch = await Promise.all(pages.map(getPage));
        pages.forEach((p, j) => {
          const d = batch[j];
          if (d?.listings?.length) pageRows.set(p, d.listings);
          else stillMissed.push(p);
        });
      }
      missedPages = stillMissed;
    }

    if (missedPages.length > 0) {
      console.error(
        `fetchAllListings: ${missedPages.length}/${totalPages - 1} extra pages failed for ${path} even after retry - pool is partial`
      );
    }
  }

  const rows = Array.from(pageRows.keys())
    .sort((a, b) => a - b)
    .flatMap((p) => pageRows.get(p));
  const total = data.total ?? rows.length;
  const pagesFetched = pageRows.size;

  return {
    listings: rows,
    pages: data.pages || 1,
    total,
    // Coverage diagnostics: a caller can now tell a genuinely partial run
    // apart from a healthy one instead of trusting rows.length at face
    // value. fill is null when the feed didn't report a total to compare
    // against (rows.length was used as its own total, so it would always
    // read 1.0 and lie).
    pagesRequested: totalPages,
    pagesFetched,
    pagesMissed: totalPages - pagesFetched,
    fill: data.total ? Math.round((rows.length / data.total) * 1000) / 1000 : null,
  };
}
