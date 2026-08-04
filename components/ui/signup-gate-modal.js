'use client';
import { trackConversion } from '@/lib/track-conversion';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ProofRow } from '@/components/ui/proof-row';
import { formatPhone, isValidPhone, isFakePhone } from '@/lib/phone';

/**
 * Two-step inline signup modal.
 * Step 1: Email only (micro-conversion)
 * Step 2: Name + Phone (profile completion)
 *
 * Appears as overlay on listings page - user never leaves the page.
 */
// `initialEmail` / `initialStep` let a caller that has ALREADY captured the
// email (the homepage hero's inline field) open this straight at step 2 instead
// of asking for the email a second time.
// `listing` ({ id, address, price }) is threaded through to /api/lead so the
// notification Hamza receives names the property the visitor was looking at.
// Without it the API's listing fields stay null and the property block in the
// lead email - which already exists and links straight to the listing - never
// renders for the highest-intent leads on the site.
export default function SignupGateModal({ open, onClose, onSuccess, trigger = 'gate', initialEmail = '', initialStep = 1, listing = null }) {
  const leadListing = listing
    ? {
        listingId: listing.id || undefined,
        listingAddress: listing.address || undefined,
        listingPrice: listing.price || undefined,
      }
    : {};
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Rendered through a portal (see the return): z-[9999] alone is not enough,
  // because z-index is resolved WITHIN the nearest stacking context. Mounted
  // inside the homepage hero - whose wrapper is `relative z-10` - the whole
  // modal was painted under the sticky header (z-50), leaving its close button
  // unclickable. document.body has no such parent.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setStep(initialStep);
      if (initialEmail) setEmail(initialEmail);
      setError('');
      setLoading(false);
    }
  }, [open, initialStep, initialEmail]);

  if (!open || !mounted) return null;

  async function handleStep1(e) {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }

    // Bank the email SERVER-SIDE before asking for anything else, exactly as
    // InlineEmailCapture does. This step used to keep the email in localStorage
    // only and post nothing until step 2 completed or was skipped - so a
    // visitor who closed the tab at step 2 was lost outright. That gap is why
    // phone could not safely be made mandatory here: requiring the one field
    // people most resist, on a form whose abandonment also threw away the
    // email, would have traded leads for phone numbers. With the email already
    // stored, refusing the phone costs the enrichment and nothing more.
    setLoading(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: trigger === 'view-limit' ? 'View Limit' : 'Sign Up',
          ...leadListing,
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      // Never advance on a server rejection (429, 400) - that would show the
      // profile form for a lead that was never stored.
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

    // Phone is REQUIRED to complete a profile: Hamza works these leads by
    // phone, and an email-only lead is far less likely to become a client.
    // This is safe to require now only because handleStep1 posts the email
    // before this form is ever shown - abandoning here loses the name and
    // phone, never the lead itself. The "skip" link below stays as the honest
    // way out, so nobody is trapped in the modal over a field they won't give.
    if (!phone) {
      setError('Please enter a phone number so Hamza can reach you.');
      return;
    }
    // Shared validator, not a local "10+ digits" check: that looser rule let an
    // 11-digit number with a mistyped area code through here while /signup
    // rejected the same input.
    if (!isValidPhone(phone)) {
      setError('Please enter a valid phone number (e.g. 647-361-1234).');
      return;
    }
    if (isFakePhone(phone)) {
      setError('Please enter a real phone number Hamza can reach you at.');
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
          ...leadListing,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      // Don't fake success on a server rejection (429 rate-limit, 400, 500) -
      // that would mark the visitor registered and dismiss the modal while the
      // lead never reached Hamza. Surface the error and let them retry.
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      localStorage.setItem('user_registered', 'true');
      trackConversion('signup', { source: 'gate-complete' });
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
    // They gave an email but would not give a phone. The email is already
    // stored (handleStep1 posts it), so this second post is not what saves the
    // lead - it exists to record the distinct "(email only)" source so Hamza
    // can see in admin who declined the profile, and to bank a partially-typed
    // name. Fire-and-forget: never block the UI on a network hiccup.
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        name: (firstName || lastName) ? `${firstName} ${lastName}`.trim() : undefined,
        phone: phone || undefined,
        source: trigger === 'view-limit' ? 'View Limit (email only)' : 'Sign Up (email only)',
        ...leadListing,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
    localStorage.setItem('user_registered', 'true');
    trackConversion('signup', { source: 'gate-email-only' });
    localStorage.setItem('user_email', email);
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  }

  return createPortal(
    // Always dismissible now. Step 2 used to trap the visitor because the email
    // had not been persisted yet, so letting them out lost the lead. Since
    // handleStep1 banks the email server-side, there is nothing left to hold
    // them hostage for - and holding someone in an unclosable modal over a
    // now-required phone field is exactly how a trustworthy site stops feeling
    // like one.
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="relative w-full max-w-md animate-scaleUp rounded-2xl bg-white shadow-2xl overflow-hidden">
        {step === 2 && (
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}

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
                <span className="text-xs font-semibold text-emerald-700">New investment deals added daily</span>
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
                  disabled={loading}
                  className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
                >
                  {loading ? 'One moment…' : 'Unlock Premium Deals - Free'}
                </button>
              </form>

              <p className="mt-3 text-center text-[11px] text-slate-500">
                Free forever. No credit card. No spam.
              </p>
              {/* VOW terms assent - this capture unlocks sold/comp data, and
                  TRREB's VOW rules require a terms-of-use agreement before
                  that data is shown. Substance in /terms §5. */}
              <p className="mt-1 text-center text-[11px] text-slate-500">
                By continuing you agree to the{' '}
                <a href="/terms" className="underline hover:text-slate-700" target="_blank" rel="noopener">
                  Terms of Use
                </a>
                , including personal, non-commercial use of MLS&reg; data.
              </p>

              {/* Social proof. This hardcoded "4,000+ Listings Scored", which
                  contradicted the site-wide PLATFORM_STATS figure ("1,800+") by
                  more than double - on the one surface where a visitor is
                  deciding whether to trust us with an email. ProofRow sources
                  every number live and drops any it cannot source. */}
              <div className="mt-4 border-t border-slate-100 pt-4">
                <ProofRow />
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
              {/* The old line - "complete your profile to get deal alerts &
                  first month's mortgage on us" - read as if finishing the form
                  earned the mortgage credit. The actual condition is closing a
                  purchase with Hamza, and an inducement ad that hides its
                  condition is misleading advertising (RECO). State it. */}
              <p className="mt-1 text-sm text-white/60">
                Complete your profile to get deal alerts - and when you close with Hamza,
                your first month&apos;s mortgage is on us as a credit on closing.
              </p>
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
                  <label className="mb-1 block text-sm font-medium text-navy">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(647) 361-1234"
                    required
                    className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Hamza texts deals to this number before they hit the site</p>
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
                className="mt-2 w-full py-2 text-center text-xs text-slate-500 hover:text-slate-700 transition"
              >
                Skip for now - I&apos;ll complete later
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
    </div>,
    document.body
  );
}
