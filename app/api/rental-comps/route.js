import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

/**
 * GET /api/rental-comps?city=Mississauga&type=Detached&beds=3&lat=43.58&lng=-79.55
 *
 * Query AMPRE for recently leased properties to estimate rent from real comps.
 * Returns median lease price and individual comps.
 */
export async function GET(request) {
  if (!TOK) {
    return NextResponse.json({ comps: [], median: 0, source: 'unavailable' });
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || 'Mississauga';
  const type = searchParams.get('type') || '';
  const beds = parseInt(searchParams.get('beds') || '3');
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');

  try {
    // Try TIER 1: Recently leased properties
    const leaseComps = await fetchLeaseComps(city, type, beds, 12);

    if (leaseComps.length >= 3) {
      const median = getMedian(leaseComps.map(c => c.leasePrice));
      return NextResponse.json({
        comps: leaseComps.slice(0, 10),
        median,
        count: leaseComps.length,
        source: 'lease_comps',
        label: `Based on ${leaseComps.length} similar leases nearby in last 12 months`,
      });
    }

    // Try wider search (18 months, +/- 2 beds)
    const widerComps = await fetchLeaseComps(city, type, beds, 18, 2);
    if (widerComps.length >= 3) {
      const median = getMedian(widerComps.map(c => c.leasePrice));
      return NextResponse.json({
        comps: widerComps.slice(0, 10),
        median,
        count: widerComps.length,
        source: 'lease_comps_wide',
        label: `Based on ${widerComps.length} similar leases in wider area (last 18 months)`,
      });
    }

    // Try TIER 2: Active rental listings
    const activeRentals = await fetchActiveRentals(city, type, beds);
    if (activeRentals.length >= 3) {
      const median = Math.round(getMedian(activeRentals.map(c => c.leasePrice)) * 0.97); // 3% discount from asking
      return NextResponse.json({
        comps: activeRentals.slice(0, 10),
        median,
        count: activeRentals.length,
        source: 'active_rentals',
        label: `Based on ${activeRentals.length} active rentals nearby (asking prices, may vary)`,
      });
    }

    // No comps found
    return NextResponse.json({
      comps: [],
      median: 0,
      count: 0,
      source: 'none',
      label: 'No rental comps found in this area',
    });
  } catch (err) {
    console.error('Rental comps error:', err.message);
    return NextResponse.json({ comps: [], median: 0, source: 'error' });
  }
}

async function fetchLeaseComps(city, type, beds, months = 12, bedRange = 1) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  // Map property types for matching
  const typeMap = {
    'Detached': "PropertySubType eq 'Detached'",
    'Semi-Detached': "(PropertySubType eq 'Semi-Detached' or PropertySubType eq 'Semi-detached')",
    'Att/Row/Twnhouse': "PropertySubType eq 'Att/Row/Twnhouse'",
    'Condo Apt': "PropertySubType eq 'Condo Apt'",
  };

  const cityFilter = city.toLowerCase() === 'toronto'
    ? "startswith(City, 'Toronto')"
    : `City eq '${city}'`;
  const filters = [
    "(StandardStatus eq 'Closed' or StandardStatus eq 'Leased')",
    cityFilter,
    `BedroomsTotal ge ${Math.max(0, beds - bedRange)}`,
    `BedroomsTotal le ${beds + bedRange}`,
    `ModificationTimestamp ge ${cutoffStr}T00:00:00Z`,
    "ListPrice le 8000", // Lease prices are monthly rent amounts, not purchase prices
  ];

  // Add type filter if we have a mapping
  if (typeMap[type]) {
    filters.push(typeMap[type]);
  }

  const sel = [
    'ListingKey', 'ListPrice', 'ClosePrice', 'City', 'UnparsedAddress',
    'BedroomsTotal', 'BathroomsTotalInteger', 'PropertySubType',
    'ModificationTimestamp', 'DaysOnMarket', 'Latitude', 'Longitude',
  ].join(',');

  const url = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
    + '&$select=' + encodeURIComponent(sel)
    + '&$top=20&$orderby=ModificationTimestamp desc';

  const resp = await fetch(url, {
    headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' },
  });

  if (!resp.ok) return [];

  const data = await resp.json();
  const items = data.value || [];

  return items.map(l => ({
    id: l.ListingKey,
    address: l.UnparsedAddress || 'Address withheld',
    beds: l.BedroomsTotal || 0,
    baths: l.BathroomsTotalInteger || 0,
    type: l.PropertySubType || '',
    leasePrice: l.ClosePrice || l.ListPrice || 0,
    leaseDate: l.ModificationTimestamp,
    dom: l.DaysOnMarket || 0,
    lat: l.Latitude || null,
    lng: l.Longitude || null,
  })).filter(c => c.leasePrice > 0 && c.leasePrice <= 10000); // Sanity check: monthly rent
}

async function fetchActiveRentals(city, type, beds) {
  const cityFilter = city.toLowerCase() === 'toronto'
    ? "startswith(City, 'Toronto')"
    : `City eq '${city}'`;
  const filters = [
    "StandardStatus eq 'Active'",
    cityFilter,
    `BedroomsTotal ge ${Math.max(0, beds - 1)}`,
    `BedroomsTotal le ${beds + 1}`,
    "ListPrice le 8000", // Active lease listings have monthly rent as price
  ];

  const typeMap = {
    'Detached': "PropertySubType eq 'Detached'",
    'Semi-Detached': "(PropertySubType eq 'Semi-Detached' or PropertySubType eq 'Semi-detached')",
  };
  if (typeMap[type]) filters.push(typeMap[type]);

  const sel = [
    'ListingKey', 'ListPrice', 'City', 'UnparsedAddress',
    'BedroomsTotal', 'BathroomsTotalInteger', 'PropertySubType',
    'DaysOnMarket', 'Latitude', 'Longitude',
  ].join(',');

  const url = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
    + '&$select=' + encodeURIComponent(sel)
    + '&$top=20&$orderby=ModificationTimestamp desc';

  const resp = await fetch(url, {
    headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' },
  });

  if (!resp.ok) return [];

  const data = await resp.json();
  const items = data.value || [];

  return items.map(l => ({
    id: l.ListingKey,
    address: l.UnparsedAddress || 'Address withheld',
    beds: l.BedroomsTotal || 0,
    baths: l.BathroomsTotalInteger || 0,
    type: l.PropertySubType || '',
    leasePrice: l.ListPrice || 0,
    dom: l.DaysOnMarket || 0,
    lat: l.Latitude || null,
    lng: l.Longitude || null,
  })).filter(c => c.leasePrice > 0 && c.leasePrice <= 10000);
}

function getMedian(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}
