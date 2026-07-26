import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata = {
  title: { absolute: 'Mississauga Real Estate Investing FAQ — Answered' },
  description:
    'How deal scores work, what cap rate and cash-on-cash mean, the BRRR strategy, and how to find cash-flow-positive Mississauga investment properties.',
  keywords: [
    'Mississauga real estate FAQ',
    'Hamza Nouman FAQ',
    'investment property questions',
    'cash flow analysis Mississauga',
    'cap rate Mississauga',
    'BRRR strategy Mississauga',
    'MississaugaInvestor.ca FAQ',
  ],
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'FAQ — Mississauga Real Estate Investment Questions | Hamza Nouman' }],
    title: 'FAQ — Mississauga Real Estate Investment Questions | Hamza Nouman',
    description: 'Common questions about Mississauga real estate investing answered by Hamza Nouman.',
    url: 'https://www.mississaugainvestor.ca/faq',
  },
};
export default function Layout({ children }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'FAQ', url: 'https://www.mississaugainvestor.ca/faq' },
        ]}
      />
      {children}
    </>
  );
}
