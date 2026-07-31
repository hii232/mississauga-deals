'use client';
import { trackConversion } from '@/lib/track-conversion';

import { useState } from 'react';
import Link from 'next/link';
import { HOOD_DATA } from '@/lib/constants';
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/layout/page-hero';

const BUDGETS = [
  { value: '', label: 'Select budget range' },
  { value: 'under-500k', label: 'Under $500K' },
  { value: '500k-750k', label: '$500K - $750K' },
  { value: '750k-1m', label: '$750K - $1M' },
  { value: '1m-plus', label: '$1M+' },
];

const TIMELINES = [
  { value: '', label: 'Select timeline' },
  { value: '1-6mo', label: '1-6 months' },
  { value: '6-12mo', label: '6-12 months' },
  { value: '1-2yr', label: '1-2 years' },
];

const HOODS = Object.keys(HOOD_DATA);

// Pre-construction carries real query volume, but this page was a VIP signup
// form with no explanatory content and no FAQ markup. These answer what
// actually stops an investor from signing: how deposits are staged, what
// interim occupancy costs, whether they can back out, and whether pre-con even
// beats resale — answered honestly, downsides included, because a page that
// pretends there aren't any reads like a builder's brochure.
//
// Deliberately NO dollar figures or dates: the enhanced HST rebate is bounded
// by signing date and tiered by price, and schema can be surfaced by Google
// long after either changes. /pre-construction/hst-rebate owns those numbers;
// this links to it. Question set is disjoint from /faq, /listings,
// /market-pulse and /recent-sales so no two pages compete for one rich result.
const PRECON_FAQ = [
  {
    question: 'How do deposits work on a pre-construction condo in Ontario?',
    answer:
      'Unlike a resale purchase, where the deposit is a single payment, a pre-construction deposit is staged over months — commonly a payment on signing, then further instalments at set intervals, and sometimes a final one at interim occupancy. The total is set by the builder and is typically higher for investors than for end users, with more again asked of international buyers. The schedule is written into the agreement of purchase and sale, so it is worth reading before you sign rather than after.',
  },
  {
    question: 'What is interim occupancy and why does it cost money?',
    answer:
      'There is usually a gap between the date you can move into a new condo and the date the building is legally registered and the unit becomes yours. During that gap — interim occupancy — you pay the builder a monthly occupancy fee covering interest on the unpaid balance, estimated property taxes and common expenses. None of it pays down a mortgage or builds equity, and it can run for months, so an investor should budget it as a real carrying cost rather than meet it as a surprise.',
  },
  {
    question: 'Can I cancel a pre-construction condo purchase after signing?',
    answer:
      "Yes, within a limited window. Ontario's Condominium Act gives buyers of a new condominium a 10-day statutory cooling-off period after receiving the signed agreement and the disclosure statement, during which the agreement can be rescinded and the deposit returned. After those 10 days the agreement binds you, which makes the cooling-off period the time to have a lawyer read the disclosure statement — not a formality to skip.",
  },
  {
    question: 'Do investors qualify for the HST rebate on a new build?',
    answer:
      'Yes — the enhanced Ontario rebate on new homes carries no first-time-buyer requirement, and purpose-built rental developers qualify as well, which is unusual among housing incentives. The amount depends on the purchase price and on when the agreement of purchase and sale was signed, since the enhanced rebate applies to a defined window. The HST rebate guide on this site sets out the current tiers, dates and eligibility rules in full.',
  },
  {
    question: 'Is pre-construction a better investment than a resale property?',
    answer:
      'It is a different trade, not automatically a better one. Pre-construction lets you control a unit with a staged deposit and take any appreciation between signing and closing, and everything arrives new and under warranty. Against that: you collect no rent during construction, occupancy fees consume cash before closing, completion dates slip, and the market at completion is unknowable. A resale property cash flows from day one and can be analysed with real numbers today. Run both against your own timeline before deciding.',
  },
];

