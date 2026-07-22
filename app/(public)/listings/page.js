import { Suspense } from 'react';
import Link from 'next/link';
import { ListingsContainer } from '@/components/listings/listings-container';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

// Title/H1/intro exact-match the high-intent GSC query "investment properties
// for sale mississauga" (pos ~14, real impressions — the money keyword).
export const metadata = {
  title: 'Investment Properties for Sale in Mississauga — 1,800+ Scored for Cash Flow',
  description:
    'Investment properties for sale in Mississauga — browse 1,800+ active listings, each scored for cash flow, cap rate, and ROI, with legal-suite detection and price-drop alerts. Free for investors.',
  alternates: { canonical: '/listings' },
};

// Loads instantly with skeletons, then fetches client-side progressively.
// Page 1 (200 listings) appears in ~1-2s, remaining pages load in background.
export default function ListingsPage() {
  return (
    <main className="min-h-screen bg-cloud">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Investment Properties for Sale', url: 'https://www.mississaugainvestor.ca/listings' },
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy">
            Investment Properties for Sale in Mississauga
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Every active Mississauga listing scored and analyzed for cash flow, cap rate, and ROI.
          </p>
          <p className="mt-1.5 text-sm text-slate-500">
            Deciding on a property type?{' '}
            <Link href="/townhouse-vs-condo-investment" className="font-medium text-accent hover:text-accent-dark no-underline">
              Townhouse or condo — which is the better investment?
            </Link>
          </p>
        </div>
        <Suspense>
          <ListingsContainer
            initialListings={[]}
            apiEndpoint="/api/listings"
          />
        </Suspense>
      </div>
    </main>
  );
}
