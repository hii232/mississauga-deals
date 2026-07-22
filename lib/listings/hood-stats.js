import { HOOD_DATA } from '@/lib/constants';

/**
 * Live per-neighbourhood aggregates from processed listings.
 * Avg price and DOM are pure live stats; rent yield uses the site's estimated
 * rent over the live average price. Only hoods with a meaningful sample
 * (>= MIN_SAMPLE active listings) get live numbers — thinner ones are omitted
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
    const domVals = arr.filter((l) => Number.isFinite(l.dom));
    const avgDOM = domVals.length ? Math.round(domVals.reduce((s, l) => s + l.dom, 0) / domVals.length) : null;
    const rentVals = arr.filter((l) => Number.isFinite(l.estimatedRent) && l.estimatedRent > 0);
    const avgRent = rentVals.length ? rentVals.reduce((s, l) => s + l.estimatedRent, 0) / rentVals.length : null;
    const rentYield = avgRent && avgPrice > 0 ? +((avgRent * 12) / avgPrice * 100).toFixed(1) : null;
    stats[n] = { avgPrice, avgDOM, rentYield, count: arr.length };
  }
  return stats;
}
