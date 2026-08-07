import Link from 'next/link';
import { matchHood } from '@/lib/blog/match-hood';

// ─────────────────────────────────────────────────────────────────────────────
//  The blog -> product bridge.
//
//  WHY (2026-08-06, Hamza: "people right now seem to be reading just the blog
//  not really on my website"): the post template's every offer was either
//  another blog post (Related Guides) or a conversion ask (book a call,
//  newsletter). The one thing this site has that no competitor's blog does -
//  live, scored listings behind every claim the article just made - was never
//  offered, so organic readers finished a post and stayed in the blog loop or
//  left. This band is the missing middle step: after the article, before the
//  call CTA, offer the DATA - the lowest-commitment next click and the one
//  that turns a reader into a site user.
//
//  RULES:
//    - Every number comes straight from /api/market-stats (same source as the
//      homepage hero and /market-pulse), fetched with its own revalidate so
//      the ISR post page stays static. A missing figure drops its chip - the
//      band NEVER prints a zero or a stale-guess (omit-never-fake).
//    - If the stats fetch fails entirely, the band still renders as plain
//      links: the bridge matters more than the numbers.
//    - Neighbourhood posts get a contextual pair of links: the matched hood's
//      guide page (followed, static) and its filtered listings view
//      (rel=nofollow, per the lib/seo/internal-link.js rule for
//      parameterized filtered views).
// ─────────────────────────────────────────────────────────────────────────────

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL ? 'https://www.mississaugainvestor.ca' : 'http://localhost:3000');

async function fetchStats() {
  try {
    const res = await fetch(`${SITE_URL}/api/market-stats`, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-');
const n = (x) => Number(x).toLocaleString('en-CA');

function Chip({ value, label }) {
  return (
    <div className="rounded-lg bg-white/70 border border-navy/10 px-3 py-2 text-center">
      <div className="font-heading text-lg font-bold text-navy leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted leading-tight mt-0.5">{label}</div>
    </div>
  );
}

export async function LiveMarketBand({ postTitle }) {
  const stats = await fetchStats();
  const hood = matchHood(postTitle);

  // Each chip exists only if its figure does. No zeros, no placeholders.
  const chips = [];
  if (Number(stats?.activeCount) > 0) {
    chips.push({ value: n(stats.activeCount), label: 'active listings' });
  }
  if (Number.isFinite(stats?.screener?.cfPlusCount) && Number(stats?.screener?.total) > 0) {
    chips.push({ value: n(stats.screener.cfPlusCount), label: 'cash-flow positive' });
  }
  if (Number(stats?.screener?.bestCap) > 0) {
    chips.push({ value: `${stats.screener.bestCap}%`, label: 'best cap rate' });
  }
  if (Number(stats?.screener?.priceDropCount) > 0) {
    chips.push({ value: n(stats.screener.priceDropCount), label: 'with price cuts' });
  }

  return (
    <section className="mt-10 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-cloud p-5 md:p-6" aria-label="Live Mississauga market data">
      <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">
        {chips.length > 0 ? 'Live on this site right now' : 'On this site'}
      </p>
      <p className="text-sm text-navy/80 leading-relaxed">
        Everything in this article is checkable against real listings - we score every active
        Mississauga listing for cash flow, cap rate and deal quality, updated through the day.
      </p>
      {chips.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {chips.map((c) => (
            <Chip key={c.label} value={c.value} label={c.label} />
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {hood ? (
          <>
            <Link
              href={`/neighbourhoods/${slugify(hood)}`}
              className="btn-primary !px-4 !py-2 !text-xs no-underline"
            >
              {hood} investor guide
            </Link>
            <Link
              href={`/listings?hood=${encodeURIComponent(hood)}`}
              rel="nofollow"
              className="rounded-lg border border-accent/30 bg-white px-4 py-2 text-xs font-semibold text-accent no-underline hover:bg-accent/5"
            >
              {hood} listings, scored
            </Link>
          </>
        ) : (
          <Link href="/listings" className="btn-primary !px-4 !py-2 !text-xs no-underline">
            Browse the scored listings
          </Link>
        )}
        <Link
          href="/market-pulse"
          className="rounded-lg border border-navy/15 bg-white px-4 py-2 text-xs font-semibold text-navy no-underline hover:bg-cloud"
        >
          Full market dashboard
        </Link>
      </div>
    </section>
  );
}
