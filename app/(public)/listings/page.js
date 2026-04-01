import { ListingsContainer } from '@/components/listings/listings-container';

export const metadata = {
  title: 'Mississauga Investment Properties — 1,800+ Listings Scored for Cash Flow | MississaugaInvestor.ca',
  description:
    'Browse 1,800+ scored investment properties in Mississauga. Cash flow analysis, cap rates, deal scores, legal suite detection, and price drop alerts on every listing. Free for investors.',
  alternates: { canonical: '/listings' },
};

// Loads instantly with skeletons, then fetches client-side progressively.
// Page 1 (200 listings) appears in ~1-2s, remaining pages load in background.
export default function ListingsPage() {
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
        <ListingsContainer
          initialListings={[]}
          apiEndpoint="/api/listings"
        />
      </div>
    </main>
  );
}
