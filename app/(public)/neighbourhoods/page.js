'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HOOD_DATA, HOOD_OUTLOOK_AS_OF } from '@/lib/constants';
import { fmtK } from '@/lib/utils/format';
import InlineCTA from '@/components/ui/inline-cta';
import { PageHero } from '@/components/layout/page-hero';
import { NeighbourhoodScene } from '@/components/art/neighbourhood-scene';
import { neighbourhoodPhoto } from '@/lib/neighbourhood-images';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';
import { AuthGate } from '@/components/ui/auth-gate';

const FILTERS = ['All', 'Hot', 'Warm', 'Cool'];
const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-');
const BASE = 'https://www.mississaugainvestor.ca';

// ItemList of every ranked neighbourhood so search engines read /neighbourhoods
// as the collection page it is (each entry points to its own guide). Built from
// the static HOOD_DATA — the same 24 that render — so the markup always matches
// the page (extras are CSS-hidden, never unmounted). Mirrors /guides and /blog.
const neighbourhoodListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Best Neighbourhoods to Invest in Mississauga',
  itemListElement: Object.keys(HOOD_DATA).map((name, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    url: `${BASE}/neighbourhoods/${slugify(name)}`,
  })),
};
// Targets the high-intent query "best neighbourhoods to invest in mississauga"
// (real GSC impressions, striking-distance position). Answers stay in sync with
// the ranked HOOD_DATA shown on the page.
const NEIGHBOURHOODS_FAQ = [
  {
    question: 'What are the best neighbourhoods to invest in Mississauga?',
    answer:
      'For rental cash flow, the highest-yielding Mississauga neighbourhoods are Clarkson, Malton, and Cooksville (around 5% gross rent yield), followed by Erin Mills and Dixie. Clarkson and Cooksville pair strong yields with an upward price trend, making them balanced picks for cash flow plus appreciation, while City Centre and Port Credit trade lower yields for stronger long-term appreciation. Every Mississauga neighbourhood on this page is ranked by rent yield, price trend, and days on market so you can match an area to your investment strategy.',
  },
  {
    question: 'Which Mississauga neighbourhood has the best rental cash flow?',
    answer:
      'Clarkson and Malton currently lead Mississauga on gross rent yield (about 5.1%), meaning rent covers more of the carrying costs relative to the purchase price. Cooksville is close behind with a warmer price trend. Lower-priced areas generally yield more, while premium waterfront areas like Port Credit yield less but appreciate faster.',
  },
  {
    question: 'Is Mississauga a good place to invest in real estate in 2026?',
    answer:
      'Mississauga combines GTA-level rental demand with lower entry prices than downtown Toronto, strong tenant demand from students and commuters, and major transit investment such as the Hazel McCallion (Hurontario) LRT. Several neighbourhoods still offer positive or near-neutral cash flow at current rates. Use the deal scores and cash-flow analysis on this site to evaluate specific properties.',
  },
];

// Cards shown before the "show all" reveal (3 full rows on the lg 3-col grid).
const INITIAL_COUNT = 9;

