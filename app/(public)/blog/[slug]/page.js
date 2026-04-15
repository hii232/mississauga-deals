import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import MarkdownRenderer from '@/components/blog/markdown-renderer';
import InlineCTA from '@/components/ui/inline-cta';
import { ArticleJsonLd } from '@/components/seo/json-ld';

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
    title: `${post.title} | MississaugaInvestor.ca`,
    description: post.excerpt || `Read ${post.title} on MississaugaInvestor.ca`,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://www.mississaugainvestor.ca/blog/${post.slug}`,
      type: 'article',
      ...(post.cover_image_url && { images: [{ url: post.cover_image_url }] }),
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

function splitForMidCta(content) {
  if (!content || content.length < 800) return [content, ''];
  const blocks = content.split(/\n\n+/);
  if (blocks.length < 5) return [content, ''];
  let target = Math.max(2, Math.floor(blocks.length / 3));
  while (target < blocks.length - 1 && /^#{1,6}\s/.test(blocks[target])) target++;
  const before = blocks.slice(0, target).join('\n\n');
  const after = blocks.slice(target).join('\n\n');
  return [before, after];
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

  const { data: related } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, category, cover_image_url, created_at')
    .eq('published', true)
    .eq('category', post.category)
    .neq('slug', post.slug)
    .order('created_at', { ascending: false })
    .limit(3);

  const readTime = Math.max(1, Math.ceil((post.content || '').split(/\s+/).length / 200));
  const dateStr = new Date(post.created_at).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const [contentBefore, contentAfter] = splitForMidCta(post.content);

  return (
    <>
      <ArticleJsonLd post={post} />

      <section className="bg-gradient-to-br from-navy via-navy to-accent/20 py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${categoryColorMap[post.category] || categoryColorMap.General}`}>
              {post.category}
            </span>
            <span className="text-xs text-white/40">{dateStr}</span>
            <span className="text-xs text-white/40">{readTime} min read</span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-white/50 text-sm md:text-base mt-4 max-w-2xl mx-auto">
              {post.excerpt}
            </p>
          )}
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full rounded-xl mb-8 shadow-md"
          />
        )}

        <div className="flex items-center gap-4 pb-6 mb-8 border-b border-gray-100">
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-dark rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            HN
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-navy text-sm">
              Hamza Nouman · <span className="text-muted font-medium">REALTOR®, Cityscape Real Estate Ltd.</span>
            </p>
            <p className="text-xs text-muted mt-0.5">
              Mississauga investment specialist · Licensed by RECO
            </p>
          </div>
          <a
            href="tel:+16476091289"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-navy text-white px-3 py-1.5 text-xs font-semibold no-underline hover:bg-navy/90 transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            Call Hamza
          </a>
        </div>

        <MarkdownRenderer content={contentBefore} />

        {contentAfter && (
          <>
            <InlineCTA variant="quiz" className="my-10" />
            <MarkdownRenderer content={contentAfter} />
          </>
        )}

        <InlineCTA variant="newsletter" className="mt-12" />
        <InlineCTA variant="deals" className="mt-6" />

        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent-dark rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              HN
            </div>
            <div>
              <p className="font-heading font-bold text-navy">Hamza Nouman</p>
              <p className="text-xs text-muted mb-2">REALTOR® · Cityscape Real Estate Ltd. · Mississauga, ON</p>
              <p className="text-sm text-muted leading-relaxed">
                Helping investors find cash-flowing properties across Mississauga, Oakville, Milton, and Burlington. Every deal analyzed with real numbers — cash flow, cap rate, and CoC return.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Link
                  href="/book-call"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-white px-3 py-1.5 text-xs font-semibold no-underline"
                >
                  Book a Free Call
                </Link>
                <a
                  href="tel:+16476091289"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy text-white px-3 py-1.5 text-xs font-semibold no-underline"
                >
                  647-609-1289
                </a>
              </div>
            </div>
          </div>
        </div>

        {related && related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-gray-100">
            <h2 className="font-heading text-xl font-bold text-navy mb-6">
              Related reads
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group block rounded-xl border border-gray-100 overflow-hidden hover:border-accent/40 hover:shadow-md transition-all no-underline"
                >
                  {r.cover_image_url ? (
                    <div className="aspect-video bg-cloud overflow-hidden">
                      <img src={r.cover_image_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-navy/80 to-accent/30" />
                  )}
                  <div className="p-4">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${categoryColorMap[r.category] || categoryColorMap.General} mb-2`}>
                      {r.category}
                    </span>
                    <h3 className="font-heading font-bold text-navy text-sm leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                      {r.title}
                    </h3>
                    {r.excerpt && (
                      <p className="text-xs text-muted mt-1.5 line-clamp-2">
                        {r.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
