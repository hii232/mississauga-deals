import { HOOD_DATA } from '@/lib/constants';
import { createClient } from '@supabase/supabase-js';

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
    { url: `${BASE}/sell`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/mortgage-calculator`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/faq`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/score-methodology`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ].map((p) => ({ ...p, lastModified: now }));

  // ── Neighbourhood filter pages (SEO long-tail) ──
  const hoodPages = Object.keys(HOOD_DATA).map((hood) => ({
    url: `${BASE}/listings?hood=${encodeURIComponent(hood)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  // ── Dynamic listing pages ──
  let listingPages = [];
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

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
        for (let p = 2; p <= Math.min(totalPages, 5); p++) {
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

  return [...staticPages, ...hoodPages, ...listingPages, ...blogPages];
}
