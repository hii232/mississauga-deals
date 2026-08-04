-- SECURITY LOCKDOWN: enable RLS on every public table, drop every public policy.
--
-- 2026-08-04, from Supabase's security advisor email ("Table publicly
-- accessible - anyone with your project URL can read, edit, and delete all
-- data in this table"). Run ONCE in the SQL editor (Dashboard -> SQL Editor ->
-- paste -> Run), exactly like the em-dash fix.
--
-- WHY THIS IS SAFE TO RUN. Verified against the whole codebase first:
--   - Every single table access in the app (31 files, including /api/lead,
--     /api/track, /api/newsletter/subscribe, all admin routes) uses
--     SUPABASE_SERVICE_ROLE_KEY, which BYPASSES row-level security. Nothing
--     the site does needs a policy to keep working.
--   - The anon-key clients in lib/supabase/{client,server}.js are imported by
--     nothing; middleware uses the anon key only for auth.getUser(). No page
--     reads or writes a table from the browser.
--   So: RLS on everything + zero public policies = the app works exactly as
--   before, and the public API surface goes dark.
--
-- WHY THE EXISTING POLICIES MUST GO TOO. The advisor flags tables with RLS
-- DISABLED (leads - every name, email and phone this site has captured - plus
-- bookings, precon_projects and the other dashboard-created tables have no
-- migration and no RLS). But the tables WITH RLS are no better: every policy
-- in the old migrations is `USING (true)` with no TO clause, which applies to
-- ALL roles - the one named "Service role full access" actually granted the
-- ANON key full access, because the service role never consults policies at
-- all. The NEXT_PUBLIC_ anon key ships in the browser bundle of every visitor.
--
-- The single deliberate exception recreated below: anyone may read PUBLISHED
-- blog posts. That is public content by definition.

BEGIN;

-- 1) RLS on, everywhere. Dynamic so it also covers dashboard-created tables
--    (leads, bookings, precon_projects, analysis_cache) and anything added
--    since this file was written.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- 2) Drop EVERY policy in public. All of them are the permissive true/true
--    pattern; none is needed by the app (see header).
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- 3) The one intended public grant: published blog posts are public content.
--    Scoped with TO this time, and SELECT only.
CREATE POLICY "Public read published posts"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- 4) Verify inside the transaction.
--    First result: every row must show rowsecurity = true.
SELECT tablename, rowsecurity
FROM pg_tables WHERE schemaname = 'public'
ORDER BY tablename;

--    Second result: exactly ONE policy should remain - the blog read.
SELECT tablename, policyname, roles, cmd
FROM pg_policies WHERE schemaname = 'public';

-- If both checks look right, this COMMIT finishes it. If anything looks
-- wrong, run ROLLBACK; instead and nothing has changed.
COMMIT;
