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
 *  - A city key is published only when the aggregate covers exactly the rows
 *    that city's page loads (see aggregateByCity). A summary that describes a
 *    different set than the page then loads would flip when the load lands,
 *    which is the exact bug this is fixing.
 *
 * Consumers get `null` in all of those cases, and null means skeletons.
 */
import { fetchFeedPages } from './fetch-feed';
import { processListings } from './process-listings';
import { computeScreenerMetrics } from './screener-metrics';
import { cityAliases, canonicalCity, CITY_SUBAREAS, listingInSubarea } from '../constants';

// Same 95% bar /api/market-stats uses before it publishes its own aggregate.
export const MIN_FILL = 0.95;

/**
 * Group already-underwritten listings by city and aggregate each group.
 *
 * A city key may only be published when the aggregate covers EXACTLY the rows
 * that city's page loads — otherwise the headline figure flips when the
 * background load lands, which is the bug this whole feature exists to prevent.
 * Two city names need care, and both now pass:
 *
 *  - Toronto. The feed labels sub-areas ("Toronto C01"), /api/listings-gta maps
 *    them all to "Toronto", and the page's request is
 *    startswith(City,'Toronto') — same set.
 *  - Halton Hills / Georgetown: one municipality the board labels with one of
 *    two names (CITY_ALIAS_GROUPS in lib/constants.js). This pair used to be
 *    withheld, because the feed relabelled 'Halton Hills' rows as 'Georgetown'
 *    while each page asked for its own single name — so neither page could be
 *    shown to load the rows its aggregate described. That relabel is gone, and
 *    /api/listings-gta now asks for BOTH names whichever page requests it. So
 *    the two pages load the identical row set, and the honest aggregate for
 *    both is the one computed over that same union: alias rows are merged into
 *    one group and the result is published under every name in the group.
 *
 * Pure and synchronous on purpose: this is the part that has to be provably
 * identical to running computeScreenerMetrics over each city's rows on their
 * own, and a pure function is the part a fixture can pin down.
 */
export function aggregateByCity(deals) {
  const byCity = new Map();
  for (const d of deals) {
    const key = canonicalCity(d.city);
    if (!key) continue;
    if (!byCity.has(key)) byCity.set(key, []);
    byCity.get(key).push(d);
  }
  const cities = {};
  for (const [key, rows] of byCity) {
    const metrics = computeScreenerMetrics(rows);
    for (const name of cityAliases(key)) cities[name] = metrics;
  }
  // Amalgamated districts (CITY_SUBAREAS in lib/constants.js) are NOT city
  // groups — their rows sit inside the Toronto and Hamilton groups above and
  // must not be merged with them the way an alias is. They still qualify for
  // their own key, and for the same reason the alias pair does: /gta/etobicoke
  // asks the feed for `startswith(City,'Toronto') and <its FSA set>`, and
  // listingInSubarea applies that identical predicate here, so the aggregate
  // and the page describe exactly the same rows. Empty districts publish
  // nothing rather than a zeroed tile.
  for (const [name, def] of Object.entries(CITY_SUBAREAS)) {
    const rows = deals.filter((d) => listingInSubarea(d, def));
    if (rows.length) cities[name] = computeScreenerMetrics(rows);
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
