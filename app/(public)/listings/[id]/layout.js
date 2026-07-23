import { formatAddress } from '@/lib/utils/format';

// Public site URL — never use VERCEL_URL here: the *.vercel.app deployment URL
// is behind Vercel deployment protection, so server-side fetches to it 401 and
// every listing page falls back to generic metadata.
const SITE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://www.mississaugainvestor.ca';

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

// First photo for the social share image
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
  const [listing, photo] = await Promise.all([
    fetchListingData(params.id),
    fetchListingPhoto(params.id),
  ]);

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

  const title = `${address}, ${city} — ${type} for Sale${price ? ` ${price}` : ''}`;
  const description = `${type} for sale at ${address}, ${city}. ${beds} bed, ${baths} bath${price ? ` · Listed at ${price}` : ''}. Cash flow analysis, cap rate, deal score, and investment insights by Hamza Nouman.`;

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
