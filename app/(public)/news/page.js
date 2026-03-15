import Link from 'next/link';

export const metadata = {
  title: 'Real Estate News — MississaugaInvestor.ca',
  description: 'Stay updated with the latest Mississauga real estate news and market insights.',
};

export default function NewsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="section-title mb-2">Real Estate News</h1>
        <p className="section-subtitle">
          Market updates, policy changes, and investment insights
        </p>
      </div>

      <div className="card p-8 text-center">
        <div className="text-5xl mb-4">📰</div>
        <h2 className="font-heading font-semibold text-xl text-navy mb-3">
          Coming Soon
        </h2>
        <p className="text-sm text-muted leading-relaxed max-w-md mx-auto mb-6">
          We are building an RSS-powered news feed that will aggregate the latest
          Mississauga real estate news, Bank of Canada rate decisions, TRREB market reports,
          and investment strategy articles — all in one place.
        </p>
        <div className="rounded-lg bg-cloud p-5 text-left max-w-sm mx-auto mb-6">
          <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">What to expect</h3>
          <ul className="space-y-2 text-sm text-navy/70">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">&#x2022;</span>
              TRREB monthly market stats
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">&#x2022;</span>
              Bank of Canada rate announcements
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">&#x2022;</span>
              Mississauga development updates
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">&#x2022;</span>
              Investment strategy insights
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">&#x2022;</span>
              LRT corridor progress reports
            </li>
          </ul>
        </div>
        <Link
          href="/alerts"
          className="btn-primary !px-8 !py-3 no-underline"
        >
          Set Up Deal Alerts Instead
        </Link>
      </div>
    </div>
  );
}
