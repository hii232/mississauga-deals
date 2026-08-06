import { NextResponse } from 'next/server';
import { fetchFeedPages } from '@/lib/listings/fetch-feed';
import { headers } from 'next/headers';
import { DEFAULT_ASSUMPTIONS } from '@/lib/cash-flow-engine';
import { HOOD_DATA, HOOD_OUTLOOK_AS_OF } from '@/lib/constants';
import { processListings } from '@/lib/listings/process-listings';
import { computeScreenerMetrics } from '@/lib/listings/screener-metrics';

export const dynamic = 'force-dynamic';

// Which neighbourhoods to feature, and WHY - the editorial part. The `hood` key
// is the HOOD_DATA lookup; `name` is the display label, which differs for
// Square One / City Centre. No prices here on purpose: see hotNeighbourhoods.
const HOT_NEIGHBOURHOODS = [
  { name: 'Cooksville', hood: 'Cooksville', reason: 'LRT corridor + most affordable' },
  { name: 'Square One / City Centre', hood: 'City Centre', reason: 'Urban density + transit hub' },
  { name: 'Port Credit', hood: 'Port Credit', reason: 'Waterfront premium + GO Transit' },
  { name: 'Clarkson', hood: 'Clarkson', reason: 'Highest cap rates + GO station' },
  { name: 'Churchill Meadows', hood: 'Churchill Meadows', reason: 'New builds + family demand' },
];

// ── TRREB data freshness ─────────────────────────────────
// Moved to lib/market/trreb-freshness.js so it can be unit-tested: this file
// imports next/server and cannot be loaded by a plain `node` test, and a
// date-boundary heuristic is precisely what needs tests. Re-exported here so
// the previous import path keeps working. See that file for why staleness
// counts PUBLISHED reports rather than calendar months.
// Imported AND re-exported: `export ... from` alone would not bind the name
// in this module, and the response builder below calls it.
import { tRREBFreshness } from '@/lib/market/trreb-freshness';
export { tRREBFreshness };

// ── TRREB Market Watch figures ───────────────────────────
// NOT typed in here any more. Every sold/volume/YoY number, the month string,
// the as-of date and the disclaimer sentence are derived from data/trreb.js,
// which scripts/trreb-extract.py writes straight off the Market Watch PDF.
//
// This file used to carry ~45 hand-keyed figures plus three strings that had to
// move together, and it was only ONE of the places a refresh had to touch -
// lib/blog/seed-posts.js quoted its own stale copies in prose, so the site
// contradicted itself in public. One command refreshes all of it now:
//
//     ./.venv/bin/python scripts/trreb-extract.py ~/Downloads/mw2608.pdf --write
//
// scripts/compliance-check.mjs fails the build if a TRREB figure reappears as a
// literal anywhere outside data/trreb.js.
import {
  tRREBMonth,
  tRREBAsOf,
  tRREBDisclaimer,
  tRREBSold,
  salesByType,
  regional,
  economic,
  rates as tRREBRates,
  rental,
  mississaugaMonthly,
} from '@/lib/market/trreb';

