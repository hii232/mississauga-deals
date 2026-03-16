import { LRT_CORRIDOR_HOODS } from './constants';

// Tiered basement detection keywords — strict: only explicitly "legal" language triggers LEGAL SUITE
const LEGAL_SUITE_KEYWORDS = /\b(legal basement|legal suite|legal apartment|registered suite|registered basement|legal secondary suite|legal bsmt)\b/i;
const SEPARATE_ENTRANCE_KEYWORDS = /\b(separate entrance|side entrance|private entrance|own entrance|sep entrance|sep\.? ent|in-law suite|in-law unit|accessory unit|accessory apartment|basement apt|basement apartment|income suite|2nd kitchen|second kitchen)\b/i;
const FINISHED_BASEMENT_KEYWORDS = /\b(finished basement|fin\.? bsmt|fully finished basement|professionally finished basement|rental income|income potential|duplex|two unit|2 unit)\b/i;

/**
 * Detect basement tier from listing remarks
 * Returns: "legal" | "potential" | "finished" | null
 *
 * - legal: confirmed legal suite (dual-income property)
 * - potential: separate entrance present (likely convertible to suite)
 * - finished: finished basement only (nice feature, not rentable as-is)
 */
export function detectBasementTier(remarks) {
  const text = (remarks || '').toLowerCase();
  if (LEGAL_SUITE_KEYWORDS.test(text)) return 'legal';
  if (SEPARATE_ENTRANCE_KEYWORDS.test(text)) return 'potential';
  if (FINISHED_BASEMENT_KEYWORDS.test(text)) return 'finished';
  return null;
}

/**
 * Backward-compatible: returns true if any basement tier detected
 */
export function detectSuite(remarks) {
  return detectBasementTier(remarks) !== null;
}

/**
 * Get estimated basement monthly income by tier
 */
export function getBasementIncome(tier) {
  if (tier === 'legal') return 1200;
  if (tier === 'potential') return 900;
  return 0;
}

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
export function calculateDealScore({ cashFlow, dom, priceDrop, capRate, basementTier, hasSuite }) {
  // Cash flow: -$2000/mo = 3, -$500/mo = 5.5, $0/mo = 7, +$500/mo = 9, +$1000/mo = 10
  const cfScore = Math.min(10, Math.max(0, 7 + cashFlow / 350));

  // Yield: 0% cap = 3, 2% = 5, 3.5% = 6.5, 5% = 8, 6%+ = 10
  const yieldScore = Math.min(10, 3 + capRate * 1.4);

  // Value score: base of 5 + bonuses for DOM and price drops
  // Fresh listings start at 5 (not 0), motivated sellers score higher
  const domBonus = dom >= 90 ? 3.0 : dom >= 60 ? 2.0 : dom >= 30 ? 1.0 : dom >= 14 ? 0.5 : 0;
  const dropBonus = priceDrop >= 10 ? 3.0 : priceDrop >= 5 ? 2.0 : priceDrop >= 2 ? 1.0 : priceDrop > 0 ? 0.5 : 0;
  const valueScore = Math.min(10, 5 + domBonus + dropBonus);

  // Market score: tiered by basement detection
  // legal: +3.0, potential: +2.0, finished: +0.5, none: +0
  const tier = basementTier || (hasSuite ? 'legal' : null); // backward compat
  const basementBonus = tier === 'legal' ? 3.0 : tier === 'potential' ? 2.0 : tier === 'finished' ? 0.5 : 0;
  const marketScore = Math.min(10, 5 + basementBonus);

  const raw = cfScore * 0.30 + yieldScore * 0.25 + valueScore * 0.25 + marketScore * 0.20;
  return +Math.min(10, Math.max(1, raw)).toFixed(1);
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
