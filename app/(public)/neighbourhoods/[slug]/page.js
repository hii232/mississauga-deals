import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HOOD_DATA, HOOD_RENTS, LRT_CORRIDOR_HOODS } from '@/lib/constants';
import { calculateCashFlow, estimateRent } from '@/lib/cash-flow-engine';
import { fmtK } from '@/lib/utils/format';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';

const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-');

const SLUG_TO_HOOD = Object.fromEntries(
  Object.keys(HOOD_DATA).map((name) => [slugify(name), name])
);

export function generateStaticParams() {
  return Object.keys(SLUG_TO_HOOD).map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const name = SLUG_TO_HOOD[params.slug];
  if (!name) return { title: 'Neighbourhood Not Found' };
  const d = HOOD_DATA[name];

  const title = `${name} Mississauga Investment Property Guide — Prices, Rents & Cash Flow`;
  const description = `Investing in ${name}, Mississauga: average price ${fmtK(d.avgPrice)} (${d.priceYoY >= 0 ? '+' : ''}${d.priceYoY}% YoY), ${d.rentYield}% rent yield, ${d.avgDOM} days on market. Rent estimates by bedroom, sample cash flow, and Hamza Nouman's take.`;

  return {
    title,
    description,
    alternates: { canonical: `/neighbourhoods/${params.slug}` },
    openGraph: {
      title,
      description,
      url: `https://www.mississaugainvestor.ca/neighbourhoods/${params.slug}`,
    },
  };
}

const TREND_LABEL = { hot: 'Hot Market', warm: 'Steady Market', cool: 'Buyer-Friendly' };
const TREND_COLOR = {
  hot: 'bg-red-50 text-red-600 border-red-100',
  warm: 'bg-amber-50 text-amber-700 border-amber-100',
  cool: 'bg-blue-50 text-blue-600 border-blue-100',
};

