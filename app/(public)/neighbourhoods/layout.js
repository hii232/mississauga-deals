import { HOOD_DATA } from '@/lib/constants';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

const BASE = 'https://www.mississaugainvestor.ca';
const slug = (name) => name.toLowerCase().replace(/\s+/g, '-');

export const metadata = {
  title: 'Mississauga Neighbourhoods — Investment Analysis by Hamza Nouman',
  description: 'Compare Mississauga neighbourhoods for real estate investment with Hamza Nouman: average prices, rent yields, cap rates, and market temperature for Cooksville, Churchill Meadows, City Centre, Erin Mills, Port Credit, and more.',
  alternates: { canonical: '/neighbourhoods' },
  openGraph: {
    title: 'Mississauga Neighbourhoods — Investment Analysis by Area',
    description: 'Neighbourhood-by-neighbourhood investment analysis for Mississauga real estate by Hamza Nouman.',
    url: 'https://www.mississaugainvestor.ca/neighbourhoods',
  },
};

// ItemList of the neighbourhood investment guides — helps search engines
// understand this directory and discover/rank the individual guide pages.
// Built from the static HOOD_DATA constant, so it renders server-side.
const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Mississauga Neighbourhood Investment Guides',
  itemListElement: Object.keys(HOOD_DATA).map((name, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${BASE}/neighbourhoods/${slug(name)}`,
    name: `${name} Real Estate Investment Guide`,
  })),
};

export default function Layout({ children }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: `${BASE}/` },
          { name: 'Neighbourhoods', url: `${BASE}/neighbourhoods` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      {children}
    </>
  );
}
