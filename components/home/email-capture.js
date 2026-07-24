'use client';

import { useState } from 'react';
import { trackConversion } from '@/lib/track-conversion';
import { GOOGLE_REVIEWS } from '@/lib/constants';

// One real, investor-relevant Google review, shown as proof right at the capture
// point. Falls back to the first review if that reviewer is ever removed.
const FEATURED_REVIEW =
  GOOGLE_REVIEWS.find((r) => r.name === 'Ryan Yau') || GOOGLE_REVIEWS[0] || null;

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');

    try {
      // Grab UTM params from URL
      const params = new URLSearchParams(window.location.search);
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'homepage_weekly_deals',
          utm_source: params.get('utm_source') || null,
          utm_medium: params.get('utm_medium') || null,
          utm_campaign: params.get('utm_campaign') || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus('success');
        trackConversion('newsletter_subscribe', { source: 'homepage' });
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Try again.');
    }
  }

  if (status === 'success') {
    return (
      <section className="bg-[#E6F1FB]">
        <div className="max-w-xl mx-auto px-6 py-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/15 mb-4">
            <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p role="status" className="text-lg font-semibold text-navy">{message}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#E6F1FB]">
      <div className="max-w-xl mx-auto px-6 py-10 text-center">
        <h2 className="font-heading font-bold text-2xl text-navy mb-2">
          Get the 10 best cash-flowing deals in Mississauga
        </h2>
        <p className="text-sm text-navy/70 mb-6">
          Hand-picked every Monday — the highest cash-flow investment properties on the market, delivered free to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            aria-label="Email address"
            required
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90 transition disabled:opacity-60 whitespace-nowrap"
          >
            {status === 'loading' ? 'Subscribing...' : 'Send Me the Deals'}
          </button>
        </form>
        {status === 'error' && (
          <p role="alert" className="text-xs text-red-500 mt-3">{message}</p>
        )}
        {FEATURED_REVIEW && (
          <figure className="mx-auto mt-6 max-w-sm">
            <div aria-hidden="true" className="text-gold text-base leading-none tracking-[0.15em]">★★★★★</div>
            <blockquote className="mt-2 text-sm italic leading-relaxed text-navy/80">
              &ldquo;{FEATURED_REVIEW.text.length > 132 ? FEATURED_REVIEW.text.slice(0, 130).trimEnd() + '…' : FEATURED_REVIEW.text}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-[11px] font-semibold text-navy/70">
              &mdash; {FEATURED_REVIEW.name} · Verified Google review · 5.0 on Google (28 reviews)
            </figcaption>
          </figure>
        )}
        <p className="text-[11px] text-navy/40 mt-4">
          Free weekly email. No spam, unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
