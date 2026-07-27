import { formatAddress } from '@/lib/utils/format';

// Origin WITHOUT request APIs — headers() in generateMetadata forced the
// entire route dynamic, disabling the ISR page.js declares (see the fuller
// note there). The local-verification trap the old headers() approach dodged
// (`next start` runs with NODE_ENV=production locally, so a NODE_ENV check
// pointed local servers at the live domain) is handled by the VERCEL env var
// instead: set only on the platform, so deployed builds get the public
// domain and local dev AND local `next start` both get localhost.
//
// Never VERCEL_URL either: the *.vercel.app deployment URL sits behind Vercel
// deployment protection, so server-side fetches to it 401.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL ? 'https://www.mississaugainvestor.ca' : 'http://localhost:3000');

// Fetch minimal listing data for SEO metadata — one call via listing-single
async function fetchListingData(id) {
  try {
    const res = await fetch(
      `${SITE_URL}/api/listing-single?id=${encodeURIComponent(id)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.listing || null;
  } catch {
    return null;
  }
}

// First photo for the social share image.
//
// Only used as a FALLBACK now: /api/listing-single carries its photos inline
// (it expands Media in the same request), so the common path costs one upstream
// call instead of two. That matters here specifically — /api/photos is the
// endpoint the backlog flags as intermittently timing out, and it was sitting
// in the metadata path of the site's highest-traffic page type, where a timeout
// means the listing shares with no preview image at all.
async function fetchListingPhoto(id) {
  try {
    const res = await fetch(
      `${SITE_URL}/api/photos?id=${encodeURIComponent(id)}&limit=1`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.photos?.[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const listing = await fetchListingData(params.id);
  const photo = listing?.photos?.[0] || (await fetchListingPhoto(params.id));

  if (!listing) {
    return {
      title: 'Property Details',
      description: 'View investment property details, cash flow analysis, and deal score on MississaugaInvestor.ca.',
      alternates: { canonical: `/listings/${params.id}` },
    };
  }

  const address = formatAddress(listing.address);
  const city = listing.city || 'Mississauga';
  const type = listing.type || 'Property';
  const price = listing.price ? `$${listing.price.toLocaleString()}` : '';
  const beds = listing.beds || 0;
  const baths = listing.baths || 0;
  // Real community from the feed's CityRegion (available 2026-07-27). A title
  // carrying "Port Credit, Mississauga" instead of just "Mississauga" targets
  // the street+neighbourhood queries these pages actually win, and makes
  // ~5,400 titles genuinely distinct. Only rendered when it adds information —
  // the fallback sets neighbourhood = city, and "Mississauga, Mississauga"
  // would read as a bug in the SERP.
  const hood = listing.neighbourhood && listing.neighbourhood !== city ? listing.neighbourhood : null;
  const where = hood ? `${hood}, ${city}` : city;

  const title = `${address}, ${where} — ${type} for Sale${price ? ` ${price}` : ''}`;
  const description = `${type} for sale at ${address}, ${where}. ${beds} bed, ${baths} bath${price ? ` · Listed at ${price}` : ''}. Cash flow analysis, cap rate, deal score, and investment insights by Hamza Nouman.`;

  return {
    title,
    description,
    alternates: { canonical: `/listings/${listing.id}` },
    openGraph: {
      title,
      description,
      url: `https://www.mississaugainvestor.ca/listings/${listing.id}`,
      type: 'article',
      // Prefer the real listing photo; fall back to the branded OG card so a
      // listing whose photo fetch fails (the /api/photos endpoint occasionally
      // times out) never shares with a blank preview — realtors share these
      // links constantly.
      images: photo
        ? [{ url: photo, width: 1200, height: 630, alt: address }]
        : ['/opengraph-image'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: photo ? [photo] : ['/opengraph-image'],
    },
  };
}

export default function ListingDetailLayout({ children }) {
  return children;
}
