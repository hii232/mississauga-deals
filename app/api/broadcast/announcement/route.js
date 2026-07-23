import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { getSupabaseAdmin, getBroadcastRecipients } from '@/lib/emails/audience';
import { buildAnnouncementEmail } from '@/lib/emails/announcement-email';
import { unsubscribeUrl } from '@/lib/unsubscribe-token';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// One-off campaign id. Powers the approval token + the "already sent" guard, so
// the whole database can never be double-mailed.
const CAMPAIGN = 'platform-launch';

const APPROVER =
  process.env.NEWSLETTER_APPROVER_EMAIL ||
  process.env.LEAD_NOTIFICATION_EMAIL ||
  'hamza@nouman.ca';

// ── Auth: cron Bearer, admin header, or ?key= (so a human can trigger the draft
// from a browser). The actual send needs the HMAC token from the draft email. ──
function isAuthorized(request, searchParams) {
  const bearer = request.headers.get('authorization');
  if (process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`) return true;
  const adminKey = request.headers.get('x-admin-key');
  if (process.env.ADMIN_SECRET && adminKey === process.env.ADMIN_SECRET) return true;
  const key = searchParams?.get('key');
  if (key && (key === process.env.ADMIN_SECRET || key === process.env.CRON_SECRET)) return true;
  return false;
}

function approvalToken() {
  if (!process.env.CRON_SECRET) return 'dev';
  return createHmac('sha256', process.env.CRON_SECRET)
    .update(`broadcast-approve-${CAMPAIGN}`)
    .digest('hex')
    .slice(0, 20);
}

// ── Latest published blog posts for the "Fresh from the blog" section ──
async function fetchLatestPosts(supabase) {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('blog_posts')
      .select('title, slug, excerpt')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3);
    return data || [];
  } catch {
    return [];
  }
}

// Shown only in ?preview=1 when this sandbox has no database, so the blog
// section is visible in the design. Real sends always use live posts.
const SAMPLE_POSTS = [
  { title: 'Where cash flow still pencils in the GTA (2026)', slug: 'sample-cash-flow', excerpt: 'The pockets where rent still covers the carrying costs — and the ones to steer clear of this year.' },
  { title: 'Hurontario LRT: which corridors reprice first', slug: 'sample-lrt', excerpt: 'The stops likely to move values as the line opens, and the timing an investor should watch.' },
  { title: 'Duplex vs. condo: the real 5-year return', slug: 'sample-duplex-vs-condo', excerpt: 'A side-by-side on cash flow, appreciation and the headaches nobody mentions.' },
];

// ── Send one email via Resend, with native one-click unsubscribe headers ──
async function sendEmail(to, subject, html) {
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

// ── Simple styled confirmation/result page ──
function htmlPage(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#F8FAFC;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;}
.card{background:#fff;border-radius:16px;padding:40px;max-width:460px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
h1{color:#1B2A4A;font-size:22px;margin:0 0 12px;}p{color:#64748B;font-size:15px;line-height:1.6;margin:0 0 20px;}
button,a.btn{display:inline-block;background:#2563EB;color:#fff;border:none;cursor:pointer;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;}</style>
</head><body><div class="card">${body}</div></body></html>`;
}

// ── Draft banner prepended to the announcement when it's sent for approval ──
function approvalBanner(count) {
  const url = `https://www.mississaugainvestor.ca/api/broadcast/announcement?approve=1&t=${approvalToken()}`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto 4px;"><tr><td style="padding:16px 12px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#FEF3C7" style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:18px 22px;text-align:center;">
    <div style="font-family:system-ui,sans-serif;font-size:14px;font-weight:800;color:#92400E;margin-bottom:4px;">&#9998; DRAFT — waiting for your approval</div>
    <div style="font-family:system-ui,sans-serif;font-size:12px;color:#92400E;margin-bottom:14px;">This is exactly what your <strong>${count}</strong> contact${count === 1 ? '' : 's'} will receive. Nothing sends until you click below.</div>
    <a href="${url}" style="display:inline-block;background:#0F2A4A;color:#ffffff;font-family:system-ui,sans-serif;font-size:14px;font-weight:700;padding:12px 26px;border-radius:8px;text-decoration:none;">Review &amp; Send to ${count} &#8594;</a>
  </td></tr></table>
</td></tr></table>`;
}

// ── Fan out to the whole list in small batches ──
async function sendToAll(recipients, posts) {
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < recipients.length; i += 10) {
    const batch = recipients.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(({ email, name }) => {
        const { subject, html } = buildAnnouncementEmail({ email, name, posts });
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
      if (process.env.NODE_ENV !== 'development' && !isAuthorized(request, searchParams)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      let posts = await fetchLatestPosts(getSupabaseAdmin());
      if (!posts.length) posts = SAMPLE_POSTS;
      const { html } = buildAnnouncementEmail({
        email: 'preview@example.com',
        name: searchParams.get('name') || '',
        posts,
      });
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // ?count=1 — how many contacts this broadcast would reach right now.
    if (searchParams.get('count') === '1') {
      if (!isAuthorized(request, searchParams)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
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
          'Send the announcement?',
          `<h1>Send this announcement?</h1>
           <p>It will go to <strong>${recipients.length} contact${recipients.length === 1 ? '' : 's'}</strong> in your database. This can't be undone.</p>
           <form method="POST" action="/api/broadcast/announcement?approve=1&t=${approvalToken()}">
             <button type="submit">Yes — Send to ${recipients.length} Contact${recipients.length === 1 ? '' : 's'}</button>
           </form>`
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Default (authed) — email the DRAFT (with approval button) to the approver only.
    if (!isAuthorized(request, searchParams)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 });
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    const recipients = await getBroadcastRecipients(supabase);
    const posts = await fetchLatestPosts(supabase);
    const { html } = buildAnnouncementEmail({ email: APPROVER, name: 'Hamza', posts });
    const draftHtml = approvalBanner(recipients.length) + html;
    const ok = await sendEmail(
      APPROVER,
      `[APPROVE] Announcement email — send to ${recipients.length} contact${recipients.length === 1 ? '' : 's'}?`,
      draftHtml
    );
    return NextResponse.json({
      success: ok,
      mode: 'draft-for-approval',
      draftSentTo: APPROVER,
      recipients: recipients.length,
      next: 'Open the draft in your inbox and click "Review & Send".',
    });
  } catch (err) {
    console.error('Announcement broadcast (GET) error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
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

    // One send per campaign. Uses broadcast_sends (unique campaign_key) when the
    // table exists; proceeds without the guard if it doesn't.
    try {
      const { error: guardErr } = await supabase
        .from('broadcast_sends')
        .insert({ campaign_key: CAMPAIGN, approved_by: APPROVER });
      if (guardErr && (guardErr.code === '23505' || /duplicate/i.test(guardErr.message || ''))) {
        return new Response(
          htmlPage('Already sent', '<h1>This announcement was already sent</h1><p>No duplicate emails went out.</p>'),
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

    const posts = await fetchLatestPosts(supabase);
    const { sent, failed } = await sendToAll(recipients, posts);
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
    console.error('Announcement broadcast (POST) error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
