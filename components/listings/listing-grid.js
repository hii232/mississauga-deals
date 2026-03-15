'use client';

import { useState, useEffect } from 'react';
import { ListingCard } from './listing-card';

const PAGE_SIZE = 30;
const FREE_LIMIT = 4;

export function ListingGrid({ listings, isRegistered, compareIds, onToggleCompare, photoMap }) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when listings change (filters, sort, etc.)
  useEffect(() => {
    setCurrentPage(1);
  }, [listings]);

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

  const totalPages = Math.ceil(listings.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageListings = listings.slice(startIndex, startIndex + PAGE_SIZE);

  function handlePageChange(page) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Build page numbers: show 1, ..., nearby pages, ..., last
  function getPageNumbers() {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pageListings.map((listing, index) => {
          const globalIndex = startIndex + index;
          const isGated = !isRegistered && globalIndex >= FREE_LIMIT;
          return (
            <ListingCard
              key={listing.id}
              listing={listing}
              isGated={isGated}
              isCompared={compareIds.includes(listing.id)}
              onToggleCompare={onToggleCompare}
              batchPhoto={photoMap?.[listing.id]}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
          >
            &larr; Prev
          </button>

          {getPageNumbers().map((page, i) =>
            page === '...' ? (
              <span key={`dot-${i}`} className="px-2 text-sm text-slate-400">...</span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`min-w-[36px] rounded-lg px-3 py-2 text-sm font-medium transition ${
                  page === currentPage
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next &rarr;
          </button>
        </nav>
      )}

      <p className="py-4 text-center text-xs text-slate-400">
        Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, listings.length)} of {listings.length} properties
      </p>
    </div>
  );
}
