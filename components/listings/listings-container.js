'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { DealScreener } from './deal-screener';
import { ListingGrid } from './listing-grid';
import { ListingTable } from './listing-table';

const PROPERTY_TYPES = ['All', 'Detached', 'Semi', 'Town', 'Condo', 'Duplex/Multi'];

const STRATEGY_CHIPS = [
  { key: 'cf', label: 'CF+', filter: (l) => l.cashFlow > 0 },
  { key: 'highcap', label: 'HIGH CAP', filter: (l) => l.capRate >= 5 },
  { key: 'motivated', label: 'MOTIVATED', filter: (l) => l.dom >= 45 },
  { key: 'brrr', label: 'BRRR', filter: (l) => l.dom >= 60 && l.priceDrop >= 5 },
  { key: 'reduced', label: 'REDUCED', filter: (l) => l.priceDrop > 0 },
  { key: 'new', label: 'NEW', filter: (l) => l.dom <= 3 },
  { key: 'under800', label: '<$800K', filter: (l) => l.price < 800000 },
  { key: 'suite', label: 'SUITE', filter: (l) => l.hasSuite },
];

const SORT_OPTIONS = [
  { key: 'score', label: 'Score', fn: (a, b) => b.hamzaScore - a.hamzaScore },
  { key: 'price', label: 'Price', fn: (a, b) => a.price - b.price },
  { key: 'dom', label: 'DOM', fn: (a, b) => b.dom - a.dom },
  { key: 'drop', label: 'Price Drop', fn: (a, b) => b.priceDrop - a.priceDrop },
  { key: 'cashflow', label: 'Cash Flow', fn: (a, b) => b.cashFlow - a.cashFlow },
  { key: 'caprate', label: 'Cap Rate', fn: (a, b) => b.capRate - a.capRate },
  { key: 'coc', label: 'CoC Return', fn: (a, b) => b.cashOnCash - a.cashOnCash },
  { key: 'rent', label: 'Est. Rent', fn: (a, b) => b.estimatedRent - a.estimatedRent },
];

