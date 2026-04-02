import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export async function POST(request) {
  try {
    const { email, source, utm_source, utm_medium, utm_campaign } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!supabase) {
      return NextResponse.json({ ok: true, message: "You're in. First email arrives Monday." });
    }

    // Check if already in leads table (existing user/subscriber)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('email, source')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingLead) {
      // Check source to determine message
      if (existingLead.source === 'homepage_weekly_deals' || existingLead.source === 'newsletter') {
        return NextResponse.json({
          ok: true,
          message: "You're already subscribed. Check your inbox Monday.",
          existing: true,
        });
      }
      return NextResponse.json({
        ok: true,
        message: "You're already subscribed. Log in to customize your deal alerts.",
        existing: true,
      });
    }

    // Insert as new lead with newsletter source
    await supabase.from('leads').insert({
      email: normalizedEmail,
      source: source || 'homepage_weekly_deals',
      name: '',
      phone: '',
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
    });

    return NextResponse.json({
      ok: true,
      message: "You're in. First email arrives Monday.",
    });
  } catch (err) {
    console.error('Newsletter subscribe error:', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
