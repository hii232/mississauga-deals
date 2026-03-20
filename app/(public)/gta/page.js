import { ListingsContainer } from '@/components/listings/listings-container';

export const metadata = {
  title: 'GTA Investment Properties | Toronto, Brampton, Vaughan & More',
  description:
    'Browse scored investment properties across the Greater Toronto Area. Cash flow analysis, cap rates, and deal scores on thousands of listings in Toronto, Brampton, Vaughan, Oakville, Hamilton and more.',
};

// GTA page loads instantly with skeletons, then fetches client-side.
// This avoids SSR timeout from querying 30+ cities via AMPRE API.
export default function GtaListingsPage() {
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
        <ListingsContainer
          initialListings={[]}
          apiEndpoint="/api/listings-gta"
          popularHoods={['Toronto', 'Brampton', 'Vaughan', 'Oakville', 'Hamilton', 'Markham', 'Richmond Hill']}
        />
      </div>
    </main>
  );
}