export function ListingsContainer({ initialListings }) {
  const [listings, setListings] = useState(initialListings);
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState('All');
  const [activeStrategies, setActiveStrategies] = useState([]);
  const [sortKey, setSortKey] = useState('score');
  const [view, setView] = useState('grid');
  const [compareIds, setCompareIds] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);

  const [photoMap, setPhotoMap] = useState({});

  useEffect(() => {
    setIsRegistered(localStorage.getItem('user_registered') === 'true');
  }, []);

  // Fetch photos: batch first, then individual fallback for misses
  useEffect(() => {
    if (listings.length === 0) return;
    const needPhotos = listings.filter((l) => !l.photos?.length).map((l) => l.id);
    if (needPhotos.length === 0) return;

    let cancelled = false;
    async function fetchPhotos() {
      const found = {};

      // Pass 1: Batch fetch (fast, but misses some listings)
      for (let i = 0; i < needPhotos.length; i += 20) {
        if (cancelled) return;
        const batch = needPhotos.slice(i, i + 20);
        try {
          const res = await fetch('/api/photos-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: batch }),
          });
          if (!res.ok) continue;
          const data = await res.json();
          if (data.photos) {
            Object.assign(found, data.photos);
            if (!cancelled) setPhotoMap((prev) => ({ ...prev, ...data.photos }));
          }
        } catch {
          // continue
        }
      }

      // Pass 2: Individual fetch for missing (uses 3-fallback strategy)
      const missing = needPhotos.filter((id) => !found[id]);
      if (missing.length === 0 || cancelled) return;

      // Fetch 6 at a time to avoid overwhelming the server
      for (let i = 0; i < missing.length; i += 6) {
        if (cancelled) return;
        const chunk = missing.slice(i, i + 6);
        const results = await Promise.allSettled(
          chunk.map(async (id) => {
            const res = await fetch('/api/photos?id=' + encodeURIComponent(id));
            if (!res.ok) return null;
            const data = await res.json();
            return data.photos?.[0] ? { id, url: data.photos[0] } : null;
          })
        );
        if (cancelled) return;
        const newPhotos = {};
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            newPhotos[r.value.id] = r.value.url;
          }
        }
        if (Object.keys(newPhotos).length > 0) {
          setPhotoMap((prev) => ({ ...prev, ...newPhotos }));
        }
      }
    }
    fetchPhotos();
    return () => { cancelled = true; };
  }, [listings]);

  // Client-side fallback: if SSR returned no listings, fetch on client
  useEffect(() => {
    if (initialListings.length > 0) return;
    let cancelled = false;
    async function fetchClient() {
      try {
        const res = await fetch('/api/listings?limit=200&page=1');
        if (!res.ok) return;
        const data = await res.json();
        const raw = data.listings || data || [];
        const totalPages = data.pages || 1;

        // Fetch remaining pages
        if (totalPages > 1) {
          for (let p = 2; p <= totalPages && !cancelled; p++) {
            try {
              const r = await fetch('/api/listings?limit=200&page=' + p);
              if (r.ok) {
                const pg = await r.json();
                if (pg?.listings) raw.push(...pg.listings);
              }
            } catch { /* continue */ }
          }
        }

        if (!cancelled && raw.length > 0) {
          const { processListings } = await import('@/lib/listings/process-listings');
          setListings(processListings(raw));
        }
      } catch {
        // silently fail
      }
    }
    fetchClient();
    return () => { cancelled = true; };
  }, [initialListings]);

  const toggleStrategy = useCallback((key) => {
    setActiveStrategies((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const toggleCompare = useCallback((id) => {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev
    );
  }, []);

  const filtered = useMemo(() => {
    let result = [...listings];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.address.toLowerCase().includes(q) ||
          l.neighbourhood.toLowerCase().includes(q) ||
          l.type.toLowerCase().includes(q)
      );
    }

    // Property type
    if (propertyType !== 'All') {
      result = result.filter((l) => {
        const t = (l.type + ' ' + (l.subType || '')).toLowerCase();
        const key = propertyType.toLowerCase();
        if (key === 'duplex/multi') return t.includes('duplex') || t.includes('multi') || t.includes('triplex');
        return t.includes(key);
      });
    }

    // Strategy filters (AND logic)
    for (const sKey of activeStrategies) {
      const chip = STRATEGY_CHIPS.find((c) => c.key === sKey);
      if (chip) result = result.filter(chip.filter);
    }

    // Sort
    const sortOpt = SORT_OPTIONS.find((s) => s.key === sortKey);
    if (sortOpt) result.sort(sortOpt.fn);

    return result;
  }, [listings, search, propertyType, activeStrategies, sortKey]);

  const compareListings = useMemo(
    () => listings.filter((l) => compareIds.includes(l.id)),
    [listings, compareIds]
  );

  return (
    <div className="space-y-6">
      {/* Deal Screener */}
      <DealScreener listings={filtered} />

      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by address, neighbourhood, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Property type chips */}
      <div className="flex flex-wrap gap-2">
        {PROPERTY_TYPES.map((pt) => (
          <button
            key={pt}
            onClick={() => setPropertyType(pt)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              propertyType === pt
                ? 'bg-navy text-white'
                : 'bg-white text-navy border border-slate-200 hover:border-navy/30'
            }`}
          >
            {pt}
          </button>
        ))}
      </div>

      {/* Strategy chips */}
      <div className="flex flex-wrap gap-2">
        {STRATEGY_CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => toggleStrategy(chip.key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
              activeStrategies.includes(chip.key)
                ? 'bg-accent text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-navy">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'property' : 'properties'}
        </p>

        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                Sort: {opt.label}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-white">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-2 text-sm ${
                view === 'grid'
                  ? 'bg-navy text-white rounded-l-lg'
                  : 'text-slate-500 hover:text-navy'
              }`}
              aria-label="Grid view"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-2 text-sm ${
                view === 'table'
                  ? 'bg-navy text-white'
                  : 'text-slate-500 hover:text-navy'
              }`}
              aria-label="Table view"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                <rect x="1" y="1" width="14" height="3" rx="0.5" />
                <rect x="1" y="6" width="14" height="3" rx="0.5" />
                <rect x="1" y="11" width="14" height="3" rx="0.5" />
              </svg>
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-3 py-2 text-sm ${
                view === 'map'
                  ? 'bg-navy text-white rounded-r-lg'
                  : 'text-slate-500 hover:text-navy'
              }`}
              aria-label="Map view"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Listings view */}
      {view === 'grid' && (
        <ListingGrid
          listings={filtered}
          isRegistered={isRegistered}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
          photoMap={photoMap}
        />
      )}
      {view === 'table' && (
        <ListingTable
          listings={filtered}
          isRegistered={isRegistered}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
          photoMap={photoMap}
        />
      )}
      {view === 'map' && (
        <div className="flex h-96 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <p className="text-sm text-slate-400">Map view coming soon</p>
        </div>
      )}

      {/* Compare Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-6 py-4 shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-navy">
                {compareIds.length} selected
              </span>
              <div className="flex gap-2">
                {compareListings.map((l) => (
                  <span
                    key={l.id}
                    className="inline-flex items-center gap-1 rounded-full bg-cloud px-3 py-1 text-xs text-navy"
                  >
                    {l.address.split(',')[0]}
                    <button
                      onClick={() => toggleCompare(l.id)}
                      className="ml-1 text-slate-400 hover:text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCompareIds([])}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
              <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90">
                Compare ({compareIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
