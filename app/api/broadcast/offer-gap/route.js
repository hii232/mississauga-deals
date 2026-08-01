import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { getSupabaseAdmin, getBroadcastRecipients } from '@/lib/emails/audience';
import { buildOfferGapEmail } from '@/lib/emails/offer-gap-email';
import { validateGap, TYPE_ORDER } from '@/lib/emails/offer-gap-data';
import { unsubscribeUrl } from '@/lib/unsubscribe-token';
import { tagRecipient } from '@/lib/emails/recipient-token';
import { requireBroadcast } from '@/lib/api-auth';

// 300 for the same reason as the motivated-sellers route: composing calls
// /api/market-stats with cache:'no-store', and a cold recompute of that route
// can take 60-90s when the feed upstream is slow. At 60 the draft GET dies
// mid-fetch and the approver email silently never goes out.
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// One-off campaign id, dated. Powers the approval token AND the "already sent"
// guard, so this campaign can only ever mass-send once. A future re-run of the
// offer-gap idea must use a NEW key rather than reusing this one — reusing it
// would be blocked as a duplicate, which is the intended failure direction.
const CAMPAIGN = 'offer-gap-2026-08';

const APPROVER =
  process.env.NEWSLETTER_APPROVER_EMAIL ||
  process.env.LEAD_NOTIFICATION_EMAIL ||
  'hamza@nouman.ca';

const SITE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://www.mississaugainvestor.ca';

function approvalToken() {
  if (!process.env.CRON_SECRET) return 'dev';
  return createHmac('sha256', process.env.CRON_SECRET)
    .update(`broadcast-approve-${CAMPAIGN}`)
    .digest('hex')
    .slice(0, 20);
}

// ── The figures, fetched LIVE at compose time ────────────────────────────────
// Every claim in this email comes from /api/market-stats' `salesByType`, which
// is transcribed by hand from the TRREB Market Watch per-type pages (CLAUDE.md
// documents that process). Nothing is derived from live listings and nothing is
// hardcoded here, so the email can never quote a number the site itself is not
// showing.
//
// The plausibility guard is the campaign's core safety. A wrong number is the
// worst bug on this site, and in a broadcast it cannot be hotfixed after the
// fact — so if anything about the payload looks off, the send REFUSES rather
// than mailing the whole database.
async function fetchGap() {
  const res = await fetch(`${SITE_URL}/api/market-stats`, { cache: 'no-store' });
  if (!res.ok) return { gap: null, reason: `market-stats returned ${res.status}` };
  // The guard lives in lib/emails/offer-gap-data.js — dependency-free precisely
  // so it can be unit-tested without booting Next. See offer-gap-data.test.mjs.
  return validateGap(await res.json());
}

// Only for ?preview=1 in a dev sandbox with no reachable feed, so the layout is
// reviewable. Real drafts and sends NEVER fall back to this — they refuse.
// Values are the real TRREB MW2606 (June 2026) Mississauga rows.
const SAMPLE_GAP = {
  month: 'June 2026',
  monthsBehind: 1,
  activeCount: 2447,
  salesByType: {
    detached: { sales: 227, avgPrice: 1482130, spLp: 96, ldom: 25 },
    semiDetached: { sales: 86, avgPrice: 908389, spLp: 100, ldom: 19 },
    townhouse: { sales: 18, avgPrice: 883038, spLp: 101, ldom: 30 },
    condoTown: { sales: 91, avgPrice: 726749, spLp: 98, ldom: 31 },
    condoApt: { sales: 142, avgPrice: 525333, spLp: 97, ldom: 40 },
  },
};

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
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl(to)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });
  return res.ok;
}

