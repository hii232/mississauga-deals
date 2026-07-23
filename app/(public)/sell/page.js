import Link from 'next/link';
import { CityscapePanorama, SkylineStrip } from '@/components/art/cityscape';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { GOOGLE_REVIEWS } from '@/lib/constants';
import { ValuationForm } from '@/components/sell/valuation-form';

const BASE = 'https://www.mississaugainvestor.ca';

export const metadata = {
  title: 'Sell Your Home in Mississauga — Free Investor Offer Preview',
  description:
    'See what an investor would pay for your Mississauga home before you list. Get a free, private Investor Offer Preview from Hamza Nouman’s network of pre-qualified buyers, plus a data-backed market valuation. Sell quietly and fast, or list for top dollar.',
  keywords: [
    'sell my house mississauga',
    'sell my home mississauga',
    'mississauga home valuation',
    'what is my home worth mississauga',
    'sell house to investor mississauga',
    'off market home sale mississauga',
    'mississauga listing agent',
  ],
  alternates: { canonical: '/sell' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: 'Sell Your Home in Mississauga — Free Investor Offer Preview',
    description: 'See what an investor would pay before you list — a free, private preview from a network of pre-qualified buyers, plus a data-backed valuation.',
    url: `${BASE}/sell`,
  },
};

// Page-relevant service structured data for the seller page. No self-serving
// aggregateRating (Google discourages it on self-markup) — the real 5.0 Google
// rating stays as visible on-page proof only.
const agentServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'Hamza Nouman — Cityscape Real Estate',
  description: 'Investment-focused Mississauga listing agent. Free home valuations and a private Investor Offer Preview from a network of pre-qualified buyers.',
  url: `${BASE}/sell`,
  image: `${BASE}/images/hamza-headshot.jpg`,
  telephone: '+1-647-609-1289',
  areaServed: [
    { '@type': 'City', name: 'Mississauga' },
    { '@type': 'AdministrativeArea', name: 'Peel Region, Ontario' },
  ],
  makesOffer: {
    '@type': 'Offer',
    name: 'Free Home Valuation & Investor Offer Preview',
    description: 'A free, no-obligation home valuation plus a private preview of what an investor buyer would pay for your Mississauga home.',
    price: '0',
    priceCurrency: 'CAD',
  },
  provider: { '@type': 'Person', '@id': `${BASE}/about#hamza-nouman`, name: 'Hamza Nouman' },
};

// Honest, general answers — no fabricated stats, commissions, or timelines.
// Specifics come from the free preview + CMA, which every answer routes back to.
const SELL_FAQ = [
  {
    question: 'What is an Investor Offer Preview?',
    answer:
      'It’s a free, confidential first look at what a real investor buyer might pay for your home. Hamza quietly checks your property against his network of pre-qualified investor buyers and reports back genuine interest, alongside a data-backed open-market valuation — so you can weigh a quiet sale against a public listing. There’s no obligation, and no one has to know your home is even being considered.',
  },
  {
    question: 'Is the investor sale or the public listing better for me?',
    answer:
      'It depends on what you value. A quiet investor sale is fast, private, often as-is — great when speed and discretion matter. A full public listing usually nets the highest price because more buyers compete for your home. The preview shows you what each path realistically looks like for your specific home, and Hamza will tell you honestly which one is likely to serve you best — even if that means a public listing over a quick sale.',
  },
  {
    question: 'How do you decide what to list my home for?',
    answer:
      'Pricing is data-driven, not a hunch. It comes from recent comparable sales, the homes you’d be competing against right now, and live buyer demand in your area — the same analytics that score over 1,800 Mississauga listings. Price it right and you attract more buyers and stronger offers; the valuation lays out the exact strategy for your home.',
  },
  {
    question: 'What does it cost to sell a home in Ontario?',
    answer:
      'The main costs are the real estate commission (agreed with you up front, in writing), your lawyer’s fees for closing, and any prep you choose to do. There’s no cost to get a preview or a valuation, and no cost to talk through your options — you only move forward when you’re ready and the terms are clear.',
  },
  {
    question: 'How long will it take to sell?',
    answer:
      'It depends on your price, your home’s condition, and the market — anyone who promises an exact number before seeing your home is guessing. A quiet investor match can move quickly; a public listing’s timing depends on the market. Your preview includes a realistic timeline for each path, based on how similar homes near you are actually selling.',
  },
  {
    question: 'Do I have to commit to selling to get a preview?',
    answer:
      'No. The preview is free, confidential, and there’s no obligation — to sell, to list, or to do anything at all. Many people request one just to understand their equity or plan ahead. If the time is right, Hamza is there; if it isn’t, that’s a perfectly good answer too.',
  },
];

