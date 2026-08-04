import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';

const YEAR = new Date().getFullYear();

export const metadata = {
  title: { absolute: `Mississauga Housing Market ${YEAR} - Prices & Trends` },
  description: `Mississauga housing market ${YEAR}: average prices by type, sale-to-list ratio, days on market and inventory - live MLS data plus TRREB Market Watch.`,
  alternates: { canonical: '/market-pulse' },
  openGraph: {
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Market Pulse - Mississauga Real Estate Market Stats' }],
    title: 'Market Pulse - Mississauga Real Estate Market Stats',
    description: 'Live Mississauga market data with TRREB stats, prices, DOM, and mortgage rates by Hamza Nouman.',
    url: 'https://www.mississaugainvestor.ca/market-pulse',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Market Pulse - Mississauga Real Estate Market Stats',
    description: 'Mississauga home prices, sales, days on market and mortgage rates - TRREB data explained for investors.',
    images: ['/opengraph-image'],
  },
};

// The page presents a real statistics series (monthly TRREB Market Watch rows
// + live MLS aggregates), so Dataset is the fitting schema - eligible for
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
// Market questions the stats tiles above answer with a number but never
// explain. Deliberately DEFINITIONAL, never figures: the page's own numbers
// change monthly with each TRREB Market Watch, so baking any into copy (or
// into schema, which Google may show long after a refresh) is exactly how the
// hardcoded-stat problem came back last time. Thresholds quoted are the
// standard TRREB/CREA market-balance bands, not our interpretation, and the
// answers point the reader at the live tiles rather than restating them.
// Distinct from the /faq and /listings question sets so no two pages compete
// for the same rich result.
const MARKET_FAQ = [
  {
    question: 'What does months of inventory mean in real estate?',
    answer:
      "Months of inventory is how long it would take to sell every active listing at the current pace of sales, so it is the cleanest single read on supply and demand. Under about four months favours sellers, roughly four to six months is balanced, and above six months favours buyers. The current Mississauga figure is shown in the Inventory tile on this page, sourced from TRREB's monthly Market Watch.",
  },
  {
    question: 'Is Mississauga a buyer’s market or a seller’s market right now?',
    answer:
      'Read it from two numbers on this page rather than a headline. The sales-to-new-listings ratio is the standard measure: below roughly 40% is a buyer’s market, about 40–60% is balanced, and above 60% is a seller’s market. Pair it with months of inventory and the sale-to-list ratio - when homes sell below asking and inventory is climbing, buyers hold the leverage regardless of what any single month’s average price did.',
  },
  {
    question: 'What is the difference between average and median sale price?',
    answer:
      'The average is the sum of all sale prices divided by the number of sales, so a handful of luxury sales can pull it well above what a typical home traded for. The median is the middle sale - half sold for more, half for less - which makes it the more honest read on the typical home. Both are shown on this page precisely because the gap between them tells you how skewed the month was.',
  },
  {
    question: 'What does the sale-to-list ratio tell an investor?',
    answer:
      'It is the sale price as a percentage of the asking price, averaged across sales. Above 100% means homes are generally selling over asking (competitive bidding), while below 100% means sellers are accepting less than they asked. For an investor it sets the realistic negotiation expectation before writing an offer, and a falling ratio is usually the earliest sign a market is cooling - it moves before average prices do.',
  },
  {
    // Targets "motivated sellers Mississauga" / "how long on market" queries -
    // the search demand today's radar campaign feeds. Definitional like the
    // rest: the live counts live in the radar card above, never in this copy.
    question: 'How do I find motivated sellers in Mississauga?',
    answer:
      'Days on market is the most reliable public signal. A listing that has sat well past the market’s typical selling time - roughly 60 days or more - tells you the seller’s expectations and the market have not met, and a price cut on top of that means the seller has already shown flexibility once. The Motivated Seller Radar on this page tracks how many active Mississauga listings currently fit that profile and which neighbourhoods they cluster in, and every listing on this site shows its real days on market so you can sort the whole city by who has been waiting longest before you write an offer.',
  },
  {
    question: 'Where does this Mississauga market data come from?',
    answer:
      'Two sources, labelled separately on the page rather than blended into one number. Days on market and active listing counts come from live MLS data through the PropTx/AMPRE feed and update continuously. Sold prices, sales volume, months of inventory, sale-to-list ratio and year-over-year changes come from the Toronto Regional Real Estate Board’s monthly Market Watch report, and the month they represent is stated on the page so a monthly snapshot is never read as today’s figure.',
  },
];

export default function Layout({ children }) {
  return (
    <>
      <FAQJsonLd items={MARKET_FAQ} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Market Pulse', url: 'https://www.mississaugainvestor.ca/market-pulse' },
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />
      {children}
      {/* Rendered here, in the server layout, alongside the schema it mirrors -
          the page itself is a client component, and keeping question text in
          two files is how visible copy and markup drift apart. */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <h2 className="font-heading text-xl font-bold text-navy">
          Understanding these Mississauga market numbers
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {MARKET_FAQ.map((qa) => (
            <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading text-sm font-semibold text-navy">{qa.question}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{qa.answer}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Put these numbers to work:{' '}
          <a href="/listings" className="font-medium text-accent no-underline hover:text-accent-dark">
            browse scored Mississauga listings
          </a>
          ,{' '}
          <a href="/listings?sort=dom" rel="nofollow" className="font-medium text-accent no-underline hover:text-accent-dark">
            see the longest-sitting listings
          </a>
          ,{' '}
          <a href="/mortgage-calculator" className="font-medium text-accent no-underline hover:text-accent-dark">
            model a purchase in the calculator
          </a>
          , or compare areas in the{' '}
          <a href="/neighbourhoods" className="font-medium text-accent no-underline hover:text-accent-dark">
            neighbourhood guides
          </a>
          .
        </p>
      </section>
    </>
  );
}
