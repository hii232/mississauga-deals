import Link from 'next/link';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/layout/page-hero';
import InlineCTA from '@/components/ui/inline-cta';

const YEAR = new Date().getFullYear();

export const metadata = {
  title: `Cash Flow Positive Properties in Ontario — Mississauga & the GTA (${YEAR})`,
  description: `How to find cash flow positive properties in Ontario in ${YEAR}: what makes a rental cash-flow positive at today's rates, why it usually takes a suite, multi-unit, or bigger down payment, and how to filter Mississauga listings already scored for positive cash flow.`,
  keywords: [
    'cash flow positive properties ontario',
    'cash flow positive real estate ontario',
    'positive cash flow properties mississauga',
    'cash flowing investment properties gta',
    'positive cash flow rental ontario',
  ],
  alternates: { canonical: '/cash-flow-positive-properties-ontario' },
  openGraph: {
    title: `Cash Flow Positive Properties in Ontario (${YEAR})`,
    description: 'What makes a rental cash-flow positive at today\'s rates, and how to filter Mississauga/GTA listings already scored for positive cash flow.',
    url: 'https://www.mississaugainvestor.ca/cash-flow-positive-properties-ontario',
  },
};

// Honest content: cash-flow-positive single units are genuinely hard at current
// rates in the GTA — we say so, and route to the live, scored listings + the
// audited calculator for real numbers rather than promising a fixed return.
const CF_FAQ = [
  {
    question: `Can you still find cash flow positive properties in Ontario in ${YEAR}?`,
    answer:
      'Yes, but they are the exception, not the rule. At today\'s mortgage rates a standard single-unit purchase in the GTA usually carries slightly negative each month once you count mortgage, property tax, insurance, maintenance, and (for condos) the condo fee. The deals that clear a positive number almost always have an extra income source or a cost advantage — a legal or potential basement suite, a multi-unit property, a below-asking purchase price, or a larger down payment. Our listings are scored for exactly this, so you can filter straight to the ones that pencil out.',
  },
  {
    question: 'What actually makes a rental property cash flow positive?',
    answer:
      'Cash flow is simply the rent minus every cost of holding the property — mortgage principal and interest, property tax, insurance, maintenance, vacancy, and condo fees where they apply. A property is cash-flow positive when the rent clears all of that with money left over. The levers that get you there are more income (a second suite or extra units), lower financing cost (a bigger down payment or a better rate), lower fees (freehold over a high-fee condo), or a lower purchase price relative to rent.',
  },
  {
    question: 'Do I need a basement suite to cash flow in the GTA?',
    answer:
      'Not always, but a legal second suite is the most common way a Mississauga property flips from slightly negative to positive, because it adds a second rent against the same mortgage. Multi-unit properties (duplex to fourplex) work the same way at larger scale. Without extra units, reaching positive usually means a larger down payment or buying below market. Every listing here flags legal-suite and suite-potential properties so you can spot the candidates quickly.',
  },
  {
    question: 'How do you calculate whether a listing is cash flow positive?',
    answer:
      'Each listing is scored using estimated market rent minus a full expense stack: the mortgage on the shown price, property tax, insurance, a maintenance reserve, vacancy, and the actual condo fee when there is one. That is the same math the mortgage calculator uses, so the number on the card matches what you would model yourself. It is an estimate — confirm rent and costs for the specific property — but it is a consistent, honest basis for comparison.',
  },
];

const LEVERS = [
  {
    title: 'A second suite',
    body: 'A legal (or potential) basement suite adds a second rent against the same mortgage — the most common path from slightly negative to positive in Mississauga.',
  },
  {
    title: 'Multiple units',
    body: 'Duplex to fourplex properties stack several rents on one purchase, which is why multi-unit listings clear positive cash flow more often than single units.',
  },
  {
    title: 'A bigger down payment',
    body: 'More down means a smaller mortgage and lower monthly interest, shrinking the gap. It ties up more cash, so weigh it against your cash-on-cash return.',
  },
  {
    title: 'Buying below market',
    body: 'A below-asking or motivated-seller purchase lowers the mortgage against the same rent — negotiation is a real cash-flow lever, not just a price win.',
  },
];

export default function CashFlowPositivePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Cash Flow Positive Properties in Ontario', url: 'https://www.mississaugainvestor.ca/cash-flow-positive-properties-ontario' },
        ]}
      />
      <FAQJsonLd items={CF_FAQ} />

      <PageHero
        compact
        eyebrow={`Ontario · Mississauga & the GTA · ${YEAR}`}
        title="Cash Flow Positive Properties in Ontario"
        subtitle="At today's rates, a property that clears positive cash flow is the exception — here's what it takes, and how to filter straight to the Mississauga listings that actually pencil out."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Direct answer */}
        <div className="rounded-2xl border border-slate-200 bg-cloud p-6 mb-10">
          <h2 className="font-heading font-bold text-lg text-navy mb-2">The short answer</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            <strong>Cash flow positive</strong> means the rent covers every cost of holding the property — mortgage,
            property tax, insurance, maintenance, vacancy, and condo fees — with money left over. In the GTA at
            today&apos;s rates, a standard single-unit purchase usually runs slightly negative, so the properties that
            clear positive almost always have <strong>a second suite, multiple units, a below-asking price, or a larger
            down payment</strong>. Every listing here is scored on that exact math, so you can filter straight to the
            ones that work.
          </p>
          <Link
            href="/listings?cf=1&sort=cashflow"
            className="btn-primary !px-6 !py-2.5 no-underline text-sm inline-block mt-4"
          >
            See cash-flow-positive listings →
          </Link>
        </div>

        {/* Levers */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">What gets a property to positive</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {LEVERS.map((l) => (
            <div key={l.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{l.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{l.body}</p>
            </div>
          ))}
        </div>

        {/* Inline email capture */}
        <InlineCTA variant="newsletter" className="mb-10" />

        {/* Visible FAQ (mirrors the schema) */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">Cash flow positive properties: common questions</h2>
        <div className="space-y-4 mb-10">
          {CF_FAQ.map((qa) => (
            <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{qa.question}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{qa.answer}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-navy p-8 text-center">
          <h2 className="font-heading font-bold text-xl text-white mb-2">Filter to the deals that actually cash flow</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            Browse Mississauga listings already scored for cash flow — or model a specific property, suite income and
            down payment in the free calculator.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/listings?cf=1&sort=cashflow" className="btn-primary !px-6 no-underline text-center">
              Cash-Flowing Listings
            </Link>
            <Link
              href="/mortgage-calculator"
              className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 no-underline text-center"
            >
              Mortgage Calculator
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
