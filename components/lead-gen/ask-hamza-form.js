'use client';

import { useState, useEffect } from 'react';
import { trackLead } from '@/lib/utils/analytics';

export default function AskHamzaForm({ prefillUrl = '', prefillNote = '', source = 'ask-hamza' }) {
  const [form, setForm] = useState({
    mlsUrl: prefillUrl,
    name: '',
    email: '',
    phone: '',
    notes: prefillNote,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedEmail = localStorage.getItem('user_email');
    const savedName = localStorage.getItem('user_name');
    setForm((f) => ({
      ...f,
      email: f.email || savedEmail || '',
      name: f.name || savedName || '',
    }));
  }, []);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.mlsUrl || form.mlsUrl.trim().length < 10) {
      setError('Please paste a valid listing link.');
      return;
    }
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    const digits = (form.phone || '').replace(/\D/g, '');
    if (!(digits.length === 10 || (digits.length === 11 && digits.startsWith('1')))) {
      setError('Please enter a valid Canadian phone number (I need to call you with questions).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          source,
          notes: `MLS LINK: ${form.mlsUrl.trim()}\n\nINVESTOR NOTES: ${form.notes.trim() || '(none)'}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      setSuccess(true);
      trackLead(source, form.email);
      localStorage.setItem('user_registered', 'true');
      localStorage.setItem('user_email', form.email.trim().toLowerCase());
      if (form.name) localStorage.setItem('user_name', form.name.trim());
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-success/30 shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 mb-4">
          <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-heading font-bold text-navy text-2xl mb-2">Got it. I&rsquo;m on it.</h2>
        <p className="text-muted text-sm leading-relaxed max-w-md mx-auto">
          I&rsquo;ll review the listing personally and send your 1-page analysis to <span className="font-semibold text-navy">{form.email}</span> within 24 hours. If I need clarification, I&rsquo;ll call you at <span className="font-semibold text-navy">{form.phone}</span>.
        </p>
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-muted mb-3">While you wait, want to book a quick strategy call?</p>
          <a
            href="/book-call"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-semibold no-underline hover:bg-accent-dark transition"
          >
            Book a 15-min Call
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 md:p-8">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
            MLS / listing link *
          </label>
          <input
            type="url"
            value={form.mlsUrl}
            onChange={(e) => update('mlsUrl', e.target.value)}
            placeholder="https://www.realtor.ca/real-estate/..."
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 text-sm"
            required
          />
          <p className="text-[11px] text-muted mt-1">Paste from Realtor.ca, HouseSigma, or any Canadian MLS.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
              Your name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="First name"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
              Phone *
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="647-555-1234"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
            Email *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
            Anything I should know? <span className="text-muted font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="e.g. 20% down, self-managed, looking for $500/mo cash flow..."
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 text-sm resize-none"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-accent hover:bg-accent-dark text-white font-semibold py-3.5 transition-all disabled:opacity-60 shadow-lg shadow-accent/25 hover:shadow-accent/40"
        >
          {submitting ? 'Sending...' : 'Get My Free Deal Analysis \u2192'}
        </button>

        <div className="flex items-start gap-2 pt-1">
          <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <p className="text-[11px] text-muted leading-relaxed">
            Your info stays with me. No mailing list. No spam. I reply personally within 24 hours.
          </p>
        </div>
      </div>
    </form>
  );
}
