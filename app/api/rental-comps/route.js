import { NextResponse } from 'next/server';
import { odataStr } from '@/lib/listings/odata';

export const dynamic = 'force-dynamic';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

/**
 * GET /api/rental-comps?city=Mississauga&type=Detached&beds=3&lat=43.58&lng=-79.55
 *
 * Query AMPRE for recently leased properties to estimate rent from real comps.
 * Returns median lease price and individual comps.
 */
// A lease of a BASEMENT or an UPPER half is not a comp for what a whole
// property rents for, but the feed returns all of them together and the
// median was computed over the mix. Measured against production 2026-07-26:
// Cooksville (L5A) detached returned a $3,200 median while the whole-house
// leases inside that same result were $4,200 / $4,400 / $5,750 / $6,500 —
// dragged down by a "Lower Unit" at $1,900 and a "BSMT" at $1,700. The site
// compares this median against estimateRent(), which is a WHOLE-property
// figure (basement income is added separately), so the mix made the
// comparison meaningless in both directions.
//
// MLS encodes the unit in the address rather than a field, so it is parsed
// from there. Matching is on word boundaries: "Main" must not fire on
// "Main Street", and "Lower" must not fire on "Lower Base Line" (a real
// Mississauga road).
const PARTIAL_UNIT = /\b(bsmt|basement|lower level|lower unit|upper unit|upper level|main floor|second floor|ground floor|1st floor|2nd floor|unit\s*[a-z0-9]+|ste\.?\s*\d|apt\.?\s*\d|#\s*\d)\b/i;
const BARE_LEVEL = /\b(bsmt|basement|upper|lower|main)\s*$/i;

function classifyUnit(address) {
  const a = (address || '').trim();
  if (!a) return 'unknown';
  // A bare trailing level word ("... Drive Bsmt", "... Avenue N Upper") is the
  // most common form, but it has to be tested against the STREET segment only:
  // the full string continues ", Mississauga, ON L4T 1P3", so anchoring to the
  // end of the whole address never matches. Splitting on the first comma also
  // keeps the trap cases safe — "88 Upper Middle Road" and "5100 Lower Base
  // Line" end in Road/Line, so the level word is not in final position.
  const street = a.split(',')[0].trim();
  if (PARTIAL_UNIT.test(a) || BARE_LEVEL.test(street)) return 'partial';
  return 'whole';
}

// Prefer whole-property comps; fall back to everything if too few to be
// meaningful, and say which happened so no caller has to guess.
function wholeUnitMedian(comps) {
  const wholeOnly = comps.filter(c => c.unitType === 'whole');
  if (wholeOnly.length >= 3) {
    return { median: getMedian(wholeOnly.map(c => c.leasePrice)), count: wholeOnly.length, whole: true };
  }
  return { median: getMedian(comps.map(c => c.leasePrice)), count: comps.length, whole: false };
}


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
  // Forward Sortation Area (first 3 postal chars, e.g. L4T = Malton). The
  // lat/lng params were accepted but NEVER used in the lease query — every
  // result came from the whole city while the response was labelled "nearby".
  // FSA is the filter the MLS feed can actually apply.
  const fsa = (searchParams.get('fsa') || '').trim().toUpperCase().slice(0, 3);

  try {
    // Try TIER 1: Recently leased properties
    const leaseComps = await fetchLeaseComps(city, type, beds, 12, 1, fsa);

    if (leaseComps.length >= 3) {
      const { median, count, whole } = wholeUnitMedian(leaseComps);
      return NextResponse.json({
        comps: leaseComps.slice(0, 10),
        median,
        count,
        wholeUnitOnly: whole,
        source: 'lease_comps',
        label: `Based on ${count} ${whole ? 'whole-property ' : ''}leases ${fsa ? 'in this area' : 'across ' + city} in the last 12 months`,
      }, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' } });
    }

    // Try wider search (18 months, +/- 2 beds)
    const widerComps = await fetchLeaseComps(city, type, beds, 18, 2);
    if (widerComps.length >= 3) {
      const { median, count, whole } = wholeUnitMedian(widerComps);
      return NextResponse.json({
        comps: widerComps.slice(0, 10),
        median,
        count,
        wholeUnitOnly: whole,
        source: 'lease_comps_wide',
        label: `Based on ${count} ${whole ? 'whole-property ' : ''}leases in wider area (last 18 months)`,
      }, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' } });
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
        label: `Based on ${activeRentals.length} active rentals ${fsa ? 'in this area' : 'across ' + city} (asking prices, may vary)`,
      }, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' } });
    }

    // No comps found — not cached; empty result could change as new leases close
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

async function fetchLeaseComps(city, type, beds, months = 12, bedRange = 1, fsa = '') {
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
    : `City eq '${odataStr(city)}'`;
  const filters = [
    "(StandardStatus eq 'Closed' or StandardStatus eq 'Leased')",
    cityFilter,
    `BedroomsTotal ge ${Math.max(0, beds - bedRange)}`,
    `BedroomsTotal le ${beds + bedRange}`,
    `ModificationTimestamp ge ${cutoffStr}T00:00:00Z`,
    "ListPrice le 8000", // Lease prices are monthly rent amounts, not purchase prices
  ];

  // Neighbourhood scoping, when the caller asks for it.
  if (/^L[0-9][A-Z]$/.test(fsa)) {
    filters.push(`startswith(PostalCode, '${fsa}')`);
  }

  // Add type filter if we have a mapping
  if (typeMap[type]) {
    filters.push(typeMap[type]);
  }

  const sel = [
    'ListingKey', 'ListPrice', 'ClosePrice', 'City', 'UnparsedAddress',
    'BedroomsTotal', 'BathroomsTotalInteger', 'PropertySubType',
    'ModificationTimestamp', 'DaysOnMarket', 'Latitude', 'Longitude', 'PostalCode',
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
    unitType: classifyUnit(l.UnparsedAddress),
    fsa: (l.PostalCode || '').slice(0, 3),
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
    : `City eq '${odataStr(city)}'`;
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
    unitType: classifyUnit(l.UnparsedAddress),
    fsa: (l.PostalCode || '').slice(0, 3),
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
