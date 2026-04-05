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
    <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white">
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
        <div
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-md"
          style={{ backgroundColor: scoreHex }}
        >
          {listing.hamzaScore}
        </div>
        <span className="absolute left-2 top-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
          Cash Flowing
        </span>
      </div>
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

// ── View mode icons ──
const ViewIcon = ({ type, active }) => {
  const cls = `h-4 w-4 ${active ? 'text-white' : 'text-slate-500'}`;
  if (type === 'split') return (
    <svg className={cls} fill="currentColor" viewBox="0 0 16 16">
      <rect x="1" y="1" width="6" height="14" rx="1" />
      <rect x="9" y="1" width="6" height="14" rx="1" opacity="0.4" />
    </svg>
  );
  if (type === 'grid') return (
    <svg className={cls} fill="currentColor" viewBox="0 0 16 16">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
  if (type === 'table') return (
    <svg className={cls} fill="currentColor" viewBox="0 0 16 16">
      <rect x="1" y="1" width="14" height="3" rx="0.5" />
      <rect x="1" y="6" width="14" height="3" rx="0.5" />
      <rect x="1" y="11" width="14" height="3" rx="0.5" />
    </svg>
  );
  if (type === 'map') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  return null;
};

export function ListingsContainer({ initialListings, apiEndpoint = '/api/listings', popularHoods }) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [view, setView] = useState('split');      // 'split' | 'grid' | 'table' | 'map'
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map' for mobile
  const [compareIds, setCompareIds] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(initialListings.length === 0);
  const [hoveredListingId, setHoveredListingId] = useState(null);
  const [photoMap, setPhotoMap] = useState({});

  useEffect(() => {
    setIsRegistered(localStorage.getItem('user_registered') === 'true');
  }, []);

  // Fetch photos
  useEffect(() => {
    if (listings.length === 0) return;
    const needPhotos = listings.filter((l) => !l.photos?.length).map((l) => l.id);
    if (needPhotos.length === 0) return;

    let cancelled = false;
    const foundIds = new Set();

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

    const fallbackTimer = setTimeout(() => {
      if (cancelled) return;
      const missing = needPhotos.filter((id) => !foundIds.has(id));
      if (missing.length === 0) return;
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

  // Client-side fallback fetch
  useEffect(() => {
    if (initialListings.length > 0) return;
    let cancelled = false;
    async function fetchClient() {
      try {
        const { processListings } = await import('@/lib/listings/process-listings');
        const res = await fetch(apiEndpoint + '?limit=200&page=1');
        if (!res.ok) return;
        const data = await res.json();
        const page1 = data.listings || data || [];
        const totalPages = data.pages || 1;

        if (!cancelled && page1.length > 0) {
          setListings(processListings(page1));
          setIsLoading(false);
        }

        if (totalPages > 1 && !cancelled) {
          const maxPages = Math.min(totalPages, 25);
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

  const compareListings = useMemo(
    () => listings.filter((l) => compareIds.includes(l.id)),
    [listings, compareIds]
  );

  const showSplitMap = view === 'split';

  return (
    <div className="space-y-6">
      {/* Deal Screener */}
      <DealScreener listings={filtered} />

      {/* Top Picks */}
      <TopPicks listings={listings} photoMap={photoMap} isRegistered={isRegistered} />

      {/* Investor Filters */}
      <InvestorFilters filters={filters} setFilters={setFilters} resultCount={filtered.length} totalCount={listings.length} popularHoods={popularHoods} />

      {/* Signup prompt */}
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

      {/* ── Desktop View Toggle ── */}
      <div className="hidden sm:flex justify-end">
        <div className="flex rounded-lg border border-slate-200 bg-white">
          {['split', 'grid', 'table', 'map'].map((v, i, arr) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-2 text-sm capitalize ${
                i === 0 ? 'rounded-l-lg' : ''
              } ${
                i === arr.length - 1 ? 'rounded-r-lg' : ''
              } ${
                view === v
                  ? 'bg-navy text-white'
                  : 'text-slate-500 hover:text-navy'
              }`}
              aria-label={`${v} view`}
              title={v === 'split' ? 'List + Map' : v.charAt(0).toUpperCase() + v.slice(1)}
            >
              <ViewIcon type={v} active={view === v} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile View Toggle (floating) ── */}
      <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex rounded-full border border-slate-200 bg-white shadow-lg">
        <button
          onClick={() => setMobileView('list')}
          className={`flex items-center gap-2 rounded-l-full px-5 py-3 text-sm font-semibold transition-colors ${
            mobileView === 'list' ? 'bg-navy text-white' : 'text-slate-500'
          }`}
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="9" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="9" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
          List
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={`flex items-center gap-2 rounded-r-full px-5 py-3 text-sm font-semibold transition-colors ${
            mobileView === 'map' ? 'bg-navy text-white' : 'text-slate-500'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Map
        </button>
      </div>

      {/* ── Desktop: Split View (List + Map) ── */}
      {showSplitMap && (
        <div className="hidden sm:grid grid-cols-[55%_45%] gap-4" style={{ height: 'calc(100vh - 120px)' }}>
          {/* Left: scrollable listing cards */}
          <div className="overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="mb-3 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="text-sm font-semibold text-navy">No properties match your filters</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting or clearing filters</p>
              </div>
            ) : (
              filtered.map((listing) => {
                const photo = listing.photos?.[0] || photoMap[listing.id] || '';
                const scoreHex = scoreColorHex(listing.hamzaScore);
                const isHovered = hoveredListingId === listing.id;

                return (
                  <div
                    key={listing.id}
                    className={`flex gap-3 rounded-xl border bg-white p-3 transition-all duration-150 cursor-pointer ${
                      isHovered
                        ? 'border-accent shadow-md ring-2 ring-accent/20'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                    onMouseEnter={() => setHoveredListingId(listing.id)}
                    onMouseLeave={() => setHoveredListingId(null)}
                    onClick={() => router.push(`/listings/${listing.id}`)}
                  >
                    {/* Photo */}
                    <div className="relative h-28 w-36 flex-shrink-0 overflow-hidden rounded-lg">
                      {photo ? (
                        <img src={photo} alt={listing.address} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100">
                          <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                          </svg>
                        </div>
                      )}
                      <div
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow"
                        style={{ backgroundColor: scoreHex }}
                      >
                        {listing.hamzaScore}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{listing.address}</p>
                      <p className="text-xs text-slate-400">{listing.beds} bed · {listing.baths} bath · {listing.type}</p>
                      <p className="text-base font-bold text-navy mt-1">{fmtK(listing.price)}</p>

                      <div className="mt-2 flex gap-3 text-center">
                        <div>
                          <p className="text-[9px] font-medium uppercase text-slate-400">CF/mo</p>
                          <p className={`text-xs font-bold ${listing.cashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {listing.cashFlow >= 0 ? '+' : ''}{fmtNum(listing.cashFlow)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-medium uppercase text-slate-400">CAP</p>
                          <p className="text-xs font-bold text-navy">{listing.capRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-medium uppercase text-slate-400">DOM</p>
                          <p className="text-xs font-bold text-navy">{listing.dom}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: sticky map */}
          <div className="sticky top-0 h-full">
            <ListingMap
              listings={filtered}
              photoMap={photoMap}
              highlightId={hoveredListingId}
              onHoverListing={setHoveredListingId}
              height="100%"
              compact
            />
          </div>
        </div>
      )}

      {/* ── Desktop: Full-width Grid/Table/Map ── */}
      {!showSplitMap && (
        <div className="hidden sm:block">
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
            <ListingMap
              listings={filtered}
              photoMap={photoMap}
              highlightId={hoveredListingId}
              onHoverListing={setHoveredListingId}
              height="calc(100vh - 200px)"
            />
          )}
        </div>
      )}

      {/* ── Mobile: List or Map (toggle via floating button) ── */}
      <div className="sm:hidden">
        {mobileView === 'list' ? (
          <ListingGrid
            listings={filtered}
            isRegistered={isRegistered}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
            photoMap={photoMap}
            isLoading={isLoading}
          />
        ) : (
          <div style={{ height: 'calc(100vh - 200px)' }}>
            <ListingMap
              listings={filtered}
              photoMap={photoMap}
              height="100%"
            />
          </div>
        )}
      </div>

      {/* Compare Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-6 py-4 shadow-lg sm:bottom-0">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-navy">
                {compareIds.length} selected
              </span>
              <div className="hidden sm:flex gap-2">
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
