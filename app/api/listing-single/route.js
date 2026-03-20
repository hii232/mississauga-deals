import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_TOKEN;

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

    let l = null;

    // Approach 1: Direct entity key access — fastest
    const resp1 = await fetch(
      BASE + "/Property('" + safeId + "')?$select=" + encodeURIComponent(SEL),
      { headers }
    );
    if (resp1.ok) {
      const body = await resp1.json();
      if (body?.ListingKey) l = body;
    }

    // Approach 2: Filter by ListingKey
    if (!l) {
      const resp2 = await fetch(
        BASE + '/Property?$filter=' + encodeURIComponent("ListingKey eq '" + safeId + "'")
          + '&$select=' + encodeURIComponent(SEL) + '&$top=1',
        { headers }
      );
      if (resp2.ok) {
        const data = await resp2.json();
        l = data.value?.[0] || null;
      }
    }

    // Approach 3: Filter by ListingId (some IDs may be ListingId)
    if (!l) {
      const resp3 = await fetch(
        BASE + '/Property?$filter=' + encodeURIComponent("ListingId eq '" + safeId + "'")
          + '&$select=' + encodeURIComponent(SEL) + '&$top=1',
        { headers }
      );
      if (resp3.ok) {
        const data = await resp3.json();
        l = data.value?.[0] || null;
      }
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
    const dom = l.DaysOnMarket || 0;

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
      status: l.StandardStatus,
      brokerage: l.ListOfficeName || '',
      remarks: rem,
      photos: [],
      images: [],
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
