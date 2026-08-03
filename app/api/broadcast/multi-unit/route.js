import { NextResponse } from 'next/server';
import { sendBulk, summarizeBulk } from '@/lib/emails/send-bulk';
import { createHmac } from 'crypto';
import { getSupabaseAdmin, getBroadcastRecipients } from '@/lib/emails/audience';
import { buildMultiUnitLetter, buildMultiUnitText } from '@/lib/emails/multi-unit-letter';
import { selectMultiUnit, aggregateMultiUnit, validateMultiUnit } from '@/lib/emails/multi-unit-data';
import { unsubscribeUrl } from '@/lib/unsubscribe-token';
import { tagRecipient } from '@/lib/emails/recipient-token';
import { requireBroadcast } from '@/lib/api-auth';
import { selfOrigin } from '@/lib/emails/self-origin';
import { acquireSendLock, probeSendLock, BROADCAST_SENDS_SQL } from '@/lib/emails/broadcast-guard';

// Compose hits the live feed with no-store; a cold upstream can take 60-90s.
export const maxDuration = 300;
// Stop starting new sends at 80% of maxDuration so the run always returns a
// truthful count instead of being killed mid-send.
const SEND_BUDGET_MS = 240000;
export const dynamic = 'force-dynamic';

// Dated campaign id — powers the approval token AND the fail-closed
// broadcast_sends lock, so this send can happen at most once. A future
// edition mints a NEW key. Deliberately NOT on a cron.
const CAMPAIGN = 'multi-unit-2026-08';

const REPLY_TO =
  process.env.REPLY_TO_EMAIL ||
  process.env.LEAD_NOTIFICATION_EMAIL ||
  'hamza@nouman.ca';

const APPROVER =
  process.env.NEWSLETTER_APPROVER_EMAIL ||
  process.env.LEAD_NOTIFICATION_EMAIL ||
  'hamza@nouman.ca';

function approvalToken() {
  if (!process.env.CRON_SECRET) return 'dev';
  return createHmac('sha256', process.env.CRON_SECRET)
    .update(`broadcast-approve-${CAMPAIGN}`)
    .digest('hex')
    .slice(0, 20);
}

// ── The letter's facts, fetched live at compose time ─────────────────────────
// One feed call with multiUnit=1 (server-side subtype filter) and nomedia=1 —
// the letter has no images, so paying for the Media expand would be waste.
// Selection re-verifies types, aggregation computes every figure the letter
// states, and validateMultiUnit refuses the send on anything implausible
// (including the 0-rows case that means TREB renamed the subtypes).
async function fetchSnapshot(origin) {
  // Two facts come from two different queries, and mixing them up is exactly
  // the bug this function shipped with: a query filtered to multiUnit=1
  // reports the FILTERED count as its total, so using that as "active
  // listings city-wide" made totalActive ~= the multi-unit count and the
  // validation rule (totalActive must exceed it) refuse every single draft.
  // The city-wide total now comes from an unfiltered probe, always.
  const [probeRes, fastRes] = await Promise.all([
    fetch(`${origin}/api/listings?city=Mississauga&limit=100&nomedia=1&page=1`, { cache: 'no-store' }),
    fetch(`${origin}/api/listings?city=Mississauga&multiUnit=1&limit=100&nomedia=1`, { cache: 'no-store' }),
  ]);
  if (!probeRes.ok) return { data: null, reason: `listings probe returned ${probeRes.status}` };
  const probe = await probeRes.json();
  const totalActive = probe?.browsableTotal || probe?.total || 0;

  // Fast path: the server-side PropertySubType filter.
  let rows = [];
  if (fastRes.ok) {
    const fast = await fastRes.json();
    rows = selectMultiUnit(fast?.listings || []);
  }

  // Fallback: if the eq-list found almost nothing, don't conclude scarcity
  // from an unverified subtype spelling — walk the whole city feed (nomedia,
  // same pattern the homepage uses) and trust the mapped `type` instead.
  // Only after the walk is a low count a real market fact.
  if (rows.length < 2) {
    const pages = Math.min(Number(probe?.pages) || 1, 30);
    const all = [...(probe?.listings || [])];
    for (let pg = 2; pg <= pages; pg++) {
      const r = await fetch(
        `${origin}/api/listings?city=Mississauga&limit=100&nomedia=1&page=${pg}`,
        { cache: 'no-store' }
      ).catch(() => null);
      if (!r || !r.ok) return { data: null, reason: `feed walk failed at page ${pg}/${pages}` };
      const j = await r.json();
      all.push(...(j?.listings || []));
    }
    // Merge with whatever the fast path found; selectMultiUnit dedupes by id.
    rows = selectMultiUnit([...rows, ...all]);
  }

  return validateMultiUnit(aggregateMultiUnit(rows), totalActive);
}

