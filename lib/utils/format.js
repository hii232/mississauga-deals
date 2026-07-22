// A malformed listing can carry an undefined/NaN derived number. Formatters
// must degrade to a dash, never throw (undefined.toFixed) or print "$NaN".
const isNum = (n) => typeof n === 'number' && isFinite(n);

/**
 * Format price as $XXK or $X.XXM
 */
export function fmtK(n) {
  if (!isNum(n)) return '—';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
  return '$' + (n / 1000).toFixed(0) + 'K';
}

/**
 * Format cash flow as +$X,XXX/mo or -$X,XXX/mo
 */
export function fmtNum(n) {
  if (!isNum(n)) return '—';
  if (n >= 0) return '+$' + n.toLocaleString() + '/mo';
  return '-$' + Math.abs(n).toLocaleString() + '/mo';
}

/**
 * Format currency
 */
export function fmtCurrency(n) {
  if (!isNum(n)) return '$—';
  return '$' + Math.abs(n).toLocaleString();
}

/**
 * Format a percentage to one decimal, guarded — returns '—' when the value is
 * not a finite number (so a bad listing can't crash a card/table/map popup).
 */
export function pct1(n) {
  return isNum(n) ? n.toFixed(1) + '%' : '—';
}

/**
 * Format address — capitalize words, handle unit numbers
 */
export function formatAddress(a) {
  if (!a) return 'Address on Request';
  return a
    .replace(/^(\d+)-\s*/, '#$1 - ')
    .replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/**
 * Share via navigator.share or clipboard fallback
 */
export async function shareProperty(listing) {
  const text = `Check out this investment property: ${listing.address} - ${fmtK(listing.price)}`;
  const url = typeof window !== 'undefined' ? window.location.origin + '/listings/' + listing.id : '';

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: listing.address, text, url });
      return true;
    } catch {
      // User cancelled or not supported
    }
  }

  // Clipboard fallback
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url || text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
