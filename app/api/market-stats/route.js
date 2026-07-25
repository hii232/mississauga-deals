import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// ── TRREB data freshness ─────────────────────────────────
// The monthly TRREB figures in this file are transcribed by hand from the Market
// Watch PDF (TRREB publishes no API or feed), so they only change when someone
// updates them. They once sat five months stale while every page, email and blog
// post quoted them as current. This makes the age explicit and machine-readable
// so staleness is impossible to miss: the admin dashboard shows a banner, and any
// consumer can check `tRREBIsStale` before presenting a figure as current.
//
// TRREB releases each month's report in the first few days of the following
// month, so one full month behind is normal; two or more means we're overdue.
export function tRREBFreshness(asOf, now = new Date()) {
  const asOfDate = new Date(asOf + 'T00:00:00Z');
  if (isNaN(asOfDate)) return { tRREBMonthsBehind: null, tRREBIsStale: false, tRREBRefreshNote: null };

  const monthsBehind =
    (now.getUTCFullYear() - asOfDate.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - asOfDate.getUTCMonth());

  const isStale = monthsBehind >= 2;
  return {
    tRREBMonthsBehind: monthsBehind,
    tRREBIsStale: isStale,
    tRREBRefreshNote: isStale
      ? `Need new market data — the TRREB Market Watch figures are ${monthsBehind} months behind. Upload the latest Market Watch PDF to refresh them.`
      : null,
  };
}

// ── Mississauga monthly history — TRREB Market Watch ─────
// One row per published report, transcribed from the PDF (page 3, Mississauga
// row). Nothing here is interpolated, smoothed or estimated: if a month has no
// report on hand it is simply absent. Add older months by sending the matching
// Market Watch PDF — see the refresh process in CLAUDE.md.
const mississaugaMonthly = [
  { month: 'Feb 2026', report: 'MW2602', sales: 345, avgPrice: 963747,  medianPrice: 850000, newListings: 940,  activeListings: 1748, snlr: 32.4, monthsInventory: 5.2, spLp: 96, ldom: 36 },
  { month: 'Mar 2026', report: 'MW2603', sales: 452, avgPrice: 966615,  medianPrice: 860000, newListings: 1322, activeListings: 1933, snlr: 32.7, monthsInventory: 5.2, spLp: 97, ldom: 36 },
  { month: 'Apr 2026', report: 'MW2604', sales: 516, avgPrice: 980653,  medianPrice: 900000, newListings: 1517, activeListings: 2277, snlr: 33.2, monthsInventory: 5.1, spLp: 97, ldom: 31 },
  { month: 'May 2026', report: 'MW2605', sales: 568, avgPrice: 971047,  medianPrice: 896500, newListings: 1582, activeListings: 2465, snlr: 34.4, monthsInventory: 5.0, spLp: 97, ldom: 30 },
  { month: 'Jun 2026', report: 'MW2606', sales: 567, avgPrice: 1014120, medianPrice: 880000, newListings: 1632, activeListings: 2589, snlr: 35.1, monthsInventory: 4.9, spLp: 97, ldom: 29 },
];

