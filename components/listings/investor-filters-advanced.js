'use client';

import { useState, useRef, useEffect } from 'react';
import { NEIGHBOURHOODS } from './filter-utils';

// ── Toggle Switch ──
function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-navy">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ${
          checked ? 'bg-accent' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${
            checked ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}

// ── Metric Input ──
function MetricInput({ label, value, onChange, placeholder, step = 1, prefix = '', suffix = '' }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span>
        )}
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? null : Number(v));
          }}
          placeholder={placeholder}
          step={step}
          className={`w-full rounded-lg border border-slate-200 bg-white py-2 text-sm text-navy placeholder:text-slate-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
            prefix ? 'pl-7 pr-3' : suffix ? 'pl-3 pr-8' : 'px-3'
          }`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{suffix}</span>
        )}
      </div>
    </div>
  );
}

// ── Neighbourhood Multi-Select Dropdown ──
function NeighbourhoodSelect({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggle(hood) {
    if (selected.includes(hood)) {
      onChange(selected.filter((h) => h !== hood));
    } else {
      onChange([...selected, hood]);
    }
  }

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Neighbourhoods
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        <span className={selected.length === 0 ? 'text-slate-300' : ''}>
          {selected.length === 0 ? 'All neighbourhoods' : `${selected.length} selected`}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full px-3 py-1.5 text-left text-xs font-medium text-accent hover:bg-slate-50"
            >
              Clear all
            </button>
          )}
          {NEIGHBOURHOODS.map((hood) => (
            <label
              key={hood}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm text-navy hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(hood)}
                onChange={() => toggle(hood)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-accent focus:ring-accent/20"
              />
              {hood}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Advanced Filters Panel ──
export function InvestorFiltersAdvanced({ filters, updateFilter }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="divide-y divide-slate-100">
        {/* Investment Metrics */}
        <div className="p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Investment Metrics
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricInput
              label="Min Cap Rate"
              value={filters.minCapRate}
              onChange={(v) => updateFilter('minCapRate', v)}
              placeholder="e.g. 4"
              step={0.5}
              suffix="%"
            />
            <MetricInput
              label="Min Cash Flow"
              value={filters.minCashFlow}
              onChange={(v) => updateFilter('minCashFlow', v)}
              placeholder="e.g. 0"
              step={100}
              prefix="$"
            />
            <MetricInput
              label="Min CoC Return"
              value={filters.minCashOnCash}
              onChange={(v) => updateFilter('minCashOnCash', v)}
              placeholder="e.g. 5"
              step={0.5}
              suffix="%"
            />
            <MetricInput
              label="Min Deal Score"
              value={filters.minDealScore}
              onChange={(v) => updateFilter('minDealScore', v)}
              placeholder="e.g. 6"
              step={0.5}
            />
          </div>
        </div>

        {/* Market Timing */}
        <div className="p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Days on Market
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="number"
                value={filters.domRange[0] || ''}
                onChange={(e) => {
                  const v = e.target.value === '' ? 0 : Number(e.target.value);
                  updateFilter('domRange', [v, filters.domRange[1]]);
                }}
                placeholder="Min"
                min={0}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy placeholder:text-slate-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <span className="text-sm text-slate-400">to</span>
            <div className="flex-1">
              <input
                type="number"
                value={filters.domRange[1] >= 365 ? '' : filters.domRange[1]}
                onChange={(e) => {
                  const v = e.target.value === '' ? 365 : Number(e.target.value);
                  updateFilter('domRange', [filters.domRange[0], v]);
                }}
                placeholder="Max"
                min={0}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy placeholder:text-slate-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Location
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <NeighbourhoodSelect
              selected={filters.neighbourhoods}
              onChange={(v) => updateFilter('neighbourhoods', v)}
            />
            <div className="flex items-end">
              <Toggle
                label="LRT Corridor Only"
                checked={filters.lrtOnly}
                onChange={(v) => updateFilter('lrtOnly', v)}
              />
            </div>
          </div>
        </div>

        {/* Special Features */}
        <div className="p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Special Features
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Toggle
              label="Legal Basement / Suite"
              checked={filters.hasBasementSuite}
              onChange={(v) => updateFilter('hasBasementSuite', v)}
            />
            <Toggle
              label="Power of Sale / Foreclosure"
              checked={filters.isPowerOfSale}
              onChange={(v) => updateFilter('isPowerOfSale', v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
