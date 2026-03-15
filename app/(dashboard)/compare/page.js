'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { processListings } from '@/lib/listings/process-listings';
import { fmtK, fmtNum, fmtCurrency } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';

const METRICS = [
  { key: 'price', label: 'Price', format: (v) => fmtK(v), best: 'low' },
  { key: 'type', label: 'Type', format: (v) => v || 'N/A' },
  { key: 'beds', label: 'Beds', format: (v) => v ?? '--' },
  { key: 'baths', label: 'Baths', format: (v) => v ?? '--' },
  { key: 'sqft', label: 'Sq Ft', format: (v) => v > 0 ? v.toLocaleString() : 'N/A' },
  { key: 'pricePerSqFt', label: '$/SqFt', format: (v) => v > 0 ? '$' + v : 'N/A', best: 'low' },
  { key: 'dom', label: 'Days on Market', format: (v) => `${v} days`, best: 'high' },
  { key: 'hamzaScore', label: 'Deal Score', format: (v) => `${v}/10`, best: 'high' },
  { key: 'estimatedRent', label: 'Est. Monthly Rent', format: (v) => fmtCurrency(v) + '/mo', best: 'high' },
  { key: 'monthlyExpenses', label: 'Monthly Costs', format: (v) => fmtCurrency(v) + '/mo', best: 'low' },
  { key: 'cashFlow', label: 'Cash Flow', format: (v) => fmtNum(v), best: 'high' },
  { key: 'capRate', label: 'Cap Rate', format: (v) => (v || 0).toFixed(1) + '%', best: 'high' },
  { key: 'cashOnCash', label: 'CoC Return', format: (v) => (v || 0).toFixed(1) + '%', best: 'high' },
  { key: 'hasSuite', label: 'Suite Potential', format: (v) => v ? 'Yes' : 'No' },
  { key: 'lrtAccess', label: 'LRT Access', format: (v) => v ? 'Yes' : 'No' },
  { key: 'priceDrop', label: 'Price Drop', format: (v) => v > 0 ? `${v}%` : 'None', best: 'high' },
];

function findBestIdx(listings, key, direction) {
  if (listings.length < 2) return -1;
  const vals = listings.map((l) => {
    const v = l[key];
    if (v === undefined || v === null || v === 0) return null;
    return typeof v === 'number' ? v : null;
  });
  if (vals.every((v) => v === null)) return -1;
  let bestIdx = -1;
  let bestVal = direction === 'high' ? -Infinity : Infinity;
  vals.forEach((v, i) => {
    if (v === null) return;
    if (direction === 'high' && v > bestVal) { bestVal = v; bestIdx = i; }
    if (direction === 'low' && v < bestVal) { bestVal = v; bestIdx = i; }
  });
  return bestIdx;
}

