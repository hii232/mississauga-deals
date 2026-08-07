/**
 * Guards the blog-post neighbourhood matcher.
 *
 *   node lib/blog/match-hood.test.mjs
 *
 * Wrong output here puts a "Malton listings" button on a Clarkson article -
 * a visibly wrong link on the page class most organic visitors land on. The
 * subtle cases are containment (two HOOD_DATA names where one contains the
 * other) and ambiguity (a comparison post naming several hoods).
 */
import { matchHood } from './match-hood.js';
import { HOOD_DATA } from '../constants.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

console.log('\nReal post titles from the live blog');
check('Malton guide', matchHood('Malton Investment Guide 2026: Mississauga\'s Cash Flow Corner') === 'Malton');
check('Churchill Meadows guide', matchHood('Churchill Meadows Mississauga Investment Guide: 2026 Analysis') === 'Churchill Meadows');
// "Hurontario" is ITSELF a HOOD_DATA neighbourhood, so this title names two
// distinct hoods and the ambiguity rule refuses - the generic /listings link
// is the designed outcome, not a miss. (A Cooksville-only title matches fine,
// next line.) First draft of this test expected 'Cooksville' and was wrong.
check('Cooksville + Hurontario LRT title is AMBIGUOUS -> null', matchHood('Cooksville and the Hurontario LRT: What Transit Actually Changes') === null);
check('Cooksville-only title matches', matchHood('Cooksville Investment Guide: The LRT Corridor Play') === 'Cooksville');
check('City Centre deep dive', matchHood('City Centre Square One Mississauga Investment Guide 2026 Deep Dive') === 'City Centre');

console.log('\nContainment: the longer, more specific name wins');
check('"Central Erin Mills" beats its substring', matchHood('Central Erin Mills Family Rental Guide') === 'Central Erin Mills');
check('bare "Erin Mills" still matches itself', matchHood('Is Erin Mills a Good Investment in 2026?') === 'Erin Mills');
check('"Lakeview Village" beats "Lakeview"', matchHood('Lakeview Village Pre-Construction Outlook') === 'Lakeview Village');
check('bare "Lakeview" matches itself', matchHood('The Lakeview Redevelopment Play') === 'Lakeview');

console.log('\nAmbiguity and absence refuse - generic links beat a coin flip');
check('two distinct hoods -> null', matchHood('Clarkson vs Malton: Where Does Cash Flow Better?') === null);
check('no hood -> null', matchHood('How to Finance Your First Investment Property') === null);
check('word boundary: no substring-inside-word match', matchHood('The Dixieland Festival Effect on Prices') !== 'Dixie' || !('Dixie' in HOOD_DATA));
check('empty title -> null', matchHood('') === null);
check('undefined -> null', matchHood(undefined) === null);

console.log('\nEvery HOOD_DATA name matches its own guide-style title');
let all = true;
for (const name of Object.keys(HOOD_DATA)) {
  const got = matchHood(`${name} Investment Guide 2026`);
  if (got !== name) { all = false; console.log(`  FAIL ${name} -> ${got}`); }
}
check('all hood names round-trip', all);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
