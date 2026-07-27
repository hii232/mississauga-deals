import { headers } from 'next/headers';
import { PLATFORM_STATS } from '../constants';

/**
 * Rounded-down "X+" (or exact, for small counts) — the one formatting rule
 * every live count claim on the site uses, so a total is never overstated
 * and every page that shows one agrees with every other page.
 */
export function formatLiveCount(total) {
  if (!total || total <= 0) return null;
  return total >= 500
    ? `${(Math.floor(total / 100) * 100).toLocaleString()}+`
    : total.toLocaleString();
}

/**
 * Live "properties analyzed" count, shared by every page that claims a
 * platform-scale number (homepage bio, /about, /sell). Previously each page
 * carried its own static guess ("2,000+" on the homepage vs "1,800+" on
 * /about) or read PLATFORM_STATS.propertiesAnalyzed — a hand-set constant
 * with no live backing, which drifted BELOW the real live count once the
 * feed's actual size was fixed (a visitor could see "1,800+ Properties
 * Analyzed" in the bio directly above a live "2,500+" hero figure on the
 * same page). This fetches the real total the engine is scoring right now
 * and formats it the same way the homepage hero always has (rounded down to
 * the nearest hundred so it never overstates); PLATFORM_STATS.propertiesAnalyzed
 * remains the fallback for an env-less build or a feed outage, so this still
 * degrades gracefully rather than failing to render.
 */
export async function fetchPropertiesAnalyzedCount() {
  try {
    const h = await headers();
    const host = h.get('host') || 'www.mississaugainvestor.ca';
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
    const proto = isLocal ? 'http' : 'https';
    const res = await fetch(`${proto}://${host}/api/listings?limit=200&page=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return PLATFORM_STATS.propertiesAnalyzed;
    const data = await res.json();
    return formatLiveCount(Number(data.total)) || PLATFORM_STATS.propertiesAnalyzed;
  } catch {
    return PLATFORM_STATS.propertiesAnalyzed;
  }
}
