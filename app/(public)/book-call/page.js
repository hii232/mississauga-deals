import { PageHero } from '@/components/layout/page-hero';
import { BookingCalendar } from '@/components/booking/booking-calendar';

export const metadata = {
  title: { absolute: 'Book a Call — Free 30-Min Investor Consultation' },
  description: 'Book a free 30-minute call with Hamza Nouman, REALTOR®. Talk Mississauga investment properties, pre-construction and the Ontario HST rebate.',
  alternates: { canonical: '/book-call' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: 'Book a Call — Free 30-Min Consultation with Hamza Nouman',
    description: 'Schedule a free consultation to discuss Mississauga investment properties, pre-construction condos, and the Ontario HST rebate.',
    url: 'https://www.mississaugainvestor.ca/book-call',
  },
};

export default function BookCallPage({ searchParams }) {
  // When the visitor clicks "Book a Viewing" on a property, the listing id +
  // address ride along in the URL so the booking notification tells Hamza
  // exactly which property they want to see.
  const listingId = typeof searchParams?.listing === 'string' ? searchParams.listing : '';
  const listingAddress = typeof searchParams?.addr === 'string' ? searchParams.addr : '';
  const listingPrice = typeof searchParams?.price === 'string' ? searchParams.price : '';

  return (
    <>
      <PageHero
        eyebrow={listingAddress ? 'Book a viewing' : 'Free 30-min call'}
        title={listingAddress ? 'Book a Viewing' : 'Book a Free Consultation'}
        subtitle={
          listingAddress
            ? `Pick a time and Hamza will confirm a viewing of ${listingAddress}. Prefer to talk first? He'll call you for a free 30-minute chat about this property or anything real estate.`
            : 'Pick a time that works for you. Hamza will call you for a free 30-minute chat about investment properties, pre-construction, the HST rebate, or anything real estate.'
        }
        align="center"
        compact
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Risk reversal, echoed at the point of commitment. The "first month's
          mortgage on us" offer is the strongest reason to book, but it lived
          only in one homepage band — so every visitor arriving straight here
          from a listing's "Book a Viewing" (the highest-intent path on the
          site) reached the calendar never having seen it. Same copy as the
          homepage band, on-brand accent tint, above the calendar so it is read
          before the time-slot decision. */}
      <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          {/* accent-dark on an accent tint, not success-green: #10B981 on a
              light band measures ~2.2:1 and fails AA (the same trap fixed on
              the homepage proof text and the blog sidebar label). */}
          <span className="inline-flex w-fit items-center rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-dark">
            Exclusive offer
          </span>
          <p className="text-sm leading-relaxed text-navy">
            <span className="font-semibold">Close with Hamza and your first month&rsquo;s mortgage is on us</span> —
            applied as a credit on closing, so you cash flow from day one. All investment properties qualify.
          </p>
        </div>
      </div>

      {/* Calendar */}
      <BookingCalendar
        listingId={listingId}
        listingAddress={listingAddress}
        listingPrice={listingPrice}
      />

      {/* Trust signals */}
      <div className="mt-12 text-center space-y-2">
        <p className="text-xs text-muted">
          Hamza Nouman, REALTOR® · Cityscape Real Estate Ltd., Brokerage · Licensed by RECO
        </p>
        <p className="text-xs text-muted">
          No obligation. No pressure. Just honest advice.
        </p>
      </div>
      </div>
    </>
  );
}
