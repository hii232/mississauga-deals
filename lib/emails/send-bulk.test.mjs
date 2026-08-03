/**
 * Tests for the paced bulk sender.
 *
 *   node lib/emails/send-bulk.test.mjs
 *
 * This code stands between a campaign and ~480 real inboxes. The bug it exists
 * to fix — 10 concurrent sends with no pacing, failures discarded via
 * `return res.ok` — silently delivered a fraction of an audience with nothing
 * in the logs to say so.
 *
 * Time is injected, so the pacing and budget behaviour is asserted exactly
 * rather than slept through.
 */

import { sendBulk, retryAfterMs, summarizeBulk, MAX_ATTEMPTS } from './send-bulk.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

/** Fake clock: sleep advances virtual time instantly. */
function clock() {
  let t = 0;
  return { now: () => t, sleep: async (ms) => { t += ms; }, advance: (ms) => { t += ms; } };
}
const people = (n) => Array.from({ length: n }, (_, i) => ({ email: `u${i}@x.com`, name: '' }));

console.log('\nretryAfterMs');
check('numeric seconds', retryAfterMs('2', 0) === 2000);
check('fractional seconds', retryAfterMs('0.5', 0) === 500);
check('HTTP date', retryAfterMs(new Date(10000).toUTCString(), 0) === 10000);
check('absent -> null', retryAfterMs(null, 0) === null);
check('garbage -> null', retryAfterMs('soon', 0) === null);
check('past date never negative', retryAfterMs(new Date(0).toUTCString(), 60000) === 0);

console.log('\nHappy path');
{
  const c = clock();
  const r = await sendBulk({
    recipients: people(5),
    sendOne: async () => ({ ok: true, status: 200 }),
    sleep: c.sleep, now: c.now, ratePerSec: 2,
  });
  check('all sent', r.sent === 5 && r.failed === 0);
  check('nothing left over', r.remaining.length === 0 && !r.timedOut);
  // 4 gaps at 2/sec = 2000ms; the last send is not followed by a sleep.
  check('paced, no trailing sleep', r.elapsedMs === 2000, `got ${r.elapsedMs}`);
}

console.log('\n429 — the bug that lost the audience');
{
  const c = clock();
  let calls = 0;
  const r = await sendBulk({
    recipients: people(3),
    sendOne: async () => {
      calls++;
      // Every 2nd call is refused once, then succeeds on retry.
      return calls % 2 === 0 ? { ok: false, status: 429, retryAfter: '1' } : { ok: true, status: 200 };
    },
    sleep: c.sleep, now: c.now, ratePerSec: 2,
  });
  check('429s are retried, not dropped', r.sent === 3, `sent ${r.sent}, failed ${r.failed}`);
  check('rate backed off below start', r.rateEnded < 2, `rate ${r.rateEnded}`);
}
{
  const c = clock();
  const r = await sendBulk({
    recipients: people(2),
    sendOne: async () => ({ ok: false, status: 429, retryAfter: '1', body: 'Too many requests' }),
    sleep: c.sleep, now: c.now, ratePerSec: 2, budgetMs: 10 ** 9,
  });
  check('permanent 429 eventually gives up', r.failed === 2 && r.sent === 0);
  check('reason recorded (was silently swallowed)', r.reasons['429']?.count === 2, JSON.stringify(r.reasons));
  check('retried MAX_ATTEMPTS times', MAX_ATTEMPTS === 4);
}

console.log('\nNon-429 failures are NOT retried (they would burn the budget)');
{
  const c = clock();
  let calls = 0;
  const r = await sendBulk({
    recipients: people(3),
    sendOne: async () => { calls++; return { ok: false, status: 422, body: 'Invalid `to` field' }; },
    sleep: c.sleep, now: c.now, ratePerSec: 2,
  });
  check('one attempt each', calls === 3, `calls ${calls}`);
  check('all counted failed', r.failed === 3);
  check('reason + sample captured', r.reasons['422']?.sample.includes('Invalid'), JSON.stringify(r.reasons));
}

console.log('\nThrown errors are recorded, never crash the run');
{
  const c = clock();
  const r = await sendBulk({
    recipients: people(2),
    sendOne: async () => { throw new Error('socket hang up'); },
    sleep: c.sleep, now: c.now, ratePerSec: 2,
  });
  check('run completes', r.sent === 0 && r.failed === 2);
  check('recorded as status 0', r.reasons['0']?.sample.includes('socket hang up'));
}

console.log('\nTime budget — the remainder must be exact and resumable');
{
  const c = clock();
  const r = await sendBulk({
    recipients: people(100),
    sendOne: async () => ({ ok: true, status: 200 }),
    sleep: c.sleep, now: c.now, ratePerSec: 2,
    ratePerSec: 2, budgetMs: 5000,
  });
  check('stopped at the budget', r.timedOut === true);
  check('sent + remaining accounts for EVERY recipient',
    r.sent + r.failed + r.remaining.length === 100,
    `${r.sent}+${r.failed}+${r.remaining.length}`);
  check('remainder is the untouched tail', r.remaining[0].email === `u${r.sent + r.failed}@x.com`);
  // At 2/sec sends fire at t=0,500,…,4500 (ten of them); the eleventh is
  // refused because the budget check runs BEFORE the send, not after.
  check('exact count, no double-send', r.sent === 10, `sent ${r.sent}`);
}

console.log('\nsummarizeBulk — what the operator actually reads');
{
  const s = summarizeBulk({ sent: 140, failed: 344, remaining: [], reasons: { 429: { count: 344, sample: 'Too many requests' } } });
  check('states sent and failed', s.includes('140 sent') && s.includes('344 failed'), s);
  check('names the cause', s.includes('HTTP 429') && s.includes('Too many requests'), s);
  const s2 = summarizeBulk({ sent: 10, failed: 0, remaining: people(5), reasons: {} });
  check('flags the unattempted tail', s2.includes('5 not attempted'), s2);
}

console.log('\nEdge cases');
{
  const c = clock();
  const r = await sendBulk({ recipients: [], sendOne: async () => ({ ok: true, status: 200 }), sleep: c.sleep, now: c.now, ratePerSec: 2 });
  check('empty list is a no-op', r.sent === 0 && r.failed === 0 && !r.timedOut);
  const r2 = await sendBulk({ recipients: null, sendOne: async () => ({ ok: true, status: 200 }), sleep: c.sleep, now: c.now, ratePerSec: 2 });
  check('null list safe', r2.sent === 0);
}

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} — ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
