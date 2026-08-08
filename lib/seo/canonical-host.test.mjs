/**
 * Tests for the one-public-hostname redirect.
 *
 *   node lib/seo/canonical-host.test.mjs
 *
 * The stakes, both directions: miss the mirror host and Google keeps crawling
 * a full duplicate of the site on vercel.app; over-match and every PREVIEW
 * deployment redirects to production, breaking the links Hamza reviews work
 * on. The vercelEnv gate is what separates the two, so it gets its own cases.
 */

import { canonicalHostRedirect, CANONICAL_HOST } from './canonical-host.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

const PROD = 'production';

console.log('\nMirror hosts redirect in production');
check('project alias', canonicalHostRedirect('mississauga-deals.vercel.app', '/', PROD) === `https://${CANONICAL_HOST}/`);
check('git-main alias', canonicalHostRedirect('mississauga-deals-git-main-hamza-6026s-projects.vercel.app', '/sell', PROD) === `https://${CANONICAL_HOST}/sell`);
check('deployment-hash alias', canonicalHostRedirect('mississauga-deals-q1u6c452a-hamza-6026s-projects.vercel.app', '/gta', PROD) === `https://${CANONICAL_HOST}/gta`);
check('apex belt-and-braces', canonicalHostRedirect('mississaugainvestor.ca', '/listings', PROD) === `https://${CANONICAL_HOST}/listings`);
check('query string preserved', canonicalHostRedirect('mississauga-deals.vercel.app', '/listings?cf=1&sort=cashflow', PROD) === `https://${CANONICAL_HOST}/listings?cf=1&sort=cashflow`);
check('host header port stripped', canonicalHostRedirect('mississauga-deals.vercel.app:443', '/', PROD) === `https://${CANONICAL_HOST}/`);
check('case-insensitive host', canonicalHostRedirect('Mississauga-Deals.VERCEL.APP', '/', PROD) === `https://${CANONICAL_HOST}/`);
check('empty path falls back to /', canonicalHostRedirect('mississauga-deals.vercel.app', '', PROD) === `https://${CANONICAL_HOST}/`);

console.log('\nThe real domain is never redirected');
check('www serves normally', canonicalHostRedirect(CANONICAL_HOST, '/', PROD) === null);
check('www with path serves normally', canonicalHostRedirect(CANONICAL_HOST, '/sold-near-me', PROD) === null);

console.log('\nPreviews and local dev are never redirected (the over-match failure)');
check('preview deployment stays put', canonicalHostRedirect('mississauga-deals-git-claude-websit-8440c0-hamza-6026s-projects.vercel.app', '/', 'preview') === null);
check('development env stays put', canonicalHostRedirect('mississauga-deals.vercel.app', '/', 'development') === null);
check('VERCEL_ENV absent (local next start) stays put', canonicalHostRedirect('mississauga-deals.vercel.app', '/', undefined) === null);
check('localhost stays put even in production env', canonicalHostRedirect('localhost:3000', '/', PROD) === null);

console.log('\nDegenerate input');
check('null host', canonicalHostRedirect(null, '/', PROD) === null);
check('empty host', canonicalHostRedirect('', '/', PROD) === null);
check('unrelated host', canonicalHostRedirect('evil.example.com', '/', PROD) === null);
check('host that merely CONTAINS vercel.app', canonicalHostRedirect('vercel.app.example.com', '/', PROD) === null);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
