'use client';

import { useMemo } from 'react';
import { fmtK, fmtNum } from '@/lib/utils/format';

export function DealScreener({ listings }) {
  const metrics = useMemo(() => {
    if (!listings.length) {
      return {
        total: 0,
        avgPrice: 0,
        avgScore: 0,
        avgDom: 0,
        avgRent: 0,
        avgCf: 0,
        avgCoc: 0,
        bestCf: 0,
        suites: 0,
        analyzed: 0,
      };
    }

    const sum = (fn) => listings.reduce((acc, l) => acc + fn(l), 0);
    const avg = (fn) => sum(fn) / listings.length;
    const bestCfListing = listings.reduce((best, l) =>
      l.cashFlow > best.cashFlow ? l : best
    );

    return {
      total: listings.length,
      avgPrice: avg((l) => l.price),
      avgScore: avg((l) => l.hamzaScore),
      avgDom: avg((l) => l.dom),
      avgRent: avg((l) => l.estimatedRent),
      avgCf: avg((l) => l.cashFlow),
      avgCoc: avg((l) => l.cashOnCash),
      bestCf: bestCfListing.cashFlow,
      suites: listings.filter((l) => l.hasSuite).length,
      analyzed: listings.length,
    };
  }, [listings]);

  const items = [
    { label: 'Total Listings', value: metrics.total, format: 'int' },
    { label: 'Avg Price', value: metrics.avgPrice, format: 'price' },
    { label: 'Avg Score', value: metrics.avgScore, format: 'score' },
    { label: 'Avg DOM', value: metrics.avgDom, format: 'int' },
    { label: 'Avg Rent', value: metrics.avgRent, format: 'price' },
    { label: 'Avg Cash Flow', value: metrics.avgCf, format: 'cf' },
    { label: 'Avg CoC', value: metrics.avgCoc, format: 'pct' },
    { label: 'Best CF', value: metrics.bestCf, format: 'cf' },
    { label: 'Suites Detected', value: metrics.suites, format: 'int' },
    { label: 'Analyzed', value: metrics.analyzed, format: 'int' },
  ];

  function formatValue(val, fmt) {
    switch (fmt) {
      case 'price':
        return fmtK(Math.round(val));
      case 'cf':
        return fmtNum(Math.round(val));
      case 'score':
        return val.toFixed(1);
      case 'pct':
        return val.toFixed(1) + '%';
      case 'int':
      default:
        return Math.round(val).toLocaleString();
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <h2 className="text-sm font-bold text-navy">Deal Screener</h2>
        <span className="text-xs text-slate-400">Portfolio analytics</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg bg-cloud px-3 py-2 text-center"
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              {item.label}
            </p>
            <p
              className={`mt-0.5 text-sm font-bold ${
                item.format === 'cf'
                  ? item.value >= 0
                    ? 'text-success'
                    : 'text-red-500'
                  : 'text-navy'
              }`}
            >
              {formatValue(item.value, item.format)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
