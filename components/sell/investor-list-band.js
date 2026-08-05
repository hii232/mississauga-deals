/**
 * "Selling an income property?" - the seller pitch nobody else in this market
 * can make: a listing here goes in front of this site's registered investor
 * list. Rendered on /sell (above the fold, before the valuation form) and on
 * the homepage.
 *
 * The count is LIVE from /api/investor-count - a floored, rounded-down real
 * COUNT over the leads table - and when it is unavailable (no env at build,
 * list too small, endpoint down) the band renders WITHOUT a number rather
 * than inventing one. Same omit-never-fake rule as the stats bar.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL ? 'https://www.mississaugainvestor.ca' : 'http://localhost:3000');

export async function fetchInvestorCount() {
  try {
    const res = await fetch(`${SITE_URL}/api/investor-count`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.count === 'number' && data.count > 0 ? data.count : null;
  } catch {
    return null;
  }
}

export function InvestorListBand({ count, ctaHref = '#valuation', ctaLabel = 'Get My Property in Front of Them' }) {
  const audience = count
    ? `${count.toLocaleString()}+ registered investors`
    : 'our registered investor list';
  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-gold/25 bg-gradient-to-r from-navy to-[#16223D] p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold">
              Selling an income property?
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold text-white sm:text-2xl">
              Your listing goes in front of {audience} - the day it lists.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
              Duplex, tenanted condo, or a house with a basement suite: the buyers who want it
              are already on this site, watching this exact market with alerts on. Most listing
              agents have to go find investor buyers. Ours are the audience.
            </p>
          </div>
          <div className="shrink-0">
            <a
              href={ctaHref}
              className="inline-block rounded-lg bg-gold px-6 py-3 text-sm font-bold text-navy no-underline transition hover:bg-gold-dark"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
