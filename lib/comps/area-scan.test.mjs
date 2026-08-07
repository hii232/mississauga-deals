/**
 * Guards the /sold-near-me area-scan logic.
 *
 *   node lib/comps/area-scan.test.mjs
 *
 * The FSA parser is the front door of a lead-capture flow - a parser that
 * rejects a real postal code turns a hot seller lead away at the first input.
 * The competition filter makes a proximity claim to a would-be seller, so its
 * refusal cases (unknown hood, unknown DOM) matter as much as its matches.
 */
import { parseFsa, hoodForFsa, filterCompetition } from './area-scan.js';
import { FSA_TO_HOOD } from '../constants.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

console.log('\nparseFsa - every way a person types a postal code');
check('full code with space', parseFsa('L5M 7L9') === 'L5M');
check('full code no space', parseFsa('L5M7L9') === 'L5M');
check('lowercase', parseFsa('l5m 7l9') === 'L5M');
check('bare FSA', parseFsa('L5M') === 'L5M');
check('full address with postal', parseFsa('4055 Parkside Village Dr, Mississauga, ON L5B 0K1') === 'L5B');
check('address with unit number does not misparse', parseFsa('#1204 - 1235 Bayly St L1S 3W1') === 'L1S');
check('street number alone is not an FSA', parseFsa('4055 Parkside Village Drive') === null);
check('empty -> null', parseFsa('') === null);
check('garbage -> null', parseFsa('hello world 123') === null);
check('undefined -> null', parseFsa(undefined) === null);

console.log('\nhoodForFsa - honest nulls');
const someFsa = Object.keys(FSA_TO_HOOD)[0];
check(`known FSA (${someFsa}) maps`, hoodForFsa(someFsa) === FSA_TO_HOOD[someFsa]);
check('lowercase input still maps', hoodForFsa(someFsa.toLowerCase()) === FSA_TO_HOOD[someFsa]);
check('unknown FSA -> null (never a guess)', hoodForFsa('X9X') === null);
check('null -> null', hoodForFsa(null) === null);

console.log('\nfilterCompetition - proximity claims it can stand behind');
const L = [
  { id: 'a', neighbourhood: 'Erin Mills', type: 'Detached', price: 1200000, dom: 5 },
  { id: 'b', neighbourhood: 'Erin Mills', type: 'Detached', price: 1100000, dom: 2 },
  { id: 'c', neighbourhood: 'Erin Mills', type: 'Condo', price: 600000, dom: 1 },
  { id: 'd', neighbourhood: 'Malton', type: 'Detached', price: 900000, dom: 1 },
  { id: 'e', neighbourhood: 'Erin Mills', type: 'Detached', price: 1300000, dom: 0 },   // unknown age
  { id: 'f', neighbourhood: 'Erin Mills', type: 'Detached', price: 0, dom: 3 },          // no price
];
const out = filterCompetition(L, { hood: 'Erin Mills', type: 'Detached' });
check('same hood + type only', out.every((l) => l.neighbourhood === 'Erin Mills' && l.type === 'Detached'));
check('freshest first (dom asc)', out[0]?.id === 'b' && out[1]?.id === 'a');
check('unknown dom (0) sorts LAST, never claimed freshest', out[out.length - 1]?.id === 'e');
check('zero-price rows dropped', !out.some((l) => l.id === 'f'));
check('other hood excluded', !out.some((l) => l.id === 'd'));
check('no type given -> all types in hood', filterCompetition(L, { hood: 'Erin Mills' }).some((l) => l.id === 'c'));
check('limit respected', filterCompetition(L, { hood: 'Erin Mills', limit: 2 }).length === 2);
check('NO HOOD -> EMPTY, not city-wide "competition"', filterCompetition(L, { type: 'Detached' }).length === 0);
check('junk listings input -> empty', filterCompetition(null, { hood: 'Erin Mills' }).length === 0);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
