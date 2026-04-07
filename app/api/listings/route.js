import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;
const CITIES = [
  'Mississauga', 'Port Credit', 'Streetsville', 'Clarkson', 'Lakeview',
  'Erin Mills', 'Churchill Meadows', 'Cooksville', 'Hurontario', 'Meadowvale', 'Malton',
];

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

function estimateRent(price, beds, city, type) {
  // Conservative 2026 GTA rental rates
  const baseRents = { 0: 1650, 1: 1900, 2: 2400, 3: 2900, 4: 3400, 5: 3800 };
  const base = baseRents[Math.min(beds || 0, 5)] || 2400;
  let adj = type === 'Detached' ? 200 : type === 'Condo' ? -150 : 0;
  if (['Duplex', 'Triplex', 'Fourplex', 'Multiplex'].includes(type)) adj += 500;
  if ((city || '').toLowerCase().includes('port credit')) adj += 200;
  return Math.round(((price || 0) * 0.0035 * 0.3 + (base + adj) * 0.7) / 50) * 50;
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
    const limit = Math.min(parseInt(searchParams.get('limit')) || 200, 200);
    const skip = (page - 1) * limit;

    const filters = ["StandardStatus eq 'Active'", 'ListPrice ge 300000'];
    filters.push("PropertyType ne 'Commercial'");
    filters.push("PropertyType ne 'Business'");
    filters.push("PropertyType ne 'No Building'");

    if (searchParams.get('minPrice')) filters.push('ListPrice ge ' + parseInt(searchParams.get('minPrice')));
    if (searchParams.get('maxPrice')) filters.push('ListPrice le ' + parseInt(searchParams.get('maxPrice')));
    if (searchParams.get('beds')) filters.push('BedroomsTotal ge ' + parseInt(searchParams.get('beds')));
    if (searchParams.get('city')) {
      filters.push("City eq '" + searchParams.get('city') + "'");
    } else {
      filters.push('(' + CITIES.map((c) => "City eq '" + c + "'").join(' or ') + ')');
    }

    const sel = [
      'ListingKey', 'ListingId', 'ListPrice', 'OriginalListPrice',
      'City', 'PostalCode', 'UnparsedAddress', 'StreetNumber', 'StreetName',
      'StreetSuffix', 'UnitNumber', 'BedroomsTotal', 'BathroomsTotalInteger',
      'PropertyType', 'PropertySubType', 'YearBuilt', 'DaysOnMarket',
      'StandardStatus', 'ListOfficeName', 'PublicRemarks',
      'Latitude', 'Longitude', 'ModificationTimestamp',
      'OnMarketDate', 'ListingContractDate', 'OriginalEntryTimestamp',
      'LivingArea', 'BuildingAreaTotal',
      'AssociationFee', 'AssociationFeeFrequency',
    ].join(',');

    const expand = 'Media($select=MediaURL,MediaKey;$orderby=Order)';

    let url = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
      + '&$select=' + encodeURIComponent(sel)
      + '&$expand=' + encodeURIComponent(expand)
      + '&$top=' + limit + '&$skip=' + skip
      + '&$orderby=ModificationTimestamp desc&$count=true';

    let resp = await fetch(url, {
      headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' },
    });

    // Fallback: without $expand
    if (!resp.ok) {
      const urlNoExpand = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
        + '&$select=' + encodeURIComponent(sel)
        + '&$top=' + limit + '&$skip=' + skip
        + '&$orderby=ModificationTimestamp desc&$count=true';
      resp = await fetch(urlNoExpand, {
        headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' },
      });
    }

    // Fallback: without date fields
    if (!resp.ok) {
      const selSafe = [
        'ListingKey', 'ListingId', 'ListPrice', 'OriginalListPrice',
        'City', 'PostalCode', 'UnparsedAddress', 'StreetNumber', 'StreetName',
        'StreetSuffix', 'UnitNumber', 'BedroomsTotal', 'BathroomsTotalInteger',
        'PropertyType', 'PropertySubType', 'YearBuilt', 'DaysOnMarket',
        'StandardStatus', 'ListOfficeName', 'PublicRemarks',
        'Latitude', 'Longitude', 'ModificationTimestamp',
      ].join(',');
      const urlSafe = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
        + '&$select=' + encodeURIComponent(selSafe)
        + '&$top=' + limit + '&$skip=' + skip
        + '&$orderby=ModificationTimestamp desc&$count=true';
      resp = await fetch(urlSafe, {
        headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' },
      });
      if (!resp.ok) {
        const e = await resp.text();
        return NextResponse.json(
          { error: 'PropTx ' + resp.status, detail: e.substring(0, 400) },
          { status: resp.status }
        );
      }
    }

    const data = await resp.json();
    let items = data.value || [];
    const total = data['@odata.count'] || items.length;

    // Filter out commercial/lease subtypes
    const EXCLUDED = /sale of business|commercial|industrial|office|retail|vacant land|common element|parking|locker|storage/i;
    items = items.filter((l) => {
      const sub = l.PropertySubType || '';
      const prop = l.PropertyType || '';
      if (EXCLUDED.test(sub) || EXCLUDED.test(prop)) return false;
      if (/lease/i.test(prop) || /lease/i.test(sub)) return false;
      return true;
    });

    const listings = items.map((l) => {
      const price = l.ListPrice || 0;
      const beds = l.BedroomsTotal || 0;
      const city = l.City || 'Mississauga';
      const type = mapType(l.PropertySubType, l.PropertyType);
      const rent = estimateRent(price, beds, city, type);
      const drop = l.OriginalListPrice && l.OriginalListPrice > price
        ? Math.round(((l.OriginalListPrice - price) / l.OriginalListPrice) * 100)
        : 0;
      const rem = l.PublicRemarks || '';

      let dom = l.DaysOnMarket || 0;
      if (dom === 0) {
        const listDate = l.OnMarketDate || l.ListingContractDate || l.OriginalEntryTimestamp || l.ModificationTimestamp;
        if (listDate) {
          const diff = Math.floor((Date.now() - new Date(listDate).getTime()) / 86400000);
          if (diff > 0 && diff < 1000) dom = diff;
        }
      }

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
        photos: ph,
        images: ph,
        lat: l.Latitude,
        lng: l.Longitude,
        sqft: l.LivingArea || l.BuildingAreaTotal || 0,
        originalPrice: l.OriginalListPrice || price,
        priceDrop: drop,
        priceReduction: drop,
        estimatedRent: rent,
        rent,
        hasSuite: /separate entrance|in-law|basement apt|2nd kitchen|second kitchen|legal basement|finished basement|accessory|rental income|two unit|2 unit/i.test(rem),
        condoFee: normalizeCondoFee(l.AssociationFee, l.AssociationFeeFrequency),
      };
    });

    return NextResponse.json(
      { listings, total, page, limit, pages: Math.ceil(total / limit), timestamp: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('listings err:', err.message);
    return NextResponse.json({ error: 'Server error', detail: err.message }, { status: 500 });
  }
}