const DIFFERENTIATORS = [
  {
    icon: '🤝',
    title: 'A network of buyers, already waiting',
    body: 'As an investment-focused agent, Hamza works with a database of pre-qualified investor buyers actively looking in Mississauga — so your home can be matched to a serious buyer who moves quickly and closes reliably.',
  },
  {
    icon: '📊',
    title: 'Priced with data, not guesswork',
    body: 'The same analytics engine that scores 1,800+ Mississauga listings prices your home to sell for the most — grounded in real comparable sales and live buyer demand, not a round-number guess.',
  },
  {
    icon: '🛠️',
    title: 'Full-service, handled for you',
    body: 'When you list, you get the works — professional photography, staging guidance, targeted marketing, and hard negotiation — the whole process managed end to end.',
  },
  {
    icon: '🎯',
    title: 'An investor’s read on your home',
    body: 'Hamza knows exactly what today’s buyers value — layout, location, secondary-suite potential, cash-flow appeal — and positions your home to the buyers most likely to pay a premium.',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Free Investor Offer Preview',
    body: 'Share your address. Hamza quietly checks his investor buyers on your home and prepares a data-backed valuation — what an investor might pay, and what the open market would.',
  },
  {
    n: '2',
    title: 'You choose your path',
    body: 'Take a quiet, fast sale to an investor — or list for the open market with full marketing to draw competing offers. No pressure either way; you decide with the real numbers in front of you.',
  },
  {
    n: '3',
    title: 'Negotiate &amp; close',
    body: 'Skilled negotiation and pre-qualified buyers mean a smoother path to a strong offer and a reliable, on-time close — whichever route you pick.',
  },
];

const PATHS = [
  {
    icon: '🔑',
    kicker: 'Path 1',
    title: 'Sell quietly to an investor',
    body: 'Match with a pre-qualified investor buyer from Hamza’s network. Fast, private, often as-is — no staging, no showings, no sign on the lawn. Ideal when speed and discretion matter most.',
  },
  {
    icon: '🏆',
    kicker: 'Path 2',
    title: 'List for the open market',
    body: 'Full marketing muscle — professional photography, targeted exposure, and data-driven pricing to draw competing offers and the highest possible price. Ideal when maximizing your number is the goal.',
  },
];

const chip = 'inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm';

