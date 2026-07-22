import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import MarkdownRenderer from '@/components/blog/markdown-renderer';
import InlineCTA from '@/components/ui/inline-cta';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import Link from 'next/link';
import { blogCoverUrl } from '@/lib/blog-cover';
import { CityscapePanorama, SkylineStrip } from '@/components/art/cityscape';

export const revalidate = 60;

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export async function generateMetadata({ params }) {
  if (!supabase) return { title: 'Blog' };

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image_url, slug')
    .eq('slug', params.slug)
    .eq('published', true)
    .single();

  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} on MississaugaInvestor.ca`,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://www.mississaugainvestor.ca/blog/${post.slug}`,
      type: 'article',
      images: [{ url: blogCoverUrl(post, true) }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
    alternates: {
      canonical: `https://www.mississaugainvestor.ca/blog/${post.slug}`,
    },
  };
}

const categoryColorMap = {
  'Neighbourhood Guide': 'bg-accent/10 text-accent border-accent/20',
  'Strategy': 'bg-green-500/10 text-green-600 border-green-500/20',
  'Guide': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Market Analysis': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Platform': 'bg-accent/10 text-accent border-accent/20',
  'Beginner Guide': 'bg-green-500/10 text-green-600 border-green-500/20',
  'General': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

async function fetchRelatedPosts(currentSlug, category) {
  if (!supabase) return [];
  const { data } = await supabase
    .from('blog_posts')
    .select('title, slug, category, created_at, cover_image_url')
    .eq('published', true)
    .neq('slug', currentSlug)
    .order('created_at', { ascending: false })
    .limit(3);
  return data || [];
}

export default async function BlogPostPage({ params }) {
  if (!supabase) return notFound();

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single();

  if (error || !post) return notFound();

  const readTime = Math.max(1, Math.ceil((post.content || '').split(/\s+/).length / 200));
  const dateStr = new Date(post.created_at).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const related = await fetchRelatedPosts(post.slug, post.category);

  return (
    <>
      <ArticleJsonLd post={post} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Blog', url: 'https://www.mississaugainvestor.ca/blog' },
          { name: post.title, url: `https://www.mississaugainvestor.ca/blog/${post.slug}` },
        ]}
      />

      {/* Breadcrumb */}
      <div className="bg-cloud border-b border-gray-100 py-2.5 px-4">
        <div className="max-w-6xl mx-auto text-xs text-muted flex items-center gap-1.5">
          <Link href="/" className="hover:text-navy no-underline">Home</Link>
          <span className="text-gray-300">/</span>
          <Link href="/blog" className="hover:text-navy no-underline">Blog</Link>
          <span className="text-gray-300">/</span>
          <span className="text-navy">{post.category || 'Article'}</span>
        </div>
      </div>

      {/* Hero — single H1, dusk skyline identity */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#16223D] via-navy to-[#25355C] py-12 md:py-16">
        <CityscapePanorama
          variant="dusk"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full opacity-60"
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${categoryColorMap[post.category] || categoryColorMap.General}`}>
              {post.category}
            </span>
            <span className="text-xs text-white/70">{dateStr}</span>
            <span className="text-xs text-white/70">{readTime} min read</span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-white/75 text-sm md:text-base mt-4 max-w-2xl mx-auto">
              {post.excerpt}
            </p>
          )}
        </div>
      </section>

      {/* Content with sidebar */}
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          <article>
            {/* Author Box — TOP of article */}
            <div className="flex items-center gap-4 p-5 bg-cloud rounded-xl border border-gray-100 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-accent to-navy rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                HN
              </div>
              <div>
                <p className="font-heading font-bold text-navy text-sm">Hamza Nouman</p>
                <p className="text-[11px] text-muted">REALTOR® · Investment Property Specialist · Cityscape Real Estate Ltd.</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted">Licensed by RECO</span>
                  <span className="text-[10px] text-gold">★★★★★ 5.0</span>
                  <span className="text-[10px] text-muted">· 28 Google Reviews</span>
                </div>
              </div>
            </div>

            <img
              src={blogCoverUrl(post)}
              alt={post.title}
              fetchPriority="high"
              className="w-full rounded-xl mb-8 shadow-md"
            />

            <MarkdownRenderer content={post.content} />

            {/* End-of-post booking CTA */}
            <div className="mt-12 bg-gradient-to-br from-navy to-accent/20 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-navy rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 border-2 border-white/20">
                HN
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-2">
                Need help with this topic?
              </h3>
              <p className="text-white/60 text-sm mb-5 max-w-md mx-auto">
                Book a free 15-minute investor call with Hamza. No obligation — we&apos;ll walk through your numbers together.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/book-call"
                  className="btn-primary !px-6 no-underline text-center"
                >
                  📅 Book Free Call
                </Link>
                <a
                  href="tel:+16476091289"
                  className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 no-underline text-center"
                >
                  📞 647-609-1289
                </a>
              </div>
              <p className="text-white/60 text-[10px] mt-3">★★★★★ 5.0 on Google · 28 Reviews</p>
            </div>

            {/* Related Posts */}
            {related.length > 0 && (
              <div className="mt-12">
                <h3 className="font-heading text-lg font-bold text-navy mb-4">Related Guides</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/blog/${r.slug}`}
                      className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition no-underline group"
                    >
                      <img src={blogCoverUrl(r)} alt="" loading="lazy" className="w-full h-28 object-cover" />
                      <div className="p-3">
                        <span className="text-[10px] font-bold text-accent uppercase">{r.category}</span>
                        <p className="text-sm font-semibold text-navy leading-snug mt-1 group-hover:text-accent transition-colors">
                          {r.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <SkylineStrip className="mt-12 h-10 w-full" tone="#1B2A4A" opacity={0.1} />
            <InlineCTA variant="newsletter" className="mt-6" />
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Quiz CTA */}
              <div className="bg-navy rounded-xl p-5">
                <p className="font-heading font-bold text-white text-sm mb-1">Find deals matched to you</p>
                <p className="text-white/50 text-xs mb-3">Answer 5 questions, get curated listings with cash flow pre-calculated.</p>
                <Link href="/quiz" className="block text-center btn-primary !text-sm no-underline">
                  Find My Deal →
                </Link>
              </div>

              {/* Phone + Book */}
              <div className="rounded-xl border border-gray-200 p-5 bg-white">
                <p className="font-heading font-bold text-navy text-sm mb-3">Talk to Hamza</p>
                <a href="tel:+16476091289" className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-navy no-underline hover:border-navy/30 transition mb-2">
                  📞 647-609-1289
                </a>
                <Link href="/book-call" className="flex items-center justify-center gap-2 bg-emerald-500 text-white rounded-lg py-2.5 text-sm font-semibold no-underline hover:bg-emerald-600 transition">
                  📅 Book Free Call
                </Link>
              </div>

              {/* First Month Offer */}
              <div className="rounded-xl bg-accent/5 border border-accent/20 p-4">
                <span className="text-[10px] font-bold text-emerald-500">EXCLUSIVE OFFER</span>
                <p className="text-sm font-semibold text-navy mt-1 leading-snug">
                  Close with Hamza — First Month&apos;s Mortgage On Us
                </p>
                <Link href="/book-call" className="text-xs text-accent font-semibold no-underline mt-2 inline-block">
                  Learn more →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
