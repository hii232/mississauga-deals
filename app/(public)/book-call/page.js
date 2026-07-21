import { PageHero } from '@/components/layout/page-hero';
import { BookingCalendar } from '@/components/booking/booking-calendar';

export const metadata = {
  title: 'Book a Call with Hamza Nouman — Free 30-Min Consultation',
  description: 'Schedule a free 30-minute consultation with Hamza Nouman, REALTOR® at Cityscape Real Estate. Discuss Mississauga investment properties, pre-construction, HST rebate, and more.',
  alternates: { canonical: '/book-call' },
  openGraph: {
    title: 'Book a Call — Free 30-Min Consultation with Hamza Nouman',
    description: 'Schedule a free consultation to discuss Mississauga investment properties, pre-construction condos, and the Ontario HST rebate.',
    url: 'https://www.mississaugainvestor.ca/book-call',
  },
};

export default function BookCallPage() {
  return (
    <>
      <PageHero
        eyebrow="Free 30-min call"
        title="Book a Free Consultation"
        subtitle="Pick a time that works for you. Hamza will call you for a free 30-minute chat about investment properties, pre-construction, the HST rebate, or anything real estate."
        align="center"
        compact
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Calendar */}
      <BookingCalendar />

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
