import { Suspense } from 'react';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { processListings } from '@/lib/listings/process-listings';
import { fetchFeedPages, slimForSSR, SSR_CARD_ROWS } from '@/lib/listings/fetch-feed';
import { ListingsContainer } from '@/components/listings/listings-container';
import { RegionSwitcher } from '@/components/listings/region-switcher';
import { PageHero } from '@/components/layout/page-hero';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';
import { slugifyPlace } from '@/lib/utils/format';
import { getTaxRate, hasExplicitTaxRate } from '@/lib/constants';

// Room for the 25s cache-seeding feed fetch below — without this the page
// function itself can be killed at the platform default before the fetch
// resolves, which reproduces the empty shell with a longer fuse.
export const maxDuration = 60;

// 5-question FAQ for the /gta hub — DELIBERATELY DISTINCT from /listings FAQ
// (which covers: down payment 20%, closing costs, legal suites, Mississauga
// neighbourhoods). FAQPage schema requires every answer to be visible on the
// page; the card grid below renders all five verbatim. Questions target
// GTA-wide investor queries, not Mississauga-specific ones.
const GTA_FAQ = [
  {
    question: 'Which cities and regions does this site cover in the GTA?',
    answer:
      'The site tracks active MLS listings across five GTA regions: Peel (Brampton, Mississauga, Caledon), Halton (Oakville, Burlington, Milton, Halton Hills, Georgetown), York (Vaughan, Richmond Hill, Markham, Aurora, Newmarket, King), Durham (Pickering, Ajax, Whitby, Oshawa, Clarington), and the City of Toronto (including Etobicoke, North York, Scarborough, East York and York). Hamilton and its communities (Stoney Creek, Dundas, Ancaster) are also included. Each city has its own page with city-specific cash-flow analysis and property tax rates.',
  },
  {
    question: 'Does Toronto charge an extra land transfer tax on investment properties?',
    answer:
      "Yes. The City of Toronto and its amalgamated districts (Etobicoke, North York, Scarborough, East York and York) levy a Municipal Land Transfer Tax (MLTT) on top of Ontario's provincial LTT — roughly doubling the land-transfer cost. On a $1,000,000 purchase the provincial tax alone is approximately $16,475; Toronto's MLTT adds another $16,475, for a combined total of roughly $33,000. Every Toronto-area listing on this site includes both taxes in its closing-cost and cash-on-cash return calculation.",
  },
  {
    question: 'How do property tax rates affect cash-flow estimates across GTA cities?',
    answer:
      "Each listing's cash flow, cap rate and Deal Score are costed with that city's researched municipal property tax rate — a real carrying cost most listing sites leave out. Rates vary widely: Toronto is the lowest at 0.63%; Mississauga is 0.84%; Brampton is 1.13%; Oshawa is the highest at 1.31%. On a $900,000 property, the difference between a Toronto listing (0.63% ≈ $472/mo) and an Oshawa listing (1.31% ≈ $983/mo) is over $500 per month of added carrying cost — a difference that shows up directly in the cash flow figures on each listing card.",
  },
  {
    question: 'Are Deal Scores calculated the same way across all GTA cities?',
    answer:
      'Yes — the Deal Score algorithm, weights and assumptions are identical for every city. The per-city inputs that differ are: the municipal property tax rate (researched for each municipality), the rent estimate (calibrated to local market levels rather than Mississauga rents), and closing costs (which include Toronto\'s Municipal Land Transfer Tax for Toronto-area listings). A 7/10 in Brampton and a 7/10 in Mississauga are genuinely comparable scores built on the same model with city-appropriate inputs.',
  },
  {
    question: 'How are rents estimated for GTA investment properties outside Mississauga?',
    answer:
      "GTA cities outside Mississauga use a city-specific rent tier applied to a bedroom and property-type estimate. Toronto listings use a higher assumption (roughly 15% above Mississauga), while Oshawa and Hamilton use lower ones (roughly 20% below Mississauga). The rent assumption is shown on every listing card so you can see the figure the cash-flow numbers are built on before you rely on them.",
  },
];

