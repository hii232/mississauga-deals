import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { getSupabaseAdmin, getBroadcastRecipients } from '@/lib/emails/audience';
import { buildMotivatedSellersEmail } from '@/lib/emails/motivated-sellers-email';
import { unsubscribeUrl } from '@/lib/unsubscribe-token';
import { tagRecipient } from '@/lib/emails/recipient-token';
import { requireBroadcast, isBroadcastAuthorized } from '@/lib/api-auth';
import { selfOrigin } from '@/lib/emails/self-origin';
import { acquireSendLock, probeSendLock, BROADCAST_SENDS_SQL } from '@/lib/emails/broadcast-guard';

// 300, not 60: fetchRadar calls /api/market-stats with cache:'no-store', and a
// cold recompute of that route can take 60-90s when the feed upstream is slow.
// At 60 the draft GET died mid-fetch and the approver email silently never
// went out. 300 is within the plan's Fluid limit and leaves room for the
// batched send in the POST path too.
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// One-off campaign id. Powers the approval token + the "already sent" guard, so
// the whole database can never be double-mailed. Dated so a future re-run of
// the radar campaign is a NEW campaign key, not a blocked duplicate.
const CAMPAIGN = 'motivated-sellers-2026-07';

// Both of these emails invite a reply ("just reply to this email — it comes
// straight to me"). Without reply_to that is false: replies hit the
// notifications@ from-address instead of Hamza.
const REPLY_TO =
  process.env.REPLY_TO_EMAIL ||
  process.env.LEAD_NOTIFICATION_EMAIL ||
  'hamza@nouman.ca';

const APPROVER =
  process.env.NEWSLETTER_APPROVER_EMAIL ||
  process.env.LEAD_NOTIFICATION_EMAIL ||
  'hamza@nouman.ca';

// Auth: cron Bearer, admin header, or ?key= — see lib/api-auth.js requireBroadcast.
// The actual send needs the HMAC approval token from the draft email.

function approvalToken() {
  if (!process.env.CRON_SECRET) return 'dev';
  return createHmac('sha256', process.env.CRON_SECRET)
    .update(`broadcast-approve-${CAMPAIGN}`)
    .digest('hex')
    .slice(0, 20);
}

// ── The radar numbers, fetched LIVE at compose time ──────────────────────────
// Every claim in the email comes from /api/market-stats (the same whole-feed
// radar the site itself shows). cache:'no-store' so a draft and its approved
// send hours later both carry that moment's real counts.
//
// The plausibility guard is the campaign's core safety: if the feed is down,
// partially filled, or the mapping ever regresses (all hoods "Mississauga",
// zero DOM, etc.), the send REFUSES rather than mailing the whole database a
// wrong number — a wrong number is the worst bug on this site, and in an email
// it can't even be hotfixed.
async function fetchRadar(origin) {
  const res = await fetch(`${origin}/api/market-stats`, { cache: 'no-store' });
  if (!res.ok) return { radar: null, reason: `market-stats returned ${res.status}` };
  const stats = await res.json();
  const radar = {
    staleCount: stats?.staleCount ?? 0,
    stalePct: stats?.stalePct ?? 0,
    staleWithPriceCut: stats?.staleWithPriceCut ?? 0,
    activeCount: stats?.activeCount ?? 0,
    medianDOM: stats?.medianDOM ?? null,
    staleByNeighbourhood: stats?.staleByNeighbourhood ?? {},
  };
  const hoodKeys = Object.keys(radar.staleByNeighbourhood);
  const checks = [
    [radar.activeCount >= 1500, `activeCount ${radar.activeCount} < 1500 (incomplete feed fill)`],
    [radar.staleCount >= 50, `staleCount ${radar.staleCount} < 50`],
    [radar.staleCount < radar.activeCount, `staleCount ${radar.staleCount} >= activeCount ${radar.activeCount}`],
    [radar.staleWithPriceCut >= 10, `staleWithPriceCut ${radar.staleWithPriceCut} < 10`],
    [radar.staleWithPriceCut <= radar.staleCount, `staleWithPriceCut ${radar.staleWithPriceCut} > staleCount ${radar.staleCount}`],
    [hoodKeys.length >= 6, `only ${hoodKeys.length} neighbourhood keys`],
    [!(hoodKeys.length === 1 && hoodKeys[0] === 'Mississauga'), 'hoods collapsed to "Mississauga" (mapping regression)'],
  ];
  const failed = checks.filter(([ok]) => !ok).map(([, why]) => why);
  if (failed.length) return { radar: null, reason: failed.join('; ') };
  return { radar, reason: null };
}

// Only for ?preview=1 in a dev sandbox with no reachable feed, so the layout is
// reviewable. Real drafts and sends NEVER fall back to these — they refuse.
const SAMPLE_RADAR = {
  staleCount: 630,
  stalePct: 24.7,
  staleWithPriceCut: 208,
  activeCount: 2555,
  medianDOM: 35,
  staleByNeighbourhood: {
    'City Centre': 118, Cooksville: 64, Hurontario: 49, 'Erin Mills': 41,
    Meadowvale: 33, Clarkson: 28, Malton: 24,
  },
};

