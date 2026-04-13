import Link from 'next/link';
import { GOOGLE_REVIEWS, HOOD_DATA } from '@/lib/constants';
import { headers } from 'next/headers';
import { processListings } from '@/lib/listings/process-listings';
import { fmtK } from '@/lib/utils/format';
import { HeroSearch } from '@/components/home/hero-search';
import { HeroButtons } from '@/components/home/hero-buttons';
import { EmailCapture } from '@/components/home/email-capture';
import { HomeDealCards } from '@/components/home/home-deal-cards';

export const metadata = {
  title: 'MississaugaInvestor.ca — Mississauga Real Estate Investment Deals by Hamza Nouman',
  description: 'Find the best real estate investment deals in Mississauga with Hamza Nouman, Cityscape Real Estate Ltd.. Cash flow analysis, cap rates, deal scores, and expert insights on every property. 1,800+ properties analyzed across 24 neighbourhoods.',
  alternates: {
    canonical: '/',
  },
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
    const avgDom = data.mississaugaAvgLDOM || data.avgDOM || 28;
    const avgPrice = data.avgPrice || 970000;
    const salesToList = data.mississaugaAvgSPLP
      ? data.mississaugaAvgSPLP + '%'
      : data.salesToListRatio
        ? (data.salesToListRatio * 100).toFixed(1) + '%'
        : '97.2%';
    const avgSoldPrice = data.avgPrices?.all?.soldAvg || data.avgPrice || 970000;

    const fmtPrice = (p) => {
      if (p >= 1000000) return '$' + (p / 1000000).toFixed(2) + 'M';
      return '$' + Math.round(p / 1000) + 'K';
    };

    return {
      count,
      avgDom,
      priceLabel: fmtPrice(avgPrice),
      salesToList,
      avgSoldPrice: fmtPrice(avgSoldPrice),
      monthsOfInventory: data.mississaugaMonthsOfInventory || null,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
//   TOP DEALS FETCH
// ─────────────────────────────────────────────
async function fetchTopDeals() {
  try {
    const h = await headers();
    const host = h.get('host') || 'www.mississaugainvestor.ca';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${proto}://${host}`;

    // Fetch all pages to get accurate total count
    const res = await fetch(`${baseUrl}/api/listings?limit=200&page=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { deals: [], photoMap: {}, totalCount: 0 };
    const data = await res.json();
    const raw = data.listings || data || [];
    const totalPages = data.pages || 1;

    // Fetch remaining pages
    if (totalPages > 1) {
      const pagePromises = [];
      for (let p = 2; p <= totalPages; p++) {
        pagePromises.push(
          fetch(`${baseUrl}/api/listings?limit=200&page=${p}`, {
            next: { revalidate: 3600 },
          }).then((r) => r.ok ? r.json() : null)
        );
      }
      const pages = await Promise.all(pagePromises);
      for (const pg of pages) {
        if (pg?.listings) raw.push(...pg.listings);
      }
    }

    const processed = processListings(raw);
    const top = processed
      .sort((a, b) => b.hamzaScore - a.hamzaScore)
      .slice(0, 4);

    // Fetch photos for top 4 deals — individual calls (reliable, 100% hit rate)
    let photoMap = {};
    try {
      const photoPromises = top.map(async (d) => {
        try {
          const r = await fetch(`${baseUrl}/api/photos?id=${encodeURIComponent(d.id)}&limit=1`, {
            cache: 'no-store',
          });
          if (r.ok) {
            const data = await r.json();
            const url = data?.photos?.[0];
            if (url) photoMap[d.id] = url;
          }
        } catch {}
      });
      await Promise.all(photoPromises);
    } catch { /* photos optional */ }

    return { deals: top, photoMap, totalCount: processed.length };
  } catch {
    return { deals: [], photoMap: {}, totalCount: 0 };
  }
}

// ─────────────────────────────────────────────
//   STATS BAR
// ─────────────────────────────────────────────
function StatsBar({ liveStats }) {
  const s = liveStats || { count: '200+', avgDom: 28, priceLabel: '$970K', salesToList: '97.2%', avgSoldPrice: '$964K', monthsOfInventory: 5.2 };
  const stats = [
    { label: 'Active Listings', value: s.count?.toLocaleString?.() || s.count, icon: '📊' },
    { label: 'Sale-to-List', value: s.salesToList, icon: '⭐' },
    { label: 'Avg. DOM', value: `${s.avgDom} days`, icon: '📅' },
    { label: 'Avg. Price', value: s.priceLabel, icon: '💰' },
    { label: 'Avg. Sold', value: s.avgSoldPrice || '$964K', icon: '✅' },
    ...(s.monthsOfInventory ? [{ label: 'Inventory', value: `${s.monthsOfInventory} mo`, icon: '📦' }] : []),
  ];

  return (
    <div className="bg-cloud border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
//   AGENT PROFILE
// ─────────────────────────────────────────────
function AgentProfile() {
  return (
    <section className="bg-cloud py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src="/images/hamza-headshot.jpg"
                alt="Hamza Nouman — Mississauga Investment Specialist"
                className="w-56 h-56 md:w-72 md:h-72 rounded-2xl object-cover object-top shadow-lg"
              />
              <div className="absolute -bottom-3 -right-3 bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                Investment Specialist
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="text-center md:text-left max-w-xl">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-navy mb-2">
              Hamza Nouman
            </h2>
            <p className="text-accent font-semibold text-sm mb-1">
              Sales Representative — Cityscape Real Estate Ltd., Brokerage
            </p>
            <p className="text-xs text-muted mb-5">Licensed by RECO</p>

            <p className="text-sm text-navy/80 leading-relaxed mb-4">
              I specialize in helping investors find cash-flowing properties in Mississauga. Every listing on this platform is scored and analyzed so you can make data-driven decisions — not emotional ones.
            </p>
            <p className="text-sm text-navy/80 leading-relaxed mb-6">
              Whether you are looking for your first rental property or building a portfolio, I provide the market expertise and analytical tools to help you invest with confidence.
            </p>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-navy">1,800+</p>
                <p className="text-[11px] text-muted">Properties Analyzed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-navy">24</p>
                <p className="text-[11px] text-muted">Neighbourhoods</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-500">5.0 ★</p>
                <p className="text-[11px] text-muted">Google Rating</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <a
                href="tel:+16478676498"
                className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition no-underline"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                Call Now
              </a>
              <a
                href="mailto:hamza@nouman.ca"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:border-navy/30 transition no-underline"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                Email Me
              </a>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-accent hover:border-accent/30 transition no-underline"
              >
                Learn More About Hamza &rarr;
              </Link>
            </div>
          </div>
        </div>
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
        <p className="text-white/60 text-sm md:text-base mb-4 max-w-lg mx-auto">
          Get free access to deal scores, cash flow analysis, and expert insights on every
          Mississauga investment property.
        </p>
        <p className="text-emerald-400 text-sm font-semibold mb-8">
          Close with Hamza — First month&apos;s mortgage on us.
        </p>
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
          <Link href="/signup" className="w-full rounded-lg bg-[#185FA5] px-10 py-4 text-lg font-bold text-white text-center hover:bg-[#154f8a] transition no-underline shadow-lg">
            Get Free Access
          </Link>
          <Link href="/pre-construction" className="text-sm text-white/50 hover:text-white/80 transition no-underline">
            Interested in pre-construction? Get VIP access &rarr;
          </Link>
        </div>
        <p className="text-white/30 text-[10px] mt-6 max-w-md mx-auto">
          Commission rebate applied as credit on closing. Buyer clients of Hamza Nouman, Cityscape Real Estate Ltd., Brokerage. Terms apply.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
//   NEIGHBOURHOOD PREVIEW (Change 4)
// ─────────────────────────────────────────────
function NeighbourhoodPreview() {
  // Pick top 4 neighbourhoods by rent yield
  const topHoods = Object.entries(HOOD_DATA)
    .sort(([, a], [, b]) => (b.rentYield || 0) - (a.rentYield || 0))
    .slice(0, 4);

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="section-title mb-3">Top neighbourhoods for investors</h2>
        <p className="section-subtitle mx-auto">Yield, price trends, and expert analysis on 24 Mississauga neighbourhoods</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {topHoods.map(([name, data]) => {
          const trendColor =
            data.trend === 'hot'
              ? 'bg-red-50 text-red-600 border-red-100'
              : data.trend === 'warm'
              ? 'bg-amber-50 text-amber-700 border-amber-100'
              : 'bg-blue-50 text-blue-600 border-blue-100';

          return (
            <div key={name} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-navy">{name}</h3>
                <span className={`text-[10px] font-bold uppercase rounded-full px-2.5 py-1 border ${trendColor}`}>
                  {data.trend}
                </span>
              </div>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-accent">{data.rentYield}%</p>
                <p className="text-[10px] text-muted uppercase font-medium">Rent Yield</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-cloud p-2">
                  <p className="text-xs font-bold text-navy">{fmtK(data.avgPrice)}</p>
                  <p className="text-[9px] text-muted">Avg Price</p>
                </div>
                <div className="rounded-lg bg-cloud p-2">
                  <p className={`text-xs font-bold ${data.priceYoY >= 0 ? 'text-success' : 'text-red-500'}`}>
                    {data.priceYoY >= 0 ? '+' : ''}{data.priceYoY}%
                  </p>
                  <p className="text-[9px] text-muted">YoY</p>
                </div>
                <div className="rounded-lg bg-cloud p-2">
                  <p className="text-xs font-bold text-navy">{data.avgDOM}d</p>
                  <p className="text-[9px] text-muted">Avg DOM</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center mt-8">
        <Link href="/neighbourhoods" className="text-sm font-semibold text-accent hover:text-accent/80 transition no-underline">
          Explore All 24 Neighbourhoods &rarr;
        </Link>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
//   HOMEPAGE
// ─────────────────────────────────────────────
export default async function HomePage() {
  const [liveStats, topDeals] = await Promise.all([fetchLiveStats(), fetchTopDeals()]);

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
            <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4">
              Mississauga Investment
              <br />
              <span className="text-accent">Deal Finder</span>
            </h1>
            <p className="text-white text-lg md:text-xl font-semibold leading-snug mb-3 max-w-xl">
              4,000+ GTA Investment Properties — Cash Flow, Cap Rate & Deal Score Calculated on Every Listing.
            </p>
            <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/30 rounded-full px-4 py-1.5 mb-6">
              <span className="text-accent text-sm font-bold">The Only Platform That Does It.</span>
            </div>

            {/* Search Bar */}
            <HeroSearch />

            {/* Popular Neighbourhoods */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-white/40 text-xs">Popular:</span>
              {['Cooksville', 'Churchill Meadows', 'City Centre', 'Port Credit', 'Erin Mills', 'Malton'].map((hood) => (
                <Link
                  key={hood}
                  href={`/listings?hood=${encodeURIComponent(hood)}`}
                  className="text-xs text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full px-3 py-1 no-underline transition-colors"
                >
                  {hood}
                </Link>
              ))}
            </div>

            <HeroButtons />
          </div>
        </div>
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-success/20 rounded-full blur-3xl opacity-20" />
      </section>

      <StatsBar liveStats={liveStats} />

      {/* Top Investment Deals */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="section-title mb-3">Top Investment Deals</h2>
          <p className="section-subtitle mx-auto">The highest-scored properties currently on the market</p>
        </div>
        {topDeals.deals.length > 0 ? (
          <HomeDealCards deals={topDeals.deals} photoMap={topDeals.photoMap} />
        ) : null}
        <div className="text-center">
          <Link href="/listings" className="btn-primary !px-8 !py-3 no-underline">
            View All {liveStats?.count ? liveStats.count.toLocaleString() : topDeals.totalCount ? topDeals.totalCount.toLocaleString() : ''} Listings &rarr;
          </Link>
        </div>
      </section>

      {/* Weekly Email Capture (Change 1) */}
      <EmailCapture />

      {/* First Month's Mortgage Offer */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="relative bg-gradient-to-r from-accent/10 via-success/5 to-accent/10 border border-accent/20 rounded-2xl p-8 md:p-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 w-20 h-20 bg-accent/15 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🏦</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-success/15 border border-success/30 rounded-full px-3 py-1 mb-3">
                <span className="text-success text-xs font-bold">EXCLUSIVE OFFER</span>
              </div>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-navy mb-2">
                Close With Hamza — First Month&apos;s Mortgage On Us
              </h2>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-4 max-w-2xl">
                Buy an investment property through MississaugaInvestor.ca and we cover your first mortgage payment —
                so you cash flow from day one. No vacancy stress while you find your tenant.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="text-success">✓</span> Applied as credit on closing</span>
                <span className="flex items-center gap-1"><span className="text-success">✓</span> All investment properties qualify</span>
                <span className="flex items-center gap-1"><span className="text-success">✓</span> RECO compliant commission rebate</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link href="/about" className="btn-primary !px-6 !py-3 no-underline whitespace-nowrap">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* Neighbourhood Preview (Change 4) */}
      <NeighbourhoodPreview />

      {/* Testimonials BEFORE About Hamza (Change 3) */}
      <GoogleReviews />
      <AgentProfile />
      <CTASection />
    </>
  );
}
