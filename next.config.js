// Blog redirect list shared with app/sitemap.js (which excludes these slugs —
// a sitemap must not submit URLs that redirect away) via one CJS module.
const { BLOG_REDIRECTS } = require('./lib/blog/canonical-overrides');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress the `X-Powered-By: Next.js` response header. It advertises the
  // framework (and therefore which CVEs to try) to anyone reading response
  // headers, and buys nothing in return. Flagged by the Seobility audit under
  // server-configuration hardening.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.ampre.ca',
      },
      {
        protocol: 'https',
        hostname: 'query.ampre.ca',
      },
      {
        protocol: 'https',
        hostname: '*.repliers.io',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
  // Auto-blog keyword cannibalization, evidenced from Hamza's real GSC export
  // (IMPROVEMENT_BACKLOG.md item 13): the auto-blog generator produced posts
  // that outranked the site's own hand-built page for the SAME query — e.g.
  // /rental-property-insurance-mississauga sat at position 55 while an
  // auto-generated post on the identical topic sat at position 12, so the
  // page built specifically to win that query was losing to the site's own
  // blog. The generator bug that produced these is already fixed; this
  // consolidates the specific pages it already shipped.
  //
  // Only the THREE clusters with an unambiguous, already-decided winner are
  // redirected here. Two more evidenced clusters (three overlapping
  // rent-vs-buy posts; four overlapping cash-flow-analysis posts) are NOT
  // included — each needs a "best-performing post" picked as the survivor,
  // and that needs real GSC position data in front of whoever does it, not a
  // guess. Left open in the backlog rather than redirected on assumption.
  //
  // `permanent: true` emits a 308, which search engines consolidate link
  // equity through identically to a 301 — the historical distinction (301 vs
  // 302) is what matters for SEO, not 301 specifically.
  // The list itself lives in lib/blog/canonical-overrides.js so the sitemap
  // excludes exactly the slugs redirected here.
  async redirects() {
    return BLOG_REDIRECTS;
  },
};

module.exports = nextConfig;
