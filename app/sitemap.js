import { createClient } from '@supabase/supabase-js';
import { HOOD_DATA, HOOD_OUTLOOK_AS_OF } from '@/lib/constants';
import { CITY_COPY } from '@/app/(public)/gta/page';

// Regenerate sitemap every 6 hours
export const revalidate = 21600;

const BASE = 'https://www.mississaugainvestor.ca';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// Pages whose content is genuinely regenerated from a live feed, so "changed
// recently" is a true statement about them. Everything else is editorial
// content that does NOT change when the sitemap regenerates.
const FEED_DRIVEN = new Set([
  `${BASE}/`,
  `${BASE}/listings`,
  `${BASE}/gta`,
  `${BASE}/recent-sales`,
  `${BASE}/news`,
  `${BASE}/blog`,
  `${BASE}/pre-construction/projects`,
]);

// Turn "April 2026" into an ISO date so curated content can carry its real
// as-of date instead of pretending to have changed minutes ago.
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];

function monthStringToISO(monthYear) {
  if (typeof monthYear !== 'string') return null;
  // Parse explicitly. `new Date('not-a-month 1 UTC')` does NOT return Invalid
  // Date — V8 coerces it to the year 2001 — so a typo in the constant would
  // have silently published a 25-year-old lastmod on all 24 guide pages.
  const m = monthYear.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const monthIdx = MONTHS.indexOf(m[1].toLowerCase());
  if (monthIdx === -1) return null;
  const year = Number(m[2]);
  if (!Number.isFinite(year) || year < 2000 || year > 2100) return null;
  // End of that month — the latest point the stated content was true.
  return new Date(Date.UTC(year, monthIdx + 1, 0)).toISOString();
}

export default async function sitemap() {
  const now = new Date().toISOString();
  const hoodAsOf = monthStringToISO(HOOD_OUTLOOK_AS_OF);

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
    // lastmod is only stamped where it is TRUE. This sitemap regenerates every
    // 6 hours and used to stamp `now` on all ~80 static URLs, telling Google
    // that every guide, legal page and landing page changed twice a day. Google
    // treats a consistently unreliable lastmod as a reason to IGNORE lastmod for
    // the whole site — which would throw away the accurate per-listing and
    // per-post dates below, the ones that actually matter for recrawl. Omitting
    // it is explicitly fine; lying is not.
  ].map((p) => (FEED_DRIVEN.has(p.url) ? { ...p, lastModified: now } : p));

  // ── Neighbourhood investment guides ──
  // Curated guides: dated by the outlook they publish (HOOD_OUTLOOK_AS_OF),
  // not by when the sitemap happened to rebuild.
  const hoodGuidePages = Object.keys(HOOD_DATA).map((name) => ({
    url: `${BASE}/neighbourhoods/${name.toLowerCase().replace(/\s+/g, '-')}`,
    ...(hoodAsOf ? { lastModified: hoodAsOf } : {}),
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
          // Real MLS modification timestamp, or nothing — never a fake stamp.
          ...(l.modificationTimestamp || l.ModificationTimestamp
            ? { lastModified: l.modificationTimestamp || l.ModificationTimestamp }
            : {}),
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
          // Real MLS timestamp or nothing — same rule as the Mississauga
          // listings above. This branch used to stamp `now` on up to 1,000
          // URLs every 6 hours, which is the exact unreliable-lastmod signal
          // the comment on the static pages warns about: Google responds by
          // distrusting lastmod for the WHOLE site, discarding the accurate
          // per-listing and per-post dates that actually drive recrawl.
          ...(l.modificationTimestamp ? { lastModified: l.modificationTimestamp } : {}),
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
          ...(p.updated_at || p.created_at ? { lastModified: p.updated_at || p.created_at } : {}),
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