// Dev-only layout fixture for ?preview=1&sample=1 — aggregate counts only, no
// invented addresses, and never reachable in production.
const SAMPLE_DATA = {
  count: 7,
  byType: { Duplex: 4, Triplex: 2, Fourplex: 1 },
  breakdown: '4 duplexes, 2 triplexes and 1 fourplex',
  priceMin: 899000,
  priceMax: 2150000,
  priceMedian: 1250000,
  medianDOM: 47,
  domKnownCount: 6,
  cutCount: 3,
  totalActive: 2447,
};

async function sendEmail(to, subject, html, text) {
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
      ...(text ? { text } : {}),
      reply_to: REPLY_TO,
      // Attribution tag for the analytics webhook — the subject changes with
      // live data, the tag doesn't.
      tags: [{ name: 'campaign', value: CAMPAIGN }],
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl(to)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });
  if (res.ok) return { ok: true, status: res.status };
  // The status and body used to be discarded (`return res.ok`), which is why a
  // 429 storm was indistinguishable from a quiet day. Report both.
  const body = await res.text().catch(() => '');
  return { ok: false, status: res.status, retryAfter: res.headers.get('retry-after'), body };
}

function htmlPage(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#F8FAFC;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;}
.card{background:#fff;border-radius:16px;padding:40px;max-width:460px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
h1{color:#1B2A4A;font-size:22px;margin:0 0 12px;}p{color:#64748B;font-size:15px;line-height:1.6;margin:0 0 20px;}
button,a.btn{display:inline-block;background:#2563EB;color:#fff;border:none;cursor:pointer;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;}</style>
</head><body><div class="card">${body}</div></body></html>`;
}

function approvalBanner(count, data, origin, guardReady) {
  const url = `${origin}/api/broadcast/multi-unit?approve=1&t=${approvalToken()}`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto 4px;"><tr><td style="padding:16px 12px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#FEF3C7" style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:18px 22px;text-align:center;">
    <div style="font-family:system-ui,sans-serif;font-size:14px;font-weight:800;color:#92400E;margin-bottom:4px;">&#9998; DRAFT — waiting for your approval</div>
    <div style="font-family:system-ui,sans-serif;font-size:12px;color:#92400E;margin-bottom:8px;">This is exactly what your <strong>${count}</strong> contact${count === 1 ? '' : 's'} will receive. Nothing sends until you click below.</div>
    ${guardReady ? '' : `<div style="font-family:system-ui,sans-serif;font-size:12px;font-weight:700;color:#B91C1C;background:#FEE2E2;border:1px solid #FCA5A5;border-radius:8px;padding:10px 12px;margin:0 0 8px;text-align:left;">&#9888; Duplicate-send protection is NOT active &mdash; the broadcast_sends table is missing in Supabase, and the send will REFUSE until it exists. Fix first: Supabase &rarr; SQL Editor &rarr; paste &amp; run:<pre style="background:#0F172A;color:#E2E8F0;padding:10px;border-radius:6px;font-size:11px;line-height:1.5;overflow:auto;margin:8px 0 0;">${BROADCAST_SENDS_SQL}</pre></div>`}
    <div style="font-family:system-ui,sans-serif;font-size:11px;color:#92400E;margin-bottom:14px;">Live snapshot: ${data.count} multi-unit listings (${data.breakdown}) &middot; ${data.cutCount} with cuts &middot; median ${data.medianDOM || '?'} days. The send re-fetches and re-validates fresh.</div>
    <a href="${url}" style="display:inline-block;background:#0F2A4A;color:#ffffff;font-family:system-ui,sans-serif;font-size:14px;font-weight:700;padding:12px 26px;border-radius:8px;text-decoration:none;">Review &amp; Send to ${count} &#8594;</a>
  </td></tr></table>
</td></tr></table>`;
}

async function sendToAll(recipients, data) {
  // Paced + 429-aware. The old loop fired TEN concurrent Resend calls per
  // batch with no delay and threw away every failure reason, so most of a
  // ~480-recipient run could be refused with nothing recorded anywhere.
  // Budget leaves headroom under this route's maxDuration so an over-long run
  // reports its exact remainder instead of being killed mid-flight.
  const result = await sendBulk({
    recipients,
    budgetMs: SEND_BUDGET_MS,
    sendOne: ({ email, name }) => {
      const { subject, html } = buildMultiUnitLetter({ email, name, data });
        const text = buildMultiUnitText({ email, name, data });
      return sendEmail(email, subject, html, text);
    },
  });
  console.log(`Broadcast ${CAMPAIGN}: ${summarizeBulk(result)}`);
  return result;
}

// ── GET: preview · count · approval page · or draft to the approver ──────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get('preview') === '1') {
      if (process.env.NODE_ENV !== 'development') {
        const authErr = requireBroadcast(request, searchParams);
        if (authErr) return authErr;
      }
      if (searchParams.get('sample') === '1' && process.env.NODE_ENV === 'development') {
        const args = { email: 'preview@example.com', name: searchParams.get('name') || '', data: SAMPLE_DATA };
        if (searchParams.get('text') === '1') {
          return new Response(buildMultiUnitText(args), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }
        const { html } = buildMultiUnitLetter(args);
        return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      const { data, reason } = await fetchSnapshot(selfOrigin(request)).catch((e) => ({ data: null, reason: String(e) }));
      if (!data) {
        return NextResponse.json(
          { error: 'Cannot preview — live snapshot unavailable or failed validation', detail: reason },
          { status: 503 }
        );
      }
      const args = { email: 'preview@example.com', name: searchParams.get('name') || '', data };
      if (searchParams.get('text') === '1') {
        return new Response(buildMultiUnitText(args), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
      const { html } = buildMultiUnitLetter(args);
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
          'Send the multi-unit letter?',
          `<h1>Send the multi-unit letter?</h1>
           <p>It will go to <strong>${recipients.length} contact${recipients.length === 1 ? '' : 's'}</strong>, with the market snapshot re-fetched and re-validated live at send time. This can't be undone.</p>
           <form method="POST" action="/api/broadcast/multi-unit?approve=1&t=${approvalToken()}">
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
    const probe = await probeSendLock(supabase, CAMPAIGN);
    if (probe.alreadySent) {
      return NextResponse.json({
        alreadySent: true,
        campaign: CAMPAIGN,
        note: 'Campaign already sent — no draft emailed.',
      });
    }
    const { data, reason } = await fetchSnapshot(selfOrigin(request));
    if (!data) {
      console.warn('Multi-unit draft refused:', reason);
      return NextResponse.json(
        { error: 'Snapshot unavailable or failed validation — not drafting', detail: reason },
        { status: 500 }
      );
    }
    const recipients = await getBroadcastRecipients(supabase);
    const { html } = buildMultiUnitLetter({ email: APPROVER, name: 'Hamza', data });
    const draftHtml = approvalBanner(recipients.length, data, selfOrigin(request), probe.guardReady) + html;
    const ok = await sendEmail(
      APPROVER,
      `[APPROVE] Multi-unit letter — send to ${recipients.length} contact${recipients.length === 1 ? '' : 's'}?`,
      draftHtml,
      buildMultiUnitText({ email: APPROVER, name: 'Hamza', data })
    );
    return NextResponse.json({
      success: ok,
      mode: 'draft-for-approval',
      draftSentTo: APPROVER,
      recipients: recipients.length,
      guardReady: probe.guardReady,
      snapshot: {
        count: data.count, breakdown: data.breakdown,
        priceMin: data.priceMin, priceMax: data.priceMax,
        medianDOM: data.medianDOM, cutCount: data.cutCount,
      },
      next: 'Open the draft in your inbox and click "Review & Send".',
    });
  } catch (err) {
    console.error('Multi-unit broadcast (GET) error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST ?approve=1&t=... — the approved send ────────────────────────────────
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

    // Re-fetch and re-validate NOW — counts change daily, and the guard burns
    // this campaign's one shot the moment the lock row is written.
    const { data, reason } = await fetchSnapshot(selfOrigin(request));
    if (!data) {
      console.warn('Multi-unit send refused:', reason);
      return new Response(
        htmlPage('Not sent', `<h1>Send blocked — snapshot failed validation</h1><p>${reason || 'The live feed did not return a plausible multi-unit snapshot.'} Nothing was sent.</p>`),
        { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // FAIL-CLOSED idempotency — the mass-send happens ONLY if the lock row was
    // actually written. See lib/emails/broadcast-guard.js.
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

    const bulk = await sendToAll(recipients, data);
    return new Response(
      htmlPage(
        'Sent',
        `<h1>&#127881; Sent to ${bulk.sent} contact${bulk.sent === 1 ? '' : 's'}</h1>
         <p>${bulk.failed || bulk.remaining.length
            ? `<strong>${bulk.failed} failed${bulk.remaining.length ? `, ${bulk.remaining.length} not attempted &mdash; the run hit its time limit` : ''}.</strong> ${Object.entries(bulk.reasons).map(([st, v]) => `HTTP ${st} &times;${v.count}`).join(', ') || ''} Re-approve to send the rest.`
            : 'Every email went out successfully.'}</p>
         <a class="btn" href="https://www.mississaugainvestor.ca/admin">Open Admin</a>`
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err) {
    console.error('Multi-unit broadcast (POST) error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
