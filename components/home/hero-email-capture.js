'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SignupGateModal from '@/components/ui/signup-gate-modal';
import { trackConversion } from '@/lib/track-conversion';

/**
 * Inline email capture in the homepage hero.
 *
 * Replaces the old hero button that navigated to /signup. Time-to-capture on
 * the site's #1 page was: click CTA → full page load → then type an email. Now
 * the field is the first thing in reach, and the email is persisted server-side
 * the moment it is submitted — so a visitor who abandons the profile step is
 * still a real lead rather than a lost one.
 *
 * `count` is the real live listing count from the server homepage (string like
 * "388", or null when the feed returned nothing) — never a hardcoded number.
 */
export function HeroEmailCapture({ count }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('user_registered'));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setError('');
    setLoading(true);

    // Persist the email BEFORE asking for anything else. The signup gate keeps
    // step 1 client-side only and posts on completion/skip, which loses the
    // lead outright if the visitor closes the tab — in the hero, where drop-off
    // is highest, that gap is the whole problem being fixed.
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: value,
          source: 'Homepage Hero (email only)',
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      // Never fake success on a rejection (429 rate-limit, 400) — that would
      // mark them registered while the lead never reached Hamza.
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
    } catch {
      setError('Something went wrong. Please try again.');
      return;
    } finally {
      setLoading(false);
    }

    localStorage.setItem('user_email', value);
    localStorage.setItem('user_registered', 'partial');
    trackConversion('signup', { source: 'hero-email' });
    setModalOpen(true);
  }

  // Signed-in visitors already gave the email — send them to the next step.
  if (isLoggedIn) {
    return (
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
        <Link href="/quiz" className="btn-primary !text-base !px-8 !py-3.5 no-underline text-center w-full sm:w-auto">
          Find My Deal
        </Link>
        <Link
          href="/listings"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/70 no-underline hover:text-white transition-colors"
        >
          Browse all deals
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    );
  }

  const buttonLabel = count ? `Unlock ${count} Deals` : 'Unlock the Deals';

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
        <label htmlFor="hero-email" className="sr-only">Email address</label>
        <input
          id="hero-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          autoComplete="email"
          className="flex-1 rounded-lg border border-white/25 bg-white/95 px-4 py-3.5 text-base text-navy placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary !text-base !px-7 !py-3.5 whitespace-nowrap disabled:opacity-60"
        >
          {loading ? 'One moment…' : `${buttonLabel} — Free`}
        </button>
      </form>

      {error && <p role="alert" className="mt-2 text-sm text-[#FFB4A8]">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-xs text-white/70">Free forever. No credit card. Unsubscribe anytime.</p>
        <Link
          href="/listings"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/70 no-underline hover:text-white transition-colors"
        >
          Browse all deals
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      {/* Email is already saved at this point — this only completes the profile. */}
      <SignupGateModal
        open={modalOpen}
        initialEmail={email.trim()}
        initialStep={2}
        trigger="hero"
        onClose={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
      />
    </div>
  );
}
