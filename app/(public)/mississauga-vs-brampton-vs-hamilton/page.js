import Link from 'next/link';
import { StickyMobileCTA } from '@/components/layout/sticky-mobile-cta';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/layout/page-hero';
import InlineCTA from '@/components/ui/inline-cta';
import { RelatedGuides } from '@/components/ui/related-guides';
import { getTaxRate, hasExplicitTaxRate } from '@/lib/constants';
import { calculateOntarioLTT, chargesTorontoMLTT } from '@/lib/cash-flow-engine';

const YEAR = new Date().getFullYear();

export const metadata = {
  title: { absolute: 'Mississauga vs Brampton vs Hamilton: Where to Invest?' },
  description:
    'Compare property tax, land transfer tax and rental demand across Mississauga, Brampton and Hamilton - with live scored listings for each city.',
  keywords: [
    'mississauga vs brampton real estate investment',
    'mississauga vs hamilton real estate investment',
    'brampton vs hamilton investment property',
    'best gta city to invest in real estate',
    'where to buy investment property ontario',
  ],
  alternates: { canonical: '/mississauga-vs-brampton-vs-hamilton' },
  openGraph: {
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Mississauga vs Brampton vs Hamilton: Where to Invest?' }],
    title: 'Mississauga vs Brampton vs Hamilton: Where to Invest?',
    description: 'Property tax, land transfer tax and rental demand compared across three GTA cities - with live scored listings for each.',
    url: 'https://www.mississaugainvestor.ca/mississauga-vs-brampton-vs-hamilton',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mississauga vs Brampton vs Hamilton: Where to Invest?',
    description: 'Property tax, land transfer tax and rental demand compared across three GTA cities - with live scored listings for each.',
    images: ['/opengraph-image'],
  },
};

// Property tax rates are the site's own researched 2025 TAX_RATES table (the
// same numbers every listing's carrying-cost math already uses) - not
// re-authored here, so this page can't drift from the calculator. No price,
// appreciation or rent figures are stated: those move constantly and the
// honest, non-fabricated source for them is the live listings each city links
// to, exactly like the site's other comparison guides (townhouse-vs-condo,
// rent-vs-buy).
const CITIES = ['Mississauga', 'Brampton', 'Hamilton'];

const QUALITATIVE_ROWS = [
  {
    factor: 'Distance from Toronto',
    values: ['Closest of the three - borders Toronto directly', 'West of Toronto, along the Hwy 401/407 corridor', 'Farthest of the three, at the west end of the GTA'],
  },
  {
    factor: 'Typical entry price vs. the other two',
    values: ['Generally the highest of the three', 'Usually between Mississauga and Hamilton', 'Generally the most affordable of the three'],
  },
  {
    factor: 'Demand drivers',
    values: ['Pearson Airport, corporate head offices, the Hurontario LRT corridor', 'Warehousing/logistics employment, fast population growth', 'McMaster University, the hospital network, ongoing downtown revitalization'],
  },
  {
    factor: 'Property mix',
    values: ['Detached, condo towers and a growing mid-rise/townhouse supply', 'Mostly detached and townhouse, fewer high-rise condos', 'Detached and legal-duplex stock, especially in the lower city'],
  },
];