// Convert a city name to a URL path segment.
// "Halton Hills" → "halton-hills", "Toronto" → "toronto".
// Exported so gta/[city]/page.js can use the same function without duplicating.
export function cityToSlug(city) {
  return slugifyPlace(city);
}

// All cities we support in the GTA mega-menu (must match header.js GTA_GROUPS).
// Exported so the sitemap and gta/[city]/page.js can reference each city.
// `place` is the one genuinely city-specific clause each page gets: the named
// communities, transit line or landmark that actually distinguishes this
// municipality from its 27 siblings. It is deliberately QUALITATIVE — real
// place names, GO/subway lines, geography, institutions — and contains no
// statistic, price or count, because nothing on this page can source one.
// (Rents, tax and market figures come from lib/constants.js and the feed;
// they are never restated here.) `sub` below is composed from it.
export const CITY_COPY = {
  'Toronto': { h1: 'Toronto Investment Properties', sub: 'Active listings across Toronto, Etobicoke, North York, Scarborough, East York & York', region: 'City of Toronto' },
  'Brampton': { h1: 'Brampton Investment Properties', region: 'Peel Region', place: 'across Bramalea, Springdale, Heart Lake and Mount Pleasant' },
  'Caledon': { h1: 'Caledon Investment Properties', region: 'Peel Region', place: 'in Bolton, Caledon East and the villages north of Brampton' },
  'Oakville': { h1: 'Oakville Investment Properties', region: 'Halton Region', place: 'from Bronte and Kerr Village to Glen Abbey and Uptown Core' },
  'Burlington': { h1: 'Burlington Investment Properties', region: 'Halton Region', place: 'from Aldershot and the waterfront to Alton Village' },
  'Milton': { h1: 'Milton Investment Properties', region: 'Halton Region', place: 'below the Niagara Escarpment, on the Milton GO line' },
  'Halton Hills': { h1: 'Halton Hills Investment Properties', region: 'Halton Region', place: 'in Georgetown, Acton and Glen Williams' },
  'Georgetown': { h1: 'Georgetown Investment Properties', region: 'Halton Region', place: 'in the Town of Halton Hills, on the Kitchener GO line' },
  'Vaughan': { h1: 'Vaughan Investment Properties', region: 'York Region', place: 'from Woodbridge, Maple and Thornhill to the VMC subway hub' },
  'Richmond Hill': { h1: 'Richmond Hill Investment Properties', region: 'York Region', place: 'along the Yonge Street corridor and up into Oak Ridges' },
  'Markham': { h1: 'Markham Investment Properties', region: 'York Region', place: 'from Unionville to the Highway 7 tech corridor' },
  'Aurora': { h1: 'Aurora Investment Properties', region: 'York Region', place: 'around Yonge and Wellington, on the Barrie GO line' },
  'Newmarket': { h1: 'Newmarket Investment Properties', region: 'York Region', place: 'near historic Main Street and Southlake hospital' },
  'King': { h1: 'King Investment Properties', region: 'York Region', place: 'in King City, Nobleton and Schomberg, on the Oak Ridges Moraine' },
  'Pickering': { h1: 'Pickering Investment Properties', region: 'Durham Region', place: 'around Pickering Town Centre and Lakeshore East GO' },
  'Ajax': { h1: 'Ajax Investment Properties', region: 'Durham Region', place: 'between the Ajax GO station and the Lake Ontario waterfront' },
  'Whitby': { h1: 'Whitby Investment Properties', region: 'Durham Region', place: 'from Brooklin down to the Whitby GO station and the harbour' },
  'Oshawa': { h1: 'Oshawa Investment Properties', region: 'Durham Region', place: 'near Ontario Tech University and the GM Oshawa assembly plant' },
  'Clarington': { h1: 'Clarington Investment Properties', region: 'Durham Region', place: 'in Bowmanville, Courtice, Newcastle and Orono' },
  'Etobicoke': { h1: 'Etobicoke Investment Properties', region: 'City of Toronto', place: 'from Mimico and Humber Bay Shores out to Kipling station' },
  'North York': { h1: 'North York Investment Properties', region: 'City of Toronto', place: 'along the Yonge and Sheppard subway lines' },
  'Scarborough': { h1: 'Scarborough Investment Properties', region: 'City of Toronto', place: 'from the Bluffs to Agincourt and Malvern' },
  'East York': { h1: 'East York Investment Properties', region: 'City of Toronto', place: 'around Leaside, the Danforth and Thorncliffe Park' },
  'York': { h1: 'York Investment Properties', region: 'City of Toronto', place: 'around Weston, Mount Dennis and the Eglinton West corridor' },
  'Hamilton': { h1: 'Hamilton Investment Properties', region: 'City of Hamilton', place: 'from the North End and lower city up onto the Mountain' },
  'Stoney Creek': { h1: 'Stoney Creek Investment Properties', region: 'City of Hamilton', place: 'east of Hamilton, below and atop the escarpment' },
  'Dundas': { h1: 'Dundas Investment Properties', region: 'City of Hamilton', place: 'in the Dundas Valley at the west end of Hamilton' },
  'Ancaster': { h1: 'Ancaster Investment Properties', region: 'City of Hamilton', place: 'on the escarpment above Hamilton, around the old village' },
};

