'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { fmtK, fmtNum } from '@/lib/utils/format';
import { computeScreenerMetrics, resolveScreenerMetrics } from '@/lib/listings/screener-metrics';

// ── Animated Counter Hook ──
// Starts AT the target, not 0: this dashboard is server-rendered (the target
// is computed from real listings at SSR time), so a useState(0) initial value
// made every stat - Total Deals, CF+ Deals, Best Cap, Best Cash Flow, Avg
// Score - render as a literal "0" in the HTML a crawler or a fast screenshot
// sees, directly beside listing cards showing real numbers. requestAnimationFrame
// never runs on the server, so that zero was never overwritten until the
// client's first animation frame landed. Skips the count-up animation on
// mount (nothing to animate - SSR already has the real number) but still
// animates smoothly when the target later changes (filters, async data
// arriving on a cold client-side start), which is the effect this was for.
function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(target);
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (!target && target !== 0) { setValue(0); return; }
    if (isFirstRun.current) {
      isFirstRun.current = false;
      setValue(target);
      return;
    }
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// ── Format helper ──
function formatValue(val, fmt) {
  switch (fmt) {
    case 'price':
      return fmtK(Math.round(val));
    case 'cf':
      return fmtNum(Math.round(val));
    case 'cfPlain':
      return fmtNum(Math.round(val));
    case 'score':
      return val.toFixed(1);
    case 'pct':
      return val.toFixed(1) + '%';
    case 'int':
    default:
      return Math.round(val).toLocaleString();
  }
}

// ── Opportunity Stat Card (Row 1) ──
// value === null means "not known yet" - see PARTIAL_SET_WITHHELD in
// lib/listings/screener-metrics.js. It renders a skeleton, never a number: a
// placeholder costs a visitor a second of patience, a wrong headline costs the
// lead. The tile keeps its exact box so nothing shifts when the figure lands.
function OpportunityStat({ label, value, format, subtitle, color, delay }) {
  const pending = value === null || value === undefined;
  const animatedVal = useCountUp(pending ? 0 : value, 600);
  const displayVal = formatValue(animatedVal, format);

  const colorMap = {
    // Left border stays the brighter accent (decorative); the value text uses the
    // darker shade so the headline number itself clears WCAG AA on white.
    green: { border: 'border-l-emerald-500', text: 'text-emerald-600' },
    amber: { border: 'border-l-amber-500', text: 'text-amber-600' },
    neutral: { border: 'border-l-slate-300', text: 'text-navy' },
  };
  const c = colorMap[color] || colorMap.neutral;

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-slate-100 bg-white pl-0 transition-all duration-200 hover:shadow-sm hover:border-slate-200 opacity-0 animate-fadeUp"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Colored left border */}
      <div className={`border-l-[3px] ${c.border} h-full px-3 py-2.5`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500 mb-0.5">
          {label}
        </p>
        {/* h-7 == the text-xl line box below it, so the figure landing does not
            nudge the card. Matters most at 375px, where these tiles are two to
            a row and any reflow moves the whole dashboard. */}
        {pending ? (
          <div className="flex h-7 items-center" aria-hidden="true">
            <div className="h-[18px] w-16 animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <p className={`font-mono text-xl font-bold tracking-tight ${c.text}`}>
            {displayVal}
          </p>
        )}
        <p className="text-[10px] text-slate-500">{pending ? 'analyzing…' : subtitle}</p>
      </div>
    </div>
  );
}