// ── Send one email via Resend, with native one-click unsubscribe headers ──
async function sendEmail(to, subject, html) {
  html = tagRecipient(html, to);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'MississaugaInvestor <notifications@mississaugainvestor.ca>',
      to,
      subject,
      html,
      reply_to: REPLY_TO,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl(to)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });
  return res.ok;
}

// ── Simple styled confirmation/result page ──
function htmlPage(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#F8FAFC;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;}
.card{background:#fff;border-radius:16px;padding:40px;max-width:460px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
h1{color:#1B2A4A;font-size:22px;margin:0 0 12px;}p{color:#64748B;font-size:15px;line-height:1.6;margin:0 0 20px;}
button,a.btn{display:inline-block;background:#2563EB;color:#fff;border:none;cursor:pointer;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;}</style>
</head><body><div class="card">${body}</div></body></html>`;
}

// ── Draft banner prepended to the email when it's sent for approval ──
function approvalBanner(count, radar, origin) {
  // Origin comes from the request being served — see lib/emails/self-origin.js.
  const url = `${origin}/api/broadcast/motivated-sellers?approve=1&t=${approvalToken()}`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto 4px;"><tr><td style="padding:16px 12px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#FEF3C7" style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:18px 22px;text-align:center;">
    <div style="font-family:system-ui,sans-serif;font-size:14px;font-weight:800;color:#92400E;margin-bottom:4px;">&#9998; DRAFT — waiting for your approval</div>
    <div style="font-family:system-ui,sans-serif;font-size:12px;color:#92400E;margin-bottom:6px;">This is exactly what your <strong>${count}</strong> contact${count === 1 ? '' : 's'} will receive. Nothing sends until you click below.</div>
    <div style="font-family:system-ui,sans-serif;font-size:11px;color:#92400E;margin-bottom:14px;">Live radar at draft time: ${radar.staleCount} stale &middot; ${radar.staleWithPriceCut} with cuts &middot; ${radar.activeCount} active. The send re-fetches these numbers fresh.</div>
    <a href="${url}" style="display:inline-block;background:#0F2A4A;color:#ffffff;font-family:system-ui,sans-serif;font-size:14px;font-weight:700;padding:12px 26px;border-radius:8px;text-decoration:none;">Review &amp; Send to ${count} &#8594;</a>
  </td></tr></table>
</td></tr></table>`;
}

// ── Fan out to the whole list in small batches ──
async function sendToAll(recipients, radar) {
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < recipients.length; i += 10) {
    const batch = recipients.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(({ email, name }) => {
        const { subject, html } = buildMotivatedSellersEmail({ email, name, radar });
        return sendEmail(email, subject, html);
      })
    );
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value) sent++;
      else failed++;
    });
  }
  return { sent, failed };
}