export default function NeighbourhoodGuidePage({ params }) {
  const name = SLUG_TO_HOOD[params.slug];
  if (!name) notFound();

  const d = HOOD_DATA[name];
  const rents = HOOD_RENTS[name];
  const isLRT = LRT_CORRIDOR_HOODS.includes(name);

  // Worked example: 3-bed at the neighbourhood average price, model assumptions
  const exampleRent = estimateRent(d.avgPrice, 3, name, 'Detached', name);
  const cf = calculateCashFlow(d.avgPrice, exampleRent, { city: name });

  // Related neighbourhoods: same trend, closest average price
  const related = Object.entries(HOOD_DATA)
    .filter(([n, v]) => n !== name && v.trend === d.trend)
    .sort(([, a], [, b]) => Math.abs(a.avgPrice - d.avgPrice) - Math.abs(b.avgPrice - d.avgPrice))
    .slice(0, 3);

  const faqs = [
    {
      question: `Is ${name} a good place to buy an investment property in 2026?`,
      answer: `${name} is currently a ${TREND_LABEL[d.trend].toLowerCase()} with a ${d.rentYield}% average rent yield, ${d.avgDOM} days on market, and ${d.inventory.toLowerCase()} inventory. ${d.note}.`,
    },
    {
      question: `What is the average home price in ${name}, Mississauga?`,
      answer: `The average price in ${name} is approximately ${fmtK(d.avgPrice)}, ${d.priceYoY >= 0 ? 'up' : 'down'} ${Math.abs(d.priceYoY)}% year over year.`,
    },
    {
      question: `How much rent can an investment property in ${name} earn?`,
      answer: `Estimated market rents in ${name} range from about $${rents[1].toLocaleString()}/month for a 1-bedroom to $${rents[4].toLocaleString()}/month for a 4-bedroom, based on TRREB rental data and public rental platforms.`,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Neighbourhoods', url: 'https://www.mississaugainvestor.ca/neighbourhoods' },
          { name, url: `https://www.mississaugainvestor.ca/neighbourhoods/${params.slug}` },
        ]}
      />
      <FAQJsonLd items={faqs} />

      {/* Breadcrumb */}
      <nav className="text-xs text-muted mb-6">
        <Link href="/" className="no-underline text-muted hover:text-navy">Home</Link>
        {' / '}
        <Link href="/neighbourhoods" className="no-underline text-muted hover:text-navy">Neighbourhoods</Link>
        {' / '}
        <span className="text-navy font-medium">{name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-heading font-bold text-3xl text-navy">{name} Investment Guide</h1>
        <span className={`text-[10px] font-bold uppercase rounded-full px-2.5 py-1 border ${TREND_COLOR[d.trend]}`}>
          {TREND_LABEL[d.trend]}
        </span>
      </div>
      <p className="text-sm text-muted mb-8">
        Prices, rents, yield, and cash flow for real estate investors in {name}, Mississauga — updated for 2026.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          ['Avg Price', fmtK(d.avgPrice)],
          ['Price YoY', `${d.priceYoY >= 0 ? '+' : ''}${d.priceYoY}%`],
          ['Avg DOM', `${d.avgDOM} days`],
          ['Inventory', d.inventory],
          ['Rent Yield', `${d.rentYield}%`],
          ['Transit Score', `${d.transitScore}/10`],
          ['School Score', `${d.schoolScore}/10`],
          ['LRT Corridor', isLRT ? 'Yes' : 'No'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-cloud p-3 text-center">
            <p className="text-sm font-bold text-navy">{v}</p>
            <p className="text-[10px] text-muted uppercase font-medium mt-0.5">{k}</p>
          </div>
        ))}
      </div>

      {/* Hamza's take */}
      <div className="bg-navy rounded-xl p-5 mb-8">
        <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1.5">Hamza&apos;s Take</p>
        <p className="text-sm text-white/90 leading-relaxed italic">&ldquo;{d.note}&rdquo;</p>
      </div>

      {isLRT && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 mb-8">
          <p className="text-sm text-navy leading-relaxed">
            <strong>Hurontario LRT corridor:</strong> {name} sits along the new LRT line. Transit
            corridors in the GTA have historically seen above-average rent growth and price
            appreciation once service opens — a structural tailwind for buy-and-hold investors here.
          </p>
        </div>
      )}

      {/* Rent table */}
      <h2 className="font-heading font-semibold text-xl text-navy mb-3">Estimated Market Rents in {name}</h2>
      <div className="overflow-hidden rounded-lg border border-gray-100 mb-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cloud text-left">
              <th className="px-4 py-2.5 text-xs font-semibold text-navy uppercase">Bedrooms</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-navy uppercase">Est. Monthly Rent</th>
            </tr>
          </thead>
          <tbody>
            {[['Bachelor', 0], ['1 Bedroom', 1], ['2 Bedroom', 2], ['3 Bedroom', 3], ['4 Bedroom', 4], ['5 Bedroom', 5]].map(([label, b]) => (
              <tr key={b} className="border-t border-gray-50">
                <td className="px-4 py-2.5 text-navy">{label}</td>
                <td className="px-4 py-2.5 font-mono font-semibold text-navy">${rents[b].toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted mb-8">
        Calibrated from TRREB rental reports and public rental platforms, 2025–2026. Whole-house and
        property-type premiums apply — see <Link href="/score-methodology" className="text-accent no-underline">model assumptions</Link>.
      </p>

      {/* Worked cash flow example */}
      <h2 className="font-heading font-semibold text-xl text-navy mb-3">Sample Cash Flow: 3-Bed at the {name} Average Price</h2>
      <p className="text-sm text-navy/80 leading-relaxed mb-4">
        A 3-bedroom detached home at the {name} average of {fmtK(d.avgPrice)} with 20% down, a 4.89%
        five-year fixed mortgage, and 25-year amortization — the same assumptions used for every
        deal score on this site:
      </p>
      <div className="rounded-lg border border-gray-100 p-5 mb-2">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted">Estimated rent</span><span className="font-mono font-semibold text-green-600">+${exampleRent.toLocaleString()}/mo</span></div>
          <div className="flex justify-between"><span className="text-muted">Mortgage payment</span><span className="font-mono text-red-500">−${cf.mortgage.toLocaleString()}/mo</span></div>
          <div className="flex justify-between"><span className="text-muted">Property tax</span><span className="font-mono text-red-500">−${cf.propTax.toLocaleString()}/mo</span></div>
          <div className="flex justify-between"><span className="text-muted">Insurance</span><span className="font-mono text-red-500">−${cf.insurance.toLocaleString()}/mo</span></div>
          <div className="flex justify-between"><span className="text-muted">Maintenance reserve</span><span className="font-mono text-red-500">−${cf.maintenance.toLocaleString()}/mo</span></div>
          <div className="flex justify-between"><span className="text-muted">Vacancy allowance</span><span className="font-mono text-red-500">−${cf.vacancy.toLocaleString()}/mo</span></div>
          <div className="border-t border-gray-100 pt-2 flex justify-between">
            <span className="font-bold text-navy">Monthly cash flow</span>
            <span className={`font-mono font-bold ${cf.cashFlow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {cf.cashFlow >= 0 ? '+' : '−'}${Math.abs(cf.cashFlow).toLocaleString()}/mo
            </span>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted mb-8">
        {cf.cashFlow < 0
          ? 'Negative as-is — typical for Mississauga at today’s rates. Deals that work here usually involve a basement suite, below-asking negotiation, or a larger down payment. '
          : 'Positive at the neighbourhood average — rare in the GTA. '}
        This is an illustration at neighbourhood averages, not a projection for any specific property.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <Link href={`/listings?hood=${encodeURIComponent(name)}`} className="btn-primary !px-6 !py-3 text-center no-underline">
          View Live Listings in {name} →
        </Link>
        <Link href="/book-call" className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-navy hover:border-navy/30 transition text-center no-underline">
          Book a Free Strategy Call
        </Link>
      </div>

      {/* FAQ */}
      <h2 className="font-heading font-semibold text-xl text-navy mb-4">FAQ: Investing in {name}</h2>
      <div className="space-y-4 mb-10">
        {faqs.map((f) => (
          <div key={f.question} className="rounded-lg bg-cloud p-4">
            <p className="text-sm font-semibold text-navy mb-1.5">{f.question}</p>
            <p className="text-sm text-navy/75 leading-relaxed">{f.answer}</p>
          </div>
        ))}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <>
          <h2 className="font-heading font-semibold text-xl text-navy mb-4">Similar Neighbourhoods</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {related.map(([n, v]) => (
              <Link key={n} href={`/neighbourhoods/${slugify(n)}`} className="card p-4 no-underline hover:shadow-md transition-shadow">
                <p className="font-heading font-semibold text-navy text-sm mb-1">{n}</p>
                <p className="text-xs text-muted">{fmtK(v.avgPrice)} avg · {v.rentYield}% yield</p>
              </Link>
            ))}
          </div>
        </>
      )}

      <p className="text-[10px] text-muted/60 leading-relaxed">
        Neighbourhood statistics are estimates compiled from TRREB market data and public sources,
        updated periodically. Cash flow figures are illustrative estimates, not financial advice or
        an appraisal. Hamza Nouman, Sales Representative, Cityscape Real Estate Ltd., Brokerage.
      </p>
    </div>
  );
}
