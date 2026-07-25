'use client';

import { useState } from 'react';
import { trackConversion } from '@/lib/track-conversion';

/**
 * Compact one-field email capture for the blog post sidebar.
 *
 * A cold organic reader lands mid-article from Google. The sidebar's other
 * cards all ask for commitment — a quiz, a phone call, a booking. This is the
 * ask that matches their temperature: one field, weekly deals, done. Uses the
 * same /api/newsletter/subscribe endpoint as every other capture (it also
 * records the lead), with its own source tag so Hamza can see the blog
 * converting in the admin.
 */
export function SidebarEmailCapture() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | busy | done | error

  async function submit(e) {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) {
      setState('error');
      return;
    }
    setState('busy');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), source: 'blog-sidebar' }),
      });
      if (!res.ok) throw new Error();
      setState('done');
      trackConversion('newsletter_subscribe', { source: 'blog-sidebar' });
      try { localStorage.setItem('user_email', email.trim().toLowerCase()); } catch {}
    } catch {
      // Real failure state — never fake success on a rejected submit.
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <p role="status" className="text-sm font-semibold text-emerald-700">You&apos;re in.</p>
        <p className="mt-1 text-xs text-emerald-700/80">Your first deal roundup lands Monday.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
      <p className="font-heading text-sm font-bold text-navy">Get the top deals every Monday</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        The highest cash-flow Mississauga listings — scored and ranked, free.
      </p>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }}
          placeholder="you@example.com"
          aria-label="Email address"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        {state === 'error' && (
          <p role="alert" className="text-xs text-red-600">Please enter a valid email and try again.</p>
        )}
        <button
          type="submit"
          disabled={state === 'busy'}
          className="w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {state === 'busy' ? 'Subscribing…' : 'Send me the deals'}
        </button>
      </form>
      <p className="mt-2 text-[10px] text-slate-500">Free forever. Unsubscribe anytime.</p>
    </div>
  );
}
