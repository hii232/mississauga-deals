import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_TOKEN;

function addr(l) {
  return [l.UnitNumber ? l.UnitNumber + '-' : '', l.StreetNumber || '', l.StreetName || '', l.StreetSuffix || '']
    .filter(Boolean).join(' ').trim() || l.UnparsedAddress || 'Address on Request';
}

export async function GET(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'Mississauga';
    const type = searchParams.get('type') || '';
    const beds = parseInt(searchParams.get('beds')) || 0;
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 50);

    // Build filters for sold/closed listings in the same area
    const filters = [];

    // Try 'Closed' first (RESO standard), API may also use 'Sold'
    // We'll try both statuses with OR
    filters.push("(StandardStatus eq 'Closed' or StandardStatus eq 'Sold')");

    // Same city
    filters.push("City eq '" + city.replace(/'/g, "''") + "'");

    // Similar property type if provided
    if (type) {
      // Map our display type back to AMPRE property type/subtype patterns
      const typeMap = {
        'Detached': "PropertyType eq 'Residential'",
        'Semi-Detached': "(PropertySubType eq 'Semi-Detached' or PropertySubType eq 'Semi-detached')",
        'Townhouse': "(PropertySubType eq 'Att/Row/Twnhouse' or PropertySubType eq 'Row / Townhouse')",
        'Condo': "PropertyType eq 'Condominium'",
        'Duplex': "PropertySubType eq 'Duplex'",
        'Triplex': "PropertySubType eq 'Triplex'",
        'Fourplex': "PropertySubType eq 'Fourplex'",
        'Multiplex': "PropertySubType eq 'Multiplex'",
      };
      if (typeMap[type]) {
        filters.push(typeMap[type]);
      }
    }

    // Similar bed count (±1)
    if (beds > 0) {
      filters.push('BedroomsTotal ge ' + Math.max(1, beds - 1));
      filters.push('BedroomsTotal le ' + (beds + 1));
    }

    // Only recent sold (within ~12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const dateStr = oneYearAgo.toISOString().split('T')[0];
    filters.push("ModificationTimestamp gt " + dateStr + "T00:00:00Z");

    // Exclude commercial/lease
    filters.push("PropertyType ne 'Commercial'");
    filters.push("PropertyType ne 'Business'");

    const sel = [
      'ListingKey', 'ListingId', 'ListPrice', 'ClosePrice',
      'City', 'PostalCode', 'UnparsedAddress', 'StreetNumber', 'StreetName',
      'StreetSuffix', 'UnitNumber', 'BedroomsTotal', 'BathroomsTotalInteger',
      'PropertyType', 'PropertySubType', 'DaysOnMarket',
      'StandardStatus', 'ListOfficeName',
      'Latitude', 'Longitude', 'ModificationTimestamp',
      'OnMarketDate', 'CloseDate', 'OriginalEntryTimestamp',
    ].join(',');

    let url = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
      + '&$select=' + encodeURIComponent(sel)
      + '&$top=' + limit
      + '&$orderby=ModificationTimestamp desc&$count=true';

    const headers = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };
    let resp = await fetch(url, { headers });

    // Fallback: if Closed/Sold filter fails, try without status (just get recent listings)
    if (!resp.ok) {
      // Try with just 'Closed'
      filters[0] = "StandardStatus eq 'Closed'";
      url = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
        + '&$select=' + encodeURIComponent(sel)
        + '&$top=' + limit
        + '&$orderby=ModificationTimestamp desc&$count=true';
      resp = await fetch(url, { headers });
    }

    // Second fallback: try 'Sold' only
    if (!resp.ok) {
      filters[0] = "StandardStatus eq 'Sold'";
      url = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
        + '&$select=' + encodeURIComponent(sel)
        + '&$top=' + limit
        + '&$orderby=ModificationTimestamp desc&$count=true';
      resp = await fetch(url, { headers });
    }

    // Third fallback: remove date fields from select (some may not be supported)
    if (!resp.ok) {
      const selSafe = [
        'ListingKey', 'ListingId', 'ListPrice', 'ClosePrice',
        'City', 'PostalCode', 'UnparsedAddress', 'StreetNumber', 'StreetName',
        'StreetSuffix', 'UnitNumber', 'BedroomsTotal', 'BathroomsTotalInteger',
        'PropertyType', 'PropertySubType', 'DaysOnMarket',
        'StandardStatus', 'ListOfficeName',
        'Latitude', 'Longitude', 'ModificationTimestamp',
      ].join(',');
      url = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
        + '&$select=' + encodeURIComponent(selSafe)
        + '&$top=' + limit
        + '&$orderby=ModificationTimestamp desc&$count=true';
      resp = await fetch(url, { headers });
    }

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return NextResponse.json(
        { error: 'AMPRE ' + resp.status, detail: errText.substring(0, 400), comps: [] },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const items = data.value || [];
    const total = data['@odata.count'] || items.length;

    const comps = items.map((l) => {
      const listPrice = l.ListPrice || 0;
      const closePrice = l.ClosePrice || l.ListPrice || 0;
      const priceDelta = listPrice > 0
        ? +(((closePrice - listPrice) / listPrice) * 100).toFixed(1)
        : 0;

      return {
        id: l.ListingKey,
        mlsId: l.ListingId,
        address: addr(l),
        city: l.City || '',
        listPrice,
        closePrice,
        priceDelta,
        beds: l.BedroomsTotal || 0,
        baths: l.BathroomsTotalInteger || 0,
        type: l.PropertyType || '',
        subType: l.PropertySubType || '',
        dom: l.DaysOnMarket || 0,
        closeDate: l.CloseDate || l.ModificationTimestamp || null,
        status: l.StandardStatus || '',
        brokerage: l.ListOfficeName || '',
        lat: l.Latitude,
        lng: l.Longitude,
      };
    });

    // Calculate summary stats
    const soldWithPrice = comps.filter((c) => c.closePrice > 0);
    const stats = {
      avgSoldPrice: soldWithPrice.length > 0
        ? Math.round(soldWithPrice.reduce((s, c) => s + c.closePrice, 0) / soldWithPrice.length)
        : 0,
      avgDOM: soldWithPrice.length > 0
        ? Math.round(soldWithPrice.reduce((s, c) => s + c.dom, 0) / soldWithPrice.length)
        : 0,
      avgNegotiationGap: soldWithPrice.length > 0
        ? +(soldWithPrice.reduce((s, c) => s + c.priceDelta, 0) / soldWithPrice.length).toFixed(1)
        : 0,
      count: soldWithPrice.length,
      total,
    };

    return NextResponse.json(
      { comps, stats },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' } }
    );
  } catch (err) {
    console.error('sold-comps error:', err.message);
    return NextResponse.json({ error: 'Server error', detail: err.message, comps: [], stats: {} }, { status: 500 });
  }
}
