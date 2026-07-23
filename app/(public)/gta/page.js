import { Suspense } from 'react';
import { ListingsContainer } from '@/components/listings/listings-container';
import { RegionSwitcher } from '@/components/listings/region-switcher';
import { PageHero } from '@/components/layout/page-hero';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

// All cities we support in the GTA mega-menu (must match header.js GTA_GROUPS).
// Exported so the sitemap can list every indexable /gta?city= page.
export const CITY_COPY = {
  'Toronto': { h1: 'Toronto Investment Properties', sub: 'Active listings across Toronto, Etobicoke, North York, Scarborough, East York & York' },
  'Brampton': { h1: 'Brampton Investment Properties', sub: 'Active Brampton listings — cash flow, cap rate, and deal score analysis' },
  'Caledon': { h1: 'Caledon Investment Properties', sub: 'Active Caledon listings — scored and analyzed' },
  'Oakville': { h1: 'Oakville Investment Properties', sub: 'Active Oakville listings — scored and analyzed' },
  'Burlington': { h1: 'Burlington Investment Properties', sub: 'Active Burlington listings — scored and analyzed' },
  'Milton': { h1: 'Milton Investment Properties', sub: 'Active Milton listings — scored and analyzed' },
  'Halton Hills': { h1: 'Halton Hills Investment Properties', sub: 'Active Halton Hills listings — scored and analyzed' },
  'Georgetown': { h1: 'Georgetown Investment Properties', sub: 'Active Georgetown listings — scored and analyzed' },
  'Vaughan': { h1: 'Vaughan Investment Properties', sub: 'Active Vaughan listings — scored and analyzed' },
  'Richmond Hill': { h1: 'Richmond Hill Investment Properties', sub: 'Active Richmond Hill listings — scored and analyzed' },
  'Markham': { h1: 'Markham Investment Properties', sub: 'Active Markham listings — scored and analyzed' },
  'Aurora': { h1: 'Aurora Investment Properties', sub: 'Active Aurora listings — scored and analyzed' },
  'Newmarket': { h1: 'Newmarket Investment Properties', sub: 'Active Newmarket listings — scored and analyzed' },
  'King': { h1: 'King Investment Properties', sub: 'Active King listings — scored and analyzed' },
  'Pickering': { h1: 'Pickering Investment Properties', sub: 'Active Pickering listings — scored and analyzed' },
  'Ajax': { h1: 'Ajax Investment Properties', sub: 'Active Ajax listings — scored and analyzed' },
  'Whitby': { h1: 'Whitby Investment Properties', sub: 'Active Whitby listings — scored and analyzed' },
  'Oshawa': { h1: 'Oshawa Investment Properties', sub: 'Active Oshawa listings — scored and analyzed' },
  'Clarington': { h1: 'Clarington Investment Properties', sub: 'Active Clarington listings — scored and analyzed' },
  'Etobicoke': { h1: 'Etobicoke Investment Properties', sub: 'Active Etobicoke listings — scored and analyzed' },
  'North York': { h1: 'North York Investment Properties', sub: 'Active North York listings — scored and analyzed' },
  'Scarborough': { h1: 'Scarborough Investment Properties', sub: 'Active Scarborough listings — scored and analyzed' },
  'East York': { h1: 'East York Investment Properties', sub: 'Active East York listings — scored and analyzed' },
  'York': { h1: 'York Investment Properties', sub: 'Active York listings — scored and analyzed' },
  'Hamilton': { h1: 'Hamilton Investment Properties', sub: 'Active Hamilton listings — scored and analyzed' },
  'Stoney Creek': { h1: 'Stoney Creek Investment Properties', sub: 'Active Stoney Creek listings — scored and analyzed' },
  'Dundas': { h1: 'Dundas Investment Properties', sub: 'Active Dundas listings — scored and analyzed' },
  'Ancaster': { h1: 'Ancaster Investment Properties', sub: 'Active Ancaster listings — scored and analyzed' },
};

export function generateMetadata({ searchParams }) {
  const city = (searchParams?.city || '').trim();
  const copy = CITY_COPY[city];
  if (copy) {
    return {
      title: copy.h1,
      description: copy.sub,
      alternates: { canonical: '/gta?city=' + encodeURIComponent(city) },
    };
  }
  return {
    title: 'GTA Investment Properties | Toronto, Brampton, Vaughan & More',
    description:
      'Browse scored investment properties across the Greater Toronto Area. Cash flow analysis, cap rates, and deal scores on thousands of listings in Toronto, Brampton, Vaughan, Oakville, Hamilton and more.',
    alternates: { canonical: '/gta' },
  };
}

// GTA page loads instantly with skeletons, then fetches client-side.
// This avoids SSR timeout from querying 30+ cities via AMPRE API.
// When ?city=X is present, the ListingsContainer forwards it to /api/listings-gta,
// which filters the AMPRE query to that city only.
export default function GtaListingsPage({ searchParams }) {
  const city = (searchParams?.city || '').trim();
  const copy = CITY_COPY[city];

  const h1 = copy ? copy.h1 : 'GTA Investment Properties';
  const sub = copy
    ? copy.sub
    : 'All active listings across the Greater Toronto Area — scored and analyzed';

  const chips = city
    ? []
    : ['Toronto', 'Brampton', 'Vaughan', 'Oakville', 'Hamilton', 'Markham', 'Richmond Hill', 'Milton', 'Georgetown', '+ More'];

  return (
    <main className="min-h-screen bg-cloud">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'GTA Listings', url: 'https://www.mississaugainvestor.ca/gta' },
        ]}
      />
      <PageHero compact eyebrow="Greater Toronto Area" title={h1} subtitle={sub}>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
              >
                {c}
              </span>
            ))}
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
        </div>
        <Suspense>
          <ListingsContainer
            initialListings={[]}
            apiEndpoint="/api/listings-gta"
            popularHoods={['Toronto', 'Brampton', 'Vaughan', 'Oakville', 'Hamilton', 'Markham', 'Richmond Hill', 'Milton', 'Georgetown']}
          />
        </Suspense>
      </div>
    </main>
  );
}
