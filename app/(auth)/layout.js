import { CityscapePanorama } from '@/components/art/cityscape';
import { fetchGoogleRating, googleRatingLabel } from '@/lib/google-rating';
import { fetchPropertiesAnalyzedCount } from '@/lib/listings/properties-analyzed';

export const metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
};

// A function, not a static array: the middle benefit quotes how many listings
// we cover, and this is the LAST thing a visitor reads before handing over an
// email — the highest-intent surface on the site. It was pinned to the hand-set
// PLATFORM_STATS constant ("1,800+"), so signup promised access to fewer
// listings than the homepage that sent the visitor here advertised.
function buildBenefits(propertiesAnalyzed) {
  return [
    'Free Hamza Score, cap rate & cash-flow analysis on every listing',
    `Instant access to ${propertiesAnalyzed} analyzed MLS listings across the GTA`,
    'Deal alerts the moment a matching property hits the market',
  ];
}

// Base trust chips. The Google rating is prepended at render time only when
// Google actually returns one — never hardcoded.
const TRUST = ['Licensed by RECO', 'Live MLS data · PropTx'];

export default async function AuthLayout({ children }) {
  const googleRating = await fetchGoogleRating();
  const propertiesAnalyzed = await fetchPropertiesAnalyzedCount();
  const BENEFITS = buildBenefits(propertiesAnalyzed);
  const trust = googleRating ? [googleRatingLabel(googleRating), ...TRUST] : TRUST;
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand panel — desktop only; gives conversion context beside the form */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-b from-[#0F1930] via-navy to-[#16223D] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <CityscapePanorama
          variant="night"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42vh] w-full opacity-90"
        />

        <div className="relative z-10">
          <span className="font-heading text-xl font-bold text-white">MississaugaInvestor</span>
          <span className="font-heading text-xl font-bold text-accent">.ca</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-heading text-3xl font-bold leading-tight">
            Invest in Mississauga with the numbers on your side.
          </h2>
          {/* No subscriber-count claim here on purpose: "thousands of investors"
              was an invented number (the same class as the fabricated "388"
              killed on the hero), and advertising a count we can't source is
              exactly what RECO's misleading-advertising rule prohibits. If a
              count is ever wanted it must be read live from Supabase. */}
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Screen deals with real cap rates, cash flow, and comps — not guesswork.
          </p>

          <ul className="mt-8 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-white/90">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-2">
            {trust.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/85"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen items-center justify-center bg-cloud px-4 py-12">
        <div className="w-full max-w-md">
          {children}
          {/* RECO registrant identification. The site footer doesn't render on
              the (auth) layout, and on mobile the brand panel above is hidden
              entirely — so without this line the signup and login pages carried
              no registrant or brokerage name at all. Advertising must clearly
              identify both; "Licensed by RECO" in a trust chip is not that. */}
          <p className="mt-8 text-center text-xs text-muted">
            Hamza Nouman, Sales Representative &middot; Cityscape Real Estate Ltd., Brokerage
          </p>
        </div>
      </main>
    </div>
  );
}
