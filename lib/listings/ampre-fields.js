/**
 * AMPRE/PropTx field selection, driven by what the feed ACTUALLY serves.
 *
 * WHY: AMPRE rejects the WHOLE query with a 4xx if the $select names a single
 * field it does not serve — one bad name silently costs every other field in
 * the list, and the caller just sees a lot of nulls.
 *
 * That failure mode makes inference dangerous. A previous differential test
 * named {OnMarketDate, ListingContractDate, OriginalEntryTimestamp} together,
 * saw a 4xx, and concluded all three were unavailable — but that evidence only
 * proves AT LEAST ONE is bad. Since days-on-market is the single field the
 * site's entire freshness story rests on, the fields are now PROBED
 * INDIVIDUALLY (see probeSupportedFields) instead of assumed. Whatever answers
 * 200 gets used; whatever 4xxs gets dropped.
 *
 * A field returning 200 but null is a licensing question, not a schema one:
 * DaysOnMarket is populated on Closed/Cancelled records and withheld on Active
 * ones, the classic IDX-vs-VOW suppression signature. A VOW-scoped token may
 * light several of these up — and because the probe re-runs hourly, that
 * happens with no code change and no deploy.
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

// ── Empirical field discovery ────────────────────────────────────────────
//
// WHY THIS REPLACED THE HARDCODED TIER GUESSING: the belief that
// {OnMarketDate, ListingContractDate, OriginalEntryTimestamp} are all
// unavailable came from ONE differential test that named all three TOGETHER
// and saw a 4xx. That proves at least one is bad — it does NOT prove all three
// are, and AMPRE fails the whole query on a single bad name, so two perfectly
// good date fields could have been written off for weeks on that evidence.
// Days-on-market is the field the whole site's freshness story depends on, so
// it is worth asking the feed directly instead of inferring.
//
// Each optional field is probed ON ITS OWN with a $top=1 query. Whatever comes
// back 200 goes into the real $select; whatever 4xxs is dropped. This is
// self-healing: swap in a VOW-scoped token and the newly-permitted fields start
// flowing on the next probe with no code change and no deploy.
const OPTIONAL_FIELDS = [
  // Timing — the ones that would give real days-on-market.
  'OriginalEntryTimestamp',
  'ListingContractDate',
  'OnMarketDate',
  'CumulativeDaysOnMarket',
  // Community name — drives neighbourhood filtering, the 24 guide pages and
  // the per-neighbourhood rent table.
  'CityRegion',
  // Square footage. The numeric pair is long-known-unsupported; the banded
  // range string is a different field.
  'LivingAreaRange',
  'LivingArea',
  'BuildingAreaTotal',
  // Condo fees.
  'AssociationFee',
  'AssociationFeeFrequency',
];

const PROBE_BASE = 'https://query.ampre.ca/odata/Property';
const PROBE_TTL_MS = 60 * 60 * 1000; // 1h — a licensing change is not a per-request event
// A probe run that hit network errors is NOT evidence about licensing, so it
// gets a minute, not an hour: long enough that a struggling upstream isn't
// re-probed on every request, short enough that the real field set comes back
// almost immediately.
const PROBE_DEGRADED_TTL_MS = 60 * 1000;
// Each probe is a $top=1 request; anything slower than this is a hung
// connection, not a slow query. Without a bound, ONE stalled probe blocked the
// whole route (Promise.all) until the platform killed the function — which is
// exactly how a caller sees `TimeoutError` while the API logs nothing at all.
const PROBE_TIMEOUT_MS = 5000;
let probeCache = { at: 0, fields: null, clean: false };

/**
 * Ask the feed which optional fields this token may actually select.
 * ~10 cheap ($top=1) requests, once an hour per instance, then free.
 * Returns an array of supported field names; [] if the probe itself fails,
 * which degrades to exactly the core-only behaviour.
 *
 * A 4xx and a dropped connection are treated DIFFERENTLY, because they mean
 * opposite things and the difference used to be a silent wrong-number bug: a
 * 4xx is the feed saying "you may not select this", which is worth caching for
 * an hour; a network error/timeout says nothing about the field at all. The old
 * code folded both into "unsupported" and cached the result for an hour, so one
 * upstream blip mid-probe could strip AssociationFee for an hour on that
 * instance — and every condo served in that window would carry condoFee 0, i.e.
 * cash flow, cap rate and Deal Score all overstated by the fee. Now a run with
 * errors keeps the last known-good set (union) and expires in a minute.
 */
