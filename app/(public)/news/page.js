import Link from 'next/link';
import { fetchAllFeeds, getCategories } from '@/lib/news/fetch-feeds';

export const metadata = {
  title: 'Real Estate News — MississaugaInvestor.ca',
  description:
    'Stay updated with the latest Canadian real estate news, Bank of Canada rate decisions, market reports, and investment insights.',
};

const CATEGORY_COLORS = {
  'Rate Decisions': 'bg-red-50 text-red-700',
  'Market News': 'bg-blue-50 text-blue-700',
  'Local Development': 'bg-green-50 text-green-700',
  'Housing Analysis': 'bg-amber-50 text-amber-700',
  'Mortgage & Rates': 'bg-purple-50 text-purple-700',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function NewsPage({ searchParams }) {
  const params = await searchParams;
  const activeCategory = params?.category || 'All';
  const categories = getCategories();
  const allArticles = await fetchAllFeeds();

  const articles =
    activeCategory === 'All'
      ? allArticles
      : allArticles.filter((a) => a.category === activeCategory);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="section-title mb-2">Real Estate News</h1>
        <p className="section-subtitle">
          Live feed from Canadian real estate sources — updated every 15 minutes
        </p>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/news"
          className={`rounded-full px-4 py-1.5 text-sm font-medium no-underline transition-colors ${
            activeCategory === 'All'
              ? 'bg-navy text-white'
              : 'bg-white text-navy border border-slate-200 hover:border-navy/30'
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/news?category=${encodeURIComponent(cat)}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium no-underline transition-colors ${
              activeCategory === cat
                ? 'bg-navy text-white'
                : 'bg-white text-navy border border-slate-200 hover:border-navy/30'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Articles */}
      {articles.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">📡</div>
          <h2 className="font-heading font-semibold text-lg text-navy mb-2">
            No articles found
          </h2>
          <p className="text-sm text-muted">
            {activeCategory !== 'All'
              ? `No ${activeCategory} articles available right now. Try another category.`
              : 'News feeds are temporarily unavailable. Check back shortly.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article, i) => (
            <a
              key={`${article.link}-${i}`}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block card p-5 hover:shadow-md transition-shadow no-underline group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    CATEGORY_COLORS[article.category] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {article.category}
                </span>
                <span className="text-xs text-muted whitespace-nowrap flex-shrink-0">
                  {timeAgo(article.date)}
                </span>
              </div>

              <h3 className="font-heading font-semibold text-navy group-hover:text-accent transition-colors mb-1.5 leading-snug">
                {article.title}
              </h3>

              {article.snippet && (
                <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-2">
                  {article.snippet}
                </p>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-accent">{article.source}</span>
                <svg
                  className="h-3 w-3 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Source attribution */}
      {articles.length > 0 && (
        <p className="mt-8 text-center text-xs text-slate-400">
          Aggregated from Bank of Canada, BNN Bloomberg, Financial Post, Better Dwelling, Storeys, and Canadian Mortgage Trends
        </p>
      )}
    </div>
  );
}