// ── Fetch live stats from internal APIs ──────────────────
async function fetchLiveListingStats(baseUrl) {
  try {
    // THE SAME fetch path the /listings page uses (lib/listings/fetch-feed.js).
    // This function kept its own loop with limit=200 cache keys after the
    // pages moved off them - and Next's Data Cache persists across deploys,
    // so every stat here (activeCount, avgDOM, the radar) was computed from
    // PRE-FIX cached rows: avgDOM read 75 and every neighbourhood read
    // "Mississauga" while the live feed had long been fixed. One shared fetch
    // path means the stats and the pages can never read different data again.
    // nomedia=1: a pure aggregate - this file computes counts, averages, the
    // radar and the screener summary, and reads no photo from any row. The
    // Media $expand is the dominant cost of a feed request, so asking for it
    // on a 25-page walk was buying ~450k media rows to throw all of them away.
    const { listings: raw, first } = await fetchFeedPages(baseUrl, '/api/listings', {
      pages: 999,
      revalidate: 3600,
      timeoutMs: 25000,
      qs: '&nomedia=1',
    });

    if (raw.length === 0) return null;

    // How much of the feed actually landed. On a cold fill some page fetches
    // time out and are skipped, so the first computation after a deploy can
    // run on ~85% of the inventory - verified live: activeCount froze at
    // 2,159 of ~2,555 under the 24h cache. The caller uses this to shorten
    // the cache on an incomplete fill so it self-heals in minutes instead of
    // publishing an undercount for a day.
    const feedTotal = Number(first?.browsableTotal ?? first?.total) || raw.length;
    const fillRatio = feedTotal > 0 ? raw.length / feedTotal : 1;

    const count = raw.length;

    // FIELD NAMES: /api/listings returns MAPPED listings (price, dom, type,
    // subType) - not the raw MLS names (ListPrice, DaysOnMarket, PropertyType).
    // This code read the raw names, so every filter below matched NOTHING and
    // each "live" stat silently fell through to its fallback: avg DOM served a
    // hardcoded 28, avg price served the TRREB monthly figure, and every
    // per-type bucket came back with count 0. The site labelled all of it "Live
    // MLS data". Raw names are kept as a secondary read so this keeps working
    // if a caller ever passes unmapped feed rows.
    const priceOf = (l) => Number(l.price ?? l.ListPrice) || 0;
    const domOf = (l) => {
      const d = l.dom ?? l.daysOnMarket ?? l.DaysOnMarket;
      return Number.isFinite(Number(d)) ? Number(d) : null;
    };
    const typeOf = (l) => `${l.type ?? l.PropertyType ?? ''} ${l.subType ?? l.PropertySubType ?? ''}`;

    // Compute avg DOM from active listings.
    // dom 0 means UNKNOWN, not "listed today" - the feed withholds
    // days-on-market on active listings (lib/listings/market-timing.js), so
    // every row currently arrives as 0. This used to accept 0 as a real value
    // (the filter only excluded null), which averaged a page of unknowns into a
    // confident-looking "Avg DOM" on the homepage stats bar and /market-pulse.
    // The old `: 28` fallback was worse still - a hardcoded number published
    // under a "Live MLS Data" label. Now: only genuine values count, and when
    // there are none the stat is null so every consumer omits the tile rather
    // than inventing one.
    const withDom = raw.filter((l) => { const d = domOf(l); return d != null && d > 0; });
    const avgDOM = withDom.length > 0
      ? Math.round(withDom.reduce((s, l) => s + domOf(l), 0) / withDom.length)
      : null;
    // Median resists the long tail (a handful of 300+ day listings drags the
    // mean) - for "how fast does inventory move" it is the honest headline.
    const sortedDoms = withDom.map(domOf).sort((a, b) => a - b);
    const medianDOM = sortedDoms.length > 0
      ? (sortedDoms.length % 2
          ? sortedDoms[(sortedDoms.length - 1) / 2]
          : Math.round((sortedDoms[sortedDoms.length / 2 - 1] + sortedDoms[sortedDoms.length / 2]) / 2))
      : null;

    // Average ACTIVE LIST price. It used to fall back to the latest TRREB
    // monthly average when the feed returned nothing - but that figure is an
    // average SOLD price, a different measurement. The fallback therefore
    // published a sold average under a list-price label, and since the sold
    // tile reads from the same TRREB number the homepage showed "Avg Price"
    // and "Avg Sold" as the identical $1.01M while also claiming a 97%
    // sale-to-list ratio: three figures that cannot all be true together.
    // Now null when there is no live inventory, and every consumer already
    // omits a null stat rather than inventing one.
    const withPrice = raw.filter((l) => priceOf(l) > 0);
    const avgPrice = withPrice.length > 0
      ? Math.round(withPrice.reduce((s, l) => s + priceOf(l), 0) / withPrice.length)
      : null;

    // Classify each listing into exactly ONE bucket, most specific first.
    // Order matters: "Semi-Detached" contains the substring "Detached", and
    // "Condo Townhouse" contains "Townhouse" - the previous independent
    // substring filters double-counted semis as detached and condo-towns as
    // freehold towns, inflating both averages.
    function classify(l) {
      const t = typeOf(l).toLowerCase();
      if (t.includes('semi')) return 'semiDetached';
      if (t.includes('condo') || t.includes('apartment')) return 'condo';
      if (t.includes('town') || t.includes('row')) return 'townhouse';
      if (t.includes('detached') || t.includes('single family')) return 'detached';
      return null;
    }

    const buckets = { detached: [], semiDetached: [], townhouse: [], condo: [] };
    for (const l of withPrice) {
      const key = classify(l);
      if (key) buckets[key].push(l);
    }

    const avgPrices = {};
    for (const [key, matches] of Object.entries(buckets)) {
      if (matches.length > 0) {
        avgPrices[key] = {
          avg: Math.round(matches.reduce((s, l) => s + priceOf(l), 0) / matches.length),
          count: matches.length,
          label: key === 'semiDetached' ? 'Semi-Detached' : key.charAt(0).toUpperCase() + key.slice(1),
        };
      }
    }

    // ── Motivated-seller radar (Hamza, 2026-07-27) ──
    // dom >= 60: sitting for two months. Computed across the WHOLE active
    // feed (this function pages all of it), never a single page. dom 0 means
    // UNKNOWN and is excluded - a listing with no known age is never called
    // stale. priceDrop is the mapped percentage discount from
    // OriginalListPrice, so > 0 means the seller has already cut at least 1%.
    const STALE_DOM = 60;
    const staleRows = raw.filter((l) => { const d = domOf(l); return d != null && d >= STALE_DOM; });
    const staleCount = staleRows.length;
    const stalePct = count > 0 ? Math.round((staleCount / count) * 1000) / 10 : 0;
    const cutOf = (l) => Number(l.priceDrop ?? l.priceReduction) || 0;
    const staleWithPriceCut = staleRows.filter((l) => cutOf(l) > 0).length;
    // neighbourhood is the board's own community (CityRegion) - non-canonical
    // names appear under their real label rather than being remapped.
    const staleByNeighbourhood = {};
    for (const l of staleRows) {
      const hood = String(l.neighbourhood || l.city || '').trim();
      if (!hood) continue;
      staleByNeighbourhood[hood] = (staleByNeighbourhood[hood] || 0) + 1;
    }
    // Descending by count so the biggest pockets read first.
    const staleByNeighbourhoodSorted = Object.fromEntries(
      Object.entries(staleByNeighbourhood).sort((a, b) => b[1] - a[1])
    );

    // ── Whole-market Deal Screener aggregate ──
    // This function ALREADY holds every active row; underwriting them costs one
    // pass and no extra upstream request, and the result is cached for a day.
    //
    // Why it matters: /listings streams the feed into the browser ~100 rows at
    // a time, and its dashboard used to compute "CF+ deals", "best cap", "best
    // cash flow" and "price drops" over whatever had arrived - publishing "0
    // cash flowing deals · best cash flow -$278/mo" at 30 of 2,493 rows, which
    // settled to "1 · +$41/mo" seconds later. Handing the page a correct
    // whole-market answer up front removes the lie AND the wait: the numbers
    // are right in the server-rendered HTML instead of ~25 round trips later.
    //
    // Withheld below a 95% fill for the same reason the tiles are: a max or a
    // count over 85% of the market is not the market's max or count. The
    // consumer falls back to skeletons, which is honest.
    let screener = null;
    if (fillRatio >= 0.95) {
      try {
        const deals = processListings(raw);
        if (deals.length > 0) screener = computeScreenerMetrics(deals);
      } catch (err) {
        console.error('market-stats: screener aggregate failed -', err);
      }
    }

    return {
      activeCount: count, feedTotal, fillRatio, avgDOM, medianDOM, avgPrice, avgPrices,
      staleCount, stalePct, staleWithPriceCut,
      staleByNeighbourhood: staleByNeighbourhoodSorted,
      screener,
    };
  } catch {
    return null;
  }
}

