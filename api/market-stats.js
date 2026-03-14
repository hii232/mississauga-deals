// api/market-stats.js — TRREB Mississauga market statistics
// Data sourced from TRREB Market Watch reports and public releases
// Updated periodically — last update: March 2026

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const stats = {
    lastUpdated: '2026-03-01',
    source: 'TRREB Market Watch / PropTx',
    region: 'Mississauga',

    // Current averages by property type
    avgPrices: {
      all: { avg: 970000, yoyChange: -5.8, label: 'All Types' },
      detached: { avg: 1380000, yoyChange: -5.5, label: 'Detached' },
      semiDetached: { avg: 950000, yoyChange: -2.8, label: 'Semi-Detached' },
      townhouse: { avg: 940000, yoyChange: -7.0, label: 'Townhouse' },
      condo: { avg: 560000, yoyChange: -8.0, label: 'Condo Apt' }
    },

    // GTA-wide context
    gtaAvgPrice: 1008968,
    gtaYoyChange: -7.1,

    // Market conditions
    marketType: 'Buyers Market',
    salesForecast2026: '+7% vs 2025',
    pentUpDemand: '100,000+ sidelined buyers in GTA',

    // Key metrics
    avgDOM: 28,
    salesToListRatio: 0.42,
    newListingsYoy: -12.3,
    salesYoy: -8.5,
    monthsOfInventory: 4.2,

    // Rental market
    rental: {
      avg1Bed: 2100,
      avg2Bed: 2700,
      avg3Bed: 3200,
      rentalYoyChange: -3.2
    },

    // Mortgage rates (current approx)
    rates: {
      variable: 4.95,
      fixed5yr: 4.49,
      fixed3yr: 4.89,
      stressTest: 6.49
    },

    // Hot neighbourhoods 2026
    hotNeighbourhoods: [
      { name: 'Cooksville', reason: 'LRT corridor + affordability', avgPrice: 820000 },
      { name: 'Square One / City Centre', reason: 'Urban density + transit hub', avgPrice: 650000 },
      { name: 'Port Credit', reason: 'Waterfront premium + GO Transit', avgPrice: 1250000 },
      { name: 'Erin Mills', reason: 'Family-friendly + established', avgPrice: 1150000 },
      { name: 'Churchill Meadows', reason: 'New builds + value', avgPrice: 1100000 }
    ],

    // Price trend (monthly avg price, last 12 months)
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
      { month: 'Mar 2026', avg: 975000 }
    ],

    // Sales volume trend
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
      { month: 'Mar 2026', sales: 670 }
    ],

    disclaimer: 'Market statistics sourced from TRREB Market Watch reports and public data releases. Deemed reliable but not guaranteed. For official TRREB statistics visit trreb.ca/market-data/'
  };

  return res.status(200).json(stats);
};
