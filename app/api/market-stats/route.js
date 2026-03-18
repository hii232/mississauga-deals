import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

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

    // Compute avg price
    const withPrice = raw.filter((l) => (l.ListPrice || 0) > 0);
    const avgPrice = withPrice.length > 0
      ? Math.round(withPrice.reduce((s, l) => s + l.ListPrice, 0) / withPrice.length)
      : 970000;

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

  // ── TRREB Market Watch February 2026 — Mississauga Sold Data ──
  // Source: TRREB MW2602 (Feb 2026) — pages 3, 7, 9
  const tRREBSold = {
    all:          { sales: 345, avgPrice: 963747,  medianPrice: 850000,  yoy: -3.9 },
    detached:     { sales: 124, avgPrice: 1460621, medianPrice: 1239000, yoy: -11.4 },
    semiDetached: { sales: 42,  avgPrice: 921202,  medianPrice: 902000,  yoy: -9.2 },
    townhouse:    { sales: 50,  avgPrice: 840000,  medianPrice: 780000,  yoy: -2.4 },
    condo:        { sales: 129, avgPrice: 664000,  medianPrice: 550000,  yoy: -12.0 },
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
    avgPrice: liveListings?.avgPrice || 970000,
    avgPrices,
    salesToListRatio,
    avgSoldPrice: soldStats?.avgSoldPrice || 0,
    avgSoldDOM: soldStats?.avgDOM || 0,
    avgNegotiationGap: soldStats?.avgNegotiationGap || 0,

    // ── TRREB Market Watch February 2026 (MW2602) ──
    // Mississauga-specific from page 3; GTA from page 1
    tRREBMonth: 'February 2026',
    gtaAvgPrice: 1008968,
    gtaMedianPrice: 865000,
    gtaYoyChange: -7.1,
    gtaSales: 3868,
    gtaSalesYoy: -6.3,
    gtaNewListings: 10705,
    gtaNewListingsYoy: -17.7,
    gtaActiveListings: 19314,
    gtaActiveListingsYoy: -2.4,
    gtaAvgLDOM: 36,
    gtaAvgPDOM: 54,

    // Mississauga TRREB stats
    mississaugaSales: 345,
    mississaugaNewListings: 940,
    mississaugaActiveListings: 1748,
    mississaugaSNLR: 32.4,
    mississaugaMonthsOfInventory: 5.2,
    mississaugaAvgSPLP: 96,
    mississaugaAvgLDOM: 36,
    mississaugaAvgPDOM: 53,
    mississaugaAvgPrice: 963747,
    mississaugaMedianPrice: 850000,

    // Peel Region
    peelSales: 706,
    peelAvgPrice: 933616,
    peelMedianPrice: 847750,
    peelActiveListings: 3628,

    marketType: 'Buyers Market',
    salesForecast2026: '+7% vs 2025 (TRREB forecast)',
    pentUpDemand: '100,000+ sidelined buyers in GTA',

    // Economic indicators from page 1
    economic: {
      gdpGrowth: -0.6,            // Q4 2025
      employmentGrowth: 1.2,       // January 2026
      unemployment: 7.9,           // January 2026 (Toronto)
      inflation: 2.3,              // January 2026
      bocRate: 2.3,                // February 2026
      primeRate: 4.5,              // February 2026
    },
    rates: {
      variable: 4.45,
      fixed1yr: 5.84,
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
    // Sales by home type from TRREB Feb 2026 (page 1 table)
    salesByType: {
      detached:     { feb2026: 124, avgPrice: 1460621, spLp: 94, ldom: 33 },
      semiDetached: { feb2026: 42,  avgPrice: 921202,  spLp: 98, ldom: 29 },
      townhouse:    { feb2026: 50,  avgPrice: 840000,  spLp: 96, ldom: 35 },
      condoApt:     { feb2026: 129, avgPrice: 664000,  spLp: 96, ldom: 36 },
    },
    priceTrend: [
      { month: 'Apr 2025', avg: 1025000 },
      { month: 'May 2025', avg: 1035000 },
      { month: 'Jun 2025', avg: 1020000 },
      { month: 'Jul 2025', avg: 1010000 },
      { month: 'Aug 2025', avg: 995000 },
      { month: 'Sep 2025', avg: 985000 },
      { month: 'Oct 2025', avg: 975000 },
      { month: 'Nov 2025', avg: 960000 },
      { month: 'Dec 2025', avg: 955000 },
      { month: 'Jan 2026', avg: 965000 },
      { month: 'Feb 2026', avg: 963747 },
    ],
    salesTrend: [
      { month: 'Apr 2025', sales: 820 },
      { month: 'May 2025', sales: 890 },
      { month: 'Jun 2025', sales: 910 },
      { month: 'Jul 2025', sales: 780 },
      { month: 'Aug 2025', sales: 720 },
      { month: 'Sep 2025', sales: 750 },
      { month: 'Oct 2025', sales: 680 },
      { month: 'Nov 2025', sales: 620 },
      { month: 'Dec 2025', sales: 480 },
      { month: 'Jan 2026', sales: 380 },
      { month: 'Feb 2026', sales: 345 },
    ],
    disclaimer: 'Active listing statistics computed from live MLS data. Sold statistics from TRREB Market Watch February 2026 (MW2602). Deemed reliable but not guaranteed.',
  };

  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800' },
  });
}
