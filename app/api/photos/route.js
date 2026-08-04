import { NextResponse } from 'next/server';
import { odataStr, odataKey } from '@/lib/listings/odata';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

export async function GET(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const photoLimit = Math.min(parseInt(searchParams.get('limit')) || 50, 50);

  try {
    const hdrs = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };
    // ?id= used to be dropped into these URLs raw - neither OData-escaped nor
    // percent-encoded - so a quote rewrote the $filter and an `&` appended
    // whole query parameters of the caller's choosing. See lib/listings/odata.js.
    const key = odataKey(id);
    const idLit = odataStr(id);

    // Fast path: navigation property (most reliable, works every time)
    let response = await fetch(
      BASE + "/Property('" + key + "')/Media?$orderby=Order asc&$top=" + photoLimit + "&$select=MediaURL,Order",
      { headers: hdrs }
    );
    let data = response.ok ? await response.json() : null;

    // Fallback: ResourceRecordKey
    if (!data?.value?.length) {
      response = await fetch(
        BASE + '/Media?$filter=' + encodeURIComponent("ResourceRecordKey eq '" + idLit + "'")
          + '&$orderby=Order asc&$top=' + photoLimit + '&$select=MediaURL,Order',
        { headers: hdrs }
      );
      data = response.ok ? await response.json() : null;
    }

    // Fallback: ListingKey
    if (!data?.value?.length) {
      response = await fetch(
        BASE + '/Media?$filter=' + encodeURIComponent("ListingKey eq '" + idLit + "'")
          + '&$orderby=Order asc&$top=' + photoLimit + '&$select=MediaURL,Order',
        { headers: hdrs }
      );
      data = response.ok ? await response.json() : null;
    }

    if (!data?.value) return NextResponse.json({ photos: [] });

    const seen = new Set();
    const photos = [];
    for (const m of data.value) {
      const url = m.MediaURL || m.MediaUrl || '';
      if (url && !seen.has(url)) { seen.add(url); photos.push(url); }
    }

    return NextResponse.json({ photos }, {
      // A listing's photos essentially never change while it's active, so this
      // is the one place "fetch from MLS once a day" is exactly right: fresh
      // for a day, and served instantly from the CDN for a week beyond that.
      // Photos are the bulk of upstream media cost - the Media expand returns
      // ~5 CDN size-variants per photo - and unlike the feeds there is no
      // count or price here that staleness could misstate.
      headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800' },
    });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}
