'use client';

import { useEffect, useState } from 'react';
import { PLATFORM_STATS } from '@/lib/constants';

/**
 * Real aggregate proof, shown at the point of decision.
 *
 * Every figure here is sourced or omitted - there are no defaults to fall back
 * on. The active count comes from the live feed via /api/market-stats, the
 * rating from Google via /api/google-rating (the Places key never reaches the
 * browser), and the neighbourhood count from the same PLATFORM_STATS constant
 * the rest of the site quotes. A tile whose number does not arrive is dropped
 * rather than filled in, and if nothing can be sourced the row disappears.
 */
export function ProofRow({ tone = 'light', className = '' }) {
  const [activeCount, setActiveCount] = useState(null);
  const [rating, setRating] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/market-stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.activeCount > 0) setActiveCount(d.activeCount);
      })
      .catch(() => {});
    fetch('/api/google-rating')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.configured && d.rating) setRating(d);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const tiles = [
    activeCount
      ? { value: activeCount.toLocaleString(), label: 'Listings scored now' }
      : null,
    rating
      ? { value: `${rating.rating.toFixed(1)} ★`, label: `${rating.reviewCount} Google reviews` }
      : null,
    { value: PLATFORM_STATS.neighbourhoods, label: 'Neighbourhoods covered' },
  ].filter(Boolean);

  if (tiles.length === 0) return null;

  const dark = tone === 'dark';

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      {tiles.map((t, i) => (
        <div key={t.label} className="flex items-center gap-4">
          {i > 0 && <div className={`h-6 w-px ${dark ? 'bg-white/20' : 'bg-slate-200'}`} />}
          <div className="text-center">
            <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-navy'}`}>{t.value}</p>
            <p className={`text-[10px] ${dark ? 'text-white/60' : 'text-slate-500'}`}>{t.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
