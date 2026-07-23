import { NextResponse } from 'next/server';
import { processListings } from '@/lib/listings/process-listings';
import { computeHoodStats } from '@/lib/listings/hood-stats';

// Public site URL — never build the internal fetch from request.url (on Vercel
// that resolves to the deployment-protected *.vercel.app host, an HTML auth wall).
const SITE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://www.mississaugainvestor.ca';

// Refresh at most every 10 minutes — this powers the neighbourhood cards' live
// avg price / DOM / yield.
export const revalidate = 600;

/**
 * GET /api/neighbourhood-stats
 * Live per-neighbourhood aggregates (avg price, DOM, yield) from active listings.
 * Returns { stats: { [hood]: { avgPrice, avgDOM, rentYield, count } } }.
 * Degrades to an empty object so callers fall back to curated values.
 */
export async function GET() {
  try {
    const res = await fetch(`${SITE_URL}/api/listings?limit=200&page=1`, { next: { revalidate } });
    if (!res.ok) return NextResponse.json({ stats: {} });
    const ctype = res.headers.get('content-type') || '';
    if (!ctype.includes('application/json')) return NextResponse.json({ stats: {} });
    const data = await res.json();

    const raw = [...(data.listings || data || [])];
    const totalPages = Math.min(data.pages || 1, 15);
    if (totalPages > 1) {
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, k) => k + 2).map((p) =>
          fetch(`${SITE_URL}/api/listings?limit=200&page=${p}`, { next: { revalidate } })
            .then((r) => (r.ok ? r.json() : { listings: [] }))
            .catch(() => ({ listings: [] }))
        )
      );
      rest.forEach((d) => raw.push(...(d.listings || [])));
    }

    return NextResponse.json({ stats: computeHoodStats(processListings(raw)) });
  } catch {
    return NextResponse.json({ stats: {} });
  }
}
