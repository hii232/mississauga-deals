// Dedicated Google Image sitemap for listing photos.
//
// Next 14's built-in Metadata sitemap (app/sitemap.js) does NOT serialize the
// `images` field — image-sitemap support only landed in Next 15 — so property
// photos would never reach Google Images through it. This route emits the image
// sitemap XML directly (image namespace + <image:image>), which is high value
// for a photo-led real-estate site. Referenced from public/robots.txt.

export const revalidate = 21600; // 6h, matches the main sitemap

import { fetchFeedPages } from '@/lib/listings/fetch-feed';

const BASE = 'https://www.mississaugainvestor.ca';

// Public domain, NOT VERCEL_URL — the *.vercel.app URL is behind Vercel
// deployment protection, so a server fetch there 401s and we lose all photos.
const SITE_URL =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : BASE;

function xmlEscape(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]
  ));
}

// Pages of up to 100 rows (the feed clamps `limit` — see app/api/listings/
// route.js) to pull per feed. Same budget for both feeds so neither is
// arbitrarily favoured, mirroring the LISTING_PAGE_BUDGET convention already
// established in app/sitemap.js.
const LISTING_PAGE_BUDGET = 15;

// Hard per-request timeout. These routes are statically generated at build
// time, where Next allows a page 60s TOTAL — and this file alone makes up to
// 2 x LISTING_PAGE_BUDGET upstream calls. Without a bound, one slow or hanging
// upstream consumes the whole budget and FAILS THE BUILD (observed: "Static
// page generation for /sitemap.xml is still timing out after 3 attempts",
// which broke every preview deploy). A dropped page costs a few sitemap URLs
// that the next revalidation picks up; a failed build costs the whole deploy.
const FETCH_TIMEOUT_MS = 8000;

async function fetchFeed(path) {
  // Shared feed fetch — same limit=100 cache keys as the pages, the main
  // sitemap and market-stats. See lib/listings/fetch-feed.js.
  try {
    const { listings } = await fetchFeedPages(SITE_URL, path, {
      pages: LISTING_PAGE_BUDGET,
      revalidate: 3600,
      timeoutMs: FETCH_TIMEOUT_MS,
    });
    return listings;
  } catch (err) {
    console.error(`Image sitemap: failed to fetch ${path}`, err);
    return [];
  }
}

// This used to fetch ONLY /api/listings (Mississauga) — the exact same gap
// the main sitemap had until it added a dedicated GTA branch: /api/listings-gta
// serves the same /listings/{id} detail route for ~24,500 GTA properties, and
// every one of those pages' real photos (confirmed flowing since the $top=100
// media-expand fix) was invisible to Google Images. Both feeds are fetched in
// parallel and merged; dedupe below guards against the same edge case the main
// sitemap already documented (a listing's sort position can shift mid-fetch on
// a live-sorted feed and land in both page slices).
async function fetchListings() {
  const [mississauga, gta] = await Promise.all([
    fetchFeed('/api/listings'),
    fetchFeed('/api/listings-gta'),
  ]);
  return [...mississauga, ...gta];
}

export async function GET() {
  const listings = await fetchListings();

  const seen = new Set();
  const urls = listings
    .map((l) => {
      const id = l.ListingKey || l.id;
      if (!id) return null;
      const photos = (l.photos || l.images || [])
        .filter((u) => typeof u === 'string' && u.startsWith('https://'))
        .slice(0, 10); // Google honours up to 1,000/URL; 10 is plenty per listing
      if (photos.length === 0) return null;
      const loc = `${BASE}/listings/${encodeURIComponent(id)}`;
      if (seen.has(loc)) return null;
      seen.add(loc);
      const images = photos
        .map((u) => `    <image:image><image:loc>${xmlEscape(u)}</image:loc></image:image>`)
        .join('\n');
      return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n${images}\n  </url>`;
    })
    .filter(Boolean);

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    urls.join('\n') +
    (urls.length ? '\n' : '') +
    '</urlset>\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=21600, stale-while-revalidate=3600',
    },
  });
}
