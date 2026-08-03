/**
 * Filter utilities for investor-focused listing filters.
 * Pure functions — no React dependencies.
 */

// One definition of "multi-unit", shared with the multi-unit email so the site
// and the email cannot drift apart on what counts. (multi-unit-data.js is
// dependency-free, so importing it here pulls in nothing else.)
// Relative, not '@/': it keeps this module importable by bare node, which is
// what lets the multi-unit filter be unit-tested without booting Next.
import { MULTI_UNIT_TYPES } from '../../lib/emails/multi-unit-data.js';

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

// ── "Below Market" badge cutoff ──
// evDiffPct compares each listing's price to a rough neighbourhood-average
// estimate — a formula with real spread, so a fixed -3% cutoff badged
// roughly 70% of any given result set "Below Market" (a badge on almost
// everything is a badge on nothing — it stops meaning "this one is a genuine
// standout"). Instead of guessing a new fixed number, derive the cutoff from
// the ACTUAL spread of whatever result set is on screen: the value at its
// own 15th percentile, so only the listings genuinely in the bottom slice of
// this search read as underpriced. Never LOOSER than -3% — a thin or tight
// result set (fewer than 10 priced listings, or one where even the 15th
// percentile is barely negative) should never start badging something that
// is only marginally under its estimate.
export function computeBelowMarketCutoff(listings) {
  const vals = (listings || [])
    .filter((l) => l.estimatedValue > 0 && Number.isFinite(l.evDiffPct))
    .map((l) => l.evDiffPct)
    .sort((a, b) => a - b);
  if (vals.length < 10) return -3;
  const idx = Math.floor(vals.length * 0.15);
  return Math.min(vals[idx], -3);
}

// ── Days-on-market accessors ──
// Two DIFFERENT numbers, and the difference decides which claims are legal:
//
//   domExact(l) — the feed's own days-on-market. 0 = UNKNOWN, never "listed
//     today" (lib/listings/market-timing.js). The only value that supports an
//     "at MOST N days" claim ("New", a DOM range's upper bound).
//   domFloorOf(l) — provable LOWER bound (feed DOM, or how long we have been
//     seeing the listing ourselves). Supports "at LEAST N days" claims
//     (Motivated, longest-first sorting). It cannot support an upper bound:
//     a floor of 10 is equally consistent with a real 10 or a real 300.
//
// Both return 0 for "nothing known", so every caller must check for 0 rather
// than letting it fall through as a small number.
export function domExact(l) {
  const d = Number(l?.dom ?? l?.daysOnMarket);
  return Number.isFinite(d) && d > 0 ? d : 0;
}

