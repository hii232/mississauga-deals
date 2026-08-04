CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches (active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_email ON saved_searches (email);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- No policies on purpose: all app access uses the service role, which
-- bypasses RLS. A true/true policy here (the old pattern) had no TO clause
-- and granted the browser-shipped ANON key full access. See
-- enable_rls_lockdown.sql.
