import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

function checkAuth(request) {
  const key = request.headers.get('x-admin-key');
  return key && key === process.env.ADMIN_SECRET;
}

export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    // Fetch page views from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Cursor-based pagination to bypass Supabase 1000-row API limit
    // (.range() offset pagination still caps at 1000 total rows)
    let allViews = [];
    let cursor = thirtyDaysAgo.toISOString();
    const batchSize = 1000;
    while (true) {
      const { data: batch, error: batchErr } = await supabase
        .from('page_views')
        .select('path, referrer, utm_source, created_at')
        .gt('created_at', cursor)
        .order('created_at', { ascending: true })
        .limit(batchSize);
      if (batchErr) {
        if (batchErr.code === '42P01' || batchErr.message?.includes('does not exist')) {
          return NextResponse.json({
            visitors: { daily: [], total: 0, today: 0 },
            sources: [],
            topPages: [],
            needsSetup: true,
          });
        }
        return NextResponse.json({ error: batchErr.message }, { status: 500 });
      }
      if (!batch || batch.length === 0) break;
      allViews = allViews.concat(batch);
      if (batch.length < batchSize) break;
      cursor = batch[batch.length - 1].created_at;
    }
    const views = allViews;
    const error = null;


    const rows = views || [];
    const now = new Date();


    // Daily visitor counts (30 days)
    const dailyMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }

    // Traffic sources
    const sourceMap = {};
    // Top pages
    const pageMap = {};

    rows.forEach((row) => {
      const dateKey = (row.created_at || '').split('T')[0];
      if (dateKey in dailyMap) dailyMap[dateKey]++;

      // Source: prefer utm_source, then referrer, then "Direct"
      const source = row.utm_source || row.referrer || 'Direct';
      sourceMap[source] = (sourceMap[source] || 0) + 1;

      // Page paths
      const page = row.path || '/';
      pageMap[page] = (pageMap[page] || 0) + 1;
    });

    const daily = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));
    const todayKey = now.toISOString().split('T')[0];

    const sources = Object.entries(sourceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));

    const topPages = Object.entries(pageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));

    const response = NextResponse.json({
      visitors: {
        daily,
        total: rows.length,
        today: dailyMap[todayKey] || 0,
      },
      sources,
      topPages,
      needsSetup: false,
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
