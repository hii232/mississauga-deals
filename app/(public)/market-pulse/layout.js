import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

const YEAR = new Date().getFullYear();

export const metadata = {
  title: `Mississauga Housing Market ${YEAR} — Prices, Trends & Stats | Market Pulse`,
  description: `Mississauga housing market ${YEAR}: average home prices by type, sale-to-list ratios, days on market, months of inventory, and mortgage rates — live MLS data blended with TRREB Market Watch, explained for investors by Hamza Nouman.`,
  alternates: { canonical: '/market-pulse' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: 'Market Pulse — Mississauga Real Estate Market Stats',
    description: 'Live Mississauga market data with TRREB stats, prices, DOM, and mortgage rates by Hamza Nouman.',
    url: 'https://www.mississaugainvestor.ca/market-pulse',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Market Pulse — Mississauga Real Estate Market Stats',
    description: 'Mississauga home prices, sales, days on market and mortgage rates — TRREB data explained for investors.',
    images: ['/opengraph-image'],
  },
};

// The page presents a real statistics series (monthly TRREB Market Watch rows
// + live MLS aggregates), so Dataset is the fitting schema — eligible for
// Google Dataset Search. Fields are deliberately month-agnostic (open-ended
// temporalCoverage, no figures baked in) so this markup can never go stale the
// way the hardcoded stats once did.
const datasetSchema = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Mississauga Housing Market Statistics',
  description:
    'Monthly Mississauga, Ontario residential real estate statistics: average and median sale price, sales volume, new and active listings, sale-to-list ratio, months of inventory, and days on market. Transcribed monthly from TRREB Market Watch reports and blended with live MLS aggregates.',
  url: 'https://www.mississaugainvestor.ca/market-pulse',
  temporalCoverage: '2026-02/..',
  spatialCoverage: {
    '@type': 'Place',
    name: 'Mississauga, Ontario, Canada',
  },
  variableMeasured: [
    'Average sale price',
    'Median sale price',
    'Sales volume',
    'New listings',
    'Active listings',
    'Sales-to-new-listings ratio',
    'Months of inventory',
    'Sale-to-list price ratio',
    'Average days on market',
  ],
  isBasedOn: 'https://trreb.ca/market-data/market-watch/',
  creator: {
    '@type': 'Organization',
    name: 'Toronto Regional Real Estate Board',
    url: 'https://trreb.ca',
  },
  publisher: {
    '@type': 'Organization',
    '@id': 'https://www.mississaugainvestor.ca/#organization',
    name: 'MississaugaInvestor.ca',
  },
  isAccessibleForFree: true,
  inLanguage: 'en-CA',
};
export default function Layout({ children }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Market Pulse', url: 'https://www.mississaugainvestor.ca/market-pulse' },
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />
      {children}
    </>
  );
}
