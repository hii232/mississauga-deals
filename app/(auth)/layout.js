import { CityscapePanorama } from '@/components/art/cityscape';

export const metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
};

const BENEFITS = [
  'Free Hamza Score, cap rate & cash-flow analysis on every listing',
  'Instant access to 1,800+ live MLS listings across the GTA',
  'Deal alerts the moment a matching property hits the market',
];

const TRUST = ['5.0 on Google · 28 reviews', 'Licensed by RECO', 'Live MLS data · PropTx'];

export default function AuthLayout({ children }) {
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
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Join thousands of investors who screen deals with real cap rates, cash flow, and
            comps — not guesswork.
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
            {TRUST.map((t) => (
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
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
