'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HOOD_DATA, HOOD_OUTLOOK_AS_OF } from '@/lib/constants';
import { fmtK } from '@/lib/utils/format';
import InlineCTA from '@/components/ui/inline-cta';
import { PageHero } from '@/components/layout/page-hero';
import { NeighbourhoodScene } from '@/components/art/neighbourhood-scene';
import { neighbourhoodPhoto } from '@/lib/neighbourhood-images';

const FILTERS = ['All', 'Hot', 'Warm', 'Cool'];
const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-');

export default function NeighbourhoodsPage() {
  const [filter, setFilter] = useState('All');
  const [recentSales, setRecentSales] = useState([]);
  const [hoodStats, setHoodStats] = useState({});

  useEffect(() => {
    fetch('/api/sold-comps?limit=8')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.comps) setRecentSales(data.comps);
      })
      .catch(() => {});
    // Live per-neighbourhood avg price / DOM / yield from active listings.
    fetch('/api/neighbourhood-stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.stats) setHoodStats(data.stats);
      })
      .catch(() => {});
  }, []);

  // Merge curated HOOD_DATA with live aggregates: price/DOM/yield go live when
  // we have a sample, trend + YoY stay curated (Hamza's outlook).
  const merged = Object.entries(HOOD_DATA).map(([name, data]) => {
    const live = hoodStats[name];
    return {
      name,
      data,
      avgPrice: live?.avgPrice ?? data.avgPrice,
      avgDOM: live?.avgDOM ?? data.avgDOM,
      rentYield: live?.rentYield ?? data.rentYield,
      isLive: !!live,
    };
  });
  // Top 3 by gross rent yield — powers the "best neighbourhoods" answer block
  const topByYield = [...merged].sort((a, b) => (b.rentYield || 0) - (a.rentYield || 0)).slice(0, 3);
  const filtered = filter === 'All' ? merged : merged.filter((h) => h.data.trend === filter.toLowerCase());
  const hoodCount = merged.length;
  const trendCount = (t) => merged.filter((h) => h.data.trend === t).length;

  return (
    <>
    <PageHero
      compact
      eyebrow="24 neighbourhoods, ranked"
      title="Best Neighbourhoods to Invest in Mississauga"
      subtitle="Every Mississauga neighbourhood ranked for investors by rent yield, price trend, and days on market — so you can match an area to your strategy."
    />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top picks — directly answers "best neighbourhoods to invest in Mississauga" */}
      <div className="mb-8 rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/5 to-white p-5 md:p-6">
        <h2 className="font-heading text-lg font-bold text-navy">
          Where to invest in Mississauga right now
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-navy/80">
          For rental <strong>cash flow</strong>, the top Mississauga neighbourhoods by gross rent yield are{' '}
          {topByYield.map(({ name }, i) => (
            <span key={name}>
              <Link href={`/neighbourhoods/${slugify(name)}`} className="font-semibold text-accent no-underline hover:underline">{name}</Link>
              {i < topByYield.length - 2 ? ', ' : i === topByYield.length - 2 ? ' and ' : ''}
            </span>
          ))}
          . For <strong>appreciation</strong>, transit-driven areas like City Centre and Port Credit trade lower yields for stronger long-term growth. Full rankings below.
        </p>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-accent text-white shadow-sm'
                : 'bg-cloud text-muted hover:bg-slate-100 hover:text-navy'
            }`}
          >
            {f === 'Hot' && '🔥 '}
            {f === 'Warm' && '📈 '}
            {f === 'Cool' && '🧊 '}
            {f}
            <span className="ml-1.5 text-xs opacity-70">
              ({f === 'All' ? hoodCount : trendCount(f.toLowerCase())})
            </span>
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(({ name, data, avgPrice, avgDOM, rentYield, isLive }) => {
          const trendColor =
            data.trend === 'hot'
              ? 'bg-red-50 text-red-600 border-red-100'
              : data.trend === 'warm'
              ? 'bg-amber-50 text-amber-700 border-amber-100'
              : 'bg-blue-50 text-blue-600 border-blue-100';

          const photo = neighbourhoodPhoto(name);
          return (
            <div key={name} className="card group p-0 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image / scene header */}
              <div className="relative h-40 overflow-hidden">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt={`${name}, Mississauga`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <NeighbourhoodScene name={name} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/15 to-transparent" />
                <span className={`absolute right-3 top-3 text-[10px] font-bold uppercase rounded-full px-2.5 py-1 border ${trendColor} bg-white/85 backdrop-blur-sm`} title="Hamza's outlook">
                  {data.emoji} {data.trend}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                  <h3 className="font-heading text-lg font-bold text-white drop-shadow-sm">{name}</h3>
                  <div className="flex-shrink-0 rounded-xl bg-white/95 px-3 py-1.5 text-center shadow-md">
                    <p className="text-lg font-extrabold leading-none text-accent">{rentYield != null ? `${rentYield}%` : '—'}</p>
                    <p className="text-[8px] font-bold uppercase tracking-wide text-muted">
                      Rent Yield{isLive && <span className="ml-0.5 text-emerald-600">·Live</span>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-cloud p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-400">Avg Price</p>
                  <p className="text-sm font-bold text-navy">{fmtK(avgPrice)}</p>
                </div>
                <div className="rounded-lg bg-cloud p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-400">YoY Change*</p>
                  <p className={`text-sm font-bold ${data.priceYoY >= 4 ? 'text-success' : data.priceYoY >= 2.5 ? 'text-gold-dark' : 'text-muted'}`}>
                    +{data.priceYoY}%
                  </p>
                </div>
                <div className="rounded-lg bg-cloud p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-400">Avg DOM</p>
                  <p className="text-sm font-bold text-navy">{avgDOM != null ? `${avgDOM} days` : '—'}</p>
                </div>
                <div className="rounded-lg bg-cloud p-2.5">
                  <p className="text-[10px] font-medium uppercase text-slate-400">Inventory*</p>
                  <p className={`text-sm font-bold ${data.inventory === 'Low' ? 'text-red-500' : data.inventory === 'Medium' ? 'text-gold-dark' : 'text-muted'}`}>
                    {data.inventory}
                  </p>
                </div>
              </div>

              {/* Hamza's Note */}
              <div className="mb-4">
                <p className="text-[11px] font-medium text-slate-400 uppercase mb-1">Hamza&apos;s Take</p>
                <p className="text-xs text-navy/70 leading-relaxed italic">
                  &ldquo;{data.note}&rdquo;
                </p>
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/neighbourhoods/${name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="block text-center rounded-lg bg-accent py-2 text-xs font-medium text-white hover:bg-accent/90 transition-colors no-underline"
                >
                  Investment Guide
                </Link>
                <Link
                  href={`/listings?hood=${encodeURIComponent(name)}`}
                  className="block text-center rounded-lg bg-cloud py-2 text-xs font-medium text-accent hover:bg-accent/5 transition-colors no-underline"
                >
                  View Listings
                </Link>
              </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-[11px] text-muted">
        Avg price, DOM &amp; rent yield update live from active listings. <span className="whitespace-nowrap">*Trend, YoY &amp; inventory</span> reflect Hamza&apos;s expert outlook (last reviewed {HOOD_OUTLOOK_AS_OF}).
      </p>

      {/* Recent Sales Activity */}
      {recentSales.length > 0 && (
        <div className="mt-10 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-semibold text-lg text-navy">Recent Sales Across Mississauga</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-success">
                <span className="h-1 w-1 rounded-full bg-success animate-pulse" />
                Live
              </span>
            </div>
            <Link
              href="/recent-sales"
              className="text-xs font-medium text-accent hover:text-accent-dark no-underline inline-flex items-center gap-1"
            >
              View all
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-slate-400">Address</th>
                  <th className="text-left py-2 text-[10px] font-semibold uppercase text-slate-400 hidden sm:table-cell">City</th>
                  <th className="text-right py-2 text-[10px] font-semibold uppercase text-slate-400">Sold Price</th>
                  <th className="text-center py-2 text-[10px] font-semibold uppercase text-slate-400">vs List</th>
                  <th className="text-right py-2 text-[10px] font-semibold uppercase text-slate-400 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((comp) => (
                  <tr key={comp.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5">
                      <p className="text-sm font-medium text-navy truncate max-w-[200px]">{comp.address}</p>
                    </td>
                    <td className="py-2.5 text-muted text-xs hidden sm:table-cell">{comp.city}</td>
                    <td className="py-2.5 text-right font-semibold text-navy">{fmtK(comp.closePrice)}</td>
                    <td className="py-2.5 text-center">
                      <span className={`text-xs font-semibold ${comp.priceDelta < 0 ? 'text-success' : comp.priceDelta > 0 ? 'text-red-500' : 'text-muted'}`}>
                        {comp.priceDelta > 0 ? '+' : ''}{comp.priceDelta}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-xs text-muted hidden md:table-cell">
                      {comp.closeDate ? new Date(comp.closeDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* CTA */}
      <InlineCTA variant="alerts" className="mt-12" />
    </div>
    </>
  );
}
