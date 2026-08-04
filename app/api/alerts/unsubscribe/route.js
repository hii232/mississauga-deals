import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unsubscribeTokenValid } from '@/lib/unsubscribe-token';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

function page({ title, message, form }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | MississaugaInvestor.ca</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
    .card { background: white; border-radius: 16px; padding: 48px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); box-sizing: border-box; }
    h1 { color: #1B2A4A; font-size: 24px; margin: 0 0 12px; }
    p { color: #64748B; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
    a.btn, button.btn { display: inline-block; background: #2563EB; color: white; padding: 12px 28px; border: none; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; cursor: pointer; font-family: inherit; }
    a.btn:hover, button.btn:hover { background: #1D4ED8; }
    button.ghost { display: block; margin: 14px auto 0; background: none; border: none; color: #94A3B8; font-size: 13px; text-decoration: underline; cursor: pointer; font-family: inherit; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    ${form || '<a class="btn" href="https://www.mississaugainvestor.ca/listings">Browse Listings</a>'}
  </div>
</body>
</html>`;
}

// A GET request from a real click and a GET request from an email-security
// gateway's link scanner (Defender for Office 365 Safe Links, Proofpoint,
// Mimecast - all of which prefetch links in incoming mail before the
// recipient opens it) are indistinguishable at the HTTP level. This route
// used to unsubscribe on GET, so every alert email's visible "Unsubscribe"
// link was a live trigger any scanner could fire before the subscriber ever
// read the message - silently killing their alerts with no action on their
// part and no way for the site to tell "unsubscribed" from "scanned".
//
// GET now only ever READS and renders a confirm page; the actual mutation
// happens in POST, behind a real click on that page's button. The
// RFC 8058 List-Unsubscribe-Post header (below) already POSTs directly and is
// unaffected - mail clients only send that on an explicit user action, and it
// never touches this GET handler.
export async function GET(request) {
  try {
    if (!supabase) {
      return new Response('Alerts are temporarily unavailable', { status: 503 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    const token = searchParams.get('t') || '';

    // ── Per-search unsubscribe (daily deal alert emails link with ?id=) ──
    if (id) {
      const { data: search } = await supabase
        .from('saved_searches')
        .select('id, active')
        .eq('id', id)
        .maybeSingle();

      if (!search) {
        return new Response(
          page({
            title: 'Link no longer valid',
            message: "This unsubscribe link doesn't match a saved search - it may already have been removed.",
          }),
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
      if (!search.active) {
        return new Response(
          page({
            title: "You're already unsubscribed",
            message: "This saved search isn't sending alerts anymore.",
          }),
          { headers: { 'Content-Type': 'text/html' } }
        );
      }

      return new Response(
        page({
          title: 'Stop these deal alerts?',
          message: "You'll stop receiving emails for this saved search. You can always set up new alerts on our site.",
          form: `<form method="POST" action="/api/alerts/unsubscribe?id=${encodeURIComponent(id)}">
            <button type="submit" class="btn">Yes, unsubscribe this search</button>
          </form>`,
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // ── Email-level unsubscribe (weekly newsletter links with ?email=&t=) ──
    if (email) {
      const normalized = email.toLowerCase().trim();
      if (!unsubscribeTokenValid(normalized, token)) {
        return new Response('Invalid unsubscribe link', { status: 400 });
      }

      return new Response(
        page({
          title: 'Stop all emails?',
          message: "You'll stop receiving the weekly report and deal alerts. You're welcome back anytime.",
          form: `<form method="POST" action="/api/alerts/unsubscribe?email=${encodeURIComponent(normalized)}&t=${encodeURIComponent(token)}">
            <button type="submit" class="btn">Yes, unsubscribe me</button>
          </form>`,
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new Response('Missing unsubscribe parameters', { status: 400 });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return new Response('Something went wrong', { status: 500 });
  }
}

// Performs the actual mutation. Reached two ways:
// (1) A real click on the confirm button GET renders above (browser POST,
//     gets the HTML page back).
// (2) RFC 8058 one-click: mail clients POST directly to the
//     List-Unsubscribe header URL (email+token only) when a subscriber uses
//     their client's native "Unsubscribe" button - never via GET, so this was
//     already correctly un-mutating-on-fetch before this change.
export async function POST(request) {
  try {
    if (!supabase) return new Response('Unavailable', { status: 503 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    const token = searchParams.get('t') || '';

    // ── Per-search unsubscribe ──
    if (id) {
      const { error } = await supabase
        .from('saved_searches')
        .update({ active: false })
        .eq('id', id);
      if (error) throw error;

      return new Response(
        page({
          title: "You've been unsubscribed",
          message: "You won't receive any more deal alerts for this saved search. You can always set up new alerts on our site.",
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // ── Email-level unsubscribe ──
    if (!email) return new Response('Missing email', { status: 400 });

    const normalized = email.toLowerCase().trim();
    if (!unsubscribeTokenValid(normalized, token)) {
      return new Response('Invalid unsubscribe link', { status: 400 });
    }

    await supabase.from('leads').update({ status: 'unsubscribed' }).eq('email', normalized);
    // Unsubscribing from email should stop ALL email - deal alerts included
    await supabase.from('saved_searches').update({ active: false }).eq('email', normalized);

    return new Response(
      page({
        title: "You've been unsubscribed",
        message: "You won't receive the weekly report or deal alerts anymore. You're welcome back anytime.",
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err) {
    console.error('One-click unsubscribe error:', err);
    return new Response('Something went wrong', { status: 500 });
  }
}
