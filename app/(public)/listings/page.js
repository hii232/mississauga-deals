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

    // Fetch first page to get total count
    const res = await fetch(`${baseUrl}/api/listings?limit=200&page=1`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const raw = data.listings || data || [];
    const totalPages = data.pages || 1;

    // Fetch remaining pages if any
    if (totalPages > 1) {
      const pagePromises = [];
      for (let p = 2; p <= totalPages; p++) {
        pagePromises.push(
          fetch(`${baseUrl}/api/listings?limit=200&page=${p}`, {
            next: { revalidate: 300 },
          }).then((r) => r.ok ? r.json() : null)
        );
      }
      const pages = await Promise.all(pagePromises);
      for (const pg of pages) {
        if (pg?.listings) raw.push(...pg.listings);
      }
    }

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
            All active listings scored and analyzed
          </p>
        </div>
        <ListingsContainer initialListings={listings} />
      </div>
    </main>
  );
}
