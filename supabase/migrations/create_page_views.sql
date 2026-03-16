-- Create page_views table for visitor tracking
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date-range queries (analytics dashboard)
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at DESC);

-- Enable Row Level Security (allow inserts from anon, reads from service role)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Policy: allow anonymous inserts (tracking endpoint uses service role, but just in case)
CREATE POLICY "Allow inserts" ON page_views FOR INSERT WITH CHECK (true);

-- Policy: allow service role to read all
CREATE POLICY "Allow service role read" ON page_views FOR SELECT USING (true);

-- Optional: auto-delete old records after 90 days to keep table lean
-- Uncomment if you want automatic cleanup:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-page-views', '0 3 * * *', $$DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '90 days'$$);
