import { processListings } from '@/lib/listings/process-listings';

// Fetch minimal listing data for SEO metadata
async function fetchListingData(id) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const res = await fetch(`${baseUrl}/api/listings?limit=200&page=1`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.listings || data || [];
    const totalPages = data.pages || 1;

    let processed = processListings(raw);
    let found = processed.find((l) => String(l.id) === String(id));

    if (!found && totalPages > 1) {
      for (let p = 2; p <= totalPages; p++) {
        const r = await fetch(`${baseUrl}/api/listings?limit=200&page=${p}`, {
          next: { revalidate: 300 },
        });
        if (!r.ok) continue;
        const pg = await r.json();
        if (pg?.listings?.length) {
          const batch = processListings(pg.listings);
          found = batch.find((l) => String(l.id) === String(id));
          if (found) break;
        }
      }
    }

    return found || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const listing = await fetchListingData(params.id);

  if (!listing) {
    return {
      title: 'Property Details',
      description: 'View investment property details, cash flow analysis, and deal score on MississaugaInvestor.ca.',
    };
  }

  const title = `${listing.address} — ${listing.type || 'Property'} in ${listing.city || 'Mississauga'}`;
  const price = listing.price
    ? `$${(listing.price / 1000).toFixed(0)}K`
    : '';
  const beds = listing.beds || 0;
  const baths = listing.baths || 0;
  const description = `${listing.type || 'Property'} for sale at ${listing.address}, ${listing.city || 'Mississauga'}. ${beds} bed, ${baths} bath${price ? ` · Listed at ${price}` : ''}. Cash flow analysis, cap rate, deal score, and investment insights.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.mississaugainvestor.ca/listings/${listing.id}`,
      type: 'article',
      ...(listing.photos?.[0] && {
        images: [
          {
            url: listing.photos[0],
            width: 1200,
            height: 630,
            alt: listing.address,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function ListingDetailLayout({ children }) {
  return children;
}