// These 27 `sub` strings were templated twice over. First they were all
// "Active {city} listings — scored and analyzed"; an earlier pass rebuilt them
// as "Active {city} listings in {region} — cash flow, cap rate and deal score
// costed with {city}'s {rate}% property tax", which swapped in a REAL figure
// but still left 27 descriptions identical apart from a city name, a region
// and a percentage — and byte-identical for the five Toronto districts (all
// 0.63%) and the three Hamilton communities (all 1.26%), since those share
// their parent city's rate. Used as the meta description, the OG/Twitter
// description AND the visible hero subtitle, that is the near-duplicate,
// doorway-shaped pattern Google's guidance warns about, on the exact 27 URLs
// the sitemap submits at priority 0.7.
//
// Now the distinguishing content leads: each page opens with its own `place`
// clause (real communities/transit/geography, above), and the tax rate — still
// read from the SAME table the cash-flow engine uses, never restated by hand —
// follows as the differentiator. A city without its own researched rate (King)
// gets no rate rather than a fabricated one. Toronto keeps its hand-written
// aggregate copy: it already names five sub-areas and is unique as written.
Object.keys(CITY_COPY).forEach((city) => {
  const copy = CITY_COPY[city];
  if (!copy.place) return;
  const rate = hasExplicitTaxRate(city) ? getTaxRate(city) : null;
  copy.sub = rate
    ? `Active ${city} listings ${copy.place} — deal scores, cash flow and cap rates costed at ${(rate * 100).toFixed(2)}% property tax.`
    : `Active ${city} listings ${copy.place} — every listing scored for cash flow, cap rate and deal quality.`;
});