const CITY_VS_FAQ = [
  {
    question: 'Which is the best GTA city to invest in: Mississauga, Brampton or Hamilton?',
    answer:
      'There is no single winner - each trades price for something else. Mississauga generally commands the highest entry price of the three but pairs it with Pearson Airport, major employers and the Hurontario LRT corridor. Brampton usually sits between the two on price, with strong population growth and logistics-driven rental demand. Hamilton is typically the most affordable, anchored by McMaster University and an ongoing downtown revitalization. Match the city to your budget and strategy, then compare specific scored listings rather than picking a city on reputation alone.',
  },
  {
    question: 'How do property tax rates compare?',
    answer: `Property tax is charged as a percentage of assessed value and varies by municipality - using each city's own published 2025 residential rate: Mississauga is about ${(getTaxRate('Mississauga') * 100).toFixed(2)}%, Brampton about ${(getTaxRate('Brampton') * 100).toFixed(2)}%, and Hamilton about ${(getTaxRate('Hamilton') * 100).toFixed(2)}%. On a similarly priced property, that gap alone can move monthly carrying costs by a meaningful amount, which is why every listing on this site has its own city's real rate built into its cash-flow number rather than one blanket estimate.`,
  },
  {
    question: 'Does land transfer tax differ between the three?',
    answer: `Ontario's provincial land transfer tax applies the same sliding-scale formula everywhere in the province, so it is identical in Mississauga, Brampton and Hamilton - for example, ${fmtLTTExample()} on a $700,000 purchase in any of the three. None of the three charges an additional MUNICIPAL land transfer tax; that extra layer applies only inside the City of Toronto (including its amalgamated districts), roughly doubling the tax there. Budget the provincial tax plus legal fees and inspection everywhere - see the mortgage calculator for the full closing-cost breakdown on a specific price.`,
  },
  {
    question: 'Which city has the lowest entry prices right now?',
    answer:
      "That changes with the market, so rather than quote a figure that goes stale, compare current, scored listings directly: Mississauga, the GTA hub covers Brampton, Hamilton and every other city in the feed with the same cash-flow and cap-rate analysis. Sort any of them by price to see today's real entry point.",
  },
  {
    question: 'Is it worth investing outside Mississauga at all?',
    answer:
      'Often, yes - rental demand and price-to-rent ratios vary city to city, and a property that cash-flows poorly in one market can work in another at a lower entry price. The trade-off is usually local knowledge: property management, tenant demand and neighbourhood-level nuance are things Mississauga guides on this site are built specifically to cover. The GTA hub applies the same scoring engine (cash flow, cap rate, legal-suite detection) to every city, so the comparison is apples-to-apples wherever you end up buying.',
  },
];

function fmtLTTExample() {
  const ltt = calculateOntarioLTT(700000);
  return '$' + ltt.toLocaleString() + ' in provincial land transfer tax';
}

