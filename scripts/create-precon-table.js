/**
 * Run this script to create the precon_projects table in Supabase.
 * Usage: node scripts/create-precon-table.js
 *
 * Alternatively, copy the SQL below and paste it into your
 * Supabase Dashboard > SQL Editor > New Query > Run
 */

const SQL = `
-- =============================================
-- Pre-Construction Projects Table
-- =============================================

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

-- Enable Row Level Security
ALTER TABLE precon_projects ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public can read projects"
  ON precon_projects FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access on precon"
  ON precon_projects FOR ALL USING (true);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_precon_city ON precon_projects(city);
CREATE INDEX IF NOT EXISTS idx_precon_status ON precon_projects(status);
CREATE INDEX IF NOT EXISTS idx_precon_sort ON precon_projects(sort_order);

-- =============================================
-- Storage bucket for project images
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('precon-images', 'precon-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read on precon-images (check if policy exists first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read precon images' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public read precon images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'precon-images');
  END IF;
END $$;

-- Service role upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service upload precon images' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Service upload precon images"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'precon-images');
  END IF;
END $$;
`;

console.log('='.repeat(60));
console.log('SUPABASE SQL MIGRATION — Pre-Construction Projects');
console.log('='.repeat(60));
console.log('');
console.log('Copy this SQL and run it in:');
console.log('  Supabase Dashboard > SQL Editor > New Query > Run');
console.log('');
console.log('='.repeat(60));
console.log(SQL);
console.log('='.repeat(60));