// ── Fetch live stats from internal APIs ──────────────────
async function fetchLiveListingStats(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/api/listings?limit=200&page=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.listings || data || [];
    const totalPages = data.pages || 1;

    // Fetch remaining pages
    if (totalPages > 1) {
      const promises = [];
      for (let p = 2; p <= totalPages; p++) {
        promises.push(
          fetch(`${baseUrl}/api/listings?limit=200&page=${p}`, {
            next: { revalidate: 3600 },
          }).then((r) => (r.ok ? r.json() : null))
        );
      }
      const pages = await Promise.all(promises);
      for (const pg of pages) {
        if (pg?.listings) raw.push(...pg.listings);
      }
    }

    if (raw.length === 0) return null;

    const count = raw.length;

    // Compute avg DOM from active listings
    const withDom = raw.filter((l) => l.DaysOnMarket != null);
    const avgDOM = withDom.length > 0
      ? Math.round(withDom.reduce((s, l) => s + (l.DaysOnMarket || 0), 0) / withDom.length)
      : 28;

    // Compute avg price; fall back to the latest transcribed TRREB average
    // rather than a frozen round number that drifts stale.
    const withPrice = raw.filter((l) => (l.ListPrice || 0) > 0);
    const avgPrice = withPrice.length > 0
      ? Math.round(withPrice.reduce((s, l) => s + l.ListPrice, 0) / withPrice.length)
      : mississaugaMonthly[mississaugaMonthly.length - 1].avgPrice;

    // Compute avg prices by type
    const typeMap = {
      detached: ['Detached', 'Single Family Residence'],
      semiDetached: ['Semi-Detached'],
      townhouse: ['Att/Row/Twnhouse', 'Row/Townhouse', 'Townhouse'],
      condo: ['Condo Apt', 'Condo Townhouse', 'Condominium'],
    };

    const avgPrices = {};
    for (const [key, types] of Object.entries(typeMap)) {
      const matches = withPrice.filter((l) =>
        types.some((t) => (l.PropertyType || '').includes(t) || (l.PropertySubType || '').includes(t))
      );
      if (matches.length > 0) {
        avgPrices[key] = {
          avg: Math.round(matches.reduce((s, l) => s + l.ListPrice, 0) / matches.length),
          count: matches.length,
          label: key === 'semiDetached' ? 'Semi-Detached' : key.charAt(0).toUpperCase() + key.slice(1),
        };
      }
    }

    return { activeCount: count, avgDOM, avgPrice, avgPrices };
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

  // ── TRREB Market Watch June 2026 — Mississauga Sold Data ──
  // Source: TRREB MW2606 (June 2026, released July 3 2026) — Mississauga rows on
  // pages 3 (all types), 7 (detached), 9 (semi), 11 (Att/Row/Townhouse), 15
  // (condo apartment). Every figure below is copied straight from the report —
  // nothing derived, nothing averaged across categories.
  //
  // `townhouse` is freehold Att/Row/Townhouse and `condo` is Condo Apartment,
  // matching how the live-listing buckets above are mapped. Condo Townhouse
  // (91 sales, $726,749 avg) and Link (1) are reported separately by TRREB and
  // are intentionally not folded in here — merging them would mean averaging
  // medians, which isn't valid. `all` carries the true Mississauga total.
  //
  // yoy is TRREB's GTA-wide year-over-year change by home type (page 1). Market
  // Watch does NOT publish a per-municipality YoY, so this is a GTA figure —
  // never relabel it as Mississauga-specific.
  const tRREBSold = {
    all:          { sales: 567, avgPrice: 1014120, medianPrice: 880000,  yoy: -3.9 },
    detached:     { sales: 227, avgPrice: 1482130, medianPrice: 1252000, yoy: -2.0 },
    semiDetached: { sales: 86,  avgPrice: 908389,  medianPrice: 885000,  yoy: -4.6 },
    townhouse:    { sales: 18,  avgPrice: 883038,  medianPrice: 901600,  yoy: -3.1 },
    condo:        { sales: 142, avgPrice: 525333,  medianPrice: 498500,  yoy: -9.5 },
  };

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
    avgDOM: liveListings?.avgDOM || 28,
    avgPrice: liveListings?.avgPrice || tRREBSold.all.avgPrice,
    avgPrices,
    salesToListRatio,
    avgSoldPrice: soldStats?.avgSoldPrice || 0,
    avgSoldDOM: soldStats?.avgDOM || 0,
    avgNegotiationGap: soldStats?.avgNegotiationGap || 0,

    // ── TRREB Market Watch June 2026 (MW2606) ──
    // Mississauga-specific from page 3; GTA from pages 1 and 3.
    tRREBMonth: 'June 2026',
    // Machine-readable as-of date for the monthly TRREB snapshot (last day of the
    // report month). Consumers use this to show honest "as of" labels and detect
    // staleness — the monthly sold/volume/YoY figures are NOT live and must never
    // be presented as today's numbers. Keep in sync with tRREBMonth above.
    tRREBAsOf: '2026-06-30',
    // Self-reporting staleness. TRREB publishes Market Watch in the first days of
    // each month, and these figures can only be refreshed by hand from that PDF —
    // which is exactly how they silently sat five months out of date. Anything
    // rendering this data can now SEE that it's old instead of trusting it, and
    // the admin dashboard surfaces a "need new market data" banner.
    ...tRREBFreshness('2026-06-30'),
    gtaAvgPrice: 1058658,
    gtaMedianPrice: 890000,
    gtaYoyChange: -3.9,
    gtaSales: 6770,
    gtaSalesYoy: 9.4,
    gtaNewListings: 17282,
    gtaNewListingsYoy: -12.9,
    gtaActiveListings: 27329,
    gtaActiveListingsYoy: -13.5,
    gtaAvgLDOM: 29,
    gtaAvgPDOM: 42,

    // Mississauga TRREB stats
    mississaugaSales: 567,
    mississaugaNewListings: 1632,
    mississaugaActiveListings: 2589,
    mississaugaSNLR: 35.1,
    mississaugaMonthsOfInventory: 4.9,
    mississaugaAvgSPLP: 97,
    mississaugaAvgLDOM: 29,
    mississaugaAvgPDOM: 47,
    mississaugaAvgPrice: 1014120,
    mississaugaMedianPrice: 880000,

    // Peel Region
    peelSales: 1167,
    peelAvgPrice: 966024,
    peelMedianPrice: 875000,
    peelActiveListings: 5189,

    marketType: 'Buyers Market',
    salesForecast2026: '+7% vs 2025 (TRREB forecast)',
    pentUpDemand: '100,000+ sidelined buyers in GTA',

    // Economic indicators from page 1
    economic: {
      gdpGrowth: -0.1,             // Q1 2026
      employmentGrowth: 0.7,       // May 2026 (Toronto)
      unemployment: 7.6,           // May 2026 (Toronto, SA)
      inflation: 3.2,              // May 2026 (Yr./Yr. CPI growth)
      bocRate: 2.3,                // June 2026 overnight rate
      primeRate: 4.5,              // June 2026
    },
    rates: {
      // variable is NOT published in Market Watch — TRREB lists posted 1/3/5-year
      // fixed only. Kept as a separate broker-sourced estimate.
      variable: 4.45,
      fixed1yr: 5.49,              // TRREB MW2606, June 2026
      fixed3yr: 6.05,
      fixed5yr: 6.09,
      stressTest: 8.09,            // fixed5yr + 2%
    },
    rental: {
      avg1Bed: 2100,
      avg2Bed: 2700,
      avg3Bed: 3200,
      rentalYoyChange: -3.2,
    },
    hotNeighbourhoods: [
      { name: 'Cooksville', reason: 'LRT corridor + most affordable', avgPrice: 750000 },
      { name: 'Square One / City Centre', reason: 'Urban density + transit hub', avgPrice: 620000 },
      { name: 'Port Credit', reason: 'Waterfront premium + GO Transit', avgPrice: 1250000 },
      { name: 'Clarkson', reason: 'Highest cap rates + GO station', avgPrice: 1050000 },
      { name: 'Churchill Meadows', reason: 'New builds + family demand', avgPrice: 1100000 },
    ],
    // Mississauga sales by home type — TRREB MW2606 (June 2026), the per-type
    // pages. The count key is `sales`, NOT a month name: baking "feb2026" into
    // the key is part of why nobody noticed this data had gone stale.
    salesByType: {
      detached:     { sales: 227, avgPrice: 1482130, spLp: 96,  ldom: 25 },
      semiDetached: { sales: 86,  avgPrice: 908389,  spLp: 100, ldom: 19 },
      townhouse:    { sales: 18,  avgPrice: 883038,  spLp: 101, ldom: 30 },
      condoTown:    { sales: 91,  avgPrice: 726749,  spLp: 98,  ldom: 31 },
      condoApt:     { sales: 142, avgPrice: 525333,  spLp: 97,  ldom: 40 },
    },
    // Full monthly history, every row transcribed from a published TRREB Market
    // Watch report (the `report` field names the source issue). The previous
    // series ran back to Apr 2025 on round invented numbers — those are gone
    // rather than left to be charted as if they were real. Extend backwards by
    // sending older Market Watch PDFs; never interpolate a missing month.
    mississaugaMonthly,
    // Derived views kept for any consumer expecting the old shape.
    priceTrend: mississaugaMonthly.map((m) => ({ month: m.month, avg: m.avgPrice })),
    salesTrend: mississaugaMonthly.map((m) => ({ month: m.month, sales: m.sales })),
    disclaimer: 'Active listing statistics computed from live MLS data. Sold statistics from TRREB Market Watch June 2026 (MW2606). Deemed reliable but not guaranteed.',
  };

  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800' },
  });
}
