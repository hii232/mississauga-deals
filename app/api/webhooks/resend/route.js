import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyResendSignature, normalizeEvent } from '@/lib/emails/resend-webhook';

// Resend calls this; it cannot be static or cached.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

/**
 * Resend → Svix webhook receiver for delivery/open/click events.
 *
 * PUBLIC ENDPOINT. The Svix signature is the only thing between the internet
 * and forged campaign analytics, so verification happens BEFORE the body is
 * parsed or anything is written, and it is fail-closed: with no
 * RESEND_WEBHOOK_SECRET configured, every request is rejected rather than
 * trusted (see lib/emails/resend-webhook.js, 37 tests).
 *
 * Status codes matter here — Svix retries on non-2xx:
 *   401  bad/missing signature   → retrying is correct, it may be misconfig
 *   200  accepted, or a duplicate, or an event type we don't track
 *   500  storage failed          → retry, the unique event_id makes that safe
 */
export async function POST(request) {
  // MUST read the raw text: re-serialising a parsed body changes the bytes and
  // the signature would never match.
  const raw = await request.text();

  const verdict = verifyResendSignature({
    secret: process.env.RESEND_WEBHOOK_SECRET,
    id: request.headers.get('svix-id'),
    timestamp: request.headers.get('svix-timestamp'),
    signature: request.headers.get('svix-signature'),
    body: raw,
  });
  if (!verdict.ok) {
    console.warn('Resend webhook rejected:', verdict.reason);
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    // Signed but unparseable — retrying won't help, so 200 to stop the loop.
    return NextResponse.json({ ok: true, ignored: 'unparseable body' });
  }

  const row = normalizeEvent(payload, request.headers.get('svix-id'));
  if (!row) return NextResponse.json({ ok: true, ignored: payload?.type || 'unknown type' });

  if (!supabase) {
    console.error('Resend webhook: Supabase not configured, event dropped:', row.type);
    return NextResponse.json({ error: 'storage unavailable' }, { status: 500 });
  }

  const { error } = await supabase.from('email_events').insert(row);
  if (error) {
    // Duplicate = Svix retried a delivery we already stored. That is success,
    // and swallowing it is what keeps the counts honest.
    if (error.code === '23505' || /duplicate/i.test(error.message || '')) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error('Resend webhook insert failed:', error.message);
    return NextResponse.json({ error: 'insert failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, type: row.type });
}

// A GET is handy for confirming the route is deployed before pasting the URL
// into Resend. It reveals only whether config exists, never the secret.
export async function GET() {
  return NextResponse.json({
    endpoint: 'resend-webhook',
    ready: !!process.env.RESEND_WEBHOOK_SECRET && !!supabase,
    secretConfigured: !!process.env.RESEND_WEBHOOK_SECRET,
    storageConfigured: !!supabase,
  });
}
