'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fmtK, fmtNum } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';

export function ListingCard({ listing, isGated, isCompared, onToggleCompare, batchPhoto }) {
  const [saved, setSaved] = useState(false);

  // Use listing photos if available, otherwise use batch-fetched first photo
  const photo = listing.photos?.[0] || batchPhoto || null;
  const scoreHex = scoreColorHex(listing.hamzaScore);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Photo — links to detail page */}
      <Link href={`/listings/${listing.id}`} className="relative block h-48 w-full overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={listing.address}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
            </svg>
          </div>
        )}

        {/* Score badge */}
        {!isGated && (
          <div
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
            style={{ backgroundColor: scoreHex }}
          >
            {listing.hamzaScore}
          </div>
        )}

        {/* Tags row */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {listing.hasSuite && (
            <span className="rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              Suite
            </span>
          )}
          {listing.lrtAccess && (
            <span className="rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              LRT
            </span>
          )}
          {listing.priceDrop > 0 && (
            <span className="rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              Reduced
            </span>
          )}
          {listing.dom >= 45 && (
            <span className="rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              Motivated
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Address and price */}
        <div className="mb-2">
          <Link
            href={`/listings/${listing.id}`}
            className="text-sm font-semibold text-navy hover:text-accent transition-colors line-clamp-1"
          >
            {listing.address}
          </Link>
          <p className="text-lg font-bold text-navy">{fmtK(listing.price)}</p>
        </div>

        {/* Bed/bath/type */}
        <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
          <span>{listing.beds} bed</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>{listing.baths} bath</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="capitalize">{listing.type}</span>
        </div>

        {/* Metrics row */}
        <div className="relative">
          <div className={`grid grid-cols-4 gap-2 rounded-lg bg-cloud p-2.5 text-center ${isGated ? 'select-none blur-sm pointer-events-none' : ''}`}>
            <div>
              <p className="text-[10px] font-medium uppercase text-slate-400">DOM</p>
              <p className="text-sm font-bold text-navy">{listing.dom}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase text-slate-400">CAP</p>
              <p className="text-sm font-bold text-navy">{listing.capRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase text-slate-400">$/SqFt</p>
              <p className="text-sm font-bold text-navy">{listing.pricePerSqFt > 0 ? '$' + listing.pricePerSqFt : 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase text-slate-400">CF</p>
              <p className={`text-sm font-bold ${listing.cashFlow >= 0 ? 'text-success' : 'text-red-500'}`}>
                {fmtNum(listing.cashFlow)}
              </p>
            </div>
          </div>

          {/* Gated CTA overlay */}
          {isGated && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Link
                href="/signup"
                className="rounded-lg bg-navy px-5 py-2.5 text-center text-sm font-semibold text-white shadow-md transition-colors hover:bg-navy/90 no-underline"
              >
                Sign up free to see deal analysis
              </Link>
              <p className="mt-1.5 text-[11px] text-slate-500">Takes 10 seconds. No credit card.</p>
            </div>
          )}
        </div>

        {/* Rent and mortgage */}
        {!isGated && (
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Rent est: {fmtK(listing.estimatedRent * 12).replace('/mo', '')}/yr</span>
            <span>Mortgage: {fmtK(listing.monthlyExpenses * 12).replace('/mo', '')}/yr</span>
          </div>
        )}

        {/* Actions */}
        {!isGated ? (
          <div className="mt-3 flex items-center justify-between">
            {/* Compare checkbox */}
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500 hover:text-navy">
              <input
                type="checkbox"
                checked={isCompared}
                onChange={() => onToggleCompare(listing.id)}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/20"
              />
              Compare
            </label>

            {/* Save button */}
            <button
              onClick={() => setSaved(!saved)}
              className="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-red-500"
              aria-label={saved ? 'Unsave' : 'Save'}
            >
              <svg
                className="h-4 w-4"
                fill={saved ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">Listed by: {listing.brokerage || 'Royal LePage Signature Realty'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
