import Link from 'next/link';
import { GOOGLE_REVIEWS } from '@/lib/constants';
import { headers } from 'next/headers';

export const metadata = {
  title: 'MississaugaInvestor.ca — Mississauga Real Estate Investment Deals',
  description: 'Find the best real estate investment deals in Mississauga. Cash flow analysis, cap rates, deal scores, and expert insights on every property.',
};

// ─────────────────────────────────────────────
//   LIVE STATS FETCH (from unified market-stats API)
// ─────────────────────────────────────────────
async function fetchLiveStats() {
  try {
    const h = await headers();
    const host = h.get('host') || 'www.mississaugainvestor.ca';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${proto}://${host}`;

    const res = await fetch(`${baseUrl}/api/market-stats`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();

    const count = data.activeCount || 0;
    const avgDom = data.avgDOM || 28;
    const avgPrice = data.avgPrice || 970000;
    const salesToList = data.salesToListRatio
      ? (data.salesToListRatio * 100).toFixed(1) + '%'
      : '97.2%';

    let priceLabel;
    if (avgPrice >= 1000000) {
      priceLabel = '$' + (avgPrice / 1000000).toFixed(2) + 'M';
    } else {
      priceLabel = '$' + Math.round(avgPrice / 1000) + 'K';
    }

    return { count, avgDom, priceLabel, salesToList };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
//   STATS BAR
// ─────────────────────────────────────────────
function StatsBar({ liveStats }) {
  const s = liveStats || { count: '200+', avgDom: 28, priceLabel: '$970K', salesToList: '97.2%' };
  const stats = [
    { label: 'Active Listings', value: s.count?.toLocaleString?.() || s.count, icon: '📊' },
    { label: 'Sale-to-List', value: s.salesToList, icon: '⭐' },
    { label: 'Avg. DOM', value: `${s.avgDom} days`, icon: '📅' },
    { label: 'Avg. Price', value: s.priceLabel, icon: '💰' },
  ];

  return (
    <div className="bg-cloud border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((st) => (
            <div key={st.label} className="text-center">
              <div className="text-2xl mb-1">{st.icon}</div>
              <div className="font-heading font-bold text-xl text-navy">{st.value}</div>
              <div className="text-xs text-muted">{st.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//   HOW IT WORKS
// ─────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Browse Scored Deals',
      desc: 'Every Mississauga listing is analyzed for cash flow, cap rate, and investment potential with a deal score out of 10.',
    },
    {
      num: '02',
      title: 'Deep Dive Analysis',
      desc: 'Get mortgage breakdowns, cash-on-cash returns, BRRR projections, and expert commentary on every property.',
    },
    {
      num: '03',
      title: 'Connect with Hamza',
      desc: 'Book a free strategy call to discuss your investment goals and get personalized recommendations.',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="section-title mb-3">How It Works</h2>
        <p className="section-subtitle mx-auto">Three steps to finding your next investment property</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div key={step.num} className="text-center">
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent font-heading font-bold text-lg flex items-center justify-center mx-auto mb-4">
              {step.num}
            </div>
            <h3 className="font-heading font-semibold text-lg text-navy mb-2">{step.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
//   GOOGLE REVIEWS
// ─────────────────────────────────────────────
function GoogleReviews() {
  return (
    <section className="bg-cloud py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="section-title mb-3">What Investors Say</h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className="text-gold text-xl">★</span>
            ))}
            <span className="text-sm text-muted ml-2">5.0 on Google (28 reviews)</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GOOGLE_REVIEWS.slice(0, 6).map((r) => (
            <div key={r.name} className="card p-6">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <span key={i} className="text-gold text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-navy/80 leading-relaxed mb-4 italic">&ldquo;{r.text}&rdquo;</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-navy">{r.name}</span>
                <span className="text-[10px] text-muted">Google Review</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
//   CTA SECTION
// ─────────────────────────────────────────────
function CTASection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="bg-navy rounded-2xl p-8 md:p-12 text-center">
        <h2 className="font-heading font-bold text-2xl md:text-3xl text-white mb-3">
          Ready to Find Your Next Investment?
        </h2>
        <p className="text-white/60 text-sm md:text-base mb-8 max-w-lg mx-auto">
          Get free access to deal scores, cash flow analysis, and expert insights on every
          Mississauga investment property.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="btn-primary !text-base !px-8 !py-3.5 no-underline">
            Get Free Access
          </Link>
          <Link href="/pre-construction" className="btn-gold !text-base !px-8 !py-3.5 no-underline">
            Pre-Con VIP Access
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
//   HOMEPAGE
// ─────────────────────────────────────────────
export default async function HomePage() {
  const liveStats = await fetchLiveStats();

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-navy via-navy to-accent/20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <span className="text-success text-xs font-medium">Live Data</span>
              <span className="text-white/50 text-xs">Updated every 24 hours</span>
            </div>
            <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-5">
              Mississauga Investment
              <br />
              <span className="text-accent">Deal Finder</span>
            </h1>
            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
              Every active listing scored for cash flow, cap rate, and investment potential.
              Data-driven analysis to help you make smarter real estate decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/listings" className="btn-primary !text-base !px-8 !py-3.5 no-underline text-center">
                Browse Deals
              </Link>
              <Link href="/signup" className="bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg px-8 py-3.5 text-base no-underline text-center hover:bg-white/20 transition-colors border border-white/20">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-success/20 rounded-full blur-3xl opacity-20" />
      </section>

      <StatsBar liveStats={liveStats} />

      {/* Featured Listings CTA */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="section-title mb-3">Top Investment Deals</h2>
          <p className="section-subtitle mx-auto">The highest-scored properties currently on the market</p>
        </div>
        <div className="text-center">
          <Link href="/listings" className="btn-primary !px-8 !py-3 no-underline">
            View All Listings →
          </Link>
        </div>
      </section>

      <HowItWorks />
      <GoogleReviews />
      <CTASection />
    </>
  );
}
