'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fmtK, fmtNum } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';
import { HOOD_DATA } from '@/lib/constants';

const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-');

// A malformed listing (missing/NaN derived number) must NEVER crash the card and
// blank the whole listings grid. Format defensively; show a dash, never NaN.
const pct1 = (v) => (typeof v === 'number' && isFinite(v) ? v.toFixed(1) + '%' : '—');
const money = (v) => (typeof v === 'number' && isFinite(v) ? v.toLocaleString() : '—');

/**
 * The rent every metric on the card is derived from, stated plainly.
 *
 * A 6.9% cap rate on a 7-bed Malton detached looks like fantasy until you can
 * see it assumes ~$3,900 for the main unit plus ~$2,000 for a legal basement —
 * a normal Malton structure, not per-bedroom rooming-house math. Showing the
 * split is the difference between a number an investor can audit and one they
 * dismiss. Renders nothing if we have no rent, rather than inventing one.
 */
// Alt text for a listing photo. A bare address tells an image-search crawler
// (and a screen-reader user) nothing about what the picture shows; these
// images only entered the HTML when /listings became server-rendered, so
// they are newly worth describing. Every part is optional — a listing missing
// beds or type simply yields a shorter sentence, never "undefined".
function photoAlt(listing) {
  const bits = [];
  if (listing.beds) bits.push(`${listing.beds} bed`);
  if (listing.baths) bits.push(`${listing.baths} bath`);
  const specs = bits.join(' ');
  const kind = listing.subType || listing.type || 'property';
  const where = listing.neighbourhood && listing.neighbourhood !== listing.city
    ? `${listing.neighbourhood}, ${listing.city || 'Mississauga'}`
    : (listing.city || 'Mississauga');
  return `${listing.address} — ${[specs, kind].filter(Boolean).join(' ')} for sale in ${where}`;
}

function RentAssumption({ listing }) {
  const rent = Number(listing.estimatedRent);
  if (!Number.isFinite(rent) || rent <= 0) return null;

  const money = (n) => '$' + Math.round(n).toLocaleString();
  const basement = Number(listing.basementIncome) || 0;
  const base = Number(listing.baseRent) || 0;
  const units = Array.isArray(listing.unitBreakdown) ? listing.unitBreakdown : null;

  // How the total was built, when we know. Multi-unit and suite properties are
  // exactly the listings whose totals look implausible without the breakdown.
  let breakdown = null;
  if (units && units.length > 1) {
    breakdown = `${units.length} units`;
  } else if (basement > 0 && base > 0) {
    breakdown = `${money(base)} main + ${money(basement)} ${listing.basementTier === 'legal' ? 'legal ' : ''}suite`;
  }

  // The feed never supplies a real condo fee (see IMPROVEMENT_BACKLOG) — CAP
  // and cash flow below are computed on a bedroom/sqft estimate for every
  // condo/apt listing. The card's own breakdown line already labels this
  // "Condo Fee (est.)"; this is the same disclosure at the point where a
  // visitor is told "every figure below assumes" the numbers on this card.
  const condoNote = listing.condoFeeEstimated;

  return (
    <div className="mb-3 rounded-lg border border-accent/15 bg-accent/[0.04] px-2.5 py-1.5">
      <p className="text-[11px] leading-tight text-navy">
        <span className="font-semibold">Est. rent {money(rent)}/mo</span>
        {breakdown && <span className="text-slate-500"> · {breakdown}</span>}
      </p>
      <p className="text-[10px] leading-tight text-slate-500">
        Every figure below assumes this rent{condoNote ? ' and an estimated condo fee' : ''}
      </p>
    </div>
  );
}

