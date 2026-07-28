import { Suspense } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { permanentRedirect } from 'next/navigation';
import { processListings } from '@/lib/listings/process-listings';
import { fetchFeedPages, slimForSSR } from '@/lib/listings/fetch-feed';
import { ListingsContainer } from '@/components/listings/listings-container';
import { RegionSwitcher } from '@/components/listings/region-switcher';
import { PageHero } from '@/components/layout/page-hero';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { getTaxRate, hasExplicitTaxRate } from '@/lib/constants';

// Room for the 25s cache-seeding feed fetch below — without this the page
// function itself can be killed at the platform default before the fetch
// resolves, which reproduces the empty shell with a longer fuse.
export const maxDuration = 60;

// Convert a city name to a URL path segment.
// "Halton Hills" → "halton-hills", "Toronto" → "toronto".
// Exported so gta/[city]/page.js can use the same function without duplicating.
export function cityToSlug(city) {
  return city.toLowerCase().replace(/\s+/g, '-');
}

// All cities we support in the GTA mega-menu (must match header.js GTA_GROUPS).
// Exported so the sitemap and gta/[city]/page.js can reference each city.
export const CITY_COPY = {
  'Toronto': { h1: 'Toronto Investment Properties', sub: 'Active listings across Toronto, Etobicoke, North York, Scarborough, East York & York', region: 'City of Toronto' },
  'Brampton': { h1: 'Brampton Investment Properties', sub: 'Active Brampton listings — cash flow, cap rate, and deal score analysis', region: 'Peel Region' },
  'Caledon': { h1: 'Caledon Investment Properties', sub: 'Active Caledon listings — scored and analyzed', region: 'Peel Region' },
  'Oakville': { h1: 'Oakville Investment Properties', sub: 'Active Oakville listings — scored and analyzed', region: 'Halton Region' },
  'Burlington': { h1: 'Burlington Investment Properties', sub: 'Active Burlington listings — scored and analyzed', region: 'Halton Region' },
  'Milton': { h1: 'Milton Investment Properties', sub: 'Active Milton listings — scored and analyzed', region: 'Halton Region' },
  'Halton Hills': { h1: 'Halton Hills Investment Properties', sub: 'Active Halton Hills listings — scored and analyzed', region: 'Halton Region' },
  'Georgetown': { h1: 'Georgetown Investment Properties', sub: 'Active Georgetown listings — scored and analyzed', region: 'Halton Region' },
  'Vaughan': { h1: 'Vaughan Investment Properties', sub: 'Active Vaughan listings — scored and analyzed', region: 'York Region' },
  'Richmond Hill': { h1: 'Richmond Hill Investment Properties', sub: 'Active Richmond Hill listings — scored and analyzed', region: 'York Region' },
  'Markham': { h1: 'Markham Investment Properties', sub: 'Active Markham listings — scored and analyzed', region: 'York Region' },
  'Aurora': { h1: 'Aurora Investment Properties', sub: 'Active Aurora listings — scored and analyzed', region: 'York Region' },
  'Newmarket': { h1: 'Newmarket Investment Properties', sub: 'Active Newmarket listings — scored and analyzed', region: 'York Region' },
  'King': { h1: 'King Investment Properties', sub: 'Active King listings — scored and analyzed', region: 'York Region' },
  'Pickering': { h1: 'Pickering Investment Properties', sub: 'Active Pickering listings — scored and analyzed', region: 'Durham Region' },
  'Ajax': { h1: 'Ajax Investment Properties', sub: 'Active Ajax listings — scored and analyzed', region: 'Durham Region' },
  'Whitby': { h1: 'Whitby Investment Properties', sub: 'Active Whitby listings — scored and analyzed', region: 'Durham Region' },
  'Oshawa': { h1: 'Oshawa Investment Properties', sub: 'Active Oshawa listings — scored and analyzed', region: 'Durham Region' },
  'Clarington': { h1: 'Clarington Investment Properties', sub: 'Active Clarington listings — scored and analyzed', region: 'Durham Region' },
  'Etobicoke': { h1: 'Etobicoke Investment Properties', sub: 'Active Etobicoke listings — scored and analyzed', region: 'City of Toronto' },
  'North York': { h1: 'North York Investment Properties', sub: 'Active North York listings — scored and analyzed', region: 'City of Toronto' },
  'Scarborough': { h1: 'Scarborough Investment Properties', sub: 'Active Scarborough listings — scored and analyzed', region: 'City of Toronto' },
  'East York': { h1: 'East York Investment Properties', sub: 'Active East York listings — scored and analyzed', region: 'City of Toronto' },
  'York': { h1: 'York Investment Properties', sub: 'Active York listings — scored and analyzed', region: 'City of Toronto' },
  'Hamilton': { h1: 'Hamilton Investment Properties', sub: 'Active Hamilton listings — scored and analyzed', region: 'City of Hamilton' },
  'Stoney Creek': { h1: 'Stoney Creek Investment Properties', sub: 'Active Stoney Creek listings — scored and analyzed', region: 'City of Hamilton' },
  'Dundas': { h1: 'Dundas Investment Properties', sub: 'Active Dundas listings — scored and analyzed', region: 'City of Hamilton' },
  'Ancaster': { h1: 'Ancaster Investment Properties', sub: 'Active Ancaster listings — scored and analyzed', region: 'City of Hamilton' },
};

// 27 of these 28 `sub` strings above were "Active {city} listings — scored and
// analyzed" — the SAME five words with only the city name swapped, used as the
// meta description, OG/Twitter description AND the visible hero subtitle on
// every one of those pages. That is the near-duplicate-content pattern Google's
// own guidance warns hurts indexing, and it wasted the one real, city-specific
// fact these pages already have on hand: the municipal property tax rate
// CityInvestorNotes states in prose lower on the same page. Rebuilding `sub`
// from `region` + the real researched rate (read from the SAME table the
// cash-flow engine uses — never restated by hand) makes all 27 genuinely
// distinct instead of templated, and ties the description to this site's
// actual differentiator (real per-city tax, not a generic listing blurb).
// Toronto keeps its own hand-written aggregate copy (it names 5 sub-areas,
// which is already unique and would be redundant to regenerate).
Object.keys(CITY_COPY).forEach((city) => {
  if (city === 'Toronto') return;
  const copy = CITY_COPY[city];
  const rate = hasExplicitTaxRate(city) ? getTaxRate(city) : null;
  copy.sub = rate
    ? `Active ${city} listings in ${copy.region} — cash flow, cap rate and deal score costed with ${city}'s ${(rate * 100).toFixed(2)}% property tax.`
    : `Active ${city} listings in ${copy.region} — cash flow, cap rate and deal score analysis for investors.`;
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

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="font-heading text-lg font-bold text-navy">Investing in {city}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {city} is part of {copy.region}.{' '}
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
        Rents are estimated per city, so a {city} listing is not scored on Mississauga rent assumptions.
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
    const h = await headers();
    const host = h.get('host') || 'www.mississaugainvestor.ca';
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
    const origin = `${isLocal ? 'http' : 'https'}://${host}`;
    const qs = city ? `&city=${encodeURIComponent(city)}` : '';
    // Shared feed fetch — see lib/listings/fetch-feed.js.
    const { listings: raw, first: data } = await fetchFeedPages(origin, '/api/listings-gta', { pages: 1, qs, timeoutMs });
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
      </div>
    </main>
  );
}
