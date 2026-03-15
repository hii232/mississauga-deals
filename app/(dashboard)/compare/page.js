'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { processListings } from '@/lib/listings/process-listings';
import { fmtK, fmtNum, fmtCurrency } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';

const METRICS = [
  { key: 'address', label: 'Address', format: (v) => v || 'N/A' },
  { key: 'price', label: 'Price', format: (v) => fmtK(v) },
  { key: 'type', label: 'Type', format: (v) => v || 'N/A' },
  { key: 'beds', label: 'Beds', format: (v) => v ?? '--' },
  { key: 'baths', label: 'Baths', format: (v) => v ?? '--' },
  { key: 'dom', label: 'DOM', format: (v) => `${v} days` },
  { key: 'hamzaScore', label: 'Deal Score', format: (v) => `${v}/10` },
  { key: 'estimatedRent', label: 'Est. Rent', format: (v) => fmtCurrency(v) + '/mo' },
  { key: 'monthlyExpenses', label: 'Mortgage + Exp.', format: (v) => fmtCurrency(v) + '/mo' },
  { key: 'cashFlow', label: 'Cash Flow', format: (v) => fmtNum(v) },
  { key: 'cashOnCash', label: 'CoC Return', format: (v) => (v || 0).toFixed(1) + '%' },
  { key: 'capRate', label: 'Cap Rate', format: (v) => (v || 0).toFixed(1) + '%' },
  { key: 'hasSuite', label: 'Suite Potential', format: (v) => v ? 'Yes' : 'No' },
  { key: 'lrtAccess', label: 'LRT Access', format: (v) => v ? 'Yes' : 'No' },
  { key: 'priceDrop', label: 'Price Drop', format: (v) => v > 0 ? `${v}%` : 'None' },
];

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title mb-2">Compare Properties</h1>
          <p className="section-subtitle">
            {listings.length > 0
              ? `Comparing ${listings.length} propert${listings.length === 1 ? 'y' : 'ies'} side by side`
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
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-slate-400 bg-cloud sticky left-0 z-10 min-w-[140px]">
                    Metric
                  </th>
                  {listings.map((l) => (
                    <th key={l.id} className="py-3 px-4 text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: scoreColorHex(l.hamzaScore) }}
                        >
                          {l.hamzaScore}
                        </div>
                        <Link
                          href={`/listings/${l.id}`}
                          className="text-xs font-medium text-navy hover:text-accent line-clamp-1 max-w-[160px]"
                        >
                          {l.address}
                        </Link>
                        <button
                          onClick={() => handleRemove(l.id)}
                          className="text-[10px] text-muted hover:text-red-500 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric, i) => (
                  <tr
                    key={metric.key}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-cloud/50'}
                  >
                    <td className={`py-2.5 px-4 text-xs font-medium text-slate-500 sticky left-0 z-10 ${i % 2 === 0 ? 'bg-white' : 'bg-cloud/50'}`}>
                      {metric.label}
                    </td>
                    {listings.map((l) => {
                      const val = l[metric.key];
                      let displayClass = 'text-navy';
                      if (metric.key === 'cashFlow') {
                        displayClass = val >= 0 ? 'text-success font-semibold' : 'text-red-500 font-semibold';
                      }
                      if (metric.key === 'hamzaScore') {
                        displayClass = 'font-bold';
                      }
                      if (metric.key === 'hasSuite' && val) {
                        displayClass = 'text-success font-medium';
                      }
                      if (metric.key === 'lrtAccess' && val) {
                        displayClass = 'text-accent font-medium';
                      }

                      return (
                        <td
                          key={l.id}
                          className={`py-2.5 px-4 text-center text-sm ${displayClass}`}
                          style={metric.key === 'hamzaScore' ? { color: scoreColorHex(val) } : undefined}
                        >
                          {metric.format(val)}
                        </td>
                      );
                    })}
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
