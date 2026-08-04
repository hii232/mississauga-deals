import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  CITY_COPY,
  cityToSlug,
  fetchGtaListings,
  fetchGtaScreenerSummary,
  CityInvestorNotes,
} from '@/app/(public)/gta/page';
import { ListingsContainer } from '@/components/listings/listings-container';
import { RegionSwitcher } from '@/components/listings/region-switcher';
import { PageHero } from '@/components/layout/page-hero';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { slimForSSR } from '@/lib/listings/fetch-feed';

// Same generous budget as the parent GTA hub page - single-city fetches are
// faster than the whole-GTA query, but a generous limit seeds the cache.
export const maxDuration = 60;

// Resolve a URL slug (e.g. "halton-hills") back to the CITY_COPY key.
function slugToCity(slug) {
  return (
    Object.keys(CITY_COPY).find((city) => cityToSlug(city) === slug) || null
  );
}

// Pre-declare all known city slugs so Next.js knows the valid paths at build
// time. dynamicParams = false means any unrecognised slug gets a 404 rather
// than a slow on-demand render.
export function generateStaticParams() {
  return Object.keys(CITY_COPY).map((city) => ({ city: cityToSlug(city) }));
}

export const dynamicParams = false;

// ISR for the baked listings. Without this the 28 city pages were generated
// exactly once at build time - and because fetchGtaListings' old headers()
// call threw during prerender (swallowed by its catch), what got baked was an
// EMPTY listings array, permanently: no revalidate meant the empty shells
// never healed. 300s matches the feed fetch's own cache window.
export const revalidate = 300;

export async function generateMetadata({ params }) {
  const city = slugToCity(params.city);
  if (!city) return {};
  const copy = CITY_COPY[city];
  const slug = params.city;
  const canonical = `/gta/${slug}`;
  return {
    title: copy.h1,
    description: copy.sub,
    alternates: { canonical },
    openGraph: {
      title: copy.h1,
      description: copy.sub,
      url: `https://www.mississaugainvestor.ca${canonical}`,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: copy.h1 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.h1,
      description: copy.sub,
      images: ['/opengraph-image'],
    },
  };
}

export default async function GtaCityPage({ params }) {
  const city = slugToCity(params.city);
  if (!city) notFound();

  const copy = CITY_COPY[city];
  const slug = params.city;
  // In PARALLEL - the summary read must not lengthen an ISR regeneration that
  // already struggles to land its feed fetch inside the budget.
  //
  // `summary` is this CITY's whole-market Deal Screener aggregate, sliced out
  // of the single grouped GTA feed walk. Null for any city the walk cannot
  // cover honestly (and on a cold cache), and null keeps today's skeletons.
  const [{ listings: initialListings, total: initialTotal }, summary] = await Promise.all([
    fetchGtaListings(city),
    fetchGtaScreenerSummary(city),
  ]);

  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
    { name: 'GTA Listings', url: 'https://www.mississaugainvestor.ca/gta' },
    {
      name: city,
      url: `https://www.mississaugainvestor.ca/gta/${slug}`,
    },
  ];

  return (
    <main className="min-h-screen bg-cloud">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <PageHero compact eyebrow="Greater Toronto Area" title={copy.h1} subtitle={copy.sub} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="mb-3">
            <a
              href="/gta"
              className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-dark no-underline"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Browse all GTA deals
            </a>
          </div>
          {/* Region switcher - lets visitor jump to Mississauga, all GTA, or a
              different city without going back to the hub. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white p-3">
            <RegionSwitcher current={city} />
            <span className="text-xs text-slate-500">
              Switch area - Mississauga, all GTA, or any city.
            </span>
          </div>
          {/* CAP-vs-cash-flow clarifier (matches /listings and /gta hub). */}
          <p className="mt-3 text-xs text-slate-500">
            <span className="font-medium text-slate-500">CAP</span> is the all-cash yield (before financing);{' '}
            <span className="font-medium text-slate-500">cash flow</span> is after the mortgage - so a positive cap rate can still show slightly negative cash flow at today&apos;s rates.
          </p>
          {/* Internal links to investor guides - passes link equity from city
              pages and gives search visitors a useful next step. */}
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
            initialSummary={summary}
            apiEndpoint="/api/listings-gta"
            city={city}
            popularHoods={[
              'Toronto',
              'Brampton',
              'Vaughan',
              'Oakville',
              'Hamilton',
              'Markham',
              'Richmond Hill',
              'Milton',
              'Georgetown',
            ]}
          />
        </Suspense>
        <CityInvestorNotes city={city} copy={copy} />
      </div>
    </main>
  );
}
