import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import InlineCTA from '@/components/ui/inline-cta';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// Revalidate every 60 seconds so new posts appear quickly
export const revalidate = 60;

const categoryColorMap = {
  'Neighbourhood Guide': 'bg-accent/10 text-accent border-accent/20',
  'Strategy': 'bg-green-500/10 text-green-600 border-green-500/20',
  'Guide': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Market Analysis': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Platform': 'bg-accent/10 text-accent border-accent/20',
  'Beginner Guide': 'bg-green-500/10 text-green-600 border-green-500/20',
  'General': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export default async function BlogPage() {
  let posts = [];

  if (supabase) {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });
    posts = data || [];
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy to-accent/20 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
            Investment Insights
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto">
            Expert analysis, neighbourhood guides, and strategies for Mississauga real estate investors
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted text-lg mb-2">Articles coming soon</p>
            <p className="text-sm text-muted/60">
              Expert Mississauga real estate investment guides, market analysis, and neighbourhood breakdowns.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {posts.map((post) => {
              const readTime = Math.max(1, Math.ceil((post.content || '').split(/\s+/).length / 200));
              const dateStr = new Date(post.created_at).toLocaleDateString('en-CA', {
                year: 'numeric', month: 'long',
              });
              const colorClass = categoryColorMap[post.category] || categoryColorMap.General;

              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-accent/20 hover:shadow-md transition-all duration-300 no-underline"
                >
                  {post.cover_image_url && (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-44 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${colorClass}`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-muted">{dateStr}</span>
                      <span className="text-xs text-muted">{readTime} min</span>
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
        )}

        <InlineCTA variant="quiz" className="mt-16" />
      </section>
    </>
  );
}
