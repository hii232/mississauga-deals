import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-accent/20 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-1 mb-6">
          <span className="font-heading font-bold text-2xl text-white">MississaugaInvestor</span>
          <span className="font-heading font-bold text-2xl text-accent">.ca</span>
        </div>

        <p className="font-mono text-8xl font-bold text-accent/30 mb-2">404</p>
        <h1 className="font-heading text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-white/50 text-sm mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back to finding great deals.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/listings"
            className="btn-primary !px-6 !py-3 no-underline text-center w-full sm:w-auto"
          >
            Browse Deals
          </Link>
          <Link
            href="/"
            className="btn-secondary !px-6 !py-3 no-underline text-center w-full sm:w-auto !bg-white/10 !border-white/20 !text-white hover:!bg-white/20"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <Link href="/quiz" className="text-white/30 hover:text-accent text-xs no-underline transition-colors">
            Find My Deal
          </Link>
          <Link href="/market-pulse" className="text-white/30 hover:text-accent text-xs no-underline transition-colors">
            Market Pulse
          </Link>
          <Link href="/neighbourhoods" className="text-white/30 hover:text-accent text-xs no-underline transition-colors">
            Neighbourhoods
          </Link>
        </div>
      </div>
    </div>
  );
}
