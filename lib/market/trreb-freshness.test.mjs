/**
 * Guards the TRREB staleness verdict.
 *
 *   node lib/market/trreb-freshness.test.mjs
 *
 * Two failure modes, in opposite directions, and BOTH matter:
 *
 *   1. Crying wolf. The old rule flipped to "stale" on the 1st of the month,
 *      before the new report could exist, so Hamza was asked for a PDF TRREB
 *      had not released (2026-08-05). A guard that fires every month-turn is a
 *      guard people stop reading.
 *   2. Going quiet. This flag is the only thing standing between the site and
 *      the five-month drift that already happened once, when every page, the
 *      weekly newsletter and every generated blog post quoted stale figures as
 *      current. Suppressing a real warning is far worse than an early one.
 *
 * So the tests below pin BOTH edges of the window, not just the fix.
 */

import { tRREBFreshness, PUBLICATION_GRACE_DAY } from './trreb-freshness.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}
const at = (iso) => new Date(iso + 'T12:00:00Z');
const JUNE = '2026-06-30'; // the data actually on the site on 2026-08-05

console.log('\nThe reported bug: June data, early August, July report not out yet');
const aug1 = tRREBFreshness(JUNE, at('2026-08-01'));
check('1 Aug is NOT stale (July report cannot exist yet)', aug1.tRREBIsStale === false, JSON.stringify(aug1));
check('1 Aug reports-behind is 0', aug1.tRREBReportsBehind === 0, String(aug1.tRREBReportsBehind));
check('1 Aug still reports the literal 2 months of age', aug1.tRREBMonthsBehind === 2, String(aug1.tRREBMonthsBehind));
check('1 Aug emits no refresh note', aug1.tRREBRefreshNote === null);

const aug5 = tRREBFreshness(JUNE, at('2026-08-05'));
check('5 Aug (the day Hamza was asked) is NOT stale', aug5.tRREBIsStale === false, JSON.stringify(aug5));

console.log('\nBut it MUST fire once the report is out');
const augGrace = tRREBFreshness(JUNE, at(`2026-08-0${PUBLICATION_GRACE_DAY}`));
check(`${PUBLICATION_GRACE_DAY} Aug IS stale (July is published by now)`, augGrace.tRREBIsStale === true, JSON.stringify(augGrace));
check('and says exactly 1 report behind', augGrace.tRREBReportsBehind === 1, String(augGrace.tRREBReportsBehind));
check('note names the count and reads singular', /1 newer TRREB Market Watch report has been published/.test(augGrace.tRREBRefreshNote || ''), augGrace.tRREBRefreshNote);
const aug20 = tRREBFreshness(JUNE, at('2026-08-20'));
check('20 Aug still stale', aug20.tRREBIsStale === true);

console.log('\nThe normal one-month lag is never stale');
// Mid-July with June data is the healthy steady state: June is the newest
// report in existence, and we have it.
check('15 Jul with June data is current', tRREBFreshness(JUNE, at('2026-07-15')).tRREBIsStale === false);
check('2 Jul with June data is current (report just dropped)', tRREBFreshness(JUNE, at('2026-07-02')).tRREBIsStale === false);
check('31 Jul with June data is current', tRREBFreshness(JUNE, at('2026-07-31')).tRREBIsStale === false);
// Fresh upload: July data during August.
check('20 Aug with JULY data is current', tRREBFreshness('2026-07-31', at('2026-08-20')).tRREBIsStale === false);

console.log('\nReal drift is still caught, loudly - the five-month disaster');
const sept = tRREBFreshness(JUNE, at('2026-09-10'));
check('10 Sep with June data is stale', sept.tRREBIsStale === true);
check('and is 2 reports behind', sept.tRREBReportsBehind === 2, String(sept.tRREBReportsBehind));
check('note reads plural at 2+', /2 newer TRREB Market Watch reports have been published/.test(sept.tRREBRefreshNote || ''), sept.tRREBRefreshNote);
const fiveMonths = tRREBFreshness('2026-02-28', at('2026-08-20'));
check('the 5-month drift is stale', fiveMonths.tRREBIsStale === true);
check('the 5-month drift reports 5 behind', fiveMonths.tRREBReportsBehind === 5, String(fiveMonths.tRREBReportsBehind));
check('the 5-month drift keeps monthsBehind = 6 for offer-picks', fiveMonths.tRREBMonthsBehind === 6, String(fiveMonths.tRREBMonthsBehind));

console.log('\nNever suppresses a warning the old rule would have raised');
// The ONLY behaviour change allowed is inside the pre-publication window at the
// turn of a month. Anywhere else, old and new must agree.
const oldRule = (m) => m >= 2;
let divergences = 0, suppressedOutsideWindow = 0;
for (let month = 0; month < 12; month++) {
  for (let day = 1; day <= 28; day++) {
    const now = new Date(Date.UTC(2026, month, day, 12));
    const f = tRREBFreshness(JUNE, now);
    const old = oldRule(f.tRREBMonthsBehind);
    if (old !== f.tRREBIsStale) {
      divergences++;
      const inWindow = day < PUBLICATION_GRACE_DAY && f.tRREBMonthsBehind === 2;
      if (!inWindow) suppressedOutsideWindow++;
    }
  }
}
check('every divergence sits in the pre-publication window', suppressedOutsideWindow === 0, `${suppressedOutsideWindow} outside`);
check('the window actually exists (change is real)', divergences > 0, String(divergences));

console.log('\nJunk input stays safe');
for (const bad of ['', 'not-a-date', undefined, null]) {
  const f = tRREBFreshness(bad, at('2026-08-05'));
  check(`${JSON.stringify(bad)} -> not stale, nulls`, f.tRREBIsStale === false && f.tRREBMonthsBehind === null && f.tRREBRefreshNote === null, JSON.stringify(f));
}

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
