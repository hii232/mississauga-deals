import Link from 'next/link';
import Image from 'next/image';
import { blogCoverUrl } from '@/lib/blog-cover';
import { CityscapePanorama } from '@/components/art/cityscape';
import { createClient } from '@supabase/supabase-js';
import InlineCTA from '@/components/ui/inline-cta';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { sanitizePost } from '@/lib/blog/sanitize-content';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// Revalidate every 60 seconds so new posts appear quickly
export const revalidate = 60;

const POSTS_PER_PAGE = 12;
const BASE_URL = 'https://www.mississaugainvestor.ca';

// Known categories — used for filter chips without an extra query.
const CATEGORIES = [
  'Neighbourhood Guide',
  'Strategy',
  'Guide',
  'Market Analysis',
  'Beginner Guide',
  'Platform',
  'General',
];

const categoryColorMap = {
  'Neighbourhood Guide': 'bg-accent/10 text-accent border-accent/20',
  'Strategy': 'bg-green-500/10 text-green-600 border-green-500/20',
  'Guide': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Market Analysis': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Platform': 'bg-accent/10 text-accent border-accent/20',
  'Beginner Guide': 'bg-green-500/10 text-green-600 border-green-500/20',
  'General': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

// Override the layout's static canonical and OG URL for deep pages so each
// paginated URL is its own distinct indexable page — not a duplicate of page 1.
export async function generateMetadata({ searchParams }) {
  const page = Math.max(1, parseInt(searchParams?.page) || 1);
  if (page <= 1) return {}; // layout's canonical /blog is correct for page 1
  // Next.js REPLACES (not merges) the root twitter object when a page defines
  // its own openGraph, so deep paginated pages would lose the layout's
  // summary_large_image card without this explicit twitter block.
  return {
    alternates: { canonical: `/blog?page=${page}` },
    openGraph: { url: `${BASE_URL}/blog?page=${page}` },
    twitter: {
      card: 'summary_large_image',
      title: 'Investment Insights — Mississauga Real Estate Blog by Hamza Nouman',
      description: 'Expert Mississauga real estate investment analysis and guides by Hamza Nouman.',
      images: ['/opengraph-image'],
    },
  };
}

// Windowed page-number list: always include first and last page; show up to 2
// neighbours of the current page; collapse gaps with an ellipsis marker.
function buildPageNumbers(current, total) {
  const nums = new Set([1, total]);
  for (let i = Math.max(1, current - 1); i <= Math.min(total, current + 1); i++) nums.add(i);
  const sorted = [...nums].sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) result.push('…');
    result.push(n);
    prev = n;
  }
  return result;
}

