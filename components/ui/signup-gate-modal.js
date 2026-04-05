'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Two-step inline signup modal.
 * Step 1: Email only (micro-conversion)
 * Step 2: Name + Phone (profile completion)
 *
 * Appears as overlay on listings page — user never leaves the page.
 */
export default function SignupGateModal({ open, onClose, onSuccess, trigger = 'gate' }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setStep(1);
      setError('');
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  function formatPhone(val) {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length >= 7) {
      const s = digits.length === 11 ? 1 : 0;
      let f = `(${digits.slice(s, s + 3)}) ${digits.slice(s + 3, s + 6)}-${digits.slice(s + 6)}`;
      if (digits.length === 11) f = '1 ' + f;
      return f;
    } else if (digits.length >= 4) {
      const s = digits.length === 11 ? 1 : 0;
      return `(${digits.slice(s, s + 3)}) ${digits.slice(s + 3)}`;
    }
    return digits;
  }

  async function handleStep1(e) {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    // Save email to localStorage immediately (micro-conversion captured)
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_registered', 'partial');
    setStep(2);
  }

  async function handleStep2(e) {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName) {
      setError('Please enter your name.');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          email,
          phone,
          source: trigger === 'view-limit' ? 'View Limit' : 'Sign Up',
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      localStorage.setItem('user_registered', 'true');
      localStorage.setItem('user_name', `${firstName} ${lastName}`);
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_phone', phone);

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSkipStep2() {
    // They gave email but skipped name/phone — still a micro-conversion
    localStorage.setItem('user_registered', 'true');
    localStorage.setItem('user_email', email);
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget && step === 1) onClose?.(); }}>
      <div className="w-full max-w-md animate-scaleUp rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* ── STEP 1: Email Only ── */}
        {step === 1 && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-navy to-accent/80 px-8 py-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Unlock Premium Deal Analysis</h2>
              <p className="mt-1 text-sm text-white/60">See cash flow, cap rate & deal scores on every listing</p>
            </div>

            {/* Body */}
            <div className="px-8 py-6">
              {/* Urgency counter */}
              <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                <span className="text-xs font-semibold text-emerald-700">388 premium deals available right now</span>
              </div>

              {error && (
                <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
              )}

              <form onSubmit={handleStep1}>
                <label className="mb-1.5 block text-sm font-medium text-navy">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  required
                  className="mb-4 block w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  Unlock Premium Deals — Free
                </button>
              </form>

              <p className="mt-3 text-center text-[11px] text-slate-400">
                Free forever. No credit card. No spam.
              </p>

              {/* Social proof */}
              <div className="mt-4 flex items-center justify-center gap-4 border-t border-slate-100 pt-4">
                <div className="text-center">
                  <p className="text-sm font-bold text-navy">4,000+</p>
                  <p className="text-[10px] text-slate-400">Listings Scored</p>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-sm font-bold text-navy">5.0 ★</p>
                  <p className="text-[10px] text-slate-400">Google Rating</p>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-sm font-bold text-navy">Free</p>
                  <p className="text-[10px] text-slate-400">No Catch</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2: Name + Phone ── */}
        {step === 2 && (
          <>
            <div className="bg-gradient-to-r from-navy to-accent/80 px-8 py-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/20 backdrop-blur-sm">
                <svg className="h-7 w-7 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Almost There!</h2>
              <p className="mt-1 text-sm text-white/60">Complete your profile to get deal alerts & first month&apos;s mortgage on us</p>
            </div>

            <div className="px-8 py-6">
              {error && (
                <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
              )}

              <form onSubmit={handleStep2} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      autoFocus
                      required
                      className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Smith"
                      required
                      className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(647) 555-1234"
                    required
                    className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">We&apos;ll text you top deals before they hit the site</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-accent/90 focus:outline-none disabled:opacity-60"
                >
                  {loading ? 'Creating account...' : 'Get Full Access'}
                </button>
              </form>

              <button
                type="button"
                onClick={handleSkipStep2}
                className="mt-2 w-full py-2 text-center text-xs text-slate-400 hover:text-slate-600 transition"
              >
                Skip for now — I&apos;ll complete later
              </button>

              {/* Mortgage offer teaser */}
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-emerald-700">
                  🏠 Buy through us → First month&apos;s mortgage on us
                </p>
                <p className="text-[10px] text-emerald-600">Applied as credit on closing. All investment properties qualify.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
