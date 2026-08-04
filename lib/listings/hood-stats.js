import { HOOD_DATA } from '@/lib/constants';

/**
 * Live per-neighbourhood aggregates from processed listings.
 * Avg price and DOM are pure live stats; rent yield uses the site's estimated
 * rent over the live average price. Only hoods with a meaningful sample
 * (>= MIN_SAMPLE active listings) get live numbers - thinner ones are omitted
 * so callers fall back to the curated HOOD_DATA values.
 */
export const HOOD_STATS_MIN_SAMPLE = 4;

export function computeHoodStats(processed) {
  const groups = {};
  for (const l of processed || []) {
    const n = l.neighbourhood;
    if (!n || !HOOD_DATA[n]) continue;
    if (!Number.isFinite(l.price) || l.price <= 0) continue;
    (groups[n] ||= []).push(l);
  }
  const stats = {};
  for (const [n, arr] of Object.entries(groups)) {
    if (arr.length < HOOD_STATS_MIN_SAMPLE) continue;
    const avgPrice = Math.round(arr.reduce((s, l) => s + l.price, 0) / arr.length);
    // dom 0 means UNKNOWN, not "listed today" (lib/listings/market-timing.js).
    // Accepting 0 as a value averaged a neighbourhood of unknowns down toward
    // zero and published it as that hood's real days-on-market; excluding them
    // yields null instead, and every consumer falls back to the curated
    // HOOD_DATA figure or renders a dash.
    const domVals = arr.filter((l) => Number.isFinite(l.dom) && l.dom > 0);
    // >=5 real values or nothing: with the feed withholding DOM on active
    // listings, an "average" over 1-2 stragglers published a single listing's
    // number as the neighbourhood's - consumers fall back to curated data,
    // which is labelled as such.
    const avgDOM = domVals.length >= 5 ? Math.round(domVals.reduce((s, l) => s + l.dom, 0) / domVals.length) : null;
    const rentVals = arr.filter((l) => Number.isFinite(l.estimatedRent) && l.estimatedRent > 0);
    const avgRent = rentVals.length ? rentVals.reduce((s, l) => s + l.estimatedRent, 0) / rentVals.length : null;
    const rentYield = avgRent && avgPrice > 0 ? +((avgRent * 12) / avgPrice * 100).toFixed(1) : null;
    stats[n] = { avgPrice, avgDOM, rentYield, count: arr.length };
  }
  return stats;
}
