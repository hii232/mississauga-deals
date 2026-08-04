/**
 * Guards the blog SEO overrides.
 *
 *   node lib/blog/seo-overrides.test.mjs
 *
 * The whole point of this file is to stop a title being cut off in the search
 * result - so an override that is ITSELF too long would be worse than useless.
 * These limits are enforced, not suggested.
 */

import {
  BLOG_SEO_OVERRIDES, getBlogSeoOverride, TITLE_MAX, DESCRIPTION_MAX,
} from './seo-overrides.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

const entries = Object.entries(BLOG_SEO_OVERRIDES);
console.log(`\nEvery override fits the SERP (${entries.length} entries)`);
for (const [slug, o] of entries) {
  check(`${slug.slice(0, 44)}… title ${o.title.length} <= ${TITLE_MAX}`,
    o.title.length <= TITLE_MAX, `"${o.title}"`);
  check(`${slug.slice(0, 44)}… desc ${o.description.length} <= ${DESCRIPTION_MAX}`,
    o.description.length <= DESCRIPTION_MAX, `"${o.description}"`);
}

console.log('\nContent rules');
for (const [slug, o] of entries) {
  check(`${slug.slice(0, 30)}… title non-empty and trimmed`,
    o.title.length > 10 && o.title === o.title.trim());
  check(`${slug.slice(0, 30)}… description non-empty and trimmed`,
    o.description.length > 40 && o.description === o.description.trim());
  // No figures: a percentage or dollar amount in a description goes stale the
  // moment the market moves, and Google can keep serving it for months.
  check(`${slug.slice(0, 30)}… description states no figures`,
    !/\d+(\.\d+)?\s*%|\$\s?\d/.test(o.description), o.description);
}

console.log('\nLookup');
check('known slug resolves', getBlogSeoOverride(entries[0][0]) !== null);
check('unknown slug -> null (falls back to the stored title)',
  getBlogSeoOverride('some-post-with-no-override') === null);
check('empty slug safe', getBlogSeoOverride('') === null);
check('undefined safe', getBlogSeoOverride(undefined) === null);

console.log('\nEvery override targets a real measured page');
// Slugs are the exact ones from the 2026-08-03 Search Console export. A typo
// here silently does nothing, which is the failure mode worth catching.
const EXPECTED = [
  'condo-vs-townhouse-in-mississauga-which-is-better-for-cash-flow-in-2026',
  'best-mississauga-neighbourhoods-families-school-quality-2026',
  'is-erin-mills-good-investment-neighbourhood-2026',
  'churchill-meadows-mississauga-investment-guide-2026-analysis',
];
for (const s of EXPECTED) check(`${s.slice(0, 40)}… present`, !!BLOG_SEO_OVERRIDES[s]);
check('no extra unvetted entries', entries.length === EXPECTED.length, `${entries.length}`);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
