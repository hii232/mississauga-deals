// api/listings.js — TRREB PropTx VOW Datafeed Integration
// Deploy to /api/listings.js in your Vercel project
// Required env vars: PROPTX_BEARER_TOKEN (from syndication.ampre.ca → Tokens → Show Bearer Token)

const ODATA_BASE = 'https://query.ampre.ca/odata';
const BEARER_TOKEN = process.env.AMPRE_TOKEN;

// VOW Compliance: max 100 results per request
const MAX_RESULTS = 100;

// GTA Mississauga city codes — filter to your VOW territory
const MISSISSAUGA_CITIES = [
  'Mississauga',
  'Port Credit',
  'Streetsville',
  'Clarkson',
  'Lakeview',
  'Erin Mills',
  'Churchill Meadows',
  'Cooksville',
  'Hurontario',
  'Meadowvale',
  'Malton',
];

export default async function handler(req, res) {
  // CORS — only allow your VOW domain (VOW Policy compliance)
  const allowedOrigins = [
    'https://www.mississaugainvestor.ca',
    'https://mississaugainvestor.ca',
    'http://localhost:3000',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!BEARER_TOKEN) {
    return res.status(500).json({ error: 'PROPTX_BEARER_TOKEN not configured in Vercel env vars' });
  }

  try {
    const {
      page = '1',
      limit = '50',
      minPrice,
      maxPrice,
      beds,
      baths,
      type,
      city,
      status = 'Active',
    } = req.query;

    const take = Math.min(parseInt(limit), MAX_RESULTS); // VOW: never exceed 100
    const skip = (parseInt(page) - 1) * take;

    // Build OData $filter
    const filters = [];

    // Status
    filters.push(`StandardStatus eq '${status}'`);

    // Price range
    if (minPrice) filters.push(`ListPrice ge ${parseInt(minPrice)}`);
    if (maxPrice) filters.push(`ListPrice le ${parseInt(maxPrice)}`);

    // Bedrooms
    if (beds) filters.push(`BedroomsTotal ge ${parseInt(beds)}`);

    // Bathrooms
    if (baths) filters.push(`BathroomsTotalInteger ge ${parseInt(baths)}`);

    // Property type
    if (type) {
      const typeMap = {
        detached: 'Single Family Residence',
        semi: 'Semi-Detached',
        townhouse: 'Row/Townhouse',
        condo: 'Condo Apartment',
        duplex: 'Duplex',
        triplex: 'Triplex',
      };
      const mappedType = typeMap[type.toLowerCase()] || type;
      filters.push(`PropertyType eq '${mappedType}'`);
    }

    // City filter — default to Mississauga territory
    if (city) {
      filters.push(`City eq '${city}'`);
    } else {
      const cityFilter = MISSISSAUGA_CITIES.map(c => `City eq '${c}'`).join(' or ');
      filters.push(`(${cityFilter})`);
    }

    const filterStr = filters.join(' and ');

    // Select only fields we need (performance + compliance)
    const select = [
      'ListingKey',
      'ListingId',
      'ListPrice',
      'City',
      'StateOrProvince',
      'PostalCode',
      'UnparsedAddress',
      'StreetNumber',
      'StreetName',
      'StreetSuffix',
      'UnitNumber',
      'BedroomsTotal',
      'BathroomsTotalInteger',
      'PropertyType',
      'PropertySubType',
      'LivingArea',
      'LotSizeArea',
      'LotSizeUnits',
      'YearBuilt',
      'DaysOnMarket',
      'StandardStatus',
      'ListOfficeName',       // VOW REQUIRED: display listing brokerage
      'ListOfficePhone',
      'PublicRemarks',
      'Media',
      'Coordinates',
      'Latitude',
      'Longitude',
      'OriginalListPrice',
      'ClosePrice',
      'MlsStatus',
      'ModificationTimestamp',
    ].join(',');

    const url = `${ODATA_BASE}/Property?$filter=${encodeURIComponent(filterStr)}&$select=${encodeURIComponent(select)}&$top=${take}&$skip=${skip}&$orderby=ModificationTimestamp desc&$count=true`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
        Accept: 'application/json',
        'User-Agent': 'MississaugaInvestor/1.0 (www.mississaugainvestor.ca)',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('PropTx API error:', response.status, errText);
      return res.status(response.status).json({
        error: `PropTx API returned ${response.status}`,
        detail: errText,
      });
    }

    const data = await response.json();
    const listings = data.value || [];
    const totalCount = data['@odata.count'] || listings.length;

    // Transform listings + inject investment metrics
    const enriched = listings.map(l => enrichListing(l));

    // VOW Compliance: add required copyright notice
    return res.status(200).json({
      listings: enriched,
      total: totalCount,
      page: parseInt(page),
      limit: take,
      pages: Math.ceil(totalCount / take),
      copyright: 'Listing information provided by PropTx Innovations Inc. All rights reserved. Information is deemed reliable but not guaranteed.',
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('listings.js error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

// Enrich listing with investment metrics calculated server-side
function enrichListing(listing) {
  const price = listing.ListPrice || 0;
  const beds = listing.BedroomsTotal || 0;
  const sqft = listing.LivingArea || 0;
  const city = listing.City || 'Mississauga';
  const type = listing.PropertyType || '';

  // Estimate rent using GTA market data
  const estimatedRent = estimateRent(price, beds, sqft, city, type);

  // Calculate investment metrics
  const metrics = calculateInvestmentMetrics({
    price,
    estimatedRent,
    downPaymentPct: 0.20,        // 20% default
    interestRate: 0.0599,        // 5.99% — current 5yr fixed (Mar 2026)
    amortizationYears: 25,
    propertyTaxRate: 0.0072,     // Mississauga 2025 rate: 0.72%
    insuranceMonthly: 175,       // GTA average
    maintenancePct: 0.05,        // 5% of rent
    vacancyRate: 0.03,           // 3% — tight Mississauga market
    propertyMgmtPct: 0,          // off by default, toggleable
  });

  // Deal score 0–10
  const dealScore = scoreDeal(metrics, price, city);

  return {
    // MLS fields
    id: listing.ListingKey,
    mlsId: listing.ListingId,
    price,
    address: formatAddress(listing),
    city: listing.City,
    postalCode: listing.PostalCode,
    beds,
    sqft,
    lotSize: listing.LotSizeArea,
    lotUnit: listing.LotSizeUnits,
    type: listing.PropertyType,
    subType: listing.PropertySubType,
    yearBuilt: listing.YearBuilt,
    daysOnMarket: listing.DaysOnMarket || 0,
    status: listing.StandardStatus,
    listingBrokerage: listing.ListOfficeName, // VOW REQUIRED
    listingBrokeragePhone: listing.ListOfficePhone,
    remarks: listing.PublicRemarks,
    images: extractImages(listing.Media),
    lat: listing.Latitude,
    lng: listing.Longitude,
    originalPrice: listing.OriginalListPrice,
    priceReduction: listing.OriginalListPrice
      ? Math.round(((listing.OriginalListPrice - price) / listing.OriginalListPrice) * 100)
      : 0,
    lastModified: listing.ModificationTimestamp,

    // Investment metrics
    estimatedRent,
    ...metrics,
    dealScore,
    dealGrade: getDealGrade(dealScore),
  };
}

// ============================================================
// CALCULATION ENGINE — CORRECT VERSION
// ============================================================
function calculateInvestmentMetrics({
  price,
  estimatedRent,
  downPaymentPct = 0.20,
  interestRate = 0.0599,
  amortizationYears = 25,
  propertyTaxRate = 0.0072,
  insuranceMonthly = 175,
  maintenancePct = 0.05,
  vacancyRate = 0.03,
  propertyMgmtPct = 0,
}) {
  if (!price || !estimatedRent) return nullMetrics();

  // --- Capital Structure ---
  const downPayment = price * downPaymentPct;
  const loanAmount = price - downPayment;
  const closingCosts = price * 0.015; // ~1.5% closing costs estimate
  const totalCashInvested = downPayment + closingCosts;

  // --- Mortgage Payment (Canadian semi-annual compounding) ---
  // Canada uses semi-annual compounding, not monthly
  const effectiveAnnualRate = Math.pow(1 + interestRate / 2, 2) - 1;
  const monthlyRate = Math.pow(1 + effectiveAnnualRate, 1 / 12) - 1;
  const n = amortizationYears * 12;
  const mortgagePayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n))
    / (Math.pow(1 + monthlyRate, n) - 1);

  // --- Income ---
  const grossMonthlyIncome = estimatedRent;
  const vacancyLoss = grossMonthlyIncome * vacancyRate;
  const effectiveMonthlyIncome = grossMonthlyIncome - vacancyLoss;

  // --- Operating Expenses (monthly) ---
  const propertyTaxMonthly = (price * propertyTaxRate) / 12;
  const maintenanceMonthly = estimatedRent * maintenancePct;
  const propertyMgmtMonthly = estimatedRent * propertyMgmtPct;

  const totalOperatingExpenses = propertyTaxMonthly
    + insuranceMonthly
    + maintenanceMonthly
    + propertyMgmtMonthly;

  // --- NOI (excludes mortgage — used for cap rate) ---
  const monthlyNOI = effectiveMonthlyIncome - totalOperatingExpenses;
  const annualNOI = monthlyNOI * 12;

  // --- Cash Flow (after mortgage) ---
  const monthlyCashFlow = monthlyNOI - mortgagePayment;
  const annualCashFlow = monthlyCashFlow * 12;

  // --- Returns ---
  const capRate = price > 0 ? (annualNOI / price) * 100 : 0;
  const cashOnCashReturn = totalCashInvested > 0
    ? (annualCashFlow / totalCashInvested) * 100
    : 0;

  // --- GRM (Gross Rent Multiplier) ---
  const annualGrossRent = grossMonthlyIncome * 12;
  const grm = annualGrossRent > 0 ? price / annualGrossRent : 0;

  // --- Expense Ratio ---
  const expenseRatio = effectiveMonthlyIncome > 0
    ? (totalOperatingExpenses / effectiveMonthlyIncome) * 100
    : 0;

  return {
    // Capital
    downPayment: Math.round(downPayment),
    loanAmount: Math.round(loanAmount),
    totalCashInvested: Math.round(totalCashInvested),
    closingCosts: Math.round(closingCosts),

    // Mortgage
    mortgagePayment: Math.round(mortgagePayment),
    interestRate: (interestRate * 100).toFixed(2),
    amortizationYears,

    // Income
    grossMonthlyRent: Math.round(grossMonthlyIncome),
    vacancyLoss: Math.round(vacancyLoss),
    effectiveMonthlyIncome: Math.round(effectiveMonthlyIncome),

    // Expenses (monthly)
    propertyTaxMonthly: Math.round(propertyTaxMonthly),
    insuranceMonthly: Math.round(insuranceMonthly),
    maintenanceMonthly: Math.round(maintenanceMonthly),
    propertyMgmtMonthly: Math.round(propertyMgmtMonthly),
    totalOperatingExpenses: Math.round(totalOperatingExpenses),
    totalMonthlyExpenses: Math.round(totalOperatingExpenses + mortgagePayment),

    // Cash Flow
    monthlyNOI: Math.round(monthlyNOI),
    annualNOI: Math.round(annualNOI),
    monthlyCashFlow: Math.round(monthlyCashFlow),
    annualCashFlow: Math.round(annualCashFlow),

    // Returns
    capRate: parseFloat(capRate.toFixed(2)),
    cashOnCashReturn: parseFloat(cashOnCashReturn.toFixed(2)),
    grm: parseFloat(grm.toFixed(1)),
    expenseRatio: parseFloat(expenseRatio.toFixed(1)),
  };
}

// Rent estimator — GTA market calibrated (March 2026)
function estimateRent(price, beds, sqft, city, type) {
  // Base rent from price (GTA rent-to-price ratios)
  // Mississauga: avg rent/price ratio ~0.43% monthly
  let baseFromPrice = price * 0.0043;

  // Bed-based estimate
  const bedRents = {
    studio: 1850,
    1: 2100,
    2: 2600,
    3: 3100,
    4: 3600,
    5: 4200,
  };
  const bedKey = beds >= 5 ? 5 : beds <= 0 ? 'studio' : beds;
  const baseFromBeds = bedRents[bedKey] || 2400;

  // Sqft adjustment (if available)
  let sqftAdjust = 0;
  if (sqft > 0) {
    sqftAdjust = sqft > 1500 ? 200 : sqft > 2000 ? 400 : 0;
  }

  // Property type adjustment
  let typeAdj = 0;
  if (type?.toLowerCase().includes('detach')) typeAdj = 300;
  if (type?.toLowerCase().includes('condo')) typeAdj = -200;
  if (type?.toLowerCase().includes('town')) typeAdj = 100;

  // Blend price-based and bed-based estimates (50/50)
  const blended = (baseFromPrice * 0.5 + (baseFromBeds + sqftAdjust + typeAdj) * 0.5);

  // Round to nearest $50
  return Math.round(blended / 50) * 50;
}

// Deal score 0–10
function scoreDeal(metrics, price, city) {
  let score = 5; // neutral baseline

  // Cap rate scoring (most important)
  if (metrics.capRate >= 6) score += 2.5;
  else if (metrics.capRate >= 4.5) score += 1.5;
  else if (metrics.capRate >= 3) score += 0.5;
  else if (metrics.capRate < 2) score -= 1.5;

  // Cash flow scoring
  if (metrics.monthlyCashFlow >= 500) score += 1.5;
  else if (metrics.monthlyCashFlow >= 200) score += 0.75;
  else if (metrics.monthlyCashFlow >= 0) score += 0.25;
  else if (metrics.monthlyCashFlow < -300) score -= 1;

  // CoC return scoring
  if (metrics.cashOnCashReturn >= 8) score += 1;
  else if (metrics.cashOnCashReturn >= 5) score += 0.5;
  else if (metrics.cashOnCashReturn < 0) score -= 0.5;

  // GRM scoring (lower = better deal)
  if (metrics.grm <= 15) score += 0.5;
  else if (metrics.grm >= 25) score -= 0.5;

  return Math.min(10, Math.max(0, parseFloat(score.toFixed(1))));
}

function getDealGrade(score) {
  if (score >= 8.5) return 'A+';
  if (score >= 7.5) return 'A';
  if (score >= 6.5) return 'B+';
  if (score >= 5.5) return 'B';
  if (score >= 4.5) return 'C+';
  if (score >= 3.5) return 'C';
  return 'D';
}

function formatAddress(l) {
  const parts = [
    l.UnitNumber ? `${l.UnitNumber}-` : '',
    l.StreetNumber || '',
    l.StreetName || '',
    l.StreetSuffix || '',
  ].filter(Boolean);
  return parts.join(' ') || l.UnparsedAddress || 'Address on Request';
}

function extractImages(media) {
  if (!media || !Array.isArray(media)) return [];
  return media
    .filter(m => m.MediaCategory === 'Photo' || m.MediaType?.includes('image'))
    .sort((a, b) => (a.Order || 0) - (b.Order || 0))
    .slice(0, 10)
    .map(m => m.MediaURL || m.MediaUrl)
    .filter(Boolean);
}

function nullMetrics() {
  return {
    downPayment: 0, loanAmount: 0, totalCashInvested: 0, closingCosts: 0,
    mortgagePayment: 0, interestRate: '5.99', amortizationYears: 25,
    grossMonthlyRent: 0, vacancyLoss: 0, effectiveMonthlyIncome: 0,
    propertyTaxMonthly: 0, insuranceMonthly: 0, maintenanceMonthly: 0,
    propertyMgmtMonthly: 0, totalOperatingExpenses: 0, totalMonthlyExpenses: 0,
    monthlyNOI: 0, annualNOI: 0, monthlyCashFlow: 0, annualCashFlow: 0,
    capRate: 0, cashOnCashReturn: 0, grm: 0, expenseRatio: 0,
  };
}
