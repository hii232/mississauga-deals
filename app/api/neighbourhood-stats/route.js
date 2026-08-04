import { NextResponse } from 'next/server';
import { processListings } from '@/lib/listings/process-listings';
import { computeHoodStats } from '@/lib/listings/hood-stats';
import { fetchFeedPages } from '@/lib/listings/fetch-feed';

// Public site URL - never build the internal fetch from request.url (on Vercel
// that resolves to the deployment-protected *.vercel.app host, an HTML auth wall).
const SITE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://www.mississaugainvestor.ca';

// Serve per-request, never at build time. With only `revalidate` exported,
// Next STATICALLY generated this route during the build - and the batched
// 30-page feed walk (up to 5 batches x 25s) blew the 60s static-generation
// budget three times and FAILED THE ENTIRE #67 DEPLOY. Live stats computed
// from a live feed have no business in the build; the fetch-level
// `revalidate` below still caches the underlying feed pages for 10 minutes,
// so per-request cost stays low.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const revalidate = 600;

/**
 * GET /api/neighbourhood-stats
 * Live per-neighbourhood aggregates (avg price, DOM, yield) from active listings.
 * Returns { stats: { [hood]: { avgPrice, avgDOM, rentYield, count } } }.
 * Degrades to an empty object so callers fall back to curated values.
 */
export async function GET() {
  try {
    // Shared feed fetch - the same limit=100 Data Cache keys every other
    // consumer reads (pages #61, market-stats #65, sitemaps). This route kept
    // its own limit=200 loop, so the per-hood avg price / DOM / yield on all
    // 24 guide pages and the homepage cards were computed from stale pre-fix
    // cache entries. maxPages 30 keeps the intended full-feed coverage now
    // that the feed clamps pages to 100 rows.
    const { listings: raw } = await fetchFeedPages(SITE_URL, '/api/listings', {
      pages: 30,
      revalidate,
      // 10s, not 25: pages fetch in batches of 6 (5 batches for 30 pages), and
      // the worst case must fit inside maxDuration - 5 x 10s = 50s < 60s.
      timeoutMs: 10000,
      // nomedia=1: per-hood avg price / DOM / yield only - no photo is read
      // from these rows, and the Media $expand is the dominant request cost.
      qs: '&nomedia=1',
    });
    if (raw.length === 0) return NextResponse.json({ stats: {} });

    // s-maxage lets the Vercel Edge CDN serve cached neighbourhood stats for
    // 10 minutes - matching the underlying feed revalidate window - so the
    // 30-page feed walk runs at most once per 10-minute window, not on every
    // request from the 24 neighbourhood guide pages and homepage cards.
    return NextResponse.json(
      { stats: computeHoodStats(processListings(raw)) },
      { headers: { 'Cache-Control': `s-maxage=${revalidate}, stale-while-revalidate=${revalidate}` } }
    );
  } catch {
    return NextResponse.json({ stats: {} });
  }
}