export default function PreConstructionPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    budget: '',
    area: '',
    timeline: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.name || !form.email) {
      setError('Name and email are required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          source: 'precon-vip',
          notes: `Budget: ${form.budget || 'Not specified'}, Area: ${form.area || 'Not specified'}, Timeline: ${form.timeline || 'Not specified'}`,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit');
      setSuccess(true);
      trackConversion('lead_submit', { source: 'precon-vip' });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">🏙️</div>
          <h1 className="font-heading font-bold text-2xl text-navy mb-3">
            You are on the VIP list!
          </h1>
          <p className="text-sm text-muted leading-relaxed max-w-md mx-auto mb-6">
            Hamza will personally send you pre-construction floor plans, pricing worksheets, and VIP incentives before they go public. Expect to hear from us within 24 hours.
          </p>
          <a href="/listings" className="btn-primary !px-8 !py-3 no-underline">
            Browse Current Listings
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero
        compact
        eyebrow="Pre-construction VIP"
        title="Pre-Construction Condos Mississauga — VIP Access"
        subtitle="Exclusive first access to new Mississauga developments — plus save up to $130K with the Ontario HST rebate."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Pre-Construction', url: 'https://www.mississaugainvestor.ca/pre-construction' },
        ]}
      />
      {/* HST Rebate Highlight */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-amber-500/15 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🔥</span>
          </div>
          <div className="flex-1">
            <h2 className="font-heading font-bold text-lg text-navy mb-1">
              Save Up to $130,000 — Ontario HST Rebate Now Active
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Get VIP access to pre-construction projects <strong>plus save up to $130,000 in HST</strong> on new builds.
              APS must be signed between April 1, 2026 and March 31, 2027. This changes the investment math entirely.
            </p>
          </div>
          <Link
            href="/pre-construction/hst-rebate"
            className="flex-shrink-0 btn-primary !px-5 !py-2.5 no-underline text-sm"
          >
            Full HST Breakdown
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left side - Info */}
        <div>
          <h2 className="font-heading font-bold text-xl text-navy mb-3">
            Why go VIP on pre-construction
          </h2>
          <p className="section-subtitle mb-8">
            Get exclusive first access to new developments in Mississauga + save up to $130K in HST
          </p>

          <div className="space-y-5 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy">First Access Pricing</h3>
                <p className="text-xs text-muted">Get VIP pricing before public launch — often 5-10% below retail.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy">Floor Plans + Worksheets</h3>
                <p className="text-xs text-muted">Receive detailed floor plans and investment analysis worksheets.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy">Best Unit Selection</h3>
                <p className="text-xs text-muted">Priority access means picking the best floors, views, and layouts.</p>
              </div>
            </div>
          </div>

          <div className="card bg-cloud p-5">
            <p className="text-xs text-muted leading-relaxed">
              Pre-construction investing allows you to lock in today&apos;s pricing for a property delivered in 2-4 years. With only 15-20% down spread over the build period, it is a capital-efficient way to build your portfolio.
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-lg text-navy mb-5">
            Join the VIP List
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Primary fields — always visible */}
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-navy">
                Name <span className="text-red-600" aria-hidden="true">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                autoComplete="name"
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">
                Email <span className="text-red-600" aria-hidden="true">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Get VIP Access'}
            </button>

            {/* Optional qualifying fields — collapsed by default */}
            <details className="group">
              <summary className="flex cursor-pointer select-none list-none items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-dark [&::-webkit-details-marker]:hidden">
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Tell us more — helps us match the right projects (optional)
              </summary>
              <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                <div>
                  <label htmlFor="phone" className="mb-1 block text-sm font-medium text-navy">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="647-XXX-XXXX"
                    autoComplete="tel"
                    className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div>
                  <label htmlFor="budget" className="mb-1 block text-sm font-medium text-navy">
                    Budget Range
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {BUDGETS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="area" className="mb-1 block text-sm font-medium text-navy">
                    Preferred Area
                  </label>
                  <select
                    id="area"
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Any area</option>
                    {HOODS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="timeline" className="mb-1 block text-sm font-medium text-navy">
                    Timeline
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={form.timeline}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {TIMELINES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </details>

            <p className="text-[11px] text-muted text-center">
              No obligation. We respect your privacy — unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>
      </div>
      <FAQJsonLd items={PRECON_FAQ} />
      {/* Lives on THIS page, not the shared layout: the layout also wraps
          /pre-construction/projects and /hst-rebate, so putting it there
          published the same FAQ markup on all three — and gave hst-rebate two
          competing FAQPage blocks. */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <h2 className="font-heading text-xl font-bold text-navy">
          Pre-construction questions investors ask
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PRECON_FAQ.map((qa) => (
            <div key={qa.question} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-heading text-sm font-semibold text-navy">{qa.question}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{qa.answer}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Go deeper:{' '}
          <Link
            href="/pre-construction/hst-rebate"
            className="font-medium text-accent no-underline hover:text-accent-dark"
          >
            the Ontario HST rebate explained
          </Link>
          ,{' '}
          <Link
            href="/pre-construction/projects"
            className="font-medium text-accent no-underline hover:text-accent-dark"
          >
            current GTA pre-construction projects
          </Link>
          , or compare against{' '}
          <Link href="/listings" className="font-medium text-accent no-underline hover:text-accent-dark">
            resale listings that cash flow today
          </Link>
          .
        </p>
        <p className="mt-3 text-xs text-slate-500">
          General information only — not legal or tax advice. Have a lawyer review any agreement of purchase and sale
          during the cooling-off period.
        </p>
      </section>
    </>
  );
}
