'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HOOD_DATA } from '@/lib/constants';
import { fmtK } from '@/lib/utils/format';
import { PageHero } from '@/components/layout/page-hero';
import InlineCTA from '@/components/ui/inline-cta';
import { StickyMobileCTA } from '@/components/layout/sticky-mobile-cta';
import { AuthGate } from '@/components/ui/auth-gate';

export default function MarketPulsePage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState([]);
  const [salesStats, setSalesStats] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const registered = typeof window !== 'undefined' && localStorage.getItem('user_registered') === 'true';
    setIsAuthenticated(registered);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        // Hard 10s budget. A cold /api/market-stats recompute can take 60-90s
        // when the feed upstream is slow — and this page's loading gate held
        // the ENTIRE page (metrics, CTAs, capture forms) on a skeleton until
        // the fetch resolved, which reads as "the website isn't loading"
        // (reported live by Hamza, 2026-07-27). Every stat below has a
        // fallback for stats == null, so rendering without the live payload
        // is strictly better than rendering nothing; the API's own CDN cache
        // makes the next visit fast anyway.
        const res = await fetch('/api/market-stats', { signal: AbortSignal.timeout(10000) });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to load market stats:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Individual sold prices + addresses are VOW-restricted TRREB data — skip
  // the fetch entirely while gated (matches /recent-sales and listing-detail).
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/sold-comps?limit=5')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.comps) setRecentSales(data.comps);
        if (data?.stats) setSalesStats(data.stats);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Derive stats from HOOD_DATA as fallback
  const hoodEntries = Object.entries(HOOD_DATA);
  const hotHoods = hoodEntries.filter(([, d]) => d.trend === 'hot');
  const warmHoods = hoodEntries.filter(([, d]) => d.trend === 'warm');
  const coolHoods = hoodEntries.filter(([, d]) => d.trend === 'cool');

  // Price by type estimates
  const avgDetached = Math.round(hoodEntries.reduce((s, [, d]) => s + d.avgPrice, 0) / hoodEntries.length);
  const apiPrices = stats?.avgPrices;
  const avgPrices = {
    detached: apiPrices?.detached?.avg || apiPrices?.detached || avgDetached,
    semi: apiPrices?.semiDetached?.avg || apiPrices?.semi || Math.round(avgDetached * 0.78),
    townhouse: apiPrices?.townhouse?.avg || apiPrices?.townhouse || Math.round(avgDetached * 0.65),
    condo: apiPrices?.condo?.avg || apiPrices?.condo || Math.round(avgDetached * 0.48),
  };

  // Fallbacks (used only if /api/market-stats is unreachable) mirror TRREB June
  // 2026 (MW2606) — keep in sync with app/api/market-stats/route.js when a new
  // Market Watch lands, or these go quietly stale the way the Feb ones did.
  const marketMetrics = {
    avgDOM: stats?.mississaugaAvgLDOM || stats?.avgDOM || Math.round(hoodEntries.reduce((s, [, d]) => s + d.avgDOM, 0) / hoodEntries.length),
    salesToList: stats?.mississaugaAvgSPLP || (stats?.salesToListRatio ? (stats.salesToListRatio * 100).toFixed(1) : 97),
    monthsOfInventory: stats?.mississaugaMonthsOfInventory || 4.9,
    activeCount: stats?.activeCount || 0,
    snlr: stats?.mississaugaSNLR || 35.1,
    mississaugaSales: stats?.mississaugaSales || 567,
    mississaugaNewListings: stats?.mississaugaNewListings || 1632,
  };

  const priceTypes = [
    { label: 'Detached', value: avgPrices.detached, color: '#1B2A4A' },
    { label: 'Semi-Detached', value: avgPrices.semi, color: '#2563EB' },
    { label: 'Townhouse', value: avgPrices.townhouse, color: '#10B981' },
    { label: 'Condo', value: avgPrices.condo, color: '#F59E0B' },
  ];

  const maxPrice = Math.max(...priceTypes.map((p) => p.value));

  // Mortgage rates — live from the API; fallbacks mirror TRREB June 2026 (MW2606).
  // The fixed rates are Bank of Canada POSTED rates, which run well above the
  // discounted rate a borrower is actually quoted. They were previously listed
  // bare next to a variable contract rate, which read as though a 5-year fixed
  // genuinely costs 1.6 points more than variable. Labelled explicitly now.
  const ratesData = stats?.rates;
  const rates = [
    { term: '1-Year Fixed', rate: ratesData?.fixed1yr ? `${ratesData.fixed1yr}%` : '5.49%', posted: true },
    { term: '3-Year Fixed', rate: ratesData?.fixed3yr ? `${ratesData.fixed3yr}%` : '6.05%', posted: true },
    { term: '5-Year Fixed', rate: ratesData?.fixed5yr ? `${ratesData.fixed5yr}%` : '6.09%', posted: true },
    { term: 'Variable', rate: ratesData?.variable ? `${ratesData.variable}%` : '4.45%' },
    { term: 'BoC Rate', rate: stats?.economic?.bocRate ? `${stats.economic.bocRate}%` : '2.3%' },
  ];

  // Data provenance: the sale-to-list, inventory, sales-volume and YoY figures come
  // from TRREB's MONTHLY Market Watch snapshot — not a live feed. Show an honest
  // "as of {month}" so a monthly report is never mistaken for today's number.
  const trrebMonth = stats?.tRREBMonth || null;
  let monthsStale = null;
  if (stats?.tRREBAsOf) {
    const asOf = new Date(stats.tRREBAsOf);
    if (!isNaN(asOf)) {
      monthsStale = Math.max(
        0,
        Math.round((Date.now() - asOf.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
      );
    }
  }

  if (loading) {
    // Render the hero (and its h1) in the loading state too, so the h1 is in
    // the server HTML crawlers see — not only after the client fetch resolves.
    return (
      <>
        <PageHero
          compact
          eyebrow="Live market data"
          title="Market Pulse"
          subtitle="Mississauga market snapshot — live MLS data blended with TRREB Market Watch"
        />
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-slate-100 rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <PageHero
      compact
      eyebrow="Live market data"
      title="Market Pulse"
      subtitle={`Mississauga market snapshot — live MLS data blended with TRREB Market Watch${stats?.tRREBMonth ? ` (${stats.tRREBMonth})` : ''}`}
    />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Key Metrics — active-listings tile hidden when the API has no real
          count: showing "0 on market" reads as broken data */}
      <div className={`grid grid-cols-2 ${marketMetrics.activeCount > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 mb-10`}>
        <div className="card p-5 text-center">
          <p className="text-[10px] font-medium uppercase text-slate-500 mb-1">Avg DOM</p>
          <p className="font-heading font-bold text-2xl text-navy">{marketMetrics.avgDOM}</p>
          <p className="text-xs text-muted">days on market</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-[10px] font-medium uppercase text-slate-500 mb-1">Sale-to-List</p>
          <p className="font-heading font-bold text-2xl text-navy">{marketMetrics.salesToList}%</p>
          <p className="text-xs text-muted">average ratio</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-[10px] font-medium uppercase text-slate-500 mb-1">Inventory</p>
          <p className="font-heading font-bold text-2xl text-navy">{marketMetrics.monthsOfInventory}</p>
          <p className="text-xs text-muted">months supply</p>
        </div>
        {marketMetrics.activeCount > 0 && (
          <div className="card p-5 text-center">
            <p className="text-[10px] font-medium uppercase text-slate-500 mb-1">Active Listings</p>
            <p className="font-heading font-bold text-2xl text-navy">{marketMetrics.activeCount.toLocaleString()}</p>
            <p className="text-xs text-muted">on market</p>
          </div>
        )}
      </div>

      {/* Data provenance — investors trust numbers only when they know the source
          and vintage. Live active-market stats update continuously; sold prices,
          sales volume, inventory and YoY are TRREB's monthly snapshot (as-of month
          shown so a monthly report is never read as today's figure). */}
      {trrebMonth && (
        <div className="mb-10 rounded-xl border border-slate-200 bg-cloud px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
            Live MLS active-market data
          </span>
          <p className="text-xs text-muted leading-relaxed">
            Days-on-market and active listings update continuously from MLS. Sale-to-list ratio,
            months of inventory, sold prices, sales volume and year-over-year changes are from
            TRREB Market Watch — <span className="font-semibold text-navy">as of {trrebMonth}</span>
            {monthsStale != null && monthsStale >= 2 && (
              <span> (latest published report; TRREB releases city figures monthly)</span>
            )}.
          </p>
        </div>
      )}

      {/* Motivated Seller Radar — the stale-inventory numbers the API already
          computes (dom >= 60, whole feed) finally get a surface. This is the
          page's most actionable insight for a buyer: where sellers have been
          waiting longest and have already cut. Display-only — every figure
          comes from /api/market-stats verbatim, and the section hides itself
          entirely when the radar fields are absent or zero (older cached API
          responses, feed outage) rather than inventing a number. */}
      {stats?.staleCount > 0 && stats?.activeCount > 0 && (
        <div className="card p-6 mb-10 border-l-4 !border-l-gold">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
            <h2 className="font-heading font-semibold text-lg text-navy inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gold shrink-0" aria-hidden="true" />
              Motivated Seller Radar
            </h2>
            <span className="text-[11px] text-slate-500">Live MLS — updates daily</span>
          </div>
          <p className="text-xs text-muted mb-5 leading-relaxed">
            A seller two months in who has already moved on price is far more likely to move
            again. These listings are where offers carry the most leverage right now.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg bg-cloud p-3 text-center">
              <p className="font-heading font-bold text-2xl text-navy">{stats.staleCount.toLocaleString()}</p>
              <p className="text-[11px] text-slate-600 leading-tight mt-0.5">sitting 60+ days</p>
            </div>
            <div className="rounded-lg bg-cloud p-3 text-center">
              <p className="font-heading font-bold text-2xl text-navy">{(stats.staleWithPriceCut ?? 0).toLocaleString()}</p>
              <p className="text-[11px] text-slate-600 leading-tight mt-0.5">already cut asking</p>
            </div>
            <div className="rounded-lg bg-cloud p-3 text-center">
              <p className="font-heading font-bold text-2xl text-navy">{stats.stalePct ?? Math.round((stats.staleCount / stats.activeCount) * 100)}%</p>
              <p className="text-[11px] text-slate-600 leading-tight mt-0.5">of active listings</p>
            </div>
          </div>

          {stats.staleByNeighbourhood && Object.keys(stats.staleByNeighbourhood).length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold uppercase text-slate-500 mb-2">
                Where they&apos;re sitting
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.staleByNeighbourhood).slice(0, 5).map(([hood, count]) => (
                  <Link
                    key={hood}
                    href={`/listings?hood=${encodeURIComponent(hood)}&sort=dom`} rel="nofollow"
                    className="text-[11px] text-navy hover:text-accent bg-cloud rounded-full px-2.5 py-1 no-underline font-medium"
                  >
                    {hood} <span className="text-slate-500 font-normal">· {count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Link href="/listings?sort=dom" className="btn-primary !px-6 !py-2.5 text-center no-underline">
              See Longest-Sitting Listings
            </Link>
            <p className="text-[11px] text-slate-500 leading-snug">
              &ldquo;60+ days&rdquo; is measured from each listing&apos;s own MLS listing date;
              a cut means the ask is below original list.
            </p>
          </div>
        </div>
      )}

      {/* Avg Prices by Type - Bar Chart */}
      <div className="card p-6 mb-10">
        <h2 className="font-heading font-semibold text-lg text-navy mb-1">
          Average Prices by Property Type
        </h2>
        <p className="text-xs text-muted mb-6">
          Live list prices where available, otherwise TRREB sold averages{trrebMonth ? ` (${trrebMonth})` : ''}.
        </p>
        <div className="flex items-end gap-6 h-56 justify-center">
          {priceTypes.map((pt) => {
            const heightPct = (pt.value / maxPrice) * 100;
            return (
              <div key={pt.label} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                <span className="text-xs font-semibold text-navy">{fmtK(pt.value)}</span>
                <div className="w-full relative" style={{ height: '180px' }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t-lg transition-all duration-700"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: pt.color,
                      minHeight: '20px',
                    }}
                  />
                </div>
                <span className="text-[11px] text-muted text-center">{pt.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline lead capture — market-pulse is a high-intent research page but
          only offered a link CTA at the very bottom; give engaged readers a
          one-tap way to convert mid-scroll without leaving the page. */}
      <InlineCTA variant="newsletter" className="mb-10" />

      {/* Recent Sales Activity — individual sold prices/addresses are
          VOW-restricted TRREB data, gated the same real way as /recent-sales
          and the listing-detail Sold Comps tab. Shown to a not-yet-registered
          visitor as a capture prompt instead of vanishing; once genuinely
          unlocked with zero comps the section hides again. */}
      {(!isAuthenticated || recentSales.length > 0) && (
        <div className="card p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg text-navy">
              Recent Sales Activity
            </h2>
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
            source="Market Pulse — Recent Sales"
            title="See exactly what nearby homes sold for"
            valueLine="Real sold prices, addresses and dates across Mississauga — free, no credit card."
          >
            {/* Mini stats row */}
            {salesStats && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-cloud p-2.5 text-center">
                  <p className="text-[10px] font-medium uppercase text-slate-500">Avg Sold</p>
                  <p className="text-sm font-bold text-navy">{fmtK(salesStats.avgSoldPrice)}</p>
                </div>
                <div className="rounded-lg bg-cloud p-2.5 text-center">
                  <p className="text-[10px] font-medium uppercase text-slate-500">Avg DOM</p>
                  <p className="text-sm font-bold text-navy">{salesStats.avgDOM}d</p>
                </div>
                <div className="rounded-lg bg-cloud p-2.5 text-center">
                  <p className="text-[10px] font-medium uppercase text-slate-500">Negotiation</p>
                  <p className={`text-sm font-bold ${salesStats.avgNegotiationGap < 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {salesStats.avgNegotiationGap > 0 ? '+' : ''}{salesStats.avgNegotiationGap}%
                  </p>
                </div>
              </div>
            )}

            {/* Sales table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-[10px] font-semibold uppercase text-slate-500">Address</th>
                    <th className="text-right py-2 text-[10px] font-semibold uppercase text-slate-500">Sold</th>
                    <th className="text-center py-2 text-[10px] font-semibold uppercase text-slate-500">vs List</th>
                    <th className="text-center py-2 text-[10px] font-semibold uppercase text-slate-500 hidden sm:table-cell">DOM</th>
                    <th className="text-right py-2 text-[10px] font-semibold uppercase text-slate-500 hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((comp) => (
                    <tr key={comp.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5">
                        <p className="text-sm font-medium text-navy truncate max-w-[200px]">{comp.address}</p>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-navy">{fmtK(comp.closePrice)}</td>
                      <td className="py-2.5 text-center">
                        <span className={`text-xs font-semibold ${comp.priceDelta < 0 ? 'text-emerald-700' : comp.priceDelta > 0 ? 'text-red-600' : 'text-muted'}`}>
                          {comp.priceDelta > 0 ? '+' : ''}{comp.priceDelta}%
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-muted hidden sm:table-cell">{comp.dom}d</td>
                      <td className="py-2.5 text-right text-xs text-muted hidden sm:table-cell">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Hot Neighbourhoods */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-lg text-navy mb-4">
            Hot Neighbourhoods
          </h2>
          <div className="space-y-3">
            {hotHoods.map(([name, data]) => (
              <div key={name} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{data.emoji}</span>
                  <Link
                    href={`/listings?hood=${encodeURIComponent(name)}`} rel="nofollow"
                    className="text-sm font-medium text-navy hover:text-accent no-underline"
                  >
                    {name}
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted">{fmtK(data.avgPrice)}</span>
                  <span className="text-emerald-700 font-medium">+{data.priceYoY}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase text-slate-500 mb-2">Warm</h3>
            <div className="flex flex-wrap gap-2">
              {warmHoods.map(([name]) => (
                <Link
                  key={name}
                  href={`/listings?hood=${encodeURIComponent(name)}`} rel="nofollow"
                  className="text-[11px] text-muted hover:text-accent bg-cloud rounded-full px-2.5 py-1 no-underline"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase text-slate-500 mb-2">Cool</h3>
            <div className="flex flex-wrap gap-2">
              {coolHoods.map(([name]) => (
                <Link
                  key={name}
                  href={`/listings?hood=${encodeURIComponent(name)}`} rel="nofollow"
                  className="text-[11px] text-muted hover:text-accent bg-cloud rounded-full px-2.5 py-1 no-underline"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mortgage Rates */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-lg text-navy mb-4">
            Current Mortgage Rates
          </h2>
          <p className="text-xs text-muted mb-4">
            Bank of Canada benchmark rates, published monthly via TRREB. Rates change frequently — verify with your mortgage broker.
          </p>
          <div className="space-y-0">
            {rates.map((r, i) => (
              <div
                key={r.term}
                className={`flex items-center justify-between py-3 ${i < rates.length - 1 ? 'border-b border-slate-50' : ''}`}
              >
                <span className="text-sm text-navy">
                  {r.term}
                  {r.posted && (
                    <span className="ml-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      posted
                    </span>
                  )}
                </span>
                <span className="text-sm font-bold text-navy">{r.rate}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-cloud p-4">
            <p className="text-xs text-muted leading-relaxed">
              <strong className="text-navy">Posted rates are not the rate you&apos;ll be offered.</strong>{' '}
              They&apos;re the Bank of Canada benchmark; discounted rates from a broker are typically
              well below them, which is why our cash-flow numbers assume roughly{' '}
              {ratesData?.contractRateAssumption ? `${ratesData.contractRateAssumption}%` : '4.9%'}{' '}
              on a 5-year fixed. Your actual rate depends on credit, down payment, property type and lender —
              always get a quote from a licensed mortgage broker.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="card bg-navy p-8 text-center">
        <h2 className="font-heading font-bold text-xl text-white mb-2">
          Want a personalized market analysis?
        </h2>
        <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
          Get a free investment strategy session with market data tailored to your goals.
        </p>
        <Link href="/quiz" className="btn-primary !px-8 !py-3 no-underline">
          Find My Deal Strategy
        </Link>
      </div>
    </div>
    {/* Persistent mobile action — long data page; scrollers may never reach the
        end CTA. Low-friction email capture complements the /quiz strategy CTA. */}
    <StickyMobileCTA href="/alerts" label="Get Free Deal Alerts" />
    </>
  );
}
