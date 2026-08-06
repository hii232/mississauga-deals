import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { sendBulk, summarizeBulk } from '@/lib/emails/send-bulk';
import { getSupabaseAdmin, getBroadcastRecipients } from '@/lib/emails/audience';
import { buildMarketReportData } from '@/lib/emails/market-report-data';
import { buildMarketReportEmail } from '@/lib/emails/market-report-email';
import { unsubscribeUrl } from '@/lib/unsubscribe-token';
import { tagRecipient } from '@/lib/emails/recipient-token';
import { requireBroadcast } from '@/lib/api-auth';
import { selfOrigin } from '@/lib/emails/self-origin';
import { acquireSendLock, BROADCAST_SENDS_SQL } from '@/lib/emails/broadcast-guard';
import {
  tRREBMonth,
  mississaugaMonthly as trrebMonthly,
  salesByType as trrebSalesByType,
  regional as trrebRegional,
} from '@/lib/market/trreb';

// ─────────────────────────────────────────────────────────────────────────────
//  "The Mississauga Monthly" - the TRREB report-day briefing.
//
//  A RECURRING campaign, unlike the one-off blasts this mirrors: the campaign
//  key is derived from the TRREB report code in the live stats payload
//  (market-report-mw2607, market-report-mw2608, ...), so each month's report
//  is automatically a fresh campaign while the send lock still makes each
//  edition strictly send-once. The approval token is keyed to the SAME derived
//  campaign, so an approval link minted for July's numbers can never authorize
//  sending August's.
//
//  The flow is the proven draft-first shape (motivated-sellers): the default
//  GET emails a draft to Hamza with an approve button; nothing reaches the
//  list until he clicks it; the approved POST re-fetches and re-verifies the
//  numbers, takes the fail-closed send lock, then fans out via sendBulk.
//
//  Compose-time refusal lives in lib/emails/market-report-data.js and is
//  stricter than the sibling campaigns in one way that defines this one: it
//  will not build the email at all unless the stats payload self-reports the
//  CURRENT TRREB report (tRREBIsStale false, tRREBReportsBehind 0). A "here
//  are this month's new numbers" email on last month's report would be a false
//  statement about what is new.
// ─────────────────────────────────────────────────────────────────────────────

// Same rationale as motivated-sellers: a cold market-stats recompute can take
// 60-90s, and the POST path also fans out the send.
export const maxDuration = 300;
const SEND_BUDGET_MS = 240000;
export const dynamic = 'force-dynamic';

const REPLY_TO =
  process.env.REPLY_TO_EMAIL ||
  process.env.LEAD_NOTIFICATION_EMAIL ||
  'hamza@nouman.ca';

const APPROVER =
  process.env.NEWSLETTER_APPROVER_EMAIL ||
  process.env.LEAD_NOTIFICATION_EMAIL ||
  'hamza@nouman.ca';

const campaignKey = (report) => `market-report-${String(report.code).toLowerCase()}`;

function approvalToken(campaign) {
  if (!process.env.CRON_SECRET) return 'dev';
  return createHmac('sha256', process.env.CRON_SECRET)
    .update(`broadcast-approve-${campaign}`)
    .digest('hex')
    .slice(0, 20);
}

// ── The report, fetched LIVE at compose time and re-verified before send ─────
async function fetchReport(origin) {
  const res = await fetch(`${origin}/api/market-stats`, { cache: 'no-store' });
  if (!res.ok) return { report: null, reason: `market-stats returned ${res.status}` };
  return buildMarketReportData(await res.json());
}

// Dev-preview layout data ONLY (?preview=1 in a sandbox with no reachable
// feed). The TRREB half is DERIVED from the single source (lib/market/trreb),
// never typed here - scripts/compliance-check.mjs fails the build on a second
// copy. Only the live-screener sample figures are literals, because they are
// live-feed numbers with no authoritative source in a sandbox; real drafts and
// sends never touch any of this - they refuse instead.
const SAMPLE_STATS = {
  tRREBIsStale: false,
  tRREBReportsBehind: 0,
  tRREBMonth,
  activeCount: 2424,
  medianDOM: 37,
  gtaAvgPrice: trrebRegional.gtaAvgPrice,
  gtaYoyChange: trrebRegional.gtaYoyChange,
  gtaNewListingsYoy: trrebRegional.gtaNewListingsYoy,
  gtaSales: trrebRegional.gtaSales,
  screener: { total: 2396, cfPlusCount: 5, bestCap: 5.94, priceDropCount: 412 },
  salesByType: trrebSalesByType,
  mississaugaMonthly: trrebMonthly,
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
      reply_to: REPLY_TO,
      // Stable per-edition key so the Resend webhook attributes opens/clicks.
      tags: [{ name: 'campaign', value: 'market-report' }],
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl(to)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });
  if (res.ok) return { ok: true, status: res.status };
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