// Server-rendered, genuinely per-city content for the 28 indexable
// /gta?city= pages. Before this, everything below each page's h1 + one-line
// subtitle was byte-identical across all 28 (the listings themselves are
// client-fetched, so a crawler saw only skeletons) — 28 near-duplicate thin
// pages, which is why they sit unranked despite unique titles.
//
// Every figure here is READ from the same constants the cash-flow engine uses,
// never restated by hand, so this copy can't drift from the numbers on the
// cards. The tax rate prints only when the municipality has its own researched
// rate — a city on the generic fallback shows no rate rather than a fake one.
export function CityInvestorNotes({ city, copy }) {
  const rate = hasExplicitTaxRate(city) ? getTaxRate(city) : null;
  const siblings = Object.keys(CITY_COPY).filter(
    (c) => c !== city && CITY_COPY[c].region === copy.region
  );

  const faqItems = [];
  faqItems.push({
    question: `What investment metrics does MississaugaInvestor.ca show for ${city} properties?`,
    answer: `Each ${city} listing includes a Deal Score (1–10), estimated monthly cash flow, cap rate, and cash-on-cash return. All figures use a 20% down payment, the Bank of Canada 5-year stress-test rate, and ${city}'s ${rate ? `${(rate * 100).toFixed(2)}%` : 'actual'} municipal property tax rate — costs most listing sites leave out. ${city} is part of ${copy.region}${copy.place ? `, and the listings here run ${copy.place}` : ''}.`,
  });
  if (rate) {
    faqItems.push({
      question: `What is ${city}'s property tax rate?`,
      answer: `${city}'s residential property tax rate is ${(rate * 100).toFixed(2)}%. This rate is applied to the property's MPAC-assessed value and is used in every cash-flow and cap rate estimate shown on this page.`,
    });
  }
  if (siblings.length > 0) {
    const sibSample = siblings.slice(0, 4).join(', ');
    faqItems.push({
      question: `How does ${city} compare to other ${copy.region} investment markets?`,
      answer: `${city} is one of ${siblings.length + 1} ${copy.region} markets tracked on this site. You can also browse listings in ${sibSample}${siblings.length > 4 ? ' and others' : ''} — each with the same deal scoring and cash-flow analysis.`,
    });
  }

  return (
    <>
      <FAQJsonLd items={faqItems} />
      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="font-heading text-lg font-bold text-navy">Investing in {city}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {city} is part of {copy.region}
        {copy.place ? <> — listings here run {copy.place}</> : null}.{' '}
        {rate ? (
          <>
            Cash flow, cap rate and deal score here are costed with {city}&rsquo;s{' '}
            <strong className="font-semibold text-navy">{(rate * 100).toFixed(2)}%</strong> property tax rate whenever a
            listing doesn&rsquo;t report its own tax figure — municipal tax varies widely across the GTA, and it is a real
            monthly cost most listing sites leave out entirely.
          </>
        ) : (
          <>
            Every listing here is scored with the same cash-flow, cap-rate and deal-score model used across the site,
            including property tax, insurance and maintenance as monthly costs.
          </>
        )}{' '}
        {/* "an Oshawa/Ajax/Aurora/Ancaster/East York listing", not "a Oshawa listing" — five of the
            28 city names start with a vowel and read as a typo without the article agreeing. */}
        Rents are estimated per city, so {/^[AEIOU]/.test(city) ? 'an' : 'a'} {city} listing is not scored on
        Mississauga rent assumptions.
      </p>

      {siblings.length > 0 && (
        <p className="mt-4 text-sm text-muted">
          <span className="text-slate-500">More in {copy.region}:</span>{' '}
          {siblings.map((c, i) => (
            <span key={c}>
              {i > 0 && <span aria-hidden="true" className="text-slate-400"> · </span>}
              <Link
                href={`/gta/${cityToSlug(c)}`}
                className="font-medium text-accent no-underline hover:text-accent-dark"
              >
                {c}
              </Link>
            </span>
          ))}
        </p>
      )}

      <p className="mt-3 text-sm text-muted">
        <span className="text-slate-500">Also useful:</span>{' '}
        <Link href="/listings" className="font-medium text-accent no-underline hover:text-accent-dark">
          Mississauga investment properties
        </Link>
        <span aria-hidden="true" className="text-slate-400"> · </span>
        <Link href="/market-pulse" className="font-medium text-accent no-underline hover:text-accent-dark">
          GTA market data
        </Link>
        <span aria-hidden="true" className="text-slate-400"> · </span>
        <Link href="/mortgage-calculator" className="font-medium text-accent no-underline hover:text-accent-dark">
          Income property mortgage calculator
        </Link>
      </p>
    </section>
    </>
  );
}

