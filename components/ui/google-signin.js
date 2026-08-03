'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { formatPhone, isValidPhone, isFakePhone } from '@/lib/phone';

/**
 * Google Sign-In button using Google Identity Services (GSI).
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID env var.
 *
 * On success: decodes the JWT credential, posts the lead to /api/lead, sets
 * localStorage, and calls onSuccess with user info.
 *
 * PHONE COLLECTION (`collectPhone`)
 * ---------------------------------
 * Google returns name + email and never a phone number, so this was the one
 * registration path that yielded nothing callable — and the easiest button on
 * the page to press. With `collectPhone`, a prompt appears after Google
 * returns and before access is granted.
 *
 * The lead is POSTed BEFORE the prompt is shown, so the name and email are
 * already banked; declining the number costs the number and nothing else.
 * That ordering is what makes it safe to ask here at all, and it is why the
 * prompt has a visible skip rather than trapping the visitor — see the same
 * reasoning in signup-gate-modal.js.
 *
 * OFF by default, and deliberately left off on /login: a returning user
 * signing in should never be interrogated for a field to get back into their
 * own account. It is enabled on /signup, where asking is legitimate.
 */
export function GoogleSignIn({
  onSuccess,
  onError,
  listingId = '',
  listingAddress = '',
  listingPrice = '',
  collectPhone = false,
}) {
  const btnRef = useRef(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Non-null once Google has returned and we are holding access pending the
  // phone prompt. Never set when collectPhone is false.
  const [pending, setPending] = useState(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const finish = useCallback(
    (userData) => {
      localStorage.setItem('user_registered', 'true');
      localStorage.setItem('user_name', userData.name);
      localStorage.setItem('user_email', userData.email);
      setPending(null);
      onSuccess?.(userData);
    },
    [onSuccess]
  );

  const handleCredentialResponse = useCallback(
    async (response) => {
      let userData;
      try {
        // Decode the JWT payload (base64url → JSON)
        const payload = JSON.parse(
          atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
        );

        userData = {
          name: payload.name || '',
          email: payload.email || '',
          picture: payload.picture || '',
        };
      } catch {
        onError?.('Failed to process Google sign-in.');
        return;
      }

      // Capture the lead — carry the listing the visitor was viewing (if any)
      // so Hamza's notification shows the property, not just a bare sign-in.
      // Fire-and-forget by design: a network hiccup here must not cost the
      // visitor their sign-in, and the phone prompt below enriches this same
      // row a moment later anyway.
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          source: 'google-signin',
          listingId: listingId || undefined,
          listingAddress: listingAddress || undefined,
          listingPrice: listingPrice || undefined,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});

      if (collectPhone) {
        setPhone('');
        setPhoneError('');
        setPending(userData);
        return;
      }
      finish(userData);
    },
    [onError, finish, collectPhone, listingId, listingAddress, listingPrice]
  );

  async function submitPhone(e) {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setPhoneError('Please enter a valid phone number (e.g. 647-361-1234).');
      return;
    }
    if (isFakePhone(phone)) {
      setPhoneError('Please enter a real phone number Hamza can reach you at.');
      return;
    }
    setPhoneError('');
    setSaving(true);
    // Enriches the row the sign-in just created — /api/lead matches on email
    // and fills blanks without overwriting anything already stored.
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pending.name,
          email: pending.email,
          phone,
          source: 'google-signin',
          listingId: listingId || undefined,
          listingAddress: listingAddress || undefined,
          listingPrice: listingPrice || undefined,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // The number is worth having, but not at the cost of stranding someone
      // who already authenticated. Let them through; the lead exists either way.
    }
    localStorage.setItem('user_phone', phone);
    setSaving(false);
    finish(pending);
  }

  useEffect(() => {
    if (!clientId) return;

    // Load GSI script if not already loaded
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogle();
      document.head.appendChild(script);
    } else if (window.google?.accounts) {
      initGoogle();
    }

    function initGoogle() {
      if (!window.google?.accounts || !btnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(btnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: btnRef.current.offsetWidth || 320,
      });
    }
  }, [clientId, handleCredentialResponse]);

  // If no client ID configured, show a disabled placeholder
  if (!clientId) {
    return (
      <button
        disabled
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#ccc" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ccc" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#ccc" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ccc" />
        </svg>
        Google Sign-In not configured
      </button>
    );
  }

  return (
    <>
      <div ref={btnRef} className="w-full" />

      {/* Rendered through a portal: mounted inside a card with its own stacking
          context, a plain z-index would paint this under the sticky header —
          the same trap signup-gate-modal.js documents. */}
      {pending && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm animate-scaleUp rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-navy">
              One last thing{pending.name ? `, ${pending.name.split(' ')[0]}` : ''}
            </h2>
            <p className="mt-1 text-sm text-muted">
              What&apos;s the best number to reach you at? Hamza texts new deals to
              investors before they hit the site.
            </p>

            {phoneError && (
              <div role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
                {phoneError}
              </div>
            )}

            <form onSubmit={submitPhone} className="mt-4">
              <label htmlFor="google-phone" className="mb-1 block text-sm font-medium text-navy">
                Phone Number
              </label>
              <input
                id="google-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                autoFocus
                required
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(647) 361-1234"
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="submit"
                disabled={saving}
                className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Finish & See Deals'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => finish(pending)}
              className="mt-2 w-full py-2 text-center text-xs text-slate-500 transition hover:text-slate-700"
            >
              Skip for now
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
