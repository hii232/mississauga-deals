import { processListings } from '@/lib/listings/process-listings';
import PropertyDetailClient from './listing-detail-client';

// SERVER-RENDERED property page.
//
// Every one of the ~2,500 listing pages used to ship as an empty shell: the
// layout produced correct <title>, OG tags and JSON-LD, but the body was a
// client component that fetched its own data in a useEffect, so the HTML a
// crawler received contained no address, no price, no specs and no analysis.
// The pages that win address queries were invisible for everything else.
//
// The client component is unchanged in behaviour — it just receives the
// listing as a prop now. Client components still server-render their markup;
// the empty shell was caused by fetching data after mount, not by the
// 'use client' boundary itself.
//
// ISR keeps a crawler off the MLS feed on every hit while staying fresh enough
// for price changes; a failed fetch passes null and the component falls back to
// its own fetch, so a feed hiccup degrades to the previous behaviour.
export const revalidate = 900;

// Origin WITHOUT request APIs: calling headers() here forced the whole route
// dynamic, which silently disabled the `revalidate` above — the ISR this
// file's own comment describes was never actually on, and every hit across
// ~5,400 listing pages paid a full server render (the same headers()-kills-ISR
// bug measured at 56s TTFB on the homepage). The old headers() approach
// existed to dodge a real trap — NODE_ENV=production under local `next
// start` would point a local server at the live domain — so the check is the
// VERCEL env var instead, which is only set on the platform: deployed builds
// get the public domain, local dev AND local `next start` both get localhost.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL ? 'https://www.mississaugainvestor.ca' : 'http://localhost:3000');

async function fetchListing(id) {
  try {
    const res = await fetch(`${SITE_URL}/api/listing-single?id=${encodeURIComponent(id)}`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.listing;
    if (!raw) return null;
    // Run it through the SAME pipeline the cards and the client component use,
    // so the server-rendered numbers are identical to the hydrated ones — a
    // mismatch here would show a visitor one cap rate and then swap it.
    const [processed] = processListings([raw]);
    return processed || null;
  } catch {
    return null;
  }
}

export default async function PropertyDetailPage({ params }) {
  const listing = await fetchListing(params.id);
  return <PropertyDetailClient initialListing={listing} />;
}
