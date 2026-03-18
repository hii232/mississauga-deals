import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import MarkdownRenderer from '@/components/blog/markdown-renderer';
import InlineCTA from '@/components/ui/inline-cta';
import { ArticleJsonLd } from '@/components/seo/json-ld';

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

  return (
    <>
      <ArticleJsonLd post={post} />

      {/* Hero */}
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

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full rounded-xl mb-8 shadow-md"
          />
        )}

        <MarkdownRenderer content={post.content} />

        {/* Author */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-dark rounded-full flex items-center justify-center text-white font-bold text-sm">
              HN
            </div>
            <div>
              <p className="font-heading font-bold text-navy">Hamza Nouman</p>
              <p className="text-xs text-muted">Sales Representative, Royal LePage Signature Realty</p>
            </div>
          </div>
        </div>

        <InlineCTA variant="deals" className="mt-12" />
      </article>
    </>
  );
}
