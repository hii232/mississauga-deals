import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unsubscribeTokenValid } from '@/lib/unsubscribe-token';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

function confirmationPage(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed | MississaugaInvestor.ca</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: white; border-radius: 16px; padding: 48px; max-width: 420px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    h1 { color: #1B2A4A; font-size: 24px; margin: 0 0 12px; }
    p { color: #64748B; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; background: #2563EB; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; }
    a:hover { background: #1D4ED8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>You've been unsubscribed</h1>
    <p>${message}</p>
    <a href="https://www.mississaugainvestor.ca/listings">Browse Listings</a>
  </div>
</body>
</html>`;
}

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
      const { error } = await supabase
        .from('saved_searches')
        .update({ active: false })
        .eq('id', id);
      if (error) throw error;

      return new Response(
        confirmationPage(
          "You won't receive any more deal alerts for this saved search. You can always set up new alerts on our site."
        ),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // ── Email-level unsubscribe (weekly newsletter links with ?email=&t=) ──
    if (email) {
      const normalized = email.toLowerCase().trim();
      if (!unsubscribeTokenValid(normalized, token)) {
        return new Response('Invalid unsubscribe link', { status: 400 });
      }

      await supabase
        .from('leads')
        .update({ status: 'unsubscribed' })
        .eq('email', normalized);
      // Unsubscribing from email should stop ALL email — deal alerts included
      await supabase
        .from('saved_searches')
        .update({ active: false })
        .eq('email', normalized);

      return new Response(
        confirmationPage(
          "You won't receive the weekly report or deal alerts anymore. You're welcome back anytime."
        ),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new Response('Missing unsubscribe parameters', { status: 400 });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return new Response('Something went wrong', { status: 500 });
  }
}

// RFC 8058 one-click unsubscribe: mail clients POST to the List-Unsubscribe URL
export async function POST(request) {
  try {
    if (!supabase) return new Response('Unavailable', { status: 503 });
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('t') || '';
    if (!email) return new Response('Missing email', { status: 400 });

    const normalized = email.toLowerCase().trim();
    if (!unsubscribeTokenValid(normalized, token)) {
      return new Response('Invalid unsubscribe link', { status: 400 });
    }

    await supabase.from('leads').update({ status: 'unsubscribed' }).eq('email', normalized);
    await supabase.from('saved_searches').update({ active: false }).eq('email', normalized);
    return new Response('Unsubscribed', { status: 200 });
  } catch (err) {
    console.error('One-click unsubscribe error:', err);
    return new Response('Something went wrong', { status: 500 });
  }
}
