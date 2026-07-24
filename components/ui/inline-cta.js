'use client';

import { useState } from 'react';
import { trackConversion } from '@/lib/track-conversion';
import Link from 'next/link';

/**
 * Reusable inline CTA banner for content pages.
 * Variants: 'deals' (default), 'quiz', 'alerts', 'newsletter'
 *
 * Variants with `capture: true` (newsletter, alerts) render an inline email
 * field that subscribes in place — a content reader converts in one tap instead
 * of being bounced to /alerts to re-find a form. deals/quiz link to their tool.
 */
const VARIANTS = {
  deals: {
    icon: '📊',
    headline: 'See Today\'s Top Investment Deals',
    sub: 'Every Mississauga listing scored for cash flow, cap rate, and ROI — updated daily.',
    primary: { label: 'Browse Deals', href: '/listings' },
    secondary: { label: 'Take the Quiz', href: '/quiz' },
    gradient: 'from-navy via-navy to-accent/20',
  },
  quiz: {
    icon: '🎯',
    headline: 'Not Sure Where to Start?',
    sub: 'Take the 60-second Deal Quiz and get matched with properties that fit your investment strategy.',
    primary: { label: 'Find My Strategy', href: '/quiz' },
    secondary: { label: 'Browse Listings', href: '/listings' },
    gradient: 'from-accent/90 via-accent to-navy/80',
  },
  alerts: {
    icon: '🔔',
    headline: 'Get Daily Deal Alerts',
    sub: 'New listings scored and delivered to your inbox every morning — never miss a deal.',
    capture: true,
    source: 'inline-cta-alerts',
    cta: 'Get Alerts',
    secondary: { label: 'See Listings', href: '/listings' },
    gradient: 'from-navy to-accent/30',
  },
  newsletter: {
    icon: '🏆',
    headline: 'Get the 10 Best Cash-Flowing Deals Every Monday',
    sub: 'Free weekly email — the highest cash-flow Mississauga investment properties, scored, analyzed, and ranked.',
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
      <span className="text-3xl mb-3 block">{v.icon}</span>
      <h3 className="font-heading text-xl font-bold text-white mb-2">{v.headline}</h3>
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
