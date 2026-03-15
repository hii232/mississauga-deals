import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { name, email, phone, listingId, listingAddress, listingPrice, source, notes, timestamp } = body;

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  // If Supabase is configured, check for duplicates and insert
  if (supabase) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .limit(1)
      .single();

    if (existing) {
      // Email already exists — still allow login, just don't create a duplicate lead
      return NextResponse.json({ success: true, existing: true });
    }

    const { error: insertError } = await supabase.from('leads').insert({
      name,
      email: email.toLowerCase().trim(),
      phone: phone || null,
      listing_id: listingId || null,
      listing_address: listingAddress || null,
      listing_price: listingPrice || null,
      source: source || 'unknown',
      notes: notes || null,
      created_at: timestamp || new Date().toISOString(),
    });

    if (insertError) {
      console.error('Lead insert error:', insertError);
      // Still return success so the user can sign up
    }
  }

  const lead = { name, email, listingId, listingAddress, listingPrice, source, timestamp };
  console.log('NEW LEAD:', JSON.stringify(lead));

  return NextResponse.json({ success: true });
}
