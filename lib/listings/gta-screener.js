/**
 * ONE walk of the GTA feed → every city's Deal Screener aggregate.
 *
 * WHY THIS EXISTS
 * ---------------
 * /api/market-stats already computes the whole-market screener aggregate for
 * Mississauga on a feed walk it was doing anyway, and /listings hands it to the
 * dashboard as `initialSummary` — so the six set-dependent tiles (CF+ deals,
 * best cap, best cash flow, price drops, avg score, suites) are CORRECT in the
 * first paint instead of ~25 client round trips later. That endpoint is
 * Mississauga-scoped, so the /gta hub and the /gta/[city] pages got nothing and
 * sat on skeletons for their entire background load.
 *
 * The obvious fix — one feed walk per city — was rejected as "27 walks". This
 * module is the alternative: the GTA feed is walked ONCE, the rows are grouped
 * by city, and `computeScreenerMetrics` (the SAME function the browser runs, by
 * deliberate design — see screener-metrics.js) is applied per group plus once
 * over everything. One walk, one underwriting pass, 17-ish city aggregates and
 * a GTA-wide aggregate out the other end.
 *
 * WHAT MAKES IT AFFORDABLE
 * ------------------------
 * Two things, and neither is a guess about upstream speed:
 *
 *  1. `nomedia=1`. The Media $expand is the dominant cost of a feed request
 *     (~5 CDN size-variants per photo, ~18k media rows on a 100-row page) and
 *     an aggregate reads exactly none of it. Dropping it uses the same
 *     no-media $select tiers the existing cascade already falls through to.
 *  2. The Data Cache. Pages are fetched with a 2h revalidate, so a run that
 *     runs out of wall-clock leaves its prefix cached and the NEXT cron run
 *     starts from there — the walk converges across runs instead of needing to
 *     fit in one 60s invocation. Once complete, the 24h response cache means
 *     steady-state cost is ~zero.
 *
 * WHAT IT REFUSES TO PUBLISH
 * --------------------------
 * The whole point of the work this extends is that a max or a count over a
 * partial set is not the market's max or count — it lurches rather than
 * converging, and it lurched in the discouraging direction on the page that
 * exists to sell investors. So:
 *
 *  - Nothing is published unless the walk covered EVERY page with zero drops
 *    and collected at least MIN_FILL of the feed's own browsable total. The
 *    feed is ordered by ModificationTimestamp — city-agnostic — so a truncated
 *    walk is a recency-biased sample of every city at once, not a small sample
 *    of a few. There is no honest per-city number to salvage from it, and a
 *    complete walk is by construction complete for every city in it.
 *  - Cities whose /gta/[city] page cannot be proven to query the same rows are
 *    excluded entirely (see AMBIGUOUS_CITY_KEYS). A summary that describes a
 *    different set than the page then loads would flip when the load lands,
 *    which is the exact bug this is fixing.
 *
 * Consumers get `null` in all of those cases, and null means skeletons.
 */
import { fetchFeedPages } from './fetch-feed';
import { processListings } from './process-listings';
import { computeScreenerMetrics } from './screener-metrics';

// Same 95% bar /api/market-stats uses before it publishes its own aggregate.
export const MIN_FILL = 0.95;

/**
 * /api/listings-gta normalizes the board's City onto the label the cards show:
 * every "Toronto C01"/"Toronto E05" sub-area becomes "Toronto", and
 * "Halton Hills" becomes "Georgetown".
 *
 * Toronto is safe to publish — the page's own request uses
 * startswith(City,'Toronto'), so page and aggregate cover the identical set.
 *
 * The Halton Hills / Georgetown pair is NOT. /gta/halton-hills asks the feed
 * for City eq 'Halton Hills' and those rows arrive here labelled "Georgetown";
 * /gta/georgetown asks for City eq 'Georgetown', which is not the board's name
 * for that municipality. Either way we cannot show that the aggregate and the
 * page describe the same listings, so both keys are withheld and both pages
 * keep today's skeleton behaviour. Fixing the underlying alias is a separate
 * change to the feed route, not something to paper over with a number.
 */
const AMBIGUOUS_CITY_KEYS = new Set(['Georgetown', 'Halton Hills']);

/**
 * Group already-underwritten listings by city and aggregate each group.
 *
 * Pure and synchronous on purpose: this is the part that has to be provably
 * identical to running computeScreenerMetrics over each city's rows on their
 * own, and a pure function is the part a fixture can pin down.
 */
export function aggregateByCity(deals) {
  const byCity = new Map();
  for (const d of deals) {
    const key = String(d.city || '').trim();
    if (!key) continue;
    if (!byCity.has(key)) byCity.set(key, []);
    byCity.get(key).push(d);
  }
  const cities = {};
  for (const [key, rows] of byCity) {
    if (AMBIGUOUS_CITY_KEYS.has(key)) continue;
    cities[key] = computeScreenerMetrics(rows);
  }
  return { gta: computeScreenerMetrics(deals), cities };
}

/**
 * Walk the whole GTA feed once and build every aggregate from it.
 *
 * Returns the diagnostics alongside the figures — `complete`, `fillRatio`,
 * `rows`, `pagesWalked` — so a short run is a readable fact in the response
 * rather than something inferred from a suspiciously round number.
 */
export async function buildGtaScreenerAggregates(origin, {
  budgetMs = 45000,
  maxPages = 400,
  revalidate = 7200,
  timeoutMs = 12000,
  firstPageTimeoutMs = 25000,
} = {}) {
  const walk = await fetchFeedPages(origin, '/api/listings-gta', {
    pages: maxPages,
    qs: '&nomedia=1',
    revalidate,
    timeoutMs,
    firstPageTimeoutMs,
    budgetMs,
    limit: 100,
  });

  const raw = walk.listings || [];
  const feedTotal = Number(walk.first?.browsableTotal ?? walk.first?.total) || 0;
  const fillRatio = feedTotal > 0 ? raw.length / feedTotal : 0;
  const complete = !!walk.walkedAll && fillRatio >= MIN_FILL;

  const diagnostics = {
    rows: raw.length,
    feedTotal,
    fillRatio: Math.round(fillRatio * 1000) / 1000,
    pagesWalked: walk.requested || 0,
    pagesTotal: walk.totalPages || 0,
    pagesDropped: walk.dropped || 0,
    walkedAll: !!walk.walkedAll,
    complete,
  };

  if (!complete) {
    return {
      ...diagnostics,
      gta: null,
      cities: {},
      note: `Withheld: the walk covered ${raw.length} of ${feedTotal || 'unknown'} listings across ${diagnostics.pagesWalked} of ${diagnostics.pagesTotal || 'unknown'} pages. A count or a maximum over a partial feed is not the market's, so nothing is published.`,
    };
  }

  // ONE underwriting pass over the whole feed, then group. Running
  // processListings per city instead would re-run its address+price dedupe
  // inside each group, so a duplicate that spans two cities would survive —
  // this order matches what the browser ends up with.
  const deals = processListings(raw);
  const { gta, cities } = aggregateByCity(deals);

  return {
    ...diagnostics,
    analyzed: deals.length,
    gta: gta.total > 0 ? gta : null,
    cities,
    note: null,
  };
}
