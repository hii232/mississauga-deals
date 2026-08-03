/**
 * Tests for the default alert audience rules.
 *
 *   node lib/alerts/default-audience.test.mjs
 *
 * These rules stand between 483 real inboxes and a daily spam blast — the one
 * thing the alert product must never do.
 */

import {
  isFreshListing, pickDefaultDeals, selectDefaultRecipients,
  MIN_SCORE, MAX_DEALS, MAX_SENDS_PER_RUN, RECIPIENT_COOLDOWN_DAYS,
} from './default-audience.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

console.log('\nisFreshListing — identical to the saved-search rule');
check('real DOM 1', isFreshListing({ dom: 1 }));
check('real DOM 3', isFreshListing({ dom: 3 }));
check('DOM 4 not fresh', !isFreshListing({ dom: 4 }));
check('DOM unknown, changed 2d ago', isFreshListing({ dom: 0, daysSinceUpdate: 2 }));
check('DOM unknown, changed 10d ago', !isFreshListing({ dom: 0, daysSinceUpdate: 10 }));
check('no signals at all is NOT fresh (never fabricate)', !isFreshListing({ dom: 0 }));
check('null safe', !isFreshListing(null));

console.log('\npickDefaultDeals — high bar, capped');
const L = (id, score, dom) => ({ id, hamzaScore: score, dom, address: `${id} St`, price: 900000 });
const pool = [
  L('a', 9.1, 2), L('b', 8.4, 1), L('c', 8.0, 3),
  L('d', 7.9, 1),          // below bar
  L('e', 9.5, 30),         // stale
  L('f', 8.8, 2), L('g', 8.7, 1), L('h', 8.6, 2), L('i', 8.5, 3), L('j', 8.2, 1),
  { id: 'k', hamzaScore: NaN, dom: 1 }, // malformed
];
const deals = pickDefaultDeals(pool);
check(`caps at ${MAX_DEALS}`, deals.length === MAX_DEALS, `got ${deals.length}`);
check('sorted best first', deals[0].id === 'a' && deals[0].hamzaScore === 9.1);
check(`everything scores >= ${MIN_SCORE}`, deals.every((d) => d.hamzaScore >= MIN_SCORE));
check('stale high-scorer excluded', !deals.some((d) => d.id === 'e'));
check('below-bar excluded', !deals.some((d) => d.id === 'd'));
check('malformed score excluded', !deals.some((d) => d.id === 'k'));
check('empty pool -> empty (send nothing that day)', pickDefaultDeals([]).length === 0);
check('null safe', pickDefaultDeals(null).length === 0);

console.log('\nselectDefaultRecipients — who may be emailed this run');
const now = Date.UTC(2026, 7, 3, 13, 0, 0);
const day = 24 * 60 * 60 * 1000;
const recipients = [
  { email: 'fresh@x.com', name: 'A' },
  { email: 'saved@x.com', name: 'B' },       // has own saved search
  { email: 'recent@x.com', name: 'C' },      // emailed yesterday
  { email: 'cooled@x.com', name: 'D' },      // emailed 4 days ago
  { email: 'MiXeD@X.com ', name: 'E' },      // needs normalizing
  { email: '', name: 'junk' },
];
const saved = new Set(['saved@x.com']);
const lastSent = new Map([
  ['recent@x.com', now - 1 * day],
  ['cooled@x.com', now - (RECIPIENT_COOLDOWN_DAYS + 1) * day],
]);
const sel = selectDefaultRecipients(recipients, saved, lastSent, now);
check('saved-search owner excluded', !sel.eligible.some((r) => r.email === 'saved@x.com'));
check('recently-emailed excluded, counted as cooling', !sel.eligible.some((r) => r.email === 'recent@x.com') && sel.cooling === 1);
check('past cooldown is eligible again', sel.eligible.some((r) => r.email === 'cooled@x.com'));
check('email normalized', sel.eligible.some((r) => r.email === 'mixed@x.com'));
check('blank email dropped', !sel.eligible.some((r) => r.name === 'junk'));
check('eligible count right', sel.eligible.length === 3, `got ${sel.eligible.length}`);

// The cap: 500 fresh recipients -> MAX_SENDS_PER_RUN now, remainder counted
const many = Array.from({ length: 500 }, (_, i) => ({ email: `u${i}@x.com`, name: '' }));
const capped = selectDefaultRecipients(many, new Set(), new Map(), now);
check(`run cap at ${MAX_SENDS_PER_RUN}`, capped.eligible.length === MAX_SENDS_PER_RUN);
check('remainder reported, not lost', capped.capped === 500 - MAX_SENDS_PER_RUN);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} — ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
