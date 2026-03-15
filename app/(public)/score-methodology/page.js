import Link from 'next/link';

export const metadata = {
  title: 'How the Deal Score Works — MississaugaInvestor.ca',
  description: 'Learn how MississaugaInvestor.ca calculates deal scores for Mississauga investment properties using cash flow, cap rate, and more.',
};

export default function ScoreMethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-heading font-bold text-3xl text-navy mb-2">How the Deal Score Works</h1>
      <p className="text-sm text-muted mb-8">Understanding our investment scoring methodology</p>

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
          <p>The deal score is a weighted combination of four key investment factors:</p>

          <div className="grid gap-4 mt-4">
            <div className="bg-cloud rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-navy text-sm">Cash Flow Analysis</h3>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">30% weight</span>
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
                <h3 className="font-semibold text-navy text-sm">Value Assessment</h3>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">25% weight</span>
              </div>
              <p className="text-xs text-muted">
                Price-to-rent ratio and comparison to area averages. Properties priced below area
                norms relative to their rental potential score higher.
              </p>
            </div>

            <div className="bg-cloud rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-navy text-sm">Market Signals</h3>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">20% weight</span>
              </div>
              <p className="text-xs text-muted">
                Days on market and price reductions. Properties that have been listed longer or have
                had price drops may represent negotiation opportunities.
              </p>
            </div>
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
            Royal LePage Signature Realty, Brokerage.
          </p>
        </div>

        <div className="text-center pt-4">
          <Link href="/listings" className="btn-primary !px-6 !py-2.5 no-underline text-sm">
            Browse Scored Listings
          </Link>
        </div>
      </div>
    </div>
  );
}
