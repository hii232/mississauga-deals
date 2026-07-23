import Link from 'next/link';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/layout/page-hero';
import InlineCTA from '@/components/ui/inline-cta';
import { RelatedGuides } from '@/components/ui/related-guides';

const YEAR = new Date().getFullYear();

export const metadata = {
  title: `Rent vs Buy in Mississauga (${YEAR}) — Which Makes More Sense?`,
  description: `Rent vs buy in Mississauga for ${YEAR}: how mortgage rates, home prices, closing costs, equity, and your time horizon decide whether renting or buying wins. Run your own break-even with the free calculator.`,
  keywords: [
    'rent vs buy mississauga',
    `rent vs buy mississauga ${YEAR}`,
    'should i rent or buy in mississauga',
    'mississauga buy vs rent',
  ],
  alternates: { canonical: '/rent-vs-buy-mississauga' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: `Rent vs Buy in Mississauga (${YEAR})`,
    description: 'How rates, prices, closing costs, and time horizon decide rent vs buy in Mississauga — plus a free break-even calculator.',
    url: 'https://www.mississaugainvestor.ca/rent-vs-buy-mississauga',
  },
};

// Honest, general guidance — no fabricated break-even figures. Specific numbers
// come from the (audited) mortgage calculator, which readers are sent to.
const RVB_FAQ = [
  {
    question: `Is it better to rent or buy in Mississauga in ${YEAR}?`,
    answer:
      'It depends mostly on how long you will stay and on current mortgage rates. With higher rates, the monthly cost of owning (mortgage interest, property tax, insurance, and maintenance) often exceeds comparable rent in the first few years, so renting can win for short stays. Buying tends to pull ahead the longer you hold, because your payments build equity and the property can appreciate while rent keeps rising. A stay of roughly five or more years usually favours buying, but the exact break-even depends on your price, down payment, and rate — model it with the calculator.',
  },
  {
    question: 'What costs should I include when comparing renting and buying?',
    answer:
      'For buying, count the mortgage payment, property tax, home insurance, maintenance (budget around 1% of value a year), condo fees if applicable, and one-time closing costs — in Ontario that means land transfer tax, legal fees, and a home inspection. For renting, count the monthly rent plus tenant insurance, and remember rent typically rises each year. The fair comparison is total cost of owning minus the equity you build, versus total rent paid.',
  },
  {
    question: 'How does the down payment change the rent vs buy math?',
    answer:
      'A larger down payment lowers your monthly mortgage and interest, which shrinks the gap versus renting, but it also ties up cash that could earn a return elsewhere. In Ontario the minimum is 5% on the first $500,000 and 10% on the portion above (20% for investment properties). The calculator lets you test different down payments to see the effect on your monthly cost and break-even.',
  },
  {
    question: 'Does buying still build wealth if prices are flat?',
    answer:
      'Yes, to a degree — even with no appreciation, each mortgage payment pays down principal, so you build equity that renting never returns. Appreciation accelerates that, but the forced-savings effect of a mortgage is real on its own. The risk is the early years, when interest and one-time closing costs dominate; that is why a longer time horizon makes buying more reliable.',
  },
];

const FACTORS = [
  {
    title: 'Your time horizon',
    body: 'The single biggest factor. One-time closing costs (Ontario land transfer tax, legal, inspection) are front-loaded, so short stays favour renting. The longer you hold, the more those costs amortize and the more equity you build.',
  },
  {
    title: 'Mortgage rates',
    body: 'Higher rates raise the interest portion of every payment, tilting the early years toward renting. Lower rates do the opposite. Model your actual rate rather than a headline number.',
  },
  {
    title: 'Equity & appreciation',
    body: 'Rent buys you a place to live and nothing else; a mortgage payment builds equity, and any appreciation is yours. Even flat prices still return the principal you pay down.',
  },
  {
    title: 'Upfront cash',
    body: 'Buying needs a down payment plus closing costs; renting usually needs first-and-last. The opportunity cost of that down payment belongs in the comparison.',
  },
];

export default function RentVsBuyMississaugaPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Rent vs Buy in Mississauga', url: 'https://www.mississaugainvestor.ca/rent-vs-buy-mississauga' },
        ]}
      />
      <FAQJsonLd items={RVB_FAQ} />

      <PageHero
        compact
        eyebrow={`Mississauga · ${YEAR}`}
        title={`Rent vs Buy in Mississauga (${YEAR})`}
        subtitle="Whether renting or buying wins comes down to your time horizon, mortgage rate, and the full cost of each — here's how to think it through, then run your own numbers."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Direct answer */}
        <div className="rounded-2xl border border-slate-200 bg-cloud p-6 mb-10">
          <h2 className="font-heading font-bold text-lg text-navy mb-2">The short answer</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            For a short stay in Mississauga, renting is often cheaper month-to-month at today&apos;s rates — the
            interest and one-time closing costs of buying dominate the early years. The longer you stay, the more
            buying pulls ahead, because your payments build equity and the home can appreciate while rent keeps
            climbing. A horizon of roughly <strong>five or more years</strong> usually favours buying, but your real
            break-even depends on price, down payment, and rate. The honest answer is to model your own numbers.
          </p>
          <Link
            href="/mortgage-calculator"
            className="btn-primary !px-6 !py-2.5 no-underline text-sm inline-block mt-4"
          >
            Run your break-even in the free calculator →
          </Link>
        </div>

        {/* Factors */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">What actually decides it</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {FACTORS.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{f.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>

        {/* Inline email capture — convert the reader who isn't ready to browse yet */}
        <InlineCTA variant="newsletter" className="mb-10" />

        {/* Visible FAQ (mirrors the schema) */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">Rent vs buy: common questions</h2>
        <div className="space-y-4 mb-10">
          {RVB_FAQ.map((qa) => (
            <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{qa.question}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{qa.answer}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-navy p-8 text-center">
          <h2 className="font-heading font-bold text-xl text-white mb-2">See what buying would actually cost you</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            Model the mortgage, closing costs, and monthly carrying cost for a real Mississauga price — or browse
            investment properties already scored for cash flow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/mortgage-calculator" className="btn-primary !px-6 no-underline text-center">
              Mortgage Calculator
            </Link>
            <Link
              href="/listings"
              className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 no-underline text-center"
            >
              Browse Listings
            </Link>
          </div>
        </div>

        <RelatedGuides current="/rent-vs-buy-mississauga" />
      </div>
    </>
  );
}
