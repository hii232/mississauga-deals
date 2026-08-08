// ─────────────────────────────────────────────────────────────────────────────
//  One public hostname. (GSC coverage export, 2026-08-07.)
//
//  mississauga-deals.vercel.app serves the ENTIRE site publicly - 200s, a
//  fully permissive robots.txt, no auth wall - because Vercel keeps the
//  project alias attached to the production deployment alongside the real
//  domain. That is a complete crawlable mirror of ~5,400 pages on a second
//  hostname. Every page's canonical tag does point at www (metadataBase is
//  absolute), which is why Google filed the copies under "Alternate page with
//  proper canonical tag" and "Duplicate without user-selected canonical"
//  instead of ranking them - but a canonical is a hint Google weighs, not a
//  rule it must obey, and 59+ pages of the coverage report were burning crawl
//  budget on a hostname no visitor should ever see.
//
//  The fix Vercel itself documents: permanently redirect the deployment
//  aliases to the primary domain. 308 (not 307) so Google transfers the URLs'
//  signals to www and drops the duplicates.
//
//  Pure function, unit-tested; middleware.js calls it. Returns the absolute
//  URL to redirect to, or null to serve the request normally.
// ─────────────────────────────────────────────────────────────────────────────

export const CANONICAL_HOST = 'www.mississaugainvestor.ca';

/**
 * @param {string|null} host  the request Host header
 * @param {string} pathAndQuery  pathname + search, e.g. "/sell?x=1"
 * @param {string|undefined} vercelEnv  process.env.VERCEL_ENV
 * @returns {string|null} absolute redirect target, or null
 */
export function canonicalHostRedirect(host, pathAndQuery, vercelEnv) {
  const h = String(host || '').toLowerCase().split(':')[0];

  // Only ever redirect PRODUCTION serving. Preview deployments also live on
  // *.vercel.app - redirecting those to www would break every preview link
  // Hamza opens. VERCEL_ENV is 'preview' there and 'production' only on
  // production deployments; when the platform doesn't expose it (local dev,
  // system-env-vars toggled off) this returns null and nothing changes -
  // fail-safe in the do-nothing direction.
  if (vercelEnv !== 'production') return null;

  // The production mirror aliases (mississauga-deals.vercel.app, the
  // -git-main alias, the project alias) all end in .vercel.app. The apex is
  // included as belt-and-braces: Vercel's domain layer normally 307s it
  // before the app runs, but if that config ever changes, both hostnames
  // would silently serve the full site again.
  const isMirror = h.endsWith('.vercel.app') || h === 'mississaugainvestor.ca';
  if (!isMirror) return null;

  return `https://${CANONICAL_HOST}${pathAndQuery || '/'}`;
}
