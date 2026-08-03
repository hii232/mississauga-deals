/**
 * Tests for the internal-link follow rule.
 *
 *   node lib/seo/internal-link.test.mjs
 */

import { relForInternalHref } from './internal-link.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

console.log('\nFiltered views are nofollowed');
// The seven real links the 2026-08-03 sweep found followed in built HTML.
check('/listings?cf=1&sort=cashflow', relForInternalHref('/listings?cf=1&sort=cashflow') === 'nofollow');
check('/listings?sort=dom', relForInternalHref('/listings?sort=dom') === 'nofollow');
check('/listings?lrt=1', relForInternalHref('/listings?lrt=1') === 'nofollow');
check('/listings?hood=Applewood', relForInternalHref('/listings?hood=Applewood') === 'nofollow');
check('encoded project param',
  relForInternalHref('/pre-construction?project=M6%20Condos%20(M%20City)') === 'nofollow');

console.log('\nReal pages stay followed');
// Getting this wrong is worse than the bug — nofollowing a real page would
// drop it out of the internal link graph entirely.
check('/listings', relForInternalHref('/listings') === undefined);
check('/gta/etobicoke', relForInternalHref('/gta/etobicoke') === undefined);
check('/neighbourhoods/applewood', relForInternalHref('/neighbourhoods/applewood') === undefined);
check('/blog/post-slug', relForInternalHref('/blog/malton-investment-guide-2026') === undefined);
check('root', relForInternalHref('/') === undefined);
check('fragment is not a filtered view', relForInternalHref('/faq#deal-score') === undefined);

console.log('\nEdge cases');
check('external http left alone', relForInternalHref('https://x.com/a?b=1') === undefined);
check('protocol-relative left alone', relForInternalHref('//x.com/a?b=1') === undefined);
check('tel: left alone', relForInternalHref('tel:6476091289') === undefined);
check('mailto: left alone', relForInternalHref('mailto:a@b.com?subject=x') === undefined);
check('empty safe', relForInternalHref('') === undefined);
check('null safe', relForInternalHref(null) === undefined);
check('undefined safe', relForInternalHref(undefined) === undefined);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} — ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
