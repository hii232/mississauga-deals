'use client';

import { useState } from 'react';
import SignupGateModal from '@/components/ui/signup-gate-modal';
import { trackConversion } from '@/lib/track-conversion';

/**
 * Email-first capture, inline — no page navigation before the email is taken.
 *
 * The email is POSTed to /api/lead the moment it is submitted, BEFORE anything
 * else is asked for. The signup gate's own step 1 keeps the email client-side
 * and only posts on completion or skip, which loses the lead outright if the
 * visitor closes the tab — that gap is the reason this exists. Name and phone
 * are then collected by the SAME SignupGateModal, opened at step 2 so nobody is
 * asked for their email twice.
 *
 * Giving a real email is the whole price of entry, so once it lands the visitor
 * is marked fully registered even if they dismiss the profile step — otherwise
 * the CTA promises access and then withholds it.
 *
 * `tone` picks the palette: 'dark' sits on the navy hero, 'light' on a white card.
 */
export function InlineEmailCapture({
  source,
  buttonLabel,
  note,
  tone = 'dark',
  id = 'inline-email',
  autoFocus = false,
  stack = false,
  onCaptured,
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, source, timestamp: new Date().toISOString() }),
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
    trackConversion('signup', { source: source || 'inline-email' });
    setModalOpen(true);
  }

  // Called whether they complete the profile or dismiss it — the email is
  // already banked either way, so access is theirs.
  function finish() {
    setModalOpen(false);
    localStorage.setItem('user_registered', 'true');
    onCaptured?.(email.trim());
  }

  const dark = tone === 'dark';

  return (
    <div>
      <form onSubmit={handleSubmit} className={`flex w-full gap-3 ${stack ? 'flex-col' : 'flex-col sm:flex-row'}`}>
        <label htmlFor={id} className="sr-only">Email address</label>
        <input
          id={id}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          autoFocus={autoFocus}
          autoComplete="email"
          className={
            dark
              ? 'flex-1 rounded-lg border border-white/25 bg-white/95 px-4 py-3.5 text-base text-navy placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40'
              : 'flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20'
          }
        />
        <button
          type="submit"
          disabled={loading}
          className={
            dark
              ? 'btn-primary !text-base !px-7 !py-3.5 whitespace-nowrap disabled:opacity-60'
              : 'rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-dark disabled:opacity-60 whitespace-nowrap'
          }
        >
          {loading ? 'One moment…' : buttonLabel}
        </button>
      </form>

      {error && (
        <p role="alert" className={`mt-2 text-sm ${dark ? 'text-[#FFB4A8]' : 'text-red-600'}`}>{error}</p>
      )}

      {note && (
        <p className={`mt-2 text-xs ${dark ? 'text-white/70' : 'text-muted'}`}>{note}</p>
      )}

      {/* Email is already saved at this point — this only completes the profile. */}
      <SignupGateModal
        open={modalOpen}
        initialEmail={email.trim()}
        initialStep={2}
        trigger={source}
        onClose={finish}
        onSuccess={finish}
      />
    </div>
  );
}
