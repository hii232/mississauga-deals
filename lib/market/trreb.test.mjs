/**
 * Guards the single source of TRREB figures.
 *
 *   node lib/market/trreb.test.mjs
 *
 * This module is what makes a market refresh one command instead of a
 * transcription pass across route.js, the blog seeds, the newsletter and
 * CLAUDE.md. The failure it exists to prevent is not a crash - it is the site
 * publishing a confident, wrong, plausible number. So the assertions here are
 * mostly about INTERNAL CONSISTENCY: that the month named beside a figure is
 * the month the figure came from, that a value the extractor could not read
 * stays null rather than becoming a neighbour's value, and that the monthly
 * series never silently shortens.
 */
import TRREB from '../../data/trreb.js';
import * as M from './trreb.js';

let pass = 0;
const fails = [];
function ok(cond, label, detail = '') {
  if (cond) pass++;
  else fails.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

// ── The pointer resolves, and to the newest report we hold ───────────────
ok(!!M.latestReport, 'latest resolves to a real report');
const newest = M.allReports[M.allReports.length - 1];
ok(
  M.latestReport.report === newest.report,
  'latest IS the newest report by as-of date',
  `latest=${M.latestReport.report} newest=${newest.report}`
);

// ── The three strings that used to be typed separately ───────────────────
// tRREBMonth, tRREBAsOf and the disclaimer sentence had to be edited together
// by hand, and a reader checks the disclaimer. Derived now, so they cannot
// disagree - this asserts the derivation, not the values.
ok(M.tRREBMonth === M.latestReport.month, 'month string comes from the loaded report');
ok(M.tRREBAsOf === M.latestReport.asOf, 'as-of date comes from the loaded report');
ok(
  M.tRREBDisclaimer.includes(M.tRREBMonth) && M.tRREBDisclaimer.includes(M.tRREBReport),
  'disclaimer names the month AND the report issue it describes',
  M.tRREBDisclaimer
);

// The as-of date must be the LAST day of the month it claims, because
// tRREBFreshness counts published reports from it. An as-of on the 1st would
// read as a month younger than the data is.
const [y, mo, d] = M.tRREBAsOf.split('-').map(Number);
ok(
  d === new Date(Date.UTC(y, mo, 0)).getUTCDate(),
  'as-of is the last day of its month',
  M.tRREBAsOf
);
ok(
  new Date(`${M.tRREBAsOf}T00:00:00Z`).toLocaleString('en-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    === M.tRREBMonth,
  'the as-of date and the month string name the same month',
  `${M.tRREBAsOf} vs "${M.tRREBMonth}"`
);

// ── The monthly series ───────────────────────────────────────────────────
// The chart is built from this. A writer that rebuilt data/trreb.js from one
// PDF would shorten it every run, which is exactly how a 224-company corpus
// once got silently cut to 50 elsewhere in this stack.
ok(M.mississaugaMonthly.length >= 6, 'monthly history holds at least 6 reports',
   `${M.mississaugaMonthly.length}`);
ok(
  M.mississaugaMonthly.every((r, i, a) => i === 0 || a[i - 1].report < r.report),
  'monthly history is in ascending report order'
);
ok(
  new Set(M.mississaugaMonthly.map((r) => r.report)).size === M.mississaugaMonthly.length,
  'no month appears twice in the history'
);
ok(
  M.mississaugaMonthly[M.mississaugaMonthly.length - 1].report === M.tRREBReport,
  'the last row of the history IS the report being published'
);
ok(
  M.mississaugaMonthly.every((r) => r.sales > 0 && r.avgPrice > 100000),
  'every history row carries a real sales count and average price'
);

// ── Sold figures: shape, and no cross-contamination ──────────────────────
const latestCity = M.latestReport.extracted.mississauga;
ok(M.tRREBSold.all.sales === latestCity.sales, 'all-types sales comes from the city row');
ok(M.tRREBSold.all.avgPrice === latestCity.avgPrice, 'all-types average comes from the city row');
ok(M.regional.mississaugaAvgPrice === latestCity.avgPrice, 'regional block reads the same city row');

// `condo` is Condo APARTMENT, not condo townhouse. Mapping the wrong one here
// would publish a ~$200k-too-high condo average under an unchanged label - the
// silent, plausible failure the extractor's page fingerprinting also guards.
ok(
  M.tRREBSold.condo.avgPrice === M.latestReport.extracted.byType.condoApt.avgPrice,
  'the `condo` bucket is Condo Apartment, not Condo Townhouse'
);
ok(
  M.tRREBSold.condo.avgPrice !== M.latestReport.extracted.byType.condoTown.avgPrice,
  'condo apartment and condo townhouse are distinguishable in this report'
);

// The per-type figures must not sum to the all-types total: TRREB reports Link,
// Co-Op and Det Condo separately, so `all` is legitimately larger. If they were
// equal, someone has folded categories together - which means averaging
// medians, which is not valid.
const typeSales = Object.values(M.salesByType).reduce((s, t) => s + (t.sales || 0), 0);
ok(
  typeSales < M.tRREBSold.all.sales && M.tRREBSold.all.sales - typeSales <= 40,
  'per-type sales sum sits just under the all-types total',
  `types=${typeSales} all=${M.tRREBSold.all.sales}`
);

// ── GTA YoY stays GTA ────────────────────────────────────────────────────
// Market Watch publishes NO per-municipality year-over-year. These are GTA
// figures and relabelling them as Mississauga's is a documented forbidden move.
ok(
  M.regional.gtaYoyChange === M.latestReport.extracted.gtaYoy.all,
  'the headline YoY is the GTA-wide figure, unmodified'
);
ok(
  M.tRREBSold.detached.yoy === M.latestReport.extracted.gtaYoy.detached,
  'per-type YoY is the GTA-wide figure, unmodified'
);

// ── Missing means null, never a neighbour's value ────────────────────────
// A short row from the PDF must leave a hole. The alternative - values sliding
// up into the wrong keys - is the single worst outcome available here, because
// every number still looks reasonable.
const older = TRREB.reports.MW2602;
ok(older.extracted.mississauga.pdom === null, 'a figure the report did not give stays null');
ok(!('peel' in older.extracted), 'a region absent from an old report is absent, not zero-filled');

// ── Every published key is either a number or an explicit null ───────────
for (const [k, v] of Object.entries(M.regional)) {
  ok(v === null || typeof v === 'number', `regional.${k} is a number or explicit null`, String(v));
}

// ── The manual block reports its own currency ────────────────────────────
// Rates and economic indicators are still read by hand off page 1. The
// extractor carries the previous month's block forward rather than dropping
// them, so this flag is the only thing that says "these lag the sold figures".
ok(typeof M.manualBlockIsCurrent === 'boolean', 'manualBlockIsCurrent is a boolean');
ok(
  M.manualBlockIsCurrent === (M.latestReport.manual?.checkedFor === M.tRREBReport),
  'manualBlockIsCurrent reflects the stamp on the loaded report'
);
ok(M.rates.posted === true, 'rates carry the posted-not-contract flag');
ok(
  M.rates.variable < M.rates.fixed5yr,
  'the broker-sourced variable sits below the posted fixed rate',
  `${M.rates.variable} vs ${M.rates.fixed5yr}`
);

// ── Freshness is computed from the loaded report, not a typed date ───────
const asIfPublished = new Date(`${M.tRREBAsOf}T00:00:00Z`);
asIfPublished.setUTCMonth(asIfPublished.getUTCMonth() + 1);
asIfPublished.setUTCDate(9); // just after the publication grace day
ok(M.freshness(asIfPublished).tRREBIsStale === false,
   'not stale the month after the report, once the next one is out');
const muchLater = new Date(asIfPublished);
muchLater.setUTCMonth(muchLater.getUTCMonth() + 3);
ok(M.freshness(muchLater).tRREBIsStale === true, 'stale three reports later');

if (fails.length) {
  console.error(`\nFAILED - ${fails.length} check(s):`);
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`PASSED - ${pass} checks passed, 0 failed`);
