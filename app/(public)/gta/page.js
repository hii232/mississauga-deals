import { Suspense } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { processListings } from '@/lib/listings/process-listings';
import { ListingsContainer } from '@/components/listings/listings-container';
import { RegionSwitcher } from '@/components/listings/region-switcher';
import { PageHero } from '@/components/layout/page-hero';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { getTaxRate, hasExplicitTaxRate } from '@/lib/constants';

// All cities we support in the GTA mega-menu (must match header.js GTA_GROUPS).
// Exported so the sitemap can list every indexable /gta?city= page.
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
function CityInvestorNotes({ city, copy }) {
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
          <span className="text-slate-400">More in {copy.region}:</span>{' '}
          {siblings.map((c, i) => (
            <span key={c}>
              {i > 0 && <span className="text-slate-300"> · </span>}
              <Link
                href={`/gta?city=${encodeURIComponent(c)}`}
                className="font-medium text-accent no-underline hover:text-accent-dark"
              >
                {c}
              </Link>
            </span>
          ))}
        </p>
      )}

      <p className="mt-3 text-sm text-muted">
        <span className="text-slate-400">Also useful:</span>{' '}
        <Link href="/listings" className="font-medium text-accent no-underline hover:text-accent-dark">
          Mississauga investment properties
        </Link>
        <span className="text-slate-300"> · </span>
        <Link href="/market-pulse" className="font-medium text-accent no-underline hover:text-accent-dark">
          GTA market data
        </Link>
        <span className="text-slate-300"> · </span>
        <Link href="/mortgage-calculator" className="font-medium text-accent no-underline hover:text-accent-dark">
          Income property mortgage calculator
        </Link>
      </p>
    </section>
  );
}

export function generateMetadata({ searchParams }) {
  const city = (searchParams?.city || '').trim();
  const copy = CITY_COPY[city];
  if (copy) {
    const canonical = '/gta?city=' + encodeURIComponent(city);
    return {
      title: copy.h1,
      description: copy.sub,
      alternates: { canonical },
      // Per-city social card: without this the 28 city pages inherit the root's
      // generic OG title (Next uses the parent openGraph when a page omits it),
      // so a shared Toronto link read "MississaugaInvestor.ca…" not "Toronto…".
      // Keep the branded /opengraph-image.
      openGraph: {
        title: copy.h1,
        description: copy.sub,
        url: `https://www.mississaugainvestor.ca${canonical}`,
        images: ['/opengraph-image'],
      },
      twitter: {
        card: 'summary_large_image',
        title: copy.h1,
        description: copy.sub,
        images: ['/opengraph-image'],
      },
    };
  }
  return {
    title: { absolute: 'GTA Investment Properties — Scored for Cash Flow' },
    description:
      'Investment properties across the GTA — Toronto, Brampton, Vaughan, Oakville and Hamilton — each scored for cash flow, cap rate and deal quality.',
    alternates: { canonical: '/gta' },
    openGraph: {
      title: 'GTA Investment Properties — Toronto, Brampton, Vaughan & More',
      description: 'Scored investment properties across the Greater Toronto Area — cash flow, cap rates, and deal scores on thousands of listings.',
      url: 'https://www.mississaugainvestor.ca/gta',
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
async function fetchGtaListings(city) {
  const timeoutMs = city ? 8000 : 4000;
  try {
    const h = await headers();
    const host = h.get('host') || 'www.mississaugainvestor.ca';
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
    const origin = `${isLocal ? 'http' : 'https'}://${host}`;
    const qs = city ? `&city=${encodeURIComponent(city)}` : '';
    const res = await fetch(`${origin}/api/listings-gta?limit=200&page=1${qs}`, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return processListings(data.listings || []);
  } catch {
    return []; // client fetch takes over — same as before this change
  }
}

export default async function GtaListingsPage({ searchParams }) {
  const city = (searchParams?.city || '').trim();
  const copy = CITY_COPY[city];
  const initialListings = await fetchGtaListings(city);

  const h1 = copy ? copy.h1 : 'GTA Investment Properties';
  const sub = copy
    ? copy.sub
    : 'All active listings across the Greater Toronto Area — scored and analyzed';

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
      ? [{ name: city, url: `https://www.mississaugainvestor.ca/gta?city=${encodeURIComponent(city)}` }]
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
          url: `https://www.mississaugainvestor.ca/gta?city=${encodeURIComponent(c)}`,
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
                  href={`/gta?city=${encodeURIComponent(c)}`}
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
          <p className="mt-3 text-xs text-slate-400">
            <span className="font-medium text-slate-500">CAP</span> is the all-cash yield (before financing);{' '}
            <span className="font-medium text-slate-500">cash flow</span> is after the mortgage — so a positive cap rate can still show slightly negative cash flow at today&apos;s rates.
          </p>
          {/* Internal links to the investor guides — passes link equity from the
              GTA pages and gives search visitors a useful next step. */}
          <p className="mt-2 text-sm text-slate-500">
            <span className="text-slate-400">Investor guides:</span>{' '}
            <Link href="/guides" className="font-medium text-accent hover:text-accent-dark no-underline">All guides</Link>
            <span className="text-slate-300"> · </span>
            <Link href="/cash-flow-positive-properties-ontario" className="font-medium text-accent hover:text-accent-dark no-underline">Cash-flow-positive properties</Link>
            <span className="text-slate-300"> · </span>
            <Link href="/townhouse-vs-condo-investment" className="font-medium text-accent hover:text-accent-dark no-underline">Townhouse vs condo</Link>
          </p>
        </div>
        <Suspense>
          <ListingsContainer
            initialListings={initialListings}
            apiEndpoint="/api/listings-gta"
            popularHoods={['Toronto', 'Brampton', 'Vaughan', 'Oakville', 'Hamilton', 'Markham', 'Richmond Hill', 'Milton', 'Georgetown']}
          />
        </Suspense>
        {copy && <CityInvestorNotes city={city} copy={copy} />}
      </div>
    </main>
  );
}
