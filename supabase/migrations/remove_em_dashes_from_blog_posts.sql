-- One-time data fix: remove every em dash from stored blog posts.
--
-- 2026-08-04. The repo-side sweep replaced every em dash in the site's own
-- copy with a plain hyphen, and the auto-blog prompt now forbids them in new
-- posts - but posts ALREADY stored in this table render verbatim, so they
-- keep their em dashes until this runs. Run it once in the Supabase SQL
-- editor (Dashboard -> SQL Editor -> paste -> Run).
--
-- Notes on how it's written:
--   - chr(8212) is the em dash. Written as chr() rather than the literal
--     character so the file survives copy-paste through any editor or
--     encoding without silently becoming a different dash.
--   - The two entity spellings (&mdash; / &#8212;) are replaced too, in case
--     any post carries the HTML form rather than the character.
--   - slug is deliberately NOT touched: slugs are URLs, and rewriting them
--     would break every inbound link and Google's index of the post.
--   - The WHERE clause limits the UPDATE to rows that actually contain one,
--     so updated_at is not bumped on clean posts.

-- 1) Preview: how many posts carry an em dash (expect this to match the
--    row count the UPDATE reports).
SELECT count(*) AS posts_with_em_dashes
FROM blog_posts
WHERE title    LIKE '%' || chr(8212) || '%'
   OR excerpt  LIKE '%' || chr(8212) || '%'
   OR content  LIKE '%' || chr(8212) || '%'
   OR title    LIKE '%&mdash;%'  OR excerpt LIKE '%&mdash;%'  OR content LIKE '%&mdash;%'
   OR title    LIKE '%&#8212;%'  OR excerpt LIKE '%&#8212;%'  OR content LIKE '%&#8212;%';

-- 2) The fix.
BEGIN;

UPDATE blog_posts
SET
  title = replace(replace(replace(title, chr(8212), '-'), '&mdash;', '-'), '&#8212;', '-'),
  excerpt = replace(replace(replace(excerpt, chr(8212), '-'), '&mdash;', '-'), '&#8212;', '-'),
  content = replace(replace(replace(content, chr(8212), '-'), '&mdash;', '-'), '&#8212;', '-'),
  updated_at = now()
WHERE title    LIKE '%' || chr(8212) || '%'
   OR excerpt  LIKE '%' || chr(8212) || '%'
   OR content  LIKE '%' || chr(8212) || '%'
   OR title    LIKE '%&mdash;%'  OR excerpt LIKE '%&mdash;%'  OR content LIKE '%&mdash;%'
   OR title    LIKE '%&#8212;%'  OR excerpt LIKE '%&#8212;%'  OR content LIKE '%&#8212;%';

-- 3) Verify inside the same transaction: must return 0.
SELECT count(*) AS remaining_em_dashes
FROM blog_posts
WHERE title    LIKE '%' || chr(8212) || '%'
   OR excerpt  LIKE '%' || chr(8212) || '%'
   OR content  LIKE '%' || chr(8212) || '%'
   OR title    LIKE '%&mdash;%'  OR excerpt LIKE '%&mdash;%'  OR content LIKE '%&mdash;%'
   OR title    LIKE '%&#8212;%'  OR excerpt LIKE '%&#8212;%'  OR content LIKE '%&#8212;%';

-- If remaining_em_dashes is 0, commit. If anything looks wrong, run ROLLBACK;
-- instead and nothing has changed.
COMMIT;