export default async function BlogPage({ searchParams }) {
  const currentPage = Math.max(1, parseInt(searchParams?.page) || 1);
  const activeCategory = searchParams?.category || null;

  let posts = [];
  let totalCount = 0;
  let blogListSchema = null;

  if (supabase) {
    // Lightweight query: slug + title only, for the ItemList schema and the
    // total count. Previously `select('*')` fetched full post bodies (content,
    // HTML, etc.) for every row just to compute read-times on the index page —
    // the source of the 660KB+ page weight on a blog with 120+ posts.
    let allQuery = supabase
      .from('blog_posts')
      .select('slug, title', { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false });
    if (activeCategory) allQuery = allQuery.eq('category', activeCategory);
    const { data: allSlugs, count } = await allQuery;
    totalCount = count || 0;

    const listablePosts = (allSlugs || []).filter((p) => p.slug && p.title);
    if (listablePosts.length > 0) {
      blogListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'MississaugaInvestor.ca — Investment Insights',
        itemListElement: listablePosts.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${BASE_URL}/blog/${p.slug}`,
          name: p.title,
        })),
      };
    }

    // Paginated display query — only the 6 fields each card actually needs.
    const from = (currentPage - 1) * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;
    let pageQuery = supabase
      .from('blog_posts')
      .select('id, title, slug, category, excerpt, cover_image_url, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (activeCategory) pageQuery = pageQuery.eq('category', activeCategory);
    const { data } = await pageQuery;
    // sanitizePost safely handles missing content (sanitizeBlogText is a no-op
    // on non-strings), so the old-brokerage / U+FFFD fixes still apply.
    posts = (data || []).map(sanitizePost);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE));

  // Preserve the active category filter across pagination links.
  const catParam = activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : '';
  const catHref = (cat) =>
    cat && cat !== activeCategory
      ? `/blog?category=${encodeURIComponent(cat)}`
      : '/blog'; // "All" or deselecting the active category

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: `${BASE_URL}/` },
          { name: 'Blog', url: `${BASE_URL}/blog` },
        ]}
      />
      {blogListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
        />
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#141F38] via-navy to-[#2A3B63] pt-16 pb-28 md:pt-20 md:pb-36">
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
            Mississauga Real Estate Investment Insights
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto">
            Expert analysis, neighbourhood guides, and strategies for Mississauga real estate investors
          </p>
        </div>
        <CityscapePanorama variant="dusk" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full opacity-90 md:h-28" />
      </section>

      {/* Articles */}
      <section className="max-w-5xl mx-auto px-4 py-10 md:py-14">

        {/* Category filter chips — only shown when there are posts to filter */}
        {totalCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/blog"
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors no-underline ${
                !activeCategory
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white text-slate-500 border-gray-200 hover:border-navy/30 hover:text-navy'
              }`}
            >
              All articles
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={catHref(cat)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors no-underline ${
                  activeCategory === cat
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-slate-500 border-gray-200 hover:border-navy/30 hover:text-navy'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted text-lg mb-2">
              {activeCategory ? `No articles in "${activeCategory}" yet` : 'Articles coming soon'}
            </p>
            <p className="text-sm text-muted/60">
              Expert Mississauga real estate investment guides, market analysis, and neighbourhood breakdowns.
            </p>
            {activeCategory && (
              <Link href="/blog" className="mt-4 inline-block text-sm text-accent font-semibold no-underline hover:underline">
                ← View all articles
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {posts.map((post) => {
                const dateStr = new Date(post.created_at).toLocaleDateString('en-CA', {
                  year: 'numeric', month: 'long', day: 'numeric',
                });
                const colorClass = categoryColorMap[post.category] || categoryColorMap.General;

                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-accent/30 hover:shadow-lg transition-all duration-300 no-underline"
                  >
                    <div className="relative h-44 w-full overflow-hidden">
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 to-slate-200" aria-hidden="true" />
                      <Image
                        src={blogCoverUrl(post)}
                        alt={post.title}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${colorClass}`}>
                          {post.category}
                        </span>
                        <span className="text-xs text-muted">{dateStr}</span>
                      </div>
                      <h2 className="font-heading text-lg font-bold text-navy mb-2 group-hover:text-accent transition-colors leading-snug">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-muted leading-relaxed mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      <span className="text-xs font-semibold text-accent group-hover:underline">
                        Read more →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination — only shown when there are multiple pages */}
            {totalPages > 1 && (
              <nav
                aria-label="Blog pagination"
                className="mt-10 flex items-center justify-center gap-1.5 flex-wrap"
              >
                {currentPage > 1 && (
                  <Link
                    href={`/blog?page=${currentPage - 1}${catParam}`}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-navy hover:border-accent/30 hover:text-accent transition-colors no-underline"
                  >
                    ← Newer
                  </Link>
                )}

                {buildPageNumbers(currentPage, totalPages).map((item, i) =>
                  item === '…' ? (
                    <span key={`e${i}`} className="px-2 text-muted select-none" aria-hidden>…</span>
                  ) : (
                    <Link
                      key={item}
                      href={`/blog?page=${item}${catParam}`}
                      aria-current={item === currentPage ? 'page' : undefined}
                      className={`min-w-[36px] px-3 py-2 rounded-lg border text-sm font-semibold text-center transition-colors no-underline ${
                        item === currentPage
                          ? 'bg-navy text-white border-navy'
                          : 'bg-white text-slate-500 border-gray-200 hover:border-accent/30 hover:text-navy'
                      }`}
                    >
                      {item}
                    </Link>
                  )
                )}

                {currentPage < totalPages && (
                  <Link
                    href={`/blog?page=${currentPage + 1}${catParam}`}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-navy hover:border-accent/30 hover:text-accent transition-colors no-underline"
                  >
                    Older →
                  </Link>
                )}
              </nav>
            )}
          </>
        )}

        <InlineCTA variant="quiz" className="mt-16" />
      </section>
    </>
  );
}
