import Link from 'next/link';
import { CityscapePanorama } from '@/components/art/cityscape';

// Popular destinations to recover a lost visitor — lead-capture path first.
const RECOVERY_LINKS = [
  { href: '/alerts', label: 'Deal Alerts' },
  { href: '/listings', label: 'Browse Listings' },
  { href: '/market-pulse', label: 'Market Pulse' },
  { href: '/mortgage-calculator', label: 'Mortgage Calculator' },
  { href: '/neighbourhoods', label: 'Neighbourhoods' },
  { href: '/quiz', label: 'Find My Deal' },
];

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0A1122] via-navy to-[#0F1930] flex items-center justify-center px-4 py-16">
      {/* Night skyline anchored to the bottom — calm, on-brand */}
      <CityscapePanorama
        variant="night"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45vh] w-full opacity-90"
      />

      <div className="relative z-10 text-center max-w-lg">
        <div className="flex items-center justify-center gap-0.5 mb-8">
          <span className="font-heading font-bold text-xl text-white">MississaugaInvestor</span>
          <span className="font-heading font-bold text-xl text-accent">.ca</span>
        </div>

        <p className="font-mono text-8xl font-bold text-accent/50 mb-1 leading-none">404</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3">
          This page took a wrong turn
        </h1>
        <p className="text-white/75 text-sm sm:text-base mb-8 leading-relaxed max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved — but the deals
          are still here. Let&apos;s get you back to finding your next investment.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link
            href="/listings"
            className="btn-primary !px-6 !py-3 no-underline text-center w-full sm:w-auto"
          >
            Browse Deals
          </Link>
          <Link
            href="/"
            className="btn-secondary !px-6 !py-3 no-underline text-center w-full sm:w-auto !bg-white/10 !border-white/25 !text-white hover:!bg-white/20"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55 mb-3">
          Popular pages
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-2.5">
          {RECOVERY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 no-underline transition-colors hover:border-accent/50 hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
