import Link from 'next/link';

// The investor-guide hub. Each landing page shows the others so a reader who
// finishes one has a next step on-site instead of a dead end. Also consumed by
// the /guides index page (cards + ItemList schema both derive from this array).
//
// Includes the pillar blog posts: they publish with zero internal links from
// the static site, and links from established pages are how the cluster passes
// authority to them. The order below is deliberately interleaved static/pillar.
export const GUIDES = [
  { href: '/cash-flow-positive-properties-ontario', title: 'Cash-Flow-Positive Properties', blurb: 'What it actually takes to clear positive cash flow at today’s rates.' },
  { href: '/blog/best-cash-flow-neighbourhoods-mississauga-2026', title: 'Best Cash Flow Neighbourhoods (2026)', blurb: 'Where the rent-to-price math works right now — and the trade each area asks.' },
  { href: '/rent-vs-buy-mississauga', title: 'Rent vs Buy in Mississauga', blurb: 'When buying beats renting — and how to find your break-even.' },
  { href: '/blog/seven-bedroom-rooming-house-math-mississauga', title: 'The 7-Bedroom Cash Flow Math', blurb: 'Why big-bedroom cap rates look impossible — and the one question that decides them.' },
  { href: '/townhouse-vs-condo-investment', title: 'Townhouse vs Condo', blurb: 'Fees, land, appreciation and cash flow, compared side by side.' },
  { href: '/blog/malton-investment-guide-2026', title: 'Malton Investment Guide 2026', blurb: 'The highest yields in Mississauga, and exactly what that trade costs you.' },
  { href: '/hurontario-lrt-real-estate', title: 'Hurontario LRT & Real Estate', blurb: 'How the Hazel McCallion Line reshapes the corridor for investors.' },
  { href: '/blog/cooksville-hurontario-lrt-corridor-investing', title: 'Cooksville & the LRT Corridor', blurb: 'What transit actually changes for rents, values, and timing.' },
  { href: '/rental-property-insurance-mississauga', title: 'Rental Property Insurance', blurb: 'What landlord insurance covers and what drives the cost.' },
  { href: '/blog/hst-rebate-for-investors-explained-ontario', title: 'HST Rebate for Investors', blurb: 'The 2026 rebate is huge — and investors claim a different one than end-users.' },
  { href: '/mississauga-vs-brampton-vs-hamilton', title: 'Mississauga vs Brampton vs Hamilton', blurb: 'Property tax, land transfer tax and rental demand compared across three GTA cities.' },
  { href: '/rent-by-bedroom-mississauga', title: 'Mississauga Rent by Bedroom', blurb: 'Average, lowest and highest rent by bedroom count across all 24 neighbourhoods.' },
  { href: '/legal-second-unit-mississauga', title: 'Legal Second Unit in Mississauga', blurb: 'OBC requirements, the permit process, and the cash-flow math for adding a legal basement suite.' },
];

/**
 * "More investor guides" cross-link cards. Pass `current` (the page's own path)
 * to exclude it. Shows up to `limit` others (default 4).
 */
export function RelatedGuides({ current, limit = 4, className = '' }) {
  // Rotate the list so it starts just past `current` in cluster order, instead
  // of always taking GUIDES[0..limit-1]. With a fixed slice, every guide past
  // index `limit` (7 of the 12 entries — including 5 whole blog pillar posts)
  // never appeared in ANY page's "More investor guides" widget, because only
  // pages whose own index sits inside the first `limit` slots could ever push
  // one of them into view. Rotating per-page is deterministic (same `current`
  // always yields the same order, so SSR and hydration match) and spreads
  // inbound links across the whole cluster instead of funnelling them all to
  // the same first few entries.
  const idx = GUIDES.findIndex((g) => g.href === current);
  const start = idx === -1 ? 0 : idx + 1;
  const rotated = [...GUIDES.slice(start), ...GUIDES.slice(0, start)];
  const others = rotated.filter((g) => g.href !== current).slice(0, limit);
  if (!others.length) return null;
  return (
    <div className={`mt-12 ${className}`}>
      <h2 className="font-heading font-bold text-xl text-navy mb-4">More investor guides</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {others.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 no-underline transition-all duration-300 hover:border-accent/30 hover:shadow-md"
          >
            <h3 className="font-heading font-semibold text-sm text-navy transition-colors group-hover:text-accent">{g.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{g.blurb}</p>
            <span className="mt-2 inline-block text-xs font-semibold text-accent">Read guide →</span>
          </Link>
        ))}
      </div>
      <Link href="/guides" className="mt-4 inline-block text-sm font-semibold text-accent hover:text-accent-dark no-underline">
        See all investor guides →
      </Link>
    </div>
  );
}
