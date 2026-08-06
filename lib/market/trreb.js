/**
 * Every TRREB Market Watch figure the site publishes, derived from ONE file.
 *
 * THE PROBLEM THIS SOLVES
 * ----------------------
 * TRREB publishes no API or feed, so the monthly sold/volume/YoY figures are
 * read out of a PDF. For a long time "read out of a PDF" meant a human typing
 * ~45 numbers into app/api/market-stats/route.js, plus a month string, plus an
 * as-of date, plus a disclaimer sentence, plus a line in CLAUDE.md, plus
 * whatever prose in lib/blog/seed-posts.js happened to quote a figure. Miss one
 * and the site contradicts itself in public - which is exactly what happened:
 * seed-posts kept quoting the previous month's average price as current after
 * the route had moved on, and before that the whole set sat five months stale
 * while the newsletter and every generated post presented it as this month's
 * market.
 *
 * So the numbers now live in data/trreb.js, written by scripts/trreb-extract.py
 * straight off the PDF, and EVERY consumer derives from here. Refreshing the
 * whole site is one command:
 *
 *     ./.venv/bin/python scripts/trreb-extract.py ~/Downloads/mw2608.pdf --write
 *
 * scripts/compliance-check.mjs fails the build if a TRREB-shaped figure is
 * typed anywhere else, so a second copy cannot be reintroduced by hand.
 *
 * WHAT IS AND IS NOT DERIVED HERE
 * ------------------------------
 * Everything here is either copied from the report or is arithmetic over
 * report figures. Nothing is interpolated, smoothed, or carried forward: a
 * month with no report on hand is simply absent from the series, and a field
 * the extractor could not read is null so consumers omit it rather than print
 * an invented number.
 */
// Relative, not '@/data/trreb.js': the alias only exists inside the Next build,
// and this module has to import identically from a plain `node` test.
import TRREB from '../../data/trreb.js';
import { tRREBFreshness } from './trreb-freshness.js';

/** The report the site is currently publishing. */
export const latestReport = TRREB.reports[TRREB.latest];

if (!latestReport) {
  // A `latest` pointing at a report that isn't there would silently publish
  // `undefined` into every price on the site. Fail at import instead.
  throw new Error(
    `data/trreb.js: latest is "${TRREB.latest}" but no such report exists. ` +
    `Known reports: ${Object.keys(TRREB.reports).join(', ')}`
  );
}

/** All reports, oldest first - the ordering every series below uses. */
export const allReports = Object.values(TRREB.reports)
  .slice()
  .sort((a, b) => String(a.asOf).localeCompare(String(b.asOf)));

export const tRREBMonth = latestReport.month;       // 'July 2026'
export const tRREBAsOf = latestReport.asOf;         // '2026-07-31'
export const tRREBReport = latestReport.report;     // 'MW2607'

/**
 * The sentence every page and email prints under a TRREB figure. Generated so
 * it can never name a different month than the numbers beside it - the old
 * hand-typed string is precisely the kind of thing that gets missed on a
 * refresh, and it is the one part a reader actually checks.
 */
export const tRREBDisclaimer =
  'Active listing statistics computed from live MLS data. Sold statistics from ' +
  `TRREB Market Watch ${tRREBMonth} (${tRREBReport}). Deemed reliable but not guaranteed.`;

/** Live staleness verdict for the currently-loaded report. */
export function freshness(now = new Date()) {
  return tRREBFreshness(tRREBAsOf, now);
}

/**
 * Mississauga month-by-month, one row per published report. Rows carry only
 * what that report actually gave us; a report with no Mississauga block is
 * skipped rather than zero-filled.
 */
export const mississaugaMonthly = allReports
  .filter((r) => r.extracted?.mississauga)
  .map((r) => {
    const m = r.extracted.mississauga;
    return {
      month: r.monthShort,
      report: r.report,
      sales: m.sales,
      avgPrice: m.avgPrice,
      medianPrice: m.medianPrice,
      newListings: m.newListings,
      activeListings: m.activeListings,
      snlr: m.snlr,
      monthsInventory: m.monthsInventory,
      spLp: m.spLp,
      ldom: m.ldom,
    };
  });

const ext = latestReport.extracted || {};
const manual = latestReport.manual || {};
const yoy = ext.gtaYoy || {};

/**
 * Sold figures by home type, in the shape /api/market-stats publishes.
 *
 * `townhouse` is freehold Att/Row/Townhouse and `condo` is Condo Apartment,
 * matching how the live-listing buckets are classified. Condo Townhouse and
 * Link are reported separately by TRREB and are deliberately NOT folded in -
 * merging them would mean averaging medians, which isn't valid. `all` carries
 * the true Mississauga total, which is why it exceeds the sum of the types.
 *
 * `yoy` is TRREB's GTA-WIDE year-over-year average-price change by type
 * (page 1). Market Watch publishes no per-municipality YoY at all, so this is
 * a GTA figure - never relabel it as Mississauga-specific.
 */
