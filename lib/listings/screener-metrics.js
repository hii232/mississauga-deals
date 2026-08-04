/**
 * The Deal Screener's headline aggregate - ONE implementation, deliberately
 * dependency-free so both sides of the site can use it:
 *
 *   - components/listings/deal-screener.js computes it over whatever the
 *     browser has loaded (and over the user's filtered slice).
 *   - app/api/market-stats/route.js computes it ONCE, server-side, over the
 *     WHOLE active feed it already walks - so the dashboard can state correct
 *     market-wide figures at first paint instead of waiting ~25 round trips.
 *
 * Sharing the function is the point: a second copy would let the server's
 * "best cash flow" and the browser's "best cash flow" drift apart for the same
 * market, which is exactly the class of bug this file exists to end.
 *
 * NOTHING here scores, prices or underwrites anything - it only aggregates
 * fields the cash-flow engine already produced.
 */

export const EMPTY_SCREENER_METRICS = {
  total: 0, avgPrice: 0, avgScore: 0, avgDom: 0, avgRent: 0,
  avgCf: 0, avgCoc: 0, bestCf: 0, bestCap: 0, cfPlusCount: 0,
  priceDropCount: 0, suites: 0,
};

/**
 * Aggregate a set of processed listings. Semantics are unchanged from the
 * dashboard's original inline version: plain means for cash flow / CoC,
 * non-zero-only means for price, score, DOM and rent (a missing value is
 * absent, not a zero that drags the average down).
 */
export function computeScreenerMetrics(listings) {
  if (!listings || !listings.length) return { ...EMPTY_SCREENER_METRICS };

  const sum = (fn) => listings.reduce((acc, l) => acc + fn(l), 0);
  const avg = (fn) => sum(fn) / listings.length;
  // Average only non-zero values to avoid skewing from missing data
  const avgNonZero = (fn) => {
    const valid = listings.filter((l) => fn(l) > 0);
    return valid.length ? valid.reduce((acc, l) => acc + fn(l), 0) / valid.length : 0;
  };
  const cfPlusListings = listings.filter((l) => l.cashFlow > 0);
  const bestCfListing = listings.reduce((best, l) => (l.cashFlow > best.cashFlow ? l : best));
  const bestCapListing = listings.reduce((best, l) => (l.capRate > best.capRate ? l : best));
  const priceDropCount = listings.filter((l) => l.priceDrop > 0).length;

  return {
    total: listings.length,
    avgPrice: avgNonZero((l) => l.price),
    avgScore: avgNonZero((l) => l.hamzaScore),
    avgDom: avgNonZero((l) => l.dom),
    avgRent: avgNonZero((l) => l.estimatedRent),
    avgCf: avg((l) => l.cashFlow),
    avgCoc: avg((l) => l.cashOnCash),
    bestCf: bestCfListing.cashFlow,
    bestCap: bestCapListing.capRate,
    cfPlusCount: cfPlusListings.length,
    priceDropCount,
    suites: listings.filter((l) => l.hasSuite).length,
  };
}

/**
 * The figures that are MEANINGLESS on a partial set.
 *
 * Every one of these is a max or a count over whichever listings happen to have
 * arrived: they do not converge as the feed streams in, they lurch. Measured on
 * a real phone on 2026-07-31, seconds apart on the same page load:
 *
 *   30 of 2,493 analyzed  → CF+ 0   · BEST CAP 4.7% · BEST CF -$278/mo · DROPS 3
 *   524 of 2,493 analyzed → CF+ 1   · BEST CAP 5.6% · BEST CF  +$41/mo · DROPS 107
 *
 * An investor who landed in that first window was told, in the site's own
 * confident dashboard type, that this market has ZERO cash-flowing deals and
 * that its best property loses $278/month. Both false, and false in the most
 * discouraging possible direction on the page that is meant to sell them.
 *
 * Averages over a random slice (price, rent, DOM) are honest estimates of the
 * whole and are NOT withheld - they wobble by a few percent, they do not flip
 * sign. Everything below is withheld until the set is settled.
 */
export const PARTIAL_SET_WITHHELD = [
  'cfPlusCount', 'bestCap', 'bestCf', 'priceDropCount', 'avgScore',
  'suites', 'avgCf', 'avgCoc',
];

const SUMMARY_KEYS = Object.keys(EMPTY_SCREENER_METRICS);

/**
 * Decide what the dashboard is allowed to state, given how much of the market
 * it actually has. Returns { metrics, state }:
 *
 *   'complete' - the loaded set IS the answer (whole market, or the user's
 *                filtered slice of a fully-loaded market). Metrics pass through
 *                untouched: the final render is byte-for-byte what it was.
 *   'market'   - still loading, but a trustworthy whole-market aggregate is
 *                available (the server already walked the entire feed). Show
 *                the real market-wide figures immediately.
 *   'partial'  - still loading with no aggregate to fall back on. Every
 *                set-dependent figure becomes null, and a null renders as a
 *                skeleton rather than a number. Showing nothing beats showing
 *                something false.
 */
export function resolveScreenerMetrics(metrics, { analysisComplete = true, summary = null } = {}) {
  if (analysisComplete) return { metrics, state: 'complete' };

  const fromSummary = normalizeSummary(summary);
  if (fromSummary) return { metrics: fromSummary, state: 'market' };

  const withheld = { ...metrics };
  for (const key of PARTIAL_SET_WITHHELD) withheld[key] = null;
  return { metrics: withheld, state: 'partial' };
}

/**
 * Accept a server summary only if it is complete and numeric. A half-populated
 * aggregate would reintroduce the exact bug this guards against, so anything
 * missing a key sends the dashboard back to skeletons.
 */
export function normalizeSummary(summary) {
  if (!summary || typeof summary !== 'object') return null;
  if (!(Number(summary.total) > 0)) return null;
  const out = {};
  for (const key of SUMMARY_KEYS) {
    const v = Number(summary[key]);
    if (!Number.isFinite(v)) return null;
    out[key] = v;
  }
  return out;
}
