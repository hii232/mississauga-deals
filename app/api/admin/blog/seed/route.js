import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SEED_POSTS } from '@/lib/blog/seed-posts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey && adminKey === process.env.ADMIN_SECRET) return true;
  const cronSecret = request.headers.get('authorization');
  if (cronSecret === `Bearer ${process.env.CRON_SECRET}`) return true;
  return false;
}

function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Publish the hand-written pillar posts in lib/blog/seed-posts.js.
 *
 * Idempotent: any slug that already exists is skipped rather than overwritten,
 * so re-running is safe and will never clobber an edit made in the admin UI.
 * Pass ?dryRun=1 to see what WOULD publish without writing anything.
 *
 *   curl -X POST https://www.mississaugainvestor.ca/api/admin/blog/seed \
 *        -H "x-admin-key: $ADMIN_SECRET"
 */
export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';

  try {
    const { data: existing, error: readErr } = await supabase
      .from('blog_posts')
      .select('slug');
    if (readErr) {
      return NextResponse.json({ error: 'Could not read existing posts: ' + readErr.message }, { status: 500 });
    }

    const existingSlugs = new Set((existing || []).map((p) => p.slug));
    const toInsert = SEED_POSTS.filter((p) => !existingSlugs.has(p.slug));
    const skipped = SEED_POSTS.filter((p) => existingSlugs.has(p.slug)).map((p) => p.slug);

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        wouldPublish: toInsert.map((p) => ({ slug: p.slug, title: p.title, words: p.content.split(/\s+/).length })),
        skipped,
      });
    }

    if (toInsert.length === 0) {
      return NextResponse.json({ published: [], skipped, message: 'All seed posts already exist.' });
    }

    const rows = toInsert.map((p) => ({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      category: p.category,
      // Cover images come from the site's own generated branded card, so a seed
      // post never depends on an external image host being reachable.
      cover_image_url: null,
      published: true,
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from('blog_posts')
      .insert(rows)
      .select('slug, title');

    if (insertErr) {
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }

    return NextResponse.json({
      published: inserted || [],
      skipped,
      note: 'Re-running is safe - existing slugs are skipped, never overwritten.',
    });
  } catch (err) {
    console.error('Blog seed error:', err);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
