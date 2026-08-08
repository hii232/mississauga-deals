import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { buildGtaScreenerAggregates, READ_ONLY_HEADER } from '@/lib/listings/gta-screener';

// Its OWN endpoint, deliberately - this must never ride a page render.
// /api/listings-gta already times out during /gta/[city] ISR regeneration
// (runtime logs: `fetch-feed: /api/listings-gta page 1 failed (TimeoutError)`),
// and a ~245-page walk hung off a page would turn that from an SEO gap into a
// broken page. The pages read this endpoint's CACHED body with a short abort
// budget and fall back to skeletons, which is exactly today's behaviour.
export const dynamic = 'force-dynamic';

// 300s, not 60. The walk could never finish inside 60s - see the budget note
// below - and a walk that cannot finish publishes nothing, forever.
export const maxDuration = 300;

/**
 * 240s of the 300s budget; the remainder covers the underwriting pass and
 * serialization.
 *
 * WHY THIS GREW FROM 45s. MIN_FILL is 0.95 and the GTA feed is ~245 pages, so
 * the aggregate only publishes if the walk covers ~233 of them. fetch-feed
 * walks in batches of 6 at roughly 2.8s a batch - about 115s for the full feed.
 * A 45s budget bought ~95 pages, a ~0.39 fill, and therefore `complete: false`
 * on EVERY run since the endpoint shipped: the walk ran, cost ~95 upstream
 * requests, and threw the result away because a partial feed's maximum is not
 * the market's. 240s clears the ~115s the walk actually needs with room for a
 * slow upstream.
 */
const WALK_BUDGET_MS = 240000;

// ── Where the aggregate actually lives ──
//
// THE BUG THIS FIXES (measured live 2026-08-08, three consecutive GETs):
// every response came back `x-vercel-cache: MISS` with a fresh `generatedAt`,
// carrying the wire header `public, max-age=0, must-revalidate` - a string
// this file never writes. `dynamic = 'force-dynamic'` sets the route's
// revalidate to 0, which takes it out of the prerender manifest entirely, so
// Next streams the body straight to the socket and the s-maxage set below is
// discarded. (Same class as the /book-call trap already documented in
// next.config.js: on Vercel, Cache-Control on a dynamic route is not yours.)
//
// That broke the whole design, because the read-only branch below returns a
// HARDCODED `complete: false` on the premise that "a warm CDN entry is served
// before this function is reached". There was no warm entry, ever. So the
// cron computed a perfect 22k-listing aggregate roughly eight times a day and
// every single one was garbage-collected with the response, while all 28
// /gta/[city] pages read the placeholder and rendered skeletons - for the
// entire life of the feature.
//
// unstable_cache writes to the Next DATA cache, which is a different system
// from the route/CDN cache and is NOT disabled by force-dynamic. It persists
// across invocations, instances and deployments - which is exactly the
// "somewhere a later request can read it" that was missing. The cron
// populates it; page renders read it in milliseconds.
//
// revalidate matches the cron cadence (13 */3 * * *): the cron refreshes the
// entry before it expires, so in steady state a page render never triggers a
// walk. An incomplete result caches too - deliberately accepted, because it
// self-heals on the next cron rather than needing a deploy.
const AGGREGATE_TTL_S = 10800;
const getCachedAggregate = unstable_cache(
  async (origin) => buildGtaScreenerAggregates(origin, { budgetMs: WALK_BUDGET_MS }),
  ['gta-screener-aggregate-v1'],
  { revalidate: AGGREGATE_TTL_S, tags: ['gta-screener'] }
);

// A page render must never wait on a cold walk: /gta and /gta/[city] give up
// on this fetch after 4s. Resolve well inside that, and let a cold-cache walk
// keep running in the background so it warms the entry for the next visitor.
const READ_ONLY_WAIT_MS = 3000;

export async function GET(request) {
  // SITE_URL / VERCEL, never headers(). This route is cron-invoked, and on a
  // cron the request host is the protected *.vercel.app deployment - the same
  // trap that once made the weekly newsletter ship with zero deals because a
  // self-fetch hit an HTML auth wall.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL ? 'https://www.mississaugainvestor.ca' : 'http://localhost:3000');

  // ── The walk runs for the cron, and for nothing else ──
  //
  // Measured 2026-08-04, six hours of production runtime logs: /api/listings-gta
  // served 11,200 requests - 79% of every serverless invocation the site made,
  // more than the next twenty routes combined. The cron fires twice in that
  // window, yet /api/gta-screener was invoked 118 times, and 11,200 / 118 = 95:
  // exactly the pages a 45s budget buys. Every one of those 116 non-cron runs
  // came from a /gta or /gta/[city] render calling fetchGtaScreenerSummary.
  //
  // That caller aborts after 4s. The abort ends the CALLER's wait - it does not
  // stop the function it started, which then spent 45s and ~95 upstream
  // requests building an aggregate nobody was still listening for, and which
  // `complete: false` discarded anyway. Because the fetch aborted, Next's Data
  // Cache stored nothing, so the next render started another one. A read the
  // page gives up on in 4s was quietly commissioning a 45-second feed walk, 116
  // times per six hours, to produce nothing.
  //
  // So a read-only caller now gets an immediate honest "not computed yet" and
  // the pages fall back to skeletons - which is what they showed anyway, since
  // no run has ever published. Only the cron pays for the walk.
  if (request.headers.get(READ_ONLY_HEADER)) {
    // Read the Data Cache entry. Warm (the steady state) resolves in
    // milliseconds and the page gets real whole-market figures at first
    // paint. Cold loses the race, we answer with the placeholder so the
    // render is never delayed, and the walk it started keeps going and
    // populates the entry for the next visitor - the self-healing the old
    // hardcoded branch could never do.
    const cached = await Promise.race([
      getCachedAggregate(origin).catch(() => null),
      new Promise((resolve) => setTimeout(() => resolve(null), READ_ONLY_WAIT_MS)),
    ]);
    if (cached?.complete) {
      return NextResponse.json(
        { scope: 'GTA', generatedAt: new Date().toISOString(), ...cached },
        { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600' } }
      );
    }
    return NextResponse.json(
      {
        scope: 'GTA',
        complete: false,
        gta: null,
        cities: {},
        note: 'No aggregate cached yet - the walk is warming. A page render never waits on one.',
      },
      {
        // 60s. Short deliberately: this placeholder must never squat on the
        // cache key for long. It is only ever produced on a cache MISS (a warm
        // entry is served by the CDN and never reaches this function), so it
        // cannot overwrite a good cron result - but a short TTL means the real
        // aggregate takes over the moment the cron publishes one.
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
      }
    );
  }

  let result;
  try {
    // Through the SAME cached function the read-only path reads, so the cron
    // populates the entry the pages consume. (Previously this called the
    // builder directly, so the cron's result went nowhere a page could see.)
    result = await getCachedAggregate(origin);
  } catch (err) {
    console.error('gta-screener: aggregate failed -', err);
    result = { complete: false, gta: null, cities: {}, note: 'Aggregate failed: ' + String(err?.message || err).slice(0, 200) };
  }

  // The one line that says whether this cost bought anything. `complete: false`
  // here means ~245 upstream requests were spent and discarded, which is worth
  // being able to grep for rather than infer.
  console.log(
    `gta-screener: complete=${result.complete} rows=${result.rows ?? 0}/${result.feedTotal ?? 0} ` +
    `pages=${result.pagesWalked ?? 0}/${result.pagesTotal ?? 0} fill=${result.fillRatio ?? 0}`
  );

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
