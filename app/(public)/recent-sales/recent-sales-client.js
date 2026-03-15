'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fmtK, fmtCurrency } from '@/lib/utils/format';

const TYPE_FILTERS = ['All', 'Detached', 'Semi-Detached', 'Townhouse', 'Condo'];

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 86400) return 'Today';
  if (diff < 172800) return '1d ago';
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function RecentSalesClient() {
  const [comps, setComps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams({ limit: '50' });
        if (typeFilter !== 'All') params.set('type', typeFilter);
        const res = await fetch('/api/sold-comps?' + params.toString());
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setComps(data.comps || []);
        setStats(data.stats || null);
      } catch (err) {
        console.error('Failed to load sold comps:', err);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    load();
  }, [typeFilter]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-56" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="section-title">Recent Sales</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
            </span>
            Live
          </span>
        </div>
        <p className="section-subtitle">
          Recently sold properties in Mississauga — see what investors are actually paying
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-5 text-center">
            <p className="text-[10px] font-medium uppercase text-slate-400 mb-1">Avg Sold Price</p>
            <p className="font-heading font-bold text-xl text-navy">{fmtK(stats.avgSoldPrice)}</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-[10px] font-medium uppercase text-slate-400 mb-1">Avg Days to Sell</p>
            <p className="font-heading font-bold text-xl text-navy">{stats.avgDOM}<span className="text-sm font-normal text-muted ml-1">days</span></p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-[10px] font-medium uppercase text-slate-400 mb-1">Avg Negotiation</p>
            <p className={`font-heading font-bold text-xl ${stats.avgNegotiationGap < 0 ? 'text-success' : stats.avgNegotiationGap > 0 ? 'text-red-500' : 'text-navy'}`}>
              {stats.avgNegotiationGap > 0 ? '+' : ''}{stats.avgNegotiationGap}%
            </p>
            <p className="text-[10px] text-muted">{stats.avgNegotiationGap < 0 ? 'below list' : 'above list'}</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-[10px] font-medium uppercase text-slate-400 mb-1">Sales Found</p>
            <p className="font-heading font-bold text-xl text-navy">{stats.count}</p>
            <p className="text-[10px] text-muted">of {stats.total} total</p>
          </div>
        </div>
      )}

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TYPE_FILTERS.map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              typeFilter === type
                ? 'bg-navy text-white shadow-sm'
                : 'bg-white text-navy border border-slate-200 hover:border-navy/30'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Sales Table */}
      {comps.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🏘️</div>
          <h2 className="font-heading font-semibold text-xl text-navy mb-2">No sold listings found</h2>
          <p className="text-sm text-muted mb-6">
            Try a different property type filter or check back later.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-gradient-to-r from-navy to-navy/90">
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-white/70">Address</th>
                  <th className="text-right py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-white/70">Sold Price</th>
                  <th className="text-right py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-white/70">List Price</th>
                  <th className="text-center py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-white/70">Gap</th>
                  <th className="text-center py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-white/70 hidden sm:table-cell">Bed/Bath</th>
                  <th className="text-center py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-white/70 hidden md:table-cell">DOM</th>
                  <th className="text-right py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-white/70 hidden lg:table-cell">Sold Date</th>
                </tr>
              </thead>
              <tbody>
                {comps.map((comp, i) => (
                  <tr
                    key={comp.id}
                    className={`border-b border-slate-50 transition-colors hover:bg-accent/5 ${i % 2 === 0 ? 'bg-white' : 'bg-cloud/30'}`}
                  >
                    <td className="py-3 px-5">
                      <div>
                        <p className="text-sm font-medium text-navy truncate max-w-[250px]">{comp.address}</p>
                        <p className="text-[11px] text-muted">{comp.city} · <span className="capitalize">{comp.subType || comp.type}</span></p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-navy">{fmtK(comp.closePrice)}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-muted">
                      {fmtK(comp.listPrice)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        comp.priceDelta < 0
                          ? 'bg-success/10 text-success'
                          : comp.priceDelta > 0
                            ? 'bg-red-50 text-red-600'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {comp.priceDelta > 0 ? '+' : ''}{comp.priceDelta}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-muted hidden sm:table-cell">
                      {comp.beds}/{comp.baths}
                    </td>
                    <td className="py-3 px-4 text-center hidden md:table-cell">
                      <span className={`text-sm ${comp.dom <= 14 ? 'text-success font-medium' : comp.dom >= 45 ? 'text-gold font-medium' : 'text-navy'}`}>
                        {comp.dom}d
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-muted text-xs hidden lg:table-cell">
                      {formatDate(comp.closeDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insight Box */}
      {stats && comps.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-8">
          <h3 className="text-sm font-bold text-navy mb-3">Market Insight</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-cloud p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">Buyer Leverage</p>
              <p className="text-sm font-bold text-navy">
                {stats.avgNegotiationGap < -2 ? 'Strong' : stats.avgNegotiationGap < 0 ? 'Moderate' : 'Weak'}
              </p>
              <p className="text-[11px] text-muted">
                Buyers are paying {Math.abs(stats.avgNegotiationGap)}% {stats.avgNegotiationGap < 0 ? 'below' : 'above'} asking
              </p>
            </div>
            <div className="rounded-lg bg-cloud p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">Speed</p>
              <p className="text-sm font-bold text-navy">
                {stats.avgDOM <= 14 ? 'Very Fast' : stats.avgDOM <= 30 ? 'Normal' : 'Slow'}
              </p>
              <p className="text-[11px] text-muted">
                Properties selling in avg {stats.avgDOM} days
              </p>
            </div>
            <div className="rounded-lg bg-cloud p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">Investor Signal</p>
              <p className={`text-sm font-bold ${stats.avgNegotiationGap < -3 ? 'text-success' : 'text-gold'}`}>
                {stats.avgNegotiationGap < -3 ? 'Buy Zone' : stats.avgNegotiationGap < 0 ? 'Fair Market' : 'Competitive'}
              </p>
              <p className="text-[11px] text-muted">
                Based on negotiation gap & DOM trends
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="card bg-navy p-8 text-center">
        <h2 className="font-heading font-bold text-xl text-white mb-2">
          Ready to find your next investment?
        </h2>
        <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
          Browse active listings with deal scores, cash flow analysis, and investment metrics.
        </p>
        <Link href="/listings" className="btn-primary !px-8 !py-3 no-underline">
          Browse Active Listings
        </Link>
      </div>

      {/* Attribution */}
      <p className="mt-6 text-center text-[10px] text-slate-400">
        Data provided by TRREB via AMPRE. Sold prices and dates reflect MLS-recorded closings.
      </p>
    </div>
  );
}