export function domFloorOf(l) {
  const f = Number(l?.domFloor);
  return Math.max(Number.isFinite(f) && f > 0 ? f : 0, domExact(l));
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
  { key: 'highcap', label: 'HIGH CAP', tooltip: 'Cap rate 5% or above — higher rental yield relative to purchase price', filter: (l) => l.capRate >= 5 },
  { key: 'motivated', label: 'MOTIVATED', tooltip: 'On market 45+ days — more negotiating leverage', filter: (l) => domFloorOf(l) >= 45 }, // floor = provable minimum, so 45+ is only ever claimed when true
  // Tooltip used to read "Below assessed value with renovation potential",
  // which describes a filter this chip has never applied — it tests time on
  // market and the size of the price cut, not assessed value. Now it states
  // the actual rule, so an investor can judge the result set against it.
  { key: 'brrr', label: 'BRRR', tooltip: 'On market 60+ days AND already cut 5%+ — a seller with room to negotiate on a value-add buy', filter: (l) => domFloorOf(l) >= 60 && l.priceDrop >= 5 },
  { key: 'reduced', label: 'REDUCED', tooltip: 'Price has been reduced since original listing — indicates seller flexibility', filter: (l) => l.priceDrop > 0 },
  // Exact DOM only, never the floor: "within 3 days" is an UPPER bound, and a
  // lower bound cannot establish one. dom 0 = unknown, not new.
  { key: 'new', label: 'NEW', tooltip: 'Listed within the last 3 days', filter: (l) => { const d = domExact(l); return d >= 1 && d <= 3; } },
  { key: 'under800', label: '<$800K', tooltip: 'Priced under $800,000', filter: (l) => l.price < 800000 },
  // Reads the SAME basementTier the listing card badges, instead of a private
  // one-phrase regex. The old filter was /legal basement/ alone, while the
  // site's LEGAL_SUITE_KEYWORDS recognises seven phrasings ("legal suite",
  // "registered basement", "legal bsmt", …) — so a listing the card showed as
  // legal was missed by the filter that exists to find exactly those.
  // Tooltip also corrected: it promised "or has potential", which is a
  // DIFFERENT tier (22 of 99 real rows) that this filter has never included.
  { key: 'suite', label: 'LEGAL SUITE', tooltip: 'Remarks state a legal or registered second suite — not merely a separate entrance or finished basement', filter: (l) => l.basementTier === 'legal' },
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
  { key: 'dom', label: 'DOM (Longest First)', fn: (a, b) => domFloorOf(b) - domFloorOf(a) },
  // Unknown age (0) must sort LAST here, not first. Ascending on a raw
  // 0-means-unknown value put every listing whose age the feed withholds at
  // the very top of "Newest First" — presenting no-data listings as the
  // freshest inventory on the page, on the sort an investor uses precisely to
  // find what just came to market. Harmless while every listing was 0 (the
  // sort was a no-op); wrong the moment real DOM started flowing beside them.
  { key: 'domNew', label: 'DOM (Newest First)', fn: (a, b) => (domFloorOf(a) || Infinity) - (domFloorOf(b) || Infinity) },
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
  // Accept both `hoods` (plural, from the filter UI) and `hood` (singular — used
  // by the neighbourhood guides' "View Live Listings in {Hood}" CTA, the homepage
  // popular-hood chips + hood cards, market-pulse, and the /neighbourhoods index).
  // Only `hoods` was read before, so every `?hood=` link silently landed on the
  // UNFILTERED list. Build a fresh array so we never mutate the shared DEFAULT_FILTERS.
  const hoodsParam = searchParams.get('hoods');
  const singleHood = searchParams.get('hood');
  const hoodList = [
    ...(hoodsParam ? hoodsParam.split(',') : []),
    ...(singleHood ? [singleHood] : []),
  ]
    .map((h) => h.trim())
    .filter(Boolean);
  if (hoodList.length) f.neighbourhoods = [...new Set(hoodList)];
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

// ── Is this the whole set? ──
// True when applyFilters would return every listing handed to it (only the
// SORT differs, which reorders but never removes). Callers use this to decide
// whether a whole-market aggregate still describes what is on screen — the
// moment any filter narrows the set, it does not.
//
// Deliberately checks the three membership filters countActiveFilters ignores
// (search text, property type, strategy chips) as well as its twelve.
export function hasNoActiveFilters(filters) {
  if (!filters) return false;
  if ((filters.search || '').trim()) return false;
  if (filters.propertyType !== 'All') return false;
  if ((filters.activeStrategies || []).length > 0) return false;
  return countActiveFilters(filters) === 0;
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
      // Reuse the SAME type list the multi-unit email counts from, so the site
      // and the email can never disagree about what "multi-unit" means. The
      // hand-written test here was `duplex || multi || triplex`, which silently
      // excluded FOURPLEX — a fourplex would have been invisible under this
      // filter while the email counted it.
      if (key === 'duplex/multi') return MULTI_UNIT_TYPES.some((m) => t.includes(m.toLowerCase()));
      // 'Detached' must NOT swallow 'Semi-Detached' — 'semi-detached' contains
      // the substring 'detached', so the plain includes() test below put every
      // semi into the Detached bucket. Measured on 99 real production rows:
      // the Detached filter returned 49, of which 11 (22%) were semis. Both
      // buckets are now exact on the mapped type, which is a closed set from
      // mapType() — and mapType's fallback IS 'Detached', so nothing is lost.
      if (key === 'detached') return l.type === 'Detached';
      if (key === 'semi') return l.type === 'Semi-Detached';
      // Town / Condo keep substring matching on purpose: a condo townhouse is
      // genuinely both, and appears under each — verified as 20 rows that are
      // type 'Townhouse' with a condo subType.
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

  // DOM range. Split by which bound is in play, because the two bounds need
  // different evidence:
  //   - a MAX ("under 30 days") is an upper-bound claim, so it needs the exact
  //     feed DOM. The old test used raw `l.dom`, where 0 = unknown, so every
  //     listing of unknown age passed any range starting at 0 — a card reading
  //     "45+ DOM" would sit inside a "max 30 days" result set.
  //   - a MIN only ("60+ days") is satisfied by the provable floor, so a
  //     listing we have watched for 60 days still qualifies even when the feed
  //     withholds its DOM.
  if (filters.domRange[0] > 0 || filters.domRange[1] < 365) {
    const [dMin, dMax] = filters.domRange;
    result = result.filter((l) => {
      if (dMax < 365) {
        const exact = domExact(l);
        return exact >= 1 && exact >= dMin && exact <= dMax;
      }
      return domFloorOf(l) >= dMin;
    });
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
