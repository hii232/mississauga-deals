import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { getSupabaseAdmin, getBroadcastRecipients } from '@/lib/emails/audience';
import { buildOfferPicksEmail } from '@/lib/emails/offer-picks-email';
import { pickDeals, validatePicks } from '@/lib/emails/offer-picks-data';
import { unsubscribeUrl } from '@/lib/unsubscribe-token';
import { tagRecipient } from '@/lib/emails/recipient-token';
import { requireBroadcast } from '@/lib/api-auth';

// Composing hits BOTH /api/listings and /api/market-stats with no-store; a cold
// recompute of either can take 60-90s when the upstream feed is slow.
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Dated campaign id. Powers the approval token AND the broadcast_sends
// idempotency guard, so this send can happen at most once.
//
// NOTE: unlike the one-off campaigns, this format is designed to REPEAT — the
// picks change every week. A recurring version must mint a NEW key per send
// (e.g. offer-picks-2026-W32) rather than reusing this one, and must not be put
// on a cron until the broadcast_sends table is confirmed to exist in Supabase.
// Without that table the guard silently no-ops and a repeated draft can be
// approved twice, which is exactly how the same email reaches the list twice.
const CAMPAIGN = 'offer-picks-2026-08-01';

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

// ── The picks, assembled live at compose time ────────────────────────────────
// Listings come from /api/listings (live MLS), the offer anchors from
// /api/market-stats' TRREB salesByType. The selection and the arithmetic live
// in lib/emails/offer-picks-data.js, which is unit-tested — this function only
// fetches and hands off, so the numbers a subscriber sees are the ones the
// tests cover.
async function fetchPicks() {
  const [listRes, statsRes] = await Promise.all([
    fetch(`${SITE_URL}/api/listings?city=Mississauga&limit=200&sort=dom`, { cache: 'no-store' }),
    fetch(`${SITE_URL}/api/market-stats`, { cache: 'no-store' }),
  ]);
  if (!listRes.ok) return { data: null, reason: `listings returned ${listRes.status}` };
  if (!statsRes.ok) return { data: null, reason: `market-stats returned ${statsRes.status}` };

  const listJson = await listRes.json();
  const stats = await statsRes.json();
  const listings = listJson?.listings || listJson?.items || [];
  if (!listings.length) return { data: null, reason: 'listings feed returned nothing' };

  const salesByType = stats?.salesByType;
  const month = stats?.tRREBMonth;
  const monthsBehind = Number(stats?.tRREBMonthsBehind ?? 0);
  if (monthsBehind > 3) {
    return { data: null, reason: `TRREB anchors are ${monthsBehind} months behind — too stale to price offers from` };
  }

  const picks = pickDeals(listings, salesByType, 3);
  return validatePicks(picks, salesByType, month);
}

