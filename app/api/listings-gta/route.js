import { NextResponse } from 'next/server';
import { mapType } from '@/lib/property-types';
import { computeDaysOnMarket, computeDaysSinceUpdate, parseLivingAreaRange } from '@/lib/listings/market-timing';
import { fetchWithFieldTiers } from '@/lib/listings/ampre-fields';
import { applyFirstSeenFloor } from '@/lib/listings/first-seen';
import { cityAliases, citySubarea } from '@/lib/constants';
// Shared with every other feed route — see lib/listings/odata.js for why the
// ?city= param must never reach $filter unescaped.
import { odataStr } from '@/lib/listings/odata';

export const dynamic = 'force-dynamic';
// 60, not 30: production error clusters show this route's own 30s ceiling
// being hit (77 timeouts since Jun 24) — the cold path (field probe + 24.5k-row
// filter + $count + media expand) can genuinely exceed it, and a route killed
// at 30s fails the SSR cache seed that /gta's 25s-budget fetch depends on.
export const maxDuration = 60;

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

// Top 15 GTA cities — keeps the OData OR filter fast
const GTA_CITIES = [
  'Brampton', 'Caledon',
  'Vaughan', 'Richmond Hill', 'Markham', 'Newmarket', 'Aurora',
  'Oshawa', 'Whitby', 'Ajax', 'Pickering',
  'Oakville', 'Burlington', 'Milton',
  'Hamilton',
  'Barrie',
  // Both of the Town of Halton Hills' names — see CITY_ALIAS_GROUPS in
  // lib/constants.js. Only one of them is TREB's label and we cannot see which
  // from outside production, so asking for one alone risks the hub feed
  // silently containing none of that town's listings.
  'Halton Hills', 'Georgetown',
];

// Toronto uses sub-area codes in TREB (e.g. "Toronto C01", "Toronto E05")
// We use startswith() to capture all Toronto sub-areas
const TORONTO_FILTER = "startswith(City, 'Toronto')";

// $filter clause for one of the amalgamated districts/communities in
// CITY_SUBAREAS (lib/constants.js has the measurements behind each one).
// Parent municipality AND the geography that isolates the district, because
// the board never puts the district's name in City.
function subareaFilters(def) {
  const out = [
    def.parent === 'Toronto' ? TORONTO_FILTER : "City eq '" + odataStr(def.parent) + "'",
  ];
  const clauses = def.postalPrefixes
    ? def.postalPrefixes.map((p) => "startswith(PostalCode,'" + odataStr(p) + "')")
    : def.communityPrefixes.map((p) => "startswith(CityRegion,'" + odataStr(p) + "')");
  out.push('(' + clauses.join(' or ') + ')');
  return out;
}

// mapType now lives in lib/property-types.js — one rule, imported here.

// GTA-wide rent estimates by city tier
const CITY_RENT_TIER = {
  'Toronto': 1.15, 'Oakville': 1.10, 'Burlington': 1.05,
  'Richmond Hill': 1.05, 'Markham': 1.05, 'Vaughan': 1.05,
  'Aurora': 1.0, 'Newmarket': 0.95, 'Whitby': 0.95, 'Ajax': 0.95,
  'Pickering': 1.0, 'Milton': 0.95, 'Hamilton': 0.85, 'Oshawa': 0.80,
  'Barrie': 0.85, 'Brampton': 0.90, 'Caledon': 0.95,
  // One town, both of its names (CITY_ALIAS_GROUPS in lib/constants.js), so
  // neither label can fall through to the 0.90 unknown-city default below.
  'Halton Hills': 0.95, 'Georgetown': 0.95,
};

function estimateRent(price, beds, city, type) {
  // Conservative 2026 GTA rental rates
  const baseRents = { 0: 1650, 1: 1900, 2: 2400, 3: 2900, 4: 3400, 5: 3800 };
  const base = baseRents[Math.min(beds || 0, 5)] || 2400;
  let adj = type === 'Detached' ? 200 : type === 'Condo' ? -150 : 0;
  if (['Duplex', 'Triplex', 'Fourplex', 'Multiplex'].includes(type)) adj += 500;
  const tier = CITY_RENT_TIER[city] || 0.90;
  return Math.round(((price || 0) * 0.0035 * 0.3 + (base + adj) * tier * 0.7) / 50) * 50;
}

/**
 * Normalize AssociationFee to monthly amount
 */
function normalizeCondoFee(fee, frequency) {
  if (!fee || fee <= 0) return 0;
  const freq = (frequency || 'Monthly').toLowerCase();
  if (freq.includes('annual') || freq.includes('yearly')) return Math.round(fee / 12);
  if (freq.includes('quarter')) return Math.round(fee / 3);
  if (freq.includes('semi')) return Math.round(fee / 6);
  return Math.round(fee); // default: monthly
}

function addr(l) {
  return [l.UnitNumber ? l.UnitNumber + '-' : '', l.StreetNumber || '', l.StreetName || '', l.StreetSuffix || '']
    .filter(Boolean).join(' ').trim() || l.UnparsedAddress || 'Address on Request';
}

