/**
 * Guard tests for the Offer Gap campaign.
 *
 *   node lib/emails/offer-gap-data.test.mjs
 *
 * There is no test runner in this project (the build is the gate), so this is a
 * plain script with a non-zero exit on failure. It exists because validateGap
 * is the ONLY thing standing between a mistyped TRREB figure and a wrong number
 * in every subscriber's inbox — and unlike a page, a sent email cannot be
 * hotfixed. Reading the guard and agreeing with it is not verification.
 *
 * The baseline is the real TRREB MW2606 (June 2026) Mississauga per-type rows.
 */

import { validateGap, approxGapDollars, TYPE_ORDER } from './offer-gap-data.js';

const REAL = {
  tRREBMonth: 'June 2026',
  tRREBMonthsBehind: 2,
  activeCount: 2447,
  salesByType: {
    detached: { sales: 227, avgPrice: 1482130, spLp: 96, ldom: 25 },
    semiDetached: { sales: 86, avgPrice: 908389, spLp: 100, ldom: 19 },
    townhouse: { sales: 18, avgPrice: 883038, spLp: 101, ldom: 30 },
    condoTown: { sales: 91, avgPrice: 726749, spLp: 98, ldom: 31 },
    condoApt: { sales: 142, avgPrice: 525333, spLp: 97, ldom: 40 },
  },
};

const clone = (o) => JSON.parse(JSON.stringify(o));
let pass = 0;
const failures = [];

function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

// A payload that must SEND.
function accepts(name, mutate) {
  const s = clone(REAL);
  if (mutate) mutate(s);
  const { gap, reason } = validateGap(s);
  check(name, gap !== null, `— unexpectedly blocked: ${reason}`);
  return gap;
}

// A payload that must REFUSE, and the reason must mention `expect`.
function refuses(name, mutate, expect) {
  const s = clone(REAL);
  mutate(s);
  const { gap, reason } = validateGap(s);
  check(name, gap === null && (!expect || (reason || '').includes(expect)),
    gap !== null ? '— SENT when it should have refused' : `— wrong reason: ${reason}`);
}

console.log('\nBaseline — the real June 2026 report must pass');
const ok = accepts('real MW2606 payload sends', null);
check('month carried through', ok && ok.month === 'June 2026');
check('all five types present', ok && Object.keys(ok.salesByType).length === TYPE_ORDER.length);

console.log('\nTranscription slips (the likeliest real failure — the PDF is keyed by hand)');
refuses('transposed ratio 96 -> 69', (s) => { s.salesByType.detached.spLp = 69; }, 'sale-to-list ratio outside');
refuses('dropped decimal 101 -> 1010', (s) => { s.salesByType.townhouse.spLp = 1010; }, 'sale-to-list ratio outside');
refuses('ratio zeroed out', (s) => { s.salesByType.condoApt.spLp = 0; }, 'property types have complete figures');
refuses('a whole type missing', (s) => { delete s.salesByType.condoTown; }, 'property types have complete figures');
refuses('price off by 10x', (s) => { s.salesByType.detached.avgPrice = 14821300; }, 'implausible average price');
refuses('days-on-market nonsense', (s) => { s.salesByType.condoApt.ldom = 4000; }, 'implausible days-on-market');
refuses('sales count zeroed', (s) => { s.salesByType.semiDetached.sales = 0; }, 'property types have complete figures');

console.log('\nStaleness — an email is permanent, so old data must not go out');
accepts('1 month behind is normal lag', (s) => { s.tRREBMonthsBehind = 1; });
accepts('3 months behind still allowed', (s) => { s.tRREBMonthsBehind = 3; });
refuses('4 months behind refuses', (s) => { s.tRREBMonthsBehind = 4; }, 'months behind');
refuses('no month named', (s) => { s.tRREBMonth = null; }, 'tRREBMonth missing');

console.log('\nNo-story guard — the email argues the ratio VARIES by type');
refuses('every type identical', (s) => {
  for (const k of Object.keys(s.salesByType)) s.salesByType[k].spLp = 98;
}, 'ratios are flat');
refuses('spread of only 1 point', (s) => {
  const v = [98, 99, 98, 99, 98];
  Object.keys(s.salesByType).forEach((k, i) => { s.salesByType[k].spLp = v[i]; });
}, 'ratios are flat');
accepts('spread of exactly 2 points is enough', (s) => {
  const v = [97, 99, 98, 99, 97];
  Object.keys(s.salesByType).forEach((k, i) => { s.salesByType[k].spLp = v[i]; });
});

console.log('\nOutage shapes — a broken feed must never compose an email');
refuses('empty payload', (s) => { for (const k of Object.keys(s)) delete s[k]; }, 'tRREBMonth missing');
refuses('salesByType empty', (s) => { s.salesByType = {}; }, 'property types have complete figures');

console.log('\nactiveCount is OPTIONAL — a down listings feed must not block the send');
const noActive = accepts('activeCount 0 still sends', (s) => { s.activeCount = 0; });
check('activeCount degrades to 0, not NaN', noActive && noActive.activeCount === 0);

console.log('\napproxGapDollars — the one derived figure');
check('detached: 1,482,130 @ 96% -> $62,000', approxGapDollars(1482130, 96) === 62000,
  `got ${approxGapDollars(1482130, 96)}`);
check('rounds to the nearest $500', approxGapDollars(1482130, 96) % 500 === 0);
check('sold OVER asking returns negative', approxGapDollars(883038, 101) < 0,
  `got ${approxGapDollars(883038, 101)}`);
check('exactly at asking returns 0', approxGapDollars(908389, 100) === 0);
check('garbage in -> null, never NaN', approxGapDollars(0, 96) === null && approxGapDollars(1000, 0) === null);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} — ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
