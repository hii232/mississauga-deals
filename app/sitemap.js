import { createClient } from '@supabase/supabase-js';
import { HOOD_DATA } from '@/lib/constants';
import { CITY_COPY } from '@/app/(public)/gta/page';

// Regenerate sitemap every 6 hours
export const revalidate = 21600;

const BASE = 'https://www.mississaugainvestor.ca';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export default async function sitemap() {
  const now = new Date().toISOString();

  // ── Static pages ──
  const staticPages = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/listings`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/gta`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/recent-sales`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/market-pulse`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/neighbourhoods`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/news`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/quiz`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/pre-construction`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/pre-construction/projects`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/pre-construction/hst-rebate`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/sell`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/mortgage-calculator`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/rent-vs-buy-mississauga`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/hurontario-lrt-real-estate`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/townhouse-vs-condo-investment`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/cash-flow-positive-properties-ontario`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/rental-property-insurance-mississauga`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/faq`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/guides`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/score-methodology`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/book-call`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/alerts`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/compare`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ].map((p) => ({ ...p, lastModified: now }));

  // ── Neighbourhood investment guides ──
  const hoodGuidePages = Object.keys(HOOD_DATA).map((name) => ({
    url: `${BASE}/neighbourhoods/${name.toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  // ── GTA city pages (/gta?city=X) — each has a unique title/description +
  // self-canonical, but is only linked from the mega-menu, so list them here
  // for discovery/indexing (targets "{City} investment properties"). ──
  const gtaCityPages = Object.keys(CITY_COPY).map((city) => ({
    url: `${BASE}/gta?city=${encodeURIComponent(city)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  // ── Dynamic listing pages ──
  let listingPages = [];
  try {
    // Public domain, NOT VERCEL_URL — the *.vercel.app URL is behind Vercel
    // deployment protection, so fetching it 401s and the sitemap loses all
    // listing URLs.
    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://www.mississaugainvestor.ca';

    const res = await fetch(`${baseUrl}/api/listings?limit=200&page=1`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const listings = data.listings || data || [];
      const totalPages = data.pages || 1;

      // Get remaining pages
      const allListings = [...listings];
      if (totalPages > 1) {
        const promises = [];
        for (let p = 2; p <= Math.min(totalPages, 15); p++) {
          promises.push(
            fetch(`${baseUrl}/api/listings?limit=200&page=${p}`, {
              next: { revalidate: 3600 },
            }).then((r) => (r.ok ? r.json() : { listings: [] }))
          );
        }
        const results = await Promise.all(promises);
        results.forEach((d) => {
          const extra = d.listings || d || [];
          allListings.push(...extra);
        });
      }

      listingPages = allListings
        .filter((l) => l.ListingKey || l.id)
        .map((l) => ({
          url: `${BASE}/listings/${l.ListingKey || l.id}`,
          lastModified: l.ModificationTimestamp || now,
          changeFrequency: 'daily',
          priority: 0.6,
        }));
    }
  } catch (err) {
    console.error('Sitemap: failed to fetch listings', err);
  }

  // ── GTA listing pages (Toronto + other cities) ──
  // Same /listings/{id} detail route, but the main /api/listings feed is
  // Mississauga-only, so without this the GTA listing detail pages aren't in
  // the sitemap and Google can't discover them (they win address queries).
  // Bounded to a few pages + its own try/catch so it can never break the map.
  let gtaListingPages = [];
  try {
    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://www.mississaugainvestor.ca';

    const res = await fetch(`${baseUrl}/api/listings-gta?limit=200&page=1`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const all = [...(data.listings || [])];
      const totalPages = data.pages || 1;
      if (totalPages > 1) {
        const promises = [];
        for (let p = 2; p <= Math.min(totalPages, 5); p++) {
          promises.push(
            fetch(`${baseUrl}/api/listings-gta?limit=200&page=${p}`, {
              next: { revalidate: 3600 },
            }).then((r) => (r.ok ? r.json() : { listings: [] }))
          );
        }
        (await Promise.all(promises)).forEach((d) => all.push(...(d.listings || [])));
      }

      gtaListingPages = all
        .filter((l) => l.id)
        .map((l) => ({
          url: `${BASE}/listings/${l.id}`,
          lastModified: now,
          changeFrequency: 'daily',
          priority: 0.55,
        }));
    }
  } catch (err) {
    console.error('Sitemap: failed to fetch GTA listings', err);
  }

  // ── Blog posts ──
  let blogPages = [];
  try {
    if (supabase) {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('slug, updated_at')
        .eq('published', true);
      if (posts) {
        blogPages = posts.map((p) => ({
          url: `${BASE}/blog/${p.slug}`,
          lastModified: p.updated_at || now,
          changeFrequency: 'weekly',
          priority: 0.7,
        }));
      }
    }
  } catch (err) {
    console.error('Sitemap: failed to fetch blog posts', err);
  }

  return [...staticPages, ...gtaCityPages, ...hoodGuidePages, ...listingPages, ...gtaListingPages, ...blogPages];
}
