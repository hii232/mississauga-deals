import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// GET /api/check-access?email=user@example.com
// Returns { access: true/false } — used by frontend to verify a signed-up user still has access
//
// Responses are user-specific; CDN must never serve one visitor's result to
// another. private+no-store blocks every intermediate cache layer.
const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get('email') || '').trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ access: false }, { headers: NO_STORE });
  }

  if (!supabase) {
    // If Supabase isn't configured, allow access by default
    return NextResponse.json({ access: true }, { headers: NO_STORE });
  }

  const { data, error } = await supabase
    .from('leads')
    .select('access_revoked')
    .eq('email', email)
    .limit(1)
    .single();

  if (error || !data) {
    // Lead not found — no access
    return NextResponse.json({ access: false }, { headers: NO_STORE });
  }

  return NextResponse.json({ access: !data.access_revoked }, { headers: NO_STORE });
}
