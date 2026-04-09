'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Hardcoded fallback — used only if Supabase fetch fails             */
/* ------------------------------------------------------------------ */

const FALLBACK_PROJECTS = [
  { name: 'M6 Condos (M City)', developer: 'Rogers Real Estate & Urban Capital', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: 57, units: 900, price_from: 440900, status: 'Selling', completion: '2028' },
  { name: 'Canopy Towers 2', developer: 'Liberty Development Corp', city: 'Mississauga', area: 'Hurontario Corridor', type: 'Condo', storeys: 38, units: 522, price_from: 476900, status: 'Selling', completion: '2027' },
  { name: 'Bridge House at Brightwater', developer: 'Kilmer, DiamondCorp, Dream & FRAM+Slokker', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Condo', storeys: 19, units: null, price_from: 649900, status: 'Selling', completion: '2028' },
];

/* ------------------------------------------------------------------ */
/*  City metadata — icons, colors                                      */
/* ------------------------------------------------------------------ */

const CITY_META = {
  'All Cities':      { emoji: '🏙️', color: 'bg-slate-100 text-slate-700' },
  'Mississauga':     { emoji: '🌆', color: 'bg-blue-100 text-blue-700' },
  'Toronto':         { emoji: '🏗️', color: 'bg-purple-100 text-purple-700' },
  'Brampton':        { emoji: '📈', color: 'bg-green-100 text-green-700' },
  'Vaughan':         { emoji: '🚇', color: 'bg-indigo-100 text-indigo-700' },
  'Oakville':        { emoji: '🌳', color: 'bg-emerald-100 text-emerald-700' },
  'Markham':         { emoji: '🏢', color: 'bg-sky-100 text-sky-700' },
  'Richmond Hill':   { emoji: '🏡', color: 'bg-rose-100 text-rose-700' },
  'Hamilton':        { emoji: '⚡', color: 'bg-amber-100 text-amber-700' },
  'Burlington':      { emoji: '🌊', color: 'bg-cyan-100 text-cyan-700' },
  'Milton':          { emoji: '🏔️', color: 'bg-lime-100 text-lime-700' },
  'Halton Hills':    { emoji: '🌿', color: 'bg-teal-100 text-teal-700' },
};

const TYPE_FILTERS = ['All', 'Condo', 'Townhome', 'Mixed'];

const CITY_ORDER = ['Mississauga', 'Toronto', 'Brampton', 'Vaughan', 'Oakville', 'Markham', 'Richmond Hill', 'Hamilton', 'Burlington', 'Milton', 'Halton Hills'];

function formatPrice(p) {
  if (!p) return null;
  if (p >= 1000000) return `$${(p / 1000000).toFixed(1)}M`;
  return `$${Math.round(p / 1000)}K`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PreConstructionProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch projects from Supabase via API
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/precon');
        if (res.ok) {
          const data = await res.json();
          if (data.projects && data.projects.length > 0) {
            setProjects(data.projects);
          } else {
            setProjects(FALLBACK_PROJECTS);
          }
        } else {
          setProjects(FALLBACK_PROJECTS);
        }
      } catch {
        setProjects(FALLBACK_PROJECTS);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  // Get unique cities
  const cities = useMemo(() => {
    const unique = [...new Set(projects.map(p => p.city))];
    // Sort by CITY_ORDER
    unique.sort((a, b) => {
      const ai = CITY_ORDER.indexOf(a);
      const bi = CITY_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    return ['All Cities', ...unique];
  }, [projects]);

  // Filter projects
  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (selectedCity !== 'All Cities' && p.city !== selectedCity) return false;
      if (selectedType !== 'All' && p.type !== selectedType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.developer.toLowerCase().includes(q) ||
          p.area.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projects, selectedCity, selectedType, searchQuery]);

  // Group by city then area
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(p => {
      if (!map[p.city]) map[p.city] = {};
      if (!map[p.city][p.area]) map[p.city][p.area] = [];
      map[p.city][p.area].push(p);
    });
    return map;
  }, [filtered]);

  // Determine render order: CITY_ORDER first, then any new cities from DB
  const renderOrder = useMemo(() => {
    const allCities = Object.keys(grouped);
    const ordered = CITY_ORDER.filter(c => grouped[c]);
    const extra = allCities.filter(c => !CITY_ORDER.includes(c));
    return [...ordered, ...extra];
  }, [grouped]);

  return (
    <div className="min-h-screen bg-cloud">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-navy via-[#1e3a5f] to-[#0f1d30] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-gold blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs font-medium mb-5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {projects.length}+ Active Projects Across the GTA
            </div>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl leading-tight mb-4">
              GTA Pre-Construction<br />
              <span className="text-accent">Projects & Developments</span>
            </h1>
            <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl mb-8">
              Browse the latest pre-construction condos, townhomes, and developments across the Greater Toronto Area. Get VIP pricing and first access through Hamza Nouman.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pre-construction"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent-dark transition no-underline"
              >
                Join VIP List
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link
                href="/pre-construction/hst-rebate"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 backdrop-blur text-white font-semibold text-sm hover:bg-white/20 transition no-underline"
              >
                HST Rebate Guide — Save $130K
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HST Banner ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-navy">Ontario HST Rebate — Save Up to $130,000 on New Builds</p>
            <p className="text-xs text-slate-600">APS signed between Apr 1, 2026 — Mar 31, 2027. This changes the investment math for every project below.</p>
          </div>
          <Link href="/pre-construction/hst-rebate" className="flex-shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 no-underline">
            Learn More &rarr;
          </Link>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        {/* Search */}
        <div className="mb-5">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search by project, developer, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 bg-white"
            />
          </div>
        </div>

        {/* City filter pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {cities.map(city => {
            const meta = CITY_META[city] || {};
            const count = city === 'All Cities' ? projects.length : projects.filter(p => p.city === city).length;
            const isActive = selectedCity === city;
            return (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  isActive
                    ? 'bg-navy text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-navy/30 hover:text-navy'
                }`}
              >
                <span>{meta.emoji || '📍'}</span>
                {city}
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Type filter */}
        <div className="flex gap-2 mb-2">
          {TYPE_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                selectedType === t
                  ? 'bg-accent text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-accent'
              }`}
            >
              {t === 'All' ? 'All Types' : t}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted mt-3 mb-1">{filtered.length} project{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* ── Project Listings ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-40 bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && Object.keys(grouped).length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted">No projects match your filters.</p>
            <button onClick={() => { setSelectedCity('All Cities'); setSelectedType('All'); setSearchQuery(''); }} className="mt-3 text-accent text-sm font-medium hover:underline">
              Clear all filters
            </button>
          </div>
        )}

        {!loading && renderOrder.map(city => {
          const meta = CITY_META[city] || {};
          const areas = grouped[city];

          return (
            <div key={city} className="mb-10">
              {/* City Header */}
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
                <span className="text-2xl">{meta.emoji || '📍'}</span>
                <h2 className="font-heading font-bold text-xl text-navy">{city}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.color || 'bg-slate-100 text-slate-600'}`}>
                  {Object.values(areas).flat().length} projects
                </span>
              </div>

              {/* Areas within city */}
              {Object.entries(areas).map(([area, areaProjects]) => (
                <div key={area} className="mb-6">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3 ml-1">{area}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {areaProjects.map((p, i) => (
                      <div key={p.id || i} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group">
                        {/* Project Image */}
                        {p.image_url ? (
                          <div className="relative h-44 bg-slate-100 overflow-hidden">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3 flex gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
                                p.status === 'Selling' ? 'bg-green-500/90 text-white' : 'bg-amber-500/90 text-white'
                              }`}>
                                {p.status}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm bg-white/90 ${
                                p.type === 'Condo' ? 'text-blue-600' : p.type === 'Townhome' ? 'text-purple-600' : 'text-slate-600'
                              }`}>
                                {p.type}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative h-32 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center overflow-hidden">
                            <span className="text-5xl opacity-20">🏗️</span>
                            <div className="absolute top-3 left-3 flex gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                p.status === 'Selling' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {p.status}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                p.type === 'Condo' ? 'bg-blue-50 text-blue-600' : p.type === 'Townhome' ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-600'
                              }`}>
                                {p.type}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Project info */}
                        <div className="p-5">
                          <h4 className="font-heading font-bold text-navy text-base mb-1 group-hover:text-accent transition-colors">{p.name}</h4>
                          <p className="text-xs text-muted mb-3">by {p.developer}</p>

                          {/* Details grid */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
                            {p.price_from && (
                              <div>
                                <span className="text-muted">From</span>
                                <p className="font-semibold text-navy">{formatPrice(p.price_from)}</p>
                              </div>
                            )}
                            {p.storeys && (
                              <div>
                                <span className="text-muted">Storeys</span>
                                <p className="font-semibold text-navy">{p.storeys}</p>
                              </div>
                            )}
                            {p.units && (
                              <div>
                                <span className="text-muted">Units</span>
                                <p className="font-semibold text-navy">{p.units.toLocaleString()}</p>
                              </div>
                            )}
                            {p.completion && p.completion !== 'TBD' && (
                              <div>
                                <span className="text-muted">Completion</span>
                                <p className="font-semibold text-navy">{p.completion}</p>
                              </div>
                            )}
                            {!p.price_from && !p.storeys && !p.units && (
                              <div className="col-span-2">
                                <span className="text-muted italic">Pricing & details coming soon</span>
                              </div>
                            )}
                          </div>

                          {/* CTA */}
                          <Link
                            href={`/pre-construction?project=${encodeURIComponent(p.name)}`}
                            className="block w-full text-center py-2.5 rounded-lg bg-navy/5 text-navy text-xs font-semibold hover:bg-accent hover:text-white transition no-underline"
                          >
                            Get VIP Pricing & Floor Plans
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section className="bg-navy text-white py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-3">
            Want VIP Access to Any Project?
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xl mx-auto">
            Hamza gets you first access pricing, best unit selection, and full investment analysis on any pre-construction project across the GTA. No obligation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/pre-construction" className="btn-primary !px-8 !py-3 no-underline">
              Join the VIP List
            </Link>
            <a href="tel:6476091289" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition no-underline">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Call Hamza — 647-609-1289
            </a>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-[10px] text-slate-400 leading-relaxed text-center">
          Prices, availability, and project details are subject to change without notice. Information is gathered from public sources and developer materials and may not reflect the most current data. All images and renderings are for illustrative purposes only. Please contact Hamza Nouman for the latest pricing, availability, and floor plans. Hamza Nouman, Salesperson, Cityscape Real Estate Ltd., Brokerage. Not intended to solicit buyers or sellers currently under contract.
        </p>
      </div>
    </div>
  );
}
