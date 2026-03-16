import Link from 'next/link';
import InlineCTA from '@/components/ui/inline-cta';

const ARTICLES = [
  {
    slug: 'top-neighbourhoods-2026',
    title: 'Top 5 Mississauga Neighbourhoods for Investment in 2026',
    excerpt:
      'From Port Credit waterfront to the emerging Lakeview Village, discover which Mississauga neighbourhoods offer the best returns for real estate investors this year.',
    category: 'Neighbourhood Guide',
    date: 'March 2026',
    readTime: '6 min',
    color: 'accent',
  },
  {
    slug: 'cash-flow-positive',
    title: 'How to Find Cash-Flow Positive Properties in the GTA',
    excerpt:
      'With rising interest rates, finding properties that generate positive cash flow is harder than ever. Here are the strategies smart investors use to make the numbers work.',
    category: 'Strategy',
    date: 'March 2026',
    readTime: '8 min',
    color: 'green',
  },
  {
    slug: 'brrr-mississauga',
    title: 'The BRRR Strategy: Does It Still Work in Mississauga?',
    excerpt:
      'Buy, Renovate, Rent, Refinance — the BRRR method has made millionaires. But does it still pencil out in today\'s Mississauga market? We break down the numbers.',
    category: 'Strategy',
    date: 'February 2026',
    readTime: '7 min',
    color: 'purple',
  },
  {
    slug: 'pre-construction-guide',
    title: 'Pre-Construction Investing 101: A Mississauga Buyer\'s Guide',
    excerpt:
      'Pre-construction condos can be lucrative but risky. Learn about deposit structures, assignment sales, closing costs, and which Mississauga projects are worth watching.',
    category: 'Guide',
    date: 'February 2026',
    readTime: '10 min',
    color: 'amber',
  },
  {
    slug: 'deal-score-explained',
    title: 'How Our Deal Score Algorithm Works',
    excerpt:
      'A deep dive into the math behind our 1-10 Deal Score. Understand what makes a property score high, what the limitations are, and how to use scores in your investment research.',
    category: 'Platform',
    date: 'January 2026',
    readTime: '5 min',
    color: 'accent',
  },
  {
    slug: 'first-investment-property',
    title: 'Buying Your First Investment Property in Mississauga',
    excerpt:
      'A step-by-step guide for first-time investors: financing, property selection, tenant screening, and the hidden costs nobody tells you about.',
    category: 'Beginner Guide',
    date: 'January 2026',
    readTime: '12 min',
    color: 'green',
  },
];

const colorMap = {
  accent: 'bg-accent/10 text-accent border-accent/20',
  green: 'bg-green-500/10 text-green-600 border-green-500/20',
  purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

export default function BlogPage() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ARTICLES.map((article) => (
            <article
              key={article.slug}
              className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-accent/20 hover:shadow-md transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${colorMap[article.color]}`}
                  >
                    {article.category}
                  </span>
                  <span className="text-xs text-muted">{article.date}</span>
                  <span className="text-xs text-muted">· {article.readTime}</span>
                </div>

                <h2 className="font-heading text-lg font-bold text-navy mb-2 group-hover:text-accent transition-colors leading-snug">
                  {article.title}
                </h2>

                <p className="text-sm text-muted leading-relaxed mb-4">
                  {article.excerpt}
                </p>

                <span className="text-xs font-semibold text-accent group-hover:underline">
                  Coming soon →
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <InlineCTA variant="quiz" className="mt-16" />
      </section>
    </>
  );
}
