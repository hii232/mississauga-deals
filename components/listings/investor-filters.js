'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { InvestorFiltersAdvanced } from './investor-filters-advanced';
import { SaveSearchButton } from './save-search-button';
import {
  DEFAULT_FILTERS,
  PROPERTY_TYPES,
  STRATEGIES,
  PRICE_PRESETS,
  SORT_OPTIONS,
  NEIGHBOURHOODS,
  countActiveFilters,
} from './filter-utils';

// ── Dropdown wrapper (click-outside close) ──
function Dropdown({ trigger, children, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger(open)}</div>
      {open && (
        <div
          className={`absolute top-full z-40 mt-1 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Dropdown trigger button ──
function FilterButton({ label, active, open, count }) {
  return (
    <button
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'border-accent bg-accent/5 text-accent'
          : 'border-slate-200 bg-white text-navy hover:border-slate-300'
      }`}
    >
      {label}
      {count > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
      <svg
        className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </button>
  );
}

// ── Dropdown option ──
function DropdownOption({ label, selected, onClick, description }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
        selected ? 'bg-accent/5 text-accent font-medium' : 'text-navy hover:bg-slate-50'
      }`}
    >
      <span
        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
          selected ? 'border-accent bg-accent' : 'border-slate-300'
        }`}
      >
        {selected && (
          <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
          </svg>
        )}
      </span>
      <div>
        <span>{label}</span>
        {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
      </div>
    </button>
  );
}

// ── Popular Neighbourhood Pills ──
const DEFAULT_POPULAR_HOODS = ['Cooksville', 'Churchill Meadows', 'City Centre', 'Port Credit', 'Erin Mills', 'Malton', 'Clarkson'];

