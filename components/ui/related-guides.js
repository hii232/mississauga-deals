import Link from 'next/link';

// The investor-guide hub. Each landing page shows the others so a reader who
// finishes one has a next step on-site instead of a dead end.
const GUIDES = [
  { href: '/cash-flow-positive-properties-ontario', title: 'Cash-Flow-Positive Properties', blurb: 'What it actually takes to clear positive cash flow at today’s rates.' },
  { href: '/rent-vs-buy-mississauga', title: 'Rent vs Buy in Mississauga', blurb: 'When buying beats renting — and how to find your break-even.' },
  { href: '/townhouse-vs-condo-investment', title: 'Townhouse vs Condo', blurb: 'Fees, land, appreciation and cash flow, compared side by side.' },
  { href: '/hurontario-lrt-real-estate', title: 'Hurontario LRT & Real Estate', blurb: 'How the Hazel McCallion Line reshapes the corridor for investors.' },
  { href: '/rental-property-insurance-mississauga', title: 'Rental Property Insurance', blurb: 'What landlord insurance covers and what drives the cost.' },
];

/**
 * "More investor guides" cross-link cards. Pass `current` (the page's own path)
 * to exclude it. Shows up to `limit` others (default 4).
 */
export function RelatedGuides({ current, limit = 4, className = '' }) {
  const others = GUIDES.filter((g) => g.href !== current).slice(0, limit);
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
    </div>
  );
}