async function fetchSoldStats(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/api/sold-comps?limit=50`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stats || null;
  } catch {
    return null;
  }
}

// ── Main handler ─────────────────────────────────────────
export async function GET() {
  // Determine base URL
  const h = await headers();
  const host = h.get('host') || 'www.mississaugainvestor.ca';
  const proto = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${proto}://${host}`;

  // Fetch live data in parallel
  const [liveListings, soldStats] = await Promise.all([
    fetchLiveListingStats(baseUrl),
    fetchSoldStats(baseUrl),
  ]);

  // Compute sale-to-list ratio from sold comps
  // soldStats.avgNegotiationGap is a % like -2.8 meaning sold 2.8% below list
  // So sale-to-list = (100 + avgNegotiationGap) / 100 → e.g. (100 + (-2.8)) / 100 = 0.972
  const salesToListRatio = soldStats?.avgNegotiationGap != null
    ? +((100 + soldStats.avgNegotiationGap) / 100).toFixed(3)
    : 0.972;

  // tRREBSold, salesByType, regional, economic, rates and the monthly series
  // all come from lib/market/trreb.js - see the import block at the top of this
  // file for why nothing is typed in here. The per-type page identification
  // (which page IS the condo page) is done by fingerprint in
  // scripts/trreb-extract.py, never by page order.
  const avgPrices = {
    all: {
      avg: liveListings?.avgPrice || tRREBSold.all.avgPrice,
      yoyChange: tRREBSold.all.yoy,
      soldAvg: tRREBSold.all.avgPrice,
      medianPrice: tRREBSold.all.medianPrice,
      sales: tRREBSold.all.sales,
      label: 'All Types',
    },
  };

  // Merge live listing prices with TRREB sold data
  for (const key of ['detached', 'semiDetached', 'townhouse', 'condo']) {
    const trreb = tRREBSold[key];
    avgPrices[key] = {
      avg: liveListings?.avgPrices?.[key]?.avg || trreb.avgPrice,
      count: liveListings?.avgPrices?.[key]?.count || 0,
      yoyChange: trreb.yoy,
      soldAvg: trreb.avgPrice,
      medianPrice: trreb.medianPrice,
      sales: trreb.sales,
      label: key === 'semiDetached' ? 'Semi-Detached'
        : key === 'condo' ? 'Condo Apt'
        : key.charAt(0).toUpperCase() + key.slice(1),
    };
  }

  const stats = {
    // ── Live data ──
    lastUpdated: new Date().toISOString().split('T')[0],
    source: 'Live MLS Data + TRREB Market Watch',
    region: 'Mississauga',
    activeCount: liveListings?.activeCount || 0,
    // Live-feed DOM. avgDOM/medianDOM are computed from the SAME live rows as
    // the radar below; the TRREB sold-market DOM figures keep their own
    // clearly-named fields (avgSoldDOM, mississaugaAvgLDOM/PDOM).
    medianDOM: liveListings?.medianDOM ?? null,
    // Motivated-seller radar - whole-feed counts, see fetchLiveListingStats.
    staleCount: liveListings?.staleCount ?? 0,
    stalePct: liveListings?.stalePct ?? 0,
    staleWithPriceCut: liveListings?.staleWithPriceCut ?? 0,
    staleByNeighbourhood: liveListings?.staleByNeighbourhood ?? {},
    // null (not a hardcoded 28) when the feed supplies no real days-on-market -
    // consumers already omit the tile rather than print an invented figure.
    avgDOM: liveListings?.avgDOM ?? null,
    // LIVE list-price average only. Falling back to tRREBSold.all.avgPrice
    // here published a SOLD average under a list-price key, which is what made
    // the homepage print the same $1.01M for "Avg Price" and "Avg Sold"
    // alongside a 97% sale-to-list ratio. (avgPrices.all.avg keeps its own
    // TRREB fallback: the market-pulse chart that consumes it states the
    // substitution in its caption, so there it is disclosed, not disguised.)
    avgPrice: liveListings?.avgPrice || null,
    avgPrices,
    // Whole-market Deal Screener aggregate (or null on a short fill) - see
    // fetchLiveListingStats. Consumed by the /listings server render so the
    // dashboard's set-dependent tiles are correct at first paint.
    screener: liveListings?.screener ?? null,
    salesToListRatio,
    avgSoldPrice: soldStats?.avgSoldPrice || 0,
    avgSoldDOM: soldStats?.avgDOM || 0,
    avgNegotiationGap: soldStats?.avgNegotiationGap || 0,

    // ── TRREB Market Watch ──
    // Mississauga-specific from page 3; GTA from pages 1 and 3. The month
    // string and the as-of date are read off the report by the extractor, so
    // they cannot name a different month than the figures beside them - they
    // used to be three separate hand-typed strings that had to move together.
    tRREBMonth,
    // Machine-readable as-of date for the monthly TRREB snapshot (last day of the
    // report month). Consumers use this to show honest "as of" labels and detect
    // staleness - the monthly sold/volume/YoY figures are NOT live and must never
    // be presented as today's numbers.
    tRREBAsOf,
    // Self-reporting staleness. TRREB publishes Market Watch in the first days of
    // each month, and these figures can only be refreshed from that PDF - which is
    // exactly how they silently sat five months out of date. Anything rendering
    // this data can now SEE that it's old instead of trusting it, and the admin
    // dashboard surfaces a "need new market data" banner.
    ...tRREBFreshness(tRREBAsOf),
    // GTA, Mississauga and Peel headline blocks, all derived from data/trreb.js.
    ...regional,

    marketType: 'Buyers Market',
    salesForecast2026: '+7% vs 2025 (TRREB forecast)',
    pentUpDemand: '100,000+ sidelined buyers in GTA',

    // Economic indicators from page 1. TRREB reprints these from StatCan and
    // the Bank of Canada, so the readings lag the report month -
    // `indicatorsAsOf` travels with them rather than letting them read as this
    // month's numbers.
    economic,
    rates: {
      // Posted-vs-contract handling and the reason `variable` sits below the
      // fixed rates are documented on the `rates` export in lib/market/trreb.js.
      ...tRREBRates,
      // The contract rate the site's cash-flow engine actually underwrites at.
      // Exposed so pages can show posted vs. assumed side by side instead of
      // silently disagreeing with each other. NOT a TRREB figure - it belongs to
      // the engine, so it is composed in here rather than stored with the report.
      contractRateAssumption: DEFAULT_ASSUMPTIONS.annualInterestRate,
      // Federal stress test = greater of CONTRACT rate + 2% or 5.25%. It keys off
      // the contract rate, not the posted rate. This was hardcoded to 8.09
      // (posted 6.09 + 2) - about 1.2 points too harsh - and that number was fed
      // verbatim to every AI listing analysis and every generated blog post,
      // making qualifying look harder than it is.
      stressTest: +Math.max(DEFAULT_ASSUMPTIONS.annualInterestRate + 2, 5.25).toFixed(2),
    },
    rental,
    // Prices come from HOOD_DATA, not from a second hardcoded copy. They used
    // to be typed here as well, and the two had drifted: Churchill Meadows was
    // $1,100,000 here against $843,000 in HOOD_DATA - a 30% gap on the same
    // figure. That matters because these rows are emailed: the weekly
    // newsletter renders them under "Where Prices Are Moving", so a subscriber
    // was told $1.1M and then landed on a neighbourhood guide saying $843K.
    // Port Credit, Clarkson, Cooksville and City Centre were all out too, by
    // 2.6-4.8%. Only the editorial `reason` copy is authored here now; every
    // number is read from the one constant the guides, the /neighbourhoods
    // index and the homepage cards already share, so they cannot diverge again.
    hotNeighbourhoods: HOT_NEIGHBOURHOODS.map((h) => ({
      name: h.name,
      reason: h.reason,
      avgPrice: HOOD_DATA[h.hood]?.avgPrice ?? null,
    })).filter((h) => h.avgPrice > 0),
    // The curated outlook these prices belong to, so anything rendering them
    // can say what they are rather than implying they are this month's live
    // average. The newsletter states it under the table.
    hotNeighbourhoodsAsOf: HOOD_OUTLOOK_AS_OF,
    // Mississauga sales by home type, from the per-type pages of the current
    // report. The count key is `sales`, NOT a month name: baking "feb2026" into
    // the key is part of why nobody noticed this data had gone stale.
    salesByType,
    // Full monthly history, one row per published TRREB Market Watch report (the
    // `report` field names the source issue). The previous series ran back to Apr
    // 2025 on round invented numbers - those are gone rather than left to be
    // charted as if they were real. Extend backwards by running the extractor
    // over older Market Watch PDFs; never interpolate a missing month.
    mississaugaMonthly,
    // Derived views kept for any consumer expecting the old shape.
    priceTrend: mississaugaMonthly.map((m) => ({ month: m.month, avg: m.avgPrice })),
    salesTrend: mississaugaMonthly.map((m) => ({ month: m.month, sales: m.sales })),
    // Generated from the loaded report, so it can never name a different month
    // than the figures it sits under.
    disclaimer: tRREBDisclaimer,
  };

  return NextResponse.json(stats, {
    // 24h per spec when the fill is COMPLETE. An incomplete cold fill (page
    // timeouts skipped - measured: 2,159 of 2,555 rows on the first run after
    // deploy) gets 15 minutes instead, so the undercount self-heals on the
    // next request (the failed pages aren't cached, and by then the API is
    // warm) rather than being frozen into the daily numbers.
    headers: {
      'Cache-Control': (liveListings?.fillRatio ?? 1) >= 0.95
        ? 's-maxage=86400, stale-while-revalidate=3600'
        : 's-maxage=900, stale-while-revalidate=3600',
    },
  });
}
