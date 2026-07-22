import Link from 'next/link';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/layout/page-hero';
import InlineCTA from '@/components/ui/inline-cta';

const YEAR = new Date().getFullYear();

export const metadata = {
  title: `Rental Property Insurance in Mississauga — A Landlord's Guide (${YEAR})`,
  description: `Rental property insurance in Mississauga: what landlord insurance covers, why a standard homeowner policy won't protect a tenanted property, what drives the cost, and why to require tenant insurance. Honest, general guidance for investors.`,
  keywords: [
    'rental property insurance mississauga',
    'landlord insurance mississauga',
    'rental dwelling insurance ontario',
    'landlord insurance ontario cost',
    'investment property insurance mississauga',
  ],
  alternates: { canonical: '/rental-property-insurance-mississauga' },
  openGraph: {
    title: `Rental Property Insurance in Mississauga (${YEAR})`,
    description: 'What landlord insurance covers, why it differs from a homeowner policy, and what drives the cost for a Mississauga rental.',
    url: 'https://www.mississaugainvestor.ca/rental-property-insurance-mississauga',
  },
};

// Honest, general guidance only — no fabricated premiums, coverage limits, or
// legal requirements. Readers are routed to a licensed insurance broker for a
// real quote, and the cash-flow tools already budget an insurance line.
const INS_FAQ = [
  {
    question: 'Do I need special insurance to rent out a property in Mississauga?',
    answer:
      'Yes. A standard homeowner (owner-occupied) policy is generally not designed for a property you rent to tenants and can limit or exclude coverage once the home is tenant-occupied. Landlords typically carry a landlord (also called rental dwelling or rental property) policy built for that use. Always confirm the right policy with a licensed insurance broker before you close or list a unit for rent.',
  },
  {
    question: 'What does landlord insurance usually cover?',
    answer:
      'Landlord policies commonly cover the building itself against insured perils (such as fire and certain water damage), liability if someone is injured on the property and you are found responsible, and often loss of rental income if the unit becomes uninhabitable after a covered loss. Policies for a furnished rental may also cover the landlord-owned contents (appliances, furnishings). Exact coverages, limits, and exclusions vary by insurer and property — read the policy and ask your broker what is and isn\'t included.',
  },
  {
    question: 'Does landlord insurance cover my tenant\'s belongings?',
    answer:
      'No. A landlord policy covers your building and your interests, not the tenant\'s personal property. Tenants need their own tenant (renters) insurance to protect their belongings and their personal liability. It is common and reasonable for a landlord to require proof of tenant insurance in the lease — it protects both sides and can reduce disputes after a loss.',
  },
  {
    question: 'What affects the cost of rental property insurance?',
    answer:
      'Cost depends on factors like the property type and rebuild value, its location and age, the coverage limits and deductible you choose, the number of units, whether it\'s a long-term or short-term rental, and your claims history. Because it varies so much, treat any online figure as a rough placeholder and get a real quote for your specific property. Whatever the premium, budget it as an operating expense — the cash-flow analysis on this site already includes an insurance line so your returns reflect it.',
  },
  {
    question: 'Is landlord insurance tax-deductible for a rental in Ontario?',
    answer:
      'Insurance premiums on a rental property are generally treated as a deductible operating expense against rental income, alongside costs like property tax, maintenance, and mortgage interest. Tax treatment depends on your situation, so confirm the specifics with an accountant — this is general information, not tax advice.',
  },
];

const COVERAGE = [
  {
    title: 'The building',
    body: 'The structure itself against insured perils like fire and certain water damage, up to your policy\'s limits — the core of a landlord policy.',
  },
  {
    title: 'Liability',
    body: 'Protection if a tenant or visitor is injured on the property and you\'re found responsible. Often the most financially important piece.',
  },
  {
    title: 'Loss of rental income',
    body: 'Replaces rent if an insured loss makes the unit uninhabitable while it\'s repaired — so a fire or flood doesn\'t also wipe out your cash flow.',
  },
  {
    title: 'Landlord contents',
    body: 'Landlord-owned items — appliances, and furnishings in a furnished rental. It does NOT cover the tenant\'s belongings (that\'s tenant insurance).',
  },
];

export default function RentalPropertyInsurancePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Rental Property Insurance in Mississauga', url: 'https://www.mississaugainvestor.ca/rental-property-insurance-mississauga' },
        ]}
      />
      <FAQJsonLd items={INS_FAQ} />

      <PageHero
        compact
        eyebrow={`Mississauga · Landlords · ${YEAR}`}
        title="Rental Property Insurance in Mississauga"
        subtitle="Why a homeowner policy won't protect a tenanted property, what landlord insurance actually covers, and what drives the cost — so you can budget it into the deal properly."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Direct answer */}
        <div className="rounded-2xl border border-slate-200 bg-cloud p-6 mb-10">
          <h2 className="font-heading font-bold text-lg text-navy mb-2">The short answer</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            If you rent out a property in Mississauga, you generally need a <strong>landlord policy</strong> (also called
            rental dwelling insurance) — a standard homeowner policy is built for an owner-occupied home and can limit or
            exclude coverage once the property is tenant-occupied. A landlord policy typically covers the{' '}
            <strong>building</strong>, your <strong>liability</strong>, and often <strong>lost rental income</strong>{' '}
            after an insured loss — but never the tenant&apos;s belongings, which is why you should require tenant
            insurance in the lease. Costs vary widely, so get a quote from a licensed broker and budget it as an
            operating expense.
          </p>
          <Link
            href="/mortgage-calculator"
            className="btn-primary !px-6 !py-2.5 no-underline text-sm inline-block mt-4"
          >
            See how insurance factors into cash flow →
          </Link>
        </div>

        {/* What it covers */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">What a landlord policy typically covers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {COVERAGE.map((c) => (
            <div key={c.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{c.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 mb-10">
          <p className="text-sm text-navy leading-relaxed">
            <strong>Require tenant insurance.</strong> Your policy protects the building and your interests, not the
            tenant&apos;s possessions or their liability. Asking for proof of tenant insurance in the lease is standard,
            protects both sides, and reduces disputes after a loss.
          </p>
        </div>

        {/* Inline email capture */}
        <InlineCTA variant="newsletter" className="mb-10" />

        {/* Visible FAQ (mirrors the schema) */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">Rental property insurance: common questions</h2>
        <div className="space-y-4 mb-10">
          {INS_FAQ.map((qa) => (
            <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{qa.question}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{qa.answer}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 mb-10">
          General information for investors, not insurance, legal, or tax advice. Coverage, limits, exclusions and
          pricing vary by insurer and property — confirm the right policy and a real quote with a licensed Ontario
          insurance broker.
        </p>

        {/* CTA */}
        <div className="rounded-2xl bg-navy p-8 text-center">
          <h2 className="font-heading font-bold text-xl text-white mb-2">Build the full carrying cost into the deal</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            Insurance is one line in the cash-flow math. Model the mortgage, tax, insurance and maintenance on a real
            Mississauga price, or browse listings already scored for cash flow.
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
      </div>
    </>
  );
}
