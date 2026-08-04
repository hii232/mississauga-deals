'use client';

import { useState } from 'react';
import { trackConversion } from '@/lib/track-conversion';
import Link from 'next/link';

/**
 * Reusable inline CTA banner for content pages.
 * Variants: 'deals' (default), 'quiz', 'alerts', 'newsletter'
 *
 * Variants with `capture: true` (newsletter, alerts) render an inline email
 * field that subscribes in place - a content reader converts in one tap instead
 * of being bounced to /alerts to re-find a form. deals/quiz link to their tool.
 */
// Heroicons SVGs for CTA variant headers - aria-hidden, sized for display above
// the headline on a dark gradient background.
const IconChartBar = () => (
  <svg aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);
const IconMagnifyingGlass = () => (
  <svg aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);
const IconBell = () => (
  <svg aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);
const IconStar = () => (
  <svg aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
);

const VARIANTS = {
  deals: {
    icon: <IconChartBar />,
    headline: 'See Today\'s Top Investment Deals',
    sub: 'Every Mississauga listing scored for cash flow, cap rate, and ROI - updated daily.',
    primary: { label: 'Browse Deals', href: '/listings' },
    secondary: { label: 'Take the Quiz', href: '/quiz' },
    gradient: 'from-navy via-navy to-accent/20',
  },
  quiz: {
    icon: <IconMagnifyingGlass />,
    headline: 'Not Sure Where to Start?',
    sub: 'Take the 60-second Deal Quiz and get matched with properties that fit your investment strategy.',
    primary: { label: 'Find My Strategy', href: '/quiz' },
    secondary: { label: 'Browse Listings', href: '/listings' },
    gradient: 'from-accent/90 via-accent to-navy/80',
  },
  alerts: {
    icon: <IconBell />,
    headline: 'Get Daily Deal Alerts',
    sub: 'New listings scored and delivered to your inbox every morning - never miss a deal.',
    capture: true,
    source: 'inline-cta-alerts',
    cta: 'Get Alerts',
    secondary: { label: 'See Listings', href: '/listings' },
    gradient: 'from-navy to-accent/30',
  },
  newsletter: {
    icon: <IconStar />,
    headline: 'Get the 10 Best Cash-Flowing Deals Every Monday',
    sub: 'Free weekly email - the highest cash-flow Mississauga investment properties, scored, analyzed, and ranked.',
    capture: true,
    source: 'inline-cta-newsletter',
    cta: 'Send Me the Deals',
    secondary: { label: 'See All Deals', href: '/listings' },
    gradient: 'from-navy via-accent/30 to-navy',
  },
};

function InlineCapture({ v }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: v.source,
          utm_source: 'inline-cta',
          utm_medium: 'content',
          utm_campaign: v.source,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Something went wrong. Please try again.');
      }
      setStatus('done');
      trackConversion('newsletter_subscribe', { source: v.source });
      setMessage("You're in! Check your inbox to confirm.");
    } catch (err) {
      setStatus('error');
      setMessage(err?.message || 'Something went wrong. Please try again.');
    }
  }

  if (status === 'done') {
    return (
      <p role="status" className="mx-auto max-w-md rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`cta-email-${v.source}`} className="sr-only">Email address</label>
        <input
          id={`cta-email-${v.source}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-white/40"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary !px-6 shrink-0 disabled:opacity-60"
        >
          {status === 'loading' ? 'Joining…' : v.cta}
        </button>
      </div>
      {status === 'error' && (
        <p role="alert" className="mt-2 rounded bg-red-500/30 px-3 py-2 text-xs text-white">{message}</p>
      )}
      <p className="mt-2 text-[11px] text-white/70">Free forever · one email a week · unsubscribe in one click.</p>
    </form>
  );
}

export default function InlineCTA({ variant = 'deals', className = '' }) {
  const v = VARIANTS[variant] || VARIANTS.deals;

  return (
    <div className={`bg-gradient-to-br ${v.gradient} rounded-2xl p-8 text-center ${className}`}>
      {v.icon}
      {/* h2, not h3: this block is a distinct section of the page, and on /blog
          it was the FIRST heading after the h1, producing an h1->h3 skip in the
          document outline. Pages that already have h2 sections keep a flat
          outline either way. Size comes from the classes, so nothing moves. */}
      <h2 className="font-heading text-xl font-bold text-white mb-2">{v.headline}</h2>
      <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">{v.sub}</p>

      {v.capture ? (
        <>
          <InlineCapture v={v} />
          <div className="mt-4">
            <Link href={v.secondary.href} className="text-xs font-medium text-white/70 no-underline hover:text-white">
              {v.secondary.label} →
            </Link>
          </div>
        </>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={v.primary.href} className="btn-primary !px-6 no-underline text-center">
            {v.primary.label}
          </Link>
          <Link
            href={v.secondary.href}
            className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 no-underline text-center"
          >
            {v.secondary.label}
          </Link>
        </div>
      )}
    </div>
  );
}
