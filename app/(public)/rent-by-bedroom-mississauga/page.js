import Link from 'next/link';
import { StickyMobileCTA } from '@/components/layout/sticky-mobile-cta';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/layout/page-hero';
import InlineCTA from '@/components/ui/inline-cta';
import { RelatedGuides } from '@/components/ui/related-guides';
import { HOOD_RENTS } from '@/lib/constants';
import { slugifyPlace } from '@/lib/utils/format';

const YEAR = new Date().getFullYear();

export const metadata = {
  title: { absolute: `Mississauga Rent by Bedroom (${YEAR})` },
  description:
    'What renters actually pay by bedroom count across Mississauga in 2026 - average, lowest and highest neighbourhood, from the site’s own rent model.',
  keywords: [
    'mississauga rent by bedroom',
    'average rent mississauga 2026',
    '1 bedroom rent mississauga',
    '2 bedroom rent mississauga',
    'mississauga rent prices by neighbourhood',
  ],
  alternates: { canonical: '/rent-by-bedroom-mississauga' },
  openGraph: {
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `Mississauga Rent by Bedroom (${YEAR})` }],
    title: `Mississauga Rent by Bedroom (${YEAR})`,
    description: "Average, lowest and highest rent by bedroom count across Mississauga neighbourhoods, computed from the site’s own rent model.",
    url: 'https://www.mississaugainvestor.ca/rent-by-bedroom-mississauga',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Mississauga Rent by Bedroom (${YEAR})`,
    description: "Average, lowest and highest rent by bedroom count across Mississauga neighbourhoods, computed from the site’s own rent model.",
    images: ['/opengraph-image'],
  },
};

// BED_LABEL / BEDS drive the table below. Every number in it is computed live
// from HOOD_RENTS (lib/constants.js) at render time - there is no second,
// hand-typed copy that could drift from the same table the cash-flow engine
// uses for every listing, and no page needs updating when that table is
// recalibrated against real lease comps (see IMPROVEMENT_BACKLOG.md item 12).
const BEDS = [0, 1, 2, 3, 4, 5];
const BED_LABEL = {
  0: 'Studio / Bachelor',
  1: '1 Bedroom',
  2: '2 Bedroom',
  3: '3 Bedroom',
  4: '4 Bedroom',
  5: '5+ Bedroom',
};

function computeBedroomStats() {
  const hoods = Object.entries(HOOD_RENTS);
  return BEDS.map((beds) => {
    const values = hoods
      .map(([hood, table]) => ({ hood, rent: table[beds] }))
      .filter((v) => v.rent > 0);
    const rents = values.map((v) => v.rent);
    const avg = Math.round(rents.reduce((s, r) => s + r, 0) / rents.length / 25) * 25;
    const low = values.reduce((min, v) => (v.rent < min.rent ? v : min), values[0]);
    const high = values.reduce((max, v) => (v.rent > max.rent ? v : max), values[0]);
    return { beds, label: BED_LABEL[beds], avg, low, high };
  });
}

const RENT_FAQ = [
  {
    question: 'How much does a 2-bedroom apartment rent for in Mississauga?',
    answer:
      'It varies a lot by neighbourhood. Across the 24 neighbourhoods this site tracks, the typical range runs from the low $2,500s in the most affordable areas up to $3,200+ near the waterfront and downtown core, with a city-wide average in between. The table on this page shows the current average, lowest and highest by bedroom count - sort by the neighbourhood guides for a specific area’s number.',
    // Rendered under the visible answer only - FAQJsonLd ignores this field,
    // so no HTML ever leaks into the JSON-LD answer string.
    link: { href: '/neighbourhoods', label: 'Browse all neighbourhood guides →' },
  },
  {
    question: 'Which Mississauga neighbourhood has the lowest rent?',
    answer:
      'Malton consistently has the lowest rent across every bedroom count in this model, which is also why it shows the strongest rental yields for investors on this site - a low purchase price paired with genuinely low rent, not an inflated one. Areas near the waterfront and GO stations (Port Credit, Mineola, Lorne Park) sit at the top of the range - those are priced more for appreciation than for cash flow.',
  },
  {
    question: 'Why does rent vary so much between neighbourhoods for the same bedroom count?',
    answer:
      'Location drives rent independently of purchase price: proximity to transit (GO stations, the Hurontario LRT corridor), employer density near Pearson Airport and City Centre, school catchments, and general desirability all matter to a tenant the way they matter to a buyer. Two 3-bedroom homes can rent for very different amounts even at similar purchase prices - which is exactly why cap rate, not price alone, is what determines whether a property is a good rental investment.',
  },
  {
    question: 'Does a legal basement suite change these numbers?',
    answer:
      'Substantially - a legal second suite adds a separate rent cheque on top of the main unit’s rent shown here, which is what moves many Mississauga properties from negative to positive cash flow. The figures on this page are for the main unit only; listings flagged with a legal or potential suite show the combined total on their own page.',
  },
  {
    question: 'How are these rent estimates calculated?',
    answer:
      'They come from the same per-neighbourhood, per-bedroom model that estimates cash flow and cap rate on every listing across the site, periodically checked against real, recently-leased MLS comparables and adjusted where the evidence shows a meaningful gap - see the score methodology page for the full calculation. They are estimates, not a guarantee for any specific unit; condition, parking, and exact location all move the number.',
  },
];

export default function RentByBedroomPage() {
  const stats = computeBedroomStats();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Rent by Bedroom', url: 'https://www.mississaugainvestor.ca/rent-by-bedroom-mississauga' },
        ]}
      />
      <FAQJsonLd items={RENT_FAQ} />

      <PageHero
        compact
        eyebrow={`Mississauga & GTA · Rental Market · ${YEAR}`}
        title={`Mississauga Rent by Bedroom (${YEAR})`}
        subtitle="What renters actually pay by bedroom count, and how much it swings across the city's 24 neighbourhoods - straight from the same model that scores every listing here."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-slate-200 bg-cloud p-6 mb-10">
          <h2 className="font-heading font-bold text-lg text-navy mb-2">The short answer</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Rent in Mississauga rises steadily with bedroom count, but the bigger swing is by <strong>location</strong>:
            the gap between the city&apos;s most affordable and most expensive neighbourhoods for the same bedroom count
            is often $700&ndash;$1,000/mo. The table below shows the average, lowest and highest neighbourhood for each
            bedroom count, computed from the site&apos;s own rent model.
          </p>
          <Link href="/listings" className="btn-primary !px-6 !py-2.5 no-underline text-sm inline-block mt-4">
            Browse scored Mississauga listings →
          </Link>
        </div>

        <h2 className="font-heading font-bold text-xl text-navy mb-4">Rent by bedroom count</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 mb-3">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-cloud">
                <th className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-navy">Bedrooms</th>
                <th className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-navy">City average</th>
                <th className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-navy">Lowest</th>
                <th className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-navy">Highest</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row, i) => (
                <tr key={row.beds} className={i % 2 ? 'bg-white' : 'bg-slate-50/60'}>
                  <td className="px-4 py-3 font-semibold text-navy">{row.label}</td>
                  <td className="px-4 py-3 text-slate-600">${row.avg.toLocaleString()}/mo</td>
                  <td className="px-4 py-3 text-slate-600">
                    ${row.low.rent.toLocaleString()}/mo{' '}
                    <span className="text-slate-500">
                      (<Link href={`/neighbourhoods/${slugifyPlace(row.low.hood)}`} className="hover:text-accent underline decoration-slate-300 underline-offset-2 transition-colors">{row.low.hood}</Link>)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    ${row.high.rent.toLocaleString()}/mo{' '}
                    <span className="text-slate-500">
                      (<Link href={`/neighbourhoods/${slugifyPlace(row.high.hood)}`} className="hover:text-accent underline decoration-slate-300 underline-offset-2 transition-colors">{row.high.hood}</Link>)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mb-10">
          Estimates from this site&apos;s own per-neighbourhood rent model, the same figures used to score every listing
          - not a guarantee for any specific unit. Figures are periodically recalibrated against real,
          recently-leased MLS comparables; condition, parking and exact location move the number for a real property.
        </p>

        <InlineCTA variant="newsletter" className="mb-10" />

        <h2 className="font-heading font-bold text-xl text-navy mb-4">Rent by bedroom: common questions</h2>
        <div className="space-y-4 mb-10">
          {RENT_FAQ.map((qa) => (
            <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{qa.question}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{qa.answer}</p>
              {qa.link && (
                <Link href={qa.link.href} className="mt-2 inline-block text-xs font-medium text-accent hover:text-accent-dark no-underline">
                  {qa.link.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Landlord cross-link: this page's second audience is owners checking
            their own rent - /landlords is the capture surface built for them.
            Distinct anchor text (internal-link rule: never the same anchor as
            another destination). */}
        <p className="mb-8 text-sm leading-relaxed text-navy/80">
          Own a rental and wondering where <em>your</em> unit falls in these ranges?{' '}
          <Link href="/landlords" className="font-medium text-accent hover:text-accent-dark">
            Get a free rent check for your rental
          </Link>{' '}
          - we pull the recent signed leases for units like yours and call or text you the range.
        </p>

        <div className="rounded-2xl bg-navy p-8 text-center">
          <h2 className="font-heading font-bold text-xl text-white mb-2">See rent-backed cash flow on a real listing</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            Every Mississauga listing is scored with its own neighbourhood rent estimate, cap rate and cash flow -
            not a city-wide average.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/listings" className="btn-primary !px-6 no-underline text-center">
              Browse Listings
            </Link>
            <Link
              href="/score-methodology"
              className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 no-underline text-center"
            >
              How Scores Are Calculated
            </Link>
          </div>
        </div>

        <RelatedGuides current="/rent-by-bedroom-mississauga" />
      </div>
      <StickyMobileCTA href="/listings" label="Browse Scored Listings" />
    </>
  );
}
