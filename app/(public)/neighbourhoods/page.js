'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HOOD_DATA } from '@/lib/constants';
import { fmtK } from '@/lib/utils/format';

const FILTERS = ['All', 'Hot', 'Warm', 'Cool'];

export default function NeighbourhoodsPage() {
  const [filter, setFilter] = useState('All');
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    fetch('/api/sold-comps?limit=8')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.comps) setRecentSales(data.comps);
      })
      .catch(() => {});
  }, []);

  const hoodEntries = Object.entries(HOOD_DATA);
  const filtered =
    filter === 'All'
      ? hoodEntries
      : hoodEntries.filter(([, data]) => data.trend === filter.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title mb-2">Mississauga Neighbourhoods</h1>
        <p className="section-subtitle">
          Investment insights for every neighbourhood — trends, pricing, and expert notes
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
              ({f === 'All' ? hoodEntries.length : hoodEntries.filter(([, d]) => d.trend === f.toLowerCase()).length})
            </span>
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(([name, data]) => {
          const trendColor =
            data.trend === 'hot'
              ? 'bg-red-50 text-red-600 border-red-100'
              : data.trend === 'warm'
              ? 'bg-amber-50 text-amber-700 border-amber-100'
              : 'bg-blue-50 text-blue-600 border-blue-100';

          return (
            <div key={name} className="card p-5 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{data.emoji}</span>
                  <h3 className="font-heading font-semibold text-navy">{name}</h3>
                </div>
                <span className={`text-[10px] font-bold uppercase rounded-full px-2.5 py-1 border ${trendColor}`}>
                  {data.trend}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-cloud p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-400">Avg Price</p>
                  <p className="text-sm font-bold text-navy">{fmtK(data.avgPrice)}</p>
                </div>
                <div className="rounded-lg bg-cloud p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-400">YoY Change</p>
                  <p className={`text-sm font-bold ${data.priceYoY >= 4 ? 'text-success' : data.priceYoY >= 2.5 ? 'text-gold-dark' : 'text-muted'}`}>
                    +{data.priceYoY}%
                  </p>
                </div>
                <div className="rounded-lg bg-cloud p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-400">Avg DOM</p>
                  <p className="text-sm font-bold text-navy">{data.avgDOM} days</p>
                </div>
                <div className="rounded-lg bg-cloud p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-400">Inventory</p>
                  <p className={`text-sm font-bold ${data.inventory === 'Low' ? 'text-red-500' : data.inventory === 'Medium' ? 'text-gold-dark' : 'text-muted'}`}>
                    {data.inventory}
                  </p>
                </div>
              </div>

              {/* Rent Yield */}
              <div className="flex items-center justify-between text-xs mb-4 pb-3 border-b border-slate-100">
                <span className="text-muted">Rent Yield</span>
                <span className="font-semibold text-navy">{data.rentYield}%</span>
              </div>

              {/* Hamza's Note */}
              <div className="mb-4">
                <p className="text-[11px] font-medium text-slate-400 uppercase mb-1">Hamza&apos;s Take</p>
                <p className="text-xs text-navy/70 leading-relaxed italic">
                  &ldquo;{data.note}&rdquo;
                </p>
              </div>

              {/* Link */}
              <Link
                href={`/listings?hood=${encodeURIComponent(name)}`}
                className="block text-center rounded-lg bg-cloud py-2 text-xs font-medium text-accent hover:bg-accent/5 transition-colors no-underline"
              >
                View Listings in {name}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Recent Sales Activity */}
      {recentSales.length > 0 && (
        <div className="mt-10 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-semibold text-lg text-navy">Recent Sales Across Mississauga</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-success">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-slate-400">Address</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-slate-400 hidden sm:table-cell">City</th>
                  <th className="text-right py-2 text-[10px] font-semibold uppercase text-slate-400">Sold Price</th>
                  <th className="text-center py-2 text-[10px] font-semibold uppercase text-slate-400">vs List</th>
                  <th className="text-right py-2 text-[10px] font-semibold uppercase text-slate-400 hidden md:table-cell">Date</th>
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
                      <span className={`text-xs font-semibold ${comp.priceDelta < 0 ? 'text-success' : comp.priceDelta > 0 ? 'text-red-500' : 'text-muted'}`}>
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
        </div>
      )}
    </div>
  );
}
