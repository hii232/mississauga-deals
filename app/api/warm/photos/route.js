import { NextResponse } from 'next/server';

// Pre-warms the image-optimizer cache for the photos visitors see first.
//
// A brand-new listing's photo is slow ONCE per optimized variant: the
// optimizer must fetch the original from TRREB's image origin
// (trreb-image.ampre.ca), which measured ~30s while throttled and ~1-2s
// normally. The listings feed sorts by ModificationTimestamp, so the TOP of
// the feed - exactly what the homepage and /listings show first - is always
// the newest listings with the coldest photos. This cron pays that first-load
// cost on a schedule so visitors never do.
//
// Widths match what the cards actually request via their `sizes` attr
// (100vw at 375px DPR2 → 750; ~33vw on desktop → 640), q=75 is next/image's
// default. Warming other variants would burn optimizer quota for no benefit.
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL ? 'https://www.mississaugainvestor.ca' : 'http://localhost:3000');

const TOP_LISTINGS = 24;      // homepage deals + first /listings screenfuls
const WIDTHS = [640, 750];
const BATCH = 6;              // same burst discipline as every other fan-out
const PER_IMAGE_TIMEOUT_MS = 35000; // a cold TRREB origin fetch can take ~30s

function authorized(request) {
  if (!process.env.CRON_SECRET) return true; // dev
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  let warmed = 0;
  let failed = 0;

  try {
    const res = await fetch(`${SITE_URL}/api/listings?limit=100&page=1`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `feed ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    const photos = (data.listings || [])
      .slice(0, TOP_LISTINGS)
      .map((l) => l.photos?.[0])
      .filter(Boolean);

    const targets = [];
    for (const p of photos) {
      for (const w of WIDTHS) {
        targets.push(`${SITE_URL}/_next/image?url=${encodeURIComponent(p)}&w=${w}&q=75`);
      }
    }

    for (let i = 0; i < targets.length; i += BATCH) {
      // Stop starting new batches when the worst-case batch would blow the
      // function budget - a partial warm beats a killed function.
      if (Date.now() - started > (maxDuration - 45) * 1000) break;
      const batch = await Promise.all(
        targets.slice(i, i + BATCH).map((u) =>
          fetch(u, { signal: AbortSignal.timeout(PER_IMAGE_TIMEOUT_MS) })
            // Read the body so the optimization is fully completed and cached
            // before we count it, then discard it.
            .then(async (r) => { if (r.ok) await r.arrayBuffer(); return r.ok; })
            .catch(() => false)
        )
      );
      for (const ok of batch) (ok ? warmed++ : failed++);
    }

    return NextResponse.json({
      warmed,
      failed,
      photos: photos.length,
      ms: Date.now() - started,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'warm failed', warmed, failed },
      { status: 500 }
    );
  }
}
