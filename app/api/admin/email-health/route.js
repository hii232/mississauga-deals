import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Whether the daily alert emails are actually going out has been unverifiable
// from inside the product — the only evidence lived in Vercel's cron logs and
// the Resend dashboard, so "are my emails sending?" needed someone to go and
// look somewhere else. This route answers it from data the app already writes.
//
// The evidence is deliberately indirect but SOUND: alert_sent_listings rows are
// written ONLY after Resend accepts a send (a rejected send stays eligible and
// records nothing), so a recent row proves a real delivery. The one thing it
// cannot prove is the reverse — a run where no subscriber had new matches
// legitimately sends nothing and writes nothing — so this route reports that
// ambiguity instead of crying failure.

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

function checkAuth(request) {
  const key = request.headers.get('x-admin-key');
  return key && key === process.env.ADMIN_SECRET;
}

const HOUR = 60 * 60 * 1000;

export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Sender configuration. The key itself is never returned — only whether it
  // exists, and the from-address, which is public on every email anyway.
  const from = process.env.RESEND_FROM_EMAIL || null;
  const config = {
    resendConfigured: !!process.env.RESEND_API_KEY,
    fromAddress: from,
    // An unverified sending domain is the single most common reason a send is
    // accepted by the app and then rejected by Resend.
    fromDomain: from ? (from.match(/@([^\s>]+)/)?.[1] || null) : null,
    cronSecretSet: !!process.env.CRON_SECRET,
  };

  if (!supabase) {
    return NextResponse.json({
      config,
      supabase: false,
      status: config.resendConfigured ? 'unknown' : 'not-configured',
      note: 'Supabase is not configured, so delivery history cannot be read.',
    });
  }

  const now = Date.now();
  const since = (h) => new Date(now - h * HOUR).toISOString();

  async function count(table, build) {
    try {
      const q = build(supabase.from(table).select('*', { count: 'exact', head: true }));
      const { count: c, error } = await q;
      // A missing table is a real answer ("no history"), not a crash.
      if (error) return null;
      return c ?? 0;
    } catch {
      return null;
    }
  }

  async function latest(table, column) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(column)
        .order(column, { ascending: false })
        .limit(1);
      if (error || !data?.length) return null;
      return data[0][column] || null;
    } catch {
      return null;
    }
  }

  const [
    alertsLast24h,
    alertsLast7d,
    lastAlertAt,
    subscribers,
    lastNewsletterAt,
  ] = await Promise.all([
    count('alert_sent_listings', (q) => q.gte('sent_at', since(24))),
    count('alert_sent_listings', (q) => q.gte('sent_at', since(24 * 7))),
    latest('alert_sent_listings', 'sent_at'),
    count('saved_searches', (q) => q),
    latest('newsletter_sends', 'sent_at'),
  ]);

  const hoursSinceAlert = lastAlertAt
    ? Math.round((now - new Date(lastAlertAt).getTime()) / HOUR)
    : null;

  // Status is deliberately conservative about what the data can prove.
  let status = 'ok';
  let note = '';
  if (!config.resendConfigured) {
    status = 'critical';
    note = 'RESEND_API_KEY is not set — no email can send at all.';
  } else if (!subscribers) {
    status = 'idle';
    note = 'No saved searches yet, so there is nobody to send a daily alert to.';
  } else if (lastAlertAt === null) {
    status = 'critical';
    note =
      `${subscribers} saved search${subscribers === 1 ? '' : 'es'} exist but no alert delivery has ever been recorded. ` +
      'Either the cron is not firing or Resend is rejecting every send — check the run output at /api/alerts/send.';
  } else if (hoursSinceAlert > 48) {
    status = 'warn';
    note =
      `Last recorded delivery was ${hoursSinceAlert} hours ago. This is only a problem if listings matched — ` +
      'a run where no subscriber had a new match correctly sends nothing and records nothing.';
  } else {
    note = `Last recorded delivery ${hoursSinceAlert} hour${hoursSinceAlert === 1 ? '' : 's'} ago.`;
  }

  return NextResponse.json({
    config,
    supabase: true,
    status,
    note,
    alerts: {
      lastSentAt: lastAlertAt,
      hoursSince: hoursSinceAlert,
      deliveriesLast24h: alertsLast24h,
      deliveriesLast7d: alertsLast7d,
      subscribers,
    },
    newsletter: { lastSentAt: lastNewsletterAt },
  });
}
