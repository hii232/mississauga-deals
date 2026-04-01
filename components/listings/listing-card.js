'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fmtK, fmtNum } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';

export function ListingCard({ listing, isGated, isCompared, onToggleCompare, batchPhoto, onSignupClick }) {
  const [saved, setSaved] = useState(false);

  // Initialize saved state from localStorage
  useEffect(() => {
    const savedDeals = JSON.parse(localStorage.getItem('saved_deals') || '[]');
    setSaved(savedDeals.includes(listing.id));
  }, [listing.id]);

  function toggleSave() {
    const savedDeals = JSON.parse(localStorage.getItem('saved_deals') || '[]');
    if (savedDeals.includes(listing.id)) {
      const updated = savedDeals.filter((id) => id !== listing.id);
      localStorage.setItem('saved_deals', JSON.stringify(updated));
      setSaved(false);
    } else {
      savedDeals.push(listing.id);
      localStorage.setItem('saved_deals', JSON.stringify(savedDeals));
      setSaved(true);
    }
  }

  // Use listing photos if available, otherwise use batch-fetched first photo
  const photo = listing.photos?.[0] || batchPhoto || null;
  const scoreHex = scoreColorHex(listing.hamzaScore);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
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

        {/* Score badge — always visible */}
        <div
          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ${isGated ? 'blur-[5px] select-none' : ''}`}
          style={{ backgroundColor: scoreHex }}
        >
          {listing.hamzaScore}
        </div>
        {isGated && (
          <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-600/80 text-white shadow-md">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
        )}

        {/* Tags row */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {listing.basementTier === 'legal' && (
            <span className="rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              Legal Suite
            </span>
          )}
          {listing.basementTier === 'potential' && (
            <span className="rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              Suite Potential
            </span>
          )}
          {listing.basementTier === 'finished' && (
            <span className="rounded-full bg-slate-500/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              Fin. Basement
            </span>
          )}
          {listing.lrtAccess && (
            <span className="rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              LRT
            </span>
          )}
          {listing.cashFlow > 0 && (
            <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              Cash Flowing
            </span>
          )}
          {listing.priceDrop > 0 && (
            <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              Price Drop -{listing.priceDrop.toFixed(0)}%
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
          <div className="grid grid-cols-4 gap-2 rounded-lg bg-cloud p-2.5 text-center">
            <div>
              <p className="text-[10px] font-medium uppercase text-slate-400">DOM</p>
              <p className="text-sm font-bold text-navy">{listing.dom}</p>
            </div>
            {isGated ? (
              <>
                <div className="select-none blur-[6px]">
                  <p className="text-[10px] font-medium uppercase text-slate-400">CAP</p>
                  <p className="text-sm font-bold text-navy">{listing.capRate.toFixed(1)}%</p>
                </div>
                <div className="select-none blur-[6px]">
                  <p className="text-[10px] font-medium uppercase text-slate-400">CoC</p>
                  <p className="text-sm font-bold text-navy">{listing.cashOnCash.toFixed(1)}%</p>
                </div>
                <div className="select-none blur-[6px]">
                  <p className="text-[9px] font-medium text-slate-400">Cash Flow/mo</p>
                  <p className="text-sm font-bold text-emerald-500">{fmtNum(listing.cashFlow)}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[10px] font-medium uppercase text-slate-400">CAP</p>
                  <p className="text-sm font-bold text-navy">{listing.capRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase text-slate-400">CoC</p>
                  <p className="text-sm font-bold text-navy">{listing.cashOnCash.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[9px] font-medium text-slate-400" title="Cash Flow per Month">Cash Flow/mo</p>
                  <p className={`text-sm font-bold ${listing.cashFlow > 0 ? 'text-emerald-500' : listing.cashFlow === 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                    {fmtNum(listing.cashFlow)}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Gated CTA overlay — inline signup trigger */}
          {isGated && (
            <div className="mt-1.5 text-center">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSignupClick?.(); }}
                className="text-[11px] font-medium text-accent hover:text-accent/80 cursor-pointer bg-transparent border-none"
              >
                Unlock deal analysis — free, 10 seconds →
              </button>
            </div>
          )}
        </div>

        {/* Transit & School Scores */}
        {(listing.transitScore > 0 || listing.schoolScore > 0) && (
          <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-500">
            {listing.transitScore > 0 && (
              <span title="Transit Score — proximity to GO, LRT, MiWay, highways">
                🚇 Transit: <span className="font-semibold text-navy">{listing.transitScore}/10</span>
              </span>
            )}
            {listing.schoolScore > 0 && (
              <span title="School Score — school quality ratings in the area">
                🏫 Schools: <span className="font-semibold text-navy">{listing.schoolScore}/10</span>
              </span>
            )}
          </div>
        )}

        {/* Rent and mortgage */}
        {!isGated && (
          <div className="mt-2 space-y-0.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Rent est: {fmtK(listing.estimatedRent * 12).replace('/mo', '')}/yr</span>
              <span>Mortgage: {fmtK(listing.monthlyExpenses * 12).replace('/mo', '')}/yr</span>
            </div>
            {listing.basementIncome > 0 && (
              <p className="text-[10px] text-success font-medium">
                Incl. +${listing.basementIncome.toLocaleString()}/mo basement income
              </p>
            )}
          </div>
        )}

        {/* Actions — always visible */}
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
            onClick={toggleSave}
            className={`flex items-center gap-1 text-xs transition-colors ${saved ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
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
      </div>
    </div>
  );
}