export default function ComparePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const compareIds = JSON.parse(localStorage.getItem('compare_list') || '[]');
        if (compareIds.length === 0) {
          setListings([]);
          setLoading(false);
          return;
        }

        const res = await fetch('/api/listings');
        const data = await res.json();
        const all = processListings(data.listings || data);
        const compared = all.filter((l) => compareIds.includes(l.id));
        setListings(compared);
      } catch (err) {
        console.error('Failed to load compare list:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleRemove(id) {
    const compareIds = JSON.parse(localStorage.getItem('compare_list') || '[]');
    const updated = compareIds.filter((cid) => cid !== id);
    localStorage.setItem('compare_list', JSON.stringify(updated));
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  function handleClearAll() {
    localStorage.setItem('compare_list', JSON.stringify([]));
    setListings([]);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-96 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  // Determine overall winner by deal score
  const winnerIdx = listings.length >= 2
    ? listings.reduce((best, l, i) => (l.hamzaScore > (listings[best]?.hamzaScore || 0) ? i : best), 0)
    : -1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/listings" className="text-sm text-accent hover:text-accent-dark no-underline">
              ← Back to Listings
            </Link>
          </div>
          <h1 className="font-heading text-2xl font-bold text-navy mb-1">Compare Properties</h1>
          <p className="text-sm text-muted">
            {listings.length > 0
              ? `Comparing ${listings.length} propert${listings.length === 1 ? 'y' : 'ies'} side by side — green highlights show the better value`
              : 'Add properties to compare from the listings page'}
          </p>
        </div>
        {listings.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-muted hover:text-red-500 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">⚖️</div>
          <h2 className="font-heading font-semibold text-xl text-navy mb-2">
            No properties to compare
          </h2>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            Check the &quot;Compare&quot; box on listing cards to add properties here for a side-by-side analysis.
          </p>
          <Link href="/listings" className="btn-primary !px-8 !py-3 no-underline">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Winner Banner */}
          {winnerIdx >= 0 && listings.length >= 2 && (
            <div className="rounded-xl border border-success/20 bg-success/5 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-white text-lg">
                🏆
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">
                  Best Investment: {listings[winnerIdx].address}
                </p>
                <p className="text-xs text-muted">
                  Score {listings[winnerIdx].hamzaScore}/10 · CF {fmtNum(listings[winnerIdx].cashFlow)} · Cap {listings[winnerIdx].capRate.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-r from-navy to-navy/90">
                    <th className="text-left py-4 px-5 text-[11px] font-semibold uppercase tracking-wider text-white/70 sticky left-0 z-10 bg-navy min-w-[140px]">
                      Metric
                    </th>
                    {listings.map((l, i) => (
                      <th key={l.id} className="py-4 px-5 text-center min-w-[200px]">
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
                              style={{ backgroundColor: scoreColorHex(l.hamzaScore) }}
                            >
                              {l.hamzaScore}
                            </div>
                            {i === winnerIdx && listings.length >= 2 && (
                              <span className="absolute -top-1 -right-1 text-xs">🏆</span>
                            )}
                          </div>
                          <Link
                            href={`/listings/${l.id}`}
                            className="text-xs font-semibold text-white hover:text-white/80 line-clamp-1 max-w-[180px] no-underline"
                          >
                            {l.address}
                          </Link>
                          <span className="text-[11px] font-mono font-bold text-white/90">{fmtK(l.price)}</span>
                          <button
                            onClick={() => handleRemove(l.id)}
                            className="text-[10px] text-white/40 hover:text-red-300 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((metric, rowIdx) => {
                    const bestIdx = metric.best ? findBestIdx(listings, metric.key, metric.best) : -1;

                    return (
                      <tr
                        key={metric.key}
                        className={`border-b border-slate-50 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-cloud/30'}`}
                      >
                        <td className={`py-3 px-5 text-xs font-medium text-slate-500 sticky left-0 z-10 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-cloud/30'}`}>
                          {metric.label}
                        </td>
                        {listings.map((l, colIdx) => {
                          const val = l[metric.key];
                          const isBest = colIdx === bestIdx;
                          let textClass = 'text-navy';

                          if (metric.key === 'cashFlow') {
                            textClass = val >= 0 ? 'text-success font-semibold' : 'text-red-500 font-semibold';
                          } else if (metric.key === 'hamzaScore') {
                            textClass = 'font-bold';
                          } else if (metric.key === 'hasSuite' && val) {
                            textClass = 'text-success font-medium';
                          } else if (metric.key === 'lrtAccess' && val) {
                            textClass = 'text-accent font-medium';
                          } else if (metric.key === 'priceDrop' && val > 0) {
                            textClass = 'text-red-500 font-medium';
                          }

                          return (
                            <td
                              key={l.id}
                              className={`py-3 px-5 text-center text-sm ${textClass} ${isBest ? 'bg-success/5' : ''}`}
                              style={metric.key === 'hamzaScore' ? { color: scoreColorHex(val) } : undefined}
                            >
                              <span className={isBest ? 'relative' : ''}>
                                {metric.format(val)}
                                {isBest && (
                                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success" />
                                )}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analysis Summary */}
          {listings.length >= 2 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-navy mb-3">Quick Analysis</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {(() => {
                  const best = listings.reduce((a, b) => a.cashFlow > b.cashFlow ? a : b);
                  return (
                    <div className="rounded-lg bg-cloud p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">Best Cash Flow</p>
                      <p className="text-sm font-bold text-navy">{best.address.split(' ').slice(0, 3).join(' ')}</p>
                      <p className={`text-xs font-mono font-semibold ${best.cashFlow >= 0 ? 'text-success' : 'text-red-500'}`}>
                        {fmtNum(best.cashFlow)}
                      </p>
                    </div>
                  );
                })()}
                {(() => {
                  const best = listings.reduce((a, b) => a.capRate > b.capRate ? a : b);
                  return (
                    <div className="rounded-lg bg-cloud p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">Best Cap Rate</p>
                      <p className="text-sm font-bold text-navy">{best.address.split(' ').slice(0, 3).join(' ')}</p>
                      <p className="text-xs font-mono font-semibold text-accent">{best.capRate.toFixed(1)}%</p>
                    </div>
                  );
                })()}
                {(() => {
                  const best = listings.reduce((a, b) => a.price < b.price ? a : b);
                  return (
                    <div className="rounded-lg bg-cloud p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">Lowest Entry Price</p>
                      <p className="text-sm font-bold text-navy">{best.address.split(' ').slice(0, 3).join(' ')}</p>
                      <p className="text-xs font-mono font-semibold text-navy">{fmtK(best.price)}</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