export async function probeSupportedFields(token, { force = false } = {}) {
  const ttl = probeCache.clean ? PROBE_TTL_MS : PROBE_DEGRADED_TTL_MS;
  if (!force && probeCache.fields && Date.now() - probeCache.at < ttl) {
    return probeCache.fields;
  }
  const headers = { Authorization: 'Bearer ' + token, Accept: 'application/json' };
  const results = await Promise.all(
    OPTIONAL_FIELDS.map(async (f) => {
      const url = PROBE_BASE + '?$top=1&$select=' + encodeURIComponent('ListingKey,' + f);
      try {
        const r = await fetch(url, {
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        });
        // Answered: r.ok = permitted, non-ok = genuinely rejected.
        return { field: f, ok: r.ok, errored: false };
      } catch {
        // Never answered — tells us nothing about the field.
        return { field: f, ok: false, errored: true };
      }
    })
  );
  const fields = results.filter((r) => r.ok).map((r) => r.field);
  const errored = results.some((r) => r.errored);

  if (errored && probeCache.fields) {
    // Keep anything the feed previously confirmed. A field that was genuinely
    // revoked returns a 4xx (not an error), so it still drops out on the next
    // clean run — and this cache expires in a minute either way. Worst case the
    // $select names one stale field and the tier cascade below handles it.
    const merged = Array.from(new Set([...probeCache.fields, ...fields]));
    probeCache = { at: Date.now(), fields: merged, clean: false };
    return merged;
  }
  probeCache = { at: Date.now(), fields, clean: !errored };
  return fields;
}

export const MEDIA_EXPAND = 'Media($select=MediaURL,MediaKey;$orderby=Order)';

/**
 * Build the richest $select this token is actually allowed, then fetch.
 *
 * Returns { data, fieldTier, supportedFields } on success. `supportedFields`
 * is surfaced in the API response so which fields the feed serves is a fact
 * readable from production in one request, rather than something inferred from
 * symptoms like "dom is 0 everywhere".
 */
export async function fetchWithFieldTiers(baseUrl, tail, token) {
  const supported = await probeSupportedFields(token);
  const select = supported.length ? SELECT_CORE + ',' + supported.join(',') : SELECT_CORE;

  const q = (sel, expand) =>
    baseUrl + '&$select=' + encodeURIComponent(sel)
      + (expand ? '&$expand=' + encodeURIComponent(expand) : '')
      + tail;

  // The probe already removed the bad names, so tier 1 should succeed. The rest
  // are belt-and-braces: media expand can fail on payload size rather than on
  // field names, and core-only is the guaranteed floor.
  const tiers = [
    { name: 'probed+media', url: q(select, MEDIA_EXPAND) },
    { name: 'probed', url: q(select, null) },
    { name: 'core+media', url: q(SELECT_CORE, MEDIA_EXPAND) },
    { name: 'core', url: q(SELECT_CORE, null) },
  ];

  let last = null;
  for (const tier of tiers) {
    const resp = await fetch(tier.url, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    });
    if (resp.ok) {
      return { data: await resp.json(), fieldTier: tier.name, supportedFields: supported };
    }
    last = { status: resp.status, tier: tier.name, resp };
  }

  const detail = last ? (await last.resp.text()).substring(0, 400) : '';
  return {
    error: 'PropTx ' + last.status + ' (every field tier rejected, last: ' + last.tier + ')',
    status: last.status,
    detail,
    supportedFields: supported,
  };
}
