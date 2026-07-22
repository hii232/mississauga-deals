import { HOOD_DATA } from '@/lib/constants';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';

const BASE = 'https://www.mississaugainvestor.ca';
const slug = (name) => name.toLowerCase().replace(/\s+/g, '-');

export const metadata = {
  title: 'Best Neighbourhoods to Invest in Mississauga (2026) — Yields, Prices & Deal Scores',
  description:
    'The best neighbourhoods to invest in Mississauga for cash flow and appreciation, ranked by rent yield, price trend, and days on market. Compare Clarkson, Cooksville, Malton, Erin Mills, City Centre, Port Credit and 24 areas — analysis by Hamza Nouman.',
  alternates: { canonical: '/neighbourhoods' },
  openGraph: {
    title: 'Best Neighbourhoods to Invest in Mississauga (2026)',
    description:
      'Mississauga neighbourhoods ranked for real estate investment — rent yields, average prices, cap rates, and market temperature.',
    url: 'https://www.mississaugainvestor.ca/neighbourhoods',
  },
};

// ItemList of the neighbourhood investment guides — helps search engines
// understand this directory and discover/rank the individual guide pages.
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

// Targets the high-intent query "best neighbourhoods to invest in mississauga"
// (real GSC impressions, striking-distance position). Answers stay in sync with
// the ranked HOOD_DATA shown on the page.
const NEIGHBOURHOODS_FAQ = [
  {
    question: 'What are the best neighbourhoods to invest in Mississauga?',
    answer:
      'For rental cash flow, the highest-yielding Mississauga neighbourhoods are Clarkson, Malton, and Cooksville (around 5% gross rent yield), followed by Erin Mills and Dixie. Clarkson and Cooksville pair strong yields with an upward price trend, making them balanced picks for cash flow plus appreciation, while City Centre and Port Credit trade lower yields for stronger long-term appreciation. Every Mississauga neighbourhood on this page is ranked by rent yield, price trend, and days on market so you can match an area to your investment strategy.',
  },
  {
    question: 'Which Mississauga neighbourhood has the best rental cash flow?',
    answer:
      'Clarkson and Malton currently lead Mississauga on gross rent yield (about 5.1%), meaning rent covers more of the carrying costs relative to the purchase price. Cooksville is close behind with a warmer price trend. Lower-priced areas generally yield more, while premium waterfront areas like Port Credit yield less but appreciate faster.',
  },
  {
    question: 'Is Mississauga a good place to invest in real estate in 2026?',
    answer:
      'Mississauga combines GTA-level rental demand with lower entry prices than downtown Toronto, strong tenant demand from students and commuters, and major transit investment such as the Hazel McCallion (Hurontario) LRT. Several neighbourhoods still offer positive or near-neutral cash flow at current rates. Use the deal scores and cash-flow analysis on this site to evaluate specific properties.',
  },
];

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
      <FAQJsonLd items={NEIGHBOURHOODS_FAQ} />
      {children}
    </>
  );
}