export default function NeighbourhoodsPage() {
  const [filter, setFilter] = useState('All');
  const [showAll, setShowAll] = useState(false);
  const [recentSales, setRecentSales] = useState([]);
  const [hoodStats, setHoodStats] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const registered = typeof window !== 'undefined' && localStorage.getItem('user_registered') === 'true';
    setIsAuthenticated(registered);
  }, []);

  useEffect(() => {
    // Live per-neighbourhood avg price / DOM / yield from ACTIVE listings —
    // not sold data, so no gate applies.
    fetch('/api/neighbourhood-stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.stats) setHoodStats(data.stats);
      })
      .catch(() => {});
  }, []);

  // Individual sold prices + addresses are VOW-restricted TRREB data — skip
  // the fetch entirely while gated (matches /recent-sales and listing-detail).
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/sold-comps?limit=8')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.comps) setRecentSales(data.comps);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Merge curated HOOD_DATA with live aggregates: price/DOM/yield go live when
  // we have a sample, trend + YoY stay curated (Hamza's outlook).
  const merged = Object.entries(HOOD_DATA).map(([name, data]) => {
    const live = hoodStats[name];
    return {
      name,
      data,
      avgPrice: live?.avgPrice ?? data.avgPrice,
      avgDOM: live?.avgDOM ?? data.avgDOM,
      rentYield: live?.rentYield ?? data.rentYield,
      isLive: !!live,
    };
  });
  // Top 3 by gross rent yield — powers the "best neighbourhoods" answer block
  const topByYield = [...merged].sort((a, b) => (b.rentYield || 0) - (a.rentYield || 0)).slice(0, 3);
  const filtered = filter === 'All' ? merged : merged.filter((h) => h.data.trend === filter.toLowerCase());
  const hoodCount = merged.length;
  const trendCount = (t) => merged.filter((h) => h.data.trend === t).length;

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(neighbourhoodListSchema) }} />
    {/* City-wide questions belong to the DIRECTORY page only. They used to
        live in the layout, which also wraps [slug], so all 24 hood pages
        published the same three answers and competed with this page. */}
    <FAQJsonLd items={NEIGHBOURHOODS_FAQ} />
    <BreadcrumbJsonLd
      items={[
        { name: 'Home', url: `${BASE}/` },
        { name: 'Neighbourhoods', url: `${BASE}/neighbourhoods` },
      ]}
    />
    <PageHero
      compact
      eyebrow="24 neighbourhoods, ranked"
      title="Best Neighbourhoods to Invest in Mississauga"
      subtitle="Every Mississauga neighbourhood ranked for investors by rent yield, price trend, and days on market — so you can match an area to your strategy."
    />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top picks — directly answers "best neighbourhoods to invest in Mississauga" */}
      <div className="mb-8 rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/5 to-white p-5 md:p-6">
        <h2 className="font-heading text-lg font-bold text-navy">
          Where to invest in Mississauga right now
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-navy/80">
          For rental <strong>cash flow</strong>, the top Mississauga neighbourhoods by gross rent yield are{' '}
          {topByYield.map(({ name }, i) => (
            <span key={name}>
              <Link href={`/neighbourhoods/${slugify(name)}`} className="font-semibold text-accent no-underline hover:underline">{name}</Link>
              {i < topByYield.length - 2 ? ', ' : i === topByYield.length - 2 ? ' and ' : ''}
            </span>
          ))}
          . For <strong>appreciation</strong>, transit-driven areas like City Centre and Port Credit trade lower yields for stronger long-term growth. Full rankings below.
        </p>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-accent text-white shadow-sm'
                : 'bg-cloud text-muted hover:bg-slate-100 hover:text-navy'
            }`}
          >
            {f === 'Hot' && '🔥 '}
            {f === 'Warm' && '📈 '}
            {f === 'Cool' && '🧊 '}
            {f}
            <span className="ml-1.5 text-xs opacity-70">
              ({f === 'All' ? hoodCount : trendCount(f.toLowerCase())})
            </span>
          </button>
        ))}
      </div>

      {/* Cards Grid — all 24 stacked ran 18 screens on mobile. Show the first 9
          and reveal the rest on tap. The extras are CSS-hidden, NOT unmounted,
          so every neighbourhood stays in the HTML for crawlers and the page's
          ItemList schema still matches what's rendered. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(({ name, data, avgPrice, avgDOM, rentYield, isLive }, idx) => {
          const trendColor =
            data.trend === 'hot'
              ? 'bg-red-50 text-red-600 border-red-100'
              : data.trend === 'warm'
              ? 'bg-amber-50 text-amber-700 border-amber-100'
              : 'bg-blue-50 text-blue-600 border-blue-100';

          const photo = neighbourhoodPhoto(name);
          const collapsed = !showAll && idx >= INITIAL_COUNT;
          return (
            <div key={name} className={`card group p-0 overflow-hidden hover:shadow-lg transition-shadow${collapsed ? ' hidden' : ''}`}>
              {/* Image / scene header */}
              <div className="relative h-40 overflow-hidden">
                {photo ? (
                  <Image
                    src={photo}
                    alt={`${name}, Mississauga`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <NeighbourhoodScene name={name} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/15 to-transparent" />
                <span className={`absolute right-3 top-3 text-[10px] font-bold uppercase rounded-full px-2.5 py-1 border ${trendColor} bg-white/85 backdrop-blur-sm`} title="Hamza's outlook">
                  {data.emoji} {data.trend}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                  <h3 className="font-heading text-lg font-bold text-white drop-shadow-sm">{name}</h3>
                  <div className="flex-shrink-0 rounded-xl bg-white/95 px-3 py-1.5 text-center shadow-md">
                    <p className="text-lg font-extrabold leading-none text-accent">{rentYield != null ? `${rentYield}%` : '—'}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Rent Yield{isLive && <span className="ml-0.5 text-emerald-600">·Live</span>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-cloud p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-500">Avg Price</p>
                  <p className="text-sm font-bold text-navy">{fmtK(avgPrice)}</p>
                </div>
                <div className="rounded-lg bg-cloud p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-500">YoY Change*</p>
                  <p className={`text-sm font-bold ${data.priceYoY >= 4 ? 'text-emerald-700' : data.priceYoY >= 2.5 ? 'text-gold-dark' : 'text-muted'}`}>
                    +{data.priceYoY}%
                  </p>
                </div>
                <div className="rounded-lg bg-cloud p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-500">Avg DOM</p>
                  <p className="text-sm font-bold text-navy">{avgDOM != null ? `${avgDOM} days` : '—'}</p>
                </div>
                <div className="rounded-lg bg-cloud p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-500">Inventory*</p>
                  <p className={`text-sm font-bold ${data.inventory === 'Low' ? 'text-red-600' : data.inventory === 'Medium' ? 'text-gold-dark' : 'text-muted'}`}>
                    {data.inventory}
                  </p>
                </div>
              </div>

              {/* Hamza's Note */}
              <div className="mb-4">
                <p className="text-[11px] font-medium text-slate-500 uppercase mb-1">Hamza&apos;s Take</p>
                <p className="text-xs text-navy/70 leading-relaxed italic">
                  &ldquo;{data.note}&rdquo;
                </p>
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/neighbourhoods/${name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="block text-center rounded-lg bg-accent py-2 text-xs font-medium text-white hover:bg-accent/90 transition-colors no-underline"
                >
                  Investment Guide
                </Link>
                <Link
                  href={`/listings?hood=${encodeURIComponent(name)}`} rel="nofollow"
                  className="block text-center rounded-lg bg-cloud py-2 text-xs font-medium text-accent hover:bg-accent/5 transition-colors no-underline"
                >
                  View Listings
                </Link>
              </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showAll && filtered.length > INITIAL_COUNT && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-accent transition-colors hover:border-accent/40 hover:bg-accent/5"
          >
            Show all {filtered.length} neighbourhoods
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      <p className="mt-6 text-[11px] text-muted">
        Avg price, DOM &amp; rent yield update live from active listings. <span className="whitespace-nowrap">*Trend, YoY &amp; inventory</span> reflect Hamza&apos;s expert outlook (last reviewed {HOOD_OUTLOOK_AS_OF}).
      </p>

      {/* Visible FAQ — renders the SAME NEIGHBOURHOODS_FAQ array as the FAQPage
          schema above. Google requires FAQ structured data to be visible on the
          page; the schema was previously declared with none of it on screen,
          which forfeits rich-result eligibility and risks a structured-data
          manual action. Sharing one array means they can never drift. */}
      <section className="mt-12">
        <h2 className="section-title mb-6">Investing in Mississauga: common questions</h2>
        <div className="space-y-3">
          {NEIGHBOURHOODS_FAQ.map((qa, i) => (
            <details
              key={qa.question}
              open={i === 0}
              className="group rounded-xl border border-slate-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                <h3 className="font-heading text-sm font-semibold text-navy">{qa.question}</h3>
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{qa.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Recent Sales Activity — individual sold prices/addresses are
          VOW-restricted TRREB data, gated the same real way as /recent-sales
          and the listing-detail Sold Comps tab. Shown to a not-yet-registered
          visitor as a capture prompt (mirroring every other gate on the site)
          instead of just vanishing; once genuinely unlocked with zero comps
          the section hides again, matching the original behaviour. */}
      {(!isAuthenticated || recentSales.length > 0) && (
        <div className="mt-10 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-semibold text-lg text-navy">Recent Sales Across Mississauga</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <span className="h-1 w-1 rounded-full bg-success animate-pulse" />
                Live
              </span>
            </div>
            <Link
              href="/recent-sales"
              className="text-xs font-medium text-accent hover:text-accent-dark no-underline inline-flex items-center gap-1"
            >
              View all
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <AuthGate
            isAuthenticated={isAuthenticated}
            onUnlock={() => setIsAuthenticated(true)}
            source="Neighbourhoods — Recent Sales"
            title="See exactly what nearby homes sold for"
            valueLine="Real sold prices, addresses and dates across Mississauga — free, no credit card."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-[10px] font-semibold uppercase text-slate-500">Address</th>
                    <th className="text-left py-2 text-[10px] font-semibold uppercase text-slate-500 hidden sm:table-cell">City</th>
                    <th className="text-right py-2 text-[10px] font-semibold uppercase text-slate-500">Sold Price</th>
                    <th className="text-center py-2 text-[10px] font-semibold uppercase text-slate-500">vs List</th>
                    <th className="text-right py-2 text-[10px] font-semibold uppercase text-slate-500 hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((comp) => (
                    <tr key={comp.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5">
                        <p className="text-sm font-medium text-navy truncate max-w-[200px]">{comp.address}</p>
                      </td>
                      <td className="py-2.5 text-muted text-xs hidden sm:table-cell">{comp.city}</td>
                      <td className="py-2.5 text-right font-semibold text-navy">{fmtK(comp.closePrice)}</td>
                      <td className="py-2.5 text-center">
                        <span className={`text-xs font-semibold ${comp.priceDelta < 0 ? 'text-emerald-700' : comp.priceDelta > 0 ? 'text-red-600' : 'text-muted'}`}>
                          {comp.priceDelta > 0 ? '+' : ''}{comp.priceDelta}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-xs text-muted hidden md:table-cell">
                        {comp.closeDate ? new Date(comp.closeDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AuthGate>
        </div>
      )}
      {/* CTA */}
      <InlineCTA variant="alerts" className="mt-12" />
    </div>
    </>
  );
}
