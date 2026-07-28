import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { HOOD_DATA, HOOD_RENTS, LRT_CORRIDOR_HOODS, HOOD_OUTLOOK_AS_OF } from '@/lib/constants';
import { calculateCashFlow, estimateRent } from '@/lib/cash-flow-engine';
import { fmtK } from '@/lib/utils/format';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';
import InlineCTA from '@/components/ui/inline-cta';
import { PageHero } from '@/components/layout/page-hero';

const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-');

const SLUG_TO_HOOD = Object.fromEntries(
  Object.keys(HOOD_DATA).map((name) => [slugify(name), name])
);

// ISR: statically generated, refreshed every 10 min so the live avg price / DOM
// / yield stay current from the listing feed.
export const revalidate = 600;

const SITE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://www.mississaugainvestor.ca';

async function getHoodStats() {
  try {
    const res = await fetch(`${SITE_URL}/api/neighbourhood-stats`, { next: { revalidate: 600 } });
    if (!res.ok) return {};
    const d = await res.json();
    return d.stats || {};
  } catch {
    return {};
  }
}

export function generateStaticParams() {
  return Object.keys(SLUG_TO_HOOD).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const name = SLUG_TO_HOOD[params.slug];
  if (!name) return { title: 'Neighbourhood Not Found' };
  const d = HOOD_DATA[name];

  // Reads the SAME live stats the page body does. This used to build the
  // description purely from the curated HOOD_DATA figures while the page
  // rendered live ones, so a search snippet could advertise "$618K" and the
  // visitor land on "$804K" — the snippet became the wrong number. getHoodStats
  // is a plain fetch with revalidate, and Next dedupes identical fetches within
  // a render, so awaiting it here costs no extra upstream call.
  const live = (await getHoodStats())[name];
  const avgPrice = live?.avgPrice ?? d.avgPrice;
  const avgDOM = live?.avgDOM ?? d.avgDOM;
  const rentYield = live?.rentYield ?? d.rentYield;

  // Sized for the SERP: title <= ~60 chars and description <= ~155 so neither
  // is truncated mid-phrase. The brand is dropped from the title via `absolute`
  // (og:siteName already makes Google render it separately) — that reclaims 25
  // characters for the neighbourhood name and the actual query.
  //
  // The live branch omits the year-over-year figure on purpose: priceYoY is a
  // curated SOLD-price outlook, and pairing it with a live ASKING average is
  // exactly the two-measurements-as-one problem fixed in the FAQ answer.
  const title = `${name} Investment Property Guide (Mississauga)`;
  const description = live
    ? `${name} investment guide: active listings asking ${fmtK(avgPrice)} on average, ${rentYield}% rent yield, ${avgDOM} days on market, plus a worked cash-flow example.`
    : `Investing in ${name}: average price ${fmtK(d.avgPrice)} (${d.priceYoY >= 0 ? '+' : ''}${d.priceYoY}% YoY), ${d.rentYield}% rent yield, ${d.avgDOM} days on market, plus a sample cash flow.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/neighbourhoods/${params.slug}` },
    openGraph: {
      // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
      title,
      description,
      url: `https://www.mississaugainvestor.ca/neighbourhoods/${params.slug}`,
    },
  };
}

const TREND_LABEL = { hot: 'Hot Market', warm: 'Steady Market', cool: 'Buyer-Friendly' };

// Pillar posts that cover specific neighbourhoods in depth. Keys must match
// HOOD_DATA names exactly. Every hood page also links the city-wide ranking.
const HOOD_PILLAR_POSTS = {
  'Malton': [
    { href: '/blog/malton-investment-guide-2026', title: 'Malton Investment Guide 2026' },
    { href: '/blog/seven-bedroom-rooming-house-math-mississauga', title: 'The 7-Bedroom Cash Flow Math: Real or Fantasy?' },
  ],
  'Cooksville': [
    { href: '/blog/cooksville-hurontario-lrt-corridor-investing', title: 'Cooksville and the Hurontario LRT' },
  ],
  'Hurontario': [
    { href: '/blog/cooksville-hurontario-lrt-corridor-investing', title: 'Cooksville and the Hurontario LRT' },
  ],
};

