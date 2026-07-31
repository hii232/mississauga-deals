import Link from 'next/link';
import { StickyMobileCTA } from '@/components/layout/sticky-mobile-cta';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/layout/page-hero';
import InlineCTA from '@/components/ui/inline-cta';
import { RelatedGuides } from '@/components/ui/related-guides';

const YEAR = new Date().getFullYear();

export const metadata = {
  title: { absolute: `Legal Second Unit in Mississauga (${YEAR}): Requirements & Permit Guide` },
  description: `How to add a legal second unit (basement suite or accessory apartment) in Mississauga: Ontario Building Code requirements, the permit process, and the cash-flow math.`,
  keywords: [
    'legal second unit mississauga',
    'second suite requirements ontario',
    'how to add legal basement suite mississauga',
    'basement apartment registration mississauga',
    'secondary suite permit ontario',
    'legal basement apartment requirements ontario',
    'additional dwelling unit mississauga',
  ],
  alternates: { canonical: '/legal-second-unit-mississauga' },
  openGraph: {
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `Legal Second Unit in Mississauga (${YEAR})` }],
    title: `Legal Second Unit in Mississauga (${YEAR}): Requirements & Permit Guide`,
    description: 'Ontario Building Code requirements, the City of Mississauga permit process, and the cash-flow math for adding a legal basement suite.',
    url: 'https://www.mississaugainvestor.ca/legal-second-unit-mississauga',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Legal Second Unit in Mississauga (${YEAR})`,
    description: 'Requirements, permit steps, and the cash-flow math for a legal basement suite in Mississauga.',
    images: ['/opengraph-image'],
  },
};

// General guidance only — sourced from Ontario Building Code (Part 9) and
// City of Mississauga zoning policy. Confirm ALL requirements and current
// permit fees directly with the City of Mississauga Building Division before
// proceeding: 905-615-4030 or mississauga.ca/building.
const SUITE_FAQ = [
  {
    question: 'Do I need a building permit to add a second unit in Mississauga?',
    answer:
      'Yes. Any significant construction or renovation to create a second residential unit — including framing, plumbing, electrical, HVAC, fire separation and egress modifications — requires a building permit from the City of Mississauga Building Division. Doing the work without a permit is a bylaw violation, can make the unit illegal to rent, and can cause problems when you sell. Permits are applied for at the City\'s Building Division (mississauga.ca/building) or in person at Mississauga Civic Centre.',
  },
  {
    question: 'What are the key Ontario Building Code requirements for a second unit?',
    answer:
      'The Ontario Building Code (Part 9, Subsection 9.7) sets minimum standards for secondary suites. Core requirements include: minimum ceiling height of 1.95 m (about 6\'5") throughout habitable space; at least one egress window in each bedroom (minimum opening of 0.35 m², minimum 380 mm in any direction); a minimum 30-minute fire separation between the secondary unit and the rest of the house, including interconnected smoke alarms; and a carbon monoxide detector where a fuel-burning appliance or attached garage is present. Confirm the full current requirements with a licensed building contractor and the City of Mississauga.',
  },
  {
    question: 'Does a legal second unit need its own separate street entrance?',
    answer:
      'Ontario Building Code does NOT require a second unit to have a separate exterior entrance that faces the street. A side or rear entrance is common and acceptable. What is required is that each unit has its own safe means of egress — which is typically the existing front door shared with the main unit, plus the unit\'s own exit path from its sleeping areas through egress windows that meet minimum size requirements. Confirm the acceptable egress configuration for your specific layout with your contractor and the City.',
  },
  {
    question: 'How long does the Mississauga building permit process take for a second unit?',
    answer:
      'Processing times vary based on the project complexity and current demand at the Building Division. A straightforward residential second unit permit can take anywhere from several weeks to a few months from application to approval. Construction then requires multiple inspections (framing, rough-in plumbing, rough-in electrical, insulation, final) that must be booked through the City. Budget several months from application to a legally rentable unit, and confirm current timelines with the Building Division at 905-615-4030.',
  },
  {
    question: 'How much does a legal second unit add to my cash flow?',
    answer:
      'A legal basement suite in Mississauga typically rents for roughly $1,800 to $2,600 per month for a 1–2 bedroom unit, depending on neighbourhood, size, and finish level. On a property already carrying a mortgage, that rent often flips a slightly negative cash flow into positive — it\'s the most common single lever that makes a Mississauga property pencil out. Use the mortgage calculator on this site to model the full picture: mortgage, property tax, insurance, maintenance, vacancy, and the added rent.',
  },
];

const REQUIREMENTS = [
  {
    title: 'Ceiling height',
    body: 'The Ontario Building Code requires a minimum ceiling height of 1.95 m (approximately 6\'5") throughout the habitable floor area of the secondary suite. Measure your basement carefully before purchasing — this is the most common reason a basement cannot become a legal suite.',
  },
  {
    title: 'Egress windows',
    body: 'Every bedroom in the second unit must have at least one window that can be opened from the inside to allow escape in an emergency. The minimum opening area is 0.35 m², with no dimension less than 380 mm. Existing basement windows often need replacing or enlarging to meet this requirement.',
  },
  {
    title: 'Fire separation',
    body: 'A minimum 30-minute fire separation must exist between the secondary unit and the primary unit, including walls, ceilings, and any shared structural elements. Interconnected smoke alarms (wired or wireless) must be installed so that an alarm in one unit alerts the other.',
  },
  {
    title: 'Smoke & CO alarms',
    body: 'Smoke alarms are required on every storey and near every sleeping area in both units. A carbon monoxide detector is required wherever there is a fuel-burning appliance (furnace, fireplace, gas stove) or an attached garage. Alarms between units must be interconnected.',
  },
  {
    title: 'Electrical',
    body: 'All electrical work must be performed by a licensed electrical contractor. An Electrical Safety Authority (ESA) permit and inspection are required separately from the City building permit. ESA approves the electrical before a final building inspection can be passed.',
  },
  {
    title: 'Zoning compliance',
    body: 'Ontario\'s Planning Act requires all Mississauga residential zones to permit at least one secondary unit in a detached, semi-detached, or rowhouse. Confirm your property\'s specific zoning and any site-specific conditions at mississauga.ca/building before starting — most residential properties qualify, but some older plans or heritage properties may have restrictions.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Assess your property',
    body: 'Check ceiling height throughout the basement — 1.95 m is the common gatekeeping number. Identify where egress windows will go and whether electrical and HVAC capacity supports a second unit.',
  },
  {
    num: '02',
    title: 'Hire a licensed contractor & apply for permits',
    body: 'A licensed general contractor familiar with second units will prepare drawings and apply for the City of Mississauga building permit. Your electrician will apply for an ESA permit at the same time. The City reviews and approves drawings before construction begins.',
  },
  {
    num: '03',
    title: 'Complete construction and inspections',
    body: 'The City will inspect at key stages (framing, rough-in mechanical/plumbing, insulation, final). ESA inspects electrical separately. All inspections must pass before the unit is legal to occupy.',
  },
  {
    num: '04',
    title: 'List and rent',
    body: 'Once the final inspection is passed, the unit is legally permitted. Confirm your landlord insurance policy covers a two-unit property, draft a lease under the Ontario Residential Tenancies Act, and list the unit.',
  },
];

export default function LegalSecondUnitPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Investor Guides', url: 'https://www.mississaugainvestor.ca/guides' },
          { name: 'Legal Second Unit in Mississauga', url: 'https://www.mississaugainvestor.ca/legal-second-unit-mississauga' },
        ]}
      />
      <FAQJsonLd items={SUITE_FAQ} />

      <PageHero
        compact
        eyebrow={`Mississauga · Investors · ${YEAR}`}
        title="Legal Second Unit in Mississauga"
        subtitle="Ontario Building Code requirements, the permit process, and the cash-flow math for adding a legal basement suite — the most common way a Mississauga property flips from negative to positive cash flow."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Direct answer */}
        <div className="rounded-2xl border border-slate-200 bg-cloud p-6 mb-10">
          <h2 className="font-heading font-bold text-lg text-navy mb-2">The short answer</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Adding a <strong>legal second unit</strong> (basement suite or accessory apartment) in Mississauga is{' '}
            <strong>permitted in virtually every residential zone</strong> and is often the single biggest lever that
            makes a property cash-flow positive. You need a <strong>City of Mississauga building permit</strong> and the
            finished unit must meet Ontario Building Code minimums — primarily around ceiling height, egress windows,
            fire separation, and smoke/CO alarms. The permit process typically takes several months end to end, and all
            electrical work requires a separate ESA permit. Once the final inspection passes, the unit is legal to rent.
          </p>
          <Link
            href="/mortgage-calculator"
            className="btn-primary !px-6 !py-2.5 no-underline text-sm inline-block mt-4"
          >
            Model the cash flow with a second suite →
          </Link>
        </div>

        {/* Why it matters for investors */}
        <h2 className="font-heading font-bold text-xl text-navy mb-3">Why a legal second unit changes the math</h2>
        <p className="text-sm text-slate-700 leading-relaxed mb-6">
          A legal basement suite in Mississauga typically adds{' '}
          <strong>$1,800–$2,600 per month in rental income</strong> depending on the neighbourhood, size, and finish.
          On a property already carrying a mortgage, that second rent often flips a slightly negative monthly cash flow
          into positive — it is the most common structural reason a Mississauga property pencils out for a buy-and-hold
          investor. An <em>illegal</em> suite adds the same income but carries significant risk: lender problems at
          renewal, insurance gaps, tenant tribunal exposure, and liability if there is a fire. A permitted, inspected
          suite removes those risks.
        </p>
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 mb-10">
          <p className="text-sm text-navy leading-relaxed">
            <strong>Browse listings with second-suite potential.</strong>{' '}
            Listings on this site flag legal suites and suite-potential properties so you can filter straight to
            properties where the math already works or where a permit will unlock it.
          </p>
          <Link
            href="/listings"
            className="mt-3 inline-block text-sm font-semibold text-accent hover:text-accent-dark no-underline"
          >
            Browse scored listings →
          </Link>
        </div>

        {/* Key requirements */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">Key Ontario Building Code requirements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {REQUIREMENTS.map((r) => (
            <div key={r.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{r.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>

        {/* Permit process */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">The permit process, step by step</h2>
        <div className="space-y-4 mb-10">
          {STEPS.map((s) => (
            <div key={s.num} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                {s.num}
              </span>
              <div>
                <h3 className="font-heading font-semibold text-sm text-navy mb-1">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Inline email capture */}
        <InlineCTA variant="newsletter" className="mb-10" />

        {/* Visible FAQ */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">Second unit questions investors ask</h2>
        <div className="space-y-4 mb-10">
          {SUITE_FAQ.map((qa) => (
            <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{qa.question}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{qa.answer}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 mb-10">
          General guidance based on the Ontario Building Code and City of Mississauga zoning policy as of {YEAR}.
          Requirements, permit fees and processing times change — confirm all specifics with the{' '}
          <strong>City of Mississauga Building Division</strong> (905-615-4030, mississauga.ca/building) and a licensed
          contractor before proceeding. Not legal, engineering, or tax advice.
        </p>

        {/* Final CTA */}
        <div className="rounded-2xl bg-navy p-8 text-center">
          <h2 className="font-heading font-bold text-xl text-white mb-2">
            Find properties where the second-suite math already works
          </h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            Browse Mississauga listings scored for cash flow — filtered to properties with legal suites, suite
            potential, or positive-cash-flow at current rates.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/listings" className="btn-primary !px-6 no-underline text-center">
              Browse Scored Listings
            </Link>
            <Link
              href="/book-call"
              className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 no-underline text-center"
            >
              Talk to Hamza — Free Call
            </Link>
          </div>
        </div>

        <RelatedGuides current="/legal-second-unit-mississauga" />
      </div>
      <StickyMobileCTA href="/listings" label="Browse Suite-Potential Listings" />
    </>
  );
}
