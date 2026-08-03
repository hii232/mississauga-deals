/**
 * THE canonical property types. Closed set — every listing on the site is
 * exactly one of these, and every filter matches on equality, never on a
 * substring. Substring matching is what produced three separate real bugs:
 * "Detached" swallowing "Semi-Detached", the Duplex/Multi chip silently
 * dropping "Fourplex", and condo townhouses appearing under two buckets.
 */
export const PROPERTY_TYPE = {
  DETACHED: 'Detached',
  SEMI: 'Semi-Detached',
  TOWNHOUSE: 'Townhouse',            // FREEHOLD only — no maintenance fee
  CONDO_TOWNHOUSE: 'Condo Townhouse', // carries a maintenance fee, like a condo
  CONDO: 'Condo',                     // apartment / co-op
  DUPLEX: 'Duplex',
  TRIPLEX: 'Triplex',
  FOURPLEX: 'Fourplex',
  MULTIPLEX: 'Multiplex',
};

/** Types whose carrying costs include a monthly maintenance fee. */
export const FEE_TYPES = [PROPERTY_TYPE.CONDO, PROPERTY_TYPE.CONDO_TOWNHOUSE];

/** Income properties. Shared with the multi-unit campaign so they can't drift. */
export const MULTI_UNIT = [
  PROPERTY_TYPE.DUPLEX, PROPERTY_TYPE.TRIPLEX,
  PROPERTY_TYPE.FOURPLEX, PROPERTY_TYPE.MULTIPLEX,
];

/**
 * Multi-unit split by DOWN PAYMENT, which is what actually separates these as
 * investments — not by unit count for its own sake.
 *
 * Under CMHC's insured-mortgage rules an owner-occupied 2-unit can be bought
 * with as little as 5% down on the first $500K; an owner-occupied 3-4 unit
 * needs 10%; and 5+ units falls outside residential insurance altogether and
 * is financed commercially. So a duplex and a triplex ask a buyer for
 * materially different money at closing, which is the same reason condo
 * townhouses were split from freehold ones: the filter should separate things
 * that change the numbers, not things that merely have different names.
 *
 * Fourplex and Multiplex ride with Triplex rather than getting their own
 * chips: Mississauga currently has ZERO active fourplexes and two multiplexes,
 * so separate chips would show empty almost always — and an empty filter is
 * exactly the "the site says none exist" problem just fixed elsewhere.
 */
export const DUPLEX_TYPES = [PROPERTY_TYPE.DUPLEX];
export const TRIPLEX_PLUS_TYPES = [
  PROPERTY_TYPE.TRIPLEX, PROPERTY_TYPE.FOURPLEX, PROPERTY_TYPE.MULTIPLEX,
];

/**
 * Map PropertySubType/PropertyType to one canonical type.
 *
 * THE ONLY COPY. This function was duplicated verbatim in
 * /api/listings, /api/listings-gta and /api/listing-single; four copies of one
 * rule is precisely how a listing ends up classified differently depending on
 * which endpoint served it. They now all import this.
 *
 * A condo townhouse is split out from a freehold townhouse because it carries
 * a maintenance fee — the single biggest line item separating the two as
 * investments — so lumping them together misrepresents the carrying cost.
 * The board spells it "Condo Townhouse" in PropertySubType (verified against
 * live feed rows: 20/20 of them carry a condo fee, and 1/1 "Att/Row/Townhouse"
 * carries none), so the split is read straight off the feed rather than
 * inferred from whether a fee happens to be present.
 */
export function mapType(subType, propType) {
  const s = (subType || '').toLowerCase();
  const p = (propType || '').toLowerCase();
  if (s.includes('semi')) return PROPERTY_TYPE.SEMI;
  // BEFORE the generic town and condo tests: "Condo Townhouse" contains both
  // words, so whichever of those ran first would win and the other bucket
  // would never see it.
  if ((s.includes('town') || s.includes('row')) && (s.includes('condo') || s.includes('co-op') || p.includes('condo'))) {
    return PROPERTY_TYPE.CONDO_TOWNHOUSE;
  }
  if (s.includes('att') || s.includes('row') || s.includes('town')) return PROPERTY_TYPE.TOWNHOUSE;
  if (p.includes('condo') || s.includes('condo') || s.includes('apt')) return PROPERTY_TYPE.CONDO;
  if (s.includes('duplex')) return PROPERTY_TYPE.DUPLEX;
  if (s.includes('triplex')) return PROPERTY_TYPE.TRIPLEX;
  if (s.includes('fourplex') || s.includes('four-plex') || s.includes('quadruplex')) return PROPERTY_TYPE.FOURPLEX;
  if (s.includes('multi') || s.includes('multiplex')) return PROPERTY_TYPE.MULTIPLEX;
  return PROPERTY_TYPE.DETACHED;
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
