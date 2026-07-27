import Link from 'next/link';
import { headers } from 'next/headers';
import { RecentSalesClient } from './recent-sales-client';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';
import InlineCTA from '@/components/ui/inline-cta';
import { fmtK } from '@/lib/utils/format';

const YEAR = new Date().getFullYear();

// TRREB Market Watch publishes these CITY-WIDE aggregate figures openly —
// unlike the individual sold records (address, exact price) in
// RecentSalesClient's table, which now require registration per TRREB's VOW
// rules (see the compliance fix that gated that table). Server-fetched so
// this substance survives for anonymous visitors and crawlers, who since
// that fix see only the registration gate where the comps table used to
// render — this page's whole reason to exist is the query "mississauga sold
// prices", so it needs real numbers even before someone registers.
async function fetchMarketSnapshot() {
  try {
    const h = await headers();
    const host = h.get('host') || 'www.mississaugainvestor.ca';
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
    const proto = isLocal ? 'http' : 'https';
    const res = await fetch(`${proto}://${host}/api/market-stats`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// The sales table itself is client-fetched, so this page shipped a crawler
// little more than its h1 while targeting a genuinely high-intent query
// ("mississauga sold prices"). These answer what a searcher for sold data
// actually wants to know, and — like the /market-pulse set — carry NO figures:
// the numbers on this page change with every sale, and schema can be surfaced
// by Google long after a refresh. Questions are disjoint from /faq, /listings
// and /market-pulse so no two pages compete for the same rich result.
const SOLD_FAQ = [
  {
    question: 'Are home sold prices public in Ontario?',
    answer:
      'Not in the way they are in much of the United States. Ontario sold prices are not published on public listing portals — they are held in the TRREB MLS® system and released only through a REALTOR® or a Virtual Office Website operated under a board agreement, which is how the sales on this page are shown. That is also why the data may only be used by people with a bona fide interest in buying, selling or leasing, not for general commercial purposes.',
  },
  {
    question: 'Why does a sold price matter more than a list price?',
    answer:
      "A list price is an asking strategy — it can be set low to attract competing offers or high to leave negotiating room, and neither tells you what the market paid. The sold price is the only number both a buyer and a seller agreed to. For an investor it is the input that matters: your return is calculated on what you actually pay, not on what the seller hoped for.",
  },
  {
    question: 'What is the list-to-sold gap and how should I read it?',
    answer:
      'It is the difference between the asking price and the final sale price, shown on each sale here. A consistent pattern of sales closing above asking in a neighbourhood means competing offers and little negotiating room; sales closing below asking mean the opposite. Reading the gap across recent comparable sales before you write an offer is the difference between a considered number and a guess.',
  },
  {
    question: 'How recent is this sold data?',
    answer:
      'The sales on this page come from the MLS feed and refresh continuously as transactions close and are reported. Sold data always lags a little because a sale is only reported once it firms up, so the most recent days are usually thinner than they will eventually look. For a wider monthly view of the same market, the market-pulse page carries TRREB Market Watch figures with the report month stated.',
  },
  {
    question: 'How do I use sold comps to decide what to offer?',
    answer:
      'Start with sales of the same property type and bedroom count in the same neighbourhood within the last few months, then adjust for the obvious differences — finished basement, parking, lot, condition, renovation. Look at both the sold prices and how long each took to sell. On this site every active listing page also shows nearby closed sales alongside its cash-flow and cap-rate analysis, so you can judge price and return together.',
  },
];

export const metadata = {
  title: { absolute: `Mississauga Sold Prices ${YEAR} — Recent Home Sales` },
  description:
    `What homes actually sold for in Mississauga in ${YEAR}: real sold prices, days on market and list-vs-sold gaps, updated from MLS. Know it before you offer.`,
  alternates: { canonical: '/recent-sales' },
  openGraph: {
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `Mississauga Sold Prices ${YEAR} — Recent Home Sales` }],
    title: `Mississauga Sold Prices ${YEAR} — Recent Home Sales`,
    description:
      'Real sold prices, days on market, and negotiation gaps for Mississauga homes, updated from MLS data.',
    url: 'https://www.mississaugainvestor.ca/recent-sales',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Mississauga Sold Prices ${YEAR} — Recent Home Sales`,
    description:
      'Real sold prices, days on market, and negotiation gaps for Mississauga homes, updated from MLS data.',
    images: ['/opengraph-image'],
  },
};

export default async function RecentSalesPage() {
  const marketStats = await fetchMarketSnapshot();
  const hasSnapshot = !!marketStats?.tRREBMonth && marketStats.mississaugaAvgPrice > 0;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Recent Sales', url: 'https://www.mississaugainvestor.ca/recent-sales' },
        ]}
      />
      <FAQJsonLd items={SOLD_FAQ} />
      <RecentSalesClient />

      {/* Server-rendered aggregate snapshot — always real, never gated (see
          fetchMarketSnapshot above for why this exists and why it's safe). */}
      {hasSnapshot && (
        <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="card p-6">
            <h2 className="font-heading text-lg font-bold text-navy">
              Mississauga Sold Market Snapshot — {marketStats.tRREBMonth}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
              <div className="text-center">
                <p className="text-[10px] font-medium uppercase text-slate-500 mb-1">Avg Sold Price</p>
                <p className="font-heading font-bold text-lg text-navy">{fmtK(marketStats.mississaugaAvgPrice)}</p>
              </div>
              {marketStats.mississaugaMedianPrice > 0 && (
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase text-slate-500 mb-1">Median Sold Price</p>
                  <p className="font-heading font-bold text-lg text-navy">{fmtK(marketStats.mississaugaMedianPrice)}</p>
                </div>
              )}
              {marketStats.mississaugaAvgSPLP > 0 && (
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase text-slate-500 mb-1">Sale-to-List</p>
                  <p className="font-heading font-bold text-lg text-navy">{marketStats.mississaugaAvgSPLP}%</p>
                </div>
              )}
              {marketStats.mississaugaAvgLDOM > 0 && (
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase text-slate-500 mb-1">Avg Days on Market</p>
                  <p className="font-heading font-bold text-lg text-navy">{marketStats.mississaugaAvgLDOM}d</p>
                </div>
              )}
              {marketStats.mississaugaMonthsOfInventory > 0 && (
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase text-slate-500 mb-1">Months of Inventory</p>
                  <p className="font-heading font-bold text-lg text-navy">{marketStats.mississaugaMonthsOfInventory}</p>
                </div>
              )}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              City-wide aggregate from TRREB&apos;s {marketStats.tRREBMonth} Market Watch report
              {marketStats.tRREBIsStale ? ' — the most recent report on hand, which may be a couple of months behind' : ''}.
              Individual sold listings below (exact address, price and date) require a free account — that level of
              detail is released only through a REALTOR® or a board-agreement Virtual Office Website, per TRREB&apos;s
              data rules.
            </p>
          </div>
        </section>
      )}

      {/* Server-rendered explainer, alongside the snapshot above — the sales
          table itself is client-fetched and now gated (VOW), so these two
          sections carry the real substance a crawler sees for a page aimed at
          a high-intent query, and the explainer is genuinely useful to a buyer
          who has just found out sold prices aren't public in Ontario. */}
      <section className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-xl font-bold text-navy">
          Understanding Mississauga sold prices
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SOLD_FAQ.map((qa) => (
            <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading text-sm font-semibold text-navy">{qa.question}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{qa.answer}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Next:{' '}
          <Link href="/listings" className="font-medium text-accent no-underline hover:text-accent-dark">
            browse active Mississauga listings scored for cash flow
          </Link>
          , check the{' '}
          <Link href="/market-pulse" className="font-medium text-accent no-underline hover:text-accent-dark">
            monthly market stats
          </Link>
          , or compare areas in the{' '}
          <Link href="/neighbourhoods" className="font-medium text-accent no-underline hover:text-accent-dark">
            neighbourhood guides
          </Link>
          .
        </p>
      </section>

      {/* This page had no lead capture — a high-intent surface (investors
          checking what actually sold). Add an inline email capture at the foot. */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 pt-10">
        <InlineCTA variant="newsletter" />
      </div>
    </>
  );
}