// ── Context Stat Card (Row 2) ──
function ContextStat({ label, value, format, icon, delay }) {
  const pending = value === null || value === undefined;
  return (
    <div
      className="flex items-center gap-2.5 rounded-md bg-slate-50/80 px-3 py-2 transition-colors duration-150 hover:bg-slate-100/80 opacity-0 animate-fadeUp"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <span className="flex-none text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">
          {label}
        </p>
        {pending ? (
          <div className="flex h-5 items-center" aria-hidden="true">
            <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
          </div>
        ) : (
          <p className="font-mono text-sm font-bold text-navy truncate">
            {formatValue(value, format)}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──
// analysisComplete: the container has finished loading EVERY page of the feed,
//   so `listings` is the whole market (or the user's filtered slice of it).
//   It is an explicit signal, not `listings.length < marketTotal` - that
//   comparison is false forever the moment any filter is applied, so it could
//   never have distinguished "still loading" from "narrowed to 40 results".
// loadedCount: rows loaded so far, BEFORE filtering - the honest progress
//   numerator for the "N of M analyzed" chip.
// summary: whole-market aggregate computed server-side over the entire feed
//   (see /api/market-stats). Present only when no filters are active, because
//   it describes the whole market and nothing narrower.
export function DealScreener({ listings, loading = false, marketTotal = 0, analysisComplete = true, loadedCount = 0, summary = null }) {
  const [soldStats, setSoldStats] = useState(null);
  const [showPortfolio, setShowPortfolio] = useState(false);

  // Fetch sold market stats - SCOPED to the page's city so a GTA page doesn't
  // show Mississauga sold data. /listings → Mississauga; /gta?city=X → that
  // city; the /gta "All GTA" hub has no single city, so skip the sold stat
  // rather than show a misleading one.
  useEffect(() => {
    let city = 'Mississauga';
    if (typeof window !== 'undefined') {
      const c = (new URLSearchParams(window.location.search).get('city') || '').trim();
      const onGta = window.location.pathname.startsWith('/gta');
      if (onGta && !c) return; // All-GTA hub - no single-city sold data
      if (onGta && c) city = c;
    }
    fetch(`/api/sold-comps?limit=20&city=${encodeURIComponent(city)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.stats) setSoldStats(data.stats);
      })
      .catch(() => {});
  }, []);

  // Aggregate of what is actually loaded. Shared with the server-side
  // whole-market summary so the two can never disagree about the same market.
  const loadedMetrics = useMemo(() => computeScreenerMetrics(listings), [listings]);

  // …and then the decision about what may be PRESENTED. See
  // lib/listings/screener-metrics.js - on an incomplete set the set-dependent
  // figures either come from the server's whole-market aggregate or are
  // withheld entirely (null → skeleton). Nothing final-looking is ever shown
  // for a partial sample.
  const { metrics, state } = useMemo(
    () => resolveScreenerMetrics(loadedMetrics, { analysisComplete, summary }),
    [loadedMetrics, analysisComplete, summary]
  );
  const stillLoading = state !== 'complete';
  // In 'market' state every tile describes the whole market, so the chip must
  // quote the SAME population - quoting loaded-so-far beside market-wide tiles
  // would put two counts for one fact on one bar.
  const progressLabel = state === 'partial' && marketTotal > 0
    ? `${loadedCount.toLocaleString()} of ${marketTotal.toLocaleString()} analyzed`
    : `${metrics.total.toLocaleString()} analyzed`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
      {/* ── Header Bar ── */}
      <div className="bg-gradient-to-r from-navy to-navy/90 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-xs font-bold text-white">Deal Screener</h2>
            <button
              onClick={() => setShowPortfolio(!showPortfolio)}
              className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-white/70 hover:bg-white/20 transition-colors cursor-pointer"
            >
              Portfolio Analytics {showPortfolio ? '▲' : '▼'}
            </button>
          </div>

          {listings.length > 0 && (
            <div className="flex items-center gap-1.5">
              {/* A count over the loaded slice, so it is withheld on a partial
                  set exactly like the tiles below - it read "12 suites" and
                  then "180 suites" on the same page load. */}
              {metrics.suites !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono font-medium text-white/80">
                  <span className="h-1 w-1 rounded-full bg-success animate-pulse" />
                  {metrics.suites.toLocaleString()} suites
                </span>
              )}
              {/* The server renders only the FIRST page of inventory (the rest
                  streams in client-side), so this used to read "198 analyzed"
                  in the HTML - which is what a crawler, and any audit tool that
                  does not run JS, permanently sees. Stating the real market
                  size alongside what is loaded keeps it honest at every moment:
                  no partial load is ever presented as the whole market, and the
                  true coverage figure is in the server-rendered markup. */}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono font-medium text-white/80">
                <span className={`h-1 w-1 rounded-full bg-accent${stillLoading ? ' animate-pulse' : ''}`} />
                {progressLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Body - never show an all-zero dashboard: skeleton while loading,
          plain message when filters match nothing ── */}
      {listings.length === 0 ? (
        <div className="px-4 py-4">
          {/* "No deals match your current filters" is itself a claim about the
              whole market, and it is false while the market is still arriving -
              a filter that matches 40 listings matches none of the first 30. */}
          {loading || !analysisComplete ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 animate-pulse">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : (
            <p className="py-2 text-center text-sm text-muted">
              No deals match your current filters - try widening the price range or clearing a filter.
            </p>
          )}
        </div>
      ) : (
      <div className="px-4 py-3 space-y-2.5">
        {/* ROW 1: OPPORTUNITY DASHBOARD - No red numbers, all positive/neutral */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <OpportunityStat
            label="Total Deals"
            value={metrics.total}
            format="int"
            subtitle="analyzed"
            color="neutral"
            delay={0}
          />
          <OpportunityStat
            label="CF+ DEALS"
            value={metrics.cfPlusCount}
            format="int"
            subtitle="cash flowing"
            color="green"
            delay={60}
          />
          <OpportunityStat
            label="Best Cap"
            value={metrics.bestCap}
            format="pct"
            subtitle="top yield"
            color="green"
            delay={120}
          />
          <OpportunityStat
            label="Best Cash Flow"
            value={metrics.bestCf}
            format="cf"
            subtitle="highest cash flow"
            color="green"
            delay={180}
          />
          {/* null (unknown) still renders - as a skeleton. Only a KNOWN zero
              hides the tile, which is the pre-existing behaviour. */}
          {(metrics.priceDropCount === null || metrics.priceDropCount > 0) && (
            <OpportunityStat
              label="Price Drops"
              value={metrics.priceDropCount}
              format="int"
              subtitle="motivated"
              color="amber"
              delay={240}
            />
          )}
          <OpportunityStat
            label="Avg Score"
            value={metrics.avgScore}
            format="score"
            subtitle="all deals"
            color="neutral"
            delay={300}
          />
        </div>

        {/* ROW 2: MARKET CONTEXT - Smaller, informational */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <ContextStat label="Total Listings" value={metrics.total} format="int" delay={340} icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          } />
          <ContextStat label="Avg Price" value={metrics.avgPrice} format="price" delay={380} icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } />
          <ContextStat label="Avg Rent" value={metrics.avgRent} format="price" delay={420} icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          } />
          {metrics.avgDom > 0 && <ContextStat label="Avg DOM" value={metrics.avgDom} format="int" delay={460} icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } />}
          {soldStats && soldStats.avgSoldPrice > 0 && (
            <ContextStat label="Avg Sold" value={soldStats.avgSoldPrice} format="price" delay={500} icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            } />
          )}
          {soldStats && soldStats.avgSoldPrice > 0 && (
            <ContextStat
              label="Sale-to-List"
              value={100 + (soldStats.avgNegotiationGap || 0)}
              format="pct"
              delay={540}
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              }
            />
          )}
        </div>

        {/* PORTFOLIO ANALYTICS - Collapsible, shows avg CF and avg CoC (the negative numbers) */}
        {showPortfolio && (
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-2">
            {/* The heading claims "Full Dataset" - so it may only say that
                once there IS a full dataset. */}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {state === 'partial'
                ? 'Portfolio Analytics - still analyzing the market'
                : 'Portfolio Analytics - Full Dataset Averages'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-[10px] uppercase text-slate-500 font-medium">Avg Cash Flow</p>
                <p className={`font-mono text-sm font-bold ${metrics.avgCf === null ? 'text-slate-400' : metrics.avgCf >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {metrics.avgCf === null ? '-' : `${formatValue(metrics.avgCf, 'cfPlain')}/mo`}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase text-slate-500 font-medium">Avg CoC Return</p>
                <p className={`font-mono text-sm font-bold ${metrics.avgCoc === null ? 'text-slate-400' : metrics.avgCoc >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {Number.isFinite(metrics.avgCoc) ? metrics.avgCoc.toFixed(1) + '%' : '-'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase text-slate-500 font-medium">Avg Score</p>
                <p className="font-mono text-sm font-bold text-navy">{Number.isFinite(metrics.avgScore) ? metrics.avgScore.toFixed(1) + '/10' : '-'}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase text-slate-500 font-medium">Legal Suites</p>
                <p className="font-mono text-sm font-bold text-navy">{metrics.suites === null ? '-' : metrics.suites.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Scores measure estimated investment return potential only - not property quality or desirability.
          A low score does not mean the property is undesirable.{' '}
          <Link href="/score-methodology" className="text-accent hover:underline no-underline">
            How the score works →
          </Link>
        </p>
      </div>
      )}
    </div>
  );
}
