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



-- Optional: auto-delete old records after 90 days to keep table lean
-- Uncomment if you want automatic cleanup:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-page-views', '0 3 * * *', $$DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '90 days'$$);

-- No policies on purpose: all app access uses the service role, which
-- bypasses RLS. A true/true policy here (the old pattern) had no TO clause
-- and granted the browser-shipped ANON key full access. See
-- enable_rls_lockdown.sql.
