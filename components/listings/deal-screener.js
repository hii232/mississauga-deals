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
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// ── SVG Icons ──
function StarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

function TrendIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function TrophyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 0 1-2.27.977m-6.04 0a6.003 6.003 0 0 1-2.27-.977" />
    </svg>
  );
}

function ChartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function LayersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
    </svg>
  );
}

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function KeyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

// ── Hero Metric Card ──
function HeroCard({ label, value, format, color, icon: Icon, delay }) {
  const animatedVal = useCountUp(value, 600);
  const displayVal = formatValue(animatedVal, format);

  const colorMap = {
    accent: { bar: 'bg-accent', iconBg: 'bg-accent/10', iconText: 'text-accent' },
    success: { bar: 'bg-success', iconBg: 'bg-success/10', iconText: 'text-success' },
    danger: { bar: 'bg-danger', iconBg: 'bg-danger/10', iconText: 'text-danger' },
    gold: { bar: 'bg-gold', iconBg: 'bg-gold/10', iconText: 'text-gold' },
  };
  const c = colorMap[color] || colorMap.accent;

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-slate-100 bg-gradient-to-br from-white to-cloud px-3 py-2.5 transition-all duration-200 hover:shadow-sm hover:border-accent/20 opacity-0 animate-fadeUp"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Colored accent bar */}
      <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${c.bar}`} />

      <div className="pl-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
            {label}
          </p>
          <p className="font-mono text-lg font-bold text-navy tracking-tight truncate">
            {displayVal}
          </p>
        </div>
        <div className={`shrink-0 rounded-md ${c.iconBg} p-1.5`}>
          <Icon className={`h-4 w-4 ${c.iconText}`} />
        </div>
      </div>
    </div>
  );
}

// ── Context Metric Card ──
function ContextCard({ label, value, format, icon: Icon, delay }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-md bg-cloud/70 px-3 py-2 transition-colors duration-150 hover:bg-cloud opacity-0 animate-fadeUp"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="font-mono text-sm font-bold text-navy truncate">
          {formatValue(value, format)}
        </p>
      </div>
    </div>
  );
}

// ── Format helper ──
function formatValue(val, fmt) {
  switch (fmt) {
    case 'price':
      return fmtK(Math.round(val));
    case 'cf':
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

// ── Sold Icons ──
function SoldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
  );
}

function PercentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

// ── Main Component ──
export function DealScreener({ listings }) {
  const [soldStats, setSoldStats] = useState(null);

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
        total: 0,
        avgPrice: 0,
        avgScore: 0,
        avgDom: 0,
        avgRent: 0,
        avgCf: 0,
        avgCoc: 0,
        bestCf: 0,
        suites: 0,
        analyzed: 0,
      };
    }

    const sum = (fn) => listings.reduce((acc, l) => acc + fn(l), 0);
    const avg = (fn) => sum(fn) / listings.length;
    const bestCfListing = listings.reduce((best, l) =>
      l.cashFlow > best.cashFlow ? l : best
    );

    return {
      total: listings.length,
      avgPrice: avg((l) => l.price),
      avgScore: avg((l) => l.hamzaScore),
      avgDom: avg((l) => l.dom),
      avgRent: avg((l) => l.estimatedRent),
      avgCf: avg((l) => l.cashFlow),
      avgCoc: avg((l) => l.cashOnCash),
      bestCf: bestCfListing.cashFlow,
      suites: listings.filter((l) => l.hasSuite).length,
      analyzed: listings.length,
    };
  }, [listings]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
      {/* ── Navy Header Bar ── */}
      <div className="bg-gradient-to-r from-navy to-navy/90 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-xs font-bold text-white">Deal Screener</h2>
            <span className="hidden sm:inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
              Portfolio Analytics
            </span>
          </div>

          {/* Tier 3: Badge pills */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono font-medium text-white/80">
              <span className="h-1 w-1 rounded-full bg-success animate-pulse" />
              {metrics.suites.toLocaleString()} suites
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono font-medium text-white/80">
              <span className="h-1 w-1 rounded-full bg-accent" />
              {metrics.analyzed.toLocaleString()} analyzed
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-3 space-y-2.5">
        {/* Tier 1: Hero Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <HeroCard
            label="Avg Score"
            value={metrics.avgScore}
            format="score"
            color="accent"
            icon={StarIcon}
            delay={0}
          />
          <HeroCard
            label="Avg Cash Flow"
            value={metrics.avgCf}
            format="cf"
            color={metrics.avgCf >= 0 ? 'success' : 'danger'}
            icon={TrendIcon}
            delay={80}
          />
          <HeroCard
            label="Best CF"
            value={metrics.bestCf}
            format="cf"
            color="gold"
            icon={TrophyIcon}
            delay={160}
          />
          <HeroCard
            label="Avg CoC"
            value={metrics.avgCoc}
            format="pct"
            color="accent"
            icon={ChartIcon}
            delay={240}
          />
        </div>

        {/* Tier 2: Context Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <ContextCard
            label="Total Listings"
            value={metrics.total}
            format="int"
            icon={LayersIcon}
            delay={300}
          />
          <ContextCard
            label="Avg Price"
            value={metrics.avgPrice}
            format="price"
            icon={HomeIcon}
            delay={360}
          />
          <ContextCard
            label="Avg Rent"
            value={metrics.avgRent}
            format="price"
            icon={KeyIcon}
            delay={420}
          />
          <ContextCard
            label="Avg DOM"
            value={metrics.avgDom}
            format="int"
            icon={ClockIcon}
            delay={480}
          />
          {soldStats && (
            <ContextCard
              label="Avg Sold"
              value={soldStats.avgSoldPrice}
              format="price"
              icon={SoldIcon}
              delay={540}
            />
          )}
          {soldStats && (
            <ContextCard
              label="Sale-to-List"
              value={100 + (soldStats.avgNegotiationGap || 0)}
              format="pct"
              icon={PercentIcon}
              delay={600}
            />
          )}
        </div>

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
