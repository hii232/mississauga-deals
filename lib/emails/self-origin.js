/**
 * The origin a broadcast route should call and link back to.
 *
 * WHY THIS EXISTS
 * ---------------
 * The broadcast routes used to hardcode `https://www.mississaugainvestor.ca`
 * for anything that wasn't NODE_ENV=development. On a Vercel PREVIEW
 * deployment NODE_ENV is "production", so a draft generated from a preview
 * built its "Review & Send" link pointing at the live domain - where the new
 * route doesn't exist yet. Clicking approve gave a 404, with the campaign
 * sitting perfectly fine on the preview the draft actually came from.
 *
 * So the origin has to come from the request that is being served, not from a
 * constant. Same for the route's own internal fetches: a preview must read the
 * preview's /api/listings, not production's.
 *
 * WHY THE HOST IS VALIDATED
 * -------------------------
 * `Host` / `X-Forwarded-Host` are attacker-controllable in general, and this
 * value goes into a link that gets EMAILED and then clicked to authorise a
 * send. An unvalidated host would let a poisoned header point the approve
 * button at someone else's server. The routes are authenticated and the draft
 * only ever goes to the approver, so this is defence in depth rather than an
 * open hole - but a header-derived URL that ends up in an email should be
 * checked regardless of how it is reached.
 *
 * Only hosts we actually deploy to are honoured; anything else falls back to
 * the canonical production origin.
 */

const CANONICAL = 'https://www.mississaugainvestor.ca';

// mississaugainvestor.ca and any subdomain, or a Vercel deployment/preview host.
const ALLOWED_HOST = /^(?:[a-z0-9-]+\.)*mississaugainvestor\.ca$/i;
const ALLOWED_VERCEL = /^[a-z0-9-]+(?:-[a-z0-9]+)*\.vercel\.app$/i;

export function selfOrigin(request) {
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';

  const h = request?.headers;
  const rawHost = (h?.get?.('x-forwarded-host') || h?.get?.('host') || '').trim();
  // A forwarded-host header can carry a comma-separated chain; take the first.
  const host = rawHost.split(',')[0].trim().toLowerCase();
  if (!host) return CANONICAL;

  const proto = (h?.get?.('x-forwarded-proto') || 'https').split(',')[0].trim() || 'https';
  if (proto !== 'https' && proto !== 'http') return CANONICAL;

  if (ALLOWED_HOST.test(host) || ALLOWED_VERCEL.test(host)) {
    return `${proto}://${host}`;
  }
  return CANONICAL;
}
