import { NextResponse } from 'next/server';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

/**
 * POST /api/photos-batch
 * Fetches first photo for up to 50 listings using parallel navigation property queries.
 *
 * The bulk OData `in` operator doesn't reliably find Media by ResourceRecordKey/ListingKey,
 * but Property('id')/Media (navigation property) works 100% of the time.
 * We fire all requests in parallel so 50 listings complete in ~1-2 seconds.
 */
export async function POST(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  const { ids } = await request.json().catch(() => ({}));
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  const batch = ids.slice(0, 50);
  const result = {};
  const headers = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };

  try {
    // Strategy 1: Try bulk query first (fast when it works)
    const inClause = batch.map(id => "'" + id.replace(/'/g, "''") + "'").join(',');
    const bulkUrl = BASE + '/Media?$filter=ResourceRecordKey in (' + inClause + ')'
      + '&$select=ResourceRecordKey,MediaURL,Order'
      + '&$orderby=ResourceRecordKey,Order asc'
      + '&$top=' + (batch.length * 2);

    try {
      const r1 = await fetch(bulkUrl, { headers });
      if (r1.ok) {
        const d1 = await r1.json();
        if (d1?.value) {
          for (const m of d1.value) {
            const key = m.ResourceRecordKey;
            const url = m.MediaURL || m.MediaUrl || '';
            if (key && url && !result[key]) result[key] = url;
          }
        }
      }
    } catch {}

    // Strategy 2: For ALL missing IDs, use navigation property in parallel
    // This is the reliable method — works for every listing
    const missing = batch.filter(id => !result[id]);
    if (missing.length > 0) {
      const promises = missing.map(async (id) => {
        try {
          const r = await fetch(
            BASE + "/Property('" + id.replace(/'/g, "''") + "')/Media?$orderby=Order asc&$top=1&$select=MediaURL",
            { headers }
          );
          if (r.ok) {
            const d = await r.json();
            const url = d?.value?.[0]?.MediaURL || d?.value?.[0]?.MediaUrl || '';
            if (url) result[id] = url;
          }
        } catch {}
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
