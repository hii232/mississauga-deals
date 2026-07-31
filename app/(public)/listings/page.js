import { Suspense } from 'react';
import Link from 'next/link';
import { ListingsContainer } from '@/components/listings/listings-container';
import { RegionSwitcher } from '@/components/listings/region-switcher';
import { PageHero } from '@/components/layout/page-hero';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';
import { processListings } from '@/lib/listings/process-listings';
import { fetchFeedPages, slimForSSR } from '@/lib/listings/fetch-feed';

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
// DYNAMIC, deliberately — do not "fix" this back to ISR without reading this.
//
// The 2026-07-31 audit correctly found that a headers() call was silently
// disabling this file's `revalidate = 600`, and the SITE_URL constant turned
// real ISR on. Measured consequence on production: the Vercel build cannot
// reach the site's own /api/listings while building, so the first prerender
// baked with ZERO listings — 12 minutes after deploy this page served 0 cards
// and no ItemList schema.
//
// ISR did eventually heal it (20 listings ~50 min post-deploy), so the empty
// window was temporary, not permanent. It is still not good enough here: a
// deploy leaves the site's highest-value commercial page empty for crawlers
// for tens of minutes, every deploy, and the healed render was measurably
// thinner than a dynamic one (2 vs 33 cap-rate figures in the HTML for 20 vs
// 30 listings). Rendering per request costs a server render — which is what
// this page did for months — and guarantees full inventory on every crawl
// with no cold window.
//
// The SITE_URL fix below is kept: it is correct independent of caching mode
// and removes the local `next start` trap.
export const dynamic = 'force-dynamic';

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
  twitter: {
    card: 'summary_large_image',
    title: 'Investment Properties for Sale in Mississauga',
    description: 'Every active Mississauga investment property, scored for cash flow, cap rate and ROI — with legal-suite detection and price-drop alerts. Free to browse.',
    images: ['/opengraph-image'],
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
    // Origin WITHOUT request APIs: the old headers() call here marked the
    // route dynamic, which silently disabled this file's own
    // `revalidate = 600` — the primary money page paid full SSR + feed fetch
    // on every request, crawls included. VERCEL-gated (not NODE_ENV) so local
    // `next start` cannot point at the live domain.
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL ? 'https://www.mississaugainvestor.ca' : 'http://localhost:3000');
    // Shared feed fetch (lib/listings/fetch-feed.js) — same query path as
    // /gta and the homepage. One page of 100 — the grid renders 30 cards and
    // the ItemList uses 20, so a second page was pure payload. See the helper
    // for why this replaced a page-local fetch with a long-lived cache entry.
    const { listings: rawRows, first: data } = await fetchFeedPages(origin, '/api/listings', { pages: 1 });
    if (!data) return { listings: [], total: 0, displayTotal: 0, pages: 0 };
    const rows = processListings(rawRows);
    // browsableTotal excludes the commercial/lease rows the site never shows —
    // see /api/listings. Using the raw @odata.count here would advertise ~60
    // listings a visitor can never reach.
    const feedTotal = Number(data.browsableTotal ?? data.total) || rows.length;
    // The DISPLAYED total comes from the same canonical source every other
    // page quotes (/api/market-stats activeCount, same URL + same revalidate →
    // shared cache entry). Before this, each surface sampled its own count at
    // its own cache moment, so one crawl read 2,547 on the homepage, 2,555 on
    // /about and 2,591 here — three live numbers for one fact. feedTotal keeps
    // driving the pagination math; only the CLAIM is unified.
    let displayTotal = feedTotal;
    try {
      const ms = await fetch(`${origin}/api/market-stats`, { next: { revalidate: 300 } });
      if (ms.ok) {
        const stats = await ms.json();
        if (Number(stats.activeCount) > 0) displayTotal = Number(stats.activeCount);
      }
    } catch {}
    // data.pages is the API's OWN page count from the raw @odata.count.
    // Re-deriving it client-side from the post-filter browsableTotal computed
    // 13 where the truth was 14 — page 14's listings were permanently
    // unreachable (measured on production: real $2.8M-$4M listings lived there).
    return { listings: rows, total: feedTotal, displayTotal, pages: Number(data.pages) || 0 };
  } catch (err) {
    // MUST log. This catch previously swallowed silently, and when a stale
    // `${proto}://${host}` reference survived the headers()→origin refactor it
    // threw a ReferenceError on every production render — the money page
    // served zero server-rendered cards and zero ItemList schema for 50
    // minutes with NOTHING in the logs to say why. The env-less build could
    // not catch it either: the feed fetch fails first there and returns early,
    // so the faulty line never executes at build time.
    console.error('listings SSR: initial fetch failed —', err);
    return { listings: [], total: 0, displayTotal: 0, pages: 0 };
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
    // Must match the ItemList actually emitted below (20 entries) — this
    // declared the loaded-slice size (199) against a 20-item list, an
    // internally inconsistent schema object.
    numberOfItems: Math.min(listings.length, 20),
    itemListElement: listings.slice(0, 20).map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.mississaugainvestor.ca/listings/${encodeURIComponent(l.id)}`,
    })),
  };
}

export default async function ListingsPage() {
  const { listings, total, displayTotal, pages } = await fetchInitialListings();
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

      {/* Compact dusk PageHero — matches the /gta page identity and gives the
          site's #1 commercial page the same premium brand treatment as every
          other major page. The h1 lives inside PageHero so the exact money
          keyword "investment properties for sale mississauga" is preserved for
          search engines while appearing in a visually premium context. */}
      <PageHero
        compact
        eyebrow="Mississauga · Live MLS Data"
        title="Investment Properties for Sale in Mississauga"
        subtitle="Every active listing scored for cash flow, cap rate, and ROI — free to browse."
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          {/* text-slate-400 measured 2.56:1 on white for this 12px caption —
              fails AA. slate-500 (4.76:1) passes. */}
          <p className="text-xs text-slate-500">
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
            <span aria-hidden="true" className="text-slate-400"> · </span>
            <Link href="/legal-second-unit-mississauga" className="font-medium text-accent hover:text-accent-dark no-underline">
              Legal second unit guide
            </Link>
          </p>
          {/* Region switcher — Mississauga is the flagship default, but any GTA
              city is one tap away. */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white p-3">
            <RegionSwitcher current="mississauga" />
            <span className="text-xs text-slate-500">
              Now covering the whole GTA — switch to Toronto, Brampton, Oakville, Hamilton &amp; more.
            </span>
          </div>
        </div>
        <Suspense>
          <ListingsContainer
            initialListings={slimForSSR(listings)}
            initialTotal={total}
            initialPages={pages}
            displayTotal={displayTotal}
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
            . Shortlisted a few properties?{' '}
            <Link href="/compare" className="font-medium text-accent no-underline hover:text-accent-dark">
              Compare them side-by-side
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
