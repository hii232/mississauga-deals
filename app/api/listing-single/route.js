import { NextResponse } from 'next/server';
import { computeDaysOnMarket, computeDaysSinceUpdate, computeDomFloor, parseLivingAreaRange } from '@/lib/listings/market-timing';
import { probeSupportedFields } from '@/lib/listings/ampre-fields';

export const dynamic = 'force-dynamic';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

function mapType(sub, prop) {
  const s = (sub || '').toLowerCase();
  const p = (prop || '').toLowerCase();
  if (s.includes('semi')) return 'Semi-Detached';
  if (s.includes('att') || s.includes('row') || s.includes('town')) return 'Townhouse';
  if (p.includes('condo') || s.includes('condo') || s.includes('apt')) return 'Condo';
  if (s.includes('duplex')) return 'Duplex';
  if (s.includes('triplex')) return 'Triplex';
  if (s.includes('fourplex') || s.includes('four-plex') || s.includes('quadruplex')) return 'Fourplex';
  if (s.includes('multi') || s.includes('multiplex')) return 'Multiplex';
  return 'Detached';
}

function addr(l) {
  return [l.UnitNumber ? l.UnitNumber + '-' : '', l.StreetNumber || '', l.StreetName || '', l.StreetSuffix || '']
    .filter(Boolean).join(' ').trim() || l.UnparsedAddress || 'Address on Request';
}

// Same normalization as the feed routes — AssociationFee arrives with a
// frequency, and an annual fee shown as monthly would be a wrong number.
function normalizeCondoFee(fee, frequency) {
  if (!fee || fee <= 0) return 0;
  const freq = (frequency || 'Monthly').toLowerCase();
  if (freq.includes('annual') || freq.includes('yearly')) return Math.round(fee / 12);
  if (freq.includes('quarter')) return Math.round(fee / 3);
  if (freq.includes('semi')) return Math.round(fee / 6);
  return Math.round(fee);
}

// Guaranteed-safe core. The probed fields (real listing dates for DOM,
// CityRegion, LivingAreaRange, AssociationFee…) are appended per-request from
// probeSupportedFields — this route previously kept its own hardcoded list and
// silently fell out of sync with the feeds: the DETAIL page showed dom "—",
// neighbourhood "Mississauga" and an ESTIMATED condo fee while the card for
// the same listing showed dom 25, "Cooksville" and the real fee — so cash
// flow and cash-on-cash visibly disagreed between card and detail.
const SEL = [
  'ListingKey', 'ListingId', 'ListPrice', 'OriginalListPrice',
  'City', 'PostalCode', 'UnparsedAddress', 'StreetNumber', 'StreetName',
  'StreetSuffix', 'UnitNumber', 'BedroomsTotal', 'BathroomsTotalInteger',
  'PropertyType', 'PropertySubType', 'YearBuilt', 'DaysOnMarket',
  'StandardStatus', 'ListOfficeName', 'PublicRemarks',
  'Latitude', 'Longitude', 'ModificationTimestamp',
].join(',');

/**
 * GET /api/listing-single?id=W12638790
 * Fetches a single listing by ListingKey — no city filter, works for any TREB listing.
 * Used as fallback when a GTA listing isn't found in the Mississauga listings API.
 */