function approvalBanner(count, report, origin) {
  const campaign = campaignKey(report);
  const url = `${origin}/api/broadcast/market-report?approve=1&t=${approvalToken(campaign)}`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto 4px;"><tr><td style="padding:16px 12px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#FEF3C7" style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:18px 22px;text-align:center;">
    <div style="font-family:system-ui,sans-serif;font-size:14px;font-weight:800;color:#92400E;margin-bottom:4px;">&#9998; DRAFT - ${report.monthLabel} edition, waiting for your approval</div>
    <div style="font-family:system-ui,sans-serif;font-size:12px;color:#92400E;margin-bottom:6px;">This is exactly what your <strong>${count}</strong> contact${count === 1 ? '' : 's'} will receive. Nothing sends until you click below.</div>
    <div style="font-family:system-ui,sans-serif;font-size:11px;color:#92400E;margin-bottom:14px;">${report.code}: ${report.now.sales} sales &middot; median $${Number(report.now.medianPrice).toLocaleString('en-CA')} &middot; SNLR ${report.now.snlr}%. The send re-verifies these numbers fresh.</div>
    <a href="${url}" style="display:inline-block;background:#0F2A4A;color:#ffffff;font-family:system-ui,sans-serif;font-size:14px;font-weight:700;padding:12px 26px;border-radius:8px;text-decoration:none;">Review &amp; Send to ${count} &#8594;</a>
  </td></tr></table>
</td></tr></table>`;
}

async function sendToAll(recipients, report) {
  const result = await sendBulk({
    recipients,
    budgetMs: SEND_BUDGET_MS,
    sendOne: ({ email, name }) => {
      const { subject, html } = buildMarketReportEmail({ email, name, report });
      return sendEmail(email, subject, html);
    },
  });
  console.log(`Broadcast ${campaignKey(report)}: ${summarizeBulk(result)}`);
  return result;
}

// ── GET: preview · count · approval page · or email the draft to the approver ──
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // ?preview=1 - render the email itself, send nothing.
    if (searchParams.get('preview') === '1') {
      if (process.env.NODE_ENV !== 'development') {
        const authErr = requireBroadcast(request, searchParams);
        if (authErr) return authErr;
      }
      let { report } = await fetchReport(selfOrigin(request)).catch(() => ({ report: null }));
      if (!report) report = buildMarketReportData(SAMPLE_STATS).report;
      const { html } = buildMarketReportEmail({
        email: 'preview@example.com',
        name: searchParams.get('name') || '',
        report,
      });
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // ?count=1 - reach of this broadcast right now.
    if (searchParams.get('count') === '1') {
      const authErr = requireBroadcast(request, searchParams);
      if (authErr) return authErr;
      const supabase = getSupabaseAdmin();
      const recipients = await getBroadcastRecipients(supabase);
      return NextResponse.json({ recipients: recipients.length });
    }

    // ?approve=1&t=... - confirmation page from the draft's button. The token
    // is verified against the campaign derived from TODAY'S report, so a link
    // minted for an older edition simply stops validating.
    if (searchParams.get('approve') === '1') {
      const { report, reason } = await fetchReport(selfOrigin(request));
      if (!report) {
        return new Response(
          htmlPage('Not available', `<h1>Report numbers unavailable</h1><p>${reason || 'The stats endpoint did not return a current report.'}</p>`),
          { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
      const campaign = campaignKey(report);
      if (searchParams.get('t') !== approvalToken(campaign)) {
        return new Response(
          htmlPage('Link expired', '<h1>This approval link is not valid</h1><p>It may belong to an earlier edition. Re-trigger the draft to get a fresh link for the current report.</p>'),
          { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
      const supabase = getSupabaseAdmin();
      const recipients = await getBroadcastRecipients(supabase);
      return new Response(
        htmlPage(
          'Send the monthly report?',
          `<h1>Send the ${report.monthLabel} market report?</h1>
           <p>It will go to <strong>${recipients.length} contact${recipients.length === 1 ? '' : 's'}</strong>, with the ${report.code} numbers re-verified at send time. Each edition can only ever be sent once.</p>
           <form method="POST" action="/api/broadcast/market-report?approve=1&t=${approvalToken(campaign)}">
             <button type="submit">Yes - Send to ${recipients.length} Contact${recipients.length === 1 ? '' : 's'}</button>
           </form>`
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Default (authed): email the draft with the approve button to Hamza only.
    const authErr = requireBroadcast(request, searchParams);
    if (authErr) return authErr;
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 });
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    const { report, reason } = await fetchReport(selfOrigin(request));
    if (!report) {
      return NextResponse.json(
        { error: 'Report numbers unavailable or not current - not drafting', detail: reason },
        { status: 500 }
      );
    }
    const campaign = campaignKey(report);
    // Self-disarm per EDITION: once this month's report has been sent, further
    // triggers (cron or manual) report that instead of re-drafting. Next
    // month's report changes the campaign key and arms it again.
    try {
      const { data: sent } = await supabase
        .from('broadcast_sends')
        .select('campaign_key')
        .eq('campaign_key', campaign)
        .maybeSingle();
      if (sent) {
        return NextResponse.json({
          alreadySent: true,
          campaign,
          note: `The ${report.monthLabel} edition already went out. The next report month arms a new edition automatically.`,
        });
      }
    } catch {
      // table missing - proceed; the send path fails closed regardless
    }
    const recipients = await getBroadcastRecipients(supabase);
    const { html } = buildMarketReportEmail({ email: APPROVER, name: 'Hamza', report });
    const draftHtml = approvalBanner(recipients.length, report, selfOrigin(request)) + html;
    const ok = await sendEmail(
      APPROVER,
      `[APPROVE] The Mississauga Monthly (${report.monthLabel}) - send to ${recipients.length}?`,
      draftHtml
    );
    return NextResponse.json({
      success: ok,
      mode: 'draft-for-approval',
      campaign,
      draftSentTo: APPROVER,
      recipients: recipients.length,
      headline: { median: report.now.medianPrice, avg: report.now.avgPrice, sales: report.now.sales },
      next: 'Open the draft in your inbox and click "Review & Send".',
    });
  } catch (err) {
    console.error('Market-report broadcast (GET) error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST ?approve=1&t=... - the approved send ────────────────────────────────
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('approve') !== '1') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const supabase = getSupabaseAdmin();
    if (!supabase || !process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email infrastructure not configured' }, { status: 500 });
    }

    // Re-fetch and re-verify NOW - the list receives these numbers, and the
    // token check below binds the click to this edition.
    const { report, reason } = await fetchReport(selfOrigin(request));
    if (!report) {
      return new Response(
        htmlPage('Not sent', `<h1>Send blocked - report numbers unavailable</h1><p>${reason || 'The stats endpoint did not return a current report.'} Nothing was sent.</p>`),
        { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    const campaign = campaignKey(report);
    if (searchParams.get('t') !== approvalToken(campaign)) {
      return new Response(
        htmlPage('Link expired', '<h1>This approval link is not valid</h1><p>It may belong to an earlier edition. Re-trigger the draft to get a fresh link.</p>'),
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // FAIL-CLOSED idempotency, one lock per edition.
    const lock = await acquireSendLock(supabase, campaign, APPROVER);
    if (lock.outcome === 'duplicate') {
      return new Response(
        htmlPage('Already sent', `<h1>The ${report.monthLabel} edition was already sent</h1><p>No duplicate emails went out.</p>`),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    if (lock.outcome !== 'acquired') {
      return new Response(
        htmlPage('Not sent', `<h1>Send blocked - duplicate protection unavailable</h1>
         <p>The broadcast_sends table could not be written (${String(lock.detail || '').replace(/[<>&]/g, ' ')}), so nothing is stopping this edition from going out twice. <strong>Nothing was sent.</strong></p>
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

    const bulk = await sendToAll(recipients, report);
    return new Response(
      htmlPage(
        'Sent',
        `<h1>&#128240; ${report.monthLabel} report sent to ${bulk.sent} contact${bulk.sent === 1 ? '' : 's'}</h1>
         <p>${bulk.failed || bulk.remaining.length
            ? `<strong>${bulk.failed} failed${bulk.remaining.length ? `, ${bulk.remaining.length} not attempted - the run hit its time limit` : ''}.</strong> ${Object.entries(bulk.reasons).map(([st, v]) => `HTTP ${st} &times;${v.count}`).join(', ') || ''}`
            : 'Every email went out successfully.'}</p>
         <a class="btn" href="https://www.mississaugainvestor.ca/admin">Open Admin</a>`
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err) {
    console.error('Market-report broadcast (POST) error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
