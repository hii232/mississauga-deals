/**
 * AMPRE/PropTx $select field sets, and a fetch that degrades one dimension at
 * a time.
 *
 * WHY: AMPRE rejects the WHOLE query with a 4xx if the $select names a single
 * field it does not serve — so one bad name silently costs every other field in
 * the list, and the caller just sees a lot of nulls.
 *
 * THE TOXIC GROUP is {OnMarketDate, ListingContractDate, OriginalEntryTimestamp}.
 * Isolated by differential testing against production on 2026-07-27, not by
 * guesswork: /api/price-history's primary $select is byte-identical to
 * /api/sold-comps' (which returns 200 with real CloseDate/Latitude/Longitude
 * values) PLUS exactly those three date fields — and price-history's primary
 * query is rejected while sold-comps' succeeds. Those three are the only
 * difference, so they are the cause. Do not re-add them.
 *
 * Both listing routes used to request all three, so their primary query could
 * never succeed. Worse, their tier 2 reused the SAME $select and only dropped
 * $expand, so it could never rescue a $select rejection either — the cascade
 * was degenerate and every request landed on the minimal tier. That is exactly
 * what production served: sqft 0 on every listing, condoFee 0 on obvious condo
 * apartments, and photos [] on every row.
 *
 * Fields below are VALID (they return 200) even where they come back null —
 * null is a data/licensing question, not a schema one. See
 * IMPROVEMENT_BACKLOG.md "Needs Hamza": DaysOnMarket is populated on Closed and
 * Cancelled records but withheld on Active ones, the classic IDX-vs-VOW
 * suppression signature, so a VOW-scoped token may light several of them up.
 */

// Proven to work: this is the set /api/listing-single has used successfully
// for a long time.
export const SELECT_CORE = [
  'ListingKey', 'ListingId', 'ListPrice', 'OriginalListPrice',
  'City', 'PostalCode', 'UnparsedAddress', 'StreetNumber', 'StreetName',
  'StreetSuffix', 'UnitNumber', 'BedroomsTotal', 'BathroomsTotalInteger',
  'PropertyType', 'PropertySubType', 'YearBuilt', 'DaysOnMarket',
  'StandardStatus', 'ListOfficeName', 'PublicRemarks',
  'Latitude', 'Longitude', 'ModificationTimestamp',
].join(',');

// Condo fees are a major expense line — they feed cash flow, cap rate and the
// deal score for over half the Mississauga inventory (~1,316 of ~2,547 active
// listings are condo apartments). Without them every condo fee on the site is
// an ESTIMATE rather than the real number.
export const SELECT_FEES = [
  SELECT_CORE,
  'AssociationFee', 'AssociationFeeFrequency',
].join(',');

// Square footage drives $/sqft and the sqft-based condo-fee estimate.
// listing-single/route.js has long noted LivingArea and BuildingAreaTotal are
// unsupported, and production confirms it: with these in the $select the query
// is rejected and the cascade settles on a tier without them. Kept as the
// top tier anyway — it costs one request only when it fails, and it lights up
// automatically if the feed ever starts serving them.
export const SELECT_RICH = [
  SELECT_FEES,
  'LivingArea', 'BuildingAreaTotal',
].join(',');

// CityRegion is the RESO field carrying the COMMUNITY (Cooksville, Malton,
// Port Credit…) rather than the municipality. It had never been requested, and
// both feed routes consequently hardcoded `neighbourhood: city` — so all ~2,600
// Mississauga listings reported their neighbourhood as the literal string
// "Mississauga". That silently defeated neighbourhood filtering, the 24
// neighbourhood guide pages, and the per-neighbourhood rent table (every
// listing fell to the city-level default rent instead of its own community's).
//
// LivingAreaRange is a DIFFERENT field from the known-unsupported LivingArea /
// BuildingAreaTotal pair — TREB serves square footage as a banded range string
// ("700-799"). It has never been tried, so it gets a tier of its own.
//
// Both sit ABOVE the existing tiers rather than being merged into SELECT_CORE
// on purpose: if either name is unsupported the whole query 4xxs, and putting
// them in core would poison the guaranteed-safe floor along with everything
// else. Here, a rejection costs exactly one extra request and the cascade lands
// on precisely the tier it lands on today.
export const SELECT_REGION = [
  SELECT_FEES,
  'CityRegion', 'LivingAreaRange',
].join(',');

// Top probe. The toxic date trio is documented above as rejected — but that was
// measured with an IDX-scoped token, and the whole group may become available
// the moment a VOW token is in play. Asking for them here means real
// days-on-market starts flowing the instant that happens, with no code change
// and no deploy; until then this tier simply 4xxs and costs one request.
// computeDaysOnMarket() already reads all three (see market-timing.js).
export const SELECT_DATES = [
  SELECT_REGION,
  'OnMarketDate', 'ListingContractDate', 'OriginalEntryTimestamp',
].join(',');

export const MEDIA_EXPAND = 'Media($select=MediaURL,MediaKey;$orderby=Order)';

/**
 * Try progressively simpler queries, varying ONE dimension per step, and report
 * which one the feed accepted.
 *
 * Returns { data, fieldTier } on success, or { error, status, detail } when
 * even the minimal tier fails. `fieldTier` is surfaced in the API response so a
 * field regression is diagnosable from production in a single request instead
 * of being inferred from symptoms like sqft:0 — which is precisely how the
 * silent fall-through went unnoticed for so long.
 */
export async function fetchWithFieldTiers(baseUrl, tail, token) {
  const q = (select, expand) =>
    baseUrl + '&$select=' + encodeURIComponent(select)
      + (expand ? '&$expand=' + encodeURIComponent(expand) : '')
      + tail;

  // Ordered richest-first, dropping ONE thing at a time. The fees tier sits
  // between rich and core deliberately: production showed the rich tier being
  // rejected (so LivingArea/BuildingAreaTotal are unsupported) which was also
  // costing us AssociationFee purely because it was bundled with them. Asking
  // for fees on their own gives real condo fees a chance to come through.
  const tiers = [
    { name: 'dates+media', url: q(SELECT_DATES, MEDIA_EXPAND) },
    { name: 'region+media', url: q(SELECT_REGION, MEDIA_EXPAND) },
    { name: 'rich+media', url: q(SELECT_RICH, MEDIA_EXPAND) },
    { name: 'fees+media', url: q(SELECT_FEES, MEDIA_EXPAND) },
    { name: 'core+media', url: q(SELECT_CORE, MEDIA_EXPAND) },
    { name: 'fees', url: q(SELECT_FEES, null) },
    { name: 'core', url: q(SELECT_CORE, null) },
  ];

  let last = null;
  for (const tier of tiers) {
    const resp = await fetch(tier.url, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    });
    if (resp.ok) {
      return { data: await resp.json(), fieldTier: tier.name };
    }
    last = { status: resp.status, tier: tier.name, resp };
  }

  const detail = last ? (await last.resp.text()).substring(0, 400) : '';
  return {
    error: 'PropTx ' + last.status + ' (every field tier rejected, last: ' + last.tier + ')',
    status: last.status,
    detail,
  };
}
