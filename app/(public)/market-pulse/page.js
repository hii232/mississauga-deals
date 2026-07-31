import { MarketPulseClient } from './market-pulse-client';

// /market-pulse was 100% client-rendered: every figure on it (avg DOM,
// sale-to-list, months of inventory, the price-by-type chart, the motivated
// seller radar, mortgage rates) arrived only after a browser fetch of
// /api/market-stats, and until that resolved the page held a skeleton — with
// no inline capture and no sticky CTA on it either. So a crawler saw an h1 and
// a grey box on the site's main market-data page, and a real visitor on a slow
// connection saw the same thing for up to ten seconds before any conversion
// path appeared.
//
// Same shape as /recent-sales, which already solved exactly this: fetch on the
// server with ISR, hand the payload to the client component as initial props,
// and leave the client fetch in place purely as the fallback for a failed or
// timed-out server fetch. Nothing about the numbers or their fallbacks changes.
async function fetchMarketStats() {
  try {
    // Origin WITHOUT request APIs: headers() here would force the page dynamic
    // on every request. VERCEL-gated so local `next start` stays on localhost.
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL ? 'https://www.mississaugainvestor.ca' : 'http://localhost:3000');
    const res = await fetch(`${origin}/api/market-stats`, {
      next: { revalidate: 900 },
      // A cold /api/market-stats recompute can take 60-90s when the upstream
      // feed is slow. Never let that hold a page render: on timeout we fall
      // through to null and the client fetch takes over exactly as before.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Live active-listing counts move daily; the TRREB half is monthly. 15 minutes
// keeps the radar/active tiles fresh without re-hitting the API per request
// (the API is CDN-cached on its own s-maxage anyway).
export const revalidate = 900;

export default async function MarketPulsePage() {
  const initialStats = await fetchMarketStats();
  return <MarketPulseClient initialStats={initialStats} />;
}
