/**
 * Filter utilities for investor-focused listing filters.
 * Pure functions — no React dependencies.
 */

// ── Power of Sale / Foreclosure Detection ──
const POS_RE = /\b(power of sale|foreclosure|bank owned|bank[- ]sale|bank repo|lender[- ]owned|estate sale|judicial sale|court[- ]ordered|as[- ]is where[- ]is|sold as[- ]is|no represent|receivership|vesting order|must sell|must be sold|below market|priced to sell|investor alert|handyman|fixer[- ]upper|needs work|as is|tenant occupied|vacant possession)\b/i;

export function isPowerOfSale(remarks) {
  return POS_RE.test(remarks || '');
}

// ── Fixer Upper / TLC Detection ──
const FIXER_RE = /\b(tlc|fixer[- ]upper|handyman[- ]special|needs work|needs updating|needs renovation|needs reno|requires work|requires updating|as[- ]is condition|sold as[- ]is|renovation potential|reno potential|investor special|diamond in the rough|bring your contractor|bring your vision|sweat equity|great bones|good bones|needs some love|needs love|cosmetic updates needed|needs cosmetic|renovator)/i;

export function isFixerUpper(remarks) {
  return FIXER_RE.test(remarks || '');
}

// ── Default Filter State ──
export const DEFAULT_FILTERS = {
  search: '',
  propertyType: 'All',
  strategy: null,        // single-select strategy key
  sortKey: 'score',
  priceRange: [0, 3000000],
  pricePreset: null,     // key from PRICE_PRESETS
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

// ── Strategy Presets (single-select dropdown) ──
export const STRATEGIES = [
  {
    key: 'cashflow',
    label: 'Cash Flow',
    description: 'Cash flow positive or near-positive properties',
    filter: (l) => l.cashFlow >= -50,
  },
  {
    key: 'brrr',
    label: 'BRRR',
    description: 'Buy Rehab Rent Refinance — reduced/motivated + renovation potential',
    filter: (l) => (l.priceDrop > 0 || l.dom >= 45) && (isFixerUpper(l.remarks) || l.priceDrop >= 5),
  },
  {
    key: 'suite',
    label: 'Suite Income',
    description: 'Properties with legal suite or suite potential for rental income',
    filter: (l) => l.hasSuite || l.basementTier === 'legal' || l.basementTier === 'potential',
  },
  {
    key: 'appreciation',
    label: 'Appreciation',
    description: 'New listings in high-demand areas — growth play',
    filter: (l) => l.dom <= 14,
  },
  {
    key: 'value',
    label: 'Value Buy',
    description: 'Fixer uppers, TLC, handyman specials, power of sale, price drops, motivated sellers',
    filter: (l) => l.priceDrop > 0 || l.dom >= 45 || isPowerOfSale(l.remarks) || isFixerUpper(l.remarks),
  },
];

// ── Price Presets ──
export const PRICE_PRESETS = [
  { key: 'under600', label: 'Under $600K', range: [0, 600000] },
  { key: '600-800', label: '$600K – $800K', range: [600000, 800000] },
  { key: '800-1m', label: '$800K – $1M', range: [800000, 1000000] },
  { key: '1m-1.5m', label: '$1M – $1.5M', range: [1000000, 1500000] },
  { key: 'over1.5m', label: '$1.5M+', range: [1500000, 3000000] },
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
  { key: 'transit', label: 'Transit Score', fn: (a, b) => (b.transitScore || 0) - (a.transitScore || 0) },
  { key: 'school', label: 'School Score', fn: (a, b) => (b.schoolScore || 0) - (a.schoolScore || 0) },
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

// ── Count Active Filters (for badge) ──
export function countActiveFilters(filters) {
  let count = 0;
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 3000000) count++;
  if (filters.beds !== null) count++;
  if (filters.baths !== null) count++;
  if (filters.strategy) count++;
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

  // Strategy preset (single-select)
  if (filters.strategy) {
    const strat = STRATEGIES.find((s) => s.key === filters.strategy);
    if (strat) result = result.filter(strat.filter);
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
