/**
 * Fetch EVERY page of a listings API, not just the first.
 *
 * Both retention channels quietly ran on an 8% sample: the daily alert pool
 * and the weekly newsletter's top-10 both fetched `/api/listings` page 1 only
 * (limit 200) against ~2,500 active listings. A subscriber's saved search
 * only matched if a qualifying listing happened to sit in the 200 most
 * recently modified, and the "top 10 cash-flow deals" were the top of a
 * sample — the actual best deals in the other 92% never appeared.
 *
 * Mirrors the homepage/sitemap pattern: page 1 first (for the page count),
 * remaining pages in parallel. Page 1 failing throws — the caller should fail
 * loudly rather than email from an empty pool. A later page failing is logged
 * and skipped: a partial pool beats no send, and the miss is visible in logs.
 */
export async function fetchAllListings(siteUrl, path = '/api/listings', { maxPages = 15, limit = 200 } = {}) {
  const pageUrl = (p) => `${siteUrl}${path}?limit=${limit}&page=${p}`;

  const first = await fetch(pageUrl(1), { cache: 'no-store' });
  if (!first.ok) throw new Error(`Listings fetch failed (HTTP ${first.status}) for ${path}`);
  const ctype = first.headers.get('content-type') || '';
  if (!ctype.includes('application/json')) {
    throw new Error(`Listings API returned non-JSON (content-type: ${ctype || 'none'}) for ${path}`);
  }

  const data = await first.json();
  const rows = [...(data.listings || [])];
  const totalPages = Math.min(data.pages || 1, maxPages);

  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        fetch(pageUrl(i + 2), { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );
    let missed = 0;
    for (const d of rest) {
      if (d?.listings?.length) rows.push(...d.listings);
      else missed++;
    }
    if (missed > 0) {
      console.error(`fetchAllListings: ${missed}/${totalPages - 1} extra pages failed for ${path} — pool is partial (${rows.length} rows)`);
    }
  }

  return { listings: rows, pages: data.pages || 1, total: data.total ?? rows.length };
}
