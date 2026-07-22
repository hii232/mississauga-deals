import { HOOD_RENTS, getTaxRate } from './constants';

// ─────────────────────────────────────────────
//   CASH FLOW CALCULATION ENGINE (V2)
//   Canadian semi-annual compounding for fixed-rate mortgages
// ─────────────────────────────────────────────

/**
 * Calculate monthly mortgage payment using CANADIAN semi-annual compounding.
 * Canadian fixed-rate mortgages compound semi-annually, NOT monthly like US mortgages.
 */
export function calcMonthly(price, downPct = 20, rate = 4.89, years = 25) {
  const principal = price * (1 - downPct / 100);
  if (rate === 0) return Math.round(principal / (years * 12));

  // Canadian semi-annual compounding
  const semiAnnualRate = rate / 100 / 2;
  const effectiveMonthlyRate = Math.pow(1 + semiAnnualRate, 1 / 6) - 1;
  const n = years * 12;

  return Math.round(
    principal * (effectiveMonthlyRate * Math.pow(1 + effectiveMonthlyRate, n)) /
      (Math.pow(1 + effectiveMonthlyRate, n) - 1)
  );
}

/**
 * First-month interest / principal split of the mortgage payment. The principal
 * portion is the equity you build that month (money you keep); it grows over the
 * amortization as the balance falls, so this is the conservative year-one
 * figure. Uses the same Canadian semi-annual compounding as calcMonthly.
 */
export function mortgageSplit(price, downPct = 20, rate = 4.89, years = 25) {
  const balance = price * (1 - downPct / 100);
  const payment = calcMonthly(price, downPct, rate, years);
  if (rate === 0) return { payment, interest: 0, principal: payment };
  const effectiveMonthlyRate = Math.pow(1 + rate / 100 / 2, 1 / 6) - 1;
  const interest = Math.round(balance * effectiveMonthlyRate);
  return { payment, interest, principal: Math.max(0, payment - interest) };
}

/**
 * Estimate monthly rent based on price, beds, city, type, and neighbourhood.
 * TIER 3 fallback — uses conservative GTA price-to-rent ratios by property type.
 */
export function estimateRent(price, beds, city, type, neighbourhood) {
  const hoodRents = HOOD_RENTS[neighbourhood] || HOOD_RENTS[city];
  if (hoodRents) {
    let hoodRent = hoodRents[Math.min(beds || 0, 5)];
    let adj = type === 'Detached' ? 250 : type === 'Condo' ? -150 : 0;
    if (['Duplex', 'Triplex', 'Fourplex', 'Multiplex'].includes(type)) adj += 800;
    return Math.round((hoodRent + adj) / 50) * 50;
  }

  // TIER 3 fallback: conservative price-to-rent ratios for GTA
  const typeLower = (type || '').toLowerCase();
  let ratio;
  if (/condo|apartment/i.test(typeLower)) ratio = 0.0038;
  else if (/town/i.test(typeLower)) ratio = 0.0035;
  else if (/semi/i.test(typeLower)) ratio = 0.0034;
  else ratio = 0.0032; // Detached and other

  return Math.round(((price || 0) * ratio) / 50) * 50;
}

/**
 * Shared property assumptions — single source of truth for all calculations
 */
export const DEFAULT_ASSUMPTIONS = {
  downPaymentPercent: 20,
  annualInterestRate: 4.89,
  amortizationYears: 25,
  monthlyInsurance: 225,
  maintenancePercent: 8,
  vacancyPercent: 5,
  managementPercent: 0,
};

/**
 * Calculate full cash flow breakdown with itemized expenses.
 * No blanket percentages — every expense is explicit.
 */
export function calculateCashFlow(price, rent, {
  downPct = 20,
  rate = 4.89,
  amortYears = 25,
  annualPropertyTax = null,
  city = null,
  monthlyInsurance = 225,
  maintenancePct = 8,
  vacancyPct = 5,
  managementPct = 0,
  monthlyCondoFee = 0,
} = {}) {
  const mortgage = calcMonthly(price, downPct, rate, amortYears);
  const propTax = annualPropertyTax
    ? Math.round(annualPropertyTax / 12)
    : Math.round((price * getTaxRate(city)) / 12);
  const insurance = monthlyInsurance;
  const condoFee = Math.round(monthlyCondoFee) > 0 ? Math.round(monthlyCondoFee) : 0;
  // Condo fees already cover building maintenance, so a condo doesn't also carry
  // a rent-based maintenance reserve — matches the listings engine and avoids
  // double-counting. Freehold: greater of % of rent OR 1% of property value/yr.
  const maintenance = condoFee > 0
    ? 0
    : Math.max(Math.round(rent * (maintenancePct / 100)), Math.round((price * 0.01) / 12));
  const vacancy = Math.round(rent * (vacancyPct / 100));
  const management = Math.round(rent * (managementPct / 100));
  const totalExpenses = mortgage + propTax + insurance + maintenance + vacancy + management + condoFee;
  const cashFlow = rent - totalExpenses;

  return {
    mortgage, propTax, insurance, maintenance, vacancy, management, condoFee,
    totalExpenses, cashFlow,
    annualPropertyTax: annualPropertyTax || Math.round(price * getTaxRate(city)),
  };
}

/**
 * Break-even rent — the gross monthly rent at which cash flow is exactly zero
 * (rent covers the mortgage plus every operating cost). Solved numerically
 * against calculateCashFlow with the SAME options, so it can never diverge from
 * the cash-flow figure shown alongside it. cashFlow rises monotonically with
 * rent, so a binary search converges. Returns null if the options are unusable.
 */