// Per-city metadata is generated in gta/[city]/page.js. This export covers
// only the /gta hub view — any ?city= request is immediately redirected before
// a search engine ever reads these tags.
export function generateMetadata() {
  return {
    title: { absolute: 'GTA Investment Properties — Scored for Cash Flow' },
    description:
      'Investment properties across the GTA — Toronto, Brampton, Vaughan, Oakville and Hamilton — each scored for cash flow, cap rate and deal quality.',
    alternates: { canonical: '/gta' },
    openGraph: {
      title: 'GTA Investment Properties — Toronto, Brampton, Vaughan & More',
      description: 'Scored investment properties across the Greater Toronto Area — cash flow, cap rates, and deal scores on thousands of listings.',
      url: 'https://www.mississaugainvestor.ca/gta',
      // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'GTA Investment Properties — Toronto, Brampton, Vaughan & More' }],
    },
    // Next.js REPLACES (not merges) the root layout twitter object when a page
    // defines its own openGraph — without an explicit twitter block the /gta hub
    // shares text-only on X/Twitter/Slack/iMessage.
    twitter: {
      card: 'summary_large_image',
      title: 'GTA Investment Properties — Toronto, Brampton, Vaughan & More',
      description: 'Scored investment properties across the Greater Toronto Area — cash flow, cap rates, and deal scores on thousands of listings.',
      images: ['/opengraph-image'],
    },
  };
}

// Server-side inventory fetch, with the timeout that made this page
// client-only in the first place handled explicitly rather than avoided.
//
// The original note was right that the WHOLE-GTA query (30+ cities) can be
// slow. So: the fetch is capped by AbortSignal.timeout and any failure — slow
// feed, upstream error, abort — returns [] and hands rendering back to
// ListingsContainer's own client fetch, which is exactly today's behaviour.
// The server render can therefore never hang the page; the upside is that when
// the feed answers in time (the normal case, and always for the single-city
// pages that carry the SEO value) a crawler receives real listings instead of
// an empty shell.
//
// The per-city pages get the longer budget because they are the indexable ones
// and query a single city; the hub gets a short one because it is the heavy
// query and is not where the ranking value sits.
export async function fetchGtaListings(city) {
  // 25s. Verified against production runtime logs: the GTA feed call answers
  // 200 every time but takes LONGER than the old timeout on a cache-seeding
  // render (24.5k-row filter + $count + media expand + the field probe on a
  // cold API instance) — so the SSR fetch aborted, the page shipped an empty
  // shell, and the API logged a 200 nobody consumed. With the fetch cached at
  // revalidate 300 and served stale-while-revalidate, exactly ONE render per
  // 5 minutes pays this budget; every other render gets the cached rows
  // instantly. A generous seed budget is the difference between /gta having
  // SSR content and not having it.
  const timeoutMs = 25000;
  try {
    // Origin WITHOUT request APIs. The old `headers()` call here marked every
    // consumer dynamic — and because this try/catch swallowed the
    // DynamicServerError that headers() throws during prerender, all 28
    // /gta/[city] SSG pages were silently baked with `{ listings: [] }`:
    // permanently empty server HTML on the exact landing pages the sitemap
    // submits at priority 0.7, with no revalidate to ever heal them. Same
    // headers()-kills-ISR bug class fixed on the homepage and listing detail
    // (measured 56s TTFB there); VERCEL-gated so local `next start` cannot
    // point at the live domain.
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL ? 'https://www.mississaugainvestor.ca' : 'http://localhost:3000');
    const qs = city ? `&city=${encodeURIComponent(city)}` : '';
    // Shared feed fetch — see lib/listings/fetch-feed.js.
    //
    // limit = SSR_CARD_ROWS (30), not the default 100. This fetch was asking
    // for 100 rows and then handing exactly 30 to slimForSSR — 70 rows of pure
    // waste on the single call that was blowing its 25s budget. Runtime logs
    // showed `fetch-feed: /api/listings-gta page 1 failed (TimeoutError)` on
    // essentially every /gta/[city] regeneration, so all 28 city pages baked
    // their hero/FAQ/schema with ZERO server-rendered listings (real visitors
    // still got them from the client fetch — an SEO gap, not a broken page).
    // Row count is the lever that matters here: the Media $expand returns
    // roughly 5 CDN size-variants per photo, so the payload is dominated by
    // media rows and falls with $top more or less linearly — a 100-row GTA
    // page drags ~18k media rows, 30 rows drags ~5.4k. Nothing rendered
    // changes: the server paints 30 cards either way, `total`/`browsableTotal`
    // come from the upstream $count (independent of $top), and the client
    // container still background-fetches the full feed on mount and replaces
    // this slice. The alternative — making the city pages fully dynamic — was
    // rejected: it would risk this timeout on EVERY request, not one per five
    // minutes.
    const { listings: raw, first: data } = await fetchFeedPages(origin, '/api/listings-gta', {
      pages: 1,
      qs,
      timeoutMs,
      limit: SSR_CARD_ROWS,
    });
    if (!data) return { listings: [], total: 0 };
    // browsableTotal excludes the commercial/lease rows the site never shows.
    return { listings: processListings(raw), total: Number(data.browsableTotal ?? data.total) || 0 };
  } catch {
    return { listings: [], total: 0 }; // client fetch takes over — same as before this change
  }
}

