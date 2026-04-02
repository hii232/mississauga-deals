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
 * Get estimated basement monthly income by tier and property size
 * Based on 2026 Mississauga basement rental market data:
 *   1-bed basement: ~$1,550/mo
 *   2-bed basement: ~$1,800/mo
 *   3-bed basement: ~$2,100/mo
 *
 * Legal suites get full market rate; potential suites get ~85% (discount for uncertainty)
 */
export function getBasementIncome(tier, beds = 3) {
  if (!tier || tier === 'finished') return 0;

  // Estimate basement size from property bedrooms:
  // 1-3 bed property → likely 1-bed basement
  // 4 bed property → likely 2-bed basement
  // 5+ bed property → likely 2-3 bed basement
  let basementRent;
  if (beds <= 3) basementRent = 1550;
  else if (beds === 4) basementRent = 1800;
  else basementRent = 2100;

  if (tier === 'legal') return basementRent;
  if (tier === 'potential') return Math.round(basementRent * 0.85);
  return 0;
}

/**
 * Calculate Hamza's Deal Score (1-10)
 *
 * Calibrated for Mississauga market reality:
 * - Most properties run negative cash flow → baseline score ~5-6
 * - Break-even cash flow is a genuine win → scores 7+
 * - DOM and price drops feed into value score
 * - Suite potential feeds into market score
 *
 * Weights: Cash Flow 35%, Cap Rate 25%, Cash-on-Cash 15%, GRM 10%, Market 15%
 */
export function calculateDealScore({ cashFlow, dom, priceDrop, capRate, cashOnCash, grm, basementTier, hasSuite, transitScore, schoolScore }) {
  // Cash flow (35%): -$2000/mo = 3, -$500/mo = 5.5, $0/mo = 7, +$500/mo = 9, +$1000/mo = 10
  const cfScore = Math.min(10, Math.max(0, 7 + cashFlow / 350));

  // Cap rate (25%): 0% = 3, 2% = 5, 3.5% = 6.5, 5% = 8, 7%+ = 10
  const yieldScore = Math.min(10, 3 + (capRate || 0) * 1.4);

  // Cash-on-Cash (15%): 0% = 3, 2% = 5, 5% = 7, 8% = 9, 10%+ = 10
  const cocScore = Math.min(10, Math.max(0, 3 + (cashOnCash || 0) * 0.8));

  // GRM / Value (10%): lower GRM is better. GRM 20+ = 3, 15 = 5, 12 = 7, 10 = 9, 8 = 10
  // Also adds DOM and price drop bonuses
  const grmBase = grm > 0 ? Math.min(10, Math.max(0, 13 - grm * 0.5)) : 5;
  const domBonus = dom >= 90 ? 1.5 : dom >= 60 ? 1.0 : dom >= 30 ? 0.5 : 0;
  const dropBonus = priceDrop >= 10 ? 1.5 : priceDrop >= 5 ? 1.0 : priceDrop >= 2 ? 0.5 : 0;
  const valueScore = Math.min(10, grmBase + domBonus + dropBonus);

  // Market score (15%): basement + transit + school
  const tier = basementTier || (hasSuite ? 'legal' : null);
  const basementBonus = tier === 'legal' ? 3.0 : tier === 'potential' ? 2.0 : tier === 'finished' ? 0.5 : 0;
  const transitBonus = (transitScore || 0) >= 8 ? 2.0 : (transitScore || 0) >= 6 ? 1.0 : (transitScore || 0) >= 4 ? 0.5 : 0;
  const schoolBonus = (schoolScore || 0) >= 8 ? 1.5 : (schoolScore || 0) >= 6 ? 1.0 : (schoolScore || 0) >= 4 ? 0.5 : 0;
  const marketScore = Math.min(10, 4 + basementBonus + transitBonus + schoolBonus);

  const raw = cfScore * 0.35 + yieldScore * 0.25 + cocScore * 0.15 + valueScore * 0.10 + marketScore * 0.15;
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
