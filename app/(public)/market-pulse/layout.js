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
      {children}
    </>
  );
}
