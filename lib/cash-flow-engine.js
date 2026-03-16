import { HOOD_RENTS, getTaxRate } from './constants';

// ─────────────────────────────────────────────
//   CASH FLOW CALCULATION ENGINE
// ─────────────────────────────────────────────

/**
 * Calculate monthly mortgage payment using standard amortization formula
 */
export function calcMonthly(price, downPct = 20, rate = 5.5, years = 25) {
  const principal = price * (1 - downPct / 100);
  const monthlyRate = rate / 100 / 12;
  const numPayments = years * 12;
  if (monthlyRate === 0) return Math.round(principal / numPayments);
  return Math.round(
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

/**
 * Estimate monthly rent based on price, beds, city, type, and neighbourhood
 * Prefers neighbourhood-specific data when available, falls back to blended formula
 */
export function estimateRent(price, beds, city, type, neighbourhood) {
  // Try neighbourhood-specific rent first
  const hoodRents = HOOD_RENTS[neighbourhood] || HOOD_RENTS[city];
  if (hoodRents) {
    let hoodRent = hoodRents[Math.min(beds || 0, 5)];
    let adj = type === 'Detached' ? 250 : type === 'Condo' ? -150 : 0;
    if (['Duplex', 'Triplex', 'Fourplex', 'Multiplex'].includes(type)) adj += 800;
    return Math.round((hoodRent + adj) / 50) * 50;
  }

  // Fallback: blended formula
  const baseRents = { 0: 1850, 1: 2100, 2: 2700, 3: 3200, 4: 3800, 5: 4400 };
  const base = baseRents[Math.min(beds || 0, 5)] || 2500;
  let adj = type === 'Detached' ? 250 : type === 'Condo' ? -150 : 0;
  if (['Duplex', 'Triplex', 'Fourplex', 'Multiplex'].includes(type)) adj += 800;
  if ((city || '').toLowerCase().includes('port credit')) adj += 200;
  return Math.round(((price || 0) * 0.0042 * 0.4 + (base + adj) * 0.6) / 50) * 50;
}

/**
 * Calculate full cash flow breakdown
 * Returns: { mortgage, propTax, insurance, maintenance, vacancy, cashFlow, totalExpenses }
 */
export function calculateCashFlow(price, rent, downPct = 20, rate = 5.5, amortYears = 25, city = null) {
  const mortgage = calcMonthly(price, downPct, rate, amortYears);
  const propTax = Math.round((price * getTaxRate(city)) / 12);
  const insurance = Math.round((price * 0.003) / 12); // ~0.3% insurance
  const maintenance = Math.round(rent * 0.05); // 5% maintenance reserve
  const vacancy = Math.round(rent * 0.04); // 4% vacancy allowance
  const totalExpenses = mortgage + propTax + insurance + maintenance + vacancy;
  const cashFlow = rent - totalExpenses;

  return { mortgage, propTax, insurance, maintenance, vacancy, totalExpenses, cashFlow };
}

/**
 * Calculate Net Operating Income
 */
export function calculateNOI(rent, vacancyRate = 0.09, opexRate = 0.30) {
  return rent * 12 * (1 - vacancyRate) * (1 - opexRate);
}

/**
 * Calculate Cap Rate
 */
export function calculateCapRate(noi, price) {
  if (price <= 0) return 0;
  return +((noi / price) * 100).toFixed(2);
}

/**
 * Calculate Cash-on-Cash Return
 */
export function calculateCashOnCash(annualCashFlow, price, downPct = 20) {
  const totalCashIn = price * (downPct / 100);
  if (totalCashIn <= 0) return 0;
  return +((annualCashFlow / totalCashIn) * 100).toFixed(2);
}

/**
 * Calculate BRRR metrics
 */
export function calculateBRRR(purchasePrice, renoAmount, afterRepairValue) {
  const totalInvested = purchasePrice + renoAmount;
  const equityGain = afterRepairValue - totalInvested;
  const refinanceAmount = afterRepairValue * 0.80; // 80% LTV
  const cashRecovered = refinanceAmount - totalInvested;
  const cashLeftIn = Math.max(0, totalInvested - refinanceAmount);

  return { totalInvested, equityGain, refinanceAmount, cashRecovered, cashLeftIn };
}

// ─────────────────────────────────────────────
//   FORMATTING HELPERS
// ─────────────────────────────────────────────

export function fmtK(n) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
  return '$' + (n / 1000).toFixed(0) + 'K';
}

export function fmtNum(n) {
  if (n >= 0) return '+$' + n.toLocaleString() + '/mo';
  return '-$' + Math.abs(n).toLocaleString() + '/mo';
}

export function fmtCurrency(n) {
  return '$' + Math.abs(n).toLocaleString();
}
