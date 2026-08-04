/**
 * Tests for selfOrigin.
 *
 *   node lib/emails/self-origin.test.mjs
 *
 * This decides the URL that goes into an emailed "Review & Send" button. Get it
 * wrong one way and approval 404s (which is the bug that prompted this file);
 * get it wrong the other way and a poisoned Host header points the approve
 * action at a host we don't control.
 */

import { selfOrigin } from './self-origin.js';

const req = (headers = {}) => ({
  headers: { get: (k) => headers[k.toLowerCase()] ?? null },
});

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}
const CANON = 'https://www.mississaugainvestor.ca';

console.log('\nThe bug this fixes - a preview must approve on itself');
const preview = 'mississauga-deals-git-claude-websit-8440c0-hamza-6026s-projects.vercel.app';
check('vercel preview host is honoured',
  selfOrigin(req({ host: preview })) === `https://${preview}`,
  `got ${selfOrigin(req({ host: preview }))}`);
check('x-forwarded-host wins over host',
  selfOrigin(req({ host: 'internal:3000', 'x-forwarded-host': preview })) === `https://${preview}`);

console.log('\nProduction hosts');
check('www.mississaugainvestor.ca', selfOrigin(req({ host: 'www.mississaugainvestor.ca' })) === CANON);
check('apex mississaugainvestor.ca',
  selfOrigin(req({ host: 'mississaugainvestor.ca' })) === 'https://mississaugainvestor.ca');
check('host is lowercased',
  selfOrigin(req({ host: 'WWW.MississaugaInvestor.CA' })) === CANON);

console.log('\nHost-header poisoning falls back to canonical, never to the attacker');
for (const bad of [
  'evil.com',
  'mississaugainvestor.ca.evil.com',
  'evil.com/mississaugainvestor.ca',
  'www.mississaugainvestor.ca.attacker.net',
  'notvercel.app.evil.com',
  'localhost:3000',
  '127.0.0.1',
  '',
]) {
  check(`"${bad}" -> canonical`, selfOrigin(req({ host: bad })) === CANON,
    `got ${selfOrigin(req({ host: bad }))}`);
}

console.log('\nForwarded-header edge cases');
check('comma-chained x-forwarded-host takes the first',
  selfOrigin(req({ 'x-forwarded-host': `${preview}, evil.com` })) === `https://${preview}`);
check('a chain STARTING with a bad host does not pass',
  selfOrigin(req({ 'x-forwarded-host': `evil.com, ${preview}` })) === CANON);
check('x-forwarded-proto is honoured for http',
  selfOrigin(req({ host: preview, 'x-forwarded-proto': 'http' })) === `http://${preview}`);
check('a nonsense proto falls back to canonical',
  selfOrigin(req({ host: preview, 'x-forwarded-proto': 'javascript' })) === CANON);
check('no headers at all -> canonical', selfOrigin(req({})) === CANON);
check('no request object -> canonical', selfOrigin(undefined) === CANON);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