// ── Main Filter Component ──
export function InvestorFilters({ filters, setFilters, resultCount, totalCount, popularHoods }) {
  const POPULAR_HOODS = popularHoods || DEFAULT_POPULAR_HOODS;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const advancedCount = useMemo(() => countActiveFilters(filters), [filters]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, [setFilters]);

  const toggleHood = useCallback((hood) => {
    setFilters((prev) => ({
      ...prev,
      neighbourhoods: prev.neighbourhoods.includes(hood)
        ? prev.neighbourhoods.filter((h) => h !== hood)
        : [...prev.neighbourhoods, hood],
    }));
  }, [setFilters]);

  const selectPricePreset = useCallback((presetKey) => {
    if (filters.pricePreset === presetKey) {
      // Deselect
      setFilters((prev) => ({ ...prev, pricePreset: null, priceRange: [0, 3000000] }));
    } else {
      const preset = PRICE_PRESETS.find((p) => p.key === presetKey);
      if (preset) {
        setFilters((prev) => ({ ...prev, pricePreset: presetKey, priceRange: preset.range }));
      }
    }
  }, [filters.pricePreset, setFilters]);

  const selectStrategy = useCallback((stratKey) => {
    setFilters((prev) => ({
      ...prev,
      strategy: prev.strategy === stratKey ? null : stratKey,
    }));
  }, [setFilters]);

  const clearAll = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, [setFilters]);

  const hasPriceFilter = filters.priceRange[0] > 0 || filters.priceRange[1] < 3000000;
  const totalActive = advancedCount +
    (filters.propertyType !== 'All' ? 1 : 0) +
    (filters.search ? 1 : 0) +
    filters.neighbourhoods.length;

  // Build active filter tags
  const activeFilterTags = useMemo(() => {
    const tags = [];
    if (filters.propertyType !== 'All') {
      tags.push({ label: filters.propertyType, clear: () => updateFilter('propertyType', 'All') });
    }
    if (filters.strategy) {
      const strat = STRATEGIES.find((s) => s.key === filters.strategy);
      if (strat) tags.push({ label: strat.label, clear: () => updateFilter('strategy', null) });
    }
    if (filters.pricePreset) {
      const preset = PRICE_PRESETS.find((p) => p.key === filters.pricePreset);
      if (preset) tags.push({ label: preset.label, clear: () => { updateFilter('pricePreset', null); updateFilter('priceRange', [0, 3000000]); } });
    } else if (hasPriceFilter) {
      tags.push({ label: `$${(filters.priceRange[0] / 1000).toFixed(0)}K–$${(filters.priceRange[1] / 1000).toFixed(0)}K`, clear: () => updateFilter('priceRange', [0, 3000000]) });
    }
    if (filters.beds !== null) {
      tags.push({ label: `${filters.beds}+ beds`, clear: () => updateFilter('beds', null) });
    }
    if (filters.baths !== null) {
      tags.push({ label: `${filters.baths}+ baths`, clear: () => updateFilter('baths', null) });
    }
    filters.neighbourhoods.forEach((hood) => {
      tags.push({ label: hood, clear: () => toggleHood(hood) });
    });
    if (filters.minCapRate !== null) {
      tags.push({ label: `Cap ${filters.minCapRate}%+`, clear: () => updateFilter('minCapRate', null) });
    }
    if (filters.minCashFlow !== null) {
      tags.push({ label: `CF $${filters.minCashFlow}+`, clear: () => updateFilter('minCashFlow', null) });
    }
    if (filters.minCashOnCash !== null) {
      tags.push({ label: `CoC ${filters.minCashOnCash}%+`, clear: () => updateFilter('minCashOnCash', null) });
    }
    if (filters.minDealScore !== null) {
      tags.push({ label: `Score ${filters.minDealScore}+`, clear: () => updateFilter('minDealScore', null) });
    }
    if (filters.lrtOnly) {
      tags.push({ label: 'LRT Only', clear: () => updateFilter('lrtOnly', false) });
    }
    if (filters.hasBasementSuite) {
      tags.push({ label: 'Legal Suite', clear: () => updateFilter('hasBasementSuite', false) });
    }
    if (filters.isPowerOfSale) {
      tags.push({ label: 'Power of Sale', clear: () => updateFilter('isPowerOfSale', false) });
    }
    return tags;
  }, [filters, updateFilter, toggleHood, hasPriceFilter]);

  return (
    <div className="space-y-3">
      {/* ── Desktop Layout ── */}
      <div className="hidden sm:block space-y-3">
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

        {/* Dropdown filters row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Price dropdown */}
          <Dropdown
            trigger={(open) => (
              <FilterButton
                label={filters.pricePreset ? PRICE_PRESETS.find(p => p.key === filters.pricePreset)?.label : 'Price'}
                active={hasPriceFilter}
                open={open}
              />
            )}
          >
            <div className="py-1">
              <button
                onClick={() => { updateFilter('pricePreset', null); updateFilter('priceRange', [0, 3000000]); }}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm ${
                  !hasPriceFilter ? 'text-accent font-medium bg-accent/5' : 'text-navy hover:bg-slate-50'
                }`}
              >
                Any Price
              </button>
              {PRICE_PRESETS.map((preset) => (
                <DropdownOption
                  key={preset.key}
                  label={preset.label}
                  selected={filters.pricePreset === preset.key}
                  onClick={() => selectPricePreset(preset.key)}
                />
              ))}
            </div>
          </Dropdown>

          {/* Beds dropdown */}
          <Dropdown
            trigger={(open) => (
              <FilterButton
                label={filters.beds ? `${filters.beds}+ Beds` : 'Beds'}
                active={filters.beds !== null}
                open={open}
              />
            )}
          >
            <div className="py-1">
              <button
                onClick={() => updateFilter('beds', null)}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm ${
                  filters.beds === null ? 'text-accent font-medium bg-accent/5' : 'text-navy hover:bg-slate-50'
                }`}
              >
                Any
              </button>
              {[1, 2, 3, 4, 5].map((n) => (
                <DropdownOption
                  key={n}
                  label={`${n}+ ${n === 1 ? 'bed' : 'beds'}`}
                  selected={filters.beds === n}
                  onClick={() => updateFilter('beds', filters.beds === n ? null : n)}
                />
              ))}
            </div>
          </Dropdown>

          {/* Baths dropdown */}
          <Dropdown
            trigger={(open) => (
              <FilterButton
                label={filters.baths ? `${filters.baths}+ Baths` : 'Baths'}
                active={filters.baths !== null}
                open={open}
              />
            )}
          >
            <div className="py-1">
              <button
                onClick={() => updateFilter('baths', null)}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm ${
                  filters.baths === null ? 'text-accent font-medium bg-accent/5' : 'text-navy hover:bg-slate-50'
                }`}
              >
                Any
              </button>
              {[1, 2, 3, 4].map((n) => (
                <DropdownOption
                  key={n}
                  label={`${n}+ ${n === 1 ? 'bath' : 'baths'}`}
                  selected={filters.baths === n}
                  onClick={() => updateFilter('baths', filters.baths === n ? null : n)}
                />
              ))}
            </div>
          </Dropdown>

          {/* Strategy dropdown */}
          <Dropdown
            trigger={(open) => (
              <FilterButton
                label={filters.strategy ? STRATEGIES.find(s => s.key === filters.strategy)?.label : 'Strategy'}
                active={!!filters.strategy}
                open={open}
              />
            )}
          >
            <div className="py-1 w-[280px]">
              <button
                onClick={() => updateFilter('strategy', null)}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm ${
                  !filters.strategy ? 'text-accent font-medium bg-accent/5' : 'text-navy hover:bg-slate-50'
                }`}
              >
                All Strategies
              </button>
              {STRATEGIES.map((strat) => (
                <DropdownOption
                  key={strat.key}
                  label={strat.label}
                  description={strat.description}
                  selected={filters.strategy === strat.key}
                  onClick={() => selectStrategy(strat.key)}
                />
              ))}
            </div>
          </Dropdown>

          {/* More Filters button */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              showAdvanced
                ? 'border-accent bg-accent/5 text-accent'
                : 'border-slate-200 bg-white text-navy hover:border-slate-300'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            More Filters
            {advancedCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {advancedCount}
              </span>
            )}
          </button>

          {/* Clear All — only show when filters are active */}
          {totalActive > 0 && (
            <button
              onClick={clearAll}
              className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors px-2 py-2.5"
            >
              Clear All
            </button>
          )}
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
      </div>

      {/* ── Mobile: Search + Property Type + Strategy + Filters Button ── */}
      <div className="sm:hidden space-y-3">
        {/* Search bar */}
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

        {/* Property type pills — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PROPERTY_TYPES.map((pt) => (
            <button
              key={pt}
              onClick={() => updateFilter('propertyType', pt)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filters.propertyType === pt
                  ? 'bg-navy text-white'
                  : 'bg-white text-navy border border-slate-200'
              }`}
            >
              {pt}
            </button>
          ))}
        </div>

        {/* Strategy dropdown on mobile */}
        <select
          value={filters.strategy || ''}
          onChange={(e) => updateFilter('strategy', e.target.value || null)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="">All Strategies</option>
          {STRATEGIES.map((strat) => (
            <option key={strat.key} value={strat.key}>{strat.label}</option>
          ))}
        </select>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/30 transition-opacity duration-200"
            style={{ animation: 'overlayIn 0.2s ease forwards' }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-cloud shadow-2xl"
            style={{ animation: 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3">
              <h2 className="text-base font-bold text-navy">Filters</h2>
              <button onClick={() => setMobileOpen(false)} className="rounded-full p-1 text-slate-400 hover:text-navy hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5 p-4 pb-28">
              {/* Price */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Price Range</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { updateFilter('pricePreset', null); updateFilter('priceRange', [0, 3000000]); }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                      !hasPriceFilter ? 'bg-accent text-white' : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    Any
                  </button>
                  {PRICE_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => selectPricePreset(preset.key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                        filters.pricePreset === preset.key
                          ? 'bg-accent text-white'
                          : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Beds & Baths */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Beds & Baths</h3>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filters.beds ?? ''}
                    onChange={(e) => updateFilter('beds', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Any Beds</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}+ {n === 1 ? 'bed' : 'beds'}</option>
                    ))}
                  </select>
                  <select
                    value={filters.baths ?? ''}
                    onChange={(e) => updateFilter('baths', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Any Baths</option>
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>{n}+ {n === 1 ? 'bath' : 'baths'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Strategy */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Strategy</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateFilter('strategy', null)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                      !filters.strategy ? 'bg-accent text-white' : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    All
                  </button>
                  {STRATEGIES.map((strat) => (
                    <button
                      key={strat.key}
                      onClick={() => selectStrategy(strat.key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                        filters.strategy === strat.key
                          ? 'bg-accent text-white'
                          : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      {strat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Neighbourhoods */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Neighbourhoods</h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_HOODS.map((hood) => (
                    <button
                      key={hood}
                      onClick={() => toggleHood(hood)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                        filters.neighbourhoods.includes(hood)
                          ? 'bg-accent text-white'
                          : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      {hood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Advanced Filters</h3>
                <InvestorFiltersAdvanced filters={filters} updateFilter={updateFilter} />
              </div>
            </div>

            <div className="fixed bottom-0 inset-x-0 flex gap-3 border-t border-slate-200 bg-white px-4 py-3 z-20">
              <button
                onClick={() => { clearAll(); setMobileOpen(false); }}
                className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 min-h-[44px] active:scale-95"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark min-h-[44px] active:scale-95"
              >
                Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Controls Row: Result count + Sort ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-navy">{resultCount.toLocaleString()}</span>{' '}
          {totalCount && resultCount !== totalCount && (
            <>of <span className="font-semibold text-navy">{totalCount.toLocaleString()}</span>{' '}</>
          )}
          investment {resultCount === 1 ? 'property' : 'properties'}
        </p>

        <div className="flex items-center gap-2">
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
          <span className="text-[11px] font-medium text-slate-400 uppercase">Active:</span>
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

      {/* ── Advanced Panel (desktop, smooth expand) ── */}
      <div
        className={`hidden sm:grid transition-all duration-300 ease-in-out ${
          showAdvanced ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <InvestorFiltersAdvanced filters={filters} updateFilter={updateFilter} />
        </div>
      </div>
    </div>
  );
}
