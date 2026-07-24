import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  PROPERTY_TYPES,
  STRATEGY_CHIPS,
  SORT_OPTIONS,
  NEIGHBOURHOODS,
} from '@/components/listings/filter-utils';

// Sanitize a saved-search filter object into the SAME canonical shape the
// listings page uses (DEFAULT_FILTERS) so /api/alerts/send can feed it straight
// into applyFilters. Only non-default, validated values are kept — everything
// else is dropped. Previously this route whitelisted a stale, unused key shape
// (minPrice/hood/…) so every saved search stored {} and every subscriber got
// the global top-N instead of the deals they actually searched for.
function sanitizeSavedFilters(raw) {
  const clean = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return clean;

  if (typeof raw.search === 'string' && raw.search.trim()) {
    clean.search = raw.search.trim().slice(0, 100);
  }
  if (
    typeof raw.propertyType === 'string' &&
    raw.propertyType !== 'All' &&
    PROPERTY_TYPES.includes(raw.propertyType)
  ) {
    clean.propertyType = raw.propertyType;
  }
  if (Array.isArray(raw.activeStrategies)) {
    const valid = raw.activeStrategies.filter((k) => STRATEGY_CHIPS.some((c) => c.key === k));
    if (valid.length) clean.activeStrategies = valid.slice(0, 12);
  }
  if (
    typeof raw.sortKey === 'string' &&
    raw.sortKey !== 'score' &&
    SORT_OPTIONS.some((o) => o.key === raw.sortKey)
  ) {
    clean.sortKey = raw.sortKey;
  }
  const bounded2 = (arr, lo, hi) => {
    if (!Array.isArray(arr) || arr.length !== 2) return null;
    let a = Number(arr[0]);
    let b = Number(arr[1]);
    a = Number.isFinite(a) ? Math.min(Math.max(a, lo), hi) : lo;
    b = Number.isFinite(b) ? Math.min(Math.max(b, lo), hi) : hi;
    if (a > b) [a, b] = [b, a];
    return [a, b];
  };
  const price = bounded2(raw.priceRange, 0, 3000000);
  if (price && (price[0] > 0 || price[1] < 3000000)) clean.priceRange = price;
  const dom = bounded2(raw.domRange, 0, 365);
  if (dom && (dom[0] > 0 || dom[1] < 365)) clean.domRange = dom;

  for (const key of ['beds', 'baths']) {
    const v = Number(raw[key]);
    if (Number.isFinite(v) && v > 0) clean[key] = Math.min(Math.floor(v), 10);
  }
  const numeric = {
    minCapRate: [0, 100],
    minCashFlow: [-100000, 100000],
    minCashOnCash: [-100, 100],
    minDealScore: [0, 10],
  };
  for (const [key, [min, max]] of Object.entries(numeric)) {
    if (raw[key] === undefined || raw[key] === null) continue;
    const v = Number(raw[key]);
    if (Number.isFinite(v)) clean[key] = Math.min(Math.max(v, min), max);
  }
  if (Array.isArray(raw.neighbourhoods)) {
    const valid = raw.neighbourhoods.filter((n) => NEIGHBOURHOODS.includes(n));
    if (valid.length) clean.neighbourhoods = valid.slice(0, 24);
  }
  for (const key of ['lrtOnly', 'hasBasementSuite', 'isPowerOfSale']) {
    if (raw[key] === true) clean[key] = true;
  }
  return clean;
}

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

    // Sanitize filters into the canonical listings filter shape (see helper)
    const cleanFilters = sanitizeSavedFilters(filters);

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
