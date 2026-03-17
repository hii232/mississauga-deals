'use client';

import { useState, useMemo, useCallback } from 'react';
import { InvestorFiltersAdvanced } from './investor-filters-advanced';
import { SaveSearchButton } from './save-search-button';
import {
  DEFAULT_FILTERS,
  PROPERTY_TYPES,
  STRATEGY_CHIPS,
  SORT_OPTIONS,
  countActiveFilters,
  NEIGHBOURHOODS,
} from './filter-utils';

// ── Select Dropdown ──
function QuickSelect({ label, value, onChange, options }) {
  return (
    <div className="flex-1 min-w-[100px]">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Price Input ──
function PriceInput({ value, onChange, placeholder }) {
  const display = value > 0 ? value : '';
  return (
    <div className="relative flex-1 min-w-[110px]">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
      <input
        type="number"
        value={display}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm text-navy placeholder:text-slate-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </div>
  );
}

// ── Tooltip wrapper ──
function Tooltip({ text, children }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg bg-navy px-3 py-2 text-[11px] leading-relaxed text-white shadow-lg opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50 hidden sm:block">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-navy rotate-45" />
      </div>
    </div>
  );
}

// ── Popular Neighbourhood Pills ──
const POPULAR_HOODS = ['Cooksville', 'Churchill Meadows', 'City Centre', 'Port Credit', 'Erin Mills', 'Malton', 'Clarkson'];

// ── Main Filter Component ──
export function InvestorFilters({ filters, setFilters, resultCount, totalCount }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const advancedCount = useMemo(() => countActiveFilters(filters), [filters]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, [setFilters]);

  const toggleStrategy = useCallback((key) => {
    setFilters((prev) => ({
      ...prev,
      activeStrategies: prev.activeStrategies.includes(key)
        ? prev.activeStrategies.filter((k) => k !== key)
        : [...prev.activeStrategies, key],
    }));
  }, [setFilters]);

  const toggleHood = useCallback((hood) => {
    setFilters((prev) => ({
      ...prev,
      neighbourhoods: prev.neighbourhoods.includes(hood)
        ? prev.neighbourhoods.filter((h) => h !== hood)
        : [...prev.neighbourhoods, hood],
    }));
  }, [setFilters]);

  const clearAll = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, [setFilters]);

  const totalActive = advancedCount + filters.activeStrategies.length +
    (filters.propertyType !== 'All' ? 1 : 0) + (filters.search ? 1 : 0) +
    filters.neighbourhoods.length;

  // Build active filter tags for summary bar
  const activeFilterTags = useMemo(() => {
    const tags = [];
    if (filters.propertyType !== 'All') {
      tags.push({ label: filters.propertyType, clear: () => updateFilter('propertyType', 'All') });
    }
    filters.activeStrategies.forEach((key) => {
      const chip = STRATEGY_CHIPS.find((c) => c.key === key);
      if (chip) tags.push({ label: chip.label, clear: () => toggleStrategy(key) });
    });
    filters.neighbourhoods.forEach((hood) => {
      tags.push({ label: hood, clear: () => toggleHood(hood) });
    });
    if (filters.beds !== null) {
      tags.push({ label: `${filters.beds}+ beds`, clear: () => updateFilter('beds', null) });
    }
    if (filters.baths !== null) {
      tags.push({ label: `${filters.baths}+ baths`, clear: () => updateFilter('baths', null) });
    }
    if (filters.priceRange[0] > 0) {
      tags.push({ label: `Min $${(filters.priceRange[0] / 1000).toFixed(0)}K`, clear: () => updateFilter('priceRange', [0, filters.priceRange[1]]) });
    }
    if (filters.priceRange[1] < 3000000) {
      tags.push({ label: `Max $${(filters.priceRange[1] / 1000).toFixed(0)}K`, clear: () => updateFilter('priceRange', [filters.priceRange[0], 3000000]) });
    }
    return tags;
  }, [filters, updateFilter, toggleStrategy, toggleHood]);

  // Shared filter content
  const filterContent = (
    <>
      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="text"
          placeholder="Search by address, neighbourhood, postal code..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Popular neighbourhood pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Popular:</span>
        {POPULAR_HOODS.map((hood) => (
          <button
            key={hood}
            onClick={() => toggleHood(hood)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              filters.neighbourhoods.includes(hood)
                ? 'bg-accent text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-accent/30 hover:text-accent'
            }`}
          >
            {hood}
          </button>
        ))}
      </div>

      {/* Property type pills */}
      <div className="flex flex-wrap gap-2">
        {PROPERTY_TYPES.map((pt) => (
          <button
            key={pt}
            onClick={() => updateFilter('propertyType', pt)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filters.propertyType === pt
                ? 'bg-navy text-white'
                : 'bg-white text-navy border border-slate-200 hover:border-navy/30'
            }`}
          >
            {pt}
          </button>
        ))}
      </div>

      {/* Quick filters row: Price + Beds + Baths */}
      <div className="flex flex-wrap gap-2">
        <PriceInput
          value={filters.priceRange[0]}
          onChange={(v) => updateFilter('priceRange', [v, filters.priceRange[1]])}
          placeholder="Min price"
        />
        <PriceInput
          value={filters.priceRange[1] >= 3000000 ? 0 : filters.priceRange[1]}
          onChange={(v) => updateFilter('priceRange', [filters.priceRange[0], v === 0 ? 3000000 : v])}
          placeholder="Max price"
        />
        <QuickSelect
          label="Beds"
          value={filters.beds}
          onChange={(v) => updateFilter('beds', v)}
          options={[
            { value: 1, label: '1+ bed' },
            { value: 2, label: '2+ beds' },
            { value: 3, label: '3+ beds' },
            { value: 4, label: '4+ beds' },
            { value: 5, label: '5+ beds' },
          ]}
        />
        <QuickSelect
          label="Baths"
          value={filters.baths}
          onChange={(v) => updateFilter('baths', v)}
          options={[
            { value: 1, label: '1+ bath' },
            { value: 2, label: '2+ baths' },
            { value: 3, label: '3+ baths' },
            { value: 4, label: '4+ baths' },
          ]}
        />
      </div>

      {/* Strategy chips with tooltips */}
      <div className="flex flex-wrap gap-2">
        {STRATEGY_CHIPS.map((chip) => (
          <Tooltip key={chip.key} text={chip.tooltip}>
            <button
              onClick={() => toggleStrategy(chip.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-all duration-150 ${
                filters.activeStrategies.includes(chip.key)
                  ? chip.key === 'pos'
                    ? 'bg-amber-500 text-white'
                    : 'bg-accent text-white scale-105'
                  : chip.key === 'pos'
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          </Tooltip>
        ))}
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      {/* ── Desktop Layout ── */}
      <div className="hidden sm:block space-y-3">
        {filterContent}
      </div>

      {/* ── Mobile: Search + Filter Button ── */}
      <div className="sm:hidden space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-navy hover:border-navy/30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            Filters
            {totalActive > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
                {totalActive}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 top-12 overflow-y-auto rounded-t-2xl bg-cloud">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <h2 className="text-base font-bold text-navy">Filters</h2>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-navy">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4 p-4">
              {filterContent}
              <InvestorFiltersAdvanced filters={filters} updateFilter={updateFilter} />
            </div>
            <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white px-4 py-3">
              <button
                onClick={() => { clearAll(); setMobileOpen(false); }}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
              >
                Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Controls Row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-navy">{resultCount.toLocaleString()}</span>{' '}
            {totalCount && resultCount !== totalCount && (
              <>of <span className="font-semibold text-navy">{totalCount.toLocaleString()}</span>{' '}</>
            )}
            investment {resultCount === 1 ? 'property' : 'properties'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`hidden sm:flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              showAdvanced
                ? 'border-accent bg-accent/5 text-accent'
                : 'border-slate-200 bg-white text-navy hover:border-navy/30'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            Advanced
            {advancedCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
                {advancedCount}
              </span>
            )}
          </button>

          <select
            value={filters.sortKey}
            onChange={(e) => updateFilter('sortKey', e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>Sort: {opt.label}</option>
            ))}
          </select>

          <SaveSearchButton filters={filters} />
        </div>
      </div>

      {/* ── Active Filter Tags ── */}
      {activeFilterTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <span className="text-[11px] font-medium text-slate-400 uppercase">Filters:</span>
          {activeFilterTags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-navy"
            >
              {tag.label}
              <button
                onClick={tag.clear}
                className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-xs font-medium text-accent hover:text-accent-dark ml-auto"
          >
            Clear All
          </button>
        </div>
      )}

      {/* ── Advanced Panel (desktop) ── */}
      {showAdvanced && (
        <div className="hidden sm:block">
          <InvestorFiltersAdvanced filters={filters} updateFilter={updateFilter} />
        </div>
      )}
    </div>
  );
}
