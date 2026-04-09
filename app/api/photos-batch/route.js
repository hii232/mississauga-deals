import { NextResponse } from 'next/server';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

/**
 * POST /api/photos-batch
 * Fetches first photo for up to 50 listings.
 *
 * Uses concurrency-limited parallel navigation property queries (10 at a time)
 * to avoid AMPRE API rate limiting. Each query is reliable — Property('id')/Media
 * works 100% of the time unlike the bulk `in` operator.
 */
export const maxDuration = 25;

export async function POST(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  const { ids } = await request.json().catch(() => ({}));
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  const batch = ids.slice(0, 50);
  const result = {};
  const headers = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };

  // Fetch one photo using the reliable navigation property
  async function fetchOne(id) {
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
  }

  try {
    // Process in concurrent batches of 10 to avoid rate limiting
    const CONCURRENCY = 10;
    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const chunk = batch.slice(i, i + CONCURRENCY);
      await Promise.all(chunk.map(fetchOne));
    }

    return NextResponse.json({ photos: result }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    return NextResponse.json({ photos: result });
  }
}
