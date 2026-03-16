import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple rate limiting
const rateMap = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const entries = rateMap.get(ip) || [];
  const recent = entries.filter((t) => now - t < 60000);
  if (recent.length >= 5) return true;
  recent.push(now);
  rateMap.set(ip, recent);
  return false;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { email, name, filters } = body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if this exact search already exists for this email
    const { data: existing } = await supabase
      .from('saved_searches')
      .select('id')
      .eq('email', cleanEmail)
      .eq('active', true);

    // Limit to 5 saved searches per email
    if (existing && existing.length >= 5) {
      return NextResponse.json(
        { error: 'Maximum 5 saved searches per email. Manage at /alerts.' },
        { status: 400 }
      );
    }

    // Save the search
    const { data, error } = await supabase
      .from('saved_searches')
      .insert({
        email: cleanEmail,
        name: name || null,
        filters: filters || {},
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    // Also capture as a lead (fire and forget)
    try {
      const leadUrl = new URL('/api/lead', request.url);
      await fetch(leadUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: name || '',
          source: 'saved-search',
          notes: `Saved search: ${JSON.stringify(filters || {}).substring(0, 200)}`,
        }),
      });
    } catch {
      // Lead capture is optional — don't fail the main request
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error('Subscribe error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('saved_searches')
      .select('id, filters, created_at, active')
      .eq('email', email.trim().toLowerCase())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ searches: data || [] });
  } catch (err) {
    console.error('Fetch searches error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
