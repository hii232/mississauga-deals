/**
 * Paced, rate-limit-aware bulk sender for the broadcast campaigns.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every broadcast route had the same three defects, and together they lost
 * most of an audience silently:
 *
 *   1. NO PACING. `for (i += 10) { await Promise.allSettled(batch) }` fires ten
 *      concurrent Resend calls with zero delay between batches. Resend's
 *      default limit is a small number of requests per second, so most of a
 *      484-recipient run is refused with 429.
 *   2. FAILURES WERE INVISIBLE. `sendEmail` ended `return res.ok`, discarding
 *      the status and body. A 429 storm and a genuine outage looked identical:
 *      a number that was simply lower than expected, with nothing in the logs.
 *   3. NO TIME BUDGET. A run that could not finish was killed mid-flight by the
 *      function timeout - the announcement route caps at 60s - leaving no
 *      record of how far it got, so the remainder could never be resumed.
 *
 * This module fixes all three and is dependency-injected (fetch/sleep/now) so
 * the pacing, retry and budget logic are unit-testable without a network.
 *
 * SELF-TUNING, ON PURPOSE. The exact per-second limit differs by Resend plan
 * and is not knowable from here, so nothing hardcodes it: the sender starts at
 * `ratePerSec`, and every 429 honours the server's own `Retry-After` and backs
 * the rate off. Whatever the real ceiling is, it converges on it.
 */

// Start optimistic and let 429s pull it down - the ceiling differs by Resend
// plan and is not knowable from here. Too low is as harmful as too high: at
// 2/sec a 484-recipient campaign needs 242s, which does not fit the function.
// RESEND_RATE_PER_SEC overrides it if the real limit is ever confirmed.
export const DEFAULT_RATE_PER_SEC = Number(process.env.RESEND_RATE_PER_SEC) > 0
  ? Number(process.env.RESEND_RATE_PER_SEC)
  : 8;
export const MAX_ATTEMPTS = 4;

const sleepReal = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Parse Retry-After, which may be seconds ("2") or an HTTP date. Returns ms,
 * or null when absent/unparseable so the caller falls back to its own backoff.
 */
export function retryAfterMs(header, nowMs) {
  if (!header) return null;
  const s = String(header).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(parseFloat(s) * 1000);
  const t = Date.parse(s);
  if (Number.isFinite(t)) return Math.max(0, t - nowMs);
  return null;
}

/**
 * @param {object} o
 * @param {Array<{email:string,name:string}>} o.recipients
 * @param {(r:{email:string,name:string}) => Promise<{ok:boolean,status:number,retryAfter?:string,body?:string}>} o.sendOne
 *   Must NOT throw for an HTTP failure - report it. A thrown error is caught
 *   and recorded as status 0.
 * @param {number} [o.ratePerSec]
 * @param {number} [o.budgetMs] stop starting new sends past this elapsed time
 * @param {function} [o.sleep] injected for tests
 * @param {function} [o.now] injected for tests
 * @param {function} [o.onProgress]
 * @returns {Promise<{sent:number,failed:number,remaining:Array,reasons:Object,rateEnded:number,elapsedMs:number,timedOut:boolean}>}
 */
export async function sendBulk({
  recipients,
  sendOne,
  ratePerSec = DEFAULT_RATE_PER_SEC,
  budgetMs = 240000,
  sleep = sleepReal,
  now = () => Date.now(),
  onProgress,
}) {
  const list = Array.isArray(recipients) ? recipients : [];
  const start = now();
  let rate = Math.max(0.25, ratePerSec);
  let sent = 0;
  let failed = 0;
  const reasons = {};
  const note = (status, body) => {
    const key = String(status);
    if (!reasons[key]) reasons[key] = { count: 0, sample: (body || '').slice(0, 200) };
    reasons[key].count += 1;
  };

  for (let i = 0; i < list.length; i++) {
    // Budget check BEFORE starting a send, so the remainder is exact and
    // resumable rather than "somewhere around here".
    if (now() - start >= budgetMs) {
      return {
        sent, failed, remaining: list.slice(i), reasons,
        rateEnded: rate, elapsedMs: now() - start, timedOut: true,
      };
    }

    const r = list[i];
    let delivered = false;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let res;
      try {
        res = await sendOne(r);
      } catch (e) {
        res = { ok: false, status: 0, body: String(e && e.message ? e.message : e) };
      }

      if (res && res.ok) { delivered = true; break; }

      const status = (res && res.status) || 0;

      // 429 is the one worth waiting out - it means "you are going too fast",
      // not "this will never work". Everything else is recorded and skipped:
      // retrying a 422 bad-address 4 times just burns the time budget.
      if (status === 429) {
        rate = Math.max(0.25, rate / 2); // back off for the REST of the run too
        const wait = retryAfterMs(res.retryAfter, now()) ?? Math.min(8000, 500 * 2 ** attempt);
        if (attempt === MAX_ATTEMPTS) { note(status, res.body); break; }
        await sleep(wait);
        continue;
      }

      note(status, res && res.body);
      break;
    }

    if (delivered) sent++; else failed++;
    if (onProgress) onProgress({ index: i + 1, total: list.length, sent, failed });

    // Pace the NEXT send. Skipped after the last one so a run never sleeps for
    // no reason.
    if (i < list.length - 1) await sleep(Math.ceil(1000 / rate));
  }

  return {
    sent, failed, remaining: [], reasons,
    rateEnded: rate, elapsedMs: now() - start, timedOut: false,
  };
}

/** One-line human summary for the "Sent" page and the server log. */
export function summarizeBulk(result) {
  const bits = [`${result.sent} sent`];
  if (result.failed) bits.push(`${result.failed} failed`);
  if (result.remaining.length) bits.push(`${result.remaining.length} not attempted (ran out of time)`);
  const why = Object.entries(result.reasons || {})
    .sort((a, b) => b[1].count - a[1].count)
    .map(([status, v]) => `HTTP ${status} x${v.count}${v.sample ? ` - ${v.sample}` : ''}`);
  return bits.join(', ') + (why.length ? ` | ${why.join('; ')}` : '');
}
