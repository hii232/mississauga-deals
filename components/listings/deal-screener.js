'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { fmtK, fmtNum } from '@/lib/utils/format';

// ── Animated Counter Hook ──
function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target && target !== 0) { setValue(0); return; }
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
function OpportunityStat({ label, value, format, subtitle, color, delay }) {
  const animatedVal = useCountUp(value, 600);
  const displayVal = formatValue(animatedVal, format);

  const colorMap = {
    green: { border: 'border-l-emerald-500', text: 'text-emerald-500' },
    amber: { border: 'border-l-amber-500', text: 'text-amber-500' },
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
        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-400 mb-0.5">
          {label}
        </p>
        <p className={`font-mono text-xl font-bold tracking-tight ${c.text}`}>
          {displayVal}
        </p>
        <p className="text-[10px] text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Context Stat Card (Row 2) ──
function ContextStat({ label, value, format, icon, delay }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-md bg-slate-50/80 px-3 py-2 transition-colors duration-150 hover:bg-slate-100/80 opacity-0 animate-fadeUp"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <span className="text-base shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.05em] text-slate-400">
          {label}
        </p>
        <p className="font-mono text-sm font-bold text-navy truncate">
          {formatValue(value, format)}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ──
export function DealScreener({ listings }) {
  const [soldStats, setSoldStats] = useState(null);
  const [showPortfolio, setShowPortfolio] = useState(false);

  // Fetch sold market stats
  useEffect(() => {
    fetch('/api/sold-comps?limit=20')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.stats) setSoldStats(data.stats);
      })
      .catch(() => {});
  }, []);

  const metrics = useMemo(() => {
    if (!listings.length) {
      return {
        total: 0, avgPrice: 0, avgScore: 0, avgDom: 0, avgRent: 0,
        avgCf: 0, avgCoc: 0, bestCf: 0, bestCap: 0, cfPlusCount: 0,
        priceDropCount: 0, suites: 0,
      };
    }

    const sum = (fn) => listings.reduce((acc, l) => acc + fn(l), 0);
    const avg = (fn) => sum(fn) / listings.length;
    const cfPlusListings = listings.filter((l) => l.cashFlow > 0);
    const bestCfListing = listings.reduce((best, l) => l.cashFlow > best.cashFlow ? l : best);
    const bestCapListing = listings.reduce((best, l) => l.capRate > best.capRate ? l : best);
    const priceDropCount = listings.filter((l) => l.priceDrop > 0).length;

    return {
      total: listings.length,
      avgPrice: avg((l) => l.price),
      avgScore: avg((l) => l.hamzaScore),
      avgDom: avg((l) => l.dom),
      avgRent: avg((l) => l.estimatedRent),
      avgCf: avg((l) => l.cashFlow),
      avgCoc: avg((l) => l.cashOnCash),
      bestCf: bestCfListing.cashFlow,
      bestCap: bestCapListing.capRate,
      cfPlusCount: cfPlusListings.length,
      priceDropCount,
      suites: listings.filter((l) => l.hasSuite).length,
    };
  }, [listings]);

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

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono font-medium text-white/80">
              <span className="h-1 w-1 rounded-full bg-success animate-pulse" />
              {metrics.suites.toLocaleString()} suites
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono font-medium text-white/80">
              <span className="h-1 w-1 rounded-full bg-accent" />
              {metrics.total.toLocaleString()} analyzed
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-3 space-y-2.5">
        {/* ROW 1: OPPORTUNITY DASHBOARD — No red numbers, all positive/neutral */}
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
            label="CF+ Deals"
            value={metrics.cfPlusCount}
            format="int"
            subtitle="cash flow +"
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
          <OpportunityStat
            label="Price Drops"
            value={metrics.priceDropCount}
            format="int"
            subtitle="motivated"
            color="amber"
            delay={240}
          />
          <OpportunityStat
            label="Avg Score"
            value={metrics.avgScore}
            format="score"
            subtitle="all deals"
            color="neutral"
            delay={300}
          />
        </div>

        {/* ROW 2: MARKET CONTEXT — Smaller, informational */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <ContextStat label="Total Listings" value={metrics.total} format="int" icon="🏠" delay={340} />
          <ContextStat label="Avg Price" value={metrics.avgPrice} format="price" icon="💰" delay={380} />
          <ContextStat label="Avg Rent" value={metrics.avgRent} format="price" icon="🔑" delay={420} />
          <ContextStat label="Avg DOM" value={metrics.avgDom} format="int" icon="⏱" delay={460} />
          {soldStats && (
            <ContextStat label="Avg Sold" value={soldStats.avgSoldPrice} format="price" icon="✅" delay={500} />
          )}
          {soldStats && (
            <ContextStat
              label="Sale-to-List"
              value={100 + (soldStats.avgNegotiationGap || 0)}
              format="pct"
              icon="📊"
              delay={540}
            />
          )}
        </div>

        {/* PORTFOLIO ANALYTICS — Collapsible, shows avg CF and avg CoC (the negative numbers) */}
        {showPortfolio && (
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Portfolio Analytics — Full Dataset Averages
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-[9px] uppercase text-slate-400 font-medium">Avg Cash Flow</p>
                <p className={`font-mono text-sm font-bold ${metrics.avgCf >= 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {formatValue(metrics.avgCf, 'cfPlain')}/mo
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] uppercase text-slate-400 font-medium">Avg CoC Return</p>
                <p className={`font-mono text-sm font-bold ${metrics.avgCoc >= 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {metrics.avgCoc.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] uppercase text-slate-400 font-medium">Avg Score</p>
                <p className="font-mono text-sm font-bold text-navy">{metrics.avgScore.toFixed(1)}/10</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] uppercase text-slate-400 font-medium">Legal Suites</p>
                <p className="font-mono text-sm font-bold text-navy">{metrics.suites.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Scores measure estimated investment return potential only — not property quality or desirability.
          A low score does not mean the property is undesirable.{' '}
          <Link href="/score-methodology" className="text-accent hover:underline no-underline">
            How the score works →
          </Link>
        </p>
      </div>
    </div>
  );
}
