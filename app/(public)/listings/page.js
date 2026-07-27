import { Suspense } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { ListingsContainer } from '@/components/listings/listings-container';
import { RegionSwitcher } from '@/components/listings/region-switcher';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';
import { processListings } from '@/lib/listings/process-listings';

// SERVER-RENDERED. This page previously shipped a header, an h1 and a footer —
// the listings themselves were fetched client-side, so Googlebot received an
// empty shell and none of the inventory was indexable. That made the site's
// highest-value commercial page invisible for the query it targets.
//
// ISR: the HTML is built on the server and re-used for 10 minutes, so a
// crawler always gets a full page without every request hitting the MLS feed.
// ListingsContainer keeps ALL its interactivity — it takes these rows as
// initialListings and skips its own fetch when they are present, so filters,
// sorting, the map and the gate behave exactly as before.
export const revalidate = 600;

// Buying-side questions for the money page. Deliberately DISTINCT from the
// /faq set (which covers the product, the deal score and Hamza) so the two
// pages never publish duplicate FAQ markup competing for the same rich result.
// Every figure quoted here is one the site's own engine uses — the $2,500
// legal / $500 inspection line items and the land-transfer treatment come
// straight from getClosingCosts, so this copy can't drift from the calculator.
const LISTINGS_FAQ = [
  {
    question: 'Are these all the investment properties for sale in Mississauga?',
    answer:
      'Yes — this page lists every active residential listing in Mississauga from the TRREB/PropTx MLS feed, not a hand-picked selection. Each one is scored automatically for cash flow, cap rate and cash-on-cash return, so a listing appears whether or not the numbers work. Use the filters to narrow by price, beds, property type, neighbourhood or strategy.',
  },
  {
    question: 'How much down payment do I need for an investment property in Ontario?',
    answer:
      'A property you will not live in requires at least 20% down — mortgage default insurance is not available on non-owner-occupied rentals, so the low-down-payment options open to primary residences do not apply. If you plan to live in one unit of a two-to-four-unit property, less may be possible. Every figure on this page assumes 20% down; you can change that assumption on any listing page or in the mortgage calculator.',
  },
  {
    question: 'What closing costs should I budget on top of the down payment?',
    answer:
      'Land transfer tax is the big one, and it is charged on a sliding scale — on a $1,000,000 purchase the Ontario tax alone is $16,475. Properties in the City of Toronto pay a municipal land transfer tax on top of that, roughly doubling it. Budget about $2,500 for legal fees and title insurance and a few hundred more for the inspection. The cash-to-close figure on each listing page adds all of this up for you.',
  },
  {
    question: 'Does a legal basement suite change the numbers?',
    answer:
      'Substantially — a second suite adds a second rent cheque against the same mortgage, which is what moves many Mississauga properties from negative to positive cash flow. Listings flagged as having a legal suite have that income counted in full; where a suite looks possible but is not confirmed legal, the income is discounted before it reaches the score, so an unverified basement never flatters a deal.',
  },
  {
    question: 'Which Mississauga neighbourhoods have the best cash flow?',
    answer:
      'Cash flow generally improves as you move away from the waterfront — the lower entry prices in areas like Malton, Cooksville and Mississauga Valleys carry rents that are far closer to their purchase prices than Port Credit or Lorne Park. Rather than trusting a static ranking, sort this page by cash flow, or read the neighbourhood guides, which are rebuilt from live listing data.',
  },
];

// Title/H1/intro exact-match the high-intent GSC query "investment properties
// for sale mississauga" (pos ~14, real impressions — the money keyword).
export const metadata = {
  title: { absolute: 'Investment Properties for Sale in Mississauga' },
  description:
    'Every active Mississauga investment property, scored for cash flow, cap rate and ROI — with legal-suite detection and price-drop alerts. Free to browse.',
  alternates: { canonical: '/listings' },
  // Own openGraph block. Without one this page inherited the ROOT's,
  // whose url is the homepage — so every share of this URL showed
  // homepage branding and pointed crawlers at '/'. Next REPLACES the
  // openGraph object rather than merging it, so the image has to be
  // restated here or the card ships without one.
  openGraph: {
    title: 'Investment Properties for Sale in Mississauga',
    description: 'Every active Mississauga investment property, scored for cash flow, cap rate and ROI — with legal-suite detection and price-drop alerts. Free to browse.',
    url: 'https://www.mississaugainvestor.ca/listings',
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Investment Properties for Sale in Mississauga' }],
  },
};

