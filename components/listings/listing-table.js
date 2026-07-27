'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fmtK, fmtNum, pct1 } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';

const PAGE_SIZE = 30;

// All listings gated for non-registered users

export function ListingTable({ listings, isRegistered, compareIds, onToggleCompare }) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [listings]);

  if (listings.length === 0) {
    // Same high-intent lead moment as the grid view — offer a deal alert rather
    // than dead-ending an investor whose specific search has no match right now.
    return (
      <div className="flex min-h-[16rem] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8">
        <div className="mx-auto max-w-sm text-center">
          <p className="text-sm font-semibold text-navy">No properties match your filters right now</p>
          <p className="mt-1 text-xs text-slate-500">
            New investment deals are added daily. Get a free alert and we&apos;ll email you the moment one matches your search.
          </p>
          <Link
            href="/alerts"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark no-underline"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            Get free deal alerts
          </Link>
          <p className="mt-3 text-xs text-slate-500">or adjust your search filters to see more</p>
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
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">CoC</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Cash Flow</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pageListings.map((listing, index) => {
              const isGated = !isRegistered;
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
                    {listing.dom >= 1 ? listing.dom : '—'}
                  </td>

                  {/* CAP */}
                  <td className={`px-4 py-3 text-slate-600 ${isGated ? 'select-none blur-sm' : ''}`}>
                    {pct1(listing.capRate)}
                  </td>

                  {/* CoC */}
                  <td className={`px-4 py-3 text-slate-600 ${isGated ? 'select-none blur-sm' : ''}`}>
                    {pct1(listing.cashOnCash)}
                  </td>

                  {/* Cash Flow */}
                  <td className={`px-4 py-3 ${isGated ? 'select-none blur-sm' : ''}`}>
                    <span className={listing.cashFlow >= 0 ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>
                      {fmtNum(listing.cashFlow)}
                    </span>
                  </td>

                  {/* Tags */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {listing.hasSuite && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                          Suite
                        </span>
                      )}
                      {listing.lrtAccess && (
                        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent">
                          LRT
                        </span>
                      )}
                      {listing.priceDrop > 0 && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-600">
                          Reduced
                        </span>
                      )}
                    </div>
                    {isGated && (
                      <Link
                        href="/signup"
                        className="mt-1 inline-block text-[10px] font-semibold text-accent hover:underline"
                      >
                        Unlock metrics — free, 10 sec
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
              <span key={`dot-${i}`} className="px-2 text-sm text-slate-500">...</span>
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

      <p className="py-4 text-center text-xs text-slate-500">
        Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, listings.length)} of {listings.length} properties
      </p>
    </div>
  );
}
