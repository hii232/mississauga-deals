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
  { key: 'cf', label: 'CF+', tooltip: 'Cash flow positive — estimated monthly rent exceeds all expenses including mortgage', filter: (l) => l.cashFlow > 0 },
  { key: 'highcap', label: 'HIGH CAP', tooltip: 'Cap rate above 4% — higher rental yield relative to purchase price', filter: (l) => l.capRate >= 5 },
  { key: 'motivated', label: 'MOTIVATED', tooltip: 'On market 45+ days — more negotiating leverage', filter: (l) => l.dom >= 45 },
  { key: 'brrr', label: 'BRRR', tooltip: 'Below assessed value with renovation potential — good for Buy Rehab Rent Refinance strategy', filter: (l) => l.dom >= 60 && l.priceDrop >= 5 },
  { key: 'reduced', label: 'REDUCED', tooltip: 'Price has been reduced since original listing — indicates seller flexibility', filter: (l) => l.priceDrop > 0 },
  { key: 'new', label: 'NEW', tooltip: 'Listed within the last 3 days', filter: (l) => l.dom <= 3 },
  { key: 'under800', label: '<$800K', tooltip: 'Priced under $800,000', filter: (l) => l.price < 800000 },
  { key: 'suite', label: 'LEGAL SUITE', tooltip: 'Property has or has potential for a legal basement apartment', filter: (l) => /legal basement/i.test(l.remarks || '') },
  { key: 'pos', label: 'POWER OF SALE', tooltip: 'Lender-forced sale — potential below-market pricing opportunity', filter: (l) => isPowerOfSale(l.remarks) },
];

// ── Sort Options ──
export const SORT_OPTIONS = [
  { key: 'score', label: 'Score (Best Deals)', fn: (a, b) => b.hamzaScore - a.hamzaScore },
  { key: 'cashflow', label: 'Cash Flow (Best CF)', fn: (a, b) => b.cashFlow - a.cashFlow },
  { key: 'caprate', label: 'Cap Rate (Highest Yield)', fn: (a, b) => b.capRate - a.capRate },
  { key: 'price', label: 'Price (Low to High)', fn: (a, b) => a.price - b.price },
  { key: 'priceDesc', label: 'Price (High to Low)', fn: (a, b) => b.price - a.price },
  { key: 'dom', label: 'DOM (Longest First)', fn: (a, b) => b.dom - a.dom },
  { key: 'domNew', label: 'DOM (Newest First)', fn: (a, b) => a.dom - b.dom },
  { key: 'drop', label: 'Price Drop (Biggest Cuts)', fn: (a, b) => b.priceDrop - a.priceDrop },
  { key: 'rent', label: 'Rent (Highest)', fn: (a, b) => b.estimatedRent - a.estimatedRent },
  { key: 'coc', label: 'CoC Return', fn: (a, b) => b.cashOnCash - a.cashOnCash },
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
