import { NextResponse } from 'next/server';
import { buildGtaScreenerAggregates } from '@/lib/listings/gta-screener';

// Its OWN endpoint, deliberately — this must never ride a page render.
// /api/listings-gta already times out during /gta/[city] ISR regeneration
// (runtime logs: `fetch-feed: /api/listings-gta page 1 failed (TimeoutError)`),
// and a ~245-page walk hung off a page would turn that from an SEO gap into a
// broken page. The pages read this endpoint's CACHED body with a short abort
// budget and fall back to skeletons, which is exactly today's behaviour.
export const dynamic = 'force-dynamic';
// Matches /api/listings-gta. The walk is budgeted below this so the function
// returns an honest short-fill answer rather than being killed mid-flight.
export const maxDuration = 60;

export async function GET() {
  // SITE_URL / VERCEL, never headers(). This route is cron-invoked, and on a
  // cron the request host is the protected *.vercel.app deployment — the same
  // trap that once made the weekly newsletter ship with zero deals because a
  // self-fetch hit an HTML auth wall.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL ? 'https://www.mississaugainvestor.ca' : 'http://localhost:3000');

  let result;
  try {
    // 45s of the 60s budget. The remainder covers the underwriting pass and
    // serialization; a walk that runs out simply reports an incomplete fill
    // and publishes nothing, and its cached page prefix means the next cron
    // run gets further. See lib/listings/gta-screener.js.
    result = await buildGtaScreenerAggregates(origin, { budgetMs: 45000 });
  } catch (err) {
    console.error('gta-screener: aggregate failed —', err);
    result = { complete: false, gta: null, cities: {}, note: 'Aggregate failed: ' + String(err?.message || err).slice(0, 200) };
  }

  return NextResponse.json(
    { scope: 'GTA', generatedAt: new Date().toISOString(), ...result },
    {
      headers: {
        // 24h once the figures are real (they describe active inventory, which
        // /api/market-stats also caches for a day), 15 minutes when the walk
        // came up short so an incomplete run self-heals instead of freezing
        // skeletons in place for a day.
        'Cache-Control': result.complete
          ? 's-maxage=86400, stale-while-revalidate=3600'
          : 's-maxage=900, stale-while-revalidate=300',
      },
    }
  );
}
