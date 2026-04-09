import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

function checkAuth(request) {
  const key = request.headers.get('x-admin-key');
  return key && key === process.env.ADMIN_SECRET;
}

// ── GET: Fetch all projects ───────────────────────────
export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data: projects, error } = await supabase
    .from('precon_projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const selling = (projects || []).filter(p => p.status === 'Selling').length;
  const comingSoon = (projects || []).length - selling;

  return NextResponse.json({
    projects: projects || [],
    stats: { total: (projects || []).length, selling, comingSoon },
  });
}

// ── POST: Create a new project ────────────────────────
export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { name, developer, city, area, type, storeys, units, price_from, status, completion, image_url, featured } = body;

  if (!name || !city) {
    return NextResponse.json({ error: 'Name and city are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('precon_projects')
    .insert({
      name,
      developer: developer || '',
      city,
      area: area || '',
      type: type || 'Condo',
      storeys: storeys || null,
      units: units || null,
      price_from: price_from || null,
      status: status || 'Selling',
      completion: completion || 'TBD',
      image_url: image_url || null,
      featured: featured || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data });
}

// ── PATCH: Update a project ───────────────────────────
export async function PATCH(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  const fields = ['name', 'developer', 'city', 'area', 'type', 'storeys', 'units', 'price_from', 'status', 'completion', 'image_url', 'featured', 'sort_order'];
  fields.forEach(f => {
    if (body[f] !== undefined) updates[f] = body[f];
  });

  const { data, error } = await supabase
    .from('precon_projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data });
}

// ── DELETE: Delete a project ──────────────────────────
export async function DELETE(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('precon_projects')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
