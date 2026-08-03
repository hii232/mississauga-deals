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

import { applyFilters, DEFAULT_FILTERS, PROPERTY_TYPE_MATCH, PROPERTY_TYPES } from './filter-utils.js';
import { mapType } from '../../lib/property-types.js';

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

const filters = { ...DEFAULT_FILTERS, propertyType: 'Duplex/Multi', priceRange: [0, 4000000] }; // the all-multi-unit alias
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

console.log('\nType buckets are DISJOINT — every listing in exactly one');
// Condo townhouses carry a maintenance fee and freehold townhouses do not, so
// they are separate buckets. Verified against the live feed: 20/20 rows typed
// "Condo Townhouse" carry a condo fee; the one "Att/Row/Townhouse" carries none.
const MIX = [
  { id: 'det',   type: 'Detached',        price: 1200000 },
  { id: 'semi',  type: 'Semi-Detached',   price: 950000 },
  { id: 'town',  type: 'Townhouse',       price: 850000 },
  { id: 'ctown', type: 'Condo Townhouse', price: 750000 },
  { id: 'apt',   type: 'Condo',           price: 550000 },
  { id: 'dup',   type: 'Duplex',          price: 1400000 },
  { id: 'tri',   type: 'Triplex',         price: 1500000 },
  { id: 'four',  type: 'Fourplex',        price: 1600000 },
  { id: 'multi', type: 'Multiplex',       price: 1700000 },
];
const bucket = (t) => applyFilters(MIX, { ...DEFAULT_FILTERS, propertyType: t, priceRange: [0, 4000000] }).map((r) => r.id);

check('Detached -> only detached', String(bucket('Detached')) === 'det', String(bucket('Detached')));
check('Semi -> only semi', String(bucket('Semi')) === 'semi', String(bucket('Semi')));
check('Town -> FREEHOLD only, no condo town', String(bucket('Town')) === 'town', String(bucket('Town')));
check('Condo Town -> only the condo townhouse', String(bucket('Condo Town')) === 'ctown', String(bucket('Condo Town')));
check('Condo -> apartment only, no townhouses', String(bucket('Condo')) === 'apt', String(bucket('Condo')));
check('Duplex -> the duplex only (5% down tier)', String(bucket('Duplex')) === 'dup', String(bucket('Duplex')));
check('Triplex+ -> triplex, fourplex, multiplex (10% / commercial)',
  String(bucket('Triplex+')) === 'tri,four,multi', String(bucket('Triplex+')));
// No chip, but the multi-unit email links to it and must land on ALL of them.
check('legacy ?type=Duplex/Multi still selects all four',
  String(bucket('Duplex/Multi')) === 'dup,tri,four,multi', String(bucket('Duplex/Multi')));
check('All -> everything', bucket('All').length === MIX.length);

// The property that makes the whole scheme trustworthy: no double-counting.
const counted = PROPERTY_TYPES.filter((t) => t !== 'All').flatMap((t) => bucket(t));
check('buckets are disjoint (no listing in two)', new Set(counted).size === counted.length, String(counted));
check('buckets are exhaustive (every listing in one)', counted.length === MIX.length, `${counted.length}/${MIX.length}`);

console.log('\nmapType assigns those types from real feed spellings');
const cases = [
  ['Detached', 'Residential Freehold', 'Detached'],
  ['Semi-Detached', 'Residential Freehold', 'Semi-Detached'],
  ['Att/Row/Townhouse', 'Residential Freehold', 'Townhouse'],
  ['Condo Townhouse', 'Residential Condo & Other', 'Condo Townhouse'],
  ['Condo Apartment', 'Residential Condo & Other', 'Condo'],
  ['Co-op Apartment', 'Residential Condo & Other', 'Condo'],
  ['Duplex', 'Residential Freehold', 'Duplex'],
  ['Triplex', 'Residential Freehold', 'Triplex'],
  ['Fourplex', 'Residential Freehold', 'Fourplex'],
  ['Multiplex', 'Residential Freehold', 'Multiplex'],
];
for (const [sub, prop, want] of cases) {
  check(`${sub} -> ${want}`, mapType(sub, prop) === want, `got ${mapType(sub, prop)}`);
}
// Every type mapType can produce must land in exactly one CHIP. Checked against
// the chip row, not the match map — the map also holds the deliberate
// all-multi-unit URL alias, which is a superset and has no chip.
const CHIPS = PROPERTY_TYPES.filter((t) => t !== 'All');
const produced = [...new Set(cases.map(([s2, p2]) => mapType(s2, p2)))];
for (const t of produced) {
  const hits = CHIPS.filter((c) => PROPERTY_TYPE_MATCH[c].includes(t));
  check(`"${t}" is in exactly one chip`, hits.length === 1, `in ${hits.length}: ${hits}`);
}
check('the all-multi-unit alias is NOT a chip', !PROPERTY_TYPES.includes('Duplex/Multi'));
check('every chip has a match rule', CHIPS.every((c) => Array.isArray(PROPERTY_TYPE_MATCH[c])));

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} — ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
