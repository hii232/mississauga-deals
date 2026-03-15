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
    const debug = searchParams.get('debug') === '1';

    const headers = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };
    const sel = [
      'ListingKey', 'ListingId', 'ListPrice', 'ClosePrice',
      'City', 'PostalCode', 'UnparsedAddress', 'StreetNumber', 'StreetName',
      'StreetSuffix', 'UnitNumber', 'BedroomsTotal', 'BathroomsTotalInteger',
      'PropertyType', 'PropertySubType', 'DaysOnMarket',
      'StandardStatus', 'ListOfficeName',
      'Latitude', 'Longitude', 'ModificationTimestamp',
    ].join(',');

    // Status values to try — AMPRE/CREA may use different conventions
    const statusAttempts = [
      "StandardStatus eq 'Closed'",
      "StandardStatus eq 'Sold'",
      "(StandardStatus eq 'Closed' or StandardStatus eq 'Sold')",
      "StandardStatus ne 'Active'",  // catch-all: everything that's NOT active
    ];

    let items = [];
    let total = 0;
    let usedFilter = '';
    let debugInfo = {};

    for (const statusFilter of statusAttempts) {
      const filters = [statusFilter];
      filters.push("City eq '" + city.replace(/'/g, "''") + "'");

      // Similar property type
      if (type) {
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
        if (typeMap[type]) filters.push(typeMap[type]);
      }

      // Similar bed count (±1)
      if (beds > 0) {
        filters.push('BedroomsTotal ge ' + Math.max(1, beds - 1));
        filters.push('BedroomsTotal le ' + (beds + 1));
      }

      // Exclude commercial/lease
      filters.push("PropertyType ne 'Commercial'");
      filters.push("PropertyType ne 'Business'");

      const url = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
        + '&$select=' + encodeURIComponent(sel)
        + '&$top=' + limit
        + '&$orderby=ModificationTimestamp desc&$count=true';

      try {
        const resp = await fetch(url, { headers });
        if (debug) {
          debugInfo[statusFilter] = { status: resp.status, ok: resp.ok };
        }

        if (resp.ok) {
          const data = await resp.json();
          const count = data['@odata.count'] || (data.value || []).length;

          if (debug) {
            debugInfo[statusFilter].count = count;
            // Show unique statuses found
            const statuses = [...new Set((data.value || []).map(v => v.StandardStatus))];
            debugInfo[statusFilter].statuses = statuses;
          }

          if (count > 0) {
            items = data.value || [];
            total = count;
            usedFilter = statusFilter;
            break;
          }
        } else if (debug) {
          const errText = await resp.text().catch(() => '');
          debugInfo[statusFilter].error = errText.substring(0, 200);
        }
      } catch (e) {
        if (debug) debugInfo[statusFilter] = { error: e.message };
      }
    }

    // If no sold data found with any status filter, try getting non-active listings without type/bed filters
    if (items.length === 0) {
      const broadFilters = [
        "StandardStatus ne 'Active'",
        "City eq '" + city.replace(/'/g, "''") + "'",
        "PropertyType ne 'Commercial'",
        "PropertyType ne 'Business'",
      ];
      const url = BASE + '/Property?$filter=' + encodeURIComponent(broadFilters.join(' and '))
        + '&$select=' + encodeURIComponent(sel)
        + '&$top=' + limit
        + '&$orderby=ModificationTimestamp desc&$count=true';

      try {
        const resp = await fetch(url, { headers });
        if (debug) {
          debugInfo['broad_ne_active'] = { status: resp.status, ok: resp.ok };
        }
        if (resp.ok) {
          const data = await resp.json();
          if (debug) {
            debugInfo['broad_ne_active'].count = data['@odata.count'] || (data.value || []).length;
            const statuses = [...new Set((data.value || []).map(v => v.StandardStatus))];
            debugInfo['broad_ne_active'].statuses = statuses;
          }
          if ((data.value || []).length > 0) {
            items = data.value;
            total = data['@odata.count'] || items.length;
            usedFilter = 'broad_ne_active';
          }
        }
      } catch (e) {
        if (debug) debugInfo['broad_ne_active'] = { error: e.message };
      }
    }

    // Map items to comps
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

    const result = { comps, stats, usedFilter };
    if (debug) result.debug = debugInfo;

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (err) {
    console.error('sold-comps error:', err.message);
    return NextResponse.json({ error: 'Server error', detail: err.message, comps: [], stats: {} }, { status: 500 });
  }
}
