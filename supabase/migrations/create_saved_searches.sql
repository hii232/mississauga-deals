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

CREATE POLICY "Allow public inserts" ON saved_searches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role all" ON saved_searches FOR ALL USING (true);
