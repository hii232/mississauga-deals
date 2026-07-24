import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeSavedSearchFilters } from '@/lib/alerts/sanitize-filters';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

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
    if (!supabase) {
      return NextResponse.json({ error: 'Alerts are temporarily unavailable' }, { status: 503 });
    }
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { email, name, filters } = body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    if (name && (typeof name !== 'string' || name.length > 100)) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    // Sanitize into the CANONICAL client/applyFilters filter shape — the same
    // shape the Save-Search button sends and the daily cron consumes. (The old
    // allow-list here was a disjoint legacy format, so every saved search
    // stored ~empty filters and alerts matched everything.) Legacy simple keys
    // (minPrice/maxPrice/minBeds/type/hood/minScore) are mapped in for
    // backward compatibility.
    const cleanFilters = sanitizeSavedSearchFilters(filters);

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
        filters: cleanFilters,
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
          notes: `Saved search: ${JSON.stringify(cleanFilters).substring(0, 200)}`,
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
    if (!supabase) {
      return NextResponse.json({ error: 'Alerts are temporarily unavailable' }, { status: 503 });
    }
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
