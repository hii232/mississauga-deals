'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ListingCard } from './listing-card';

const PAGE_SIZE = 12;
const FREE_LIMIT = 5;

export function ListingGrid({ listings, isRegistered, compareIds, onToggleCompare }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  // Reset visible count when listings change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [listings]);

  // IntersectionObserver for infinite scroll
  const handleObserver = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && visibleCount < listings.length) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, listings.length));
      }
    },
    [visibleCount, listings.length]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [handleObserver]);

  const visible = listings.slice(0, visibleCount);

  if (listings.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="mt-2 text-sm text-slate-500">No properties match your filters</p>
          <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((listing, index) => {
          const isGated = !isRegistered && index >= FREE_LIMIT;
          return (
            <ListingCard
              key={listing.id}
              listing={listing}
              isGated={isGated}
              isCompared={compareIds.includes(listing.id)}
              onToggleCompare={onToggleCompare}
            />
          );
        })}
      </div>

      {/* Infinite scroll sentinel */}
      {visibleCount < listings.length && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading more properties...
          </div>
        </div>
      )}

      {visibleCount >= listings.length && listings.length > PAGE_SIZE && (
        <p className="py-6 text-center text-xs text-slate-400">
          Showing all {listings.length} properties
        </p>
      )}
    </div>
  );
}
