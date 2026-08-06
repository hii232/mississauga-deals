/**
 * Guards the Mississauga Monthly compose.
 *
 *   node lib/emails/market-report-data.test.mjs
 *
 * This data goes to the ENTIRE subscriber list in one shot and cannot be
 * hotfixed after send, so the tests pin three things: that the real July 2026
 * transcription produces the right derived numbers, that the freshness guard
 * refuses to mail an old report as news (the campaign's defining rule), and
 * that missing optional data drops its block rather than zero-filling.
 */

import { buildMarketReportData, MIX_DIVERGENCE_PP } from './market-report-data.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

// Verbatim from the MW2607 transcription (scripts/trreb-extract.py, verified
// against page 2) + the June row already in market-stats/route.js.
const JULY = {
  tRREBIsStale: false,
  tRREBReportsBehind: 0,
  tRREBMonth: 'July 2026',
  activeCount: 2424,
  medianDOM: 37,
  gtaAvgPrice: 1003956,
  gtaYoyChange: -4.5,
  gtaNewListingsYoy: -17.8,
  gtaSales: 5995,
  screener: { total: 2396, cfPlusCount: 5, bestCap: 5.94, priceDropCount: 412 },
  salesByType: {
    detached:     { sales: 184, avgPrice: 1256800, spLp: 96, ldom: 28 },
    semiDetached: { sales: 69,  avgPrice: 891613,  spLp: 98, ldom: 26 },
    townhouse:    { sales: 23,  avgPrice: 911812,  spLp: 98, ldom: 31 },
    condoTown:    { sales: 95,  avgPrice: 712285,  spLp: 98, ldom: 31 },
    condoApt:     { sales: 124, avgPrice: 511649,  spLp: 97, ldom: 41 },
  },
  mississaugaMonthly: [
    { month: 'Jun 2026', report: 'MW2606', sales: 567, avgPrice: 1014120, medianPrice: 880000, newListings: 1632, activeListings: 2589, snlr: 35.1, monthsInventory: 4.9, spLp: 97, ldom: 29 },
    { month: 'Jul 2026', report: 'MW2607', sales: 500, avgPrice: 899002, medianPrice: 860000, newListings: 1388, activeListings: 2518, snlr: 35.4, monthsInventory: 4.9, spLp: 97, ldom: 32 },
  ],
};

console.log('\nThe real July 2026 payload -> the right derived numbers');
const { report: r, reason } = buildMarketReportData(JULY);
check('builds without refusal', !!r, reason || '');
check('campaign code is the report issue', r?.code === 'MW2607');
check('month label carried through', r?.monthLabel === 'July 2026');
// Hand-checked: 899002/1014120-1 = -11.35..% -> -11.4; 860000/880000-1 = -2.27..% -> -2.3
check('avg MoM is -11.4 (hand-verified)', r?.mom.avg === -11.4, String(r?.mom.avg));
check('median MoM is -2.3 (hand-verified)', r?.mom.median === -2.3, String(r?.mom.median));
// 500/567-1 = -11.81..% -> -11.8; 2518/2589-1 = -2.74..% -> -2.7; 35.4-35.1 = 0.3
check('sales MoM is -11.8', r?.mom.sales === -11.8, String(r?.mom.sales));
check('active MoM is -2.7', r?.mom.active === -2.7, String(r?.mom.active));
check('SNLR delta is +0.3 pts', r?.mom.snlrPts === 0.3, String(r?.mom.snlrPts));

console.log('\nThe honesty flag: July IS a mix-divergence month');
check(`|avg - median| = 9.1 >= ${MIX_DIVERGENCE_PP}pp threshold`, r?.mixDivergence === true);
const aligned = buildMarketReportData({
  ...JULY,
  mississaugaMonthly: [
    JULY.mississaugaMonthly[0],
    { ...JULY.mississaugaMonthly[1], avgPrice: 993000, medianPrice: 860000 }, // avg -2.1, median -2.3
  ],
});
check('a month where they move together does NOT flag', aligned.report?.mixDivergence === false,
  JSON.stringify(aligned.report?.mom));

console.log('\nAll five home types, verbatim');
check('5 types in order', r?.types.map((t) => t.label).join('|') === 'Detached|Semi-Detached|Townhouse|Condo Townhouse|Condo Apartment');
check('detached row verbatim', JSON.stringify(r?.types[0]) === JSON.stringify({ label: 'Detached', sales: 184, avgPrice: 1256800, spLp: 96, ldom: 28 }));
check('condo apt row verbatim', JSON.stringify(r?.types[4]) === JSON.stringify({ label: 'Condo Apartment', sales: 124, avgPrice: 511649, spLp: 97, ldom: 41 }));

console.log('\nTHE campaign-defining refusal: never mail an old report as news');
for (const [label, patch] of [
  ['stale flag true', { tRREBIsStale: true }],
  ['stale flag missing', { tRREBIsStale: undefined }],
  ['a newer report exists', { tRREBReportsBehind: 1 }],
  ['reportsBehind missing', { tRREBReportsBehind: undefined }],
]) {
  const out = buildMarketReportData({ ...JULY, ...patch });
  check(`${label} -> refuses`, out.report === null && !!out.reason, out.reason || 'no reason given');
}

console.log('\nTranscription-slip guards refuse rather than mail a wrong number');
const lastRow = JULY.mississaugaMonthly[1];
for (const [label, row] of [
  ['avgPrice with an extra digit', { ...lastRow, avgPrice: 8990020 }],
  ['sales column swapped low', { ...lastRow, sales: 50 }],
  ['snlr out of range', { ...lastRow, snlr: 354 }],
]) {
  const out = buildMarketReportData({ ...JULY, mississaugaMonthly: [JULY.mississaugaMonthly[0], row] });
  check(`${label} -> refuses`, out.report === null, JSON.stringify(out.report?.now));
}
check('one monthly row (no MoM possible) -> refuses',
  buildMarketReportData({ ...JULY, mississaugaMonthly: [lastRow] }).report === null);
check('a missing home type -> refuses, naming it', (() => {
  const { salesByType, ...rest } = JULY;
  const { condoTown, ...types } = salesByType;
  const out = buildMarketReportData({ ...rest, salesByType: types });
  return out.report === null && /condoTown/.test(out.reason || '');
})());

console.log('\nOptional blocks are OMITTED when absent - never zero-filled');
const noScreener = buildMarketReportData({ ...JULY, screener: null });
check('no screener -> live strip is null, report still builds', noScreener.report !== null && noScreener.report.live === null);
const thinScreener = buildMarketReportData({ ...JULY, screener: { total: 12 } });
check('implausibly thin screener -> live strip omitted too', thinScreener.report?.live === null);
const noGta = buildMarketReportData({ ...JULY, gtaAvgPrice: undefined });
check('no GTA figures -> gta block is null, report still builds', noGta.report !== null && noGta.report.gta === null);
check('live strip present on the full payload, verbatim',
  JSON.stringify(r?.live) === JSON.stringify({ activeCount: 2424, scoredCount: 2396, cfPlusCount: 5, bestCap: 5.94, medianDOM: 37, priceDropCount: 412 }));

console.log('\nJunk input stays safe');
check('null stats -> refuses', buildMarketReportData(null).report === null);
check('empty object -> refuses', buildMarketReportData({}).report === null);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
