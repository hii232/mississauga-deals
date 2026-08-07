import Link from 'next/link';
import { PageHero } from '@/components/layout/page-hero';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { CompsClient } from './comps-client';

// ─────────────────────────────────────────────────────────────────────────────
//  /sold-near-me - "find my home's comparables".
//
//  Hamza's feature ask (2026-08-06): enter your address, scan the area for
//  recent solds and active listings. Positioned honestly: HouseSigma and the
//  portals do show sold data, so the claim is never "the only place" - it is
//  "the only local site that pairs what sold near you with the competition
//  you'd face and a hand-pulled report from the person who'd sell it".
//
//  The page IS a seller-lead machine, by design: TRREB's VOW rules require a
//  terms agreement before sold data is shown, so the compliance wall and the
//  capture wall are the same wall (AuthGate, same as /recent-sales). The
//  second, deeper capture - the full-report form - earns the visitor's actual
//  home address, the highest-intent seller lead a site can produce.
//
//  Static shell + client island: everything above the fold renders without
//  JS or env vars; the data flow lives in comps-client.js.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata = {
  title: { absolute: 'What Sold Near Me in Mississauga - Real Sold Prices' },
  description:
    'Enter your postal code and see what actually sold near you in Mississauga - real close prices, days on market, and the active listings you would compete with.',
  alternates: { canonical: '/sold-near-me' },
  openGraph: {
    title: 'What Sold Near Me in Mississauga - Real Sold Prices',
    description:
      'Scan your area for recent sold prices and the active competition, then get a full comparables report on your specific home. Free.',
    url: 'https://www.mississaugainvestor.ca/sold-near-me',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'What Sold Near Me in Mississauga' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What Sold Near Me in Mississauga - Real Sold Prices',
    description:
      'Scan your area for recent sold prices and the active competition, then get a full comparables report on your specific home. Free.',
    images: ['/opengraph-image'],
  },
};

// Answers stay figure-free on purpose: a number in FAQ schema can be served by
// Google long after the market moves (the same rule every other FAQ on this
// site follows). The live numbers render inside the tool, not the schema.
const FAQ = [
  {
    question: 'How do I find out what homes sold for near me in Mississauga?',
    answer:
      'Enter your postal code above and pick your property type. The scan matches recent TRREB sold records in your postal district - real close prices and dates, not estimates - plus the active listings in your neighbourhood you would be competing against. Registering a free email unlocks the sold prices; TRREB rules require that agreement before sold data can be shown.',
  },
  {
    question: 'Why do I have to register to see sold prices?',
    answer:
      'Sold data is provided under TRREB\'s Virtual Office Website (VOW) rules, which require every visitor to agree to terms of use before sold records are displayed. Registration is free, takes one field, and unlocks sold data across the whole site - recent sales, neighbourhood comparables, and this scan.',
  },
  {
    question: 'Is this the same as a home appraisal or CMA?',
    answer:
      'No. The scan shows real sales matched by area and property type - useful context, but it cannot see your renovations, your lot, or your street\'s micro-market. The free full report goes further: we hand-pull the sales that genuinely compare to your specific home and walk you through them. For a formal valuation, that conversation is where to start.',
  },
];

export default function SoldNearMePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'What Sold Near Me', url: 'https://www.mississaugainvestor.ca/sold-near-me' },
        ]}
      />
      <FAQJsonLd items={FAQ} />

      <PageHero
        compact
        eyebrow="Free · Real TRREB sold records"
        title="What Sold Near Me in Mississauga"
        subtitle="Scan your postal district for real sold prices and the active listings you'd compete against - then get a hand-pulled comparables report on your specific home."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <CompsClient />

        {/* Static explainer - renders for crawlers and undecided visitors
            regardless of the gated tool state above. */}
        <div className="mt-12 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-navy mb-2">How the scan works</h2>
            <p className="text-sm text-navy/80 leading-relaxed">
              Your postal code&apos;s first three characters define your postal district - the honest
              resolution of MLS data, since exact coordinates aren&apos;t published. The scan pulls
              recent TRREB sold records in that district for your property type, shows each close
              price against its asking price, and lists the active competition in your neighbourhood,
              freshest first. Where too few nearby sales exist, it says so plainly instead of
              stretching the definition of &quot;near&quot;.
            </p>
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-navy mb-2">Where the scan stops and we start</h2>
            <p className="text-sm text-navy/80 leading-relaxed">
              An area scan can&apos;t see your finished basement, your lot depth, or that your street
              sells differently than the one behind it. That&apos;s the full report: we pull the sales
              that genuinely compare to your home and go through them with you by call or text - the
              same preparation we&apos;d do before listing it.{' '}
              <Link href="/sell" className="font-medium text-accent hover:text-accent-dark">
                Thinking of selling? Start here
              </Link>
              {' '}or{' '}
              <Link href="/book-call" className="font-medium text-accent hover:text-accent-dark">
                book a free 30-minute call
              </Link>
              .
            </p>
          </div>

          {/* Visible FAQ mirrors the schema */}
          <div>
            <h2 className="font-heading text-xl font-bold text-navy mb-3">Common questions</h2>
            <div className="space-y-4">
              {FAQ.map((f) => (
                <div key={f.question}>
                  <h3 className="text-sm font-bold text-navy">{f.question}</h3>
                  <p className="mt-1 text-sm text-navy/75 leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted border-t border-slate-200 pt-4">
            Hamza Nouman, Sales Representative · Cityscape Real Estate Ltd., Brokerage · Licensed by
            RECO. Listing and sold data © TRREB, deemed reliable but not guaranteed. Nothing on this
            page is an appraisal, valuation, or financial advice.
          </p>
        </div>
      </div>
    </>
  );
}
