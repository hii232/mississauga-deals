export const metadata = {
  title: 'Privacy Policy — MississaugaInvestor.ca',
  description: 'Privacy policy for MississaugaInvestor.ca. Learn how we collect, use, and protect your personal information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-heading font-bold text-3xl text-navy mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted mb-10">Last updated: March 15, 2026</p>

      <div className="prose prose-sm max-w-none text-navy/80 space-y-8">
        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">1. Who We Are</h2>
          <p>
            MississaugaInvestor.ca is operated by Hamza Nouman, Sales Representative at Cityscape Real Estate Ltd.,
            Brokerage. We are committed to protecting your privacy and complying with
            all applicable Canadian privacy legislation, including PIPEDA (Personal Information Protection
            and Electronic Documents Act).
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">2. Information We Collect</h2>
          <p>We may collect the following personal information when you use our website:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Contact Information:</strong> Name, email address, and phone number when you sign up, submit a quiz, or request information.</li>
            <li><strong>Property Preferences:</strong> Investment criteria, budget range, preferred neighbourhoods, and property type preferences submitted through our quiz or deal alert forms.</li>
            <li><strong>Usage Data:</strong> Pages visited, listings viewed, and features used on our platform to improve your experience.</li>
            <li><strong>Device Information:</strong> Browser type, device type, and IP address for analytics and security purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">3. How We Use Your Information</h2>
          <p>Your personal information is used to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Respond to your inquiries about properties and investment opportunities.</li>
            <li>Send you deal alerts and market updates you have opted into.</li>
            <li>Provide personalized property recommendations based on your investment criteria.</li>
            <li>Improve our website, tools, and services.</li>
            <li>Comply with legal and regulatory obligations under RECO and applicable real estate legislation.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">4. How We Protect Your Information</h2>
          <p>
            We implement reasonable security measures to protect your personal information from unauthorized
            access, alteration, disclosure, or destruction. This includes encrypted data transmission (SSL/TLS),
            secure data storage, and restricted access to personal information.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">5. Sharing Your Information</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share your
            information with:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Cityscape Real Estate Ltd., Brokerage:</strong> As required for real estate transaction purposes.</li>
            <li><strong>Service Providers:</strong> Trusted third-party services that help us operate our website (e.g., hosting, analytics), bound by confidentiality agreements.</li>
            <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">6. CASL Compliance</h2>
          <p>
            We comply with Canada&apos;s Anti-Spam Legislation (CASL). We will only send you commercial electronic
            messages (emails, texts) if you have provided express or implied consent. Every marketing email
            includes an unsubscribe option, and we honour all opt-out requests promptly.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">7. Cookies</h2>
          <p>
            Our website uses cookies and similar technologies to enhance your browsing experience, analyze
            website traffic, and understand where our visitors come from. You can control cookie preferences
            through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">8. Your Rights</h2>
          <p>Under PIPEDA, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Access the personal information we hold about you.</li>
            <li>Request correction of inaccurate information.</li>
            <li>Withdraw consent for the collection and use of your information.</li>
            <li>Request deletion of your personal information.</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:hamza@nouman.ca" className="text-accent hover:underline">hamza@nouman.ca</a>.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">9. Data Retention</h2>
          <p>
            We retain your personal information only as long as necessary to fulfill the purposes for which
            it was collected, or as required by law. Lead information is retained for a reasonable period to
            facilitate follow-up communications, after which it is securely deleted.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-xl text-navy mb-3">10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or how we handle your personal information,
            please contact:
          </p>
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
