import { NextResponse } from 'next/server';

function checkAuth(request) {
  const key = request.headers.get('x-admin-key');
  return key && key === process.env.ADMIN_SECRET;
}

export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  // Extract project ref from URL
  const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

  const sql = `
    CREATE TABLE IF NOT EXISTS precon_projects (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      developer TEXT DEFAULT '',
      city TEXT NOT NULL,
      area TEXT DEFAULT '',
      type TEXT DEFAULT 'Condo',
      storeys INTEGER,
      units INTEGER,
      price_from INTEGER,
      status TEXT DEFAULT 'Selling',
      completion TEXT DEFAULT 'TBD',
      image_url TEXT,
      featured BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    ALTER TABLE precon_projects ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read precon' AND tablename = 'precon_projects') THEN
        CREATE POLICY "Public can read precon" ON precon_projects FOR SELECT USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service full access precon' AND tablename = 'precon_projects') THEN
        CREATE POLICY "Service full access precon" ON precon_projects FOR ALL USING (true);
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS idx_precon_city ON precon_projects(city);
    CREATE INDEX IF NOT EXISTS idx_precon_status ON precon_projects(status);
    CREATE INDEX IF NOT EXISTS idx_precon_sort ON precon_projects(sort_order);

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('precon-images', 'precon-images', true)
    ON CONFLICT (id) DO NOTHING;
  `;

  // Try multiple approaches to run SQL

  // Approach 1: Supabase Management API (requires access token, unlikely to work)
  // Approach 2: pg-meta SQL endpoint
  const endpoints = [
    `${SUPABASE_URL}/pg/query`,
    `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      });
      if (res.ok) {
        return NextResponse.json({ success: true, method: endpoint });
      }
    } catch {}
  }

  // If automated methods fail, return the SQL for manual execution
  return NextResponse.json({
    success: false,
    message: 'Could not auto-create table. Please run the SQL manually in Supabase Dashboard > SQL Editor.',
    sql: sql.trim(),
    dashboard_url: `https://supabase.com/dashboard/project/${projectRef}/sql/new`,
  });
}
