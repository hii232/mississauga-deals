import { NextResponse } from 'next/server';
import { computeDaysSinceUpdate, computeDomFloor } from '@/lib/listings/market-timing';

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

// Fields confirmed to work with AMPRE OData API
// Note: OnMarketDate, LivingArea, BuildingAreaTotal are NOT supported
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
    const sel = '$select=' + encodeURIComponent(SEL);

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
    // DaysOnMarket comes back null on ACTIVE listings from this feed, so 0
    // here means UNKNOWN, not "listed today" — see lib/listings/market-timing.js.
    const dom = Number(l.DaysOnMarket) > 0 ? Number(l.DaysOnMarket) : 0;
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
      mlsId: l.ListingId,
      price,
      address: addr(l),
      city,
      neighbourhood: city,
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
      sqft: 0,
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
          'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('listing-single err:', err.message);
    return NextResponse.json({ error: 'Server error', detail: err.message }, { status: 500 });
  }
}
