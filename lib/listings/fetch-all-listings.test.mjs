/**
 * Tests for fetchAllListings's retry pass and coverage diagnostics.
 *
 *   node lib/listings/fetch-all-listings.test.mjs
 *
 * Production has shown 10/24 extra pages failing on a single run - the daily
 * alert pool and the weekly newsletter pool both quietly matched against
 * ~60% of active inventory, with nothing but a console.error to say so. This
 * exercises the retry pass that recovers throttled pages and the coverage
 * fields (pagesMissed/fill) a caller can now check instead of trusting
 * rows.length at face value.
 *
 * fetch and sleep are injected (same pattern as send-bulk.test.mjs), so no
 * real network call happens and no test actually waits out the retry delay.
 */

import { fetchAllListings } from './fetch-all-listings.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

const row = (id) => ({ id });
const okResponse = (data) => ({
  ok: true,
  status: 200,
  headers: { get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null) },
  json: async () => data,
});
const badResponse = (status = 500) => ({
  ok: false,
  status,
  headers: { get: () => 'application/json' },
  json: async () => ({}),
});

/** pageData: { [page]: {listings, pages, total} }. failFirstCallFor: Set of pages that fail once then succeed. */
function makeFetch({ pageData, failFirstCallFor = new Set(), alwaysFail = new Set() }) {
  const calls = new Map();
  return async (url) => {
    const page = Number(new URL(url).searchParams.get('page'));
    const n = (calls.get(page) || 0) + 1;
    calls.set(page, n);
    if (alwaysFail.has(page)) return badResponse();
    if (failFirstCallFor.has(page) && n === 1) return badResponse();
    const data = pageData[page];
    return data ? okResponse(data) : badResponse(404);
  };
}
function fakeSleep() {
  let calls = 0;
  const sleep = async () => { calls++; };
  return { sleep, calls: () => calls };
}

console.log('\nSingle page - no fan-out, no retry needed');
{
  const fetchImpl = makeFetch({ pageData: { 1: { listings: [row(1), row(2)], pages: 1, total: 2 } } });
  const s = fakeSleep();
  const r = await fetchAllListings('https://x', '/api/listings', { fetchImpl, sleep: s.sleep });
  check('all rows returned', r.listings.length === 2);
  check('pagesFetched 1', r.pagesFetched === 1);
  check('pagesMissed 0', r.pagesMissed === 0);
  check('fill is 1.0', r.fill === 1, r.fill);
  check('no retry sleep fired', s.calls() === 0);
}

console.log('\nMulti-page, everything healthy');
{
  const pageData = {
    1: { listings: [row(1), row(2)], pages: 3, total: 5 },
    2: { listings: [row(3), row(4)] },
    3: { listings: [row(5)] },
  };
  const fetchImpl = makeFetch({ pageData });
  const s = fakeSleep();
  const r = await fetchAllListings('https://x', '/api/listings', { fetchImpl, sleep: s.sleep });
  check('all 5 rows, in page order', r.listings.map((l) => l.id).join(',') === '1,2,3,4,5');
  check('pagesMissed 0', r.pagesMissed === 0);
  check('fill 1.0', r.fill === 1);
  check('no retry needed', s.calls() === 0);
}

console.log('\nA throttled page recovers on the one retry pass');
{
  const pageData = {
    1: { listings: [row(1)], pages: 3, total: 3 },
    2: { listings: [row(2)] },
    3: { listings: [row(3)] },
  };
  const fetchImpl = makeFetch({ pageData, failFirstCallFor: new Set([2]) });
  const s = fakeSleep();
  const r = await fetchAllListings('https://x', '/api/listings', { fetchImpl, sleep: s.sleep });
  check('recovered page is included', r.listings.some((l) => l.id === 2));
  check('order preserved even though page 2 filled in late', r.listings.map((l) => l.id).join(',') === '1,2,3');
  check('pagesMissed 0 after recovery', r.pagesMissed === 0);
  check('fill back to 1.0', r.fill === 1);
  check('retry pass paused once before retrying', s.calls() === 1);
}

console.log('\nA page that never recovers stays out, and is reported honestly');
{
  const pageData = {
    1: { listings: [row(1)], pages: 3, total: 30 }, // total says 30 - the feed, not just this walk's rows
    2: { listings: [row(2)] },
  };
  const fetchImpl = makeFetch({ pageData, alwaysFail: new Set([3]) });
  const s = fakeSleep();
  const r = await fetchAllListings('https://x', '/api/listings', { fetchImpl, sleep: s.sleep });
  check('the two good pages still return', r.listings.length === 2);
  check('pagesMissed reflects the permanent failure', r.pagesMissed === 1, r.pagesMissed);
  check('fill reflects real coverage, not 1.0', r.fill === Math.round((2 / 30) * 1000) / 1000, r.fill);
  check('retried exactly once (bounded, not looped)', s.calls() === 1);
}

console.log('\nfill is null (not a false 1.0) when the feed reports no total');
{
  const pageData = { 1: { listings: [row(1)], pages: 1 } }; // no `total` field
  const fetchImpl = makeFetch({ pageData });
  const r = await fetchAllListings('https://x', '/api/listings', { fetchImpl, sleep: async () => {} });
  check('total falls back to rows.length', r.total === 1);
  check('fill is null, not a misleadingly-perfect 1.0', r.fill === null, r.fill);
}

console.log('\nFailure modes still fail loudly (page-1 contract unchanged)');
{
  const fetchImpl = async () => badResponse(503);
  let threw = false;
  try {
    await fetchAllListings('https://x', '/api/listings', { fetchImpl, sleep: async () => {} });
  } catch (e) { threw = true; check('error names the HTTP status', e.message.includes('503'), e.message); }
  check('page 1 failure throws (never emails from an empty pool)', threw);
}
{
  const fetchImpl = async () => ({
    ok: true, status: 200,
    headers: { get: () => 'text/html' },
    json: async () => ({}),
  });
  let threw = false;
  try {
    await fetchAllListings('https://x', '/api/listings', { fetchImpl, sleep: async () => {} });
  } catch (e) { threw = true; check('error names the bad content-type', e.message.includes('text/html'), e.message); }
  check('non-JSON page 1 throws (deployment-protection auth wall, not data)', threw);
}

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
