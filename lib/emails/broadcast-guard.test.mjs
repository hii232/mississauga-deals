/**
 * Tests for the fail-closed broadcast guard.
 *
 *   node lib/emails/broadcast-guard.test.mjs
 *
 * The one behaviour that must never regress: a send proceeds ONLY on
 * 'acquired'. The fail-open version of this logic is how the same campaign
 * reached the whole database twice.
 */

import { acquireSendLock, probeSendLock, BROADCAST_SENDS_SQL } from './broadcast-guard.js';

const insertClient = (result) => ({
  from: () => ({ insert: async () => result }),
});
const throwingInsertClient = (msg) => ({
  from: () => ({ insert: async () => { throw new Error(msg); } }),
});
const probeClient = (result) => ({
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => result }) }),
  }),
});
const throwingProbeClient = (msg) => ({
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => { throw new Error(msg); } }) }),
  }),
});

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

console.log('\nacquireSendLock — send proceeds ONLY on acquired');
const ok = await acquireSendLock(insertClient({ error: null }), 'c1', 'a@b.c');
check('clean insert -> acquired', ok.outcome === 'acquired');

const dupCode = await acquireSendLock(insertClient({ error: { code: '23505', message: 'x' } }), 'c1', 'a@b.c');
check('unique violation by code -> duplicate', dupCode.outcome === 'duplicate');
const dupMsg = await acquireSendLock(insertClient({ error: { message: 'duplicate key value violates unique constraint' } }), 'c1', 'a@b.c');
check('unique violation by message -> duplicate', dupMsg.outcome === 'duplicate');

console.log('\nEvery failure shape blocks — the fail-open bug must stay dead');
const missing = await acquireSendLock(insertClient({ error: { code: '42P01', message: 'relation "broadcast_sends" does not exist' } }), 'c1', 'a@b.c');
check('missing table (42P01) -> blocked', missing.outcome === 'blocked', missing.outcome);
const cacheMiss = await acquireSendLock(insertClient({ error: { code: 'PGRST205', message: "Could not find the table 'public.broadcast_sends' in the schema cache" } }), 'c1', 'a@b.c');
check('PostgREST schema-cache miss -> blocked', cacheMiss.outcome === 'blocked');
const rls = await acquireSendLock(insertClient({ error: { code: '42501', message: 'permission denied' } }), 'c1', 'a@b.c');
check('RLS/permission error -> blocked', rls.outcome === 'blocked');
const thrown = await acquireSendLock(throwingInsertClient('fetch failed'), 'c1', 'a@b.c');
check('client throw (network) -> blocked, not sent', thrown.outcome === 'blocked');
check('blocked carries a human-readable detail', /42P01|relation/.test(missing.detail));

console.log('\nprobeSendLock — draft-time detection');
const sent = await probeSendLock(probeClient({ data: { campaign_key: 'c1' }, error: null }), 'c1');
check('row present -> alreadySent, guardReady', sent.alreadySent === true && sent.guardReady === true);
const fresh = await probeSendLock(probeClient({ data: null, error: null }), 'c1');
check('no row, no error -> not sent, guardReady', fresh.alreadySent === false && fresh.guardReady === true);
const noTable = await probeSendLock(probeClient({ data: null, error: { code: '42P01', message: 'relation does not exist' } }), 'c1');
check('missing table -> guardReady false (draft must warn)', noTable.guardReady === false);
check('missing table is NOT reported as already-sent', noTable.alreadySent === false);
const probeThrow = await probeSendLock(throwingProbeClient('boom'), 'c1');
check('probe throw -> guardReady false', probeThrow.guardReady === false);

console.log('\nThe SQL handed to the approver');
check('creates the right table', /CREATE TABLE IF NOT EXISTS broadcast_sends/.test(BROADCAST_SENDS_SQL));
check('with the UNIQUE campaign_key the guard depends on', /campaign_key TEXT NOT NULL UNIQUE/.test(BROADCAST_SENDS_SQL));

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} — ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
