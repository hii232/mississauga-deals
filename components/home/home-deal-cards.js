'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { scoreColorHex } from '@/lib/deal-score';
import { fmtK } from '@/lib/utils/format';

export function HomeDealCards({ deals, photoMap }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const registered = typeof window !== 'undefined' && localStorage.getItem('user_registered') === 'true';
    setIsAuthenticated(registered);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
      {deals.map((deal) => {
        const photo = typeof photoMap[deal.id] === 'string' ? photoMap[deal.id] : photoMap[deal.id]?.[0] || null;
        return (
          <HomeDealCard
            key={deal.id}
            deal={deal}
            photo={photo}
            isGated={!isAuthenticated}
          />
        );
      })}
    </div>
  );
}

function HomeDealCard({ deal, photo, isGated }) {
  const scoreHex = scoreColorHex(deal.hamzaScore);

  return (
    <Link
      href={`/listings/${deal.id}`}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-accent/20 hover:shadow-lg transition-all duration-300 no-underline"
    >
      <div className="relative h-32 sm:h-44 w-full overflow-hidden bg-slate-100">
        {photo ? (
          <img src={photo} alt={deal.address} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <svg className="h-8 w-8 sm:h-12 sm:w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
            </svg>
          </div>
        )}
        {/* Score badge */}
        <div
          className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xs sm:text-sm font-bold text-white shadow-lg"
          style={{ backgroundColor: scoreHex }}
        >
          {deal.hamzaScore}
        </div>
        {/* Investor tags */}
        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 flex flex-wrap gap-1">
          {(deal.basementTier === 'legal' || deal.basementTier === 'potential') && (
            <span className="rounded-full bg-success/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              Suite
            </span>
          )}
          {deal.priceDrop > 0 && (
            <span className="rounded-full bg-amber-500/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              Reduced
            </span>
          )}
          {deal.dom >= 45 && (
            <span className="rounded-full bg-gold/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              Motivated
            </span>
          )}
        </div>
      </div>
      <div className="p-2.5 sm:p-4">
        <p className="text-xs sm:text-sm font-semibold text-navy truncate">{deal.address}</p>
        <p className="text-[10px] sm:text-xs text-muted truncate">{deal.neighbourhood || deal.city}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-base sm:text-lg font-bold text-navy">{fmtK(deal.price)}</p>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-medium text-navy/70">
            {deal.subType || deal.type}
          </span>
        </div>
        <p className="text-[10px] sm:text-xs text-muted mt-0.5">{deal.beds} bed · {deal.baths} bath</p>

        {/* Metrics — gated for anonymous */}
        <div className="mt-2 sm:mt-3 grid grid-cols-3 gap-1 text-center rounded-lg bg-cloud p-1.5 sm:p-2">
          {isGated ? (
            <>
              <div>
                <p className="text-[8px] sm:text-[10px] font-medium uppercase text-slate-400">CAP</p>
                <p className="text-[11px] sm:text-xs font-bold text-slate-300">🔒</p>
              </div>
              <div>
                <p className="text-[7px] sm:text-[9px] font-medium text-slate-400">Cash Flow/mo</p>
                <p className="text-[11px] sm:text-xs font-bold text-slate-300">🔒</p>
              </div>
              <div>
                <p className="text-[8px] sm:text-[10px] font-medium uppercase text-slate-400">DOM</p>
                <p className="text-[11px] sm:text-xs font-bold text-navy">{deal.dom}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[8px] sm:text-[10px] font-medium uppercase text-slate-400">CAP</p>
                <p className="text-[11px] sm:text-xs font-bold text-navy">{deal.capRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[7px] sm:text-[9px] font-medium text-slate-400">Cash Flow/mo</p>
                <p className={`text-[11px] sm:text-xs font-bold ${deal.cashFlow >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                  {deal.cashFlow >= 0 ? '+' : '-'}${Math.abs(Math.round(deal.cashFlow))}
                </p>
              </div>
              <div>
                <p className="text-[8px] sm:text-[10px] font-medium uppercase text-slate-400">DOM</p>
                <p className="text-[11px] sm:text-xs font-bold text-navy">{deal.dom}</p>
              </div>
            </>
          )}
        </div>
        {isGated && (
          <p className="mt-1.5 text-center text-[9px] sm:text-[10px] font-medium text-accent">
            Sign up free to unlock deal metrics
          </p>
        )}
      </div>
    </Link>
  );
}
