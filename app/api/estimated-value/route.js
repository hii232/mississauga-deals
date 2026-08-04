import { NextResponse } from 'next/server';
import { odataStr } from '@/lib/listings/odata';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

/**
 * GET /api/estimated-value?city=...&type=...&beds=...&baths=...&postal=...&price=...
 *
 * Computes estimated property value using comparable sold properties (CMA).
 * Similar to HouseSigma's estimated value feature.
 */
export async function GET(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || 'Mississauga';
  const type = searchParams.get('type') || '';
  const beds = parseInt(searchParams.get('beds')) || 0;
  const baths = parseInt(searchParams.get('baths')) || 0;
  const postal = searchParams.get('postal') || '';
  const listPrice = parseInt(searchParams.get('price')) || 0;
  const sqft = parseInt(searchParams.get('sqft')) || 0;

  const hdrs = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };
  const sel = [
    'ListingKey', 'ListPrice', 'ClosePrice', 'CloseDate',
    'City', 'PostalCode', 'UnparsedAddress', 'StreetNumber', 'StreetName',
    'StreetSuffix', 'UnitNumber', 'BedroomsTotal', 'BathroomsTotalInteger',
    'PropertyType', 'PropertySubType', 'DaysOnMarket',
    'Latitude', 'Longitude', 'LivingArea', 'BuildingAreaTotal',
  ].join(',');

  // Build type filter
  const typeLower = type.toLowerCase();
  const typeMap = {
    // Was PropertyType eq 'Residential'/'Residential Freehold' — that field is a
    // broad TRREB category shared by semi-detached, townhouse, duplex, triplex
    // and multiplex too, so a "detached" query pulled in cheaper subtypes as
    // comps and could understate the CMA estimate for the site's most common
    // property type. PropertySubType is the field that actually distinguishes
    // them (see the exact-eq pattern already used by /api/rental-comps).
    'detached': "PropertySubType eq 'Detached'",
    'semi-detached': "contains(PropertySubType, 'Semi')",
    'semi': "contains(PropertySubType, 'Semi')",
    'town': "(contains(PropertySubType, 'Town') or contains(PropertySubType, 'Row') or contains(PropertySubType, 'Att'))",
    'condo': "(contains(PropertyType, 'Condo') or contains(PropertySubType, 'Condo') or contains(PropertySubType, 'Apt'))",
    'duplex': "contains(PropertySubType, 'Duplex')",
    'triplex': "contains(PropertySubType, 'Triplex')",
    'multiplex': "contains(PropertySubType, 'Multiplex')",
  };
  let typeFilter = typeMap[typeLower];
  if (!typeFilter) {
    for (const [key, val] of Object.entries(typeMap)) {
      if (typeLower.includes(key)) { typeFilter = val; break; }
    }
  }

  try {
    // Query 1: Narrow — same FSA, same type, similar beds, last 6 months
    const fsa = postal && postal.length >= 3 ? postal.substring(0, 3) : '';
    const narrowFilters = [
      "StandardStatus eq 'Closed'",
      city.toLowerCase() === 'toronto'
        ? "startswith(City, 'Toronto')"
        : "City eq '" + odataStr(city) + "'",
      'ListPrice ge 100000',
    ];
    if (typeFilter) narrowFilters.push(typeFilter);
    if (beds > 0) {
      narrowFilters.push('BedroomsTotal ge ' + Math.max(1, beds - 1));
      narrowFilters.push('BedroomsTotal le ' + (beds + 1));
    }
    if (fsa) narrowFilters.push("startswith(PostalCode, '" + odataStr(fsa) + "')");

    const narrowUrl = BASE + '/Property?$filter=' + encodeURIComponent(narrowFilters.join(' and '))
      + '&$select=' + encodeURIComponent(sel)
      + '&$top=30&$orderby=CloseDate desc,ModificationTimestamp desc&$count=true';

    let resp = await fetch(narrowUrl, { headers: hdrs });
    let data = resp.ok ? await resp.json() : { value: [] };
    let comps = data.value || [];

    // Query 2: Broader — same city, same type if too few comps
    if (comps.length < 5) {
      const broadFilters = [
        "StandardStatus eq 'Closed'",
        city.toLowerCase() === 'toronto'
          ? "startswith(City, 'Toronto')"
          : "City eq '" + odataStr(city) + "'",
        'ListPrice ge 100000',
      ];
      if (typeFilter) broadFilters.push(typeFilter);
      if (beds > 0) {
        broadFilters.push('BedroomsTotal ge ' + Math.max(1, beds - 1));
        broadFilters.push('BedroomsTotal le ' + (beds + 1));
      }

      const broadUrl = BASE + '/Property?$filter=' + encodeURIComponent(broadFilters.join(' and '))
        + '&$select=' + encodeURIComponent(sel)
        + '&$top=30&$orderby=CloseDate desc,ModificationTimestamp desc';

      resp = await fetch(broadUrl, { headers: hdrs });
      data = resp.ok ? await resp.json() : { value: [] };
      const broadComps = data.value || [];
      // Merge, deduplicate
      const seen = new Set(comps.map((c) => c.ListingKey));
      for (const c of broadComps) {
        if (!seen.has(c.ListingKey)) { comps.push(c); seen.add(c.ListingKey); }
      }
    }

    // Filter out comps without close price
    comps = comps.filter((c) => (c.ClosePrice || 0) > 100000);

    if (comps.length === 0) {
      return NextResponse.json({
        estimatedValue: null,
        confidence: 'low',
        range: null,
        comps: [],
        message: 'Not enough comparable sales data',
      // SHORT cache, unlike the success path below: this is the empty answer,
      // and new sales close daily — a long window would freeze "not enough
      // data" on the panel for a day after the data arrived. Same
      // empty-heals-fast rule as /api/gta-screener's incomplete branch.
      }, { headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=3600' } });
    }

    // Score and weight each comp
    const now = Date.now();
    const scored = comps.map((c) => {
      const closePrice = c.ClosePrice || c.ListPrice;
      const closeDate = c.CloseDate || c.ModificationTimestamp;
      const monthsAgo = closeDate ? (now - new Date(closeDate).getTime()) / (30 * 86400000) : 12;

      // Recency weight: newer = better
      let recencyW = monthsAgo <= 3 ? 1.0 : monthsAgo <= 6 ? 0.85 : monthsAgo <= 9 ? 0.65 : 0.4;

      // Bed match weight
      const compBeds = c.BedroomsTotal || 0;
      const bedDiff = Math.abs(compBeds - beds);
      const bedW = bedDiff === 0 ? 1.0 : bedDiff === 1 ? 0.7 : 0.4;

      // Bath match weight
      const compBaths = c.BathroomsTotalInteger || 0;
      const bathDiff = Math.abs(compBaths - baths);
      const bathW = bathDiff === 0 ? 1.0 : bathDiff === 1 ? 0.85 : 0.6;

      // Postal proximity weight
      const compPostal = c.PostalCode || '';
      let postalW = 0.5;
      if (fsa && compPostal.startsWith(fsa)) postalW = 1.0;
      else if (postal.length >= 5 && compPostal.startsWith(postal.substring(0, 5))) postalW = 1.2;

      const totalWeight = recencyW * bedW * bathW * postalW;

      const addr = [c.UnitNumber ? c.UnitNumber + '-' : '', c.StreetNumber || '', c.StreetName || '', c.StreetSuffix || '']
        .filter(Boolean).join(' ').trim() || c.UnparsedAddress || '';

      return {
        closePrice,
        listPrice: c.ListPrice || 0,
        weight: totalWeight,
        beds: compBeds,
        baths: compBaths,
        address: addr,
        closeDate: closeDate ? new Date(closeDate).toISOString().split('T')[0] : null,
        city: c.City,
        dom: c.DaysOnMarket || 0,
        sqft: c.LivingArea || c.BuildingAreaTotal || 0,
      };
    });

    // Sort by weight descending, take top 15
    scored.sort((a, b) => b.weight - a.weight);
    const topComps = scored.slice(0, 15);

    // Weighted average
    const totalWeight = topComps.reduce((s, c) => s + c.weight, 0);
    const weightedAvg = totalWeight > 0
      ? Math.round(topComps.reduce((s, c) => s + c.closePrice * c.weight, 0) / totalWeight)
      : 0;

    // Trimmed range (exclude outliers — use 10th and 90th percentile)
    const prices = topComps.map((c) => c.closePrice).sort((a, b) => a - b);
    const p10Idx = Math.floor(prices.length * 0.1);
    const p90Idx = Math.ceil(prices.length * 0.9) - 1;
    const rangeLow = prices[Math.max(0, p10Idx)];
    const rangeHigh = prices[Math.min(prices.length - 1, p90Idx)];

    // Confidence
    const confidence = topComps.length >= 10 ? 'high' : topComps.length >= 5 ? 'medium' : 'low';

    // Price vs estimated
    let priceVsEstimated = null;
    if (listPrice > 0 && weightedAvg > 0) {
      const diff = ((listPrice - weightedAvg) / weightedAvg * 100);
      priceVsEstimated = {
        percentDiff: +diff.toFixed(1),
        label: diff < -3 ? 'Below Market' : diff > 3 ? 'Above Market' : 'At Market',
        color: diff < -3 ? 'green' : diff > 3 ? 'red' : 'neutral',
      };
    }

    return NextResponse.json({
      estimatedValue: weightedAvg,
      confidence,
      range: [rangeLow, rangeHigh],
      compCount: topComps.length,
      priceVsEstimated,
      comps: topComps.slice(0, 5).map((c) => ({
        address: c.address,
        closePrice: c.closePrice,
        listPrice: c.listPrice,
        beds: c.beds,
        baths: c.baths,
        closeDate: c.closeDate,
        dom: c.dom,
        sqft: c.sqft,
      })),
    }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (err) {
    console.error('estimated-value error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
