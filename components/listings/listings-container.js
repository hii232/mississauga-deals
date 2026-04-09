'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fmtK, fmtNum } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';
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

// ── Top Picks Card ──
function TopPickCard({ listing, photo }) {
  const scoreHex = scoreColorHex(listing.hamzaScore);
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="relative flex-shrink-0 w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] no-underline"
    >
      {/* Photo */}
      <div className="relative h-36 w-full overflow-hidden">
        {photo ? (
          <img src={photo} alt={listing.address} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
            </svg>
          </div>
        )}
        {/* Score badge */}
        <div
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-md"
          style={{ backgroundColor: scoreHex }}
        >
          {listing.hamzaScore}
        </div>
        {/* CF+ badge */}
        <span className="absolute left-2 top-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
          Cash Flowing
        </span>
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-navy line-clamp-1">{listing.address}</p>
        <p className="text-base font-bold text-navy">{fmtK(listing.price)}</p>
        <div className="mt-1.5 grid grid-cols-3 gap-0.5 text-center rounded-md bg-cloud p-1.5">
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase text-slate-400">CAP</p>
            <p className="text-[11px] font-bold text-navy truncate">{listing.capRate.toFixed(1)}%</p>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase text-slate-400">CF/mo</p>
            <p className="text-[11px] font-bold text-emerald-500 truncate">{listing.cashFlow >= 0 ? '+' : '-'}${Math.abs(Math.round(listing.cashFlow)).toLocaleString()}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase text-slate-400">CoC</p>
            <p className="text-[11px] font-bold text-navy truncate">{listing.cashOnCash.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Top Picks Section ──
function TopPicks({ listings, photoMap, isRegistered }) {
  const scrollRef = useRef(null);
  const topPicks = useMemo(() => {
    return listings
      .filter((l) => l.cashFlow > 0)
      .sort((a, b) => b.hamzaScore - a.hamzaScore)
      .slice(0, 6);
  }, [listings]);

  if (topPicks.length === 0) return null;

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🏆</span>
          <h3 className="text-sm font-bold text-navy uppercase tracking-wide">Top Picks</h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
            Best Cash Flowing Deals
          </span>
        </div>
        {isRegistered && (
          <div className="hidden sm:flex items-center gap-1">
            <button onClick={() => scroll(-1)} className="rounded-full p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={() => scroll(1)} className="rounded-full p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          className={`flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent ${!isRegistered ? 'blur-sm pointer-events-none select-none' : ''}`}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {topPicks.map((listing) => (
            <div key={listing.id} style={{ scrollSnapAlign: 'start' }}>
              <TopPickCard listing={listing} photo={listing.photos?.[0] || photoMap[listing.id] || null} />
            </div>
          ))}
        </div>
        {!isRegistered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/60 backdrop-blur-[2px]">
            <svg className="mb-2 h-8 w-8 text-navy/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <p className="mb-2 text-sm font-semibold text-navy">Top {topPicks.length} cash-flowing deals are locked</p>
            <Link
              href="/signup"
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-accent/90 no-underline"
            >
              Sign up free to unlock
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function ListingsContainer({ initialListings, apiEndpoint = '/api/listings', popularHoods }) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [view, setView] = useState('grid');
  const [compareIds, setCompareIds] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(initialListings.length === 0);

  const [photoMap, setPhotoMap] = useState({});

  useEffect(() => {
    setIsRegistered(localStorage.getItem('user_registered') === 'true');
  }, []);

  // Fetch photos via /api/photos-batch (25 at a time) for listings missing photos.
  // Fires 4 parallel batch calls immediately (100 photos), then queues the rest.
  const photoBatchRef = useRef(new Set()); // IDs already requested
  const photoQueueRef = useRef([]);        // IDs waiting to be fetched
  const photoTimerRef = useRef(null);      // background drainer timer

  // Helper: fetch a batch of photos (up to 25) via batch endpoint
  const fetchPhotoBatch = useCallback(async (ids) => {
    try {
      const res = await fetch('/api/photos-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('batch failed');
      const data = await res.json();
      const photos = data?.photos || {};
      if (Object.keys(photos).length > 0) {
        setPhotoMap((prev) => ({ ...prev, ...photos }));
      }
    } catch {
      // Batch failed — fall back to individual calls for this chunk
      for (const id of ids) {
        fetch('/api/photos?id=' + encodeURIComponent(id) + '&limit=1')
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            const url = d?.photos?.[0];
            if (url) setPhotoMap((prev) => ({ ...prev, [id]: url }));
          })
          .catch(() => {});
      }
    }
  }, []);

  // When listings change, queue new IDs that need photos
  useEffect(() => {
    if (listings.length === 0) return;

    const newIds = listings
      .filter((l) => !l.photos?.length && !photoBatchRef.current.has(l.id))
      .map((l) => l.id);
    if (newIds.length === 0) return;

    // Mark as requested immediately
    for (const id of newIds) photoBatchRef.current.add(id);

    // Fire 4 parallel batch calls immediately (covers first 100 visible listings)
    const BATCH_SIZE = 25;
    const immediateBatches = [];
    for (let i = 0; i < Math.min(newIds.length, 100); i += BATCH_SIZE) {
      immediateBatches.push(newIds.slice(i, i + BATCH_SIZE));
    }
    const rest = newIds.slice(100);

    // Fire all 4 batches in parallel for fastest initial load
    for (const batch of immediateBatches) {
      fetchPhotoBatch(batch);
    }

    // Queue the rest — 25 at a time, fire 2 parallel batches every 500ms
    if (rest.length > 0) {
      photoQueueRef.current.push(...rest);

      if (!photoTimerRef.current) {
        photoTimerRef.current = setInterval(() => {
          if (photoQueueRef.current.length === 0) {
            clearInterval(photoTimerRef.current);
            photoTimerRef.current = null;
            return;
          }
          // Fire 2 parallel batches each tick
          const chunk1 = photoQueueRef.current.splice(0, BATCH_SIZE);
          if (chunk1.length > 0) fetchPhotoBatch(chunk1);
          const chunk2 = photoQueueRef.current.splice(0, BATCH_SIZE);
          if (chunk2.length > 0) fetchPhotoBatch(chunk2);
        }, 500);
      }
    }
  }, [listings, fetchPhotoBatch]);

  // Cleanup background timer on unmount
  useEffect(() => {
    return () => {
      if (photoTimerRef.current) clearInterval(photoTimerRef.current);
    };
  }, []);

  // Client-side fallback: if SSR returned no listings, fetch on client
  // Shows page 1 instantly, then loads remaining pages in background
  useEffect(() => {
    if (initialListings.length > 0) return;
    let cancelled = false;
    async function fetchClient() {
      try {
        const { processListings } = await import('@/lib/listings/process-listings');

        // Fetch page 1 and show immediately
        const res = await fetch(apiEndpoint + '?limit=200&page=1');
        if (!res.ok) return;
        const data = await res.json();
        const page1 = data.listings || data || [];
        const totalPages = data.pages || 1;

        if (!cancelled && page1.length > 0) {
          setListings(processListings(page1));
          setIsLoading(false);
        }

        // Fetch remaining pages in parallel batches, appending as they arrive
        if (totalPages > 1 && !cancelled) {
          const maxPages = Math.min(totalPages, 50);
          const batchSize = 5;
          const allExtra = [];

          for (let batchStart = 2; batchStart <= maxPages && !cancelled; batchStart += batchSize) {
            const batch = [];
            for (let p = batchStart; p < batchStart + batchSize && p <= maxPages; p++) {
              batch.push(
                fetch(apiEndpoint + '?limit=200&page=' + p)
                  .then(r => r.ok ? r.json() : null)
                  .then(pg => pg?.listings || [])
                  .catch(() => [])
              );
            }
            const results = await Promise.all(batch);
            for (const r of results) allExtra.push(...r);

            // Update listings after each batch so user sees more appearing
            if (!cancelled && allExtra.length > 0) {
              setListings(processListings([...page1, ...allExtra]));
            }
          }
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

  // Store filtered listing IDs in localStorage for prev/next navigation on detail page
  useEffect(() => {
    if (filtered.length > 0) {
      localStorage.setItem('browse_listing_ids', JSON.stringify(filtered.map(l => l.id)));
    }
  }, [filtered]);

  const compareListings = useMemo(
    () => listings.filter((l) => compareIds.includes(l.id)),
    [listings, compareIds]
  );

  return (
    <div className="space-y-6">
      {/* Deal Screener */}
      <DealScreener listings={filtered} />

      {/* Top Picks — highest-scored CF+ deals */}
      <TopPicks listings={listings} photoMap={photoMap} isRegistered={isRegistered} />

      {/* Investor Filters */}
      <InvestorFilters filters={filters} setFilters={setFilters} resultCount={filtered.length} totalCount={listings.length} popularHoods={popularHoods} />

      {/* Signup prompt — show when not registered */}
      {!isRegistered && filtered.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 to-emerald-50 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <p className="text-sm font-medium text-navy">
              Sign up free to unlock <span className="font-bold text-accent">cash flow, cap rate & deal analysis</span> on every listing
            </p>
          </div>
          <Link
            href="/signup"
            className="flex-shrink-0 rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent/90 no-underline"
          >
            Sign up free
          </Link>
        </div>
      )}

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
          isLoading={isLoading}
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
                  localStorage.setItem('compare_data', JSON.stringify(compareListings));
                  router.push('/compare');
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
