import Link from 'next/link';
import { PageHero } from '@/components/layout/page-hero';

export const metadata = {
  title: 'How the Deal Score Works — Methodology & Data Sources',
  description: 'Learn how MississaugaInvestor.ca calculates deal scores for Mississauga investment properties using cash flow, cap rate, and more.',
  alternates: { canonical: '/score-methodology' },
};

export default function ScoreMethodologyPage() {
  return (
    <>
      <PageHero
        compact
        eyebrow="Methodology"
        title="How the Deal Score Works"
        subtitle="The data sources and investment formulas behind every property rating — so you can trust the number."
      />
      <div className="max-w-3xl mx-auto px-4 py-12">

      {/* Primary Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10">
        <p className="text-sm text-amber-900 leading-relaxed">
          <strong>Important:</strong> Deal scores are calculated using publicly standard investment metrics:
          estimated cash flow, capitalization rate, cash-on-cash return, price-to-rent ratio, and secondary
          suite potential. These scores measure investment return potential for rental property investors.
          They do not assess property quality, condition, neighbourhood desirability, appreciation potential,
          or suitability for owner-occupants. A property with a low investment score may be an excellent
          home — it simply means the current price-to-rent ratio produces lower cash returns at today&apos;s
          mortgage rates. All estimates are approximate and should not be relied upon for purchase decisions
          without independent professional advice.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-navy/80 space-y-8">
        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">What is a Deal Score?</h2>
          <p>
            Every property listed on MississaugaInvestor.ca receives a deal score from 1 to 10. This score
            represents the estimated investment return potential of the property based on its current asking
            price, estimated rental income, and standard investment metrics used by real estate investors.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">Scoring Components</h2>
          <p>The deal score is a weighted combination of five key investment factors:</p>

          <div className="grid gap-4 mt-4">
            <div className="bg-cloud rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-navy text-sm">Cash Flow Analysis</h3>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">35% weight</span>
              </div>
              <p className="text-xs text-muted">
                Estimates monthly rental income minus mortgage payments, property taxes, insurance,
                maintenance, and vacancy costs. Properties with positive cash flow score higher.
              </p>
            </div>

            <div className="bg-cloud rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-navy text-sm">Yield / Cap Rate</h3>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">25% weight</span>
              </div>
              <p className="text-xs text-muted">
                Net operating income divided by property price. Higher cap rates indicate better
                return on investment relative to the purchase price.
              </p>
            </div>

            <div className="bg-cloud rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-navy text-sm">Cash-on-Cash Return</h3>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">15% weight</span>
              </div>
              <p className="text-xs text-muted">
                Annual cash flow divided by total cash invested (down payment plus land transfer tax
                and closing costs). Measures the return on the actual money you put into the deal.
              </p>
            </div>

            <div className="bg-cloud rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-navy text-sm">Value Assessment</h3>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">10% weight</span>
              </div>
              <p className="text-xs text-muted">
                Gross rent multiplier (price-to-rent ratio), plus bonus points for longer days on
                market and price reductions — both of which may represent negotiation opportunities.
              </p>
            </div>

            <div className="bg-cloud rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-navy text-sm">Market Signals</h3>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">15% weight</span>
              </div>
              <p className="text-xs text-muted">
                Combines basement suite potential, transit access, and school quality. Legal or
                convertible basement suites add income potential, while transit and school scores
                reflect location quality for rental demand and long-term value.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">Model Assumptions — Every Input, Disclosed</h2>
          <p>
            Every cash flow, cap rate, and score on this site is computed from the same set of
            assumptions, applied identically to every listing. Nothing is hidden. If your financing
            or operating numbers differ, run your own scenario in the{' '}
            <Link href="/mortgage-calculator" className="text-accent no-underline">mortgage calculator</Link>.
          </p>

          <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-xs">
              <tbody>
                {[
                  ['Down payment', '20% (investment-property minimum)'],
                  ['Mortgage rate', '4.89% — 5-year fixed, Canadian semi-annual compounding'],
                  ['Amortization', '25 years'],
                  ['Property tax', 'Actual listed tax when available; otherwise the municipal residential rate (e.g., Mississauga ~0.84% of price)'],
                  ['Insurance', '$225/month'],
                  ['Maintenance reserve', 'Greater of 8% of rent or 1% of property value per year'],
                  ['Vacancy allowance', '5% of gross rent'],
                  ['Property management', '0% (assumes self-managed)'],
                  ['Closing costs (in cash-on-cash)', 'Ontario land transfer tax + $3,000 legal/title/misc'],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-gray-50 last:border-0">
                    <td className="bg-cloud px-4 py-2.5 font-semibold text-navy w-52 align-top">{k}</td>
                    <td className="px-4 py-2.5 text-muted">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="font-heading font-semibold text-base text-navy mt-6 mb-2">Where rent estimates come from</h3>
          <p>
            Rent is estimated from a per-neighbourhood, per-bedroom rent table calibrated against
            TRREB rental market reports and public rental platforms (2025–2026), with adjustments
            by property type (detached +$250/mo, condo −$150/mo, purpose-built multi-unit +$800/mo).
            Where a neighbourhood is unknown, a conservative GTA price-to-rent ratio is used as a
            fallback. Rent estimates are estimates — always verify against current lease comps
            before offering.
          </p>

          <h3 className="font-heading font-semibold text-base text-navy mt-6 mb-2">How basement suite income is treated</h3>
          <p>
            Suite income is <strong>only</strong> added when the listing remarks explicitly indicate
            a suite, and it is tiered by confidence:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 mt-2">
            <li>
              <strong>Legal suite</strong> (listing states &ldquo;legal basement,&rdquo; &ldquo;registered
              suite,&rdquo; etc.): full basement market rent is added — roughly $1,400–$2,000/mo depending
              on basement bedrooms.
            </li>
            <li>
              <strong>Suite potential</strong> (separate entrance, in-law suite, basement apartment
              mentioned, but not stated as legal): 85% of basement market rent is added, discounted
              for permitting uncertainty.
            </li>
            <li>
              <strong>Finished basement only</strong> (no separate entrance mentioned): $0 suite
              income. It is treated as a feature, not a rentable unit.
            </li>
          </ul>
          <p className="mt-2">
            When a listing shows positive cash flow driven by suite income, the suite detection is
            shown on the listing (&ldquo;Basement Income&rdquo; in Key Facts). Always verify suite legality
            with the City of Mississauga before relying on that income.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">Transit Score</h2>
          <p>
            Each Mississauga neighbourhood is assigned a Transit Score from 1 to 10 based on proximity
            and access to GO Transit stations, the Hurontario LRT line, MiWay bus routes, and major
            highway interchanges. Higher transit scores indicate better connectivity, which drives
            stronger rental demand and faster appreciation.
          </p>
          <div className="mt-3 bg-cloud rounded-lg p-4">
            <p className="text-xs text-muted mb-2"><strong>How Transit Score affects Deal Score (within Market Signals, 15% weight):</strong></p>
            <ul className="list-disc pl-5 text-xs text-muted space-y-1">
              <li>Transit Score 8-10: +2.0 bonus points</li>
              <li>Transit Score 6-7: +1.0 bonus point</li>
              <li>Transit Score 4-5: +0.5 bonus points</li>
              <li>Transit Score below 4: no bonus</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">School Score</h2>
          <p>
            Each neighbourhood receives a School Score from 1 to 10 reflecting the quality of nearby
            public and Catholic schools based on provincial test results, Fraser Institute ratings, and
            parent reviews. Top-rated school zones attract stable family tenants, reduce vacancy, and
            support long-term property values.
          </p>
          <div className="mt-3 bg-cloud rounded-lg p-4">
            <p className="text-xs text-muted mb-2"><strong>How School Score affects Deal Score (within Market Signals, 15% weight):</strong></p>
            <ul className="list-disc pl-5 text-xs text-muted space-y-1">
              <li>School Score 8-10: +1.5 bonus points</li>
              <li>School Score 6-7: +1.0 bonus point</li>
              <li>School Score 4-5: +0.5 bonus points</li>
              <li>School Score below 4: no bonus</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">Score Ranges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-bold text-sm flex items-center justify-center mx-auto mb-2">8+</div>
              <p className="text-xs font-semibold text-emerald-800">Strong Deal</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mx-auto mb-2">6.5+</div>
              <p className="text-xs font-semibold text-blue-800">Good Deal</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold text-sm flex items-center justify-center mx-auto mb-2">5+</div>
              <p className="text-xs font-semibold text-amber-800">Average</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="w-10 h-10 rounded-full bg-red-500 text-white font-bold text-sm flex items-center justify-center mx-auto mb-2">&lt;5</div>
              <p className="text-xs font-semibold text-red-800">Below Avg.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">Important Limitations</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Scores are based on <strong>estimated</strong> rental income, not actual rents.</li>
            <li>Property condition, renovation costs, and maintenance requirements are not factored in.</li>
            <li>Neighbourhood desirability and appreciation potential are not measured.</li>
            <li>Scores assume standard financing terms and may not reflect your specific mortgage rates.</li>
            <li>This is not an appraisal or broker price opinion.</li>
            <li>Always conduct your own due diligence and consult professionals before investing.</li>
          </ul>
        </section>

        {/* Bottom Disclaimer */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-8">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            This score measures estimated investment return potential only — not property quality, condition,
            or desirability. Scores are based on mathematical calculations using list price, estimated rental
            income, and operating costs. A low investment score does not mean the property is undesirable — it
            means the current asking price relative to estimated rental income produces lower investor returns.
            Scores update as prices change. This is not an appraisal. Hamza Nouman, Sales Representative,
            Cityscape Real Estate Ltd., Brokerage.
          </p>
        </div>

        <div className="text-center pt-4">
          <Link href="/listings" className="btn-primary !px-6 !py-2.5 no-underline text-sm">
            Browse Scored Listings
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
