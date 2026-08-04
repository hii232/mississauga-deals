import { PageHero } from '@/components/layout/page-hero';
import { BookingCalendar } from '@/components/booking/booking-calendar';
import { fetchGoogleRating } from '@/lib/google-rating';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';

export const metadata = {
  title: { absolute: 'Book a Call - Free 30-Min Investor Consultation' },
  description: 'Book a free 30-minute call with Hamza Nouman, REALTOR®. Talk Mississauga investment properties, pre-construction and the Ontario HST rebate.',
  alternates: { canonical: '/book-call' },
  openGraph: {
    // Branded fallback OG (Next replaces, not merges, the parent openGraph).
    // Dimensions match /opengraph-image's own `size` export exactly (1200x630
    // PNG, verified there) - declaring them lets social crawlers reserve the
    // right preview aspect without fetching the image first.
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Book a Call - Free 30-Min Consultation with Hamza Nouman' }],
    title: 'Book a Call - Free 30-Min Consultation with Hamza Nouman',
    description: 'Schedule a free consultation to discuss Mississauga investment properties, pre-construction condos, and the Ontario HST rebate.',
    url: 'https://www.mississaugainvestor.ca/book-call',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book a Call - Free 30-Min Consultation with Hamza Nouman',
    description: 'Schedule a free consultation to discuss Mississauga investment properties, pre-construction condos, and the Ontario HST rebate.',
    images: ['/opengraph-image'],
  },
};

export default async function BookCallPage({ searchParams }) {
  // When the visitor clicks "Book a Viewing" on a property, the listing id +
  // address ride along in the URL so the booking notification tells Hamza
  // exactly which property they want to see.
  const listingId = typeof searchParams?.listing === 'string' ? searchParams.listing : '';
  const listingAddress = typeof searchParams?.addr === 'string' ? searchParams.addr : '';
  const listingPrice = typeof searchParams?.price === 'string' ? searchParams.price : '';

  // Server-side - keeps the Places API key out of the browser. The rating
  // block is conditionally rendered so a null response hides it cleanly rather
  // than showing a broken or empty chip. Same pattern as /about.
  const googleRating = await fetchGoogleRating();

  // FAQ items back the visible content on this page (free call, 30 min, RECO
  // licensed, no-pressure offer). Must stay in sync with any copy changes.
  const faqItems = [
    {
      question: 'Is the consultation really free?',
      answer:
        'Yes. The 30-minute call with Hamza Nouman is completely free and carries no obligation. You\'ll get honest, data-driven advice on Mississauga investment properties with no pressure to buy or sell.',
    },
    {
      question: 'What can I discuss during the call?',
      answer:
        'You can ask about any aspect of Mississauga real estate investing: cash flow analysis, cap rates, pre-construction condos, the Ontario HST new-housing rebate, BRRR strategy, neighbourhood comparisons, or a specific property you have in mind.',
    },
    {
      question: 'How long is the call?',
      answer:
        'Each consultation is 30 minutes. If you have a specific listing in mind, include the address when you book and Hamza will come prepared with the numbers.',
    },
    {
      question: 'Can I book a property viewing through this page?',
      answer:
        'Yes. If you found a property on MississaugaInvestor.ca, click "Book a Viewing" on that listing and the address and details carry forward automatically. Hamza will confirm the showing time after you submit.',
    },
    {
      question: 'Do I need to be ready to buy?',
      answer:
        'Not at all. Many investors use the call to think through their first investment or to stress-test a strategy before committing. Early-stage questions are always welcome.',
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Book a Call', url: 'https://www.mississaugainvestor.ca/book-call' },
        ]}
      />
      <FAQJsonLd items={faqItems} />
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
          only in one homepage band - so every visitor arriving straight here
          from a listing's "Book a Viewing" (the highest-intent path on the
          site) reached the calendar never having seen it. Same copy as the
          homepage band, on-brand accent tint, above the calendar so it is read
          before the time-slot decision. */}
      <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          {/* accent-dark on an accent tint, not success-green: #10B981 on a
              light band measures ~2.2:1 and fails AA (the same trap fixed on
              the homepage proof text and the blog sidebar label). */}
          <span className="inline-flex w-fit items-center rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-dark">
            Exclusive offer
          </span>
          <p className="text-sm leading-relaxed text-navy">
            <span className="font-semibold">Close with Hamza and your first month&rsquo;s mortgage is on us</span> -
            applied as a credit on closing, so you cash flow from day one. All investment properties qualify.
          </p>
        </div>
      </div>

      {/* Trust-signal strip - compact credential bar placed right before the
          calendar so the visitor's last impression before choosing a time slot
          is social proof + professional legitimacy.

          Sourcing rules:
          - Rating: server-side fetchGoogleRating() - null hides the chip.
            Stars are decorative (aria-hidden); the number is the readable claim.
          - RECO + brokerage: permanent factual credential, always shown.
          - "Free · no pressure": echoes the page commitment at the decision point.

          Contrast: gold stars are aria-hidden decorative; all readable text is
          navy on cloud (#1B2A4A on #F8FAFC = 12.6:1, comfortably WCAG AAA). */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-xl border border-gray-100 bg-cloud px-5 py-4 text-center">

        {googleRating && (
          <>
            <div className="flex items-center gap-1.5">
              <span aria-hidden="true" className="text-gold leading-none tracking-tight">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
              <span className="text-sm font-bold text-navy">{googleRating.rating.toFixed(1)}</span>
              <span className="text-xs text-muted">
                on Google &middot; {googleRating.reviewCount} review{googleRating.reviewCount === 1 ? '' : 's'}
              </span>
            </div>
            <div aria-hidden="true" className="hidden h-4 w-px bg-gray-200 sm:block" />
          </>
        )}

        <div className="flex items-center gap-1.5">
          {/* Shield-check: licensed professional */}
          <svg
            aria-hidden="true"
            className="h-4 w-4 flex-shrink-0 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          <span className="text-xs font-medium text-navy">Licensed by RECO &middot; Cityscape Real Estate Ltd.</span>
        </div>

        <div aria-hidden="true" className="hidden h-4 w-px bg-gray-200 sm:block" />

        <div className="flex items-center gap-1.5">
          {/* Clock: time commitment is minimal */}
          <svg
            aria-hidden="true"
            className="h-4 w-4 flex-shrink-0 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-xs text-muted">Free &middot; 30 min &middot; No obligation</span>
        </div>

      </div>

      {/* Calendar */}
      <BookingCalendar
        listingId={listingId}
        listingAddress={listingAddress}
        listingPrice={listingPrice}
      />

      {/* Disclosure footer - repeated credential note below the calendar for
          anyone who scrolled past the strip. */}
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
