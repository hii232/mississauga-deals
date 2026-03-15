'use client';

import Link from 'next/link';
import { fmtK, fmtNum } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';

const FREE_LIMIT = 5;

export function ListingTable({ listings, isRegistered, compareIds, onToggleCompare }) {
  if (listings.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
        <p className="text-sm text-slate-500">No properties match your filters</p>
      </div>
    );
  }

  return (
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
          {listings.map((listing, index) => {
            const isGated = !isRegistered && index >= FREE_LIMIT;
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

                {/* CoC */}
                <td className={`px-4 py-3 text-slate-600 ${isGated ? 'select-none blur-sm' : ''}`}>
                  {listing.cashOnCash.toFixed(1)}%
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
  );
}
