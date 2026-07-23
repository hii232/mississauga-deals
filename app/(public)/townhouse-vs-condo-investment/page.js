import Link from 'next/link';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/layout/page-hero';
import InlineCTA from '@/components/ui/inline-cta';
import { RelatedGuides } from '@/components/ui/related-guides';

const YEAR = new Date().getFullYear();

export const metadata = {
  title: `Townhouse or Condo: Which Is the Better Investment? (Mississauga & GTA ${YEAR})`,
  description: `Townhouse or condo — which is the better investment in Mississauga and the GTA? How condo fees, the land component, appreciation, cash flow, and tenant demand compare, plus how to run the numbers on a real listing.`,
  keywords: [
    'townhouse or condo better investment',
    'townhouse vs condo investment',
    'is a townhouse or condo a better investment',
    'townhouse vs condo mississauga',
    'condo vs townhouse cash flow',
  ],
  alternates: { canonical: '/townhouse-vs-condo-investment' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: `Townhouse or Condo: Which Is the Better Investment? (${YEAR})`,
    description: 'How condo fees, land, appreciation, cash flow and tenant demand compare for townhouse vs condo investing in Mississauga and the GTA.',
    url: 'https://www.mississaugainvestor.ca/townhouse-vs-condo-investment',
  },
};

// Honest, general comparison — no fabricated price/appreciation figures. The
// real numbers for any specific property come from the (audited) listing
// analysis + mortgage calculator, which readers are routed to.
const TVC_FAQ = [
  {
    question: 'Is a townhouse or condo a better investment in the GTA?',
    answer:
      'Neither wins outright — it depends on your goal. Condos usually have a lower entry price, handle exterior maintenance for you, and are easier to rent and resell, but their monthly fees are higher and rise over time, which eats into cash flow. Townhouses often carry lower fees (freehold townhomes have none) and include a land component, which tends to support stronger long-term appreciation and gives you more control, but they cost more up front and — if freehold — put maintenance on you. If your priority is monthly cash flow and simplicity, a condo can suit; if it is long-term equity and appreciation, a townhouse often edges ahead.',
  },
  {
    question: 'Not all townhouses are freehold — does that matter?',
    answer:
      'It matters a lot. A freehold townhouse has no condo fee and you own the land it sits on. A condo or common-element (POTL) townhouse still charges a monthly fee — usually lower than a high-rise condo, but a real cost that reduces cash flow. Always check the fee (and what it covers) before comparing a townhouse to a condo; the label alone does not tell you the carrying cost.',
  },
  {
    question: 'Do condo fees make condos a worse investment?',
    answer:
      'Not automatically, but they are the single biggest reason a condo can look cheaper yet cash-flow worse than a townhouse. A fee of several hundred dollars a month is money that never builds equity, and fees tend to climb faster than rent in older buildings. The fee can be worth it when it covers heat, water, and amenities tenants pay up for — the point is to price it in. Our listing analysis and mortgage calculator include the actual condo fee in cash flow and cap rate, so the comparison is apples-to-apples.',
  },
  {
    question: 'Which appreciates more, a townhouse or a condo?',
    answer:
      'Over long holding periods, properties with a larger land component have historically tended to appreciate faster, which generally favours townhouses (especially freehold) over high-rise condos. That is a tendency, not a guarantee — location, transit access, and supply matter more than property type in any given area. Condos in supply-constrained, transit-rich nodes can still perform well. Model your specific price, rent, and area rather than assuming a type-level winner.',
  },
  {
    question: 'Which is easier to rent out and manage?',
    answer:
      'Condos are typically the easiest to manage: the corporation handles the building envelope, and central locations draw a steady renter pool. Freehold townhouses need you (or a property manager) to handle maintenance, but they appeal strongly to families and roommates who want more space and a private entrance, which can mean longer tenancies. Match the property to the tenant demand in the specific neighbourhood.',
  },
];

