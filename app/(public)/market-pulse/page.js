'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HOOD_DATA } from '@/lib/constants';
import { fmtK } from '@/lib/utils/format';

export default function MarketPulsePage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState([]);
  const [salesStats, setSalesStats] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/market-stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to load market stats:', err);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Fetch recent sold comps
    fetch('/api/sold-comps?limit=5')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.comps) setRecentSales(data.comps);
        if (data?.stats) setSalesStats(data.stats);
      })
      .catch(() => {});
  }, []);

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

  const marketMetrics = {
    avgDOM: stats?.avgDOM || Math.round(hoodEntries.reduce((s, [, d]) => s + d.avgDOM, 0) / hoodEntries.length),
    salesToList: stats?.salesToListRatio ? (stats.salesToListRatio * 100).toFixed(1) : 97.2,
    monthsOfInventory: stats?.monthsOfInventory || 3.1,
    activeCount: stats?.activeCount || 0,
  };

  const priceTypes = [
    { label: 'Detached', value: avgPrices.detached, color: '#1B2A4A' },
    { label: 'Semi-Detached', value: avgPrices.semi, color: '#2563EB' },
    { label: 'Townhouse', value: avgPrices.townhouse, color: '#10B981' },
    { label: 'Condo', value: avgPrices.condo, color: '#F59E0B' },
  ];

  const maxPrice = Math.max(...priceTypes.map((p) => p.value));

  // Mortgage rates
  const rates = stats?.mortgageRates || [
    { term: '1-Year Fixed', rate: '5.84%' },
    { term: '2-Year Fixed', rate: '5.29%' },
    { term: '3-Year Fixed', rate: '4.89%' },
    { term: '5-Year Fixed', rate: '4.69%' },
    { term: '5-Year Variable', rate: '5.55%' },
  ];

  if (loading) {
    return (
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
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="section-title mb-2">Market Pulse</h1>
        <p className="section-subtitle">
          Mississauga real estate market snapshot — updated regularly
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="card p-5 text-center">
          <p className="text-[10px] font-medium uppercase text-slate-400 mb-1">Avg DOM</p>
          <p className="font-heading font-bold text-2xl text-navy">{marketMetrics.avgDOM}</p>
          <p className="text-xs text-muted">days on market</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-[10px] font-medium uppercase text-slate-400 mb-1">Sale-to-List</p>
          <p className="font-heading font-bold text-2xl text-navy">{marketMetrics.salesToList}%</p>
          <p className="text-xs text-muted">average ratio</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-[10px] font-medium uppercase text-slate-400 mb-1">Inventory</p>
          <p className="font-heading font-bold text-2xl text-navy">{marketMetrics.monthsOfInventory}</p>
          <p className="text-xs text-muted">months supply</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-[10px] font-medium uppercase text-slate-400 mb-1">Active Listings</p>
          <p className="font-heading font-bold text-2xl text-navy">{marketMetrics.activeCount.toLocaleString()}</p>
          <p className="text-xs text-muted">on market</p>
        </div>
      </div>

      {/* Avg Prices by Type - Bar Chart */}
      <div className="card p-6 mb-10">
        <h2 className="font-heading font-semibold text-lg text-navy mb-6">
          Average Prices by Property Type
        </h2>
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

      {/* Recent Sales Activity */}
      {recentSales.length > 0 && (
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

          {/* Mini stats row */}
          {salesStats && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-cloud p-2.5 text-center">
                <p className="text-[10px] font-medium uppercase text-slate-400">Avg Sold</p>
                <p className="text-sm font-bold text-navy">{fmtK(salesStats.avgSoldPrice)}</p>
              </div>
              <div className="rounded-lg bg-cloud p-2.5 text-center">
                <p className="text-[10px] font-medium uppercase text-slate-400">Avg DOM</p>
                <p className="text-sm font-bold text-navy">{salesStats.avgDOM}d</p>
              </div>
              <div className="rounded-lg bg-cloud p-2.5 text-center">
                <p className="text-[10px] font-medium uppercase text-slate-400">Negotiation</p>
                <p className={`text-sm font-bold ${salesStats.avgNegotiationGap < 0 ? 'text-success' : 'text-red-500'}`}>
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
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-slate-400">Address</th>
                  <th className="text-right py-2 text-[10px] font-semibold uppercase text-slate-400">Sold</th>
                  <th className="text-center py-2 text-[10px] font-semibold uppercase text-slate-400">vs List</th>
                  <th className="text-center py-2 text-[10px] font-semibold uppercase text-slate-400 hidden sm:table-cell">DOM</th>
                  <th className="text-right py-2 text-[10px] font-semibold uppercase text-slate-400 hidden sm:table-cell">Date</th>
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
                      <span className={`text-xs font-semibold ${comp.priceDelta < 0 ? 'text-success' : comp.priceDelta > 0 ? 'text-red-500' : 'text-muted'}`}>
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
                    href={`/listings?hood=${encodeURIComponent(name)}`}
                    className="text-sm font-medium text-navy hover:text-accent no-underline"
                  >
                    {name}
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted">{fmtK(data.avgPrice)}</span>
                  <span className="text-success font-medium">+{data.priceYoY}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Warm</h3>
            <div className="flex flex-wrap gap-2">
              {warmHoods.map(([name]) => (
                <Link
                  key={name}
                  href={`/listings?hood=${encodeURIComponent(name)}`}
                  className="text-[11px] text-muted hover:text-accent bg-cloud rounded-full px-2.5 py-1 no-underline"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Cool</h3>
            <div className="flex flex-wrap gap-2">
              {coolHoods.map(([name]) => (
                <Link
                  key={name}
                  href={`/listings?hood=${encodeURIComponent(name)}`}
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
            Approximate rates from major Canadian lenders. Rates change frequently — verify with your mortgage broker.
          </p>
          <div className="space-y-0">
            {rates.map((r, i) => (
              <div
                key={r.term}
                className={`flex items-center justify-between py-3 ${i < rates.length - 1 ? 'border-b border-slate-50' : ''}`}
              >
                <span className="text-sm text-navy">{r.term}</span>
                <span className="text-sm font-bold text-navy">{r.rate}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-cloud p-4">
            <p className="text-xs text-muted leading-relaxed">
              Rates shown are for reference only. Actual rates depend on credit score, down payment, property type, and lender. Always consult a licensed mortgage broker for accurate quotes.
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
  );
}
