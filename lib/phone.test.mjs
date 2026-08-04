/**
 * Tests for the shared phone helper.
 *
 *   node lib/phone.test.mjs
 *
 * A phone number is now required to register, so this validator is the thing
 * standing between Hamza and a database of numbers he cannot dial.
 */

import { cleanPhone, isValidPhone, isFakePhone, phoneDigits, formatPhone } from './phone.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

console.log('\ncleanPhone');
check('strips formatting', cleanPhone('(647) 361-1234') === '6473611234');
check('null safe', cleanPhone(null) === '');
check('undefined safe', cleanPhone(undefined) === '');

console.log('\nisValidPhone - accepts real numbers');
check('10 digits', isValidPhone('6473611234'));
check('10 digits formatted', isValidPhone('(647) 361-1234'));
check('11 digits with country code', isValidPhone('16473611234'));
check('11 digits formatted', isValidPhone('1 (647) 361-1234'));
check('dashes and spaces', isValidPhone('647-361-1234'));

console.log('\nisValidPhone - rejects what it must');
check('empty rejected', !isValidPhone(''));
check('null rejected', !isValidPhone(null));
check('too short rejected', !isValidPhone('647361123'));
check('too long rejected', !isValidPhone('647361123456'));
// The drift the shared helper exists to kill: the gate modal used to accept
// any 10+ digit string, so this passed there and failed on /signup.
check('11 digits NOT starting with 1 rejected', !isValidPhone('26473611234'));
check('letters alone rejected', !isValidPhone('not a phone'));
check('digits inside text still counted', isValidPhone('call me at 647 361 1234'));

console.log('\nisFakePhone - the numbers a FORCED field produces');
check('all same digit', isFakePhone('5555555555'));
check('all zeros', isFakePhone('0000000000'));
check('all ones', isFakePhone('1111111111'));
check('555 area code', isFakePhone('(555) 361-1234'));
check('555 exchange', isFakePhone('(647) 555-1234'));
check('555 with country code', isFakePhone('1 (555) 361-1234'));
check('real number is not fake', !isFakePhone('(647) 361-1234'));
check('real number with country code', !isFakePhone('1 (647) 361-1234'));
// 555 must only match the area code or exchange, never the line number -
// 647-361-5551 is a perfectly dialable number and rejecting it would block a
// real lead on a now-mandatory field.
check('555 in the LINE number is fine', !isFakePhone('(647) 361-5551'));
check('shape is isValidPhone’s job - short input not called fake', !isFakePhone('555'));
check('empty not fake', !isFakePhone(''));
check('null safe', !isFakePhone(null));

console.log('\nphoneDigits - wa.me requires bare digits');
// The bug this replaced: /\\D/g (an escaped backslash in a template literal)
// matches a literal "\D", not non-digits, so the WhatsApp button in every lead
// notification linked to "wa.me/(647) 361-1234" - parens and a space in a URL.
check('strips formatting for wa.me', phoneDigits('(647) 361-1234') === '6473611234');
check('keeps country code', phoneDigits('1 (647) 361-1234') === '16473611234');
check('null safe', phoneDigits(null) === '');
check('produces a wa.me URL with no illegal characters',
  !/[^0-9]/.test(phoneDigits('(647) 361-1234')));

console.log('\nformatPhone - progressive, does not fight the typist');
check('under 4 digits untouched', formatPhone('647') === '647', formatPhone('647'));
check('4 digits partial', formatPhone('6473') === '(647) 3', formatPhone('6473'));
check('7 digits', formatPhone('6473611') === '(647) 361-1', formatPhone('6473611'));
check('10 digits complete', formatPhone('6473611234') === '(647) 361-1234', formatPhone('6473611234'));
check('11 digits keeps country code', formatPhone('16473611234') === '1 (647) 361-1234', formatPhone('16473611234'));
check('caps at 11 digits', formatPhone('164736112349999') === '1 (647) 361-1234', formatPhone('164736112349999'));
check('empty safe', formatPhone('') === '');
check('null safe', formatPhone(null) === '');
check('already formatted is idempotent',
  formatPhone(formatPhone('6473611234')) === '(647) 361-1234', formatPhone(formatPhone('6473611234')));

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
