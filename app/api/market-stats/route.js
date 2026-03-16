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

  // Build live avg prices merged with YoY (manual data — can't compute from API)
  const yoyData = {
    all: -5.8,
    detached: -5.5,
    semiDetached: -2.8,
    townhouse: -7.0,
    condo: -8.0,
  };

  const avgPrices = {
    all: {
      avg: liveListings?.avgPrice || 970000,
      yoyChange: yoyData.all,
      label: 'All Types',
    },
  };

  // Merge live type prices with YoY data
  for (const key of ['detached', 'semiDetached', 'townhouse', 'condo']) {
    if (liveListings?.avgPrices?.[key]) {
      avgPrices[key] = {
        ...liveListings.avgPrices[key],
        yoyChange: yoyData[key],
      };
    } else {
      // Fallback to manual estimates
      const fallbacks = { detached: 1380000, semiDetached: 950000, townhouse: 940000, condo: 560000 };
      avgPrices[key] = {
        avg: fallbacks[key],
        yoyChange: yoyData[key],
        label: key === 'semiDetached' ? 'Semi-Detached'
          : key === 'condo' ? 'Condo Apt'
          : key.charAt(0).toUpperCase() + key.slice(1),
      };
    }
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

    // ── Manual TRREB data (update periodically) ──
    gtaAvgPrice: 1008968,
    gtaYoyChange: -7.1,
    marketType: 'Buyers Market',
    salesForecast2026: '+7% vs 2025',
    pentUpDemand: '100,000+ sidelined buyers in GTA',
    newListingsYoy: -12.3,
    salesYoy: -8.5,
    monthsOfInventory: 4.2,
    rental: {
      avg1Bed: 2100,
      avg2Bed: 2700,
      avg3Bed: 3200,
      rentalYoyChange: -3.2,
    },
    rates: {
      variable: 4.95,
      fixed5yr: 4.49,
      fixed3yr: 4.89,
      stressTest: 6.49,
    },
    hotNeighbourhoods: [
      { name: 'Cooksville', reason: 'LRT corridor + affordability', avgPrice: 820000 },
      { name: 'Square One / City Centre', reason: 'Urban density + transit hub', avgPrice: 650000 },
      { name: 'Port Credit', reason: 'Waterfront premium + GO Transit', avgPrice: 1250000 },
      { name: 'Erin Mills', reason: 'Family-friendly + established', avgPrice: 1150000 },
      { name: 'Churchill Meadows', reason: 'New builds + value', avgPrice: 1100000 },
    ],
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
      { month: 'Feb 2026', avg: 970000 },
      { month: 'Mar 2026', avg: 975000 },
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
      { month: 'Jan 2026', sales: 520 },
      { month: 'Feb 2026', sales: 610 },
      { month: 'Mar 2026', sales: 670 },
    ],
    disclaimer: 'Active listing statistics computed from live MLS data. Historical trends sourced from TRREB Market Watch reports. Deemed reliable but not guaranteed.',
  };

  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800' },
  });
}
