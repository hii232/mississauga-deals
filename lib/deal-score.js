import { LRT_CORRIDOR_HOODS } from './constants';

// Suite detection regex
const SUITE_KEYWORDS = /\b(suite|basement apt|in-law|separate entrance|2nd kitchen|second kitchen|legal basement|finished basement|accessory|duplex|rental income|income potential|two unit|2 unit)\b/i;

/**
 * Calculate Hamza's Deal Score (1-10)
 *
 * Calibrated for Mississauga market reality:
 * - Most properties run negative cash flow → baseline score ~5-6
 * - Break-even cash flow is a genuine win → scores 7+
 * - DOM and price drops are BONUSES, not penalties for fresh listings
 * - Yield (cap rate) and cash flow are the core value drivers
 *
 * Weights: Cash Flow 30%, Yield 25%, Value (base+DOM+drop) 25%, Market 20%
 */
export function calculateDealScore({ cashFlow, dom, priceDrop, capRate, hasSuite }) {
  // Cash flow: -$2000/mo = 3, -$500/mo = 5.5, $0/mo = 7, +$500/mo = 9, +$1000/mo = 10
  const cfScore = Math.min(10, Math.max(0, 7 + cashFlow / 350));

  // Yield: 0% cap = 3, 2% = 5, 3.5% = 6.5, 5% = 8, 6%+ = 10
  const yieldScore = Math.min(10, 3 + capRate * 1.4);

  // Value score: base of 5 + bonuses for DOM and price drops
  // Fresh listings start at 5 (not 0), motivated sellers score higher
  const domBonus = dom >= 90 ? 3.0 : dom >= 60 ? 2.0 : dom >= 30 ? 1.0 : dom >= 14 ? 0.5 : 0;
  const dropBonus = priceDrop >= 10 ? 3.0 : priceDrop >= 5 ? 2.0 : priceDrop >= 2 ? 1.0 : priceDrop > 0 ? 0.5 : 0;
  const valueScore = Math.min(10, 5 + domBonus + dropBonus);

  // Market score: base of 5, suite adds 2.5, LRT potential baked into hood data
  const marketScore = Math.min(10, hasSuite ? 7.5 : 5);

  const raw = cfScore * 0.30 + yieldScore * 0.25 + valueScore * 0.25 + marketScore * 0.20;
  return +Math.min(10, Math.max(1, raw)).toFixed(1);
}

/**
 * Detect if listing likely has a secondary suite
 */
export function detectSuite(remarks) {
  return SUITE_KEYWORDS.test(remarks || '');
}

/**
 * Check if neighbourhood is on LRT corridor
 */
export function isLRTCorridor(neighbourhood) {
  return LRT_CORRIDOR_HOODS.includes(neighbourhood);
}

/**
 * Get score color class
 */
export function scoreColor(score) {
  if (score >= 8) return 'text-success';
  if (score >= 6.5) return 'text-accent';
  if (score >= 5) return 'text-gold';
  return 'text-danger';
}

/**
 * Get score color hex
 */
export function scoreColorHex(score) {
  if (score >= 8) return '#10B981';
  if (score >= 6.5) return '#2563EB';
  if (score >= 5) return '#F59E0B';
  return '#EF4444';
}