const ROWS = [
  { factor: 'Entry price', condo: 'Usually lower', town: 'Usually higher' },
  { factor: 'Monthly fees', condo: 'Higher condo fees', town: 'None (freehold) or lower (POTL)' },
  { factor: 'Land component', condo: 'Unit only', town: 'Includes land (freehold)' },
  { factor: 'Appreciation tendency', condo: 'Steady, location-driven', town: 'Often stronger long-term' },
  { factor: 'Cash flow', condo: 'Fees drag on it', town: 'Fewer/no fees help it' },
  { factor: 'Maintenance', condo: 'Handled by corporation', town: 'On you (freehold)' },
  { factor: 'Tenant pool', condo: 'Professionals, downsizers', town: 'Families, roommates' },
  { factor: 'Liquidity', condo: 'Easier to rent & resell', town: 'Slower, but steady demand' },
];

export default function TownhouseVsCondoPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Townhouse vs Condo Investment', url: 'https://www.mississaugainvestor.ca/townhouse-vs-condo-investment' },
        ]}
      />
      <FAQJsonLd items={TVC_FAQ} />

      <PageHero
        compact
        eyebrow={`Mississauga & GTA · Investing · ${YEAR}`}
        title="Townhouse or Condo: Which Is the Better Investment?"
        subtitle="Condo fees, the land component, appreciation, cash flow, and tenant demand pull in different directions — here's how to weigh them, then run the numbers on a real Mississauga listing."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Direct answer */}
        <div className="rounded-2xl border border-slate-200 bg-cloud p-6 mb-10">
          <h2 className="font-heading font-bold text-lg text-navy mb-2">The short answer</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            There is no universal winner. A <strong>condo</strong> usually costs less to get into, is easier to rent and
            manage, and hands off maintenance — but its monthly fees are higher and climb over time, dragging on cash
            flow. A <strong>townhouse</strong> — especially freehold — carries lower or no fees and includes a land
            component, which tends to support stronger long-term appreciation and more control, at a higher entry price
            and (if freehold) more maintenance. Pick for your goal: <strong>cash flow &amp; simplicity → condo</strong>;{' '}
            <strong>long-term equity &amp; appreciation → townhouse</strong>. Then check the actual numbers on the
            specific property.
          </p>
          <Link
            href="/listings"
            className="btn-primary !px-6 !py-2.5 no-underline text-sm inline-block mt-4"
          >
            Browse scored Mississauga listings →
          </Link>
        </div>

        {/* Comparison table */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">Townhouse vs condo, side by side</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 mb-3">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-cloud">
                <th className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-navy">Factor</th>
                <th className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-navy">Condo</th>
                <th className="px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wide text-navy">Townhouse</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.factor} className={i % 2 ? 'bg-white' : 'bg-slate-50/60'}>
                  <td className="px-4 py-3 font-semibold text-navy">{r.factor}</td>
                  <td className="px-4 py-3 text-slate-600">{r.condo}</td>
                  <td className="px-4 py-3 text-slate-600">{r.town}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mb-10">
          General tendencies for the Mississauga/GTA market — not a rule for any specific property. A condo or
          common-element (POTL) townhouse still has a monthly fee; a freehold townhouse does not.
        </p>

        {/* Inline email capture — convert the reader who isn't ready to browse yet */}
        <InlineCTA variant="newsletter" className="mb-10" />

        {/* Visible FAQ (mirrors the schema) */}
        <h2 className="font-heading font-bold text-xl text-navy mb-4">Townhouse vs condo: common questions</h2>
        <div className="space-y-4 mb-10">
          {TVC_FAQ.map((qa) => (
            <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{qa.question}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{qa.answer}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-navy p-8 text-center">
          <h2 className="font-heading font-bold text-xl text-white mb-2">Run the numbers on a real property</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            Every Mississauga listing is scored for cash flow and cap rate — with the actual condo fee included — so you
            can compare a townhouse and a condo on the same basis.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/listings" className="btn-primary !px-6 no-underline text-center">
              Browse Listings
            </Link>
            <Link
              href="/mortgage-calculator"
              className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 no-underline text-center"
            >
              Mortgage Calculator
            </Link>
          </div>
        </div>

        <RelatedGuides current="/townhouse-vs-condo-investment" />
      </div>
    </>
  );
}
