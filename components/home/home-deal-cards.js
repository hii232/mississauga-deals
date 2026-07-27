'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { scoreColorHex } from '@/lib/deal-score';
import { fmtK, formatAddress } from '@/lib/utils/format';

// A malformed deal (missing/NaN derived number) must NEVER crash a card and
// blank the whole homepage deal section. Format defensively — dash, never NaN.
const pct1 = (v) => (typeof v === 'number' && isFinite(v) ? v.toFixed(1) + '%' : '—');

export function HomeDealCards({ deals, photoMap }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const registered = typeof window !== 'undefined' && localStorage.getItem('user_registered') === 'true';
    setIsAuthenticated(registered);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
      {deals.map((deal, i) => {
        const photo = typeof photoMap[deal.id] === 'string' ? photoMap[deal.id] : photoMap[deal.id]?.[0] || null;
        // The #1 deal is the same property the hero card shows with its cap
        // rate and cash flow fully visible. Locking it here meant asking a
        // visitor to sign up to see numbers they had just read one scroll
        // earlier — which reads as broken, not as a gate. It stays open as the
        // deliberate free sample; everything after it is gated.
        return (
          <HomeDealCard
            key={deal.id}
            deal={deal}
            photo={photo}
            isGated={!isAuthenticated && i > 0}
            priority={i === 0}
          />
        );
      })}
    </div>
  );
}

function HomeDealCard({ deal, photo, isGated, priority }) {
  const scoreHex = scoreColorHex(deal.hamzaScore);
  const score = Number.isFinite(deal.hamzaScore) ? deal.hamzaScore : null;
  const cf = Number.isFinite(deal.cashFlow) ? deal.cashFlow : null;

  return (
    <Link
      href={`/listings/${deal.id}`}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-accent/20 hover:shadow-lg transition-all duration-300 no-underline"
    >
      <div className="relative h-32 sm:h-44 w-full overflow-hidden bg-slate-100">
        {photo ? (
          <Image
            src={photo}
            alt={`${deal.address} — ${deal.beds ? deal.beds + " bed " : ""}${deal.subType || deal.type || "property"} for sale in ${deal.neighbourhood || "Mississauga"}`}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
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
          {score == null ? '—' : score}
        </div>
        {/* Freshness cue — honest "New" from real days-on-market (1–7d; dom=0 is
            the missing-data fallback, so it's excluded to avoid false positives) */}
        {deal.dom >= 1 && deal.dom <= 7 && (
          <div className="absolute left-1.5 top-1.5 sm:left-2 sm:top-2 rounded-full bg-accent px-1.5 sm:px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
            New
          </div>
        )}
        {/* Investor tags.
            These carry real investor information — a legal suite, a price cut,
            a stale listing — so they have to be legible, and measured at 375px
            they were not: white on bg-success/90 is 2.4:1 and white on
            amber-500/90 or gold/90 is 2.1:1, against the 4.5:1 AA needs for
            10px text. An earlier sweep skipped these as "chips over a photo,
            meaningless to measure", but that was the wrong call — the chip
            carries its OWN background, so the photo barely shows through and
            the ratio is real.
            Now fully opaque (a translucent chip over an arbitrary photo has
            unpredictable contrast; opaque guarantees it whatever the picture)
            and darkened: emerald-700 = 5.5:1, amber-700 = 5.0:1. Note the
            brand's own gold-dark still fails at 3.2:1, so it is not an option
            here; `gold` and `amber-500` are the same hex today, so mapping
            both to amber-700 keeps them as alike as they already were. */}
        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 flex flex-wrap gap-1">
          {(deal.basementTier === 'legal' || deal.basementTier === 'potential') && (
            <span className="rounded-full bg-emerald-700 px-1.5 sm:px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Suite
            </span>
          )}
          {deal.priceDrop > 0 && (
            <span className="rounded-full bg-amber-700 px-1.5 sm:px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Reduced
            </span>
          )}
          {deal.dom >= 45 && (
            <span className="rounded-full bg-amber-700 px-1.5 sm:px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Motivated
            </span>
          )}
        </div>
      </div>
      <div className="p-2.5 sm:p-4">
        <p className="text-xs sm:text-sm font-semibold text-navy truncate">{formatAddress(deal.address)}</p>
        <p className="text-[10px] sm:text-xs text-muted truncate">{deal.neighbourhood || deal.city}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-base sm:text-lg font-bold text-navy">{fmtK(deal.price)}</p>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-navy/70">
            {deal.subType || deal.type}
          </span>
        </div>
        <p className="text-[10px] sm:text-xs text-muted mt-0.5">{deal.beds} bed · {deal.baths} bath</p>

        {/* Metrics — gated for anonymous */}
        <div className="mt-2 sm:mt-3 grid grid-cols-3 gap-1 text-center rounded-lg bg-cloud p-1.5 sm:p-2">
          {/* CAP and the deal score are NEVER gated. The hero card on this
              same page prints a cap rate in full, so locking it on the card
              below showed a visitor two different answers for one property and
              read as a trick rather than a teaser. Cap rate and score are the
              proof the platform works — they earn the signup. Only the monthly
              cash-flow figure (and, on the listing page, the full breakdown,
              BRRR projection and alerts) sits behind the gate. */}
          <div>
            <p className="text-[10px] font-medium uppercase text-slate-500">CAP</p>
            <p className="text-[11px] sm:text-xs font-bold text-navy">{pct1(deal.capRate)}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500">Cash Flow/mo</p>
            {isGated ? (
              <p className="text-[11px] sm:text-xs font-bold text-accent" aria-label="Sign up free to see monthly cash flow">
                Free
              </p>
            ) : (
              <p className={`text-[11px] sm:text-xs font-bold ${cf == null ? 'text-slate-500' : cf >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {cf == null ? '—' : `${cf >= 0 ? '+' : '-'}$${Math.abs(Math.round(cf))}`}
              </p>
            )}
          </div>
          <div>
            {/* dom 0 = unknown (feed withholds it on active listings) — show
                what we DO know, days since the record changed, never a bare 0
                that reads as "listed today". */}
            <p className="text-[10px] font-medium uppercase text-slate-500">{deal.dom >= 1 ? 'DOM' : 'Updated'}</p>
            <p className="text-[11px] sm:text-xs font-bold text-navy">
              {deal.dom >= 1 ? deal.dom : Number.isFinite(deal.daysSinceUpdate) ? (deal.daysSinceUpdate === 0 ? 'Today' : `${deal.daysSinceUpdate}d`) : '—'}
            </p>
          </div>
        </div>
        {/* The assumption behind the CAP shown above — now rendered for gated
            cards too, because a cap rate with a hidden rent assumption is the
            unverifiable number the whole rent-assumption work set out to fix.
            Short form only: these cards render two-up at 375px, so the full
            main+suite breakdown lives on the listing page. */}
        {deal.estimatedRent > 0 && (
          <p className="mt-1.5 text-center text-[10px] text-slate-500">
            Assumes ${Math.round(deal.estimatedRent).toLocaleString()}/mo rent
            {deal.basementIncome > 0 ? ' incl. suite' : deal.unitCount >= 2 ? ` · ${deal.unitCount} units` : ''}
          </p>
        )}
        {isGated && (
          <p className="mt-1 text-center text-[10px] sm:text-[11px] font-medium text-accent">
            Sign up free for monthly cash flow
          </p>
        )}
      </div>
    </Link>
  );
}
