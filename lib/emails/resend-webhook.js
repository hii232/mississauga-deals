import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Resend webhook verification + event normalisation.
 *
 * Resend signs webhooks with Svix. Three headers arrive with every delivery:
 *
 *   svix-id         unique delivery id — ALSO our idempotency key, because
 *                   Svix retries on any non-2xx and a retried "opened" event
 *                   must not count twice
 *   svix-timestamp  unix seconds, used to reject replays
 *   svix-signature  space-delimited "v1,<base64>" entries (there can be more
 *                   than one during a secret rotation — ANY match is valid)
 *
 * Signed content is `${id}.${timestamp}.${rawBody}`, HMAC-SHA256 with the
 * base64-decoded secret (everything after the `whsec_` prefix), base64 encoded.
 *
 * This endpoint is PUBLIC — it must be, Resend calls it — so the signature is
 * the only thing standing between the internet and forged campaign analytics.
 * Verification is therefore fail-closed: no secret configured, malformed
 * header, stale timestamp or bad signature all reject. Comparison is
 * constant-time.
 *
 * Dependency-free (node crypto only) so it is unit-testable without booting
 * Next — see resend-webhook.test.mjs.
 */

// Reject anything older than this. Svix's own recommendation; bounds how long
// a captured-and-replayed delivery stays useful to an attacker.
const TOLERANCE_SECONDS = 5 * 60;

/**
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
export function verifyResendSignature({ secret, id, timestamp, signature, body, nowSeconds }) {
  if (!secret) return { ok: false, reason: 'RESEND_WEBHOOK_SECRET not configured' };
  if (!id || !timestamp || !signature) return { ok: false, reason: 'missing svix headers' };
  if (typeof body !== 'string') return { ok: false, reason: 'body must be the RAW request text' };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'invalid svix-timestamp' };
  const now = Number.isFinite(nowSeconds) ? nowSeconds : Math.floor(Date.now() / 1000);
  const drift = Math.abs(now - ts);
  if (drift > TOLERANCE_SECONDS) return { ok: false, reason: `timestamp outside tolerance (${drift}s)` };

  // whsec_<base64>. Tolerate a secret pasted without the prefix.
  const raw = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  let key;
  try {
    key = Buffer.from(raw, 'base64');
  } catch {
    return { ok: false, reason: 'secret is not valid base64' };
  }
  if (!key.length) return { ok: false, reason: 'secret decoded to empty' };

  const expected = createHmac('sha256', key)
    .update(`${id}.${timestamp}.${body}`)
    .digest();

  // "v1,<sig> v1,<sig2>" — any version-1 entry matching is enough.
  const candidates = String(signature)
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.startsWith('v1,'))
    .map((part) => part.slice(3));
  if (!candidates.length) return { ok: false, reason: 'no v1 signature present' };

  for (const cand of candidates) {
    let buf;
    try {
      buf = Buffer.from(cand, 'base64');
    } catch {
      continue;
    }
    // timingSafeEqual throws on length mismatch — check first, and keep the
    // comparison itself constant-time.
    if (buf.length === expected.length && timingSafeEqual(buf, expected)) {
      return { ok: true };
    }
  }
  return { ok: false, reason: 'signature mismatch' };
}

// Event types we store. Anything else is acknowledged (so Svix stops retrying)
// but not recorded.
export const TRACKED_TYPES = new Set([
  'email.sent',
  'email.delivered',
  'email.delivery_delayed',
  'email.opened',
  'email.clicked',
  'email.bounced',
  'email.complained',
]);

/**
 * Flatten a Resend webhook payload into the row we store.
 * Returns null when the event isn't one we track.
 *
 * Campaign attribution comes from the `campaign` TAG set at send time, not
 * from parsing the subject — subjects are generated from live listing data and
 * change between editions, so they are not a stable key.
 */
