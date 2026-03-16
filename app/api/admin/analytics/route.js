import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const { data: views, error } = await supabase
      .from('page_views')
      .select('path, referrer, utm_source, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          visitors: { daily: [], total: 0, today: 0 },
          sources: [],
          topPages: [],
          needsSetup: true,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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

    return NextResponse.json({
      visitors: {
        daily,
        total: rows.length,
        today: dailyMap[todayKey] || 0,
      },
      sources,
      topPages,
      needsSetup: false,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
