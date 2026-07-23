import Link from 'next/link';
import { StickyMobileCTA } from '@/components/layout/sticky-mobile-cta';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/layout/page-hero';
import InlineCTA from '@/components/ui/inline-cta';
import { RelatedGuides } from '@/components/ui/related-guides';

const YEAR = new Date().getFullYear();

export const metadata = {
  title: `Hurontario LRT Real Estate Impact — Mississauga Investor Guide (${YEAR})`,
  description: `How the Hurontario LRT (Hazel McCallion Line) affects Mississauga real estate: the corridor it serves, why rapid transit tends to support rents and values near stations, and how investors should weigh it in Port Credit, Cooksville and City Centre.`,
  keywords: [
    'hurontario lrt real estate impact',
    'hurontario lrt real estate',
    'hazel mccallion line real estate',
    'mississauga lrt property values',
    'hurontario lrt investment',
  ],
  alternates: { canonical: '/hurontario-lrt-real-estate' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: `Hurontario LRT Real Estate Impact (${YEAR})`,
    description: 'What the Hurontario LRT (Hazel McCallion Line) means for Mississauga investors along the Port Credit → City Centre → Cooksville corridor.',
    url: 'https://www.mississaugainvestor.ca/hurontario-lrt-real-estate',
  },
};

// Honest, general guidance. Transit's effect on values/rents is described as a
// well-documented tendency, not a promise, and no specific appreciation figures
// are fabricated — readers are routed to the neighbourhood guides + live
// listings + market data for real numbers.
const LRT_FAQ = [
  {
    question: 'What is the Hurontario LRT?',
    answer:
      'The Hurontario LRT, officially the Hazel McCallion Line, is a light rail transit line running roughly 18 km along Hurontario Street between Port Credit in south Mississauga and the Brampton Gateway Terminal to the north. It adds frequent, dedicated rail service down the spine of the city and connects to GO Transit at Port Credit and Cooksville and to MiWay bus routes across Mississauga.',
  },
  {
    question: 'Which Mississauga neighbourhoods does the LRT affect most?',
    answer:
      'The corridor runs straight through several of the city’s densest, most investable nodes: Port Credit at the south end (with its GO station and waterfront), Cooksville (a GO and transit hub mid-line), and Mississauga City Centre around Square One — the downtown core with the most condo supply. Areas immediately along Hurontario Street and within walking distance of a stop stand to benefit most from the improved connectivity.',
  },
  {
    question: 'Does being near an LRT stop raise property value or rent?',
    answer:
      'It tends to. Proximity to rapid transit is one of the most consistently documented drivers of housing demand: it widens the pool of renters and buyers who can live without a car, improves walkability scores, and supports higher rents and resale values near stations. That said, it is a tendency, not a guarantee — some of the expected uplift can already be priced in once a line is announced and under construction, and effects vary block by block. Model the actual rent and cash flow for a specific property rather than assuming a transit premium.',
  },
  {
    question: 'When does the Hurontario LRT open?',
    answer:
      'Metrolinx, the provincial agency building the line, publishes the current construction and opening timeline — always check the official source for the latest dates rather than relying on older estimates. For investing decisions, what matters most is that the route, stations and connections are fixed and the corridor is being built out, so the long-term connectivity is locked in.',
  },
  {
    question: 'Is it a good time to invest along the Hurontario corridor?',
    answer:
      'The corridor concentrates transit, jobs (Square One / City Centre), GO connections and rental demand, which is a strong long-term foundation for a rental property. Whether a specific listing is a good buy still comes down to its price, rent, and carrying costs — cap rate, cash flow and break-even rent. Use the neighbourhood guides for area context and the listing analysis tools to check the numbers on any property before you commit.',
  },
];

const NODES = [
  {
    title: 'Port Credit',
    slug: 'port-credit',
    body: 'The southern anchor of the line, with its own GO station, a walkable village and waterfront. Strong tenant appeal and among the corridor’s most established resale demand.',
  },
  {
    title: 'Mississauga City Centre',
    slug: 'city-centre',
    body: 'The downtown core around Square One — the city’s largest concentration of condo supply, jobs and amenities, and the node most shaped by transit-oriented density.',
  },
  {
    title: 'Cooksville',
    slug: 'cooksville',
    body: 'A mid-line transit hub with its own GO station, more affordable entry prices and a large existing rental pool — often where the corridor’s cash-flow math works best.',
  },
  {
    title: 'The Hurontario corridor',
    slug: 'hurontario',
    body: 'The street itself is intensifying with mid-rise and high-rise development along the route. Being within walking distance of a stop is the feature tenants increasingly search for.',
  },
];

export default function HurontarioLrtRealEstatePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Hurontario LRT & Real Estate', url: 'https://www.mississaugainvestor.ca/hurontario-lrt-real-estate' },
        ]}
      />
      <FAQJsonLd items={LRT_FAQ} />

      <PageHero
        compact
        eyebrow={`Mississauga · Transit & Investing · ${YEAR}`}
        title="Hurontario LRT Real Estate Impact"
        subtitle="The Hazel McCallion Line runs the length of Hurontario, linking Port Credit, City Centre and Cooksville — here’s how investors should read it, then check the numbers on real listings."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Direct answer */}
        <div className="rounded-2xl border border-slate-200 bg-cloud p-6 mb-10">
          <h2 className="font-heading font-bold text-lg text-navy mb-2">The short answer</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            The Hurontario LRT (officially the <strong>Hazel McCallion Line</strong>) brings dedicated light-rail
            service down Hurontario Street, connecting Port Credit, Mississauga City Centre and Cooksville and tying
            into GO Transit. Rapid transit is one of the most reliable long-term supports for rental demand and property
            values near stations — a <strong>tendency, not a guarantee</strong>, and often partly priced in once a line
            is under construction. For an investor, the corridor is a strong foundation; whether a given property is a
            good buy still comes down to its own cap rate, cash flow and break-even rent.
          </p>
          <Link
            href="/listings"
            className="btn-primary !px-6 !py-2.5 no-underline text-sm inline-block mt-4"
          >
            Browse investment listings on the corridor →
          </Link>
        </div>

        {/* Nodes */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">The nodes that matter</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {NODES.map((n) => (
            <div key={n.slug} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{n.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{n.body}</p>
              <Link
                href={`/neighbourhoods/${n.slug}`}
                className="text-xs font-semibold text-accent hover:text-accent-dark no-underline"
              >
                {n.title} investor guide →
              </Link>
            </div>
          ))}
        </div>

        {/* Why transit matters */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">Why transit moves the numbers</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-5 mb-10">
          <ul className="space-y-2 text-sm text-slate-700 leading-relaxed list-disc pl-5">
            <li><strong>Bigger tenant pool.</strong> A stop within walking distance lets renters live car-free, widening demand and supporting occupancy and rent.</li>
            <li><strong>Walkability &amp; convenience.</strong> Transit access lifts walk/transit scores, which buyers and tenants increasingly filter for.</li>
            <li><strong>Long-term connectivity is locked in.</strong> The route, stations and GO connections are fixed, so the corridor’s access advantage is durable.</li>
            <li><strong>But check for priced-in premiums.</strong> Some uplift can already be in the asking price near confirmed stations — always run the actual cash-flow math.</li>
          </ul>
        </div>

        {/* Inline email capture — convert the reader who isn't ready to browse yet */}
        <InlineCTA variant="newsletter" className="mb-10" />

        {/* Visible FAQ (mirrors the schema) */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">Hurontario LRT &amp; real estate: common questions</h2>
        <div className="space-y-4 mb-10">
          {LRT_FAQ.map((qa) => (
            <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{qa.question}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{qa.answer}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-navy p-8 text-center">
          <h2 className="font-heading font-bold text-xl text-white mb-2">Find a cash-flowing property on the corridor</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            Browse Mississauga investment listings already scored for cash flow and cap rate, or check the latest market
            numbers before you buy near the line.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/listings" className="btn-primary !px-6 no-underline text-center">
              Browse Listings
            </Link>
            <Link
              href="/market-pulse"
              className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 no-underline text-center"
            >
              Market Pulse
            </Link>
          </div>
        </div>

        <RelatedGuides current="/hurontario-lrt-real-estate" />
      </div>
      <StickyMobileCTA href="/listings?lrt=1" label="See LRT-Corridor Listings" />
    </>
  );
}
