import { NextResponse } from 'next/server';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

// Fetch first photo for a single listing using 3-level fallback (same as /api/photos)
async function fetchFirstPhoto(id) {
  const headers = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };

  // Try ResourceRecordKey
  try {
    const r1 = await fetch(
      BASE + "/Media?$filter=ResourceRecordKey eq '" + id + "'&$orderby=Order asc&$top=1&$select=MediaURL",
      { headers }
    );
    if (r1.ok) {
      const d1 = await r1.json();
      const u = d1?.value?.[0]?.MediaURL || d1?.value?.[0]?.MediaUrl || '';
      if (u) return u;
    }
  } catch {}

  // Try ListingKey
  try {
    const r2 = await fetch(
      BASE + "/Media?$filter=ListingKey eq '" + id + "'&$orderby=Order asc&$top=1&$select=MediaURL",
      { headers }
    );
    if (r2.ok) {
      const d2 = await r2.json();
      const u = d2?.value?.[0]?.MediaURL || d2?.value?.[0]?.MediaUrl || '';
      if (u) return u;
    }
  } catch {}

  // Try Navigation property
  try {
    const r3 = await fetch(
      BASE + "/Property('" + id + "')/Media?$orderby=Order asc&$top=1&$select=MediaURL",
      { headers }
    );
    if (r3.ok) {
      const d3 = await r3.json();
      const u = d3?.value?.[0]?.MediaURL || d3?.value?.[0]?.MediaUrl || '';
      if (u) return u;
    }
  } catch {}

  return null;
}

export async function POST(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  const { ids } = await request.json().catch(() => ({}));
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  // Accept up to 50 IDs, process in chunks of 8 to avoid timeout
  const batch = ids.slice(0, 50);
  const result = {};

  try {
    // Process in chunks of 8 concurrently — each ID gets full 3-level fallback
    for (let i = 0; i < batch.length; i += 8) {
      const chunk = batch.slice(i, i + 8);
      const promises = chunk.map(async (id) => {
        const url = await fetchFirstPhoto(id);
        if (url) result[id] = url;
      });
      await Promise.all(promises);
    }

    return NextResponse.json({ photos: result }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    return NextResponse.json({ photos: result });
  }
}
