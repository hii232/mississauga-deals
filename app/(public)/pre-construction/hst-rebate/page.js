import Link from 'next/link';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';

// Q&A mirrors the on-page content below — keep both in sync if the program changes
const HST_FAQ = [
  {
    question: 'How much is the Ontario HST rebate on new homes?',
    answer:
      'Up to $130,000, depending on purchase price: homes up to $1,000,000 get the full 13% HST rebated (both the 8% provincial and 5% federal portions), homes between $1M and $1.5M get a flat $130,000, the rebate declines from $130,000 to $24,000 between $1.5M and $1.85M, and above $1.85M the existing $24,000 Ontario new housing rebate applies.',
  },
  {
    question: 'Who qualifies for the Ontario HST rebate on new homes?',
    answer:
      'Primary-residence buyers qualify for the full rebate, and real estate investors qualify under the NRRP (New Residential Rental Property) rebate program. There is no first-time-buyer requirement, and purpose-built rental developers also qualify.',
  },
  {
    question: 'What are the key dates for the Ontario HST rebate?',
    answer:
      'The Agreement of Purchase and Sale must be signed between April 1, 2026 and March 31, 2027. Closing can occur after March 31, 2027, which is common for pre-construction purchases with 2-4 year timelines.',
  },
  {
    question: 'Does the HST rebate apply to resale homes?',
    answer:
      'No. The rebate applies only to newly built homes that have not been previously occupied. Resale properties do not qualify.',
  },
  {
    question: 'Which property types qualify for the HST rebate?',
    answer:
      'Detached homes, semi-detached homes, townhouses, pre-construction condos, and stacked townhomes all qualify, as long as they are new builds.',
  },
];

export const metadata = {
  title: { absolute: 'Ontario HST Rebate on New Homes 2026 — Up to $130K' },
  description:
    'Ontario HST rebate on new homes: up to $130,000 off a qualifying new build. Who qualifies, the savings tiers by price, and the April 2026 deadline.',
  alternates: { canonical: '/pre-construction/hst-rebate' },
  openGraph: {
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Ontario HST Rebate on New Homes 2026 — Save Up to $130,000' }],
    title: 'Ontario HST Rebate on New Homes 2026 — Save Up to $130,000',
    description:
      'Save up to $130,000 on new homes in Mississauga. Full breakdown of the Ontario HST rebate for buyers and investors.',
    url: 'https://www.mississaugainvestor.ca/pre-construction/hst-rebate',
  },
  // Next.js REPLACES (not merges) the root layout twitter object when a page
  // defines its own openGraph — without this the HST rebate page shares
  // text-only on X/Twitter/Slack/iMessage.
  twitter: {
    card: 'summary_large_image',
    title: 'Ontario HST Rebate on New Homes 2026 — Save Up to $130,000',
    description:
      'Save up to $130,000 on new homes in Mississauga. Full breakdown of the Ontario HST rebate for buyers and investors.',
    images: ['/opengraph-image'],
  },
};

