import { ListingsContainer } from '@/components/listings/listings-container';
import { processListings } from '@/lib/listings/process-listings';

export const metadata = {
  title: 'Investment Listings | Mississauga Deals',
  description:
    'Browse scored investment properties in Mississauga. Cash flow analysis, cap rates, and deal scores on every listing.',
};

async function fetchListings() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/listings`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const raw = data.listings || data || [];
    return processListings(raw);
  } catch {
    return [];
  }
}

export default async function ListingsPage() {
  const listings = await fetchListings();

  return (
    <main className="min-h-screen bg-cloud">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy">
            Mississauga Investment Properties
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {listings.length} active listings scored and analyzed
          </p>
        </div>
        <ListingsContainer initialListings={listings} />
      </div>
    </main>
  );
}
