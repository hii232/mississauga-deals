import { NextResponse } from 'next/server';
import { processListings } from '@/lib/listings/process-listings';
import { computeHoodStats } from '@/lib/listings/hood-stats';
import { fetchFeedPages } from '@/lib/listings/fetch-feed';

// Public site URL — never build the internal fetch from request.url (on Vercel
// that resolves to the deployment-protected *.vercel.app host, an HTML auth wall).
const SITE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://www.mississaugainvestor.ca';

// Refresh at most every 10 minutes — this powers the neighbourhood cards' live
// avg price / DOM / yield.
export const revalidate = 600;

/**
 * GET /api/neighbourhood-stats
 * Live per-neighbourhood aggregates (avg price, DOM, yield) from active listings.
 * Returns { stats: { [hood]: { avgPrice, avgDOM, rentYield, count } } }.
 * Degrades to an empty object so callers fall back to curated values.
 */
export async function GET() {
  try {
    // Shared feed fetch — the same limit=100 Data Cache keys every other
    // consumer reads (pages #61, market-stats #65, sitemaps). This route kept
    // its own limit=200 loop, so the per-hood avg price / DOM / yield on all
    // 24 guide pages and the homepage cards were computed from stale pre-fix
    // cache entries. maxPages 30 keeps the intended full-feed coverage now
    // that the feed clamps pages to 100 rows.
    const { listings: raw } = await fetchFeedPages(SITE_URL, '/api/listings', {
      pages: 30,
      revalidate,
      timeoutMs: 25000,
    });
    if (raw.length === 0) return NextResponse.json({ stats: {} });

    return NextResponse.json({ stats: computeHoodStats(processListings(raw)) });
  } catch {
    return NextResponse.json({ stats: {} });
  }
}