function SavingsTier({ range, rebate, effective, highlight }) {
  return (
    <div
      className={`rounded-xl border p-5 transition-shadow ${
        highlight
          ? 'border-accent/40 bg-accent/5 shadow-md'
          : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-sm font-medium text-muted mb-1">{range}</p>
      <p className="font-heading font-bold text-2xl text-navy mb-1">{rebate}</p>
      <p className="text-xs text-muted">Effective HST: {effective}</p>
    </div>
  );
}

function QualifyCard({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-xl">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-navy mb-0.5">{title}</h3>
        <p className="text-xs text-muted leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function HSTRebatePage() {
  return (
    <div className="min-h-screen bg-cloud">
      <FAQJsonLd items={HST_FAQ} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Pre-Construction', url: 'https://www.mississaugainvestor.ca/pre-construction' },
          { name: 'Ontario HST Rebate', url: 'https://www.mississaugainvestor.ca/pre-construction/hst-rebate' },
        ]}
      />
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy to-accent/20 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 rounded-full px-4 py-1.5 mb-6">
            <span className="text-amber-300 text-xs font-bold uppercase tracking-wide">
              Active: April 1, 2026 – March 31, 2027
            </span>
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-5xl text-white leading-tight mb-4">
            Ontario HST Rebate: Save Up to
            <br /><span className="text-accent">$130,000</span> on New Homes
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto mb-8">
            The Ontario government has introduced a new HST rebate on new residential properties.
            Here is everything Mississauga buyers and investors need to know.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="tel:+16476091289"
              className="btn-primary !text-base !px-8 !py-3.5 no-underline"
            >
              Book a Free Consultation
            </a>
            <Link
              href="/pre-construction"
              className="bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg px-8 py-3.5 text-base no-underline text-center hover:bg-white/20 transition-colors border border-white/20"
            >
              Browse Pre-Construction
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* How much you save */}
        <section>
          <h2 className="section-title mb-2">How Much Can You Save?</h2>
          <p className="section-subtitle mb-6">
            The rebate amount depends on the purchase price of the new home
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SavingsTier
              range="Up to $1,000,000"
              rebate="Up to $130,000"
              effective="~0% HST"
              highlight
            />
            <SavingsTier
              range="$1M – $1.5M"
              rebate="Flat $130,000"
              effective="Reduced"
            />
            <SavingsTier
              range="$1.5M – $1.85M"
              rebate="Declining to $24,000"
              effective="Partially reduced"
            />
            <SavingsTier
              range="Over $1.85M"
              rebate="$24,000 (provincial)"
              effective="Standard HST"
            />
          </div>
          <p className="text-xs text-muted mt-4 leading-relaxed">
            On a $750,000 new build in Mississauga, you could save approximately $97,500 in HST — money that
            stays in your pocket or goes toward a larger down payment.
          </p>
        </section>

        {/* Who qualifies */}
        <section>
          <h2 className="section-title mb-2">Who Qualifies?</h2>
          <p className="section-subtitle mb-6">
            This rebate is not limited to first-time buyers — investors qualify too
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <QualifyCard
              icon="🏠"
              title="Primary Residence Buyers"
              desc="Buying a new home to live in? You qualify for the full rebate based on purchase price."
            />
            <QualifyCard
              icon="📈"
              title="Real Estate Investors"
              desc="Buying a new build as a rental investment? You qualify under the NRRP (New Residential Rental Property) rebate program."
            />
            <QualifyCard
              icon="👤"
              title="Not Just First-Time Buyers"
              desc="Unlike some programs, this rebate applies whether it is your first property or your tenth. No first-time buyer requirement."
            />
            <QualifyCard
              icon="🏗️"
              title="Builders and Developers"
              desc="Purpose-built rental developers also qualify, making new rental construction more financially viable."
            />
          </div>
        </section>

        {/* Key dates */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="section-title mb-4">Key Dates and Requirements</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-accent font-bold text-lg mt-0.5">1</span>
              <div>
                <p className="text-sm font-semibold text-navy">Agreement of Purchase and Sale (APS)</p>
                <p className="text-xs text-muted">Must be signed between April 1, 2026 and March 31, 2027.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent font-bold text-lg mt-0.5">2</span>
              <div>
                <p className="text-sm font-semibold text-navy">New Construction Only</p>
                <p className="text-xs text-muted">Applies to newly built homes not previously occupied. Resale properties do not qualify.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent font-bold text-lg mt-0.5">3</span>
              <div>
                <p className="text-sm font-semibold text-navy">Closing Date Flexibility</p>
                <p className="text-xs text-muted">The APS signing date determines eligibility. Closing can occur after March 31, 2027 — common for pre-construction purchases with 2-4 year timelines.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent font-bold text-lg mt-0.5">4</span>
              <div>
                <p className="text-sm font-semibold text-navy">All New Build Types Qualify</p>
                <p className="text-xs text-muted">Detached homes, townhouses, semi-detached, pre-construction condos, and stacked townhomes all qualify as long as they are new builds.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Investor angle */}
        <section>
          <h2 className="section-title mb-2">The Investor Angle</h2>
          <p className="section-subtitle mb-6">
            This rebate fundamentally changes the math on pre-construction investing
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <p className="text-2xl mb-2">💰</p>
              <h3 className="text-sm font-semibold text-navy mb-1">Lower Entry Cost</h3>
              <p className="text-xs text-muted leading-relaxed">
                On a $900K pre-con condo, you save up to $117,000 in HST. That is equivalent to a 13% discount on the purchase price.
              </p>
            </div>
            <div className="card p-5">
              <p className="text-2xl mb-2">📊</p>
              <h3 className="text-sm font-semibold text-navy mb-1">Better Cash Flow</h3>
              <p className="text-xs text-muted leading-relaxed">
                Lower effective purchase price means lower mortgage payments. Properties that were cash-flow negative may now break even or turn positive.
              </p>
            </div>
            <div className="card p-5">
              <p className="text-2xl mb-2">⏳</p>
              <h3 className="text-sm font-semibold text-navy mb-1">Time-Limited Opportunity</h3>
              <p className="text-xs text-muted leading-relaxed">
                The window runs only 12 months (April 2026 – March 2027). Pre-construction projects launching during this period offer the best value in years.
              </p>
            </div>
          </div>
        </section>

        {/* Example calculation */}
        <section className="rounded-2xl bg-navy p-6 md:p-8 text-white">
          <h2 className="font-heading font-bold text-xl text-white mb-4">Example: $850K Pre-Con Townhouse in Mississauga</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-white/40 uppercase font-semibold mb-3">Without Rebate</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/60">Purchase Price</span><span className="font-mono">$850,000</span></div>
                <div className="flex justify-between"><span className="text-white/60">HST (13%)</span><span className="font-mono text-red-400">+$110,500</span></div>
                <div className="flex justify-between border-t border-white/10 pt-2"><span className="font-semibold">Total Cost</span><span className="font-mono font-bold">$960,500</span></div>
              </div>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase font-semibold mb-3">With Rebate</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/60">Purchase Price</span><span className="font-mono">$850,000</span></div>
                {/* Under the enhanced rebate a qualifying home at or below $1M
                    has BOTH HST portions rebated in full, so the split is simply
                    the two components of the 13%: provincial 8% of $850,000 =
                    $68,000 and federal 5% = $42,500 (together the $110,500 of HST
                    charged above). The previous figures (-$104,000 provincial /
                    -$6,300 federal) were impossible: a provincial rebate cannot
                    exceed the $68,000 of provincial HST actually paid. */}
                <div className="flex justify-between"><span className="text-white/60">HST (13%)</span><span className="font-mono">+$110,500</span></div>
                <div className="flex justify-between"><span className="text-white/60">Provincial Rebate (8%)</span><span className="font-mono text-emerald-400">-$68,000</span></div>
                <div className="flex justify-between"><span className="text-white/60">Federal Rebate (5%)</span><span className="font-mono text-emerald-400">-$42,500</span></div>
                <div className="flex justify-between border-t border-white/10 pt-2"><span className="font-semibold">Total Cost</span><span className="font-mono font-bold">$850,000</span></div>
                <div className="flex justify-between"><span className="text-emerald-400 font-semibold">You Save</span><span className="font-mono font-bold text-emerald-400">$110,500</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Visible FAQ — the page declared FAQPage schema for these five Q&As
            but never rendered them. Google requires FAQ structured data to be
            visible on the page it is declared on: without this the page gets no
            rich-result eligibility and is exposed to a structured-data manual
            action. Rendered from the same HST_FAQ array as the schema so the
            two cannot drift apart. */}
        <section className="py-8">
          <h2 className="section-title mb-6 text-center">Ontario HST rebate: common questions</h2>
          <div className="space-y-3">
            {HST_FAQ.map((qa, i) => (
              <details
                key={qa.question}
                open={i === 0}
                className="group rounded-xl border border-slate-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                  <h3 className="font-heading text-sm font-semibold text-navy">{qa.question}</h3>
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">{qa.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="font-heading font-bold text-2xl text-navy mb-3">
            Ready to Take Advantage of the HST Rebate?
          </h2>
          <p className="text-sm text-muted mb-6 max-w-lg mx-auto">
            Get personalized pre-construction recommendations with full investment analysis.
            Hamza will walk you through the rebate, the best current projects, and the numbers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="tel:+16476091289"
              className="btn-primary !text-base !px-8 !py-3.5 no-underline"
            >
              Call Hamza — 647-609-1289
            </a>
            <Link
              href="/pre-construction"
              className="btn-secondary !text-base !px-8 !py-3.5 no-underline"
            >
              Join Pre-Con VIP List
            </Link>
          </div>
          <p className="text-[10px] text-muted mt-4">
            Hamza Nouman, REALTOR® · Cityscape Real Estate Ltd., Brokerage · Licensed by RECO
          </p>
        </section>
      </div>
    </div>
  );
}