export const tRREBSold = {
  all: {
    sales: ext.mississauga?.sales ?? null,
    avgPrice: ext.mississauga?.avgPrice ?? null,
    medianPrice: ext.mississauga?.medianPrice ?? null,
    yoy: yoy.all ?? null,
  },
  detached: soldType('detached', yoy.detached),
  semiDetached: soldType('semiDetached', yoy.semiDetached),
  townhouse: soldType('townhouse', yoy.townhouse),
  condo: soldType('condoApt', yoy.condoApt),
};

function soldType(key, yoyPct) {
  const t = ext.byType?.[key] || {};
  return {
    sales: t.sales ?? null,
    avgPrice: t.avgPrice ?? null,
    medianPrice: t.medianPrice ?? null,
    yoy: yoyPct ?? null,
  };
}

/**
 * Per-type sales table. The count key is `sales`, NOT a month name: baking
 * "feb2026" into the key is part of why nobody noticed this data had gone
 * stale for five months.
 */
export const salesByType = Object.fromEntries(
  Object.entries(ext.byType || {}).map(([key, t]) => [
    key,
    { sales: t.sales ?? null, avgPrice: t.avgPrice ?? null, spLp: t.spLp ?? null, ldom: t.ldom ?? null },
  ])
);

/** Mississauga / Peel / GTA headline blocks, flattened into the published keys. */
export const regional = {
  gtaAvgPrice: ext.gta?.avgPrice ?? null,
  gtaMedianPrice: ext.gta?.medianPrice ?? null,
  gtaYoyChange: yoy.all ?? null,
  gtaSales: ext.gta?.sales ?? null,
  gtaSalesYoy: manual.gtaSalesYoy ?? null,
  gtaNewListings: ext.gta?.newListings ?? null,
  gtaNewListingsYoy: manual.gtaNewListingsYoy ?? null,
  gtaActiveListings: ext.gta?.activeListings ?? null,
  gtaActiveListingsYoy: manual.gtaActiveListingsYoy ?? null,
  gtaAvgLDOM: ext.gta?.ldom ?? null,
  gtaAvgPDOM: ext.gta?.pdom ?? null,

  mississaugaSales: ext.mississauga?.sales ?? null,
  mississaugaNewListings: ext.mississauga?.newListings ?? null,
  mississaugaActiveListings: ext.mississauga?.activeListings ?? null,
  mississaugaSNLR: ext.mississauga?.snlr ?? null,
  mississaugaMonthsOfInventory: ext.mississauga?.monthsInventory ?? null,
  mississaugaAvgSPLP: ext.mississauga?.spLp ?? null,
  mississaugaAvgLDOM: ext.mississauga?.ldom ?? null,
  mississaugaAvgPDOM: ext.mississauga?.pdom ?? null,
  mississaugaAvgPrice: ext.mississauga?.avgPrice ?? null,
  mississaugaMedianPrice: ext.mississauga?.medianPrice ?? null,

  peelSales: ext.peel?.sales ?? null,
  peelAvgPrice: ext.peel?.avgPrice ?? null,
  peelMedianPrice: ext.peel?.medianPrice ?? null,
  peelActiveListings: ext.peel?.activeListings ?? null,
};

/**
 * Page-1 economic box. Reprinted by TRREB from StatCan / Bank of Canada, so the
 * readings lag the report month - `indicatorsAsOf` says by how much rather than
 * letting them read as July numbers.
 */
export const economic = manual.economic || {};

/**
 * Mortgage rates as TRREB reprints them.
 *
 * IMPORTANT: the fixed rates are the Bank of Canada CONVENTIONAL MORTGAGE
 * series - i.e. POSTED rates, which run well above the discounted contract rate
 * a borrower is actually quoted (with prime at 4.5%, nobody is signing a 6.09%
 * five-year fixed). Never present these as "the rate you'll get"; `posted: true`
 * travels with them so consumers can label them. `variable` is NOT published in
 * Market Watch - it is a broker-sourced estimate of a real contract rate, which
 * is why it sits below the posted fixed rates rather than above them.
 */
export const rates = manual.rates || {};

/** Rental averages that accompany the report. */
export const rental = manual.rental || {};

/**
 * Did the `manual` block get re-checked for the report currently published?
 * The extractor carries the previous month's page-1 figures forward (they move
 * slowly and a missing rate is worse than a month-old one) but stamps which
 * report they were verified against. False here means the rates and economic
 * indicators on the site are one report behind the sold figures beside them.
 */
export const manualBlockIsCurrent = manual.checkedFor === latestReport.report;

/** Plain-English one-liner for logs, the admin dashboard, and CLAUDE.md. */
export function loadedSummary() {
  return `${tRREBMonth} (${tRREBReport}), ${mississaugaMonthly.length} months of history, as of ${tRREBAsOf}`;
}
