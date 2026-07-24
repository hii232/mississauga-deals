import { DEFAULT_FILTERS, PROPERTY_TYPES, STRATEGY_CHIPS } from '@/components/listings/filter-utils';

// ─────────────────────────────────────────────────────────────────────────────
//  Canonical saved-search filter sanitizer.
//
//  THE bug this fixes: the pipeline had three filter shapes. The Save-Search
//  button POSTs the CLIENT format (the shape applyFilters consumes), but the
//  subscribe API sanitized against a disjoint legacy allow-list
//  (minPrice/maxPrice/minBeds/...), so every saved search stored ~EMPTY filters
//  — and the daily cron (which merges onto DEFAULT_FILTERS and runs
//  applyFilters) matched essentially ALL listings instead of the user's
//  criteria. The /alerts form used a third shape and never reached
//  saved_searches at all.
//
//  This module makes the CLIENT format (filter-utils' DEFAULT_FILTERS shape)
//  the single canonical stored format:
//   • accepts client-format keys, validated + bounded (never trust the wire)
//   • maps the legacy simple keys (minPrice/maxPrice/minBeds/type/hood/
//     minScore) onto the canonical shape so old callers keep working
//   • returns ONLY keys that differ from DEFAULT_FILTERS (compact storage;
//     the cron merges onto DEFAULT_FILTERS anyway)
// ─────────────────────────────────────────────────────────────────────────────

const STRATEGY_KEYS = new Set(STRATEGY_CHIPS.map((c) => c.key));

const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
};
const str = (v, cap) => (typeof v === 'string' ? v.slice(0, cap).trim() : '');
const strArray = (v, maxItems, itemCap) =>
  Array.isArray(v)
    ? v.filter((x) => typeof x === 'string').map((x) => x.slice(0, itemCap).trim()).filter(Boolean).slice(0, maxItems)
    : [];

export function sanitizeSavedSearchFilters(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const f = {};

  // ── Canonical client-format keys ──
  const search = str(raw.search, 100);
  if (search) f.search = search;

  if (typeof raw.propertyType === 'string' && PROPERTY_TYPES.includes(raw.propertyType) && raw.propertyType !== 'All') {
    f.propertyType = raw.propertyType;
  }

  const strategies = strArray(raw.activeStrategies, 12, 20).filter((k) => STRATEGY_KEYS.has(k));
  if (strategies.length) f.activeStrategies = strategies;

  // Price range — accept canonical [min,max]; legacy minPrice/maxPrice map in
  let pmin = Array.isArray(raw.priceRange) ? num(raw.priceRange[0], 0, 20000000) : null;
  let pmax = Array.isArray(raw.priceRange) ? num(raw.priceRange[1], 0, 20000000) : null;
  if (pmin === null && raw.minPrice !== undefined) pmin = num(raw.minPrice, 0, 20000000);
  if (pmax === null && raw.maxPrice !== undefined) pmax = num(raw.maxPrice, 0, 20000000);
  const [dmin0, dmax0] = DEFAULT_FILTERS.priceRange;
  if (pmin !== null || pmax !== null) {
    let lo = pmin ?? dmin0;
    let hi = pmax ?? dmax0;
    if (hi > 0 && lo > hi) [lo, hi] = [hi, lo];
    if (hi === 0) hi = dmax0; // "0" max = no max
    if (lo !== dmin0 || hi !== dmax0) f.priceRange = [lo, hi];
  }

  const beds = raw.beds !== undefined && raw.beds !== null ? num(raw.beds, 0, 10) : raw.minBeds !== undefined ? num(raw.minBeds, 0, 10) : null;
  if (beds) f.beds = beds;
  const baths = raw.baths !== undefined && raw.baths !== null ? num(raw.baths, 0, 10) : null;
  if (baths) f.baths = baths;

  const cap = num(raw.minCapRate, 0, 30);
  if (cap) f.minCapRate = cap;
  const cf = raw.minCashFlow !== undefined && raw.minCashFlow !== null ? num(raw.minCashFlow, -10000, 10000) : null;
  if (cf !== null && cf !== 0) f.minCashFlow = cf;
  const coc = num(raw.minCashOnCash, 0, 100);
  if (coc) f.minCashOnCash = coc;
  const score = raw.minDealScore !== undefined && raw.minDealScore !== null ? num(raw.minDealScore, 0, 10) : raw.minScore !== undefined ? num(raw.minScore, 0, 10) : null;
  if (score) f.minDealScore = score;

  if (Array.isArray(raw.domRange)) {
    const lo = num(raw.domRange[0], 0, 365) ?? 0;
    const hi = num(raw.domRange[1], 0, 365) ?? 365;
    if (lo !== 0 || hi !== 365) f.domRange = [Math.min(lo, hi), Math.max(lo, hi)];
  }

  // Neighbourhoods — accept canonical array; legacy single `hood` maps in
  let hoods = strArray(raw.neighbourhoods, 30, 60);
  const legacyHood = str(raw.hood, 60);
  if (legacyHood) hoods = [...new Set([...hoods, legacyHood])];
  if (hoods.length) f.neighbourhoods = hoods;

  if (raw.lrtOnly === true) f.lrtOnly = true;
  if (raw.hasBasementSuite === true) f.hasBasementSuite = true;
  if (raw.isPowerOfSale === true) f.isPowerOfSale = true;

  // Region scope — which listing pool this search runs against. 'Mississauga'
  // (or absent, for legacy rows) = the Mississauga feed; 'GTA' = the whole GTA
  // feed; any other city = the GTA feed filtered to that city. Stored alongside
  // the filters; applyFilters ignores unknown keys, the cron reads it.
  const city = str(raw.city, 60);
  if (city) f.city = city;

  return f;
}

// ── Pool selection for the daily alert cron ──
// A saved search matches only listings from its own region. Legacy rows (no
// city) are Mississauga searches — exactly the old behavior.
export function poolForSearch(filters, mississaugaListings, gtaListings) {
  const city = filters?.city;
  if (!city || city === 'Mississauga') return mississaugaListings;
  if (city === 'GTA') return gtaListings;
  return gtaListings.filter((l) => (l.city || '') === city);
}
