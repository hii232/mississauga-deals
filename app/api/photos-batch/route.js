import { NextResponse } from 'next/server';
import { odataStr } from '@/lib/listings/odata';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

/**
 * GET /api/photos-batch?ids=A,B,C — fetches the first photo for up to 25
 * listings. (POST with {ids} is still accepted for compatibility with
 * already-cached client bundles, but GET is the real path now: Vercel's CDN
 * only caches GET responses, so the old POST-only design re-paid 25 upstream
 * Media queries for EVERY visitor scrolling the same page — the s-maxage
 * header on it was dead code.)
 *
 * Concurrency is chunked at 6, not 25-at-once: the browser fires up to 4 of
 * these calls in parallel, which under the old design meant 100 simultaneous
 * AMPRE queries — the exact burst pattern the upstream throttles (measured on
 * the feed fan-out, see lib/listings/fetch-feed.js). Under throttle the whole
 * batch then died at the old maxDuration of 10s — a Hobby-plan leftover — and
 * every card fell back to the grey placeholder icon.
 */
export const maxDuration = 60;

const CHUNK = 6;
const PER_QUERY_TIMEOUT_MS = 8000;

async function resolvePhotos(ids) {
  const batch = ids.slice(0, 25);
  const result = {};
  const hdrs = { Authorization: 'Bearer ' + TOK, Accept: 'application/json' };

  // Fetch one photo — try ResourceRecordKey first (fastest), then ListingKey
  async function fetchOne(id) {
    // odataStr alone left the $filter itself un-encoded, so an `&` in an id could
    // still append query parameters — encode the finished clause too.
    const safeId = odataStr(id);

    // Method 1: ResourceRecordKey filter (most reliable for AMPRE)
    try {
      const r = await fetch(
        BASE + '/Media?$filter=' + encodeURIComponent("ResourceRecordKey eq '" + safeId + "'")
          + '&$orderby=Order asc&$top=1&$select=MediaURL',
        { headers: hdrs, signal: AbortSignal.timeout(PER_QUERY_TIMEOUT_MS) }
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
        BASE + '/Media?$filter=' + encodeURIComponent("ListingKey eq '" + safeId + "'")
          + '&$orderby=Order asc&$top=1&$select=MediaURL',
        { headers: hdrs, signal: AbortSignal.timeout(PER_QUERY_TIMEOUT_MS) }
      );
      if (r.ok) {
        const d = await r.json();
        const url = d?.value?.[0]?.MediaURL || d?.value?.[0]?.MediaUrl || '';
        if (url) { result[id] = url; return; }
      }
    } catch {}
  }

  for (let i = 0; i < batch.length; i += CHUNK) {
    await Promise.all(batch.slice(i, i + CHUNK).map(fetchOne));
  }
  return result;
}

export async function GET(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids query param required' }, { status: 400 });
  }

  const photos = await resolvePhotos(ids);
  return NextResponse.json({ photos }, {
    // Cached by the CDN because this is a GET: the first visitor pays the
    // upstream queries, everyone else on the same page slice reads the cache.
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
  });
}

export async function POST(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  const { ids } = await request.json().catch(() => ({}));
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  const photos = await resolvePhotos(ids);
  return NextResponse.json({ photos });
}
