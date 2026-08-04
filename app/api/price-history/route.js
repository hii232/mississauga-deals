import { NextResponse } from 'next/server';
import { odataStr } from '@/lib/listings/odata';

export const dynamic = 'force-dynamic';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

export async function GET(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  try {
    const { searchParams } = new URL(request.url);
    const streetNumber = searchParams.get('streetNumber') || '';
    const streetName = searchParams.get('streetName') || '';
    const city = searchParams.get('city') || '';
    const unit = searchParams.get('unit') || '';

    if (!streetName || !city) {
      return NextResponse.json({ error: 'streetName and city required', history: [] }, { status: 400 });
    }

    // Build filter to find all listings at this address (any status)
    const filters = [];
    if (streetNumber) {
      filters.push("StreetNumber eq '" + odataStr(streetNumber) + "'");
    }
    filters.push("contains(StreetName, '" + odataStr(streetName) + "')");
    // Toronto sub-areas in TREB: "Toronto W03", "Toronto C01", etc.
    if (city.toLowerCase() === 'toronto') {
      filters.push("startswith(City, 'Toronto')");
    } else {
      filters.push("City eq '" + odataStr(city) + "'");
    }
    if (unit) {
      filters.push("UnitNumber eq '" + odataStr(unit) + "'");
    }

    // OnMarketDate / ListingContractDate / OriginalEntryTimestamp are the toxic
    // group — naming any of them makes AMPRE reject the whole query (see
    // lib/listings/ampre-fields.js for how they were isolated). Asking for them
    // here meant this query ALWAYS failed into the fallback below, which also
    // drops CloseDate — so the price history lost the real sold date and fell
    // back to ModificationTimestamp. CloseDate itself is proven good: it
    // returns real values on /api/sold-comps.
    const sel = [
      'ListingKey', 'ListingId', 'ListPrice', 'ClosePrice',
      'StandardStatus', 'DaysOnMarket', 'ListOfficeName',
      'CloseDate', 'ModificationTimestamp',
      'OriginalListPrice', 'PropertyType', 'PropertySubType',
    ].join(',');

    let url = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
      + '&$select=' + encodeURIComponent(sel)
      + '&$top=30'
      + '&$orderby=ModificationTimestamp desc';

    const headers = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };
    let resp = await fetch(url, { headers });

    // Fallback: remove date fields that may not be supported
    if (!resp.ok) {
      const selSafe = [
        'ListingKey', 'ListingId', 'ListPrice', 'ClosePrice',
        'StandardStatus', 'DaysOnMarket', 'ListOfficeName',
        'ModificationTimestamp', 'OriginalListPrice',
        'PropertyType', 'PropertySubType',
      ].join(',');
      url = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
        + '&$select=' + encodeURIComponent(selSafe)
        + '&$top=30'
        + '&$orderby=ModificationTimestamp desc';
      resp = await fetch(url, { headers });
    }

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('price-history AMPRE error', resp.status, errText.substring(0, 400));
      return NextResponse.json(
        { error: 'AMPRE feed unavailable', history: [] },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const items = data.value || [];

    // Map to timeline events
    const history = items.map((l) => {
      const status = l.StandardStatus || 'Unknown';
      let event = 'Listed';
      if (status === 'Closed' || status === 'Sold') event = 'Sold';
      else if (status === 'Terminated' || status === 'Cancelled') event = 'Terminated';
      else if (status === 'Expired') event = 'Expired';
      else if (status === 'Active') event = 'For Sale';
      else if (status === 'Pending') event = 'Pending';

      const date = l.CloseDate || l.OnMarketDate || l.ListingContractDate
        || l.OriginalEntryTimestamp || l.ModificationTimestamp || null;

      return {
        id: l.ListingKey,
        mlsId: l.ListingId,
        event,
        status,
        listPrice: l.ListPrice || 0,
        closePrice: l.ClosePrice || null,
        originalListPrice: l.OriginalListPrice || null,
        date,
        listDate: l.OnMarketDate || l.ListingContractDate || l.OriginalEntryTimestamp || null,
        closeDate: l.CloseDate || null,
        dom: l.DaysOnMarket || 0,
        brokerage: l.ListOfficeName || '',
        type: l.PropertyType || '',
        subType: l.PropertySubType || '',
      };
    });

    // Sort by date descending
    history.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });

    // Calculate appreciation between sold events
    const soldEvents = history.filter((h) => h.event === 'Sold' && h.closePrice > 0);
    let appreciation = null;
    if (soldEvents.length >= 2) {
      const recent = soldEvents[0];
      const older = soldEvents[soldEvents.length - 1];
      const recentDate = new Date(recent.closeDate || recent.date);
      const olderDate = new Date(older.closeDate || older.date);
      const years = Math.abs(recentDate - olderDate) / (1000 * 60 * 60 * 24 * 365.25);
      if (years > 0.25) {
        const annualRate = (Math.pow(recent.closePrice / older.closePrice, 1 / years) - 1) * 100;
        appreciation = {
          annualizedRate: +annualRate.toFixed(1),
          totalChange: +(((recent.closePrice - older.closePrice) / older.closePrice) * 100).toFixed(1),
          years: +years.toFixed(1),
          fromPrice: older.closePrice,
          toPrice: recent.closePrice,
        };
      }
    }

    return NextResponse.json(
      { history, appreciation, count: history.length },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (err) {
    console.error('price-history error:', err);
    return NextResponse.json({ error: 'Server error', history: [] }, { status: 500 });
  }
}
