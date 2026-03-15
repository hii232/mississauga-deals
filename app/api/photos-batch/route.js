import { NextResponse } from 'next/server';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_TOKEN;

export async function POST(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  const { ids } = await request.json().catch(() => ({}));
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  const batch = ids.slice(0, 50);
  const result = {};

  try {
    // Pass 1: Try ResourceRecordKey (bulk query)
    const filter1 = batch.map((id) => "ResourceRecordKey eq '" + id + "'").join(' or ');
    const r1 = await fetch(
      BASE + '/Media?$filter=' + encodeURIComponent(filter1) +
      '&$orderby=ResourceRecordKey,Order asc&$top=' + (batch.length * 3) +
      '&$select=MediaURL,ResourceRecordKey,Order',
      { headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' } }
    );
    if (r1.ok) {
      const d1 = await r1.json();
      for (const m of (d1.value || [])) {
        const key = m.ResourceRecordKey;
        const u = m.MediaURL || m.MediaUrl || '';
        if (key && u && !result[key]) result[key] = u;
      }
    }

    // Pass 2: Missing — try ListingKey (bulk query)
    const missing1 = batch.filter((id) => !result[id]);
    if (missing1.length > 0) {
      const filter2 = missing1.map((id) => "ListingKey eq '" + id + "'").join(' or ');
      const r2 = await fetch(
        BASE + '/Media?$filter=' + encodeURIComponent(filter2) +
        '&$orderby=ListingKey,Order asc&$top=' + (missing1.length * 3) +
        '&$select=MediaURL,ListingKey,Order',
        { headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' } }
      );
      if (r2.ok) {
        const d2 = await r2.json();
        for (const m of (d2.value || [])) {
          const key = m.ListingKey;
          const u = m.MediaURL || m.MediaUrl || '';
          if (key && u && !result[key]) result[key] = u;
        }
      }
    }

    // Pass 3: Still missing — try Navigation property (individual, parallel)
    const missing2 = batch.filter((id) => !result[id]);
    if (missing2.length > 0) {
      const navPromises = missing2.map((id) =>
        fetch(
          BASE + "/Property('" + id + "')/Media?$orderby=Order asc&$top=1&$select=MediaURL,Order",
          { headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' } }
        )
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.value?.length) {
              const u = d.value[0].MediaURL || d.value[0].MediaUrl || '';
              if (u) result[id] = u;
            }
          })
          .catch(() => {})
      );
      await Promise.all(navPromises);
    }

    return NextResponse.json({ photos: result }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    return NextResponse.json({ photos: result });
  }
}
