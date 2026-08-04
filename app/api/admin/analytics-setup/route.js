import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BROADCAST_SENDS_SQL } from '@/lib/emails/broadcast-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

function checkAuth(request) {
  const key = request.headers.get('x-admin-key');
  return key && key === process.env.ADMIN_SECRET;
}

// Kept next to the migration file it mirrors. Surfaced through the API so the
// admin panel can offer a copy button instead of asking Hamza to find a file
// in the repo on his phone.
export const EMAIL_EVENTS_SQL = `CREATE TABLE IF NOT EXISTS email_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  email_id TEXT,
  campaign TEXT,
  recipient TEXT,
  subject TEXT,
  link TEXT,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_events_campaign_idx ON email_events (campaign);
CREATE INDEX IF NOT EXISTS email_events_recipient_idx ON email_events (recipient);
CREATE INDEX IF NOT EXISTS email_events_type_idx ON email_events (type);
CREATE INDEX IF NOT EXISTS email_events_occurred_idx ON email_events (occurred_at DESC);`;


// The deal-alert repeat-send guard. NOT analytics - an ACTIVE defect: while
// this table is absent the daily alert route logs "repeat-send guard
// unavailable" and sends anyway, so the DOM<=3 "new listing" window lets the
// same property headline a subscriber's alert up to four days running. That is
// the one thing the alert product must never do.
//
// Differs from supabase/migrations/create_alert_sent_listings.sql in one way,
// deliberately: that file ends with a bare CREATE POLICY, and Postgres has no
// CREATE POLICY IF NOT EXISTS - so re-running it errors on an existing policy.
// DROP POLICY IF EXISTS first makes this safe to paste twice, which matters
// when it's being pasted on a phone.
export const ALERT_SENT_LISTINGS_SQL = `CREATE TABLE IF NOT EXISTS alert_sent_listings (
  email TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (email, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_alert_sent_listings_sent_at
  ON alert_sent_listings (sent_at);
ALTER TABLE alert_sent_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on alert_sent_listings" ON alert_sent_listings;
CREATE POLICY "Service role full access on alert_sent_listings"
  ON alert_sent_listings FOR ALL USING (true) WITH CHECK (true);`;

const SITE = 'https://www.mississaugainvestor.ca';

function sendingDomain() {
  const from = process.env.RESEND_FROM_EMAIL || '';
  return from.match(/@([^\s>]+)/)?.[1] || 'mississaugainvestor.ca';
}

/** Does a Supabase table exist and can we read it? */
async function tableStatus(name) {
  if (!supabase) return { ok: false, detail: 'Supabase not configured' };
  const { error, count } = await supabase
    .from(name)
    .select('*', { count: 'exact', head: true });
  if (error) {
    const missing = error.code === '42P01' || error.code === 'PGRST205'
      || /does not exist|schema cache/i.test(error.message || '');
    return { ok: false, missing, detail: error.message };
  }
  return { ok: true, rows: count ?? 0 };
}

/**
 * Read the domain's tracking flags from Resend.
 *
 * The field names differ between Resend's list and detail shapes depending on
 * API version, so accept either spelling rather than reporting "off" for a
 * setting that is actually on - a false "off" here would send Hamza to toggle
 * something that's already correct.
 */
function readTracking(d) {
  const open = d?.open_tracking ?? d?.openTracking ?? null;
  const click = d?.click_tracking ?? d?.clickTracking ?? null;
  return { open, click };
}

async function resendDomain() {
  if (!process.env.RESEND_API_KEY) return { ok: false, detail: 'RESEND_API_KEY not set' };
  const want = sendingDomain();
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      cache: 'no-store',
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, detail: `Resend returned ${res.status}: ${JSON.stringify(body)?.slice(0, 200)}` };
    const list = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
    const match = list.find((d) => d?.name === want) || list[0] || null;
    if (!match) return { ok: false, detail: `No domain found in Resend matching ${want}` };

    // The LIST response is a summary (id / name / status) and does not carry
    // the tracking flags - reading them from here yielded null, which this
    // route then honestly reported as "unknown" even after a PATCH that Resend
    // had accepted. The flags live on the per-domain DETAIL endpoint, so fetch
    // that and prefer it; fall back to whatever the list gave if the detail
    // call fails, and keep reporting "unknown" rather than guessing if both
    // come back empty.
    let tracking = readTracking(match);
    let source = 'list';
    try {
      const dRes = await fetch(`https://api.resend.com/domains/${match.id}`, {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        cache: 'no-store',
      });
      if (dRes.ok) {
        const dBody = await dRes.json().catch(() => null);
        const detail = dBody?.data || dBody;
        const t = readTracking(detail);
        if (t.open !== null || t.click !== null) { tracking = t; source = 'detail'; }
      }
    } catch {
      // Detail lookup is best-effort - the list values (or nulls) stand.
    }
    return { ok: true, id: match.id, name: match.name, status: match.status, source, ...tracking };
  } catch (e) {
    return { ok: false, detail: String(e?.message || e) };
  }
}

