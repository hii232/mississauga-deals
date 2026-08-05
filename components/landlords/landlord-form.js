'use client';

import { useState } from 'react';
import { trackConversion } from '@/lib/track-conversion';
import { formatPhone, isValidPhone, isFakePhone } from '@/lib/phone';

/**
 * Landlord lead form for /landlords. Posts to /api/lead with its own source so
 * admin can tell a landlord from a seller - today's landlord is tomorrow's
 * buyer or seller, and the follow-up is different.
 *
 * Phone is REQUIRED here, and unlike the signup gate that needs no apology:
 * the product being requested is a rent check delivered by a person. A
 * landlord asking "what should my unit rent for" expects the call-back - this
 * is the most natural phone trade on the site. The number is validated with
 * the same shared helpers as every other form so a typo can't reach Hamza as
 * a dead contact.
 */
const input =
  'block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

export function LandlordForm({ id }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', beds: '', status: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function set(e) {
    const v = e.target.name === 'phone' ? formatPhone(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: v });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.address) {
      setError('Name, email, and the rental address are required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!form.phone) {
      setError("Please enter a phone number - it's how we deliver your rent check.");
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError('Please enter a valid phone number (e.g. 647-361-1234).');
      return;
    }
    if (isFakePhone(form.phone)) {
      setError('Please enter a real phone number we can reach you at.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          source: 'landlord-rent-check',
          notes: `Rental address: ${form.address}, Beds: ${form.beds || 'Not specified'}, Status: ${form.status || 'Not specified'}`,
        }),
      });
      if (!res.ok) throw new Error('submit failed');
      setSuccess(true);
      trackConversion('lead_submit', { source: 'landlord-rent-check' });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div id={id} className="card scroll-mt-24 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <svg aria-hidden="true" className="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="mb-2 font-heading text-xl font-bold text-navy">Your rent check is on the way</h2>
        <p className="text-sm leading-relaxed text-muted">
          We&apos;ll pull the recent lease comps for your unit and call or text you with the
          rent range - usually within one business day.
        </p>
      </div>
    );
  }

  return (
    <form id={id} onSubmit={submit} className="card scroll-mt-24 space-y-4 p-6">
      <h2 className="font-heading text-lg font-semibold text-navy">Get your free rent check</h2>
      <p className="text-xs leading-relaxed text-muted">
        Tell us about your rental and we&apos;ll call or text you the rent range it should
        command, based on recent signed leases nearby. Free, no obligation.
      </p>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-danger">{error}</div>
      )}

      <input name="name" value={form.name} onChange={set} placeholder="Your name *" autoComplete="name" className={input} />
      <input name="email" type="email" value={form.email} onChange={set} placeholder="Email *" autoComplete="email" className={input} />
      <input name="phone" type="tel" value={form.phone} onChange={set} placeholder="Phone * (for your rent check)" autoComplete="tel" className={input} />
      <input name="address" value={form.address} onChange={set} placeholder="Rental property address *" autoComplete="street-address" className={input} />
      <div className="grid grid-cols-2 gap-3">
        <select name="beds" value={form.beds} onChange={set} className={input} aria-label="Bedrooms">
          <option value="">Bedrooms</option>
          <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
        </select>
        <select name="status" value={form.status} onChange={set} className={input} aria-label="Current status">
          <option value="">Current status</option>
          <option>Vacant now</option>
          <option>Tenant leaving soon</option>
          <option>Tenanted, just checking rent</option>
          <option>Thinking of selling it</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {loading ? 'Sending…' : 'Get My Free Rent Check'}
      </button>
      <p className="text-center text-[11px] text-muted">Free, no obligation. We never share your details.</p>
    </form>
  );
}