// Dev-only layout fixture for ?preview=1&sample=1. Addresses are stamped
// SAMPLE deliberately — see the note at the preview branch. Never reachable in
// production, and no code path other than that branch reads it.
const SAMPLE_DATA = {
  month: 'June 2026',
  picks: [
    {
      listing: {
        id: 'SAMPLE-1', address: '00 SAMPLE St (not a real listing)', city: 'Mississauga',
        neighbourhood: 'Cooksville', type: 'Detached', price: 1099000, beds: 4, baths: 3,
        dom: 71, priceDrop: 4, photos: ['https://placehold.co/600x360/1B2A4A/FFF?text=SAMPLE'],
      },
      offer: {
        typeKey: 'detached', offer: 1010000, pctOfAsk: 92, marketRatio: 96, typeLdom: 25,
        dom: 71, priceDrop: 4, usedDom: true, usedCut: true, belowAsk: 89000,
      },
    },
    {
      listing: {
        id: 'SAMPLE-2', address: '00 SAMPLE Ave (not a real listing)', city: 'Mississauga',
        neighbourhood: 'City Centre', type: 'Condo', price: 549000, beds: 2, baths: 2,
        dom: 88, priceDrop: 0, photos: ['https://placehold.co/600x360/25355C/FFF?text=SAMPLE'],
      },
      offer: {
        typeKey: 'condoApt', offer: 522000, pctOfAsk: 95, marketRatio: 97, typeLdom: 40,
        dom: 88, priceDrop: 0, usedDom: true, usedCut: false, belowAsk: 27000,
      },
    },
    {
      listing: {
        id: 'SAMPLE-3', address: '00 SAMPLE Cres (not a real listing)', city: 'Mississauga',
        neighbourhood: 'Meadowvale', type: 'Townhouse', price: 799000, beds: 3, baths: 2,
        dom: 52, priceDrop: 2, condoFee: 320,
        photos: ['https://placehold.co/600x360/047857/FFF?text=SAMPLE'],
      },
      offer: {
        typeKey: 'condoTown', offer: 767000, pctOfAsk: 96, marketRatio: 98, typeLdom: 31,
        dom: 52, priceDrop: 2, usedDom: true, usedCut: true, belowAsk: 32000,
      },
    },
  ],
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

function approvalBanner(count, data) {
  const url = `${SITE_URL}/api/broadcast/offer-picks?approve=1&t=${approvalToken()}`;
  const lines = data.picks.map((p) =>
    `${p.listing.address} — ask $${Math.round(p.listing.price).toLocaleString('en-CA')}, `
    + `open $${Math.round(p.offer.offer).toLocaleString('en-CA')} (${p.offer.pctOfAsk}%), `
    + `${p.offer.dom}d${p.offer.priceDrop >= 1 ? `, cut ${p.offer.priceDrop}%` : ''}`
  ).join('<br>');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto 4px;"><tr><td style="padding:16px 12px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#FEF3C7" style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:18px 22px;text-align:center;">
    <div style="font-family:system-ui,sans-serif;font-size:14px;font-weight:800;color:#92400E;margin-bottom:4px;">&#9998; DRAFT — waiting for your approval</div>
    <div style="font-family:system-ui,sans-serif;font-size:12px;color:#92400E;margin-bottom:8px;">This is exactly what your <strong>${count}</strong> contact${count === 1 ? '' : 's'} will receive. Nothing sends until you click below.</div>
    <div style="font-family:system-ui,sans-serif;font-size:11px;color:#92400E;text-align:left;line-height:1.7;margin-bottom:8px;">
      <strong>Check these three before sending — your name is on the offer numbers:</strong><br>${lines}
    </div>
    <div style="font-family:system-ui,sans-serif;font-size:11px;color:#92400E;margin-bottom:14px;">Offer anchors: TRREB ${data.month}. The send re-fetches listings and re-validates fresh.</div>
    <a href="${url}" style="display:inline-block;background:#0F2A4A;color:#ffffff;font-family:system-ui,sans-serif;font-size:14px;font-weight:700;padding:12px 26px;border-radius:8px;text-decoration:none;">Review &amp; Send to ${count} &#8594;</a>
  </td></tr></table>
</td></tr></table>`;
}

async function sendToAll(recipients, data) {
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < recipients.length; i += 10) {
    const batch = recipients.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(({ email, name }) => {
        const { subject, html } = buildOfferPicksEmail({ email, name, data });
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

    if (searchParams.get('preview') === '1') {
      if (process.env.NODE_ENV !== 'development') {
        const authErr = requireBroadcast(request, searchParams);
        if (authErr) return authErr;
      }
      // Layout review with no reachable feed. Dev-only, opt-in, and every
      // address is stamped SAMPLE so it cannot be mistaken for a real listing
      // — which is the line that matters: inventing a PLAUSIBLE property to
      // preview an email that tells people what to bid is not acceptable, but
      // an obviously-fake one for checking padding is fine.
      if (searchParams.get('sample') === '1' && process.env.NODE_ENV === 'development') {
        const { html } = buildOfferPicksEmail({
          email: 'preview@example.com', name: searchParams.get('name') || '', data: SAMPLE_DATA,
        });
        return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      const { data, reason } = await fetchPicks().catch((e) => ({ data: null, reason: String(e) }));
      if (!data) {
        // No sample fallback here, unlike the aggregate campaigns. This email
        // names real addresses and tells someone what to bid on them; inventing
        // a plausible-looking property to preview the layout is not a thing
        // this file will do.
        return NextResponse.json(
          { error: 'Cannot preview — live listings or TRREB anchors unavailable', detail: reason },
          { status: 503 }
        );
      }
      const { html } = buildOfferPicksEmail({
        email: 'preview@example.com',
        name: searchParams.get('name') || '',
        data,
      });
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    if (searchParams.get('count') === '1') {
      const authErr = requireBroadcast(request, searchParams);
      if (authErr) return authErr;
      const supabase = getSupabaseAdmin();
      const recipients = await getBroadcastRecipients(supabase);
      return NextResponse.json({ recipients: recipients.length });
    }

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
          'Send the picks email?',
          `<h1>Send this week&rsquo;s picks?</h1>
           <p>It will go to <strong>${recipients.length} contact${recipients.length === 1 ? '' : 's'}</strong>, with listings and offer numbers re-fetched and re-validated live at send time. This can't be undone.</p>
           <form method="POST" action="/api/broadcast/offer-picks?approve=1&t=${approvalToken()}">
             <button type="submit">Yes — Send to ${recipients.length} Contact${recipients.length === 1 ? '' : 's'}</button>
           </form>`
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const authErr = requireBroadcast(request, searchParams);
    if (authErr) return authErr;
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 });
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    try {
      const { data: already } = await supabase
        .from('broadcast_sends')
        .select('campaign_key')
        .eq('campaign_key', CAMPAIGN)
        .maybeSingle();
      if (already) {
        return NextResponse.json({
          alreadySent: true,
          campaign: CAMPAIGN,
          note: 'Campaign already sent — no draft emailed.',
        });
      }
    } catch {
      // table missing — proceed with the draft
    }
    const { data, reason } = await fetchPicks();
    if (!data) {
      return NextResponse.json(
        { error: 'Picks unavailable or failed validation — not drafting', detail: reason },
        { status: 500 }
      );
    }
    const recipients = await getBroadcastRecipients(supabase);
    const { html } = buildOfferPicksEmail({ email: APPROVER, name: 'Hamza', data });
    const draftHtml = approvalBanner(recipients.length, data) + html;
    const ok = await sendEmail(
      APPROVER,
      `[APPROVE] This week's picks — send to ${recipients.length} contact${recipients.length === 1 ? '' : 's'}?`,
      draftHtml
    );
    return NextResponse.json({
      success: ok,
      mode: 'draft-for-approval',
      draftSentTo: APPROVER,
      recipients: recipients.length,
      picks: data.picks.map((p) => ({
        address: p.listing.address, ask: p.listing.price,
        open: p.offer.offer, pctOfAsk: p.offer.pctOfAsk, dom: p.offer.dom,
      })),
      next: 'Open the draft, check the three addresses and offer numbers, then click "Review & Send".',
    });
  } catch (err) {
    console.error('Offer-picks broadcast (GET) error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST ?approve=1&t=... — the approved send ─────────────────────────────────
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

    // Re-fetch and re-validate BEFORE the idempotency guard burns the one shot
    // this campaign gets. Listings go stale fast — a property sold since the
    // draft must not be mailed out with an offer number attached.
    const { data, reason } = await fetchPicks();
    if (!data) {
      return new Response(
        htmlPage('Not sent', `<h1>Send blocked — picks failed validation</h1><p>${reason || 'Live listings or the TRREB anchors were unavailable.'} Nothing was sent.</p>`),
        { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

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

    const { sent, failed } = await sendToAll(recipients, data);
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
    console.error('Offer-picks broadcast (POST) error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
