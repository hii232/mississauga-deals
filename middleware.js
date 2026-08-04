import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { classifyCrawler } from '@/lib/seo/crawlers';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  // ── Name the crawler walking the listing pages ──
  //
  // Measured 2026-08-04: /listings/[id] was the busiest page route on the site,
  // 972 requests in six hours, ~20x the homepage, every one a DIFFERENT listing
  // id walking all TREB region prefixes in order. Unmistakably a crawl — and
  // undiagnosable, because Vercel's runtime logs carry the path and the cache
  // status but not the user agent. The two candidate answers point opposite
  // ways (Googlebot walking the sitemap is the SEO working; a scraper doing it
  // is pure cost), so guessing was the one thing not worth doing.
  //
  // Scoped to /listings/ deliberately: that is the route in question, and it
  // keeps this to the traffic being investigated rather than every request on
  // the site. `disallowed=true` a day after the robots.txt change deploys means
  // that bot is IGNORING robots.txt and needs a Vercel Firewall rule instead —
  // a different fix, and this is how you learn which one you need.
  //
  // A LABEL, NEVER A GATE. Nothing branches on this. User agents are trivially
  // spoofed, and serving a crawler something a visitor does not get is
  // cloaking, which earns a manual action. See lib/seo/crawlers.js.
  if (request.nextUrl.pathname.startsWith('/listings/')) {
    const bot = classifyCrawler(request.headers.get('user-agent'));
    if (bot) console.log(`crawl: ${bot.name} disallowed=${bot.disallowed} ${request.nextUrl.pathname}`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip if Supabase isn't configured yet
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  // No Supabase auth cookie (sb-<project-ref>-auth-token[.N]) means there is
  // no session to refresh — the vast majority of traffic (anonymous visitors,
  // crawlers). Skip the client + network round-trip entirely for those.
  const hasSupabaseAuthCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith('sb-'));
  if (!hasSupabaseAuthCookie) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|robots.txt|sitemap.xml|image-sitemap.xml|api/).*)',
  ],
};
