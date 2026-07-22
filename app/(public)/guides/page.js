import Link from 'next/link';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/layout/page-hero';
import { GUIDES } from '@/components/ui/related-guides';
import InlineCTA from '@/components/ui/inline-cta';

const YEAR = new Date().getFullYear();
const BASE = 'https://www.mississaugainvestor.ca';

export const metadata = {
  title: `Mississauga Real Estate Investor Guides (${YEAR})`,
  description: `Free, honest guides for Mississauga real estate investors: cash-flow-positive properties, rent vs buy, townhouse vs condo, the Hurontario LRT's impact, and landlord insurance — each with real numbers and a link to the tools.`,
  keywords: [
    'mississauga real estate investor guides',
    'real estate investing guides mississauga',
    'mississauga investment property guides',
    'gta real estate investing guide',
  ],
  alternates: { canonical: '/guides' },
  openGraph: {
    title: `Mississauga Real Estate Investor Guides (${YEAR})`,
    description: 'Free, honest guides for Mississauga real estate investors — cash flow, rent vs buy, townhouse vs condo, the LRT, and landlord insurance.',
    url: `${BASE}/guides`,
  },
};

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <PageHero
        compact
        eyebrow={`Mississauga · Investing · ${YEAR}`}
        title="Real Estate Investor Guides"
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
    </>
  );
}
