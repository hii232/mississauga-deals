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

// Valuable but individually unproven. Requested in the top tiers so that if any
// one of them is rejected we lose only these, never the Media expand as well.
export const SELECT_RICH = [
  SELECT_CORE,
  // Condo fees are a major expense line; without them every condo's fee is an
  // estimate rather than the real number.
  'AssociationFee', 'AssociationFeeFrequency',
  // Square footage drives $/sqft and the sqft-based condo-fee estimate.
  'LivingArea', 'BuildingAreaTotal',
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

  const tiers = [
    { name: 'rich+media', url: q(SELECT_RICH, MEDIA_EXPAND) },
    { name: 'rich', url: q(SELECT_RICH, null) },
    { name: 'core+media', url: q(SELECT_CORE, MEDIA_EXPAND) },
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
