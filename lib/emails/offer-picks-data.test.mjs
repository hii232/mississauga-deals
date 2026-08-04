/**
 * Tests for the offer math.
 *
 *   node lib/emails/offer-picks-data.test.mjs
 *
 * This module tells a subscriber what to offer on a named, real property. It
 * is the highest-stakes arithmetic in the codebase - wrong here and someone
 * either insults a seller or overpays, with Hamza's name on the advice. The
 * build is the project's only gate, and a build cannot catch a bad offer.
 */

import {
  openingOffer, pickDeals, resolveTypeKey, validatePicks, LIMITS,
} from './offer-picks-data.js';

// Real TRREB MW2606 (June 2026) Mississauga figures.
const TYPES = {
  detached:     { sales: 227, avgPrice: 1482130, spLp: 96,  ldom: 25 },
  semiDetached: { sales: 86,  avgPrice: 908389,  spLp: 100, ldom: 19 },
  townhouse:    { sales: 18,  avgPrice: 883038,  spLp: 101, ldom: 30 },
  condoTown:    { sales: 91,  avgPrice: 726749,  spLp: 98,  ldom: 31 },
  condoApt:     { sales: 142, avgPrice: 525333,  spLp: 97,  ldom: 40 },
};

const listing = (o = {}) => ({
  id: o.id || 'L1', address: '123 Test St', city: 'Mississauga',
  neighbourhood: o.neighbourhood || 'Cooksville', type: o.type || 'Detached',
  price: o.price ?? 1000000, dom: o.dom ?? 30, priceDrop: o.priceDrop ?? 0,
  photos: o.photos ?? ['p.jpg'], condoFee: o.condoFee, ...o,
});

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

console.log('\nType resolution - the anchor must match the property');
check('detached -> detached', resolveTypeKey(listing({ type: 'Detached' })) === 'detached');
check('condo -> condoApt', resolveTypeKey(listing({ type: 'Condo' })) === 'condoApt');
check('townhouse WITH condo fee -> condoTown',
  resolveTypeKey(listing({ type: 'Townhouse', condoFee: 450 })) === 'condoTown');
check('townhouse WITHOUT fee -> freehold (conservative, higher ratio)',
  resolveTypeKey(listing({ type: 'Townhouse' })) === 'townhouse');
check('duplex has no TRREB category -> excluded',
  resolveTypeKey(listing({ type: 'Duplex' })) === null);
check('triplex excluded', resolveTypeKey(listing({ type: 'Triplex' })) === null);

console.log('\nThe offer is anchored to what that type actually sold for');
const atPar = openingOffer(listing({ type: 'Detached', dom: 25, price: 1000000 }), TYPES);
check('detached at typical DOM, no cut -> 96% of ask', atPar.pctOfAsk === 96,
  `got ${atPar?.pctOfAsk}`);
check('  ...which is $960,000 on a $1M ask', atPar.offer === 960000, `got ${atPar?.offer}`);
check('  ...and reports the market ratio it used', atPar.marketRatio === 96);
check('  ...claims no DOM leverage it did not use', atPar.usedDom === false && atPar.usedCut === false);

console.log('\nLeverage only where the listing actually earns it');
const sat = openingOffer(listing({ type: 'Detached', dom: 50, price: 1000000 }), TYPES);
check('double the typical DOM -> 3 points below ratio (capped)', sat.pctOfAsk === 93,
  `got ${sat.pctOfAsk}`);
check('  ...and flags DOM as a used reason', sat.usedDom === true);
const cutOnly = openingOffer(listing({ type: 'Detached', dom: 25, priceDrop: 4 }), TYPES);
check('already cut -> 1 point below ratio', cutOnly.pctOfAsk === 95, `got ${cutOnly.pctOfAsk}`);
check('  ...and flags the cut, not DOM', cutOnly.usedCut === true && cutOnly.usedDom === false);

console.log('\nCaps - an opening offer is a position, not a fantasy');
const extreme = openingOffer(listing({ type: 'Detached', dom: 900, priceDrop: 30 }), TYPES);
check('a year on market + big cut still stops 4 points below the ratio',
  extreme.pctOfAsk === 96 - LIMITS.MAX_POINTS_BELOW_RATIO, `got ${extreme.pctOfAsk}`);
check('never below the absolute floor', extreme.pctOfAsk >= LIMITS.ABSOLUTE_FLOOR_PCT);

