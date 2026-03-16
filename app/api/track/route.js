import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export async function POST(request) {
  if (!supabase) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { path, referrer, utm_source } = await request.json();

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ ok: true });
    }

    // Skip admin pages and API routes
    if (path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true });
    }

    // Clean referrer — strip own domain
    let cleanReferrer = referrer || null;
    if (cleanReferrer) {
      try {
        const refUrl = new URL(cleanReferrer);
        if (refUrl.hostname.includes('mississaugainvestor.ca')) {
          cleanReferrer = null; // Internal navigation, not a traffic source
        } else {
          cleanReferrer = refUrl.hostname.replace('www.', '');
        }
      } catch {
        cleanReferrer = null;
      }
    }

    await supabase.from('page_views').insert({
      path: path.substring(0, 500),
      referrer: cleanReferrer,
      utm_source: utm_source || null,
    });
  } catch {
    // Silently fail — tracking should never break the site
  }

  return NextResponse.json({ ok: true });
}