export async function GET(request) {
  if (!TOK) {
    return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    // Page size is capped at 100, and the cap is load-bearing: AMPRE accepts
    // the Media $expand at $top=100 (measured: 99/99 rows return photos,
    // fieldTier fees+media) but REJECTS it at $top=200 (~36k media rows — the
    // CDN stores ~5 size-variants per photo), which sent every standard page
    // request through 3 failed upstream calls before settling on a tier with
    // photos:[] on every row. Callers all iterate via the API's own `pages`
    // field, so they adapt to the smaller page automatically.
    const limit = Math.min(parseInt(searchParams.get('limit')) || 100, 100);
    const skip = (page - 1) * limit;

    const filters = ["StandardStatus eq 'Active'", 'ListPrice ge 300000'];
    filters.push("PropertyType ne 'Commercial'");
    filters.push("PropertyType ne 'Business'");
    filters.push("PropertyType ne 'No Building'");

    if (searchParams.get('minPrice')) filters.push('ListPrice ge ' + parseInt(searchParams.get('minPrice')));
    if (searchParams.get('maxPrice')) filters.push('ListPrice le ' + parseInt(searchParams.get('maxPrice')));
    if (searchParams.get('beds')) filters.push('BedroomsTotal ge ' + parseInt(searchParams.get('beds')));

    // Filter by specific city or default to all GTA cities (excluding Mississauga — that's the main page)
    const cityParam = searchParams.get('city');
    const subarea = cityParam ? citySubarea(cityParam) : null;
    if (cityParam) {
      if (subarea) {
        // An amalgamated district or community, not a municipality the board
        // names. `City eq 'Etobicoke'` (and the seven others) matched ZERO
        // rows in production, so all eight /gta pages showed no listings at
        // all; CITY_SUBAREAS in lib/constants.js records what the feed does
        // carry instead and how it was measured. Rows come back under their
        // parent city, so no rent tier, tax rate or score changes.
        for (const f of subareaFilters(subarea)) filters.push(f);
      } else if (cityParam.toLowerCase() === 'toronto') {
        // Toronto filter: use startswith to catch all sub-areas (Toronto C01, Toronto E05, etc.)
        filters.push(TORONTO_FILTER);
      } else {
        // Ask for every name this municipality can appear under. Only
        // Halton Hills/Georgetown has more than one (lib/constants.js), and it
        // matters: /gta/georgetown used to send City eq 'Georgetown' — a name
        // the board may not use at all — so that page could match zero rows,
        // while /gta/halton-hills matched rows it then displayed as Georgetown.
        // Asking for both makes each page correct under either board label.
        const names = cityAliases(cityParam);
        const clause = names.map((c) => "City eq '" + odataStr(c) + "'").join(' or ');
        filters.push(names.length > 1 ? '(' + clause + ')' : clause);
      }
    } else {
      // Include all GTA cities + all Toronto sub-areas
      const cityFilters = GTA_CITIES.map((c) => "City eq '" + odataStr(c) + "'");
      cityFilters.push(TORONTO_FILTER);
      filters.push('(' + cityFilters.join(' or ') + ')');
    }

    const base = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '));
    const tail = '&$top=' + limit + '&$skip=' + skip
      + '&$orderby=ModificationTimestamp desc&$count=true';

    // nomedia=1 — for the whole-feed AGGREGATE walk (lib/listings/gta-screener.js),
    // never for a rendered page. Photos are the dominant cost of a feed request
    // and an aggregate reads none of them; the walk is ~245 pages, so carrying
    // media through it would drag millions of media rows to compute six
    // numbers. Every other field, and therefore every computed figure, is
    // unchanged — only `photos`/`images` come back empty.
    const wantsMedia = searchParams.get('nomedia') !== '1';
    const result = await fetchWithFieldTiers(base, tail, TOK, { media: wantsMedia });
    if (result.error) {
      return NextResponse.json(
        { error: result.error, detail: result.detail },
        { status: result.status }
      );
    }
    const { data, fieldTier, supportedFields } = result;
    let items = data.value || [];
    const total = data['@odata.count'] || items.length;

    // Filter out commercial/lease subtypes
    const EXCLUDED = /sale of business|commercial|industrial|office|retail|vacant land|common element|parking|locker|storage/i;
    const rawCount = items.length;
    items = items.filter((l) => {
      const sub = l.PropertySubType || '';
      const prop = l.PropertyType || '';
      if (EXCLUDED.test(sub) || EXCLUDED.test(prop)) return false;
      if (/lease/i.test(prop) || /lease/i.test(sub)) return false;
      return true;
    });
    // See /api/listings for why the raw @odata.count is not the number to
    // advertise: it counts commercial/lease rows this site never shows.
    const excludedRate = rawCount > 0 ? (rawCount - items.length) / rawCount : 0;
    const browsableTotal = Math.round(total * (1 - excludedRate));

    const listings = items.map((l) => {
      const price = l.ListPrice || 0;
      const beds = l.BedroomsTotal || 0;
      const rawCity = l.City || 'Toronto';
      // Normalize Toronto sub-areas (Toronto C01, Toronto E05) → Toronto. That
      // one is legitimate: the request uses startswith(City,'Toronto'), so the
      // rows and the label describe the same set.
      //
      // Every other municipality now keeps the board's own name. This line
      // also relabelled 'Halton Hills' as 'Georgetown', which broke three
      // things at once: the relabel ran BEFORE estimateRent, so those listings
      // were priced with the 0.90 unknown-city tier instead of 0.95 (rent, and
      // therefore cash flow, cap rate, cash-on-cash and Deal Score, understated
      // — a 3-bed detached at $999k came out at $3,000/mo instead of $3,100);
      // the /gta/halton-hills page displayed all of its listings as Georgetown,
      // collapsing Acton and Glen Williams under that name too; and it hid the
      // fact that /gta/georgetown was querying a city name the board may not
      // use. The request now asks for both names instead (see above).
      const city = rawCity.startsWith('Toronto') ? 'Toronto' : rawCity;
      const type = mapType(l.PropertySubType, l.PropertyType);
      const rent = estimateRent(price, beds, city, type);
      const drop = l.OriginalListPrice && l.OriginalListPrice > price
        ? Math.round(((l.OriginalListPrice - price) / l.OriginalListPrice) * 100)
        : 0;
      const rem = l.PublicRemarks || '';

      // See lib/listings/market-timing.js — ModificationTimestamp is the sync
      // stamp and must never stand in for days-on-market. 0 = unknown.
      const dom = computeDaysOnMarket(l);
      const daysSinceUpdate = computeDaysSinceUpdate(l);

      // Extract photos from expanded Media
      const ph = [];
      if (l.Media && Array.isArray(l.Media)) {
        const seen = {};
        for (const m of l.Media) {
          const u = m.MediaURL || '';
          if (u && !seen[u]) { seen[u] = true; ph.push(u); }
        }
      }

      return {
        id: l.ListingKey,
        // ListingId is VOW-suppressed (null) on active listings, but ListingKey
      // IS the MLS number ('W13607630') — a null mlsId on every record just
      // looks broken to anyone reading the API.
      mlsId: l.ListingId || l.ListingKey,
        price,
        address: addr(l),
        city,
        // CityRegion = the COMMUNITY, not the municipality. See the note in
        // /api/listings — this was hardcoded to `city`, so neighbourhood
        // filtering and the per-neighbourhood rent table never saw a real
        // community name. Falls back to city exactly as before when absent.
        neighbourhood: l.CityRegion || city,
        postalCode: l.PostalCode,
        beds,
        baths: l.BathroomsTotalInteger || 0,
        type,
        subType: l.PropertySubType || '',
        yearBuilt: l.YearBuilt,
        dom,
        daysOnMarket: dom,
        daysSinceUpdate,
        status: l.StandardStatus,
        brokerage: l.ListOfficeName || '',
        remarks: rem,
        photos: ph,
        images: ph,
        lat: l.Latitude,
        lng: l.Longitude,
        // TREB serves sqft as a banded range string; the numeric fields are
        // unsupported. Parsed to the band midpoint — approximate by nature.
        sqft: l.LivingArea || l.BuildingAreaTotal || parseLivingAreaRange(l.LivingAreaRange),
        sqftApproximate: !l.LivingArea && !l.BuildingAreaTotal && !!l.LivingAreaRange,
        // Already selected from AMPRE (all three fallback $selects) but never
        // returned, so the sitemap had no real date for GTA listings and
        // stamped "now" on every one. Passthrough only — no logic depends on it.
        modificationTimestamp: l.ModificationTimestamp || null,
        originalPrice: l.OriginalListPrice || price,
        priceDrop: drop,
        priceReduction: drop,
        estimatedRent: rent,
        rent,
        hasSuite: /separate entrance|in-law|basement apt|2nd kitchen|second kitchen|legal basement|finished basement|accessory|rental income|two unit|2 unit/i.test(rem),
        condoFee: normalizeCondoFee(l.AssociationFee, l.AssociationFeeFrequency),
      };
    });

    // Honest "N+ days on market" floor (see lib/listings/first-seen.js).
    const firstSeenTracker = await applyFirstSeenFloor(listings);

    return NextResponse.json(
      { listings, total, browsableTotal, fieldTier, supportedFields, firstSeenTracker, page, limit, pages: Math.ceil(total / limit), timestamp: new Date().toISOString() },
      {
        headers: {
          // 15 minutes, not a day. s-maxage=86400 cached every page URL at the CDN
          // for 24h, which had two nasty effects on a feed labelled "live":
          // every deploy's data fix stayed INVISIBLE on re-crawls for up to a
          // day (a re-audit kept reading pre-fix responses and reasonably
          // concluded nothing was fixed), and each surface's cache aged
          // differently so the same count read differently page to page.
          'Cache-Control': 's-maxage=900, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('gta listings err:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