export default function SellPage() {
  const reviews = GOOGLE_REVIEWS.slice(0, 3);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: `${BASE}/` },
          { name: 'Sell Your Home', url: `${BASE}/sell` },
        ]}
      />
      <FAQJsonLd items={SELL_FAQ} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(agentServiceSchema) }} />

      {/* ── Hero with embedded form ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#16223D] via-navy to-[#25355C]">
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pt-12 pb-24 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pt-16 lg:pb-28">
          {/* Left: value prop */}
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold">
              Off-market first look
            </span>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-white md:text-4xl lg:text-[2.6rem]">
              See What an Investor Would Pay for Your Mississauga Home — Before You List
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base">
              Get a free, private <strong className="text-white">Investor Offer Preview</strong> from a network of
              pre-qualified buyers — plus a data-backed market valuation. Sell quietly and fast, or list for top dollar.
              You choose.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={chip}>★ 5.0 on Google</span>
              <span className={chip}>RECO Licensed</span>
              <span className={chip}>Cityscape Real Estate</span>
            </div>
            <ul className="mt-6 space-y-2.5">
              {['A real offer preview from active investor buyers', 'Or a full-market listing priced with data for top dollar', 'Free, confidential, zero obligation'].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-white/80">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
            <a href="#valuation-form" className="btn-primary mt-7 inline-block !px-7 !py-3 no-underline lg:hidden">
              Get My Investor Offer Preview →
            </a>
          </div>

          {/* Right: form */}
          <div className="lg:pt-1">
            <ValuationForm id="valuation-form" />
          </div>
        </div>
        <CityscapePanorama variant="dusk" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-90 md:h-32" />
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Two ways to sell ── */}
        <section className="py-14 md:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-title mb-3">Two ways to sell — you choose</h2>
            <p className="section-subtitle mx-auto">
              Most agents only offer one. Because Hamza has a network of investor buyers, you get both — and the free
              preview shows you which wins for your home.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {PATHS.map((p) => (
              <div key={p.title} className="card p-6">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-2xl">{p.icon}</div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent">{p.kicker}</p>
                <h3 className="mt-0.5 font-heading font-semibold text-navy">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            Not sure which is right? <a href="#valuation-form" className="font-semibold text-accent hover:text-accent-dark no-underline">The free preview shows you both</a>, then you decide.
          </p>
        </section>

        <SkylineStrip className="h-10 w-full" opacity={0.06} />

        {/* ── Differentiators ── */}
        <section className="py-14 md:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-title mb-3">Why sell with an investment specialist</h2>
            <p className="section-subtitle mx-auto">
              Most agents list your home and hope. Hamza brings buyers, data, and an investor’s eye for what makes a home sell.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.title} className="card p-6">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-2xl">{d.icon}</div>
                <h3 className="font-heading font-semibold text-navy">{d.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{d.body}</p>
              </div>
            ))}
          </div>
        </section>

        <SkylineStrip className="h-10 w-full" opacity={0.06} />

        {/* ── How it works ── */}
        <section className="py-14 md:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-title mb-3">How it works</h2>
            <p className="section-subtitle mx-auto">Three simple steps, from “what’s it worth?” to sold.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{s.n}</div>
                <h3 className="mt-3 font-heading font-semibold text-navy" dangerouslySetInnerHTML={{ __html: s.title }} />
                <p className="mt-1.5 text-sm leading-relaxed text-muted" dangerouslySetInnerHTML={{ __html: s.body }} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Social proof ── */}
      <section className="bg-cloud py-14 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-2 flex items-center justify-center gap-0.5 text-gold" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => <span key={i} className="text-lg">★</span>)}
            </div>
            <h2 className="section-title mb-2">Clients trust Hamza — 5.0 on Google</h2>
            <p className="section-subtitle mx-auto">Honest advice, done properly. Here’s what people say after working with him.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.name} className="card p-6">
                <div className="mb-2 flex gap-0.5 text-gold" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: r.rating }).map((_, i) => <span key={i}>★</span>)}
                </div>
                <blockquote className="text-sm leading-relaxed text-navy/80">&ldquo;{r.text}&rdquo;</blockquote>
                <figcaption className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 font-bold text-accent">{r.name.charAt(0)}</span>
                  <span className="font-semibold text-navy">{r.name}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-success">Verified Google review</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* ── FAQ ── */}
        <section className="py-14 md:py-16">
          <h2 className="section-title mb-6 text-center">Selling your home: common questions</h2>
          <div className="space-y-4">
            {SELL_FAQ.map((qa) => (
              <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-heading font-semibold text-sm text-navy mb-1.5">{qa.question}</h3>
                <p className="text-sm leading-relaxed text-muted">{qa.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="pb-16">
          <div className="rounded-2xl bg-navy p-8 text-center md:p-10">
            <h2 className="font-heading text-2xl font-bold text-white">See what an investor would pay</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
              Free, private, and grounded in real data. Get your Investor Offer Preview today, or talk it through with Hamza first.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#valuation-form" className="btn-primary !px-7 no-underline text-center">Get My Investor Offer Preview</a>
              <Link href="/book-call" className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-7 no-underline text-center">
                Book a Call with Hamza
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/50">
              Hamza Nouman, Sales Representative · Cityscape Real Estate Ltd., Brokerage · Licensed by RECO
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
