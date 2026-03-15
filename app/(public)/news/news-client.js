'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

/* ── helpers ─────────────────────────────────────────────── */

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

const SOURCE_COLORS = {
  'BOC': 'bg-red-500',
  'BNN': 'bg-blue-600',
  'Financial Post': 'bg-amber-600',
  'Better Dwelling': 'bg-emerald-600',
  'CMT': 'bg-purple-600',
  'STOREYS': 'bg-sky-600',
  'REM': 'bg-orange-500',
  'CBC Business': 'bg-red-600',
};

const TOPIC_COLORS = {
  'Mississauga': 'bg-accent text-white',
  'Market Stats': 'bg-navy/80 text-white',
  'Interest Rates': 'bg-red-500/90 text-white',
  'Investment': 'bg-success/90 text-white',
  'Policy & Govt': 'bg-purple-600/90 text-white',
};

/* ── market ticker data ──────────────────────────────────── */

const MARKET_STATS = [
  { label: 'BoC Rate', value: '2.75%', delta: '-0.25', negative: true },
  { label: '5yr Fixed', value: '4.89%', delta: '+0.05', negative: false },
  { label: 'TRREB Sales/List', value: '0.41', delta: '-0.04', negative: true },
  { label: 'Avg Detached Mssa', value: '$1.82M', delta: '+4.2% YoY', negative: false },
  { label: 'Active GTA Listings', value: '24,817', delta: '+18% MoM', negative: false },
  { label: 'Avg DOM Mssa', value: '28d', delta: '+6 YoY', negative: false },
  { label: 'Hurontario LRT', value: '2025', delta: 'Opening Soon', isSpecial: true },
  { label: 'USD/CAD', value: '1.441', delta: '-0.003', negative: true },
];

/* ── breaking news marquee ──────────────────────────────── */

function BreakingMarquee({ articles }) {
  const breaking = articles.slice(0, 5);
  const marqueeRef = useRef(null);

  if (breaking.length === 0) return null;

  const items = breaking.map((a) => `${a.source} · ${a.title}`);
  const text = items.join('  ◆  ');

  return (
    <div className="relative overflow-hidden rounded-lg bg-cloud border border-slate-200 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-accent px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white z-10">
          Breaking
        </div>
        <div className="overflow-hidden flex-1 py-2.5 px-4">
          <div
            ref={marqueeRef}
            className="whitespace-nowrap animate-marquee text-sm text-navy"
          >
            <span>{text}</span>
            <span className="ml-16">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── article card ────────────────────────────────────────── */

function ArticleCard({ article, featured = false }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = article.image && !imgError;
  const topicColor = TOPIC_COLORS[article.topic] || 'bg-slate-500/80 text-white';
  const sourceColor = SOURCE_COLORS[article.source] || 'bg-slate-600';

  if (featured) {
    return (
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group block card overflow-hidden no-underline"
      >
        {/* Image */}
        <div className="relative h-56 sm:h-64 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {hasImage ? (
            <img
              src={article.image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          )}
          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`${sourceColor} rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm`}>
              {article.source}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className={`${topicColor} rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm`}>
              {article.topic}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-heading text-base font-bold text-navy leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
            {article.title}
          </h3>
          {article.snippet && (
            <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-3">
              {article.snippet}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{timeAgo(article.date)}</span>
            <span className="text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Read
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </div>
        </div>
      </a>
    );
  }

  // Compact card (list style)
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all no-underline"
    >
      {/* Thumbnail */}
      {hasImage && (
        <div className="flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden bg-slate-100">
          <img
            src={article.image}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      )}
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`${sourceColor} rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-white`}>
            {article.source}
          </span>
          <span className="text-[11px] text-muted">{timeAgo(article.date)}</span>
        </div>
        <h4 className="text-sm font-semibold text-navy leading-snug group-hover:text-accent transition-colors line-clamp-2 mb-1">
          {article.title}
        </h4>
        {article.snippet && (
          <p className="text-xs text-muted line-clamp-1">{article.snippet}</p>
        )}
      </div>
    </a>
  );
}

/* ── main client component ───────────────────────────────── */

