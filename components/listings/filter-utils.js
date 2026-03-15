/**
 * Filter utilities for investor-focused listing filters.
 * Pure functions — no React dependencies.
 */

// ── Power of Sale / Foreclosure Detection ──
const POS_RE = /\b(power of sale|foreclosure|bank owned|bank[- ]sale|bank repo|lender[- ]owned|estate sale|judicial sale|court[- ]ordered|as[- ]is where[- ]is|sold as[- ]is|no represent|receivership|vesting order|must sell|must be sold|below market|priced to sell|investor alert|handyman|fixer[- ]upper|needs work|as is|tenant occupied|vacant possession)\b/i;

export function isPowerOfSale(remarks) {
  return POS_RE.test(remarks || '');
}

// ── Default Filter State ──
export const DEFAULT_FILTERS = {
  search: '',
  propertyType: 'All',
  activeStrategies: [],
  sortKey: 'score',
  priceRange: [0, 3000000],
  beds: null,
  baths: null,
  minCapRate: null,
  minCashFlow: null,
  minCashOnCash: null,
  minDealScore: null,
  domRange: [0, 365],
  neighbourhoods: [],
  lrtOnly: false,
  hasBasementSuite: false,
  isPowerOfSale: false,
};

// ── Property Types ──
export const PROPERTY_TYPES = ['All', 'Detached', 'Semi', 'Town', 'Condo', 'Duplex/Multi'];

// ── Strategy Chips ──
export const STRATEGY_CHIPS = [
  { key: 'cf', label: 'CF+', filter: (l) => l.cashFlow > 0 },
  { key: 'highcap', label: 'HIGH CAP', filter: (l) => l.capRate >= 5 },
  { key: 'motivated', label: 'MOTIVATED', filter: (l) => l.dom >= 45 },
  { key: 'brrr', label: 'BRRR', filter: (l) => l.dom >= 60 && l.priceDrop >= 5 },
  { key: 'reduced', label: 'REDUCED', filter: (l) => l.priceDrop > 0 },
  { key: 'new', label: 'NEW', filter: (l) => l.dom <= 3 },
  { key: 'under800', label: '<$800K', filter: (l) => l.price < 800000 },
  { key: 'suite', label: 'LEGAL SUITE', filter: (l) => /legal basement/i.test(l.remarks || '') },
  { key: 'pos', label: 'POWER OF SALE', filter: (l) => isPowerOfSale(l.remarks) },
];

// ── Sort Options ──
export const SORT_OPTIONS = [
  { key: 'score', label: 'Score', fn: (a, b) => b.hamzaScore - a.hamzaScore },
  { key: 'price', label: 'Price', fn: (a, b) => a.price - b.price },
  { key: 'dom', label: 'DOM', fn: (a, b) => b.dom - a.dom },
  { key: 'drop', label: 'Price Drop', fn: (a, b) => b.priceDrop - a.priceDrop },
  { key: 'cashflow', label: 'Cash Flow', fn: (a, b) => b.cashFlow - a.cashFlow },
  { key: 'caprate', label: 'Cap Rate', fn: (a, b) => b.capRate - a.capRate },
  { key: 'coc', label: 'CoC Return', fn: (a, b) => b.cashOnCash - a.cashOnCash },
  { key: 'rent', label: 'Est. Rent', fn: (a, b) => b.estimatedRent - a.estimatedRent },
];

// ── Neighbourhood List (from HOOD_DATA keys) ──
export const NEIGHBOURHOODS = [
  'Clarkson', 'Port Credit', 'Lakeview', 'Lorne Park', 'Mineola',
  'Lakeview Village', 'Churchill Meadows', 'Streetsville', 'Erin Mills',
  'Central Erin Mills', 'Cooksville', 'Hurontario', 'City Centre',
  'Mississauga Valleys', 'East Credit', 'Erindale', 'Applewood',
  'Dixie', 'Rathwood', 'Sheridan', 'Meadowvale', 'Lisgar',
  'Heartland', 'Malton',
];

// ── Count Active Filters ──
export function countActiveFilters(filters) {
  let count = 0;
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 3000000) count++;
  if (filters.beds !== null) count++;
  if (filters.baths !== null) count++;
  if (filters.minCapRate !== null) count++;
  if (filters.minCashFlow !== null) count++;
  if (filters.minCashOnCash !== null) count++;
  if (filters.minDealScore !== null) count++;
  if (filters.domRange[0] > 0 || filters.domRange[1] < 365) count++;
  if (filters.neighbourhoods.length > 0) count++;
  if (filters.lrtOnly) count++;
  if (filters.hasBasementSuite) count++;
  if (filters.isPowerOfSale) count++;
  return count;
}

// ── Apply All Filters ──
export function applyFilters(listings, filters) {
  let result = [...listings];

  // Search
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (l) =>
        l.address.toLowerCase().includes(q) ||
        l.neighbourhood.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q)
    );
  }

  // Property type
  if (filters.propertyType !== 'All') {
    result = result.filter((l) => {
      const t = (l.type + ' ' + (l.subType || '')).toLowerCase();
      const key = filters.propertyType.toLowerCase();
      if (key === 'duplex/multi') return t.includes('duplex') || t.includes('multi') || t.includes('triplex');
      return t.includes(key);
    });
  }

  // Strategy filters (AND logic)
  for (const sKey of filters.activeStrategies) {
    const chip = STRATEGY_CHIPS.find((c) => c.key === sKey);
    if (chip) result = result.filter(chip.filter);
  }

  // Price range
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 3000000) {
    result = result.filter((l) => l.price >= filters.priceRange[0] && l.price <= filters.priceRange[1]);
  }

  // Beds
  if (filters.beds !== null) result = result.filter((l) => l.beds >= filters.beds);

  // Baths
  if (filters.baths !== null) result = result.filter((l) => l.baths >= filters.baths);

  // Cap rate
  if (filters.minCapRate !== null) result = result.filter((l) => l.capRate >= filters.minCapRate);

  // Cash flow
  if (filters.minCashFlow !== null) result = result.filter((l) => l.cashFlow >= filters.minCashFlow);

  // CoC
  if (filters.minCashOnCash !== null) result = result.filter((l) => l.cashOnCash >= filters.minCashOnCash);

  // Deal score
  if (filters.minDealScore !== null) result = result.filter((l) => l.hamzaScore >= filters.minDealScore);

  // DOM range
  if (filters.domRange[0] > 0 || filters.domRange[1] < 365) {
    result = result.filter((l) => l.dom >= filters.domRange[0] && l.dom <= filters.domRange[1]);
  }

  // Neighbourhoods
  if (filters.neighbourhoods.length > 0) {
    result = result.filter((l) => filters.neighbourhoods.includes(l.neighbourhood));
  }

  // LRT only
  if (filters.lrtOnly) result = result.filter((l) => l.lrtAccess);

  // Basement suite
  if (filters.hasBasementSuite) result = result.filter((l) => l.hasSuite);

  // Power of sale
  if (filters.isPowerOfSale) result = result.filter((l) => isPowerOfSale(l.remarks));

  // Sort
  const sortOpt = SORT_OPTIONS.find((s) => s.key === filters.sortKey);
  if (sortOpt) result.sort(sortOpt.fn);

  return result;
}
