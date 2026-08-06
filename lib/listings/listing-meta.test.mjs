/**
 * Guards the listing-page title and description budgets.
 *
 *   node lib/listings/listing-meta.test.mjs
 *
 * These strings are the site's search result on 5,382 of its 5,582 URLs, so a
 * regression here is a regression on 96% of the site at once - and it is
 * invisible locally, because an over-long title looks perfect in the browser
 * tab and only gets cut in Google's SERP. Hence tests rather than eyeballing.
 *
 * Two things are pinned: the LENGTH (what broke) and the PRIORITY (what must
 * survive the trim - address first, price second). The real 97-character title
 * that started this is the first case below.
 */

import { buildListingTitle, buildListingDescription, TITLE_MAX, DESCRIPTION_MAX } from './listing-meta.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

// Verbatim from https://www.mississaugainvestor.ca/listings/W13635802, 2026-08-06.
const BAIRD = {
  address: '3650 Baird Court', city: 'Mississauga', neighbourhood: 'Erin Mills',
  type: 'Detached', price: 1524900, beds: 5, baths: 5,
};

console.log('\nThe reported bug: a real 97-character title');
const t = buildListingTitle(BAIRD);
check(`fits the budget (${t.length}): "${t}"`, t.length <= TITLE_MAX, String(t.length));
check('keeps the address - it is the query', t.startsWith('3650 Baird Court'));
check('keeps the price - it is the hook', t.includes('$1,524,900'));
check('price is formatted with separators, not raw', !t.includes('1524900'));
check('keeps the neighbourhood over the city', t.includes('Erin Mills'));
check('no trailing separator left by a dropped part', !/[-,]\s*$/.test(t));
check('no brand suffix (the layout sets it absolute now)', !t.includes('MississaugaInvestor'));

console.log('\nDescription budget');
const d = buildListingDescription(BAIRD);
check(`fits the budget (${d.length})`, d.length <= DESCRIPTION_MAX, String(d.length));
check('states beds and baths', d.includes('5 bed') && d.includes('5 bath'));
check('states the price', d.includes('$1,524,900'));
check('names the street', d.includes('3650 Baird Court'));
check('ends with a period', d.trim().endsWith('.'));

console.log('\nLong addresses still fit, or lose the least valuable part first');
const LONG = {
  address: '#3412 - 4055 Parkside Village Drive', city: 'Mississauga',
  neighbourhood: 'City Centre', type: 'Condo Townhouse', price: 899000, beds: 2, baths: 2,
};
const lt = buildListingTitle(LONG);
check(`long address title fits (${lt.length}): "${lt}"`, lt.length <= TITLE_MAX, String(lt.length));
check('long address survives whole', lt.startsWith('#3412 - 4055 Parkside Village Drive'));
check('price survives ahead of city/type', lt.includes('$899,000'));
check(`long description fits (${buildListingDescription(LONG).length})`, buildListingDescription(LONG).length <= DESCRIPTION_MAX);

// The pathological case: an address that eats the whole budget by itself.
const HUGE = { address: '#1204 - 1235 Bayly Street West Extension Boulevard', city: 'Mississauga', price: 750000 };
const ht = buildListingTitle(HUGE);
check('address longer than the budget is kept whole, never cut mid-word', ht.startsWith(HUGE.address));
check('and is not padded past itself with parts that cannot fit', ht === HUGE.address || ht.length <= TITLE_MAX, `${ht.length} "${ht}"`);

console.log('\nMissing fields drop their clause - never a zero, never an empty $');
const noPrice = buildListingTitle({ ...BAIRD, price: 0 });
check('no price -> no dollar sign at all', !noPrice.includes('$'), noPrice);
check('no price -> still names the property', noPrice.includes('3650 Baird Court') && noPrice.includes('Detached'));
const noBaths = buildListingDescription({ ...BAIRD, baths: 0 });
check('zero baths -> never prints "0 bath"', !noBaths.includes('0 bath'), noBaths);
check('zero baths -> beds still stated', noBaths.includes('5 bed'));
const noRooms = buildListingDescription({ ...BAIRD, beds: 0, baths: 0 });
check('no beds or baths -> no orphan comma or stray "bed"', !noRooms.includes('bed') && !/,\s*\./.test(noRooms), noRooms);
check('no beds or baths -> price survives', noRooms.includes('$1,524,900'));
check('no address -> empty string, not a title about nothing', buildListingTitle({ city: 'Mississauga', price: 1 }) === '');
check('no address -> empty description', buildListingDescription({ city: 'Mississauga' }) === '');
check('called with nothing -> empty, no throw', buildListingTitle() === '' && buildListingDescription() === '');

console.log('\nThe neighbourhood=city fallback never renders "Mississauga, Mississauga"');
const dup = buildListingTitle({ ...BAIRD, neighbourhood: 'Mississauga' });
check('deduped in the title', !dup.includes('Mississauga, Mississauga'), dup);
check('deduped in the description', !buildListingDescription({ ...BAIRD, neighbourhood: 'Mississauga' }).includes('Mississauga, Mississauga'));

console.log('\nEvery canonical property type fits at a realistic address and price');
for (const kind of ['Detached', 'Semi-Detached', 'Townhouse', 'Condo Townhouse', 'Condo', 'Duplex', 'Triplex', 'Fourplex', 'Multiplex']) {
  const s = buildListingTitle({ address: '1234 Runningbrook Drive', city: 'Mississauga', neighbourhood: 'Applewood', type: kind, price: 1299000 });
  check(`${kind} (${s.length}) fits and keeps the price`, s.length <= TITLE_MAX && s.includes('$1,299,000'), s);
}

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
