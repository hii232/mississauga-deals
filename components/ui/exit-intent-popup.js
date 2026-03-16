'use client';

import { useState, useEffect, useRef } from 'react';
import { trackExitIntent, trackLead } from '@/lib/utils/analytics';

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const armed = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Don't show to registered users or if already dismissed
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('user_registered') === 'true') return;
    if (localStorage.getItem('exit_intent_dismissed')) return;

    // Pre-fill email if available
    const saved = localStorage.getItem('user_email');
    if (saved) setEmail(saved);

    // Arm after 10 seconds on site
    timerRef.current = setTimeout(() => {
      armed.current = true;
    }, 10000);

    const handleMouseLeave = (e) => {
      if (!armed.current) return;
      // Only trigger when mouse exits toward the top (browser chrome)
      if (e.clientY > 0) return;
      armed.current = false; // One-shot
      setVisible(true);
      trackExitIntent('shown');
    };

    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timerRef.current);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('exit_intent_dismissed', 'true');
    trackExitIntent('dismissed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: '',
          source: 'exit-intent',
          notes: 'Subscribed via exit-intent popup for daily deal alerts',
        }),
      });

      if (!res.ok) throw new Error('Failed to subscribe');

      setSuccess(true);
      trackExitIntent('converted');
      trackLead('exit-intent', email);
      localStorage.setItem('user_registered', 'true');
      localStorage.setItem('user_email', email.trim().toLowerCase());
      localStorage.setItem('exit_intent_dismissed', 'true');

      // Auto-close after 3 seconds
      setTimeout(() => setVisible(false), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-overlayIn"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-scaleUp">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-navy px-8 pt-8 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/20 mb-4">
            <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white font-heading">
            {success ? "You're In!" : 'Get Daily Deal Alerts'}
          </h2>
          <p className="text-slate-300 mt-2 text-sm leading-relaxed">
            {success
              ? 'Check your inbox for investment opportunities.'
              : 'New Mississauga investment properties scored and delivered to your inbox every morning.'}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-3">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-navy font-semibold">Welcome to the inside track.</p>
              <p className="text-sm text-muted mt-1">You'll get your first alert tomorrow morning.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-slate-200 bg-cloud px-4 py-3.5 text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                  autoFocus
                />
                {error && <p className="text-danger text-xs mt-1.5">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-accent hover:bg-accent-dark text-white font-semibold py-3.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-accent/25 hover:shadow-accent/40"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Subscribing...
                  </span>
                ) : (
                  'Get Free Daily Alerts'
                )}
              </button>

              <div className="flex items-start gap-2 pt-1">
                <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <p className="text-xs text-muted leading-relaxed">
                  Free forever. No spam. Unsubscribe anytime. We respect your privacy.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Social proof */}
        {!success && (
          <div className="bg-cloud border-t border-slate-100 px-8 py-4 text-center">
            <p className="text-xs text-muted">
              <span className="font-semibold text-navy">1,800+</span> active listings tracked daily across Mississauga
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
