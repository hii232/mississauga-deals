CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  category TEXT DEFAULT 'General',
  cover_image_url TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, created_at DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- No service-role policy: the service role BYPASSES row-level security, so a
-- policy for it is dead weight - and the true/true one that used to sit here
-- had no TO clause, which granted the browser-shipped ANON key full
-- read/write/delete. See enable_rls_lockdown.sql.

CREATE POLICY "Public read published posts"
  ON blog_posts FOR SELECT
  TO anon, authenticated
  USING (published = true);
