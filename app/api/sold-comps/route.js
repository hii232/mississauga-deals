import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

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
    const baths = parseInt(searchParams.get('baths')) || 0;
    const postalPrefix = searchParams.get('postal') || '';
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 50);
    const debug = searchParams.get('debug') === '1';

    const headers = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };
    const sel = [
      'ListingKey', 'ListingId', 'ListPrice', 'ClosePrice',
      'City', 'PostalCode', 'UnparsedAddress', 'StreetNumber', 'StreetName',
      'StreetSuffix', 'UnitNumber', 'BedroomsTotal', 'BathroomsTotalInteger',
      'PropertyType', 'PropertySubType', 'DaysOnMarket',
      'StandardStatus', 'ListOfficeName',
      'Latitude', 'Longitude', 'ModificationTimestamp', 'CloseDate',
    ].join(',');

    // AMPRE uses 'Closed' for sold listings (confirmed working)
    const statusAttempts = [
      "StandardStatus eq 'Closed'",
    ];

    let items = [];
    let total = 0;
    let usedFilter = '';
    let debugInfo = {};

    for (const statusFilter of statusAttempts) {
      const filters = [statusFilter];
      // Toronto sub-areas in TREB: "Toronto W03", "Toronto C01", etc.
      if (city.toLowerCase() === 'toronto') {
        filters.push("startswith(City, 'Toronto')");
      } else {
        filters.push("City eq '" + city.replace(/'/g, "''") + "'");
      }

      // Similar property type (handle compound types like "Condo Townhouse")
      if (type) {
        const typeLower = type.toLowerCase();
        const typeMap = {
          'detached': "(PropertyType eq 'Residential' or PropertyType eq 'Residential Freehold')",
          'semi-detached': "contains(PropertySubType, 'Semi')",
          'semi': "contains(PropertySubType, 'Semi')",
          'townhouse': "(contains(PropertySubType, 'Town') or contains(PropertySubType, 'Row') or contains(PropertySubType, 'Att'))",
          'town': "(contains(PropertySubType, 'Town') or contains(PropertySubType, 'Row') or contains(PropertySubType, 'Att'))",
          'condo': "(contains(PropertyType, 'Condo') or contains(PropertySubType, 'Condo') or contains(PropertySubType, 'Apt'))",
          'condo townhouse': "(contains(PropertySubType, 'Town') or contains(PropertySubType, 'Row'))",
          'condo apt': "(contains(PropertyType, 'Condo') or contains(PropertySubType, 'Apt'))",
          'duplex': "contains(PropertySubType, 'Duplex')",
          'triplex': "contains(PropertySubType, 'Triplex')",
          'fourplex': "contains(PropertySubType, 'Fourplex')",
          'multiplex': "contains(PropertySubType, 'Multiplex')",
        };
        // Try exact match first, then check if type contains a known key
        let typeFilter = typeMap[typeLower];
        if (!typeFilter) {
          for (const [key, val] of Object.entries(typeMap)) {
            if (typeLower.includes(key)) { typeFilter = val; break; }
          }
        }
        if (typeFilter) filters.push(typeFilter);
      }

      // Similar bed count (±1)
      if (beds > 0) {
        filters.push('BedroomsTotal ge ' + Math.max(1, beds - 1));
        filters.push('BedroomsTotal le ' + (beds + 1));
      }

      // Similar bath count (±1)
      if (baths > 0) {
        filters.push('BathroomsTotalInteger ge ' + Math.max(1, baths - 1));
        filters.push('BathroomsTotalInteger le ' + (baths + 1));
      }

      // Narrow by postal code prefix (first 3 chars = FSA) for area proximity
      if (postalPrefix && postalPrefix.length >= 3) {
        filters.push("startswith(PostalCode, '" + postalPrefix.substring(0, 3).replace(/'/g, "''") + "')");
      }

      // Exclude commercial/lease/rentals
      filters.push("PropertyType ne 'Commercial'");
      filters.push("PropertyType ne 'Business'");
      filters.push('ListPrice ge 100000'); // Filter out lease/rental listings (monthly rent amounts)

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

    // If no sold data found, try broader search without type/bed filters
    if (items.length === 0) {
      const cityFilter = city.toLowerCase() === 'toronto'
        ? "startswith(City, 'Toronto')"
        : "City eq '" + city.replace(/'/g, "''") + "'";
      const broadFilters = [
        "StandardStatus eq 'Closed'",
        cityFilter,
        "PropertyType ne 'Commercial'",
        "PropertyType ne 'Business'",
        'ListPrice ge 100000',
      ];
      const url = BASE + '/Property?$filter=' + encodeURIComponent(broadFilters.join(' and '))
        + '&$select=' + encodeURIComponent(sel)
        + '&$top=' + limit
        + '&$orderby=ModificationTimestamp desc&$count=true';

      try {
        const resp = await fetch(url, { headers });
        if (resp.ok) {
          const data = await resp.json();
          if ((data.value || []).length > 0) {
            items = data.value;
            total = data['@odata.count'] || items.length;
            usedFilter = 'broad_closed';
          }
        }
      } catch {}
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
