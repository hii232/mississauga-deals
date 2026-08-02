/**
 * Multi-unit (duplex/triplex/fourplex/multiplex) letter — data selection,
 * aggregation, and the refuse-to-send guard.
 *
 * WHY THIS EMAIL HAS NO OFFER NUMBERS AND NO RENT FIGURES
 * -------------------------------------------------------
 * The picks campaign anchors offers to TRREB's per-type sale-to-list ratios.
 * Multi-unit has NO TRREB category in Market Watch, so there is no honest
 * anchor — that's exactly why offer-picks-data.js excludes these types. And
 * the site's rent model (estimateRent / HOOD_RENTS) is calibrated on lease
 * comps for houses and condos: quoting it for a 3-unit building would be a
 * fabricated number wearing a real one's clothes. So this email claims
 * neither. Its facts are the ones live MLS actually supports — how many of
 * these buildings exist on the market, what they ask, how long they've sat,
 * how many have already cut — and the analysis is explicitly "reply and I'll
 * run real numbers on the specific building".
 *
 * Dependency-free so it is unit-testable without booting Next
 * (multi-unit-data.test.mjs).
 */

export const MULTI_UNIT_TYPES = ['Duplex', 'Triplex', 'Fourplex', 'Multiplex'];

const PLURAL = {
  Duplex: 'duplexes',
  Triplex: 'triplexes',
  Fourplex: 'fourplexes',
  Multiplex: 'multiplexes',
};

// Sanity band for a Mississauga income property. Outside this is feed junk
// (a parking space, a mislabelled assignment) — drop the row, and if too many
// drop, validation refuses the whole send.
const PRICE_MIN = 500000;
const PRICE_MAX = 4000000;

function median(nums) {
  const a = nums.slice().sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2);
}

/** The rows this campaign is allowed to describe. */
export function selectMultiUnit(listings) {
  const seen = new Set();
  return (listings || []).filter((l) => {
    if (!l || !l.address) return false;
    // Re-verify the mapped type even though the API filtered server-side —
    // if TREB's subtype spelling drifts, better 0 rows (which refuses) than
    // a semi labelled as a duplex.
    if (!MULTI_UNIT_TYPES.includes(l.type)) return false;
    const price = Number(l.price) || 0;
    if (price < PRICE_MIN || price > PRICE_MAX) return false;
    if (seen.has(l.id)) return false;
    seen.add(l.id);
    return true;
  });
}

/** Everything the letter says, computed — never typed from memory. */
export function aggregateMultiUnit(rows) {
  const prices = rows.map((r) => Number(r.price));
  const doms = rows.map((r) => Number(r.dom) || 0).filter((d) => d > 0);
  const byType = {};
  for (const t of MULTI_UNIT_TYPES) {
    const c = rows.filter((r) => r.type === t).length;
    if (c > 0) byType[t] = c;
  }
  return {
    count: rows.length,
    byType,
    // e.g. "4 duplexes, 2 triplexes and 1 fourplex" — built from the counts so
    // the sentence can never disagree with the table of facts behind it.
    breakdown: Object.entries(byType)
      .map(([t, c]) => `${c} ${c === 1 ? t.toLowerCase() : PLURAL[t]}`)
      .join(', ')
      .replace(/, ([^,]*)$/, ' and $1'),
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMax: prices.length ? Math.max(...prices) : null,
    priceMedian: median(prices),
    medianDOM: median(doms),
    domKnownCount: doms.length,
    cutCount: rows.filter((r) => (Number(r.priceDrop) || 0) >= 1).length,
    listings: rows,
  };
}

/**
 * Refuse-to-send guard. Returns { data, reason }; null data = do not send.
 */
export function validateMultiUnit(agg, totalActive) {
  const checks = [
    // Fewer than 2 and "here's what's on the market" isn't an email; it also
    // catches the failure mode where TREB renamed the subtypes and the feed
    // filter silently matched nothing.
    [agg.count >= 2, `only ${agg.count} multi-unit listing(s) found — not enough to write about (or the PropertySubType filter no longer matches the feed)`],
    // Mississauga does not have 60+ active multiplexes; that many means the
    // filter grabbed the wrong rows.
    [agg.count <= 60, `${agg.count} "multi-unit" listings is implausible — filter is over-matching`],
    [agg.priceMin >= PRICE_MIN && agg.priceMax <= PRICE_MAX, 'price range outside the sanity band'],
    [agg.priceMedian > 0, 'no computable median price'],
    // The letter quotes days-on-market; if the feed lost real DOM for most
    // rows (0 = unknown, never "new"), drop the claim's basis and refuse.
    [agg.domKnownCount >= Math.ceil(agg.count / 2), `real days-on-market known for only ${agg.domKnownCount}/${agg.count} — too thin to quote`],
    [Number(totalActive) > agg.count, 'total active count missing or smaller than the multi-unit count'],
  ];
  const failed = checks.filter(([ok]) => !ok).map(([, why]) => why);
  if (failed.length) return { data: null, reason: failed.join('; ') };
  return { data: { ...agg, totalActive: Number(totalActive) }, reason: null };
}
