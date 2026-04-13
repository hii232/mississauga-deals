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
  { key: 'cf', label: 'Cash Flowing', tooltip: 'Cash flow positive — estimated monthly rent exceeds all expenses including mortgage', filter: (l) => l.cashFlow > 0 },
  { key: 'highcap', label: 'HIGH CAP', tooltip: 'Cap rate above 4% — higher rental yield relative to purchase price', filter: (l) => l.capRate >= 5 },
  { key: 'motivated', label: 'MOTIVATED', tooltip: 'On market 45+ days — more negotiating leverage', filter: (l) => l.dom >= 45 },
  { key: 'brrr', label: 'BRRR', tooltip: 'Below assessed value with renovation potential — good for Buy Rehab Rent Refinance strategy', filter: (l) => l.dom >= 60 && l.priceDrop >= 5 },
  { key: 'reduced', label: 'REDUCED', tooltip: 'Price has been reduced since original listing — indicates seller flexibility', filter: (l) => l.priceDrop > 0 },
  { key: 'new', label: 'NEW', tooltip: 'Listed within the last 3 days', filter: (l) => l.dom <= 3 },
  { key: 'under800', label: '<$800K', tooltip: 'Priced under $800,000', filter: (l) => l.price < 800000 },
  { key: 'suite', label: 'LEGAL SUITE', tooltip: 'Property has or has potential for a legal basement apartment', filter: (l) => /legal basement/i.test(l.remarks || '') },
  { key: 'pos', label: 'POWER OF SALE', tooltip: 'Lender-forced sale — potential below-market pricing opportunity', filter: (l) => isPowerOfSale(l.remarks) },
  { key: 'fixer', label: 'FIXER UPPER', tooltip: 'Property needs work — keywords like TLC, fixer upper, handyman special detected in listing remarks', filter: (l) => isFixerUpper(l.remarks) },
  { key: 'hightransit', label: 'HIGH TRANSIT', tooltip: 'Transit score 7+ — near GO stations, LRT, major bus routes', filter: (l) => (l.transitScore || 0) >= 7 },
  { key: 'topschools', label: 'TOP SCHOOLS', tooltip: 'School score 8+ — highly rated school district', filter: (l) => (l.schoolScore || 0) >= 8 },
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

// ── URL Serialization ──
// Serialize filters to URL search params (only non-default values)
export function serializeFilters(filters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.propertyType !== 'All') params.set('type', filters.propertyType);
  if (filters.activeStrategies.length > 0) params.set('s', filters.activeStrategies.join(','));
  if (filters.sortKey !== 'score') params.set('sort', filters.sortKey);
  if (filters.priceRange[0] > 0) params.set('pmin', String(filters.priceRange[0]));
  if (filters.priceRange[1] < 3000000) params.set('pmax', String(filters.priceRange[1]));
  if (filters.beds !== null) params.set('beds', String(filters.beds));
  if (filters.baths !== null) params.set('baths', String(filters.baths));
  if (filters.minCapRate !== null) params.set('cap', String(filters.minCapRate));
  if (filters.minCashFlow !== null) params.set('cf', String(filters.minCashFlow));
  if (filters.minCashOnCash !== null) params.set('coc', String(filters.minCashOnCash));
  if (filters.minDealScore !== null) params.set('score', String(filters.minDealScore));
  if (filters.domRange[0] > 0) params.set('dmin', String(filters.domRange[0]));
  if (filters.domRange[1] < 365) params.set('dmax', String(filters.domRange[1]));
  if (filters.neighbourhoods.length > 0) params.set('hoods', filters.neighbourhoods.join(','));
  if (filters.lrtOnly) params.set('lrt', '1');
  if (filters.hasBasementSuite) params.set('suite', '1');
  if (filters.isPowerOfSale) params.set('pos', '1');
  return params.toString();
}

// Deserialize URL search params to filters object
export function deserializeFilters(searchParams) {
  const f = { ...DEFAULT_FILTERS };
  const q = searchParams.get('q');
  if (q) f.search = q;
  const type = searchParams.get('type');
  if (type && PROPERTY_TYPES.includes(type)) f.propertyType = type;
  const s = searchParams.get('s');
  if (s) f.activeStrategies = s.split(',').filter((k) => STRATEGY_CHIPS.some((c) => c.key === k));
  const sort = searchParams.get('sort');
  if (sort && SORT_OPTIONS.some((o) => o.key === sort)) f.sortKey = sort;
  const pmin = searchParams.get('pmin');
  if (pmin) f.priceRange = [Number(pmin) || 0, f.priceRange[1]];
  const pmax = searchParams.get('pmax');
  if (pmax) f.priceRange = [f.priceRange[0], Number(pmax) || 3000000];
  const beds = searchParams.get('beds');
  if (beds) f.beds = Number(beds) || null;
  const baths = searchParams.get('baths');
  if (baths) f.baths = Number(baths) || null;
  const cap = searchParams.get('cap');
  if (cap) f.minCapRate = Number(cap) || null;
  const cf = searchParams.get('cf');
  if (cf) f.minCashFlow = Number(cf) || null;
  const coc = searchParams.get('coc');
  if (coc) f.minCashOnCash = Number(coc) || null;
  const scoreMin = searchParams.get('score');
  if (scoreMin) f.minDealScore = Number(scoreMin) || null;
  const dmin = searchParams.get('dmin');
  if (dmin) f.domRange = [Number(dmin) || 0, f.domRange[1]];
  const dmax = searchParams.get('dmax');
  if (dmax) f.domRange = [f.domRange[0], Number(dmax) || 365];
  const hoods = searchParams.get('hoods');
  if (hoods) f.neighbourhoods = hoods.split(',');
  if (searchParams.get('lrt') === '1') f.lrtOnly = true;
  if (searchParams.get('suite') === '1') f.hasBasementSuite = true;
  if (searchParams.get('pos') === '1') f.isPowerOfSale = true;
  // Page number
  const page = searchParams.get('page');
  f._page = page ? Number(page) || 1 : 1;
  return f;
}

// ── Price Presets ──
export const PRICE_PRESETS = [
  { label: '<$400K', range: [0, 400000] },
  { label: '$400-600K', range: [400000, 600000] },
  { label: '$600-800K', range: [600000, 800000] },
  { label: '$800K-1M', range: [800000, 1000000] },
  { label: '$1-1.5M', range: [1000000, 1500000] },
  { label: '$1.5M+', range: [1500000, 3000000] },
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
