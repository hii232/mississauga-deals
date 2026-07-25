import { RecentSalesClient } from './recent-sales-client';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import InlineCTA from '@/components/ui/inline-cta';

const YEAR = new Date().getFullYear();

export const metadata = {
  title: `Mississauga Sold Prices ${YEAR} — Recent Home Sales & Sold Data`,
  description:
    `See what homes actually sold for in Mississauga in ${YEAR}: real sold prices, days on market, and list-vs-sold negotiation gaps, updated from MLS data. Know the real market before you offer.`,
  alternates: { canonical: '/recent-sales' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: `Mississauga Sold Prices ${YEAR} — Recent Home Sales`,
    description:
      'Real sold prices, days on market, and negotiation gaps for Mississauga homes, updated from MLS data.',
    url: 'https://www.mississaugainvestor.ca/recent-sales',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Mississauga Sold Prices ${YEAR} — Recent Home Sales`,
    description:
      'Real sold prices, days on market, and negotiation gaps for Mississauga homes, updated from MLS data.',
    images: ['/opengraph-image'],
  },
};

export default function RecentSalesPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Recent Sales', url: 'https://www.mississaugainvestor.ca/recent-sales' },
        ]}
      />
      <RecentSalesClient />
      {/* This page had no lead capture — a high-intent surface (investors
          checking what actually sold). Add an inline email capture at the foot. */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <InlineCTA variant="newsletter" />
      </div>
    </>
  );
}
