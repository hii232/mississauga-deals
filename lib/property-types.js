/**
 * Map PropertySubType/PropertyType to user-friendly type
 */
export function mapType(subType, propType) {
  const s = (subType || '').toLowerCase();
  const p = (propType || '').toLowerCase();
  if (s.includes('semi')) return 'Semi-Detached';
  if (s.includes('att') || s.includes('row') || s.includes('town')) return 'Townhouse';
  if (p.includes('condo') || s.includes('condo') || s.includes('apt')) return 'Condo';
  if (s.includes('duplex')) return 'Duplex';
  if (s.includes('triplex')) return 'Triplex';
  if (s.includes('fourplex') || s.includes('four-plex') || s.includes('quadruplex')) return 'Fourplex';
  if (s.includes('multi') || s.includes('multiplex')) return 'Multiplex';
  return 'Detached';
}

/**
 * Format address from API fields
 */
export function formatAddress(address) {
  if (!address) return 'Address on Request';
  return address
    .replace(/^(\d+)-\s*/, '#$1 - ')
    .replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/**
 * Build address from listing components
 */
export function buildAddress(listing) {
  return [
    listing.UnitNumber ? listing.UnitNumber + '-' : '',
    listing.StreetNumber || '',
    listing.StreetName || '',
    listing.StreetSuffix || '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || listing.UnparsedAddress || 'Address on Request';
}

/**
 * Excluded property subtypes (commercial, leases, etc.)
 */
export const EXCLUDED_SUBTYPES =
  /sale of business|commercial|industrial|office|retail|vacant land|common element|parking|locker|storage/i;

/**
 * Suite detection regex
 */
export const SUITE_KEYWORDS =
  /\b(suite|basement apt|in-law|separate entrance|2nd kitchen|second kitchen|legal basement|finished basement|accessory|duplex|rental income|income potential|two unit|2 unit)\b/i;