export default async function NeighbourhoodGuidePage({ params }) {
  const name = SLUG_TO_HOOD[params.slug];
  if (!name) notFound();

  const d = HOOD_DATA[name];
  const rents = HOOD_RENTS[name];
  const isLRT = LRT_CORRIDOR_HOODS.includes(name);

  // Live avg price / DOM / yield from active listings; trend, YoY & inventory
  // stay curated (Hamza's outlook). Fall back to curated when the feed is thin.
  const live = (await getHoodStats())[name];
  const avgPrice = live?.avgPrice ?? d.avgPrice;
  const avgDOM = live?.avgDOM ?? d.avgDOM;
  const rentYield = live?.rentYield ?? d.rentYield;
  const isLive = !!live;

  // Worked example: 3-bed at the neighbourhood average price, model assumptions
  const exampleRent = estimateRent(avgPrice, 3, name, 'Detached', name);
  const cf = calculateCashFlow(avgPrice, exampleRent, { city: name });

  // Related neighbourhoods: same trend, closest average price
  const related = Object.entries(HOOD_DATA)
    .filter(([n, v]) => n !== name && v.trend === d.trend)
    .sort(([, a], [, b]) => Math.abs(a.avgPrice - d.avgPrice) - Math.abs(b.avgPrice - d.avgPrice))
    .slice(0, 3);

  const faqs = [
    {
      question: `Is ${name} a good place to buy an investment property in 2026?`,
      answer: `${name} is currently a ${TREND_LABEL[d.trend].toLowerCase()} with a ${rentYield}% average rent yield, ${avgDOM} days on market, and ${d.inventory.toLowerCase()} inventory. ${d.note}.`,
    },
    {
      question: `What is the average home price in ${name}, Mississauga?`,
      // The price and the YoY come from DIFFERENT sources: avgPrice is the
      // live average ASKING price of active listings when the feed has a
      // sample, while priceYoY is Hamza's curated outlook on SOLD prices. The
      // old sentence welded them together — "$804K, up 1.8% year over year" —
      // which reads as one measurement and is why the homepage card and this
      // page could show different averages for the same neighbourhood with no
      // explanation. Each figure is now attributed to what it actually is.
      answer: isLive
        ? `Active listings in ${name} are currently asking ${fmtK(avgPrice)} on average, from live MLS data. That is an asking-price average and moves with what happens to be on the market; TRREB's sold figures for Mississauga are on the market-pulse page. Hamza's outlook for ${name}, last reviewed ${HOOD_OUTLOOK_AS_OF}, has prices ${d.priceYoY >= 0 ? 'up' : 'down'} ${Math.abs(d.priceYoY)}% year over year.`
        : `The average price in ${name} is approximately ${fmtK(avgPrice)}, ${d.priceYoY >= 0 ? 'up' : 'down'} ${Math.abs(d.priceYoY)}% year over year, from Hamza's neighbourhood outlook last reviewed ${HOOD_OUTLOOK_AS_OF}.`,
    },
    {
      question: `How much rent can an investment property in ${name} earn?`,
      answer: `Estimated market rents in ${name} range from about $${rents[1].toLocaleString()}/month for a 1-bedroom to $${rents[4].toLocaleString()}/month for a 4-bedroom, based on TRREB rental data and public rental platforms.`,
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Neighbourhoods', url: 'https://www.mississaugainvestor.ca/neighbourhoods' },
          { name, url: `https://www.mississaugainvestor.ca/neighbourhoods/${params.slug}` },
        ]}
      />
      <FAQJsonLd items={faqs} />

      <PageHero
        compact
        eyebrow={TREND_LABEL[d.trend]}
        title={`${name} Investment Guide`}
        subtitle={`Prices, rents, yield, and cash flow for real estate investors in ${name}, Mississauga.`}
      />

      <div className="max-w-3xl mx-auto px-4 pt-8 pb-28 lg:pb-12">

      {/* Breadcrumb */}
      <nav className="text-xs text-muted mb-4">
        <Link href="/" className="no-underline text-muted hover:text-navy">Home</Link>
        {' / '}
        <Link href="/neighbourhoods" className="no-underline text-muted hover:text-navy">Neighbourhoods</Link>
        {' / '}
        <span className="text-navy font-medium">{name}</span>
      </nav>

      {isLive && (
        <p className="mb-6 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Price, DOM &amp; yield live from active listings
        </p>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {[
          ['Avg Price', fmtK(avgPrice)],
          ['Price YoY*', `${d.priceYoY >= 0 ? '+' : ''}${d.priceYoY}%`],
          ['Avg DOM', avgDOM != null ? `${avgDOM} days` : '—'],
          ['Inventory*', d.inventory],
          ['Rent Yield', rentYield != null ? `${rentYield}%` : '—'],
          ['Transit Score*', `${d.transitScore}/10`],
          ['School Score*', `${d.schoolScore}/10`],
          ['LRT Corridor', isLRT ? 'Yes' : 'No'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-cloud p-3 text-center">
            <p className="text-sm font-bold text-navy">{v}</p>
            <p className="text-[10px] text-muted uppercase font-medium mt-0.5">{k}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted mb-8">
        Avg price, DOM &amp; rent yield update live from active listings. <span className="whitespace-nowrap">*Trend, YoY, inventory &amp; scores</span> reflect Hamza&apos;s expert outlook (last reviewed {HOOD_OUTLOOK_AS_OF}).
      </p>

      {/* Hamza's take — headshot added to match the blog-post author-box
          treatment (2026-07-28) for trust and attribution on each of the
          24 neighbourhood guides. White/60 credential line is the same
          opacity as the blog sidebar's "Licensed by RECO" line. */}
      <div className="bg-navy rounded-xl p-5 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image
              src="/images/hamza-headshot.jpg"
              alt="Hamza Nouman"
              fill
              sizes="40px"
              className="rounded-full object-cover object-top"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-accent leading-tight">Hamza&apos;s Take</p>
            <p className="text-[10px] text-white/60 leading-tight mt-0.5">REALTOR® · Investment Specialist · Cityscape Real Estate</p>
          </div>
        </div>
        <p className="text-sm text-white/90 leading-relaxed italic">&ldquo;{d.note}&rdquo;</p>
      </div>

      {isLRT && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 mb-8">
          <p className="text-sm text-navy leading-relaxed">
            <strong>Hurontario LRT corridor:</strong> {name} sits along the new LRT line. Transit
            corridors in the GTA have historically seen above-average rent growth and price
            appreciation once service opens — a structural tailwind for buy-and-hold investors here.
          </p>
          <Link
            href="/hurontario-lrt-real-estate"
            className="mt-2 inline-block text-sm font-semibold text-accent hover:text-accent-dark no-underline"
          >
            How the Hurontario LRT affects real estate →
          </Link>
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
        A 3-bedroom detached home at the {name} average of {fmtK(avgPrice)} with 20% down, a 4.89%
        five-year fixed mortgage, and 25-year amortization — the same assumptions used for every
        deal score on this site:
      </p>
      <div className="rounded-lg border border-gray-100 p-5 mb-2">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted">Estimated rent</span><span className="font-mono font-semibold text-emerald-700">+${exampleRent.toLocaleString()}/mo</span></div>
          <div className="flex justify-between"><span className="text-muted">Mortgage payment</span><span className="font-mono text-red-600">−${cf.mortgage.toLocaleString()}/mo</span></div>
          <div className="flex justify-between"><span className="text-muted">Property tax</span><span className="font-mono text-red-600">−${cf.propTax.toLocaleString()}/mo</span></div>
          <div className="flex justify-between"><span className="text-muted">Insurance</span><span className="font-mono text-red-600">−${cf.insurance.toLocaleString()}/mo</span></div>
          <div className="flex justify-between"><span className="text-muted">Maintenance reserve</span><span className="font-mono text-red-600">−${cf.maintenance.toLocaleString()}/mo</span></div>
          <div className="flex justify-between"><span className="text-muted">Vacancy allowance</span><span className="font-mono text-red-600">−${cf.vacancy.toLocaleString()}/mo</span></div>
          <div className="border-t border-gray-100 pt-2 flex justify-between">
            <span className="font-bold text-navy">Monthly cash flow</span>
            <span className={`font-mono font-bold ${cf.cashFlow >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
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

      {/* Inline email capture. Placed after the FAQ (not before — the CTA
          row already serves ready-to-act visitors) to convert the more
          deliberate reader who worked through data + FAQ but isn't yet
          ready to browse or book. One component, all 24 hood guides. */}
      <InlineCTA variant="newsletter" className="mb-10" />

      {/* Deep-dive reading — pillar posts covering this hood specifically,
          plus the ranking that puts it in context. Internal links from these
          established pages are how the cluster passes authority to the posts,
          and they give a reader a next step that's ON topic. */}
      <div className="mb-10 rounded-xl border border-accent/15 bg-accent/[0.04] p-5">
        <h2 className="font-heading font-semibold text-lg text-navy mb-3">Go deeper on the numbers</h2>
        <div className="space-y-2">
          {(HOOD_PILLAR_POSTS[name] || []).map((post) => (
            <Link key={post.href} href={post.href} className="block text-sm font-semibold text-accent no-underline hover:underline">
              {post.title} →
            </Link>
          ))}
          <Link href="/blog/best-cash-flow-neighbourhoods-mississauga-2026" className="block text-sm font-semibold text-accent no-underline hover:underline">
            How {name} compares: Best Cash Flow Neighbourhoods in Mississauga (2026) →
          </Link>
        </div>
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
        Average price, days-on-market and rent yield are computed live from active Mississauga
        listings; trend, year-over-year and inventory reflect Hamza&apos;s expert outlook (last
        reviewed {HOOD_OUTLOOK_AS_OF}). Cash flow figures are illustrative estimates, not financial
        advice or an appraisal. Hamza Nouman, Sales Representative, Cityscape Real Estate Ltd., Brokerage.
      </p>
    </div>

    {/* Sticky mobile CTA — keeps the primary action reachable while scrolling a
        long guide (search visitors land here and may never reach the mid-page
        CTA). z-[150] stays under the cookie banner (z-[200]) until consent;
        lg:hidden because the desktop layout keeps the in-flow CTA in view. */}
    <div className="fixed bottom-0 left-0 right-0 z-[150] border-t border-slate-200 bg-white/95 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <Link
        href={`/listings?hood=${encodeURIComponent(name)}`}
        className="btn-primary flex w-full items-center justify-center !py-3 no-underline"
      >
        View {name} Listings &rarr;
      </Link>
    </div>
    </>
  );
}