function htmlPage(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#F8FAFC;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;}
.card{background:#fff;border-radius:16px;padding:40px;max-width:460px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
h1{color:#1B2A4A;font-size:22px;margin:0 0 12px;}p{color:#64748B;font-size:15px;line-height:1.6;margin:0 0 20px;}
button,a.btn{display:inline-block;background:#2563EB;color:#fff;border:none;cursor:pointer;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;}</style>
</head><body><div class="card">${body}</div></body></html>`;
}

function approvalBanner(count, gap) {
  const url = `${SITE_URL}/api/broadcast/offer-gap?approve=1&t=${approvalToken()}`;
  const spread = TYPE_ORDER
    .map(([key, label]) => ({ label, ...(gap.salesByType[key] || {}) }))
    .filter((r) => r.spLp > 0)
    .map((r) => `${r.label} ${r.spLp}%`)
    .join(' &middot; ');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto 4px;"><tr><td style="padding:16px 12px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#FEF3C7" style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:18px 22px;text-align:center;">
    <div style="font-family:system-ui,sans-serif;font-size:14px;font-weight:800;color:#92400E;margin-bottom:4px;">&#9998; DRAFT — waiting for your approval</div>
    <div style="font-family:system-ui,sans-serif;font-size:12px;color:#92400E;margin-bottom:6px;">This is exactly what your <strong>${count}</strong> contact${count === 1 ? '' : 's'} will receive. Nothing sends until you click below.</div>
    <div style="font-family:system-ui,sans-serif;font-size:11px;color:#92400E;margin-bottom:6px;">Source: TRREB Market Watch <strong>${gap.month}</strong> (${gap.monthsBehind} month${gap.monthsBehind === 1 ? '' : 's'} behind). The send re-fetches and re-validates these numbers fresh.</div>
    <div style="font-family:system-ui,sans-serif;font-size:11px;color:#92400E;margin-bottom:14px;">${spread}</div>
    <a href="${url}" style="display:inline-block;background:#0F2A4A;color:#ffffff;font-family:system-ui,sans-serif;font-size:14px;font-weight:700;padding:12px 26px;border-radius:8px;text-decoration:none;">Review &amp; Send to ${count} &#8594;</a>
  </td></tr></table>
</td></tr></table>`;
}

async function sendToAll(recipients, gap) {
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < recipients.length; i += 10) {
    const batch = recipients.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(({ email, name }) => {
        const { subject, html } = buildOfferGapEmail({ email, name, gap });
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
      let { gap } = await fetchGap().catch(() => ({ gap: null }));
      if (!gap) gap = SAMPLE_GAP;
      const { html } = buildOfferGapEmail({
        email: 'preview@example.com',
        name: searchParams.get('name') || '',
        gap,
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
          'Send the Offer Gap email?',
          `<h1>Send the Offer Gap email?</h1>
           <p>It will go to <strong>${recipients.length} contact${recipients.length === 1 ? '' : 's'}</strong> in your database, with the TRREB figures re-fetched and re-validated live at send time. This can't be undone.</p>
           <form method="POST" action="/api/broadcast/offer-gap?approve=1&t=${approvalToken()}">
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
    // Self-disarm: if this campaign has already gone out, never draft again.
    // Read-only; if the table is missing we draft as before.
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
          note: 'Campaign already sent — no draft emailed.',
        });
      }
    } catch {
      // table missing — proceed with the draft
    }
    const { gap, reason } = await fetchGap();
    if (!gap) {
      return NextResponse.json(
        { error: 'TRREB figures unavailable or implausible — not drafting', detail: reason },
        { status: 500 }
      );
    }
    const recipients = await getBroadcastRecipients(supabase);
    const { html } = buildOfferGapEmail({ email: APPROVER, name: 'Hamza', gap });
    const draftHtml = approvalBanner(recipients.length, gap) + html;
    const ok = await sendEmail(
      APPROVER,
      `[APPROVE] The Offer Gap — send to ${recipients.length} contact${recipients.length === 1 ? '' : 's'}?`,
      draftHtml
    );
    return NextResponse.json({
      success: ok,
      mode: 'draft-for-approval',
      draftSentTo: APPROVER,
      recipients: recipients.length,
      gap,
      next: 'Open the draft in your inbox and click "Review & Send".',
    });
  } catch (err) {
    console.error('Offer-gap broadcast (GET) error:', err);
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
    const { gap, reason } = await fetchGap();
    if (!gap) {
      return new Response(
        htmlPage('Not sent', `<h1>Send blocked — TRREB figures unavailable</h1><p>${reason || 'The live stats endpoint did not return plausible numbers.'} Nothing was sent; try again once /api/market-stats is healthy.</p>`),
        { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // One send per campaign, enforced by the unique campaign_key.
    try {
      const { error: guardErr } = await supabase
        .from('broadcast_sends')
        .insert({ campaign_key: CAMPAIGN, approved_by: APPROVER });
      if (guardErr && (guardErr.code === '23505' || /duplicate/i.test(guardErr.message || ''))) {
        return new Response(
          htmlPage('Already sent', '<h1>This campaign was already sent</h1><p>No duplicate emails went out.</p>'),
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    } catch {
      // table missing — proceed without the idempotency guard
    }

    const recipients = await getBroadcastRecipients(supabase);
    if (recipients.length === 0) {
      return new Response(
        htmlPage('No contacts', '<h1>No contacts found</h1><p>There was nobody to send to.</p>'),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const { sent, failed } = await sendToAll(recipients, gap);
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
    console.error('Offer-gap broadcast (POST) error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
