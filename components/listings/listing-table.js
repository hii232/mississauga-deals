'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fmtK, fmtNum } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';

const PAGE_SIZE = 30;
const FREE_LIMIT = 4;

export function ListingTable({ listings, isRegistered, compareIds, onToggleCompare }) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [listings]);

  if (listings.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
        <p className="text-sm text-slate-500">No properties match your filters</p>
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
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-cloud">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="sr-only">Compare</span>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Address</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Price</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Beds</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Score</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">DOM</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">CAP</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">$/SqFt</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Cash Flow</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pageListings.map((listing, index) => {
              const globalIndex = startIndex + index;
              const isGated = !isRegistered && globalIndex >= FREE_LIMIT;
              const scoreHex = scoreColorHex(listing.hamzaScore);

              return (
                <tr
                  key={listing.id}
                  className="transition-colors hover:bg-cloud/50"
                >
                  {/* Compare */}
                  <td className="px-4 py-3">
                    {!isGated && (
                      <input
                        type="checkbox"
                        checked={compareIds.includes(listing.id)}
                        onChange={() => onToggleCompare(listing.id)}
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/20"
                      />
                    )}
                  </td>

                  {/* Address */}
                  <td className="max-w-[200px] px-4 py-3">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="font-medium text-navy hover:text-accent transition-colors line-clamp-1"
                    >
                      {listing.address}
                    </Link>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 font-semibold text-navy">
                    {fmtK(listing.price)}
                  </td>

                  {/* Beds */}
                  <td className="px-4 py-3 text-slate-600">
                    {listing.beds}/{listing.baths}
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3 text-slate-600 capitalize">
                    {listing.type}
                  </td>

                  {/* Score */}
                  <td className={`px-4 py-3 ${isGated ? 'select-none blur-sm' : ''}`}>
                    {!isGated ? (
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: scoreHex }}
                      >
                        {listing.hamzaScore}
                      </span>
                    ) : (
                      <span className="text-slate-300">--</span>
                    )}
                  </td>

                  {/* DOM */}
                  <td className={`px-4 py-3 text-slate-600 ${isGated ? 'select-none blur-sm' : ''}`}>
                    {listing.dom}
                  </td>

                  {/* CAP */}
                  <td className={`px-4 py-3 text-slate-600 ${isGated ? 'select-none blur-sm' : ''}`}>
                    {listing.capRate.toFixed(1)}%
                  </td>

                  {/* $/SqFt */}
                  <td className={`px-4 py-3 text-slate-600 ${isGated ? 'select-none blur-sm' : ''}`}>
                    {listing.pricePerSqFt > 0 ? '$' + listing.pricePerSqFt : 'N/A'}
                  </td>

                  {/* Cash Flow */}
                  <td className={`px-4 py-3 ${isGated ? 'select-none blur-sm' : ''}`}>
                    <span className={listing.cashFlow >= 0 ? 'text-success font-semibold' : 'text-red-500 font-semibold'}>
                      {fmtNum(listing.cashFlow)}
                    </span>
                  </td>

                  {/* Tags */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {listing.hasSuite && (
                        <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-success">
                          Suite
                        </span>
                      )}
                      {listing.lrtAccess && (
                        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent">
                          LRT
                        </span>
                      )}
                      {listing.priceDrop > 0 && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-500">
                          Reduced
                        </span>
                      )}
                    </div>
                    {isGated && (
                      <Link
                        href="/signup"
                        className="mt-1 inline-block text-[10px] font-semibold text-accent hover:underline"
                      >
                        Sign up to unlock
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
