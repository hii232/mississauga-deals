import { PLATFORM_STATS } from '../constants';

/**
 * ONE canonical "how many listings do we cover" number, for every page that
 * makes that claim (homepage hero + bio, /about, /sell).
 *
 * WHY THIS IS CENTRALISED: these pages used to disagree with each other AND
 * with themselves. The homepage hero said "2,500+" directly above a stats bar
 * that said "2,547" — which looked like two different facts but was the SAME
 * underlying count, one rounded and one exact. /about and /sell separately
 * carried a hand-set "1,800+". A visitor comparing any two of those pages
 * caught us contradicting ourselves about our own scale.
 *
 * The canonical source is /api/market-stats `activeCount`: it pages through the
 * entire feed and counts the rows that survive the commercial/lease filter, so
 * it is the number of listings a visitor can genuinely browse. Deliberately NOT
 * /api/listings `total` — that is AMPRE's raw @odata.count taken BEFORE the
 * filter, so it runs ~60 listings higher and would put us right back to two
 * numbers for one thing.
 *
 * Rendered EXACTLY, with no "+" rounding. A precise figure from a live feed is
 * more credible than a rounded one, and rounding is what made two identical
 * counts look like a contradiction in the first place.
 */
export function formatLiveCount(total) {
  const n = Number(total);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toLocaleString();
}

export async function fetchPropertiesAnalyzedCount() {
  try {
    // Origin WITHOUT request APIs: the old headers() call here dragged every
    // importer (/about, /sell, the auth layout) into per-request dynamic
    // rendering just to display a cached count. VERCEL-gated so local
    // `next start` cannot point at the live domain.
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL ? 'https://www.mississaugainvestor.ca' : 'http://localhost:3000');
    // revalidate 300 to MATCH the homepage's fetchLiveStats read of the same
    // URL — same URL + same window shares one cache entry, so every page
    // quotes the identical number in the same crawl instead of each surface
    // sampling its own cache moment.
    const res = await fetch(`${origin}/api/market-stats`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return PLATFORM_STATS.propertiesAnalyzed;
    const data = await res.json();
    return formatLiveCount(data.activeCount) || PLATFORM_STATS.propertiesAnalyzed;
  } catch {
    // Env-less build or feed outage — the hand-set constant is the only honest
    // remaining option, and it is deliberately conservative.
    return PLATFORM_STATS.propertiesAnalyzed;
  }
}
