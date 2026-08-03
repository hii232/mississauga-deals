/**
 * The site's Duplex/Multi filter must agree with the multi-unit email.
 *
 *   node components/listings/filter-utils.multiunit.test.mjs
 *
 * WHY THIS EXISTS. On 2026-08-03 the multi-unit email told ~480 investors there
 * were 11 duplex/triplex/multiplex listings in Mississauga, and the site's
 * Duplex/Multi filter showed "No properties match your filters right now". The
 * email was right — production's /api/listings?multiUnit=1 returned exactly
 * those 11 — but a reader clicking through saw an empty page and concluded the
 * email lied. Two separate causes; this file guards the filter half.
 *
 * The rows below are the REAL 11 from production that day, plus a Fourplex,
 * which the previous hand-written test (`duplex || multi || triplex`) silently
 * dropped.
 */

import { applyFilters, DEFAULT_FILTERS } from './filter-utils.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

const REAL = [
  { id: '1', type: 'Duplex', price: 3188000 },
  { id: '2', type: 'Multiplex', price: 999000 },
  { id: '3', type: 'Duplex', price: 1699000 },
  { id: '4', type: 'Duplex', price: 1898000 },
  { id: '5', type: 'Triplex', price: 1699000 },
  { id: '6', type: 'Duplex', price: 1125000 },
  { id: '7', type: 'Duplex', price: 1300000 },
  { id: '8', type: 'Multiplex', price: 2149000 },
  { id: '9', type: 'Triplex', price: 1799000 },
  { id: '10', type: 'Triplex', price: 1688900 },
  { id: '11', type: 'Duplex', price: 2999850 },
].map((r) => ({ ...r, subType: r.type }));

const EXTRA = [
  { id: 'F', type: 'Fourplex', subType: 'Fourplex', price: 1500000 },
  { id: 'D', type: 'Detached', subType: 'Detached', price: 900000 },
  { id: 'C', type: 'Condo', subType: 'Condo Apartment', price: 500000 },
  { id: 'T', type: 'Townhouse', subType: 'Att/Row/Townhouse', price: 800000 },
];

const filters = { ...DEFAULT_FILTERS, propertyType: 'Duplex/Multi', priceRange: [0, 4000000] };
const ids = applyFilters([...REAL, ...EXTRA], filters).map((r) => r.id);

console.log('\nDuplex/Multi filter vs the real production set');
check('all 11 real multi-unit listings match',
  REAL.every((r) => ids.includes(r.id)),
  `matched ${ids.length}: ${ids.join(',')}`);
check('Fourplex matches (the type the old test dropped)', ids.includes('F'));
check('Detached excluded', !ids.includes('D'));
check('Condo excluded', !ids.includes('C'));
check('Townhouse excluded', !ids.includes('T'));
check('exactly 12 matched (11 real + fourplex)', ids.length === 12, `got ${ids.length}`);

console.log('\nEvery type the email can count is matchable by the filter');
// If these two ever diverge again, the email will describe listings the site
// cannot show — the exact failure this file exists to prevent.
for (const t of ['Duplex', 'Triplex', 'Fourplex', 'Multiplex']) {
  const got = applyFilters([{ id: t, type: t, subType: t, price: 1000000 }], filters);
  check(`${t} is matchable`, got.length === 1);
}

console.log('\nType buckets must be mutually correct (no substring bleed)');
// Measured bug: 'semi-detached'.includes('detached') was true, so the Detached
// filter returned 49 rows on a 99-row production sample of which 11 were semis.
const MIX = [
  { id: 'det', type: 'Detached', subType: 'Detached', price: 1200000 },
  { id: 'semi', type: 'Semi-Detached', subType: 'Semi-Detached', price: 950000 },
  { id: 'town', type: 'Townhouse', subType: 'Att/Row/Townhouse', price: 850000 },
  { id: 'ctown', type: 'Townhouse', subType: 'Condo Townhouse', price: 750000 },
  { id: 'apt', type: 'Condo', subType: 'Condo Apartment', price: 550000 },
  { id: 'dup', type: 'Duplex', subType: 'Duplex', price: 1400000 },
];
const bucket = (t) => applyFilters(MIX, { ...DEFAULT_FILTERS, propertyType: t, priceRange: [0, 4000000] }).map((r) => r.id);

check('Detached returns ONLY the detached', JSON.stringify(bucket('Detached')) === '["det"]', JSON.stringify(bucket('Detached')));
check('Semi returns ONLY the semi', JSON.stringify(bucket('Semi')) === '["semi"]', JSON.stringify(bucket('Semi')));
check('Duplex/Multi returns ONLY the duplex', JSON.stringify(bucket('Duplex/Multi')) === '["dup"]', JSON.stringify(bucket('Duplex/Multi')));
check('Town returns both townhouse forms', JSON.stringify(bucket('Town')) === '["town","ctown"]', JSON.stringify(bucket('Town')));
// Deliberate, documented overlap: a condo townhouse is genuinely both.
check('Condo returns the apt AND the condo townhouse', JSON.stringify(bucket('Condo')) === '["ctown","apt"]', JSON.stringify(bucket('Condo')));
check('All returns everything', bucket('All').length === MIX.length);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} — ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