export default function CityComparisonPage() {
  // Only render the exact-rate FAQ answer with numbers this site has actually
  // researched for all three cities - if that ever stops being true for one
  // of them, this guards against silently printing the generic fallback rate
  // as if it were a real published figure.
  const ratesResearched = CITIES.every((c) => hasExplicitTaxRate(c));
  const anyTorontoMltt = CITIES.some((c) => chargesTorontoMLTT(c));

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Mississauga vs Brampton vs Hamilton', url: 'https://www.mississaugainvestor.ca/mississauga-vs-brampton-vs-hamilton' },
        ]}
      />
      {ratesResearched && !anyTorontoMltt && <FAQJsonLd items={CITY_VS_FAQ} />}

      <PageHero
        compact
        eyebrow={`GTA Investing · ${YEAR}`}
        title="Mississauga vs Brampton vs Hamilton: Where to Invest?"
        subtitle="Property tax, land transfer tax and rental-demand drivers compared across three GTA cities - then run the numbers on real, scored listings in each."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Direct answer */}
        <div className="rounded-2xl border border-slate-200 bg-cloud p-6 mb-10">
          <h2 className="font-heading font-bold text-lg text-navy mb-2">The short answer</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            <strong>Mississauga</strong> generally has the highest entry price of the three, offset by Pearson Airport,
            major employers and the Hurontario LRT corridor. <strong>Brampton</strong> usually sits between the two on
            price, with fast population growth and strong logistics-driven rental demand. <strong>Hamilton</strong> is
            typically the most affordable, anchored by McMaster University and an active downtown revitalization. All
            three pay the same provincial land transfer tax - none charges Toronto&apos;s extra municipal layer - but
            their property tax rates differ meaningfully. Pick a city for your budget and strategy, then compare real,
            scored listings rather than a reputation.
          </p>
          <Link href="/gta" className="btn-primary !px-6 !py-2.5 no-underline text-sm inline-block mt-4">
            Browse scored listings across the GTA →
          </Link>
        </div>

        {/* Property tax + LTT table - real, sourced numbers */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">Property tax &amp; land transfer tax, side by side</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 mb-3">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-cloud">
                <th className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-navy">City</th>
                <th className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-navy">2025 property tax rate</th>
                <th className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-navy">Municipal land transfer tax</th>
              </tr>
            </thead>
            <tbody>
              {CITIES.map((city, i) => (
                <tr key={city} className={i % 2 ? 'bg-white' : 'bg-slate-50/60'}>
                  <td className="px-4 py-3 font-semibold text-navy">{city}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {hasExplicitTaxRate(city) ? `${(getTaxRate(city) * 100).toFixed(2)}%` : 'Not yet researched'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{chargesTorontoMLTT(city) ? 'Yes' : 'None (provincial LTT only)'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mb-10">
          Property tax rates are the site&apos;s own researched 2025 municipal rates - the same figures used in every
          listing&apos;s carrying-cost math, so this table can&apos;t drift from the calculator. Ontario&apos;s provincial
          land transfer tax applies identically in all three cities; only the City of Toronto charges an additional
          municipal land transfer tax, which is why that column reads &quot;None&quot; here.
        </p>

        {/* Qualitative comparison */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">How the three cities compare</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 mb-3">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-cloud">
                <th className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-navy">Factor</th>
                {CITIES.map((c) => (
                  <th key={c} className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-navy">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {QUALITATIVE_ROWS.map((r, i) => (
                <tr key={r.factor} className={i % 2 ? 'bg-white' : 'bg-slate-50/60'}>
                  <td className="px-4 py-3 font-semibold text-navy">{r.factor}</td>
                  {r.values.map((v, j) => (
                    <td key={j} className="px-4 py-3 text-slate-600">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mb-10">
          General tendencies, not a promise for any specific property - prices and rents move constantly, so this page
          deliberately doesn&apos;t quote a $ figure that would go stale. See live, scored listings in each city for
          today&apos;s real numbers.
        </p>

        {/* Live city links - the honest source for current prices */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <Link href="/listings" className="rounded-xl border border-slate-200 bg-white p-4 text-center no-underline transition-all hover:border-accent/30 hover:shadow-md">
            <span className="block font-heading font-semibold text-sm text-navy">Mississauga</span>
            <span className="mt-1 block text-xs font-semibold text-accent">See listings →</span>
          </Link>
          <Link href="/gta/brampton" className="rounded-xl border border-slate-200 bg-white p-4 text-center no-underline transition-all hover:border-accent/30 hover:shadow-md">
            <span className="block font-heading font-semibold text-sm text-navy">Brampton</span>
            <span className="mt-1 block text-xs font-semibold text-accent">See listings →</span>
          </Link>
          <Link href="/gta/hamilton" className="rounded-xl border border-slate-200 bg-white p-4 text-center no-underline transition-all hover:border-accent/30 hover:shadow-md">
            <span className="block font-heading font-semibold text-sm text-navy">Hamilton</span>
            <span className="mt-1 block text-xs font-semibold text-accent">See listings →</span>
          </Link>
        </div>

        {/* Inline email capture - convert the reader who isn't ready to browse yet */}
        <InlineCTA variant="newsletter" className="mb-10" />

        {/* Visible FAQ (mirrors the schema) */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">Common questions</h2>
        <div className="space-y-4 mb-10">
          {CITY_VS_FAQ.map((qa) => (
            <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{qa.question}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{qa.answer}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-navy p-8 text-center">
          <h2 className="font-heading font-bold text-xl text-white mb-2">Compare real listings, not just averages</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            Every listing in Mississauga, Brampton, Hamilton and across the GTA is scored for cash flow and cap rate
            using each city&apos;s own real tax rate - so the comparison is apples-to-apples.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/gta" className="btn-primary !px-6 no-underline text-center">
              Browse the GTA Hub
            </Link>
            <Link
              href="/mortgage-calculator"
              className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 no-underline text-center"
            >
              Mortgage Calculator
            </Link>
          </div>
        </div>

        <RelatedGuides current="/mississauga-vs-brampton-vs-hamilton" />
      </div>
      <StickyMobileCTA href="/gta" label="Browse the GTA Hub" />
    </>
  );
}