// Loads instantly with skeletons, then fetches client-side progressively.
// Page 1 (200 listings) appears in ~1-2s, remaining pages load in background.
// Server-side fetch of the first page of inventory. Deliberately ONE page
// (200 rows): enough that the HTML is substantive and the top of the market is
// indexable, without making the crawler wait on 13 upstream requests. A
// failure returns [] and the client fetch takes over exactly as it does today,
// so a feed hiccup degrades to the old behaviour rather than an error page.
async function fetchInitialListings() {
  try {
    const h = await headers();
    const host = h.get('host') || 'www.mississaugainvestor.ca';
    // Local hosts appear as BOTH "localhost:3000" and "127.0.0.1:3000"; matching
    // only the former built an https:// URL against a plain-http dev server, the
    // TLS error hit the catch, and the page silently fell back to an empty
    // server render — which looked exactly like SSR not working at all.
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
    const proto = isLocal ? 'http' : 'https';
    const res = await fetch(`${proto}://${host}/api/listings?limit=200&page=1`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return { listings: [], total: 0 };
    const data = await res.json();
    const rows = processListings(data.listings || []);
    return { listings: rows, total: Number(data.total) || rows.length };
  } catch {
    return { listings: [], total: 0 };
  }
}

// ItemList of the inventory actually rendered on this page. This was
// deliberately deferred back on 2026-07-21 with the note "listings are
// client-fetched, no server data for an ItemList" — that blocker disappeared
// when the page became server-rendered, so the money page can finally declare
// its collection to search engines.
//
// Capped at the first 20: an ItemList is a summary, and declaring 200 items
// bloats the HTML for no ranking benefit. Each entry is a bare position+url
// pointing at the listing's own page, which carries the full RealEstateListing
// markup — no prices or metrics are restated here, so this schema can never
// drift from the numbers on the cards.
function buildItemList(listings) {
  if (!listings.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Investment Properties for Sale in Mississauga',
    numberOfItems: listings.length,
    itemListElement: listings.slice(0, 20).map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.mississaugainvestor.ca/listings/${encodeURIComponent(l.id)}`,
    })),
  };
}

export default async function ListingsPage() {
  const { listings, total } = await fetchInitialListings();
  const itemList = buildItemList(listings);

  return (
    <main className="min-h-screen bg-cloud">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Investment Properties for Sale', url: 'https://www.mississaugainvestor.ca/listings' },
        ]}
      />
      <FAQJsonLd items={LISTINGS_FAQ} />
      {itemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
        />
      )}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy">
            Investment Properties for Sale in Mississauga
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Every active Mississauga listing scored and analyzed for cash flow, cap rate, and ROI.
          </p>
          {/* text-slate-400 measured 2.56:1 on white for this 12px caption —
              fails AA. slate-500 (4.76:1) is the token already used correctly
              for the two inline terms right below it; the surrounding prose
              had just never been raised to match. */}
          <p className="mt-1 text-xs text-slate-500">
            <span className="font-medium text-slate-500">CAP</span> is the all-cash yield (before financing);{' '}
            <span className="font-medium text-slate-500">cash flow</span> is after the mortgage — so a positive cap rate can still show slightly negative cash flow at today&apos;s rates.
          </p>
          <p className="mt-1.5 text-sm text-slate-500">
            <span className="text-slate-500">Investor guides:</span>{' '}
            <Link href="/cash-flow-positive-properties-ontario" className="font-medium text-accent hover:text-accent-dark no-underline">
              Cash-flow-positive properties
            </Link>
            <span aria-hidden="true" className="text-slate-400"> · </span>
            <Link href="/townhouse-vs-condo-investment" className="font-medium text-accent hover:text-accent-dark no-underline">
              Townhouse vs condo
            </Link>
            <span aria-hidden="true" className="text-slate-400"> · </span>
            <Link href="/rent-by-bedroom-mississauga" className="font-medium text-accent hover:text-accent-dark no-underline">
              Rent by bedroom
            </Link>
          </p>
          {/* Region switcher — Mississauga is the flagship default, but any GTA
              city is one tap away (routes to the /gta?city= pages). */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white p-3">
            <RegionSwitcher current="mississauga" />
            <span className="text-xs text-slate-500">
              Now covering the whole GTA — switch to Toronto, Brampton, Oakville, Hamilton &amp; more.
            </span>
          </div>
        </div>
        <Suspense>
          <ListingsContainer
            initialListings={listings}
            initialTotal={total}
            apiEndpoint="/api/listings"
          />
        </Suspense>

        {/* Server-rendered buying guidance. The listings themselves arrive
            client-side, so without this the highest-value commercial page
            offers a crawler four short paragraphs — thin for the query it
            targets. Mirrors the FAQ schema above it exactly. */}
        <section className="mt-12">
          <h2 className="font-heading text-xl font-bold text-navy">
            Buying an investment property in Mississauga: common questions
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {LISTINGS_FAQ.map((qa) => (
              <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-heading text-sm font-semibold text-navy">{qa.question}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{qa.answer}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Model a specific property in the{' '}
            <Link href="/mortgage-calculator" className="font-medium text-accent no-underline hover:text-accent-dark">
              income property mortgage calculator
            </Link>
            , see how each score is built on the{' '}
            <Link href="/score-methodology" className="font-medium text-accent no-underline hover:text-accent-dark">
              methodology page
            </Link>
            , or compare areas in the{' '}
            <Link href="/neighbourhoods" className="font-medium text-accent no-underline hover:text-accent-dark">
              Mississauga neighbourhood guides
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
