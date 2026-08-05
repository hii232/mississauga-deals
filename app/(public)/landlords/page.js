import Link from 'next/link';
import { LandlordForm } from '@/components/landlords/landlord-form';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';

const BASE = 'https://www.mississaugainvestor.ca';

// Static copy + a client form; nothing request-dependent.
export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'What Should My Mississauga Rental Rent For? Free Rent Check' },
  description:
    'Own a rental in Mississauga? Get a free rent check from recent signed leases - what your unit should rent for today - and full leasing help when a tenant leaves.',
  alternates: { canonical: '/landlords' },
  openGraph: {
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Free Rent Check for Mississauga Landlords' }],
    title: 'What Should My Mississauga Rental Rent For? Free Rent Check',
    description: 'A free rent check from recent signed leases near your unit - and full leasing help when a tenant leaves. No obligation.',
    url: `${BASE}/landlords`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What Should My Mississauga Rental Rent For? Free Rent Check',
    description: 'A free rent check from recent signed leases near your unit. No obligation.',
    images: ['/opengraph-image'],
  },
};

// FAQ mirrors the visible page content only - no figures (they go stale), no
// property-management claims (not a service offered; leasing is).
const LANDLORD_FAQ = [
  {
    question: 'What is a rent check and what does it cost?',
    answer:
      'A rent check is a short, data-backed answer to "what should my unit rent for today?" We pull recent signed leases for units like yours nearby - not asking prices, actual leases - and call or text you the range. It is free, with no obligation.',
  },
  {
    question: 'Do you manage rental properties?',
    answer:
      'No - we are not a property management company. We help landlords price their unit, list it, and lease it to a tenant. Day-to-day management stays with you or your property manager.',
  },
  {
    question: 'Can you lease my unit when a tenant leaves?',
    answer:
      'Yes. Listing and leasing rental units is a core service: pricing from real lease comps, MLS exposure, showings, and offer paperwork, handled by a licensed agent.',
  },
  {
    question: 'I might sell my rental instead - can you help with that?',
    answer:
      'Yes, and this is where MississaugaInvestor.ca is different: the site has a registered list of investors actively watching this market. An income property listed here goes in front of the exact buyers who want it, tenants and all.',
  },
];

export default function LandlordsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: `${BASE}/` },
          { name: 'For Landlords', url: `${BASE}/landlords` },
        ]}
      />
      <FAQJsonLd items={LANDLORD_FAQ} />

      {/* Hero: pitch beside form on desktop, form directly after the headline
          on mobile - the same order-fix pattern /sell landed on after its
          mobile audit found the form 1.1 screens deep. */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#16223D] via-navy to-[#25355C]">
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-12 pb-16 sm:px-6 lg:grid lg:grid-cols-2 lg:gap-x-12 lg:px-8 lg:pt-16 lg:pb-20">
          <div className="max-w-xl lg:col-start-1 lg:row-start-1">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold">
              For Mississauga landlords
            </span>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-white md:text-4xl">
              Is your rental priced right?
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base">
              Most landlords set rent by scrolling asking prices. Asking is not getting.
              We check what units like yours <strong className="text-white">actually leased for</strong> in
              the last few months and tell you the range yours should command - free.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                'A rent range from real signed leases, not asking prices',
                'Full listing & leasing help when a tenant leaves',
                'And if you ever sell: your property goes in front of our registered investor list',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-white/80">
                  <svg aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="order-2 lg:order-none lg:col-start-2 lg:row-start-1 lg:pt-1">
            <LandlordForm id="rent-check" />
          </div>
        </div>
      </section>

      {/* Supporting content: honest, no figures. Rent data lives on the page
          built for it - link, don't restate. */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-heading text-xl font-bold text-navy">Why asking prices mislead</h2>
        <p className="mt-3 text-sm leading-relaxed text-navy/80">
          Rental listings you see online are what landlords <em>hope</em> to get. Overpriced units sit
          vacant for weeks - and a month of vacancy costs more than pricing right on day one.
          A rent check uses closed leases: the number a real tenant actually signed for a unit like
          yours, on your side of town. That is the same lease-comp data this site uses to model
          cash flow on every listing - see the{' '}
          <Link href="/rent-by-bedroom-mississauga" className="font-medium text-accent hover:text-accent-dark">
            current rent-by-bedroom data
          </Link>{' '}
          for the city-wide picture.
        </p>
        <h2 className="mt-8 font-heading text-xl font-bold text-navy">Thinking of selling your rental instead?</h2>
        <p className="mt-3 text-sm leading-relaxed text-navy/80">
          Income properties are this site&apos;s whole audience. A duplex, a tenanted condo, or a house
          with a suite listed here goes in front of our registered investors - buyers who want
          exactly that, tenants included.{' '}
          <Link href="/sell" className="font-medium text-accent hover:text-accent-dark">
            Start with a free valuation
          </Link>
          .
        </p>
      </section>
    </>
  );
}
