import Link from 'next/link';
import { CityscapePanorama, SkylineStrip } from '@/components/art/cityscape';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { GOOGLE_REVIEWS } from '@/lib/constants';
import { ValuationForm } from '@/components/sell/valuation-form';

const BASE = 'https://www.mississaugainvestor.ca';

export const metadata = {
  title: 'Sell Your Home in Mississauga — Free Valuation from Hamza Nouman',
  description:
    'Thinking of selling your Mississauga home? Get a free, no-obligation home valuation from Hamza Nouman — an investment-focused agent with a network of pre-qualified buyers and data-driven pricing that sells for top dollar.',
  keywords: [
    'sell my house mississauga',
    'sell my home mississauga',
    'mississauga home valuation',
    'what is my home worth mississauga',
    'mississauga listing agent',
    'sell house fast mississauga',
  ],
  alternates: { canonical: '/sell' },
  openGraph: {
    title: 'Sell Your Home in Mississauga — Free Valuation from Hamza Nouman',
    description: 'A free, no-obligation home valuation from an investment-focused Mississauga agent with a network of pre-qualified buyers and data-driven pricing.',
    url: `${BASE}/sell`,
  },
};

// Honest, general answers — no fabricated stats, commissions, or timelines.
// Specifics come from the free CMA, which every answer routes back to.
const SELL_FAQ = [
  {
    question: 'How much is my Mississauga home worth?',
    answer:
      'It depends on your home’s size, condition, and location, recent comparable sales nearby, and what buyers are paying right now. The honest way to find out is a comparative market analysis (CMA) — Hamza prepares one for free, grounded in real recent sales and current buyer demand, so you get a data-backed number rather than a guess.',
  },
  {
    question: 'How do you decide what to list my home for?',
    answer:
      'Pricing is data-driven, not a hunch. The listing price comes from recent comparable sales, the homes you’d be competing against right now, and live buyer demand in your area — the same analytics that score over 1,800 Mississauga listings. Price it right and you attract more buyers and stronger offers; the CMA lays out the strategy for your specific home.',
  },
  {
    question: 'What does it cost to sell a home in Ontario?',
    answer:
      'The main costs are the real estate commission (agreed with you up front, in writing), your lawyer’s fees for closing, and any prep you choose to do (cleaning, minor repairs, staging). There’s no cost to get a valuation or to talk through your options — you only list when you’re ready and the terms are clear.',
  },
  {
    question: 'Can you sell my home to an investor without listing it publicly?',
    answer:
      'Sometimes, yes. Because Hamza works with a network of active, pre-qualified investor buyers, some homes can be matched to a buyer quietly — useful if you want privacy or a faster, more certain sale. It isn’t right for every property (a public listing often nets the most), so Hamza will tell you honestly which path is likely to serve you best.',
  },
  {
    question: 'How long will it take to sell?',
    answer:
      'It depends on your price, your home’s condition, and the market at the time — anyone who promises an exact number before seeing your home is guessing. What Hamza can do is give you a realistic timeline in your CMA, based on how similar homes near you are actually selling, and a plan to sell within it.',
  },
  {
    question: 'Do I have to commit to selling to get a valuation?',
    answer:
      'No. The valuation is free and there’s no obligation. Many people request one just to understand their equity or plan ahead. If and when you decide to move forward, Hamza is there — and if now isn’t the time, that’s a perfectly good answer too.',
  },
];

const DIFFERENTIATORS = [
  {
    icon: '🤝',
    title: 'A network of buyers, already waiting',
    body: 'As an investment-focused agent, Hamza works with a database of pre-qualified investor buyers actively looking in Mississauga — so your home reaches serious buyers who move quickly and close reliably.',
  },
  {
    icon: '📊',
    title: 'Priced with data, not guesswork',
    body: 'The same analytics engine that scores 1,800+ Mississauga listings prices your home to sell for the most — grounded in real comparable sales and live buyer demand, not a round-number guess.',
  },
  {
    icon: '🛠️',
    title: 'Full-service, handled for you',
    body: 'Professional photography, staging guidance, targeted marketing, and hard negotiation — the whole process managed end to end so you can focus on your move.',
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
    title: 'Free market analysis',
    body: 'Share your address and Hamza prepares a complimentary, data-backed comparative market analysis — what your home is really worth and the strategy to maximize it.',
  },
  {
    n: '2',
    title: 'Prep &amp; launch',
    body: 'Photography, staging guidance, and a marketing plan that puts your home in front of the right buyers — including Hamza’s investor network.',
  },
  {
    n: '3',
    title: 'Negotiate &amp; close',
    body: 'Skilled negotiation and pre-qualified buyers mean a smoother path to a strong offer and a reliable, on-time close.',
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

      {/* ── Hero with embedded valuation form ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#16223D] via-navy to-[#25355C]">
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pt-12 pb-24 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pt-16 lg:pb-28">
          {/* Left: value prop */}
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold">
              For Mississauga home sellers
            </span>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-white md:text-4xl lg:text-[2.75rem]">
              Sell Your Mississauga Home for What It’s Truly Worth
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base">
              Get a free, no-obligation valuation from Hamza Nouman — an investment-focused agent with a network of
              pre-qualified buyers and the data-driven pricing that gets sellers top dollar.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={chip}>★ 5.0 on Google</span>
              <span className={chip}>RECO Licensed</span>
              <span className={chip}>Cityscape Real Estate</span>
            </div>
            <ul className="mt-6 space-y-2.5">
              {['A network of pre-qualified buyers ready to move', 'Data-driven pricing that sells for the most', 'Full-service, managed end to end'].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-white/80">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
            <a href="#valuation-form" className="btn-primary mt-7 inline-block !px-7 !py-3 no-underline lg:hidden">
              Get My Free Valuation →
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
            <h2 className="section-title mb-3">How selling with Hamza works</h2>
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
            <div className="mb-2 flex items-center justify-center gap-1 text-gold" aria-hidden="true">
              {'★★★★★'.split('').map((s, i) => <span key={i} className="text-lg">★</span>)}
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
            <h2 className="font-heading text-2xl font-bold text-white">Find out what your home is worth</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
              Free, no-obligation, and grounded in real data. Get your valuation today, or talk it through with Hamza first.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#valuation-form" className="btn-primary !px-7 no-underline text-center">Get My Free Valuation</a>
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