export function normalizeEvent(payload, svixId) {
  const type = payload?.type;
  if (!type || !TRACKED_TYPES.has(type)) return null;

  const d = payload.data || {};
  const tags = Array.isArray(d.tags) ? d.tags : [];
  const tagFor = (name) => {
    const hit = tags.find((t) => t && t.name === name);
    return hit ? String(hit.value) : null;
  };

  // `to` is an array in Resend's payload; these are single-recipient sends.
  const recipient = Array.isArray(d.to) ? d.to[0] : (typeof d.to === 'string' ? d.to : null);

  return {
    event_id: svixId,
    type,
    email_id: d.email_id || null,
    campaign: tagFor('campaign'),
    recipient: recipient ? String(recipient).toLowerCase() : null,
    subject: d.subject || null,
    link: d.click?.link || null,
    occurred_at: payload.created_at || d.created_at || null,
  };
}

/**
 * Roll raw events into the numbers a campaign report shows.
 *
 * Deliberate choices, because email metrics are easy to flatter:
 *  - Rates are computed against DELIVERED, not sent. Quoting an open rate over
 *    "sent" silently counts bounces as people who could have opened.
 *  - UNIQUE people are the headline; total events are kept alongside so a
 *    single obsessive re-opener can't look like engagement.
 *  - Opens are reported but flagged: Apple Mail Privacy Protection pre-fetches
 *    images for Apple Mail users, registering an "open" nobody performed.
 *    Clicks are the honest engagement signal, which is why they lead.
 */
export function summarize(events) {
  const byType = {};
  const uniq = {};
  for (const t of TRACKED_TYPES) { byType[t] = 0; uniq[t] = new Set(); }

  const people = new Map();
  const links = new Map();

  for (const e of events || []) {
    if (!byType[e.type] && byType[e.type] !== 0) continue;
    byType[e.type] += 1;
    if (e.recipient) uniq[e.type].add(e.recipient);

    if (e.type === 'email.clicked' && e.link) {
      links.set(e.link, (links.get(e.link) || 0) + 1);
    }

    if (!e.recipient) continue;
    const p = people.get(e.recipient) || {
      email: e.recipient, opens: 0, clicks: 0, delivered: false,
      bounced: false, complained: false, links: new Set(), lastAt: null,
    };
    if (e.type === 'email.opened') p.opens += 1;
    if (e.type === 'email.clicked') { p.clicks += 1; if (e.link) p.links.add(e.link); }
    if (e.type === 'email.delivered') p.delivered = true;
    if (e.type === 'email.bounced') p.bounced = true;
    if (e.type === 'email.complained') p.complained = true;
    if (e.occurred_at && (!p.lastAt || e.occurred_at > p.lastAt)) p.lastAt = e.occurred_at;
    people.set(e.recipient, p);
  }

  const delivered = uniq['email.delivered'].size;
  const pct = (n) => (delivered > 0 ? Math.round((n / delivered) * 1000) / 10 : null);

  // The follow-up list: clicked first (real intent), then repeat openers.
  const engaged = [...people.values()]
    .filter((p) => p.clicks > 0 || p.opens > 0)
    .map((p) => ({ ...p, links: [...p.links] }))
    .sort((a, b) => (b.clicks - a.clicks) || (b.opens - a.opens));

  return {
    sent: uniq['email.sent'].size,
    delivered,
    bounced: uniq['email.bounced'].size,
    complained: uniq['email.complained'].size,
    delayed: uniq['email.delivery_delayed'].size,
    openedUnique: uniq['email.opened'].size,
    openedTotal: byType['email.opened'],
    clickedUnique: uniq['email.clicked'].size,
    clickedTotal: byType['email.clicked'],
    openRate: pct(uniq['email.opened'].size),
    clickRate: pct(uniq['email.clicked'].size),
    bounceRate: pct(uniq['email.bounced'].size),
    topLinks: [...links.entries()]
      .map(([link, count]) => ({ link, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    engaged,
  };
}
