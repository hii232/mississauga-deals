'use client';

import { useState } from 'react';

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
          <p className="text-lg font-semibold text-navy">{message}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#E6F1FB]">
      <div className="max-w-xl mx-auto px-6 py-10 text-center">
        <h2 className="font-heading font-bold text-2xl text-navy mb-2">
          Get the top 10 deals every Monday
        </h2>
        <p className="text-sm text-navy/70 mb-6">
          The highest-scoring Mississauga investment properties delivered to your inbox. Free.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90 transition disabled:opacity-60 whitespace-nowrap"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
          </button>
        </form>
        {status === 'error' && (
          <p className="text-xs text-red-500 mt-3">{message}</p>
        )}
        <p className="text-[11px] text-navy/40 mt-4">
          Join GTA investors. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
