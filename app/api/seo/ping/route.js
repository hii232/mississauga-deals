import { NextResponse } from 'next/server';

const SITEMAP_URL = 'https://www.mississaugainvestor.ca/sitemap.xml';

/**
 * POST /api/seo/ping
 * Called by Vercel Cron daily — pings Google & Bing with updated sitemap,
 * then submits new listing URLs to IndexNow for instant Bing/Yandex indexing.
 */
export async function POST(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    // 3. IndexNow — submit new listing URLs for instant indexing
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const res = await fetch(`${baseUrl}/api/listings?limit=200&page=1`, {
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const data = await res.json();
      const listings = data.listings || data || [];

      // Only submit listings from last 3 days (new listings)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const newUrls = listings
        .filter((l) => {
          if (!l.OriginalEntryTimestamp && !l.ModificationTimestamp) return false;
          const date = new Date(l.OriginalEntryTimestamp || l.ModificationTimestamp);
          return date >= threeDaysAgo;
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
