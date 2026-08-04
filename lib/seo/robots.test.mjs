/**
 * Guards public/robots.txt.
 *
 *   node lib/seo/robots.test.mjs
 *
 * This file has already shipped the bug it exists to prevent. Per the robots.txt
 * spec a crawler obeys ONLY its most specific matching group, so a named
 * `User-agent: Googlebot` group silently cancels every rule in the `User-agent:
 * *` group for the one bot whose opinion decides whether this business gets
 * traffic. It happened once (see the file's header comment) and the 2026-08-04
 * change added nineteen named groups, which is nineteen new chances to do it
 * again by pasting one in the wrong place.
 *
 * The invariant that makes named groups safe: EVERY named group is a full
 * `Disallow: /`. A named group that grants anything is the bug.
 */

import { readFileSync } from 'node:fs';
import { DISALLOWED_CRAWLERS, ALLOWED_CRAWLERS } from './crawlers.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

const raw = readFileSync(new URL('../../public/robots.txt', import.meta.url), 'utf8');

// Parse into groups. Consecutive User-agent lines share one rule block.
const groups = [];
let current = null;
for (const line of raw.split('\n')) {
  const text = line.replace(/#.*$/, '').trim();
  if (!text) continue;
  const [rawKey, ...rest] = text.split(':');
  const key = rawKey.trim().toLowerCase();
  const value = rest.join(':').trim();
  if (key === 'user-agent') {
    if (!current || current.rules.length > 0) { current = { agents: [], rules: [] }; groups.push(current); }
    current.agents.push(value);
  } else if (key === 'allow' || key === 'disallow') {
    if (current) current.rules.push({ type: key, path: value });
  }
}

console.log(`\nParsed ${groups.length} groups`);
check('parsed at least the wildcard group plus the named blocks', groups.length >= 2, String(groups.length));

const named = groups.filter((g) => !g.agents.includes('*'));
const wildcard = groups.find((g) => g.agents.includes('*'));

console.log('\nThe wildcard group is intact');
check('a User-agent: * group exists', !!wildcard);
check('* allows the site root', wildcard.rules.some((r) => r.type === 'allow' && r.path === '/'));
check('* blocks /admin/', wildcard.rules.some((r) => r.type === 'disallow' && r.path === '/admin/'));
check('* blocks /api/', wildcard.rules.some((r) => r.type === 'disallow' && r.path === '/api/'));
check('* still carves out /api/blog-cover (Article JSON-LD image)',
  wildcard.rules.some((r) => r.type === 'allow' && r.path === '/api/blog-cover'));
check('* still carves out /_next/static/ (CSS/JS — unstyled renders hurt indexing)',
  wildcard.rules.some((r) => r.type === 'allow' && r.path === '/_next/static/'));
check('* still carves out /_next/image', wildcard.rules.some((r) => r.type === 'allow' && r.path === '/_next/image'));

console.log('\nTHE INVARIANT: every named group is a full block, never a grant');
for (const g of named) {
  const agents = g.agents.join(',');
  check(`${agents} — is exactly one Disallow: /`,
    g.rules.length === 1 && g.rules[0].type === 'disallow' && g.rules[0].path === '/',
    JSON.stringify(g.rules));
  check(`${agents} — grants nothing (an Allow here would cancel the * rules)`,
    !g.rules.some((r) => r.type === 'allow'), JSON.stringify(g.rules));
}

console.log('\nNo crawler we depend on has a named group');
// The whole disaster scenario in one assertion.
const namedAgents = named.flatMap((g) => g.agents.map((a) => a.toLowerCase()));
for (const good of ALLOWED_CRAWLERS) {
  check(`${good} has NO named group`, !namedAgents.includes(good.toLowerCase()), String(namedAgents));
}

console.log('\nrobots.txt and the classifier agree on who is blocked');
// If these drift, the "disallowed=true" label in the logs stops meaning
// "robots.txt told it to go away", and the ignoring-robots.txt signal is lost.
for (const bad of DISALLOWED_CRAWLERS) {
  check(`${bad} is blocked in robots.txt`, namedAgents.includes(bad.toLowerCase()));
}
for (const agent of namedAgents) {
  check(`${agent} is in DISALLOWED_CRAWLERS`,
    DISALLOWED_CRAWLERS.some((d) => d.toLowerCase() === agent));
}

console.log('\nSitemaps still declared');
check('sitemap.xml declared', /^Sitemap:\s*https:\/\/www\.mississaugainvestor\.ca\/sitemap\.xml$/m.test(raw));
check('image-sitemap.xml declared', /^Sitemap:\s*https:\/\/www\.mississaugainvestor\.ca\/image-sitemap\.xml$/m.test(raw));

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} — ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
