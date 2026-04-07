import { LRT_CORRIDOR_HOODS } from './constants';

// Tiered basement detection keywords — strict: only explicitly "legal" language triggers LEGAL SUITE
const LEGAL_SUITE_KEYWORDS = /\b(legal basement|legal suite|legal apartment|registered suite|registered basement|legal secondary suite|legal bsmt)\b/i;
const SEPARATE_ENTRANCE_KEYWORDS = /\b(separate entrance|side entrance|private entrance|own entrance|sep entrance|sep\.? ent|in-law suite|in-law unit|accessory unit|accessory apartment|basement apt|basement apartment|income suite|2nd kitchen|second kitchen)\b/i;
const FINISHED_BASEMENT_KEYWORDS = /\b(finished basement|fin\.? bsmt|fully finished basement|professionally finished basement|rental income|income potential)\b/i;

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
 * Parse bedroom split from listing remarks.
 * Returns { mainBeds, basementBeds } or null if no split detected.
 *
 * Patterns: "3+2 bedroom", "4+1 bed", "3 + 2 bdrm", etc.
 */
export function parseBedroomSplit(remarks, totalBeds) {
  const text = (remarks || '').toLowerCase();

  // Match patterns like "3+2", "4 + 1", "3+2 bedroom"
  const splitMatch = text.match(/(\d)\s*\+\s*(\d)\s*(?:bed|bdrm|br|bedroom)/i);
  if (splitMatch) {
    const main = parseInt(splitMatch[1]);
    const basement = parseInt(splitMatch[2]);
    if (main + basement <= totalBeds + 1 && main >= 1 && basement >= 1) {
      return { mainBeds: main, basementBeds: basement };
    }
  }

  // If no explicit split found, estimate from total beds
  // A typical suite property: main unit gets most beds, basement gets 1-2
  if (totalBeds >= 5) return { mainBeds: totalBeds - 2, basementBeds: 2 };
  if (totalBeds >= 4) return { mainBeds: totalBeds - 1, basementBeds: 1 };
  if (totalBeds >= 3) return { mainBeds: totalBeds - 1, basementBeds: 1 };
  return { mainBeds: Math.max(1, totalBeds - 1), basementBeds: 1 };
}

/**
 * Detect number of units from property type/subtype ONLY.
 * For multiplex, uses bathroom count to estimate units (each unit needs ≥1 bath).
 *
 * Returns: { units: number, type: 'duplex'|'triplex'|'fourplex'|'multiplex'|null }
 */
export function detectMultiUnit(propType, baths) {
  const type = (propType || '').toLowerCase();

  if (/fourplex|four-plex|quadruplex|4-plex|4 plex/i.test(type)) return { units: 4, type: 'fourplex' };
  if (/triplex|tri-plex|3-plex|3 plex/i.test(type)) return { units: 3, type: 'triplex' };
  if (/duplex|du-plex/i.test(type)) return { units: 2, type: 'duplex' };
  if (/multiplex|multi-plex|multi family|multifamily/i.test(type)) {
    // Use bathroom count as proxy for unit count (each unit needs ≥1 bath)
    // Cap at 6 units max, minimum 3 for multiplex
    const estimatedUnits = Math.max(3, Math.min(6, baths || 3));
    return { units: estimatedUnits, type: 'multiplex' };
  }

  return { units: 1, type: null };
}

/**
 * Per-unit rent lookup by bedroom count.
 * Conservative GTA-wide BASELINE rates for rental units (not whole houses).
 * These get adjusted by city tier in estimateMultiUnitRent().
 *
 * 2026 GTA rental market data:
 *   Bachelor/0-bed: $1,600-1,800
 *   1-bed: $1,800-2,100
 *   2-bed: $2,200-2,500
 *   3-bed: $2,600-3,000
 *   4-bed: $3,000-3,500
 */
const UNIT_RENTS_BASE = { 0: 1650, 1: 1900, 2: 2350, 3: 2800, 4: 3200, 5: 3600 };

/**
 * City-level rent adjustment for multi-unit properties.
 * 1.0 = GTA average. Higher = more expensive rental market.
 */
const MULTI_UNIT_CITY_TIER = {
  'Toronto': 1.05, 'Oakville': 1.05, 'Burlington': 1.0,
  'Richmond Hill': 1.0, 'Markham': 1.0, 'Vaughan': 1.0,
  'Mississauga': 1.0, 'Port Credit': 1.05,
  'Aurora': 0.95, 'Newmarket': 0.90, 'Whitby': 0.90, 'Ajax': 0.90,
  'Pickering': 0.95, 'Milton': 0.90, 'Hamilton': 0.80, 'Oshawa': 0.75,
  'Barrie': 0.80, 'Brampton': 0.85, 'Caledon': 0.90,
  'Halton Hills': 0.90, 'Georgetown': 0.90,
};

/**
 * Estimate total rent for a multi-unit property.
 * Splits total beds across units, estimates each unit's rent with city adjustment.
 *
 * Returns { totalRent, units: [{ beds, rent }] }
 */
export function estimateMultiUnitRent(unitCount, totalBeds, propType, city) {
  const tier = MULTI_UNIT_CITY_TIER[city] || 0.90;

  // Distribute beds across units
  const bedsPerUnit = [];
  let remaining = totalBeds;
  for (let i = 0; i < unitCount; i++) {
    if (i < unitCount - 1) {
      const share = Math.ceil(remaining / (unitCount - i));
      bedsPerUnit.push(share);
      remaining -= share;
    } else {
      bedsPerUnit.push(Math.max(0, remaining));
    }
  }

  bedsPerUnit.sort((a, b) => b - a);

  const units = bedsPerUnit.map(beds => {
    const baseRent = UNIT_RENTS_BASE[Math.min(beds, 5)] || 1900;
    const rent = Math.round((baseRent * tier) / 50) * 50;
    return { beds, rent };
  });

  const totalRent = units.reduce((sum, u) => sum + u.rent, 0);
  return { totalRent, units };
}

/**
 * Get estimated basement monthly rent by actual basement bedroom count.
 * Based on 2026 Mississauga basement rental market data:
 *   Bachelor/1-bed basement: ~$1,400/mo
 *   2-bed basement: ~$1,700/mo
 *   3-bed basement: ~$2,000/mo
 *
 * Legal suites get full market rate; potential suites get ~85% (discount for uncertainty)
 */
export function getBasementIncome(tier, basementBeds = 1) {
  if (!tier || tier === 'finished') return 0;

  // Use actual basement bed count (not total property beds)
  let basementRent;
  if (basementBeds <= 1) basementRent = 1400;
  else if (basementBeds === 2) basementRent = 1700;
  else basementRent = 2000;

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
