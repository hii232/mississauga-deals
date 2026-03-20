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

// Minimal safe fields that definitely work with AMPRE
const SEL_SAFE = [
  'ListingKey', 'ListingId', 'ListPrice', 'OriginalListPrice',
  'City', 'PostalCode', 'UnparsedAddress', 'StreetNumber', 'StreetName',
  'StreetSuffix', 'UnitNumber', 'BedroomsTotal', 'BathroomsTotalInteger',
  'PropertyType', 'PropertySubType', 'YearBuilt', 'DaysOnMarket',
  'StandardStatus', 'ListOfficeName', 'PublicRemarks',
  'Latitude', 'Longitude', 'ModificationTimestamp',
].join(',');

async function tryFetch(url, headers) {
  try {
    const resp = await fetch(url, { headers });
    const text = await resp.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { ok: resp.ok, status: resp.status, json, text: text.substring(0, 300) };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
  }
}

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
    const dbg = {};

    let l = null;

    // Approach 1: Direct entity key access
    const r1 = await tryFetch(
      BASE + "/Property('" + safeId + "')?$select=" + encodeURIComponent(SEL_SAFE),
      headers
    );
    dbg.a1 = { ok: r1.ok, status: r1.status, err: r1.ok ? undefined : r1.text };
    if (r1.ok && r1.json?.ListingKey) l = r1.json;

    // Approach 2: $filter by ListingKey (safe fields only)
    if (!l) {
      const r2 = await tryFetch(
        BASE + '/Property?$filter=' + encodeURIComponent("ListingKey eq '" + safeId + "'")
          + '&$select=' + encodeURIComponent(SEL_SAFE) + '&$top=1',
        headers
      );
      dbg.a2 = { ok: r2.ok, status: r2.status, count: r2.json?.value?.length, err: r2.ok ? undefined : r2.text };
      if (r2.ok) l = r2.json?.value?.[0] || null;
    }

    // Approach 3: $filter by ListingId
    if (!l) {
      const r3 = await tryFetch(
        BASE + '/Property?$filter=' + encodeURIComponent("ListingId eq '" + safeId + "'")
          + '&$select=' + encodeURIComponent(SEL_SAFE) + '&$top=1',
        headers
      );
      dbg.a3 = { ok: r3.ok, status: r3.status, count: r3.json?.value?.length, err: r3.ok ? undefined : r3.text };
      if (r3.ok) l = r3.json?.value?.[0] || null;
    }

    if (!l) {
      return NextResponse.json({ error: 'Listing not found', debug: dbg }, { status: 404 });
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
