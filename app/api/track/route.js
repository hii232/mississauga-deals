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
    const { path, referrer, utm_source, mi } = await request.json();

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

    // Per-recipient email-click token (hex HMAC from recipient-token.js).
    // Validate the shape so arbitrary junk never lands in the column.
    const subscriberToken =
      typeof mi === 'string' && /^[a-f0-9]{8,32}$/.test(mi) ? mi : null;

    const row = {
      path: path.substring(0, 500),
      referrer: cleanReferrer,
      utm_source: utm_source || null,
    };
    if (subscriberToken) {
      // Insert with the token; if the subscriber_token migration hasn't run
      // yet, retry without it so tracking itself never breaks.
      const { error } = await supabase
        .from('page_views')
        .insert({ ...row, subscriber_token: subscriberToken });
      if (error) await supabase.from('page_views').insert(row);
    } else {
      await supabase.from('page_views').insert(row);
    }
  } catch {
    // Silently fail — tracking should never break the site
  }

  return NextResponse.json({ ok: true });
}
