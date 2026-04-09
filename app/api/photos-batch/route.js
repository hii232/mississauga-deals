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

  const debug = [];

  // Fetch one photo using the reliable navigation property
  async function fetchOne(id) {
    const url = BASE + "/Property('" + id.replace(/'/g, "''") + "')/Media?$orderby=Order asc&$top=1&$select=MediaURL,Order";
    try {
      const r = await fetch(url, { headers });
      const status = r.status;
      if (r.ok) {
        const d = await r.json();
        const photoUrl = d?.value?.[0]?.MediaURL || d?.value?.[0]?.MediaUrl || '';
        if (photoUrl) {
          result[id] = photoUrl;
          debug.push({ id, status, found: true });
        } else {
          debug.push({ id, status, found: false, count: d?.value?.length || 0 });
        }
      } else {
        const errText = await r.text().catch(() => '');
        debug.push({ id, status, error: errText.substring(0, 200) });
      }
    } catch (e) {
      debug.push({ id, error: e.message || 'fetch failed' });
    }
  }

  try {
    // Process in concurrent batches of 10 to avoid rate limiting
    const CONCURRENCY = 10;
    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const chunk = batch.slice(i, i + CONCURRENCY);
      await Promise.all(chunk.map(fetchOne));
    }

    return NextResponse.json({ photos: result, _debug: debug, _token: TOK ? 'set(' + TOK.substring(0, 8) + '...)' : 'MISSING' }, {
      headers: { 'Cache-Control': 'no-cache, no-store' },
    });
  } catch (e) {
    return NextResponse.json({ photos: result, _debug: debug, _error: e.message });
  }
}