export function ListingCard({ listing, isGated, isCompared, onToggleCompare, batchPhoto, onSignupClick, belowMarketCutoff = -3, priority = false }) {
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
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-accent/30 hover:shadow-lg">
      {/* Photo — links to detail page */}
      <Link href={`/listings/${listing.id}`} className="relative block h-48 w-full overflow-hidden">
        {photo ? (
          <>
            {/* Shimmer under the image while it loads. A cold TRREB photo can
                take seconds (or, under upstream throttle, much longer), and
                until now the card sat on flat white — which reads as broken.
                The Image renders on top and simply covers this when painted;
                no state, no layout shift. */}
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 to-slate-200" aria-hidden="true" />
            <Image
              src={photo}
              alt={photoAlt(listing)}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
            </svg>
          </div>
        )}

        {/* Score badge — always visible (curiosity hook) */}
        <div
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
          style={{ backgroundColor: scoreHex }}
        >
          {typeof listing.hamzaScore === 'number' && isFinite(listing.hamzaScore) ? listing.hamzaScore : '—'}
        </div>

        {/* Freshness cue — honest "New" from real days-on-market. Only 1–7 days:
            dom=0 is the missing-data fallback (process-listings), so excluding it
            means the badge never false-positives on a listing of unknown age. */}
        {listing.dom >= 1 && listing.dom <= 7 && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden="true" />
            New
          </div>
        )}

        {/* Tags row. Every badge here was translucent (/90) white-on-colour over
            a photo — the same class of failure fixed on this card's "Cash
            Flowing" badge and the homepage's investor tags. Measured all four:
            `success` is the SAME hex as emerald-500 (#10B981, confirmed in
            tailwind.config.js) so "Legal Suite" had the identical 2.39:1
            failure already fixed elsewhere under a different token name —
            moved to opaque emerald-700 (5.48:1) to match. "Suite Potential"
            and "LRT" (bg-accent/90, #2563EB) measured 4.46:1, a near-miss just
            under AA — dropping the /90 alone is enough: opaque accent is
            5.17:1. "Fin. Basement" (bg-slate-500/90) measured 4.04:1; opaque
            slate-500 is 4.76:1, also enough without darkening. All four are
            fully opaque now, matching the established reasoning: a translucent
            chip over an arbitrary listing photo has unpredictable contrast and
            the opacity was buying nothing. */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {listing.basementTier === 'legal' && (
            <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Legal Suite
            </span>
          )}
          {listing.basementTier === 'potential' && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Suite Potential
            </span>
          )}
          {listing.basementTier === 'finished' && (
            <span className="rounded-full bg-slate-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Fin. Basement
            </span>
          )}
          {listing.lrtAccess && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              LRT
            </span>
          )}
          {listing.cashFlow > 0 && (
            // bg-emerald-500/90 composited over a light photo measured 2.39:1
            // for white text — the same failure fixed on the homepage's
            // investor-tag badges this morning, recurring here on the primary
            // /listings grid card. Opaque emerald-700 = 5.48:1, and opaque
            // avoids the unpredictable contrast a translucent chip has over an
            // arbitrary photo.
            <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Cash Flowing
            </span>
          )}
          {listing.priceDrop > 0 && (
            <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
              Price Drop -{Math.round(listing.priceDrop)}%
            </span>
          )}
          {/* The provable floor, matching the MOTIVATED filter chip's rule
              (filter-utils.js). Raw `dom` disagreed with the chip: the chip
              returns listings on domFloor >= 45, so a card could be IN the
              motivated result set, print "60+" in its own DOM cell, and still
              show no Motivated badge. The floor is a lower bound, which is
              exactly the evidence an "on market 45+ days" claim needs. */}
          {Math.max(listing.domFloor || 0, listing.dom || 0) >= 45 && (
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
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-navy">{fmtK(listing.price)}</p>
            {listing.estimatedValue > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                listing.evDiffPct <= belowMarketCutoff ? 'bg-emerald-100 text-emerald-700'
                  : listing.evDiffPct > 3 ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-600'
              }`}>
                {listing.evDiffPct <= belowMarketCutoff ? 'Below Market' : listing.evDiffPct > 3 ? 'Above Market' : 'At Market'}
              </span>
            )}
          </div>
          {listing.estimatedValue > 0 && !isGated && (
            <p className="text-[10px] text-slate-500">
              Est. value: <span className="font-semibold">{fmtK(listing.estimatedValue)}</span>
              {listing.evDiffPct !== 0 && (
                <span className={listing.evDiffPct < 0 ? 'text-emerald-700' : 'text-red-600'}>
                  {' '}({listing.evDiffPct > 0 ? '+' : ''}{listing.evDiffPct}%)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Bed/bath/type */}
        <div className="mb-1 flex items-center gap-3 text-xs text-slate-500">
          <span>{listing.beds} bed</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>{listing.baths} bath</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="capitalize">{listing.type}</span>
        </div>

        {/* Neighbourhood — linked to the investment guide for Mississauga hoods,
            plain text for GTA cities without a guide. The listing detail page
            already links here; matching that pattern on the card passes link
            equity from /listings (the site's highest-traffic page) to the 24
            established neighbourhood guide pages. */}
        <div className="mb-2 text-[10px] text-slate-500">
          {listing.neighbourhood && listing.neighbourhood !== listing.city
            ? (HOOD_DATA[listing.neighbourhood] ? (
                <Link
                  href={`/neighbourhoods/${slugify(listing.neighbourhood)}`}
                  className="hover:text-accent transition-colors"
                  title={`${listing.neighbourhood} investment guide`}
                >
                  {listing.neighbourhood}
                </Link>
              ) : listing.neighbourhood)
            : null}
          {listing.neighbourhood && listing.neighbourhood !== listing.city && listing.city && (
            <span>, {listing.city}</span>
          )}
          {(!listing.neighbourhood || listing.neighbourhood === listing.city) && listing.city && (
            <span>{listing.city}</span>
          )}
        </div>

        {/* The rent assumption every metric below is derived from. Hidden, a
            6.9% cap on a 7-bed detached reads as marketing math; shown with its
            main-unit + basement split, it's a claim an investor can check. This
            is never gated — the assumption must be auditable even before signup,
            or the numbers aren't credible in the first place. */}
        <RentAssumption listing={listing} />

        {/* Metrics row */}
        <div className="relative">
          <div className="grid grid-cols-4 gap-2 rounded-lg bg-cloud p-2.5 text-center">
            {/* dom 0 means UNKNOWN, not "listed today" — the feed withholds
                days-on-market on active listings (lib/listings/market-timing.js).
                Printing a bare 0 read as "brand new" on every card. When the
                real figure is missing we show a dash and, where we have it, the
                honest thing we DO know: how long since the listing last changed. */}
            {/* Real DOM plain; otherwise the provable minimum as "N+" (on
                market AT LEAST N days — see market-timing.js); dash when
                nothing is known. Never a bare fabricated number. */}
            <div>
              <p className="text-[10px] font-medium uppercase text-slate-500">DOM</p>
              <p className="text-sm font-bold text-navy">
                {listing.dom >= 1 ? listing.dom : listing.domFloor >= 1 ? `${listing.domFloor}+` : '—'}
              </p>
            </div>
            {/* CAP is never gated — see home-deal-cards: the same property's cap
                rate is printed elsewhere on the site, so locking it here showed
                two answers for one property. Cash-on-cash and monthly cash flow
                (the financed, assumption-heavy numbers) stay behind the gate. */}
            <div>
              <p className="text-[10px] font-medium uppercase text-slate-500">CAP</p>
              <p className="text-sm font-bold text-navy">{pct1(listing.capRate)}</p>
            </div>
            {isGated ? (
              <>
                {/* This used to print the literal word "Free" in the value
                    slot — same bold styling as a real number — so the row
                    read as "CoC: Free" / "Cash Flow/mo: Free", as if the
                    RETURN were free rather than the unlock being free. A
                    masked placeholder can't be misread as a figure. */}
                <div>
                  <p className="text-[10px] font-medium uppercase text-slate-500">CoC</p>
                  <p className="text-sm font-bold text-accent">••••</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-500">Cash Flow/mo</p>
                  <p className="text-sm font-bold text-accent">••••</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[10px] font-medium uppercase text-slate-500">CoC</p>
                  <p className="text-sm font-bold text-navy">{pct1(listing.cashOnCash)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-500" title="Cash Flow per Month">Cash Flow/mo</p>
                  <p className={`text-sm font-bold ${listing.cashFlow > 0 ? 'text-emerald-700' : listing.cashFlow === 0 ? 'text-blue-600' : 'text-red-600'}`}>
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
                See cash flow &amp; cash-on-cash — free, 10 sec →
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
            {listing.unitCount >= 2 && (
              <p className="text-[10px] text-accent font-medium">
                {listing.unitCount}-unit {listing.unitType} · {listing.unitBreakdown?.map((u, i) => `Unit ${i+1}: ${u.beds}bed $${(u.rent||0).toLocaleString()}`).join(' · ')}
              </p>
            )}
            {listing.basementIncome > 0 && !listing.unitCount && (
              <p className="text-[11px] text-emerald-700 font-medium">
                Incl. +${money(listing.basementIncome)}/mo basement income
              </p>
            )}
            {listing.condoFee > 0 && (
              <p className="text-[10px] text-amber-600 font-medium">
                Condo fee: ${money(listing.condoFee)}/mo{listing.condoFeeEstimated ? ' (est.)' : ''}
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
            className={`flex items-center gap-1 text-xs transition-colors ${saved ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
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
