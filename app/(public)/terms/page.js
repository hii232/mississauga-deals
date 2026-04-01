export const metadata = {
  title: 'Terms of Service — MississaugaInvestor.ca',
  description: 'Terms of service for MississaugaInvestor.ca. Understand the conditions for using our real estate investment platform.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-heading font-bold text-3xl text-navy mb-2">Terms of Service</h1>
      <p className="text-sm text-muted mb-10">Last updated: March 15, 2026</p>

      <div className="prose prose-sm max-w-none text-navy/80 space-y-8">
        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using MississaugaInvestor.ca (the &ldquo;Website&rdquo;), you accept and agree to be
            bound by these Terms of Service. If you do not agree to these terms, please do not use the Website.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">2. About the Website</h2>
          <p>
            MississaugaInvestor.ca is operated by Hamza Nouman, a licensed Sales Representative at Cityscape Real Estate Ltd.
            Signature Realty, Brokerage, licensed by the Real Estate Council of Ontario (RECO). The Website
            provides real estate investment analysis tools, property listings, and market data for informational
            purposes.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">3. Investment Disclaimer</h2>
          <p>
            Investment scores, cash flow estimates, cap rates, and all financial metrics displayed on this site
            are calculated estimates for informational purposes only. They are not appraisals, broker price opinions,
            or guaranteed returns. Actual investment performance depends on many factors not captured in these
            calculations including property condition, tenant quality, future interest rates, maintenance costs,
            and market conditions. Consult a qualified financial advisor before making investment decisions.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">4. Deal Score Disclaimer</h2>
          <p>
            This score measures estimated investment return potential only — not property quality, condition,
            or desirability. Scores are based on mathematical calculations using list price, estimated rental
            income, and operating costs. A low investment score does not mean the property is undesirable — it
            means the current asking price relative to estimated rental income produces lower investor returns.
            Scores update as prices change. This is not an appraisal.
          </p>
          <p className="mt-2">
            Deal scores are calculated using publicly standard investment metrics: estimated cash flow,
            capitalization rate, cash-on-cash return, price-to-rent ratio, and secondary suite potential. These
            scores measure investment return potential for rental property investors. They do not assess property
            quality, condition, neighbourhood desirability, appreciation potential, or suitability for
            owner-occupants. A property with a low investment score may be an excellent home — it simply means
            the current price-to-rent ratio produces lower cash returns at today&apos;s mortgage rates. All estimates
            are approximate and should not be relied upon for purchase decisions without independent professional
            advice.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">5. Listing Data</h2>
          <p>
            The listing data displayed on this Website is provided under copyright by the Toronto Regional Real
            Estate Board (TRREB). The listing data is deemed reliable but is not guaranteed accurate by TRREB.
            The trademarks REALTOR&reg;, REALTORS&reg;, and the REALTOR&reg; logo are controlled by The Canadian
            Real Estate Association (CREA) and identify real estate professionals who are members of CREA.
            MLS&reg;, Multiple Listing Service&reg; and the associated logos are owned by CREA and identify the
            quality of services provided by real estate professionals who are members of CREA. Used under license.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">6. No Professional Advice</h2>
          <p>
            The information provided on this Website does not constitute financial, investment, legal, tax,
            or other professional advice. You should consult with appropriate professionals before making any
            real estate investment decisions. Hamza Nouman and Cityscape Real Estate Ltd. are not responsible
            for investment decisions made based on information from this Website.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">7. User Accounts</h2>
          <p>
            When you create an account on the Website, you are responsible for maintaining the confidentiality
            of your account information and for all activities that occur under your account. You agree to
            provide accurate and current information during registration.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">8. Intellectual Property</h2>
          <p>
            All content on this Website, including but not limited to text, graphics, logos, scoring algorithms,
            analysis tools, and software, is the property of MississaugaInvestor.ca or its content suppliers
            and is protected by Canadian and international copyright laws. You may not reproduce, distribute,
            or create derivative works from this content without prior written consent.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">9. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, MississaugaInvestor.ca, Hamza Nouman, and Cityscape Real Estate Ltd.
            Signature Realty shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages arising from your use of the Website, including but not limited to losses from
            investment decisions made using information from this platform.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">10. Accuracy of Information</h2>
          <p>
            While we strive to provide accurate and up-to-date information, we make no warranties or
            representations about the accuracy, completeness, or reliability of any information on this Website.
            Property information, market data, and financial calculations may contain errors or become outdated.
            Always verify information independently before making decisions.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms of Service at any time. Changes will be posted on this
            page with an updated revision date. Your continued use of the Website after changes constitutes
            acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">12. Governing Law</h2>
          <p>
            These Terms of Service are governed by the laws of the Province of Ontario and the federal laws
            of Canada applicable therein. Any disputes arising from these terms shall be resolved in the
            courts of Ontario.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">13. Contact</h2>
          <p>If you have questions about these Terms of Service, please contact:</p>
          <div className="bg-cloud rounded-lg p-4 mt-3 text-sm">
            <p className="font-semibold text-navy">Hamza Nouman, Sales Representative</p>
            <p>Cityscape Real Estate Ltd., Brokerage</p>
            <p>885 Plymouth Dr UNIT 2, Mississauga, ON L5V 0B5</p>
            <p>
              Phone: <a href="tel:6476091289" className="text-accent hover:underline">647-609-1289</a>
            </p>
            <p>
              Email: <a href="mailto:hamza@nouman.ca" className="text-accent hover:underline">hamza@nouman.ca</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