export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [events, sends, alerts, domain] = await Promise.all([
    tableStatus('email_events'),
    tableStatus('broadcast_sends'),
    tableStatus('alert_sent_listings'),
    resendDomain(),
  ]);

  const steps = [
    {
      key: 'alert_sent_listings',
      title: 'Deal-alert repeat guard',
      done: alerts.ok,
      manual: true,
      // Flagged as a live defect rather than a pending setup step: alerts are
      // going out right now without it.
      defect: !alerts.ok,
      how: 'Supabase → SQL Editor → paste & Run',
      sql: ALERT_SENT_LISTINGS_SQL,
      detail: alerts.ok
        ? 'active - subscribers will not be re-sent the same listing'
        : 'MISSING - daily alerts are sending with no repeat-send guard, so the same listing can headline a subscriber\u2019s alert up to 4 days running',
    },
    {
      key: 'email_events',
      title: 'Analytics table',
      done: events.ok,
      // The only step that still needs a human: DDL cannot be run through the
      // Supabase client key this app holds.
      manual: true,
      how: 'Supabase → SQL Editor → paste & Run',
      sql: EMAIL_EVENTS_SQL,
      detail: events.ok ? `${events.rows} events stored` : (events.detail || 'not created yet'),
    },
    {
      key: 'webhook_secret',
      title: 'Webhook connected',
      done: !!process.env.RESEND_WEBHOOK_SECRET,
      manual: true,
      how: 'Resend → Webhooks → add the URL, then put its signing secret in Vercel as RESEND_WEBHOOK_SECRET',
      url: `${SITE}/api/webhooks/resend`,
      envVar: 'RESEND_WEBHOOK_SECRET',
      detail: process.env.RESEND_WEBHOOK_SECRET
        ? 'secret is set'
        : 'RESEND_WEBHOOK_SECRET not set - the endpoint rejects everything until it is',
    },
    {
      key: 'tracking',
      title: 'Open & click tracking',
      // Unknown (null) is NOT done - never claim a setting is on when the API
      // didn't say so.
      done: domain.ok && domain.open === true && domain.click === true,
      manual: false,
      automatable: domain.ok,
      detail: !domain.ok
        ? (domain.detail || 'could not read domain from Resend')
        : `${domain.name}: opens ${domain.open === true ? 'ON' : domain.open === false ? 'OFF' : 'unknown'}, clicks ${domain.click === true ? 'ON' : domain.click === false ? 'OFF' : 'unknown'}`
          + (domain.open === null || domain.click === null
              ? ' - Resend did not report these flags, so this may already be ON; confirm in Resend → Domains'
              : ''),
    },
    {
      key: 'guard',
      title: 'Duplicate-send guard',
      done: sends.ok,
      manual: true,
      how: 'Supabase → SQL Editor → paste & Run',
      sql: BROADCAST_SENDS_SQL,
      detail: sends.ok ? 'active' : (sends.detail || 'not created yet'),
    },
  ];

  return NextResponse.json({
    steps,
    allDone: steps.every((s) => s.done),
    webhookUrl: `${SITE}/api/webhooks/resend`,
    note: 'Tracking is not retroactive - a campaign sent while it is off has no open data, permanently.',
  });
}

/**
 * POST { action: 'enable-tracking' }
 *
 * Flips open + click tracking ON for the sending domain via the Resend API,
 * using the key the app already holds. This is the one setup step that can be
 * done without a dashboard - but it is still a deliberate button press rather
 * than something the status GET does on its own, because it changes settings
 * on Hamza's Resend account.
 *
 * The real Resend response is echoed on failure rather than a generic message:
 * if the field names ever change, the actual error is what makes that fixable.
 */
export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  if (body?.action !== 'enable-tracking') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const domain = await resendDomain();
  if (!domain.ok) {
    return NextResponse.json({ error: 'Could not find the sending domain in Resend', detail: domain.detail }, { status: 502 });
  }

  const res = await fetch(`https://api.resend.com/domains/${domain.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ open_tracking: true, click_tracking: true }),
  });
  const out = await res.json().catch(() => null);
  if (!res.ok) {
    return NextResponse.json({
      error: 'Resend rejected the update',
      status: res.status,
      detail: typeof out === 'string' ? out : JSON.stringify(out)?.slice(0, 400),
    }, { status: 502 });
  }

  // Re-read rather than trusting the write - the panel should reflect what
  // Resend actually reports now, not what we asked for.
  const after = await resendDomain();
  return NextResponse.json({
    ok: true,
    domain: after.name || domain.name,
    openTracking: after.open,
    clickTracking: after.click,
    verified: after.open === true && after.click === true,
  });
}
