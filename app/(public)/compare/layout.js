export const metadata = {
  title: { absolute: 'Compare Investment Properties Side by Side' },
  description:
    'Compare Mississauga investment properties side by side — price, deal score, cash flow, cap rate, cash-on-cash return and suite potential.',
  alternates: { canonical: '/compare' },
  openGraph: {
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Compare Investment Properties — MississaugaInvestor.ca' }],
    title: 'Compare Investment Properties — MississaugaInvestor.ca',
    description: 'Side-by-side investment comparison: cash flow, cap rate, deal score, and more.',
    url: 'https://www.mississaugainvestor.ca/compare',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Investment Properties — MississaugaInvestor.ca',
    description: 'Side-by-side investment comparison: cash flow, cap rate, deal score, and more.',
    images: ['/opengraph-image'],
  },
};

const COMPARE_FAQ = [
  {
    q: 'What metrics does the compare tool show?',
    a: 'Side-by-side: price, property type, beds, baths, square footage, price per square foot, days on market, Deal Score, estimated monthly rent, monthly costs (mortgage + property tax + insurance), cash flow, cap rate, cash-on-cash return, suite potential, LRT access, and any price drop since listing.',
  },
  {
    q: 'How does deal score help me compare properties?',
    a: 'The Deal Score (1–10) rolls cap rate, cash flow, price-to-rent ratio, and days-on-market into a single number, so you can see at a glance which property offers better overall returns — not just the cheapest one. The winner badge highlights the highest-scoring property across your selection.',
  },
  {
    q: 'How is estimated rent calculated?',
    a: 'Rent is estimated from CMHC lease-comp data for the property\'s bedroom count and neighbourhood, adjusted for suite potential. The monthly costs row uses a 20% down payment, the Bank of Canada 5-year fixed stress-test rate, and Mississauga\'s property tax rate — the same inputs the listing detail page shows.',
  },
  {
    q: 'How do I add properties to compare?',
    a: 'Check the "Compare" box on any listing card on the Listings or GTA pages, then open this page. Up to four properties can be compared at once. Use the Remove button to swap in a different property without losing the others.',
  },
];

export default function CompareLayout({ children }) {
  return (
    <>
      {children}
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-2 sm:px-6 lg:px-8">
        <h2 className="font-heading text-xl font-bold text-navy mb-4">
          How the investment comparison works
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {COMPARE_FAQ.map((item) => (
            <div key={item.q} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading text-sm font-semibold text-navy">{item.q}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
