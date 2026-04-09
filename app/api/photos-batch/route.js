import { NextResponse } from 'next/server';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

/**
 * POST /api/photos-batch
 * Fetches first photo for up to 25 listings.
 *
 * Optimized order — ResourceRecordKey filter works most reliably with AMPRE.
 * Navigation property (Property/Media) returns 404, so we skip it and go
 * straight to the filters that actually work.
 */
export const maxDuration = 10;

export async function POST(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  const { ids } = await request.json().catch(() => ({}));
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  // Cap at 25 to stay within 10s Vercel hobby timeout
  const batch = ids.slice(0, 25);
  const result = {};
  const hdrs = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };

  // Fetch one photo — try ResourceRecordKey first (fastest), then ListingKey
  async function fetchOne(id) {
    const safeId = id.replace(/'/g, "''");

    // Method 1: ResourceRecordKey filter (most reliable for AMPRE)
    try {
      const r = await fetch(
        BASE + "/Media?$filter=ResourceRecordKey eq '" + safeId + "'&$orderby=Order asc&$top=1&$select=MediaURL",
        { headers: hdrs }
      );
      if (r.ok) {
        const d = await r.json();
        const url = d?.value?.[0]?.MediaURL || d?.value?.[0]?.MediaUrl || '';
        if (url) { result[id] = url; return; }
      }
    } catch {}

    // Method 2: ListingKey filter (fallback)
    try {
      const r = await fetch(
        BASE + "/Media?$filter=ListingKey eq '" + safeId + "'&$orderby=Order asc&$top=1&$select=MediaURL",
        { headers: hdrs }
      );
      if (r.ok) {
        const d = await r.json();
        const url = d?.value?.[0]?.MediaURL || d?.value?.[0]?.MediaUrl || '';
        if (url) { result[id] = url; return; }
      }
    } catch {}
  }

  try {
    // Process all at once — 25 concurrent is fine for filter queries
    await Promise.all(batch.map(fetchOne));

    return NextResponse.json({ photos: result }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    return NextResponse.json({ photos: result });
  }
}
