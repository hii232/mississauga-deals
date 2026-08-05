/**
 * Guards the /market-pulse quotable summary.
 *
 *   node lib/market/market-sentences.test.mjs
 *
 * These sentences state live figures to the public AND to any language model
 * quoting the page, which makes them the highest-consequence prose on the site:
 * a wrong number here gets repeated by a machine, with a citation, for as long
 * as the answer is cached. So the tests pin two things - that real payloads
 * produce the right numbers, and that a MISSING field drops its sentence rather
 * than printing a zero (the omit-never-fake rule that killed the "388").
 */

import { buildMarketSentences } from './market-sentences.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

// Verbatim from https://www.mississaugainvestor.ca/api/market-stats, 2026-08-05.
const LIVE = {
  activeCount: 2426, medianDOM: 39, staleCount: 731, stalePct: 30.1, staleWithPriceCut: 247,
  screener: { total: 2386, cfPlusCount: 5, bestCap: 5.94, suites: 693, priceDropCount: 423 },
  tRREBMonth: 'June 2026', mississaugaAvgPrice: 1014120, mississaugaSales: 567,
  mississaugaAvgSPLP: 97, mississaugaMonthsOfInventory: 4.9,
};
const AS_OF = '5 August 2026';
const r = buildMarketSentences(LIVE, AS_OF);
const all = [...r.live, ...r.leverage, ...r.trreb].join(' ');

console.log('\nReal payload -> the right numbers, formatted for humans');
check('active count with thousands separator', all.includes('2,426 active residential listings'));
check('scored total and cash-flow count', all.includes('Of the 2,386 listings scored, 5 are cash-flow positive'));
check('assumptions stated inline with the claim', all.includes('at 20% down and a 4.89% contract rate'));
check('best cap rate', all.includes('highest cap rate on the active market is 5.94%'));
check('suite count', all.includes('693 listings show second-suite potential'));
check('stale count and percent', all.includes('731 listings (30.1% of the active market) have sat 60 days or longer'));
check('price cuts among stale', all.includes('247 of those have already cut their price'));
check('all price reductions', all.includes('423 active listings have taken at least one price reduction'));
check('median DOM', all.includes('Median days on market is 39'));
check('as-of date is in the first sentence', r.live[0].includes(AS_OF));

console.log('\nTRREB stays in its own paragraph, labelled with its report month');
check('TRREB sentence names the report month', r.trreb[0].includes('(June 2026)'));
check('TRREB money formatted', r.trreb[0].includes('$1,014,120'));
check('TRREB sales + ratio + inventory', r.trreb[0].includes('567 sales') && r.trreb[0].includes('97% of asking') && r.trreb[0].includes('4.9 months of inventory'));
// The whole point of the split: a model must not read the monthly sold figure
// as a live one.
check('live paragraph contains no TRREB sold figure', !r.live.join(' ').includes('1,014,120'));
check('TRREB paragraph contains no live active count', !r.trreb.join(' ').includes('2,426'));

console.log('\nMissing fields DROP their sentence - never a zero, never a guess');
const noScreener = buildMarketSentences({ ...LIVE, screener: {} }, AS_OF);
check('no screener -> no cash-flow sentence', !noScreener.live.join(' ').includes('cash-flow positive'));
check('no screener -> no cap-rate sentence', !noScreener.live.join(' ').includes('highest cap rate'));
check('no screener -> active-count sentence survives', noScreener.live[0].includes('2,426'));
const noStale = buildMarketSentences({ ...LIVE, staleCount: 0, staleWithPriceCut: 0 }, AS_OF);
check('zero stale -> no stale sentence', !noStale.leverage.join(' ').includes('have sat 60 days'));
check('zero stale -> never prints "0 listings"', !noStale.leverage.join(' ').startsWith('0 '));
const noTrreb = buildMarketSentences({ ...LIVE, tRREBMonth: null }, AS_OF);
check('no TRREB month -> no TRREB paragraph at all', noTrreb.trreb.length === 0);
const partialTrreb = buildMarketSentences({ ...LIVE, mississaugaSales: 0, mississaugaMonthsOfInventory: 0 }, AS_OF);
check('partial TRREB keeps only the figures it has', partialTrreb.trreb[0].includes('$1,014,120') && !partialTrreb.trreb[0].includes('sales,'));

console.log('\nNothing honest to say -> render nothing');
check('null stats -> null', buildMarketSentences(null, AS_OF) === null);
check('undefined stats -> null', buildMarketSentences(undefined, AS_OF) === null);
check('zero active listings -> null (feed outage, not a real market of 0)', buildMarketSentences({ ...LIVE, activeCount: 0 }, AS_OF) === null);
check('missing activeCount -> null', buildMarketSentences({ screener: LIVE.screener }, AS_OF) === null);

console.log('\nEvery sentence is self-contained enough to quote');
for (const s of [...r.live, ...r.leverage, ...r.trreb]) {
  check(`ends with a period: "${s.slice(0, 38)}…"`, s.trim().endsWith('.'));
}
check('first sentence names the site (a quote must attribute)', r.live[0].includes('MississaugaInvestor.ca'));

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
