// Dedicated Google Image sitemap for listing photos.
//
// Next 14's built-in Metadata sitemap (app/sitemap.js) does NOT serialize the
// `images` field — image-sitemap support only landed in Next 15 — so property
// photos would never reach Google Images through it. This route emits the image
// sitemap XML directly (image namespace + <image:image>), which is high value
// for a photo-led real-estate site. Referenced from public/robots.txt.

export const revalidate = 21600; // 6h, matches the main sitemap

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

async function fetchListings() {
  const all = [];
  try {
    const res = await fetch(`${SITE_URL}/api/listings?limit=200&page=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return all;
    const data = await res.json();
    all.push(...(data.listings || (Array.isArray(data) ? data : [])));
    const totalPages = data.pages || 1;
    if (totalPages > 1) {
      const promises = [];
      for (let p = 2; p <= Math.min(totalPages, 15); p++) {
        promises.push(
          fetch(`${SITE_URL}/api/listings?limit=200&page=${p}`, {
            next: { revalidate: 3600 },
          }).then((r) => (r.ok ? r.json() : { listings: [] }))
        );
      }
      const results = await Promise.all(promises);
      results.forEach((d) => all.push(...(d.listings || [])));
    }
  } catch (err) {
    console.error('Image sitemap: failed to fetch listings', err);
  }
  return all;
}

export async function GET() {
  const listings = await fetchListings();

  const urls = listings
    .map((l) => {
      const id = l.ListingKey || l.id;
      if (!id) return null;
      const photos = (l.photos || l.images || [])
        .filter((u) => typeof u === 'string' && u.startsWith('https://'))
        .slice(0, 10); // Google honours up to 1,000/URL; 10 is plenty per listing
      if (photos.length === 0) return null;
      const loc = `${BASE}/listings/${encodeURIComponent(id)}`;
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