export async function GET(request) {
  if (!TOK) {
    return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    const safeId = id.replace(/'/g, "''");
    const headers = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };
    // Ask the feed what this token may select (memoised 1h) and use ALL of it —
    // byte-identical field surface to the listings feeds, so the numbers
    // derived downstream cannot disagree between the card and this page.
    const supported = await probeSupportedFields(TOK);
    const FULL_SEL = supported.length ? SEL + ',' + supported.join(',') : SEL;

    // Photos, pulled in the SAME request as the listing.
    //
    // This route previously asked for no Media at all, which quietly cost the
    // site its best SEO asset on its highest-traffic page type. The listing
    // detail page is server-rendered from this endpoint, so with no photos in
    // the payload the server HTML for all ~5,400 listing pages carried:
    //   - a RealEstateListing JSON-LD with NO `image` (PropertyJsonLd only
    //     emits `image` when photos exist) — and images are what earn the
    //     rich result for a property listing
    //   - no LCP image in the markup at all; the hero only appeared after a
    //     separate client fetch to /api/photos, an endpoint the backlog
    //     already flags as intermittently timing out
    // The Media $expand is confirmed working against production (the listings
    // feed settles on the core+media tier and returns real photo URLs), so
    // asking for it here is safe. Degrades exactly as before if it is ever
    // rejected: `expand` is dropped and the client fetch still fills photos in.
    // Byte-identical to the listings feed's ACCEPTED expand — the only diff was
    // the missing MediaKey, and this exact form is proven against production.
    const EXPAND = '&$expand=' + encodeURIComponent('Media($select=MediaURL,MediaKey;$orderby=Order)');
    const sel = '$select=' + encodeURIComponent(FULL_SEL);

    let l = null;

    // Each approach is tried WITH the Media expand first, then without, so a
    // rejected expand costs only the photos rather than the whole listing.
    const attempts = [
      BASE + "/Property('" + safeId + "')?" + sel + EXPAND,
      BASE + "/Property('" + safeId + "')?" + sel,
      BASE + '/Property?$filter=' + encodeURIComponent("ListingKey eq '" + safeId + "'") + '&' + sel + EXPAND + '&$top=1',
      BASE + '/Property?$filter=' + encodeURIComponent("ListingKey eq '" + safeId + "'") + '&' + sel + '&$top=1',
      // Some IDs are a ListingId rather than a ListingKey.
      BASE + '/Property?$filter=' + encodeURIComponent("ListingId eq '" + safeId + "'") + '&' + sel + EXPAND + '&$top=1',
      BASE + '/Property?$filter=' + encodeURIComponent("ListingId eq '" + safeId + "'") + '&' + sel + '&$top=1',
    ];

    for (const url of attempts) {
      const resp = await fetch(url, { headers });
      if (!resp.ok) continue;
      const body = await resp.json();
      // Entity-key form returns the record directly; filter form wraps it.
      const found = body?.ListingKey ? body : body?.value?.[0] || null;
      if (found) { l = found; break; }
    }

    if (!l) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const price = l.ListPrice || 0;
    const beds = l.BedroomsTotal || 0;
    const city = l.City || 'Unknown';
    const type = mapType(l.PropertySubType, l.PropertyType);
    const drop = l.OriginalListPrice && l.OriginalListPrice > price
      ? Math.round(((l.OriginalListPrice - price) / l.OriginalListPrice) * 100)
      : 0;
    const rem = l.PublicRemarks || '';
    // Same computation as the feeds — real listing dates first, feed DOM
    // second, never the sync stamp. See lib/listings/market-timing.js.
    const dom = computeDaysOnMarket(l);
    const daysSinceUpdate = computeDaysSinceUpdate(l);
    const domFloor = computeDomFloor(dom, daysSinceUpdate, 0);

    // Photos from the expanded Media, deduped and in feed order.
    const photos = [];
    if (Array.isArray(l.Media)) {
      const seen = new Set();
      for (const m of l.Media) {
        const u = m?.MediaURL || '';
        if (u && !seen.has(u)) { seen.add(u); photos.push(u); }
      }
    }

    const listing = {
      id: l.ListingKey,
      // ListingId is VOW-suppressed (null) on active listings, but ListingKey
      // IS the MLS number ('W13607630') — a null mlsId on every record just
      // looks broken to anyone reading the API.
      mlsId: l.ListingId || l.ListingKey,
      price,
      address: addr(l),
      city,
      // CityRegion = the real community, matching the feeds. Falls back to
      // city exactly as before when the feed omits it.
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
      domFloor,
      status: l.StandardStatus,
      brokerage: l.ListOfficeName || '',
      remarks: rem,
      photos,
      images: photos,
      lat: l.Latitude,
      lng: l.Longitude,
      sqft: l.LivingArea || l.BuildingAreaTotal || parseLivingAreaRange(l.LivingAreaRange),
      sqftApproximate: !l.LivingArea && !l.BuildingAreaTotal && !!l.LivingAreaRange,
      condoFee: normalizeCondoFee(l.AssociationFee, l.AssociationFeeFrequency),
      originalPrice: l.OriginalListPrice || price,
      priceDrop: drop,
      priceReduction: drop,
      estimatedRent: 0,
      rent: 0,
      hasSuite: /separate entrance|in-law|basement apt|2nd kitchen|second kitchen|legal basement|finished basement|accessory|rental income|two unit|2 unit/i.test(rem),
    };

    return NextResponse.json(
      { listing },
      {
        headers: {
          // 15 minutes, matching the feeds. This sat at s-maxage=86400 — the
          // SAME 24h-cache bug already killed on the feed routes but missed
          // here, so every detail-page fix stayed invisible on re-visits for
          // up to a day while the cards updated in 15 minutes.
          'Cache-Control': 's-maxage=900, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('listing-single err:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