console.log('\nTypes that sell AT or OVER asking must not produce a lowball');
const semi = openingOffer(listing({ type: 'Semi-Detached', dom: 19 }), TYPES);
check('semi (sold at 100%) -> opens at 100%, never above', semi.pctOfAsk === 100,
  `got ${semi.pctOfAsk}`);
const free = openingOffer(listing({ type: 'Townhouse', dom: 30 }), TYPES);
check('freehold town (sold at 101%) -> capped at 100, you do not open above ask',
  free.pctOfAsk === LIMITS.MAX_OPEN_PCT, `got ${free.pctOfAsk}`);
const freeSat = openingOffer(listing({ type: 'Townhouse', dom: 60 }), TYPES);
check('  ...but a freehold town that HAS sat gets real room', freeSat.pctOfAsk === 98,
  `got ${freeSat.pctOfAsk}`);

console.log('\nUnknown days-on-market grants no leverage (0 means unknown, not new)');
const unknown = openingOffer(listing({ type: 'Detached', dom: 0 }), TYPES);
check('dom 0 -> flat market ratio, no DOM claim',
  unknown.pctOfAsk === 96 && unknown.usedDom === false, `got ${unknown?.pctOfAsk}`);

console.log('\nRefuses rather than guessing');
check('no stats for the type -> null', openingOffer(listing({ type: 'Duplex' }), TYPES) === null);
check('zero price -> null', openingOffer(listing({ price: 0 }), TYPES) === null);
check('missing salesByType -> null', openingOffer(listing(), null) === null);
check('type present but ratio missing -> null',
  openingOffer(listing({ type: 'Detached' }), { detached: { spLp: 0, ldom: 25 } }) === null);

console.log('\nSelection');
const pool = [
  listing({ id: 'a', dom: 90, neighbourhood: 'Cooksville', price: 900000 }),
  listing({ id: 'b', dom: 85, neighbourhood: 'Cooksville', price: 950000 }), // same hood
  listing({ id: 'c', dom: 70, neighbourhood: 'Malton', price: 800000 }),
  listing({ id: 'd', dom: 60, neighbourhood: 'Clarkson', price: 850000 }),
  listing({ id: 'e', dom: 5,  neighbourhood: 'Erin Mills' }),               // no leverage
  listing({ id: 'f', dom: 90, neighbourhood: 'Port Credit', photos: [] }),  // no photo
  listing({ id: 'g', dom: 90, neighbourhood: 'Meadowvale', price: 50000 }), // junk price
  listing({ id: 'h', dom: 99, neighbourhood: 'Streetsville', type: 'Duplex' }), // no anchor
];
const picks = pickDeals(pool, TYPES, 3);
check('returns 3', picks.length === 3, `got ${picks.length}`);
check('sorted by leverage (a first)', picks[0].listing.id === 'a');
check('no two from the same neighbourhood',
  new Set(picks.map((p) => p.listing.neighbourhood)).size === 3);
const ids = picks.map((p) => p.listing.id);
check('excludes the no-leverage listing', !ids.includes('e'));
check('excludes the photoless listing', !ids.includes('f'));
check('excludes the junk price', !ids.includes('g'));
check('excludes the unanchorable duplex', !ids.includes('h'));
check('every pick offers below its ask',
  picks.every((p) => p.offer.offer < p.listing.price));
// A freehold town barely past its typical DOM computes an offer capped at the
// asking price. Correct advice, but not a pick - it must not reach the email.
const parPool = [listing({ id: 'par', type: 'Townhouse', dom: 31, neighbourhood: 'Lorne Park' })];
check('a pick whose offer equals the ask is dropped, not shown',
  pickDeals(parPool, TYPES, 3).length === 0);

console.log('\nvalidatePicks - the gate before anything is composed');
check('good picks pass', validatePicks(picks, TYPES, 'June 2026').data !== null);
check('no month -> refuse', validatePicks(picks, TYPES, null).data === null);
check('too few picks -> refuse', validatePicks(picks.slice(0, 2), TYPES, 'June 2026').data === null);
check('empty pool -> refuse', validatePicks([], TYPES, 'June 2026').data === null);
check('incomplete salesByType -> refuse',
  validatePicks(picks, { detached: TYPES.detached }, 'June 2026').data === null);
const dup = [picks[0], picks[0], picks[1]];
check('duplicate listing -> refuse', validatePicks(dup, TYPES, 'June 2026').data === null);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
