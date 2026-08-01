/**
 * Idempotency guard for one-off broadcast campaigns — FAIL-CLOSED.
 *
 * History, because it explains the strictness. The original guard was
 * fail-open: if the broadcast_sends table was missing, every route silently
 * skipped the duplicate check and sent anyway — the migration file's own
 * comment said running it "is what actually turns the guard on". The table
 * was never created in Supabase. Result, verified from the approver's inbox
 * on 2026-08-01: campaigns kept re-drafting daily after they had already
 * sent (radar drafts on Jul 27-Aug 1, announcement drafts on Aug 1, both
 * post-send), and approving two drafts of the same campaign mailed the whole
 * database twice.
 *
 * A guard that exists to prevent exactly one catastrophe must not disable
 * itself when its storage is missing. So: the mass-send proceeds ONLY when
 * the lock row was actually written. Any other outcome — missing table, RLS
 * error, network failure, schema-cache miss — blocks the send and tells the
 * approver precisely what to run.
 *
 * Dependency-free so it is unit-testable without booting Next
 * (broadcast-guard.test.mjs exercises every outcome with fake clients).
 */

// Kept in sync with supabase/migrations/create_broadcast_sends.sql. Shown
// verbatim in the draft warning and the refusal page so fixing the missing
// table is a 30-second copy-paste, not an investigation.
export const BROADCAST_SENDS_SQL = `CREATE TABLE IF NOT EXISTS broadcast_sends (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campaign_key TEXT NOT NULL UNIQUE,
  approved_by TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

/**
 * Try to take the one-and-only send lock for a campaign.
 * Outcomes:
 *   'acquired'  — row written; this caller owns the send. Proceed.
 *   'duplicate' — row already exists; the campaign has sent. Do NOT send.
 *   'blocked'   — the lock could not be established at all. Do NOT send;
 *                 `detail` says why (missing table, RLS, outage, …).
 */
export async function acquireSendLock(supabase, campaignKey, approvedBy) {
  let error = null;
  try {
    ({ error } = await supabase
      .from('broadcast_sends')
      .insert({ campaign_key: campaignKey, approved_by: approvedBy }));
  } catch (e) {
    error = { message: String((e && e.message) || e) };
  }
  if (!error) return { outcome: 'acquired' };
  if (error.code === '23505' || /duplicate/i.test(error.message || '')) {
    return { outcome: 'duplicate' };
  }
  return {
    outcome: 'blocked',
    detail: [error.code, error.message].filter(Boolean).join(': ') || 'unknown error',
  };
}

/**
 * Read-only probe used at draft time: has this campaign already sent, and is
 * the guard's storage actually there? `guardReady: false` means the eventual
 * send WILL refuse — the draft surfaces that (with the SQL) so the approver
 * can fix it before clicking rather than after.
 */
export async function probeSendLock(supabase, campaignKey) {
  try {
    const { data, error } = await supabase
      .from('broadcast_sends')
      .select('campaign_key')
      .eq('campaign_key', campaignKey)
      .maybeSingle();
    if (error) {
      return {
        alreadySent: false,
        guardReady: false,
        detail: [error.code, error.message].filter(Boolean).join(': '),
      };
    }
    return { alreadySent: !!data, guardReady: true };
  } catch (e) {
    return { alreadySent: false, guardReady: false, detail: String((e && e.message) || e) };
  }
}
