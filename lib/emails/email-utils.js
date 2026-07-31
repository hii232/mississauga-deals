/**
 * Shared email-formatting utilities.
 *
 * Imported by both the deal-alerts channel (app/api/alerts/send/route.js) and
 * the weekly newsletter (app/api/newsletter/weekly/route.js) so the two
 * channels always format prices and escape HTML identically.
 */

/**
 * Escape user/MLS-supplied strings before interpolating them into email HTML.
 * Uses null-coalescing so null/undefined become '' rather than the string
 * "null"/"undefined". Also escapes single quotes for use inside HTML attributes.
 *
 * @param {*} s
 * @returns {string}
 */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * Format a numeric price for display in email rows.
 *   $1M+ → "$X.XXM" with trailing zeros stripped (e.g. "$1.05M", "$1.2M")
 *   <$1M  → "$XXXK"  (rounded to nearest thousand)
 *   missing / zero / NaN → '' (callers must guard on falsy and omit the row)
 *
 * @param {number} p  Price in dollars
 * @returns {string}
 */
export function fmtPrice(p) {
  if (!Number.isFinite(p) || p <= 0) return '';
  if (p >= 1_000_000) return '$' + (p / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  return '$' + Math.round(p / 1000) + 'K';
}
