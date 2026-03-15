import { LRT_CORRIDOR_HOODS } from './constants';

// Suite detection regex
const SUITE_KEYWORDS = /\b(suite|basement apt|in-law|separate entrance|2nd kitchen|second kitchen|legal basement|finished basement|accessory|duplex|rental income|income potential|two unit|2 unit)\b/i;

/**
 * Calculate Hamza's Deal Score (0-10)
 * Weights: Cash Flow 30%, DOM 25%, Price Drop 20%, Yield 25% + Suite Bonus +1.0
 *
 * Calibrated for Mississauga: break-even cash flow = 7.5 score
 * (Most Mississauga properties run negative — break-even IS a good deal)
 */
export function calculateDealScore({ cashFlow, dom, priceDrop, capRate, hasSuite }) {
  // CF scoring: $0/mo = 7.5, +$500 = 10, -$500 = 5, -$1000 = 2.5
  const cfScore = Math.min(10, Math.max(0, 7.5 + cashFlow / 200));
  const domScore = Math.min(10, dom / 10);
  const dropScore = Math.min(10, priceDrop);
  const yieldScore = Math.min(10, capRate * 2.5);
  const suiteBonus = hasSuite ? 1.0 : 0;

  const raw = cfScore * 0.30 + domScore * 0.25 + dropScore * 0.20 + yieldScore * 0.25 + suiteBonus;
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
  if (score >= 8.5) return 'text-success';
  if (score >= 7) return 'text-accent';
  if (score >= 5.5) return 'text-gold';
  return 'text-danger';
}

/**
 * Get score color hex
 */
export function scoreColorHex(score) {
  if (score >= 8.5) return '#10B981';
  if (score >= 7) return '#2563EB';
  if (score >= 5.5) return '#F59E0B';
  return '#EF4444';
}
