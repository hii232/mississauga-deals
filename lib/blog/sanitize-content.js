/**
 * Sanitizer for stored blog content. Two classes of defect exist in older
 * generated posts sitting in the database:
 *
 * 1. COMPLIANCE (serious): early posts were generated while Hamza was at his
 *    previous brokerage, and their author bios name it. Advertising under a
 *    brokerage a registrant doesn't belong to is a RECO violation, and these
 *    pages are in Google's index. The old name is corrected to the current
 *    brokerage everywhere it appears. The literal string below exists ONLY so
 *    it can be found and removed — it must never be used in new content, and
 *    the generator prompt forbids naming any other brokerage.
 *
 * 2. ENCODING: em-dashes in some posts were stored as U+FFFD replacement
 *    characters ("a transit project � it is..."). Every live occurrence is
 *    space-flanked, i.e. an em-dash; they are restored as such.
 *
 * Applied in TWO layers:
 *  - at render time (blog page, index, newsletter) so the fix is live the
 *    moment this deploys, for all posts, without touching the database;
 *  - permanently by the auto-blog cron, which rewrites any stored row the
 *    sanitizer would change, so the data itself is clean. Idempotent — a
 *    clean post passes through byte-identical.
 */

const CURRENT_BROKERAGE = 'Cityscape Real Estate Ltd., Brokerage';

// Old-brokerage patterns, most specific first so the trailing ", Brokerage"
// isn't left dangling after a partial replacement.
const BROKERAGE_FIXES = [
  [/Royal\s+LePage\s+Signature\s+Realty(,?\s*Brokerage)?/gi, CURRENT_BROKERAGE],
  [/Royal\s+LePage(,?\s*Brokerage)?/gi, CURRENT_BROKERAGE],
];

export function sanitizeBlogText(text) {
  if (typeof text !== 'string' || text.length === 0) return text;
  let out = text;

  for (const [pattern, replacement] of BROKERAGE_FIXES) {
    out = out.replace(pattern, replacement);
  }

  if (out.includes('�')) {
    // "word � word" — an em-dash lost in transit (every observed case).
    out = out.replace(/[ \t]*�[ \t]*/g, ' — ');
    // Defensive: a possessive that lost its apostrophe ("Mississauga�s").
    out = out.replace(/(\w) — s\b/g, '$1’s');
  }

  return out;
}

/** Sanitize the displayable fields of a post object (non-mutating). */
export function sanitizePost(post) {
  if (!post) return post;
  return {
    ...post,
    title: sanitizeBlogText(post.title),
    excerpt: sanitizeBlogText(post.excerpt),
    content: sanitizeBlogText(post.content),
  };
}

/** True if sanitizing would change the post — i.e. the stored row is dirty. */
export function postNeedsSanitizing(post) {
  if (!post) return false;
  return (
    sanitizeBlogText(post.title) !== post.title ||
    sanitizeBlogText(post.excerpt) !== post.excerpt ||
    sanitizeBlogText(post.content) !== post.content
  );
}
