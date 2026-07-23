import { PageHero } from '@/components/layout/page-hero';
import { BookingCalendar } from '@/components/booking/booking-calendar';

export const metadata = {
  title: 'Book a Call with Hamza Nouman — Free 30-Min Consultation',
  description: 'Schedule a free 30-minute consultation with Hamza Nouman, REALTOR® at Cityscape Real Estate. Discuss Mississauga investment properties, pre-construction, HST rebate, and more.',
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
