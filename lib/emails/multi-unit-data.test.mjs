/**
 * Tests for the multi-unit letter's data layer.
 *
 *   node lib/emails/multi-unit-data.test.mjs
 *
 * Every number the letter states comes out of aggregateMultiUnit, and
 * validateMultiUnit is what stands between a feed hiccup and 483 inboxes.
 */

import { selectMultiUnit, aggregateMultiUnit, validateMultiUnit } from './multi-unit-data.js';

const L = (o = {}) => ({
  id: o.id || Math.random().toString(36).slice(2),
  address: '10 Test Ave', type: 'Duplex', price: 1100000, dom: 30, priceDrop: 0, ...o,
});

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

console.log('\nSelection - only rows the campaign may describe');
const pool = [
  L({ id: 'a', type: 'Duplex' }),
  L({ id: 'b', type: 'Triplex', price: 1400000 }),
  L({ id: 'c', type: 'Fourplex', price: 1900000 }),
  L({ id: 'd', type: 'Detached' }),            // wrong type despite server filter
  L({ id: 'e', type: 'Duplex', price: 90000 }), // junk price
  L({ id: 'f', type: 'Duplex', price: 9000000 }), // junk price high
  L({ id: 'g', type: 'Duplex', address: '' }),  // no address
  L({ id: 'a', type: 'Duplex' }),               // duplicate id
];
const sel = selectMultiUnit(pool);
check('keeps the three legit rows', sel.length === 3, `got ${sel.length}`);
check('drops the detached that leaked through', !sel.some((r) => r.type === 'Detached'));
check('drops out-of-band prices', !sel.some((r) => r.price === 90000 || r.price === 9000000));
check('dedupes by id', new Set(sel.map((r) => r.id)).size === sel.length);
check('null input safe', selectMultiUnit(null).length === 0);

console.log('\nAggregation - the letter\'s sentences, computed');
const rows = [
  L({ id: '1', type: 'Duplex', price: 900000, dom: 20, priceDrop: 3 }),
  L({ id: '2', type: 'Duplex', price: 1100000, dom: 45, priceDrop: 0 }),
  L({ id: '3', type: 'Triplex', price: 1500000, dom: 80, priceDrop: 2 }),
  L({ id: '4', type: 'Duplex', price: 1000000, dom: 0, priceDrop: 0 }), // dom unknown
];
const agg = aggregateMultiUnit(rows);
check('count', agg.count === 4);
check('byType', agg.byType.Duplex === 3 && agg.byType.Triplex === 1);
check('breakdown reads naturally', agg.breakdown === '3 duplexes and 1 triplex', agg.breakdown);
check('price range', agg.priceMin === 900000 && agg.priceMax === 1500000);
check('median price (even count -> avg of middle two)', agg.priceMedian === 1050000, `got ${agg.priceMedian}`);
check('median DOM ignores unknown zeros', agg.medianDOM === 45, `got ${agg.medianDOM}`);
check('domKnownCount excludes zeros', agg.domKnownCount === 3);
check('cutCount', agg.cutCount === 2);
const single = aggregateMultiUnit([L({ id: 'x', type: 'Fourplex', price: 2000000, dom: 33 })]);
check('singular form in breakdown', single.breakdown === '1 fourplex', single.breakdown);

console.log('\nValidation - refuse rather than publish a wrong claim');
const good = validateMultiUnit(agg, 2500);
check('healthy snapshot passes', good.data !== null, good.reason);
check('totalActive carried through', good.data.totalActive === 2500);
check('0 listings refuses (subtype drift lands here)',
  validateMultiUnit(aggregateMultiUnit([]), 2500).data === null);
check('1 listing refuses', validateMultiUnit(aggregateMultiUnit(rows.slice(0, 1)), 2500).data === null);
const many = aggregateMultiUnit(Array.from({ length: 70 }, (_, i) => L({ id: `m${i}` })));
check('70 "multiplexes" refuses (over-matching filter)', validateMultiUnit(many, 2500).data === null);
const mostlyUnknownDom = aggregateMultiUnit([
  L({ id: 'u1', dom: 0 }), L({ id: 'u2', dom: 0 }), L({ id: 'u3', dom: 0 }), L({ id: 'u4', dom: 25 }),
]);
check('DOM unknown for most rows refuses', validateMultiUnit(mostlyUnknownDom, 2500).data === null);
check('missing totalActive refuses', validateMultiUnit(agg, 0).data === null);
check('totalActive smaller than count refuses', validateMultiUnit(agg, 3).data === null);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
