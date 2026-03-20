import { ListingsContainer } from '@/components/listings/listings-container';
import { processListings } from '@/lib/listings/process-listings';

export const metadata = {
  title: 'GTA Investment Properties | Toronto, Brampton, Vaughan & More',
  description:
    'Browse scored investment properties across the Greater Toronto Area. Cash flow analysis, cap rates, and deal scores on thousands of listings in Toronto, Brampton, Vaughan, Oakville, Hamilton and more.',
};

async function fetchGtaListings() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const res = await fetch(`${baseUrl}/api/listings-gta?limit=200&page=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const raw = data.listings || data || [];
    const totalPages = data.pages || 1;

    // Fetch remaining pages (cap at 25 pages = 5,000 listings for performance)
    if (totalPages > 1) {
      const maxPages = Math.min(totalPages, 25);
      const pagePromises = [];
      for (let p = 2; p <= maxPages; p++) {
        pagePromises.push(
          fetch(`${baseUrl}/api/listings-gta?limit=200&page=${p}`, {
            next: { revalidate: 3600 },
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

export default async function GtaListingsPage() {
  const listings = await fetchGtaListings();

  return (
    <main className="min-h-screen bg-cloud">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy">
            GTA Investment Properties
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            All active listings across the Greater Toronto Area — scored and analyzed
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Toronto</span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Brampton</span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Vaughan</span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Oakville</span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Hamilton</span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Markham</span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Richmond Hill</span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">+ More</span>
          </div>
        </div>
        <ListingsContainer initialListings={listings} apiEndpoint="/api/listings-gta" />
      </div>
    </main>
  );
}