// ── GET: preview · count · approval page · or send the draft to the approver ──
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // ?preview=1 — render the email itself, send nothing. Open in dev; authed in prod.
    if (searchParams.get('preview') === '1') {
      if (process.env.NODE_ENV !== 'development') {
        const authErr = requireBroadcast(request, searchParams);
        if (authErr) return authErr;
      }
      let { radar } = await fetchRadar(selfOrigin(request)).catch(() => ({ radar: null }));
      if (!radar) radar = SAMPLE_RADAR;
      const { html } = buildMotivatedSellersEmail({
        email: 'preview@example.com',
        name: searchParams.get('name') || '',
        radar,
      });
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // ?count=1 — how many contacts this broadcast would reach right now.
    if (searchParams.get('count') === '1') {
      const authErr = requireBroadcast(request, searchParams);
      if (authErr) return authErr;
      const supabase = getSupabaseAdmin();
      const recipients = await getBroadcastRecipients(supabase);
      return NextResponse.json({ recipients: recipients.length });
    }

    // ?approve=1&t=... — confirmation page shown by the draft email's button.
    if (searchParams.get('approve') === '1') {
      if (searchParams.get('t') !== approvalToken()) {
        return new Response(
          htmlPage('Link expired', '<h1>This approval link is not valid</h1><p>Re-trigger the draft to get a fresh approval link.</p>'),
          { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
      const supabase = getSupabaseAdmin();
      const recipients = await getBroadcastRecipients(supabase);
      return new Response(
        htmlPage(
          'Send the radar email?',
          `<h1>Send the Motivated Seller Radar email?</h1>
           <p>It will go to <strong>${recipients.length} contact${recipients.length === 1 ? '' : 's'}</strong> in your database, with the radar numbers re-fetched live at send time. This can't be undone.</p>
           <form method="POST" action="/api/broadcast/motivated-sellers?approve=1&t=${approvalToken()}">
             <button type="submit">Yes — Send to ${recipients.length} Contact${recipients.length === 1 ? '' : 's'}</button>
           </form>`
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Default (authed) — email the DRAFT (with approval button) to the approver only.
    const authErr = requireBroadcast(request, searchParams);
    if (authErr) return authErr;
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 });
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    // Self-disarm: the daily cron keeps triggering this draft path after the
    // campaign has gone out, which would mail Hamza an [APPROVE] draft every
    // day forever. If broadcast_sends already records this campaign as sent,
    // skip drafting entirely. Read-only; if the table is missing we draft as
    // before.
    try {
      const { data: sent } = await supabase
        .from('broadcast_sends')
        .select('campaign_key')
        .eq('campaign_key', CAMPAIGN)
        .maybeSingle();
      if (sent) {
        return NextResponse.json({
          alreadySent: true,
          campaign: CAMPAIGN,
          note: 'Campaign already sent — no draft emailed. Remove the cron entry in vercel.json when convenient.',
        });
      }
    } catch {
      // table missing — proceed with the draft
    }
    const { radar, reason } = await fetchRadar(selfOrigin(request));
    if (!radar) {
      return NextResponse.json(
        { error: 'Radar numbers unavailable or implausible — not drafting', detail: reason },
        { status: 500 }
      );
    }
    const recipients = await getBroadcastRecipients(supabase);
    const { html } = buildMotivatedSellersEmail({ email: APPROVER, name: 'Hamza', radar });
    const draftHtml = approvalBanner(recipients.length, radar, selfOrigin(request)) + html;
    const ok = await sendEmail(
      APPROVER,
      `[APPROVE] Motivated Seller Radar — send to ${recipients.length} contact${recipients.length === 1 ? '' : 's'}?`,
      draftHtml
    );
    return NextResponse.json({
      success: ok,
      mode: 'draft-for-approval',
      draftSentTo: APPROVER,
      recipients: recipients.length,
      radar,
      next: 'Open the draft in your inbox and click "Review & Send".',
    });
  } catch (err) {
    console.error('Motivated-sellers broadcast (GET) error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST ?approve=1&t=... — the approved send (from the confirmation page) ──
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('approve') !== '1' || searchParams.get('t') !== approvalToken()) {
      return new Response(
        htmlPage('Link expired', '<h1>This approval link is not valid</h1><p>Re-trigger the draft to get a fresh approval link.</p>'),
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase || !process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email infrastructure not configured' }, { status: 500 });
    }

    // The numbers the whole list receives are re-verified NOW, before the
    // idempotency guard burns the one shot this campaign gets.
    const { radar, reason } = await fetchRadar(selfOrigin(request));
    if (!radar) {
      return new Response(
        htmlPage('Not sent', `<h1>Send blocked — radar numbers unavailable</h1><p>${reason || 'The live stats endpoint did not return plausible numbers.'} Nothing was sent; try again once /api/market-stats is healthy.</p>`),
        { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // FAIL-CLOSED idempotency. The old behaviour proceeded without the guard
    // when broadcast_sends was missing — and the table was in fact missing,
    // which is how this database got the same campaign twice. The mass-send
    // now happens ONLY if the lock row was actually written.
    const lock = await acquireSendLock(supabase, CAMPAIGN, APPROVER);
    if (lock.outcome === 'duplicate') {
      return new Response(
        htmlPage('Already sent', '<h1>This campaign was already sent</h1><p>No duplicate emails went out.</p>'),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    if (lock.outcome !== 'acquired') {
      return new Response(
        htmlPage('Not sent', `<h1>Send blocked &mdash; duplicate protection unavailable</h1>
         <p>The broadcast_sends table could not be written (${String(lock.detail || '').replace(/[<>&]/g, ' ')}), so nothing is stopping this campaign from going out twice. <strong>Nothing was sent.</strong></p>
         <p>Run this once in Supabase &rarr; SQL Editor, then click the approve button again:</p>
         <pre style="text-align:left;background:#0F172A;color:#E2E8F0;padding:14px;border-radius:8px;font-size:12px;line-height:1.5;overflow:auto;">${BROADCAST_SENDS_SQL}</pre>`),
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const recipients = await getBroadcastRecipients(supabase);
    if (recipients.length === 0) {
      return new Response(
        htmlPage('No contacts', '<h1>No contacts found</h1><p>There was nobody to send to.</p>'),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const { sent, failed } = await sendToAll(recipients, radar);
    return new Response(
      htmlPage(
        'Sent',
        `<h1>&#127881; Sent to ${sent} contact${sent === 1 ? '' : 's'}</h1>
         <p>${failed ? `${failed} failed and will show in your Resend logs.` : 'Every email went out successfully.'}</p>
         <a class="btn" href="https://www.mississaugainvestor.ca/admin">Open Admin</a>`
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err) {
    console.error('Motivated-sellers broadcast (POST) error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