export function NewsClient({ articles, sources, topics }) {
  const [activeSource, setActiveSource] = useState('All Sources');
  const [activeTopic, setActiveTopic] = useState('All News');
  const [refreshKey, setRefreshKey] = useState(0);

  const filtered = useMemo(() => {
    let result = articles;
    if (activeSource !== 'All Sources') {
      result = result.filter((a) => a.source === activeSource);
    }
    if (activeTopic !== 'All News') {
      result = result.filter((a) => a.topic === activeTopic);
    }
    return result;
  }, [articles, activeSource, activeTopic]);

  const featuredArticles = filtered.slice(0, 3);
  const remainingArticles = filtered.slice(3);

  return (
    <div className="min-h-screen bg-cloud">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy mb-1">
              Real Estate Intelligence
            </h1>
            <p className="text-sm text-muted flex items-center gap-2">
              Live market news · Updated {timeAgo(articles[0]?.date)}
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                </span>
                Live Feed
              </span>
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-navy shadow-sm hover:border-accent hover:text-accent transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Market Ticker ──────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm mb-6 overflow-hidden">
          <div className="flex items-center overflow-x-auto scrollbar-thin">
            <div className="flex-shrink-0 bg-accent px-4 py-3 self-stretch flex items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">Market</span>
            </div>
            <div className="flex items-center gap-6 px-5 py-3 min-w-0">
              {MARKET_STATS.map((stat, i) => (
                <div key={i} className="flex-shrink-0 text-center">
                  <p className="text-[10px] font-medium text-muted uppercase tracking-wide">{stat.label}</p>
                  <div className="flex items-baseline gap-1.5 justify-center">
                    <span className="text-sm font-bold font-mono text-navy">{stat.value}</span>
                    {stat.isSpecial ? (
                      <span className="text-[10px] font-semibold text-success">{stat.delta}</span>
                    ) : (
                      <span className={`text-[10px] font-semibold ${stat.negative ? 'text-red-500' : 'text-success'}`}>
                        {stat.delta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Breaking Marquee ───────────────────────────── */}
        <BreakingMarquee articles={articles} />

        {/* ── Filters ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          {/* Source filters */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveSource('All Sources')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeSource === 'All Sources'
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-white text-navy border border-slate-200 hover:border-navy/30'
              }`}
            >
              All Sources
            </button>
            {sources.map((src) => (
              <button
                key={src}
                onClick={() => setActiveSource(activeSource === src ? 'All Sources' : src)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeSource === src
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-white text-navy border border-slate-200 hover:border-navy/30'
                }`}
              >
                {src}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {/* Topic filters */}
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setActiveTopic(activeTopic === topic ? 'All News' : topic)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeTopic === topic
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-white text-navy border border-slate-200 hover:border-accent/30'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* ── Articles ───────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="card p-12 text-center bg-white">
            <div className="text-4xl mb-3">📡</div>
            <h2 className="font-heading font-semibold text-lg text-navy mb-2">
              No articles found
            </h2>
            <p className="text-sm text-muted">
              Try a different source or topic filter.
            </p>
          </div>
        ) : (
          <>
            {/* Featured grid — top 3 articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {featuredArticles.map((article, i) => (
                <div
                  key={`${article.link}-${i}`}
                  className="animate-fadeUp"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <ArticleCard article={article} featured />
                </div>
              ))}
            </div>

            {/* Remaining articles — compact list */}
            {remainingArticles.length > 0 && (
              <div className="space-y-3">
                {remainingArticles.map((article, i) => (
                  <div
                    key={`${article.link}-${i}`}
                    className="animate-fadeUp"
                    style={{ animationDelay: `${(i + 3) * 40}ms` }}
                  >
                    <ArticleCard article={article} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Source Attribution ──────────────────────────── */}
        {filtered.length > 0 && (
          <p className="mt-10 text-center text-xs text-slate-400">
            Aggregated from Bank of Canada, BNN Bloomberg, Financial Post, Better Dwelling, Storeys, Canadian Mortgage Trends, REM & CBC Business
          </p>
        )}
      </div>
    </div>
  );
}
