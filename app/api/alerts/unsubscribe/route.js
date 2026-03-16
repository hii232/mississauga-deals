import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Missing search ID', { status: 400 });
    }

    const { error } = await supabase
      .from('saved_searches')
      .update({ active: false })
      .eq('id', id);

    if (error) throw error;

    // Return a simple HTML confirmation page
    const html = `<!DOCTYPE html>
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
    <p>You won't receive any more deal alerts for this saved search. You can always set up new alerts on our site.</p>
    <a href="https://www.mississaugainvestor.ca/listings">Browse Listings</a>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return new Response('Something went wrong', { status: 500 });
  }
}
