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

/**
 * GET /api/listing-single?id=W12638790
 * Fetches a single listing by ListingKey — no city filter, works for any TREB listing
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
    // Only use fields known to work with AMPRE OData API
    const sel = [
      'ListingKey', 'ListingId', 'ListPrice', 'OriginalListPrice',
      'City', 'PostalCode', 'UnparsedAddress', 'StreetNumber', 'StreetName',
      'StreetSuffix', 'UnitNumber', 'BedroomsTotal', 'BathroomsTotalInteger',
      'PropertyType', 'PropertySubType', 'YearBuilt', 'DaysOnMarket',
      'StandardStatus', 'ListOfficeName', 'PublicRemarks',
      'Latitude', 'Longitude', 'ModificationTimestamp',
      'LivingArea', 'BuildingAreaTotal',
    ].join(',');

    const safeId = id.replace(/'/g, "''");
    const headers = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };

    let l = null;

    // Approach 1: Direct entity access Property('{id}')
    let resp = await fetch(
      BASE + "/Property('" + safeId + "')?$select=" + encodeURIComponent(sel),
      { headers }
    );
    if (resp.ok) {
      const body = await resp.json();
      if (body?.ListingKey) l = body;
    }

    // Approach 2: Filter by ListingKey
    if (!l) {
      const filter = "ListingKey eq '" + safeId + "'";
      resp = await fetch(
        BASE + '/Property?$filter=' + encodeURIComponent(filter) + '&$select=' + encodeURIComponent(sel) + '&$top=1',
        { headers }
      );
      if (resp.ok) {
        const data = await resp.json();
        l = data.value?.[0] || null;
      }
    }

    // Approach 3: Filter by ListingId
    if (!l) {
      const filter = "ListingId eq '" + safeId + "'";
      resp = await fetch(
        BASE + '/Property?$filter=' + encodeURIComponent(filter) + '&$select=' + encodeURIComponent(sel) + '&$top=1',
        { headers }
      );
      if (resp.ok) {
        const data = await resp.json();
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
      sqft: l.LivingArea || l.BuildingAreaTotal || 0,
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