export default async function GtaListingsPage({ searchParams }) {
  const city = (searchParams?.city || '').trim();

  // Old query-param URLs (/gta?city=Toronto) permanently redirect to path-segment
  // pages (/gta/toronto). This fixes "Duplicate, Google chose different canonical
  // than user" in GSC — query params are treated as filter variants of /gta, not
  // distinct pages, so Google never respected the ?city= self-canonicals.
  if (city && CITY_COPY[city]) {
    permanentRedirect('/gta/' + cityToSlug(city));
  }

  const copy = CITY_COPY[city]; // always null here since valid cities redirect above
  const { listings: initialListings, total: initialTotal } = await fetchGtaListings(city);

  const h1 = copy ? copy.h1 : 'GTA Investment Properties';
  const sub = copy
    ? copy.sub
    : 'The most recently updated listings across the Greater Toronto Area — scored and analyzed'; // ~24.5k GTA listings exist; the page loads the freshest slice, so "all" was an overclaim

  const chips = city
    ? []
    : ['Toronto', 'Brampton', 'Vaughan', 'Oakville', 'Hamilton', 'Markham', 'Richmond Hill', 'Milton', 'Georgetown', '+ More'];

  // Breadcrumb: add a city node on the city pages so each /gta?city= page gets
  // its own rich-result trail (Home › GTA Listings › {City}) instead of a
  // generic one shared across all 28 indexable city pages.
  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
    { name: 'GTA Listings', url: 'https://www.mississaugainvestor.ca/gta' },
    ...(copy
      ? [{ name: city, url: `https://www.mississaugainvestor.ca/gta/${cityToSlug(city)}` }]
      : []),
  ];

  // On the hub view (no city) mark /gta as the collection page for all the
  // per-city pages — mirrors the ItemList on /neighbourhoods so search engines
  // understand the directory and can discover/rank each of the 28 city pages.
  const cityListSchema = !city
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'GTA Investment Property Markets',
        itemListElement: Object.keys(CITY_COPY).map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `https://www.mississaugainvestor.ca/gta/${cityToSlug(c)}`,
          name: CITY_COPY[c].h1 || c,
        })),
      }
    : null;

  return (
    <main className="min-h-screen bg-cloud">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {cityListSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(cityListSchema) }} />
      )}
      {!city && <FAQJsonLd items={GTA_FAQ} />}
      <PageHero compact eyebrow="Greater Toronto Area" title={h1} subtitle={sub}>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((c) =>
              c === '+ More' ? (
                <span key={c} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                  {c}
                </span>
              ) : (
                // Clickable so a visitor can jump straight to the city (they
                // looked tappable but were plain text) — also crawlable links.
                <Link
                  key={c}
                  href={`/gta/${cityToSlug(c)}`}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 no-underline transition hover:bg-white/20 hover:text-white"
                >
                  {c}
                </Link>
              )
            )}
          </div>
        )}
      </PageHero>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          {city && (
            <div className="mb-3">
              <a
                href="/gta"
                className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-dark no-underline"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Browse all GTA deals
              </a>
            </div>
          )}
          {/* Region switcher — jump to Mississauga, All GTA, or any city. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white p-3">
            <RegionSwitcher current={city ? city : 'all-gta'} />
            <span className="text-xs text-slate-500">
              Switch area — Mississauga, all GTA, or any city.
            </span>
          </div>
          {/* CAP-vs-cash-flow clarifier (matches /listings) so GTA investors
              aren't confused by a positive cap rate next to negative cash flow. */}
          <p className="mt-3 text-xs text-slate-500">
            <span className="font-medium text-slate-500">CAP</span> is the all-cash yield (before financing);{' '}
            <span className="font-medium text-slate-500">cash flow</span> is after the mortgage — so a positive cap rate can still show slightly negative cash flow at today&apos;s rates.
          </p>
          {/* Internal links to the investor guides — passes link equity from the
              GTA pages and gives search visitors a useful next step. */}
          <p className="mt-2 text-sm text-slate-500">
            <span className="text-slate-500">Investor guides:</span>{' '}
            <Link href="/guides" className="font-medium text-accent hover:text-accent-dark no-underline">All guides</Link>
            <span aria-hidden="true" className="text-slate-400"> · </span>
            <Link href="/mississauga-vs-brampton-vs-hamilton" className="font-medium text-accent hover:text-accent-dark no-underline">Mississauga vs Brampton vs Hamilton</Link>
            <span aria-hidden="true" className="text-slate-400"> · </span>
            <Link href="/cash-flow-positive-properties-ontario" className="font-medium text-accent hover:text-accent-dark no-underline">Cash-flow-positive properties</Link>
            <span aria-hidden="true" className="text-slate-400"> · </span>
            <Link href="/townhouse-vs-condo-investment" className="font-medium text-accent hover:text-accent-dark no-underline">Townhouse vs condo</Link>
            <span aria-hidden="true" className="text-slate-400"> · </span>
            <Link href="/rent-by-bedroom-mississauga" className="font-medium text-accent hover:text-accent-dark no-underline">Rent by bedroom</Link>
          </p>
        </div>
        <Suspense>
          <ListingsContainer
            initialListings={slimForSSR(initialListings)}
            initialTotal={initialTotal}
            apiEndpoint="/api/listings-gta"
            popularHoods={['Toronto', 'Brampton', 'Vaughan', 'Oakville', 'Hamilton', 'Markham', 'Richmond Hill', 'Milton', 'Georgetown']}
          />
        </Suspense>
        {copy && <CityInvestorNotes city={city} copy={copy} />}

        {/* Server-rendered FAQ section — required for FAQPage schema (Google
            mandates the answers be visible on the page, not only in JSON-LD).
            Hub-only (!city): city pages already get FAQPage via CityInvestorNotes.
            Question set is DISJOINT from /listings FAQ (which covers down payment,
            closing costs, legal suites, Mississauga neighbourhoods). */}
        {!city && (
          <section className="mt-12">
            <h2 className="font-heading text-xl font-bold text-navy">
              Investing across the GTA: common questions
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {GTA_FAQ.map((qa) => (
                <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="font-heading text-sm font-semibold text-navy">{qa.question}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{qa.answer}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Browse a specific city above, compare markets in the{' '}
              <Link href="/mississauga-vs-brampton-vs-hamilton" className="font-medium text-accent no-underline hover:text-accent-dark">
                Mississauga vs Brampton vs Hamilton guide
              </Link>
              , or model any property in the{' '}
              <Link href="/mortgage-calculator" className="font-medium text-accent no-underline hover:text-accent-dark">
                income property mortgage calculator
              </Link>
              .
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
