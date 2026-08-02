import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { summarize } from '@/lib/emails/resend-webhook';

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

/**
 * Campaign performance from stored Resend webhook events.
 *
 * ?campaign=<key>  report for one campaign (defaults to the most recent)
 *
 * The engaged list is joined back to `leads` so the follow-up list carries a
 * name and phone, not just an address — that is the whole point of the panel.
 * A missing email_events table is reported as a setup step, not an error: it
 * means the migration hasn't been run yet.
 */
export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const wanted = searchParams.get('campaign');

  const { data: rows, error } = await supabase
    .from('email_events')
    .select('event_id,type,campaign,recipient,subject,link,occurred_at')
    .order('occurred_at', { ascending: false })
    .limit(20000);

  if (error) {
    const missing = error.code === '42P01' || error.code === 'PGRST205'
      || /does not exist|schema cache/i.test(error.message || '');
    return NextResponse.json({
      ready: false,
      needsMigration: missing,
      detail: error.message,
      note: missing
        ? 'Run supabase/migrations/create_email_events.sql, then add the webhook in Resend.'
        : 'Could not read email_events.',
    }, { status: missing ? 200 : 500 });
  }

  const all = rows || [];
  const campaigns = [...new Set(all.map((r) => r.campaign).filter(Boolean))];
  const campaign = wanted || campaigns[0] || null;
  const scoped = campaign ? all.filter((r) => r.campaign === campaign) : all;
  const summary = summarize(scoped);

  // Attach lead identity to the follow-up list.
  let engaged = summary.engaged;
  if (engaged.length) {
    const emails = engaged.map((p) => p.email).slice(0, 500);
    const { data: leads } = await supabase
      .from('leads')
      .select('email,name,phone')
      .in('email', emails);
    const byEmail = new Map((leads || []).map((l) => [String(l.email).toLowerCase(), l]));
    engaged = engaged.map((p) => ({
      ...p,
      name: byEmail.get(p.email)?.name || null,
      phone: byEmail.get(p.email)?.phone || null,
    }));
  }

  return NextResponse.json({
    ready: true,
    campaign,
    campaigns,
    totalEventsStored: all.length,
    ...summary,
    engaged,
    // Stated in the payload so any consumer of this API inherits the caveat
    // rather than quoting the open rate as if it were people.
    openRateCaveat:
      'Apple Mail Privacy Protection pre-fetches images for Apple Mail users, which registers an open nobody performed. Treat opens as directional and clicks as the real engagement signal.',
  });
}
