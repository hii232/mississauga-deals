import { NextResponse } from 'next/server';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

/**
 * POST /api/photos-batch
 * Fetches first photo for up to 50 listings in ONE bulk OData query.
 *
 * Before: 50 IDs × 3 fallback calls = 150 API calls (30+ seconds)
 * After:  1-2 bulk queries (1-2 seconds)
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
    // Strategy 1: BULK query — get first photo for all IDs in ONE request
    // Uses ResourceRecordKey in ('id1','id2',...) with $orderby to get first photo per listing
    const inClause = batch.map(id => "'" + id.replace(/'/g, "''") + "'").join(',');

    const bulkUrl = BASE + '/Media?$filter=ResourceRecordKey in (' + inClause + ')'
      + '&$select=ResourceRecordKey,MediaURL,Order'
      + '&$orderby=ResourceRecordKey,Order asc'
      + '&$top=' + (batch.length * 2); // Get up to 2 per listing to ensure we get at least 1

    const r1 = await fetch(bulkUrl, { headers });

    if (r1.ok) {
      const d1 = await r1.json();
      if (d1?.value) {
        // Take first photo per ResourceRecordKey
        for (const m of d1.value) {
          const key = m.ResourceRecordKey;
          const url = m.MediaURL || m.MediaUrl || '';
          if (key && url && !result[key]) {
            result[key] = url;
          }
        }
      }
    }

    // Strategy 2: For any IDs still missing, try ListingKey bulk query
    const missing = batch.filter(id => !result[id]);
    if (missing.length > 0) {
      const inClause2 = missing.map(id => "'" + id.replace(/'/g, "''") + "'").join(',');
      const bulkUrl2 = BASE + '/Media?$filter=ListingKey in (' + inClause2 + ')'
        + '&$select=ListingKey,MediaURL,Order'
        + '&$orderby=ListingKey,Order asc'
        + '&$top=' + (missing.length * 2);

      const r2 = await fetch(bulkUrl2, { headers });
      if (r2.ok) {
        const d2 = await r2.json();
        if (d2?.value) {
          for (const m of d2.value) {
            const key = m.ListingKey;
            const url = m.MediaURL || m.MediaUrl || '';
            if (key && url && !result[key]) {
              result[key] = url;
            }
          }
        }
      }
    }

    // Strategy 3: Last resort — individually fetch remaining (max 5 at a time)
    const stillMissing = batch.filter(id => !result[id]);
    if (stillMissing.length > 0 && stillMissing.length <= 15) {
      const promises = stillMissing.map(async (id) => {
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
