import Link from 'next/link';
import { GOOGLE_REVIEWS, HOOD_DATA, HOOD_OUTLOOK_AS_OF } from '@/lib/constants';
import { headers } from 'next/headers';
import { processListings } from '@/lib/listings/process-listings';
import { computeHoodStats } from '@/lib/listings/hood-stats';
import { fmtK } from '@/lib/utils/format';
import { HeroSearch } from '@/components/home/hero-search';
import { HeroButtons } from '@/components/home/hero-buttons';
import { EmailCapture } from '@/components/home/email-capture';
import { HomeDealCards } from '@/components/home/home-deal-cards';
import { CityscapePanorama, SkylineStrip } from '@/components/art/cityscape';
import { BrowseScene, AnalysisScene, ConnectScene } from '@/components/art/scene-icons';
import { NeighbourhoodCard } from '@/components/neighbourhoods/neighbourhood-card';

export const metadata = {
  title: { absolute: 'MississaugaInvestor.ca — Mississauga Real Estate Investment Deals by Hamza Nouman' },
  description: 'Find the best real estate investment deals in Mississauga with Hamza Nouman, Cityscape Real Estate Ltd. Cash flow analysis, cap rates, deal scores, and expert insights on every property. 2,000+ properties analyzed across 24 neighbourhoods.',
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
    const hoodStats = computeHoodStats(processed);
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

    return { deals: top, photoMap, totalCount: processed.length, hoodStats };
  } catch {
    return { deals: [], photoMap: {}, totalCount: 0, hoodStats: {} };
  }
}

// ─────────────────────────────────────────────
//   HERO — floating live deal card (real photo in production)
// ─────────────────────────────────────────────
function HeroDealCard({ deal, photo }) {
  // Fallback when the feed is unavailable: top neighbourhood by yield (real data)
  if (!deal) {
    const [hoodName, hood] = Object.entries(HOOD_DATA)
      .sort(([, a], [, b]) => (b.rentYield || 0) - (a.rentYield || 0))[0] || [];
    if (!hoodName) return null;
    return (
      <div className="w-[300px] rounded-2xl bg-white p-5 shadow-2xl shadow-black/30 ring-1 ring-white/20">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Top neighbourhood by yield</p>
        <p className="mt-1 font-heading text-lg font-bold text-navy">{hoodName}</p>
        <p className="mt-3 text-4xl font-bold text-accent">{hood.rentYield}%</p>
        <p className="text-[10px] font-medium uppercase text-muted">Gross rent yield</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-cloud p-2">
            <p className="text-sm font-bold text-navy">{fmtK(hood.avgPrice)}</p>
            <p className="text-[9px] text-muted">Avg price</p>
          </div>
          <div className="rounded-lg bg-cloud p-2">
            <p className="text-sm font-bold text-navy">{hood.avgDOM} days</p>
            <p className="text-[9px] text-muted">Avg DOM</p>
          </div>
        </div>
        <Link href="/neighbourhoods" className="mt-4 block rounded-lg bg-navy px-4 py-2.5 text-center text-xs font-bold text-white no-underline transition hover:bg-navy/90">
          Explore neighbourhoods &rarr;
        </Link>
      </div>
    );
  }

  const scoreColor = deal.hamzaScore >= 8 ? 'bg-success' : deal.hamzaScore >= 6.5 ? 'bg-accent' : 'bg-gold';
  return (
    <Link
      href={`/listings/${deal.id}`}
      className="group block w-[300px] overflow-hidden rounded-2xl bg-white no-underline shadow-2xl shadow-black/30 ring-1 ring-white/20 transition-transform hover:-translate-y-1"
    >
      <div className="relative h-40 overflow-hidden bg-navy/10">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={deal.address} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy to-accent/40">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-white/40" fill="currentColor"><path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3l9-8z" /></svg>
          </div>
        )}
        <span className={`absolute right-3 top-3 rounded-full ${scoreColor} px-2.5 py-1 text-xs font-extrabold text-white shadow`}>
          {deal.hamzaScore?.toFixed(1)} / 10
        </span>
        <span className="absolute bottom-3 left-3 rounded-lg bg-navy/85 px-2.5 py-1 text-sm font-bold text-white backdrop-blur-sm">
          {fmtK(deal.price)}
        </span>
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-semibold text-navy">{deal.address}</p>
        <p className="mt-0.5 text-xs text-muted">{deal.beds} bed · {deal.baths} bath · {deal.type}</p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-md bg-cloud px-2 py-1 text-[10px] font-bold text-navy">CAP {deal.capRate}%</span>
          <span className={`rounded-md bg-cloud px-2 py-1 text-[10px] font-bold ${deal.cashFlow >= 0 ? 'text-success' : 'text-danger'}`}>
            {deal.cashFlow >= 0 ? '+' : ''}${Math.round(deal.cashFlow).toLocaleString()}/mo
          </span>
          <span className="rounded-md bg-cloud px-2 py-1 text-[10px] font-bold text-navy">{deal.dom} DOM</span>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-cloud px-4 py-2 text-center text-[11px] font-bold text-accent">
        Today&apos;s top-scored deal &rarr;
      </div>
    </Link>
  );
}

