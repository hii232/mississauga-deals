'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { DealScreener } from './deal-screener';
import { ListingGrid } from './listing-grid';
import { ListingTable } from './listing-table';
import { InvestorFilters } from './investor-filters';
import { DEFAULT_FILTERS, applyFilters } from './filter-utils';

const ListingMap = dynamic(() => import('./listing-map').then(m => m.ListingMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-xl border border-slate-200 bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      <span className="ml-3 text-sm text-muted">Loading map...</span>
    </div>
  ),
});

export function ListingsContainer({ initialListings }) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [view, setView] = useState('grid');
  const [compareIds, setCompareIds] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);

  const [photoMap, setPhotoMap] = useState({});

  useEffect(() => {
    setIsRegistered(localStorage.getItem('user_registered') === 'true');
  }, []);

  // Fetch photos: fire all batches in parallel, update state instantly per batch
  useEffect(() => {
    if (listings.length === 0) return;
    const needPhotos = listings.filter((l) => !l.photos?.length).map((l) => l.id);
    if (needPhotos.length === 0) return;

    let cancelled = false;
    const foundIds = new Set();

    // Each batch updates photos the instant it resolves
    for (let i = 0; i < needPhotos.length; i += 50) {
      const batch = needPhotos.slice(i, i + 50);
      fetch('/api/photos-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: batch }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled || !data?.photos) return;
          const photos = data.photos;
          Object.keys(photos).forEach((id) => foundIds.add(id));
          setPhotoMap((prev) => ({ ...prev, ...photos }));
        })
        .catch(() => {});
    }

    // Pass 2: after a short delay, fetch missing individually
    const fallbackTimer = setTimeout(() => {
      if (cancelled) return;
      const missing = needPhotos.filter((id) => !foundIds.has(id));
      if (missing.length === 0) return;

      // Fire all individual fetches at once
      for (const id of missing) {
        fetch('/api/photos?id=' + encodeURIComponent(id))
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (cancelled || !data?.photos?.[0]) return;
            setPhotoMap((prev) => ({ ...prev, [id]: data.photos[0] }));
          })
          .catch(() => {});
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
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

  const toggleCompare = useCallback((id) => {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev
    );
  }, []);

  const filtered = useMemo(() => applyFilters(listings, filters), [listings, filters]);

  const compareListings = useMemo(
    () => listings.filter((l) => compareIds.includes(l.id)),
    [listings, compareIds]
  );

  return (
    <div className="space-y-6">
      {/* Deal Screener */}
      <DealScreener listings={filtered} />

      {/* Investor Filters */}
      <InvestorFilters filters={filters} setFilters={setFilters} resultCount={filtered.length} />

      {/* View toggle */}
      <div className="flex justify-end">
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
        <ListingMap listings={filtered} photoMap={photoMap} />
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
              <button
                onClick={() => {
                  localStorage.setItem('compare_list', JSON.stringify(compareIds));
                  router.push('/dashboard/compare');
                }}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
              >
                Compare ({compareIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