export function breakEvenRent(price, opts = {}) {
  if (!(price > 0)) return null;
  let lo = 0;
  let hi = 100000; // generous monthly-rent upper bound
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const cf = calculateCashFlow(price, mid, opts).cashFlow;
    if (cf < 0) lo = mid;
    else hi = mid;
  }
  return Math.round(hi);
}

/**
 * Calculate Net Operating Income — NEVER includes mortgage.
 * Uses the same itemized expenses from shared assumptions.
 */
export function calculateNOI(rent, {
  annualPropertyTax = 0,
  monthlyInsurance = 225,
  maintenancePct = 8,
  vacancyPct = 5,
  managementPct = 0,
  monthlyCondoFee = 0,
} = {}) {
  const annualGrossRent = rent * 12;
  const annualVacancyLoss = annualGrossRent * (vacancyPct / 100);
  const effectiveGrossIncome = annualGrossRent - annualVacancyLoss;

  const annualOpExPropertyTax = annualPropertyTax;
  const annualOpExInsurance = monthlyInsurance * 12;
  // Condo fees already cover building maintenance, so a condo doesn't also carry
  // a rent-based maintenance reserve — matches calculateCashFlow and the listings
  // engine, and avoids double-counting upkeep in NOI / cap rate.
  const annualOpExMaintenance = monthlyCondoFee > 0 ? 0 : annualGrossRent * (maintenancePct / 100);
  const annualOpExManagement = annualGrossRent * (managementPct / 100);
  const annualOpExCondoFee = monthlyCondoFee * 12;

  const totalAnnualOperatingExpenses = annualOpExPropertyTax + annualOpExInsurance + annualOpExMaintenance + annualOpExManagement + annualOpExCondoFee;
  const noi = effectiveGrossIncome - totalAnnualOperatingExpenses;

  return {
    annualGrossRent,
    annualVacancyLoss,
    effectiveGrossIncome,
    annualOpExPropertyTax,
    annualOpExInsurance,
    annualOpExMaintenance,
    annualOpExManagement,
    annualOpExCondoFee,
    totalAnnualOperatingExpenses,
    noi,
  };
}

/**
 * Calculate Cap Rate
 */
export function calculateCapRate(noi, price) {
  if (price <= 0) return 0;
  return +((noi / price) * 100).toFixed(2);
}

/**
 * Calculate Ontario Land Transfer Tax
 */
export function calculateOntarioLTT(purchasePrice) {
  let ltt = 0;
  if (purchasePrice > 2000000) {
    ltt += (purchasePrice - 2000000) * 0.025;
    ltt += (2000000 - 400000) * 0.02;
    ltt += (400000 - 250000) * 0.015;
    ltt += (250000 - 55000) * 0.01;
    ltt += 55000 * 0.005;
  } else if (purchasePrice > 400000) {
    ltt += (purchasePrice - 400000) * 0.02;
    ltt += (400000 - 250000) * 0.015;
    ltt += (250000 - 55000) * 0.01;
    ltt += 55000 * 0.005;
  } else if (purchasePrice > 250000) {
    ltt += (purchasePrice - 250000) * 0.015;
    ltt += (250000 - 55000) * 0.01;
    ltt += 55000 * 0.005;
  } else if (purchasePrice > 55000) {
    ltt += (purchasePrice - 55000) * 0.01;
    ltt += 55000 * 0.005;
  } else {
    ltt += purchasePrice * 0.005;
  }
  return Math.round(ltt);
}

/**
 * Calculate Cash-on-Cash Return with proper closing costs
 */
export function calculateCashOnCash(annualCashFlow, price, downPct = 20) {
  const downPayment = price * (downPct / 100);
  const ltt = calculateOntarioLTT(price);
  const closingCosts = ltt + 3000; // LTT + legal/title/misc
  const totalCashInvested = downPayment + closingCosts;
  if (totalCashInvested <= 0) return 0;
  return +((annualCashFlow / totalCashInvested) * 100).toFixed(2);
}

/**
 * Get full closing costs breakdown
 */
export function getClosingCosts(price, downPct = 20) {
  const downPayment = price * (downPct / 100);
  const ltt = calculateOntarioLTT(price);
  const legalAndTitle = 2500;
  const inspectionMisc = 500;
  const closingCosts = ltt + legalAndTitle + inspectionMisc;
  const totalCashRequired = downPayment + closingCosts;

  return {
    downPayment,
    ltt,
    legalAndTitle,
    inspectionMisc,
    closingCosts,
    totalCashRequired,
  };
}

/**
 * Calculate BRRR metrics
 */
export function calculateBRRR(purchasePrice, renoAmount, afterRepairValue, refinanceLTV = 80) {
  const totalInvested = purchasePrice + renoAmount;
  const refinanceAmount = Math.round(afterRepairValue * (refinanceLTV / 100));
  const equityCreated = afterRepairValue - totalInvested;
  const cashLeftInDeal = Math.max(0, totalInvested - refinanceAmount);
  const cashRecovered = Math.max(0, refinanceAmount - totalInvested);

  return { totalInvested, equityCreated, refinanceAmount, cashLeftInDeal, cashRecovered };
}

/**
 * Calculate Gross Rent Multiplier
 */
export function calculateGRM(price, monthlyRent) {
  const annualRent = monthlyRent * 12;
  if (annualRent <= 0) return 0;
  return +(price / annualRent).toFixed(1);
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
