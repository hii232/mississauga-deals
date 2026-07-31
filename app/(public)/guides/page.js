import Link from 'next/link';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/layout/page-hero';
import { GUIDES } from '@/components/ui/related-guides';
import InlineCTA from '@/components/ui/inline-cta';
import { StickyMobileCTA } from '@/components/layout/sticky-mobile-cta';

const YEAR = new Date().getFullYear();
const BASE = 'https://www.mississaugainvestor.ca';

export const metadata = {
  title: { absolute: `Mississauga Real Estate Investor Guides (${YEAR})` },
  description: `Free guides for Mississauga investors: cash-flow-positive properties, rent vs buy, townhouse vs condo, the Hurontario LRT, and landlord insurance.`,
  keywords: [
    'mississauga real estate investor guides',
    'real estate investing guides mississauga',
    'mississauga investment property guides',
    'gta real estate investing guide',
  ],
  alternates: { canonical: '/guides' },
  openGraph: {
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `Mississauga Real Estate Investor Guides (${YEAR})` }],
    title: `Mississauga Real Estate Investor Guides (${YEAR})`,
    description: 'Free, honest guides for Mississauga real estate investors — cash flow, rent vs buy, townhouse vs condo, the LRT, and landlord insurance.',
    url: `${BASE}/guides`,
  },
  twitter: {
    card: 'summary_large_image',
    title: `Mississauga Real Estate Investor Guides (${YEAR})`,
    description: 'Free, honest guides for Mississauga real estate investors — cash flow, rent vs buy, townhouse vs condo, the LRT, and landlord insurance.',
    images: ['/opengraph-image'],
  },
};

// Hub-level FAQ — questions a visitor landing on /guides would ask.
// Distinct from the per-guide FAQs (each guide page carries its own).
// Google requires these to be visible on the page — see the FAQ section below.
const GUIDES_FAQ = [
  {
    question: 'What real estate investor guides are available on this site?',
    answer:
      'There are 13 free guides covering core Mississauga investment topics: cash-flow-positive properties, best cash flow neighbourhoods, rent vs buy, the seven-bedroom rooming-house model, townhouse vs condo comparison, the Malton neighbourhood, the Hurontario LRT corridor, Cooksville and the LRT, rental property insurance, the Ontario HST new-housing rebate, Mississauga vs Brampton vs Hamilton, rent by bedroom across all 24 neighbourhoods, and adding a legal second unit.',
  },
  {
    question: 'Are these Mississauga real estate investor guides free?',
    answer:
      'Yes — every guide is free to read with no account required. The site is published by Hamza Nouman, a licensed Mississauga real estate Sales Representative, to help investors make more informed decisions.',
  },
  {
    question: 'Which guide should I read first as a new Mississauga investor?',
    answer:
      'Start with the cash-flow-positive properties guide to understand what gross rent yield, cap rate, and monthly cash flow you need at current interest rates. Then check the best cash flow neighbourhoods guide to see which of the 24 Mississauga areas meets those thresholds right now.',
  },
  {
    question: 'Do these guides include current 2026 Mississauga market data?',
    answer:
      'Yes. The guides are updated for 2026 and reference current average prices, rent ranges, and financing assumptions. Each guide links to live tools — the mortgage calculator, the investor score, and neighbourhood data pages — so the numbers you act on reflect today\'s market.',
  },
  {
    question: 'Can I use these guides if I\'m investing outside Mississauga?',
    answer:
      'Several guides apply to the broader GTA: the Mississauga vs Brampton vs Hamilton comparison, the Hurontario LRT corridor analysis, and the cash-flow model all include GTA-wide context. The rent-by-bedroom and neighbourhood-specific guides are Mississauga-focused.',
  },
];

// ItemList structured data so search engines understand /guides as the
// collection page for the guide set (helps discover/rank each guide).
const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Mississauga Real Estate Investor Guides',
  itemListElement: GUIDES.map((g, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${BASE}${g.href}`,
    name: g.title,
  })),
};

export default function GuidesIndexPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: `${BASE}/` },
          { name: 'Investor Guides', url: `${BASE}/guides` },
        ]}
      />
      <FAQJsonLd items={GUIDES_FAQ} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <PageHero
        compact
        eyebrow={`Mississauga · Investing · ${YEAR}`}
        title="Mississauga Real Estate Investor Guides"
        subtitle="Straight-talking guides for Mississauga and GTA investors — real numbers, no fluff, each one links straight to the tools and listings so you can act on it."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GUIDES.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="group rounded-xl border border-slate-200 bg-white p-5 no-underline transition-all duration-300 hover:border-accent/30 hover:shadow-md"
            >
              <h2 className="font-heading font-semibold text-base text-navy transition-colors group-hover:text-accent">{g.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{g.blurb}</p>
              <span className="mt-3 inline-block text-xs font-semibold text-accent">Read guide →</span>
            </Link>
          ))}
        </div>

        {/* FAQ section — content must be visible for FAQPage rich results (Google policy) */}
        <section className="mt-14" aria-label="Frequently asked questions about our investor guides">
          <h2 className="font-heading font-bold text-xl text-navy mb-6">Common Questions</h2>
          <div className="space-y-4">
            {GUIDES_FAQ.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-slate-200 bg-white open:border-accent/30 open:shadow-sm transition-all"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-heading font-semibold text-sm text-navy list-none [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span className="shrink-0 text-accent text-lg leading-none group-open:rotate-45 transition-transform duration-200" aria-hidden="true">+</span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Inline email capture — this is a search-traffic landing, so capture */}
        <InlineCTA variant="newsletter" className="mt-12" />

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-navy p-8 text-center">
          <h2 className="font-heading font-bold text-xl text-white mb-2">Ready to put a guide to work?</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            Browse Mississauga listings already scored for cash flow and cap rate, or book a free strategy call with Hamza.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/listings" className="btn-primary !px-6 no-underline text-center">
              Browse Listings
            </Link>
            <Link
              href="/book-call"
              className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 no-underline text-center"
            >
              Book a Free Call
            </Link>
          </div>
        </div>
      </div>
      <StickyMobileCTA href="/alerts" label="Get Free Deal Alerts" />
    </>
  );
}
