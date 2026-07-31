import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata = {
  title: { absolute: 'Free Mississauga Deal Alerts — New Listings by Email' },
  description:
    'Free deal alerts: get emailed when a new Mississauga investment property matches your budget, strategy and neighbourhood. Unsubscribe in one click.',
  alternates: { canonical: '/alerts' },
  openGraph: {
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Deal Alerts — MississaugaInvestor.ca' }],
    title: 'Deal Alerts — MississaugaInvestor.ca',
    description: 'Get notified when new Mississauga investment deals match your criteria.',
    url: 'https://www.mississaugainvestor.ca/alerts',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deal Alerts — MississaugaInvestor.ca',
    description: 'Get notified when new Mississauga investment deals match your criteria.',
    images: ['/opengraph-image'],
  },
};

// FAQPage structured data makes /alerts eligible for Google FAQ rich results
// and gives the crawler substantive content beyond the client-rendered form.
// Questions are disjoint from /faq, /listings, and /market-pulse so no two
// pages compete for the same rich result. Answers contain no market figures
// (those change frequently and schema can be surfaced long after a refresh).
const ALERTS_FAQ = [
  {
    question: 'How do Mississauga investment property deal alerts work?',
    answer:
      'You set your criteria — budget, property type, neighbourhood, and investment strategy (cash flow, BRRR, etc.) — and our system emails you whenever a newly listed or price-reduced Mississauga or GTA property matches. Each alert includes the property\'s cap rate, estimated monthly cash flow, Deal Score, and a link to the full analysis. Alerts are free and sent only when a real match exists; you will not receive a daily email on days with no matching listings.',
  },
  {
    question: 'What investment criteria can I filter deal alerts by?',
    answer:
      'You can filter by maximum purchase price, minimum bedrooms, neighbourhood (any of the 24 Mississauga communities or a specific GTA city), and investment strategy — cash-flow-positive properties, BRRR candidates, or new listings under a certain price. The form also accepts your name so Hamza can personalise the alerts. All filters default to broad settings so you can subscribe with just your email and refine later.',
  },
  {
    question: 'How often will I receive deal alert emails?',
    answer:
      'The system checks for new matches once daily. You receive an email only on days when properties meeting your criteria are newly listed or have had a price reduction. Most subscribers receive two to four alerts per week during active market periods. There is a hard cap of 15 listings per email so alerts never become overwhelming.',
  },
  {
    question: 'Are the deal alerts really free?',
    answer:
      'Yes — free to sign up, free to receive, and free to cancel. No credit card is required. You can unsubscribe with one click from any alert email; there is also a List-Unsubscribe header in every message so your email client can unsubscribe you automatically. Your email address is never shared with third parties.',
  },
  {
    question: 'What is a good cap rate for a Mississauga investment property?',
    answer:
      'Cap rate is the property\'s net operating income divided by its purchase price, expressed as a percentage, assuming an all-cash purchase (no mortgage). A cap rate of 4% or above is considered solid for a Mississauga detached or semi-detached; 5% or above is strong and usually requires a legal basement suite or a below-average purchase price. Condos and townhouses with high condo fees typically cap at 3–4%. Deal alerts show the estimated cap rate for every property so you can sort by this metric without visiting each listing individually.',
  },
];

const ALERTS_BREADCRUMBS = [
  { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
  { name: 'Deal Alerts', url: 'https://www.mississaugainvestor.ca/alerts' },
];

export default function AlertsLayout({ children }) {
  return (
    <>
      <FAQJsonLd items={ALERTS_FAQ} />
      <BreadcrumbJsonLd items={ALERTS_BREADCRUMBS} />
      {children}
      {/* Server-rendered FAQ section — always visible to Google despite the
          client-rendered form above. Same pattern as compare/layout.js.
          Placed below the form so it never displaces the primary CTA. */}
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-2 sm:px-6">
        <h2 className="font-heading text-xl font-bold text-navy mb-4">
          About Mississauga Deal Alerts
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {ALERTS_FAQ.map((item) => (
            <div key={item.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading text-sm font-semibold text-navy">{item.question}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