function TrustChips() {
  const chips = [
    {
      label: '5.0 on Google · 28 reviews',
      icon: <span className="text-gold">★</span>,
    },
    {
      label: 'Licensed by RECO',
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-success" fill="currentColor"><path d="M12 2l7 3v6c0 5-3.4 9.4-7 11-3.6-1.6-7-6-7-11V5l7-3zm-1 13.6l6-6-1.4-1.4L11 12.8 9.4 11.2 8 12.6l3 3z" /></svg>
      ),
    },
    {
      label: 'Live MLS data · PropTx',
      icon: <span className="inline-block h-2 w-2 rounded-full bg-success" />,
    },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur-sm">
          {c.icon}
          {c.label}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//   STATS BAR
// ─────────────────────────────────────────────
function StatIcon({ name }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'bars':
      return <svg {...common}><path d="M3 21h18M6 17V9M12 17V5M18 17v-6" /></svg>;
    case 'star':
      return <svg {...common} fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
    case 'calendar':
      return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;
    case 'dollar':
      return <svg {...common}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>;
    case 'check':
      return <svg {...common}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>;
    case 'box':
      return <svg {...common}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" /></svg>;
    default:
      return null;
  }
}

function StatsBar({ liveStats }) {
  const s = liveStats || { count: '200+', avgDom: 28, priceLabel: '$970K', salesToList: '97.2%', avgSoldPrice: '$964K', monthsOfInventory: 5.2 };
  const stats = [
    { label: 'Active Listings', value: s.count?.toLocaleString?.() || s.count, icon: 'bars' },
    { label: 'Sale-to-List', value: s.salesToList, icon: 'star' },
    { label: 'Avg. DOM', value: `${s.avgDom} days`, icon: 'calendar' },
    { label: 'Avg. Price', value: s.priceLabel, icon: 'dollar' },
    { label: 'Avg. Sold', value: s.avgSoldPrice || '$964K', icon: 'check' },
    ...(s.monthsOfInventory ? [{ label: 'Inventory', value: `${s.monthsOfInventory} mo`, icon: 'box' }] : []),
  ];

  return (
    <div className="border-y border-gray-100 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((st) => (
            <div key={st.label} className="flex items-center gap-3 justify-center lg:justify-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <StatIcon name={st.icon} />
              </div>
              <div className="text-left">
                <div className="font-heading font-bold text-xl text-navy leading-none">{st.value}</div>
                <div className="text-[11px] text-muted mt-1 uppercase tracking-wide font-medium">{st.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//   HOW IT WORKS — illustrated steps
// ─────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: '01',
      Scene: BrowseScene,
      title: 'Browse Scored Deals',
      desc: 'Every Mississauga listing is analyzed for cash flow, cap rate, and investment potential with a deal score out of 10.',
    },
    {
      num: '02',
      Scene: AnalysisScene,
      title: 'Deep Dive Analysis',
      desc: 'Get mortgage breakdowns, cash-on-cash returns, BRRR projections, and expert commentary on every property.',
    },
    {
      num: '03',
      Scene: ConnectScene,
      title: 'Connect with Hamza',
      desc: 'Book a free strategy call to discuss your investment goals and get personalized recommendations.',
    },
  ];

  return (
    <section className="relative">
      <SkylineStrip className="pointer-events-none absolute inset-x-0 top-0 h-10 w-full" />
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="section-title mb-3">How It Works</h2>
          <p className="section-subtitle mx-auto">Three steps to finding your next investment property</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ num, Scene, title, desc }) => (
            <div key={num} className="card relative overflow-hidden p-6 text-center transition-shadow hover:shadow-lg">
              <span className="absolute left-4 top-3 font-heading text-4xl font-extrabold text-navy/5">{num}</span>
              <Scene className="mx-auto mb-4 h-28 w-auto" />
              <h3 className="font-heading font-semibold text-lg text-navy mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
//   AGENT PROFILE
// ─────────────────────────────────────────────
function AgentProfile() {
  return (
    <section className="relative overflow-hidden bg-cloud py-16">
      <SkylineStrip className="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full" opacity={0.05} />
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
          {/* Photo — layered frame treatment */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-accent/25 via-transparent to-gold/25" aria-hidden="true" />
              <div className="absolute -left-5 -top-5 h-20 w-20 rounded-2xl border-2 border-accent/20" aria-hidden="true" />
              <img
                src="/images/hamza-headshot.jpg"
                alt="Hamza Nouman — Mississauga Investment Specialist"
                className="relative w-56 h-56 md:w-72 md:h-72 rounded-2xl object-cover object-top shadow-xl"
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
            <p className="text-accent font-semibold text-sm mb-3">
              Sales Representative — Cityscape Real Estate Ltd., Brokerage
            </p>
            <div className="mb-5 flex flex-wrap justify-center gap-2 md:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11px] font-bold text-success">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><path d="M12 2l7 3v6c0 5-3.4 9.4-7 11-3.6-1.6-7-6-7-11V5l7-3zm-1 13.6l6-6-1.4-1.4L11 12.8 9.4 11.2 8 12.6l3 3z" /></svg>
                Licensed by RECO
              </span>
              <span className="inline-flex items-center rounded-full border border-navy/15 bg-white px-3 py-1 text-[11px] font-bold text-navy">
                TRREB Member
              </span>
              <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-bold text-gold-dark">
                ★ 5.0 Google Rating
              </span>
            </div>

            <p className="text-sm text-navy/80 leading-relaxed mb-4">
              I specialize in helping investors find cash-flowing properties in Mississauga. Every listing on this platform is scored and analyzed so you can make data-driven decisions — not emotional ones.
            </p>
            <p className="text-sm text-navy/80 leading-relaxed mb-6">
              Whether you are looking for your first rental property or building a portfolio, I provide the market expertise and analytical tools to help you invest with confidence.
            </p>

            <div className="flex flex-wrap gap-6 justify-center md:justify-start mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-navy">2,000+</p>
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
                href="tel:+16476091289"
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
const AVATAR_HUES = [
  'bg-accent/15 text-accent',
  'bg-success/15 text-success',
  'bg-gold/20 text-gold-dark',
  'bg-navy/10 text-navy',
  'bg-rose-100 text-rose-600',
  'bg-violet-100 text-violet-600',
];

function GoogleReviews() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="section-title mb-3">What Clients Say</h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className="text-gold text-xl">★</span>
            ))}
            <span className="text-sm text-muted ml-2">5.0 on Google (28 reviews)</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GOOGLE_REVIEWS.slice(0, 6).map((r, idx) => (
            <figure key={r.name} className="card relative p-6 transition-shadow hover:shadow-lg">
              <svg viewBox="0 0 24 24" className="absolute right-5 top-5 h-7 w-7 text-accent/10" fill="currentColor" aria-hidden="true">
                <path d="M9.6 4C6 6 3.6 9.2 3.6 13.4c0 3.4 2 6.6 5.5 6.6 2.6 0 4.5-2 4.5-4.4 0-2.5-1.8-4.2-4.1-4.2-.4 0-.9 0-1 .1.3-2.3 2.3-4.6 4.4-5.7L9.6 4zm10.3 0c-3.6 2-6 5.2-6 9.4 0 3.4 2 6.6 5.5 6.6 2.6 0 4.6-2 4.6-4.4 0-2.5-1.9-4.2-4.2-4.2-.4 0-.8 0-1 .1.3-2.3 2.3-4.6 4.4-5.7L19.9 4z" />
              </svg>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <span key={i} className="text-gold text-sm">★</span>
                ))}
              </div>
              <blockquote className="text-sm text-navy/80 leading-relaxed mb-5">&ldquo;{r.text}&rdquo;</blockquote>
              <figcaption className="flex items-center gap-3 border-t border-slate-100 pt-4">
                <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${AVATAR_HUES[idx % AVATAR_HUES.length]}`}>
                  {r.name.trim().charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-navy">{r.name}</span>
                  <span className="flex items-center gap-1 text-[10px] text-muted">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-success" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 14.6l-4-4 1.4-1.4 2.6 2.6 5.6-5.6L18 9.6l-7 7z" /></svg>
                    Verified Google review
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
//   CTA SECTION — night skyline band
// ─────────────────────────────────────────────
function CTASection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0E1729] via-navy to-[#1B2A4A] p-8 pb-32 text-center md:p-12 md:pb-36">
        <div className="relative z-10">
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
        <CityscapePanorama variant="night" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full md:h-32" />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
//   NEIGHBOURHOOD PREVIEW
// ─────────────────────────────────────────────
function NeighbourhoodPreview({ hoodStats = {} }) {
  // Merge curated HOOD_DATA with live per-neighbourhood aggregates. Avg price,
  // DOM and yield come from active listings when we have a sample; trend + YoY
  // stay curated (they can't be computed live). Rank by the effective yield.
  const merged = Object.entries(HOOD_DATA).map(([name, data]) => {
    const live = hoodStats[name];
    return {
      name,
      data,
      avgPrice: live?.avgPrice ?? data.avgPrice,
      avgDOM: live?.avgDOM ?? data.avgDOM,
      rentYield: live?.rentYield ?? data.rentYield,
      isLive: !!live,
    };
  });
  const topHoods = merged.sort((a, b) => (b.rentYield || 0) - (a.rentYield || 0)).slice(0, 4);
  const anyLive = topHoods.some((h) => h.isLive);

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="section-title mb-3">Top neighbourhoods for investors</h2>
        <p className="section-subtitle mx-auto">Avg price, days-on-market &amp; yield are live from active Mississauga listings; the trend and year-over-year are Hamza&apos;s outlook.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {topHoods.map(({ name, data, avgPrice, avgDOM, rentYield, isLive }) => (
          <NeighbourhoodCard
            key={name}
            name={name}
            data={data}
            avgPrice={avgPrice}
            avgDOM={avgDOM}
            rentYield={rentYield}
            isLive={isLive}
          />
        ))}
      </div>
      <p className="text-center text-[11px] text-muted mt-6">
        Avg price, DOM{anyLive ? '' : ' and yield'} update live from current listings. <span className="whitespace-nowrap">*Trend &amp; YoY</span> reflect Hamza&apos;s expert outlook (last reviewed {HOOD_OUTLOOK_AS_OF}).
      </p>
      <div className="text-center mt-6">
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

  // Live listing count for the hero, rounded down to the hundred so it never overstates
  const heroCount = topDeals.totalCount >= 500
    ? `${(Math.floor(topDeals.totalCount / 100) * 100).toLocaleString()}+`
    : '2,000+';

  const heroDeal = topDeals.deals[0] || null;

  return (
    <>
      {/* Hero — dusk skyline with live deal card */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#141F38] via-navy to-[#2A3B63]">
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-16 pb-36 md:pt-24 md:pb-48">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr,320px]">
            <div className="max-w-2xl">
              {/* Only claim "Live Data" when the market-stats API actually
                  returned — otherwise the StatsBar shows curated fallback
                  numbers, and labelling those "Live" would be misleading. */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
                {liveStats ? (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-success text-xs font-medium">Live Data</span>
                    <span className="text-white/50 text-xs">Updated every 24 hours</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-white/40" />
                    <span className="text-white/70 text-xs font-medium">Market snapshot</span>
                  </>
                )}
              </div>
              <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4">
                Mississauga Investment
                <br />
                <span className="bg-gradient-to-r from-[#6EA8FF] to-accent bg-clip-text text-transparent">Property Finder</span>
              </h1>
              <p className="text-white text-lg md:text-xl font-semibold leading-snug mb-3 max-w-xl">
                {heroCount} Mississauga Investment Properties — Cash Flow, Cap Rate &amp; Deal Score Calculated on Every Listing.
              </p>
              <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/30 rounded-full px-4 py-1.5 mb-6">
                <span className="text-[#8AB6FF] text-sm font-bold">The Only Platform That Does It.</span>
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

              <div className="mt-6">
                <TrustChips />
              </div>
            </div>

            {/* Floating live deal card — real listing photo in production */}
            <div className="hidden justify-center lg:flex">
              <div className="relative">
                <div className="absolute -inset-6 rounded-3xl bg-accent/20 blur-2xl" aria-hidden="true" />
                <div className="relative rotate-2 transition-transform duration-300 hover:rotate-0">
                  <HeroDealCard deal={heroDeal} photo={heroDeal ? topDeals.photoMap[heroDeal.id] : null} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skyline panorama */}
        <CityscapePanorama variant="dusk" className="pointer-events-none absolute inset-x-0 bottom-0 h-36 w-full md:h-52" />
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

      {/* Weekly Email Capture */}
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
              <Link href="/book-call" className="btn-primary !px-6 !py-3 no-underline whitespace-nowrap">
                Book a Free Call
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* GTA coverage band — Mississauga is home base, but the platform covers the whole GTA.
          Light-themed to pair with the navy seller band below (buyer/light + seller/dark). */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-cloud via-white to-cloud p-8 md:p-12">
          <SkylineStrip className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full" tone="#1B2A4A" opacity={0.06} />
          <div className="relative z-10 flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-4xl">🌆</div>
            <div className="flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">Now across the whole GTA</span>
              </div>
              <h2 className="mb-2 font-heading text-2xl font-bold text-navy md:text-3xl">
                Investing beyond Mississauga? We cover the entire GTA.
              </h2>
              <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
                Every listing scored for cash flow, cap rate, and deal score — now across Toronto, Peel, Halton, York, Durham &amp; Hamilton.
              </p>
              <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                {['Toronto', 'Brampton', 'Vaughan', 'Oakville', 'Markham', 'Hamilton', 'Burlington', 'Milton'].map((c) => (
                  <Link
                    key={c}
                    href={`/gta?city=${encodeURIComponent(c)}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-navy no-underline transition hover:border-accent/40 hover:text-accent"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link href="/gta" className="btn-primary !px-6 !py-3 no-underline whitespace-nowrap">
                Browse all GTA deals &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Seller offer band — captures homeowners who land on the homepage */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16223D] via-navy to-[#25355C] p-8 md:p-12">
          <SkylineStrip className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full" tone="#0A1122" opacity={0.5} />
          <div className="relative z-10 flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-4xl">🔑</div>
            <div className="flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold">For Mississauga homeowners</span>
              </div>
              <h2 className="mb-2 font-heading text-2xl font-bold text-white md:text-3xl">
                Thinking of selling? Find out what your home is worth.
              </h2>
              <p className="mb-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
                Get a free, data-backed home valuation and a plan to sell for the most — precise pricing, professional
                marketing, and hard negotiation from an agent who knows exactly what today&apos;s buyers pay for. No obligation.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/60 md:justify-start">
                <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> Free valuation</span>
                <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> Priced with data</span>
                <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> Zero obligation</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link href="/sell" className="btn-primary !px-6 !py-3 no-underline whitespace-nowrap">
                Get My Free Valuation &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* Neighbourhood Preview */}
      <NeighbourhoodPreview hoodStats={topDeals.hoodStats} />

      {/* Testimonials before About Hamza */}
      <GoogleReviews />
      <AgentProfile />
      <CTASection />
    </>
  );
}
