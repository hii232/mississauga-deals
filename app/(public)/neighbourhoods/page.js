'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HOOD_DATA } from '@/lib/constants';
import { fmtK } from '@/lib/utils/format';

const FILTERS = ['All', 'Hot', 'Warm', 'Cool'];

export default function NeighbourhoodsPage() {
  const [filter, setFilter] = useState('All');

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
    </div>
  );
}
