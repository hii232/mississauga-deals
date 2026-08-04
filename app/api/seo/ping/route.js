import { NextResponse } from 'next/server';
import { requireCronOrAdmin } from '@/lib/api-auth';

const SITEMAP_URL = 'https://www.mississaugainvestor.ca/sitemap.xml';

/**
 * GET|POST /api/seo/ping
 * Called by Vercel Cron daily (cron invokes with GET) - pings Google & Bing
 * with updated sitemap, then submits new listing URLs to IndexNow.
 */
export async function GET(request) {
  return POST(request);
}

export async function POST(request) {
  // Fails CLOSED - the old guard was skipped when CRON_SECRET was unset.
  const denied = requireCronOrAdmin(request);
  if (denied) return denied;

  const results = { google: null, bing: null, indexNow: null };

  try {
    // 1. Ping Google with sitemap
    const googleRes = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
    );
    results.google = googleRes.ok ? 'ok' : `error: ${googleRes.status}`;
  } catch (err) {
    results.google = `error: ${err.message}`;
  }

  try {
    // 2. Ping Bing with sitemap
    const bingRes = await fetch(
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
    );
    results.bing = bingRes.ok ? 'ok' : `error: ${bingRes.status}`;
  } catch (err) {
    results.bing = `error: ${err.message}`;
  }

  try {
    // 3. IndexNow - submit new listing URLs for instant indexing
    // Public domain, NOT VERCEL_URL (deployment protection 401s server fetches)
    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://www.mississaugainvestor.ca';

    const res = await fetch(`${baseUrl}/api/listings?limit=200&page=1`, {
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const data = await res.json();
      const listings = data.listings || data || [];

      // Only submit fresh listings - the processed API exposes days on
      // market, not raw MLS timestamps.
      // `dom >= 1` matters: 0 means the feed gave no age at all
      // (lib/listings/market-timing.js), and `dom <= 3` alone accepted it. So
      // while DOM was withheld on every active listing, this submitted the
      // first 100 rows of the feed to IndexNow on every run as "new" -
      // repeatedly re-pinging the same unchanged URLs, which is exactly the
      // behaviour IndexNow asks publishers not to exhibit. Now only listings
      // with a real 1–3 day age are submitted.
      const newUrls = listings
        .filter((l) => {
          const dom = Number(l.dom ?? l.daysOnMarket);
          return Number.isFinite(dom) && dom >= 1 && dom <= 3;
        })
        .map((l) => `https://www.mississaugainvestor.ca/listings/${l.ListingKey || l.id}`)
        .slice(0, 100); // IndexNow limit: 10,000, but keep reasonable

      if (newUrls.length > 0) {
        const indexNowKey = process.env.INDEXNOW_KEY || 'mississaugainvestor-indexnow-key';

        const indexNowRes = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: 'www.mississaugainvestor.ca',
            key: indexNowKey,
            keyLocation: `https://www.mississaugainvestor.ca/${indexNowKey}.txt`,
            urlList: newUrls,
          }),
        });

        results.indexNow = indexNowRes.ok
          ? `submitted ${newUrls.length} URLs`
          : `error: ${indexNowRes.status}`;
      } else {
        results.indexNow = 'no new URLs to submit';
      }
    }
  } catch (err) {
    results.indexNow = `error: ${err.message}`;
  }

  return NextResponse.json({ message: 'SEO ping complete', results });
}
