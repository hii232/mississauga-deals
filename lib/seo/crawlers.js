/**
 * Identify the crawler behind a request, for OBSERVATION ONLY.
 *
 * WHY THIS EXISTS
 * ---------------
 * On 2026-08-04 `/listings/[id]` was the busiest page route on the site —
 * 972 requests in six hours, ~20x the homepage — and every entry in the log was
 * a different listing id, walking all TREB region prefixes in order. Clearly a
 * crawler, and just as clearly NOT diagnosable: Vercel's runtime logs carry the
 * path and the cache status but not the user agent, so "which crawler" could
 * only be guessed at. Guessing is exactly the wrong move here, because the two
 * candidate answers point in opposite directions — Googlebot walking the
 * sitemap is the SEO working, and a scraper doing it is pure cost.
 *
 * So this labels the request and the label goes in the log. One grep answers it
 * next time instead of an inference.
 *
 * THIS MUST NEVER GATE A RESPONSE. It is a log label. User agents are trivially
 * spoofed, and the failure mode of acting on one — serving Googlebot something
 * a visitor doesn't get — is cloaking, which is a manual-action offence. Crawl
 * policy belongs in robots.txt (public/robots.txt) and, for bots that ignore
 * robots.txt, in the Vercel Firewall. Not here.
 */

/**
 * Bots given a full `Disallow: /` in public/robots.txt. Kept in the same order
 * and wording as that file so the two can be read side by side.
 *
 * The point of tracking these separately: if one of them still shows up in the
 * logs a day after the robots.txt change deploys, it is ignoring robots.txt,
 * and the answer is a Vercel Firewall rule rather than another polite line in a
 * text file. That is a different fix, and this is how you find out which one
 * you need.
 */
export const DISALLOWED_CRAWLERS = [
  // SEO/backlink tools
  'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'BLEXBot', 'DataForSeoBot', 'rogerbot',
  // AI training scrapers
  'GPTBot', 'ClaudeBot', 'anthropic-ai', 'CCBot', 'Google-Extended', 'Applebot-Extended',
  'Meta-ExternalAgent', 'Bytespider', 'Amazonbot', 'Diffbot', 'ImagesiftBot', 'Omgilibot',
];

/**
 * Crawlers that are welcome — search engines, and the AI *search* bots that
 * cite and link back. Listed longest-token-first within each brand so the
 * training variant is tested before the plain one: "Applebot-Extended" contains
 * "Applebot", so matching "Applebot" first would label every Apple Intelligence
 * request as the Siri crawler and hide precisely the bot we blocked.
 */
export const ALLOWED_CRAWLERS = [
  'Googlebot-Image', 'Googlebot', 'Bingbot', 'DuckDuckBot', 'Slurp', 'Applebot',
  'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Claude-User', 'YandexBot', 'Baiduspider',
];

/** Generic tails, tested only after every named bot above has missed. */
const GENERIC = /(bot|crawler|spider|scraper|curl|wget|python-requests|headless|scrapy)/i;

/**
 * @returns {{name: string, disallowed: boolean}|null} null when the request
 *   looks like an ordinary browser, which is the overwhelming majority and the
 *   case that must stay free.
 */
export function classifyCrawler(userAgent) {
  const ua = typeof userAgent === 'string' ? userAgent : '';
  // An absent UA is worth surfacing on its own — every real browser sends one,
  // so a blank is either a scripted client or something stripping headers.
  if (!ua.trim()) return { name: 'none', disallowed: false };

  // Disallowed first. If a blocked bot spoofs an allowed name into the same
  // string, the answer we care about is that the blocked one is still crawling.
  for (const name of DISALLOWED_CRAWLERS) {
    if (ua.toLowerCase().includes(name.toLowerCase())) return { name, disallowed: true };
  }
  for (const name of ALLOWED_CRAWLERS) {
    if (ua.toLowerCase().includes(name.toLowerCase())) return { name, disallowed: false };
  }
  const generic = ua.match(GENERIC);
  if (generic) {
    // Unrecognised bot: keep a bounded slice of the raw UA, since the whole
    // point is to learn a name this list does not have yet.
    return { name: 'other:' + ua.slice(0, 60), disallowed: false };
  }
  return null;
}
