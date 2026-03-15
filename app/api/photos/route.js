import { NextResponse } from 'next/server';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_TOKEN;

export async function GET(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    // Try ResourceRecordKey first
    let response = await fetch(
      BASE + "/Media?$filter=ResourceRecordKey eq '" + id + "'&$orderby=Order asc&$top=50&$select=MediaURL,Order",
      { headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' } }
    );
    let data = response.ok ? await response.json() : null;

    // Fallback: ListingKey
    if (!data?.value?.length) {
      response = await fetch(
        BASE + "/Media?$filter=ListingKey eq '" + id + "'&$orderby=Order asc&$top=50&$select=MediaURL,Order",
        { headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' } }
      );
      data = response.ok ? await response.json() : null;
    }

    // Fallback: Navigation property
    if (!data?.value?.length) {
      response = await fetch(
        BASE + "/Property('" + id + "')/Media?$orderby=Order asc&$top=50&$select=MediaURL,Order",
        { headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' } }
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
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}
