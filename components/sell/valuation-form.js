'use client';

import { useState } from 'react';

const PROPERTY_TYPES = [
  { value: '', label: 'Select property type' },
  { value: 'detached', label: 'Detached' },
  { value: 'semi-detached', label: 'Semi-Detached' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo Apartment' },
  { value: 'condo-town', label: 'Condo Townhouse' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'triplex', label: 'Triplex' },
  { value: 'other', label: 'Other' },
];

const GOALS = [
  { value: '', label: 'What are you looking for?' },
  { value: 'investor-preview', label: 'An investor offer preview (quiet sale)' },
  { value: 'full-listing', label: 'A full-market listing (top dollar)' },
  { value: 'both', label: 'Not sure — show me both options' },
];

const SELL_TIMELINES = [
  { value: '', label: 'Select timeline' },
  { value: 'asap', label: 'As soon as possible' },
  { value: '1-3mo', label: '1-3 months' },
  { value: '3-6mo', label: '3-6 months' },
  { value: '6-12mo', label: '6-12 months' },
  { value: 'exploring', label: 'Just exploring' },
];

/**
 * Seller lead form for the /sell page. Posts to /api/lead with source
 * 'investor-offer-preview' (labelled "Seller — Investor Offer Preview" in
 * Hamza's inbox + CRM). Kept as its own client component so the page stays a
 * server component with SEO metadata + structured data.
 */
export function ValuationForm({ id }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', propertyType: '', goal: '', timeline: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.address) {
      setError('Name, email, and property address are required.');
      return;
    }
    setLoading(true);
    try {
      const goalLabel = (GOALS.find((g) => g.value === form.goal) || {}).label;
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          source: 'investor-offer-preview',
          notes: `Address: ${form.address}, Type: ${form.propertyType || 'Not specified'}, Wants: ${goalLabel || 'Not specified'}, Timeline: ${form.timeline || 'Not specified'}`,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div id={id} className="card p-8 text-center scroll-mt-24">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-3xl">🏡</div>
        <h2 className="font-heading font-bold text-xl text-navy mb-2">Your Investor Offer Preview is on the way</h2>
        <p className="text-sm text-muted leading-relaxed max-w-sm mx-auto mb-6">
          Hamza will quietly check his investor buyers on your home and prepare a data-backed market valuation, then
          follow up personally within 24–48 hours. No obligation, fully confidential.
        </p>
        <a href="/listings" className="btn-primary !px-8 !py-3 no-underline inline-block">
          Browse Investment Listings
        </a>
      </div>
    );
  }

  const inputCls =
    'block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

  return (
    <div id={id} className="card p-6 scroll-mt-24">
      <h2 className="font-heading font-semibold text-lg text-navy">Get your free Investor Offer Preview</h2>
      <p className="mt-1 mb-5 text-xs text-muted">See what an investor would pay — plus your market valuation. Private, no obligation.</p>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sv-name" className="mb-1 block text-sm font-medium text-navy">Name <span className="text-red-400">*</span></label>
          <input id="sv-name" name="name" type="text" required value={form.name} onChange={handleChange} placeholder="Your full name" className={inputCls} autoComplete="name" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sv-email" className="mb-1 block text-sm font-medium text-navy">Email <span className="text-red-400">*</span></label>
            <input id="sv-email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputCls} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="sv-phone" className="mb-1 block text-sm font-medium text-navy">Phone</label>
            <input id="sv-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="647-XXX-XXXX" className={inputCls} autoComplete="tel" />
          </div>
        </div>
        <div>
          <label htmlFor="sv-address" className="mb-1 block text-sm font-medium text-navy">Property Address <span className="text-red-400">*</span></label>
          <input id="sv-address" name="address" type="text" required value={form.address} onChange={handleChange} placeholder="123 Main Street, Mississauga ON" className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sv-type" className="mb-1 block text-sm font-medium text-navy">Property Type</label>
            <select id="sv-type" name="propertyType" value={form.propertyType} onChange={handleChange} className={inputCls}>
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sv-goal" className="mb-1 block text-sm font-medium text-navy">Your goal</label>
            <select id="sv-goal" name="goal" value={form.goal} onChange={handleChange} className={inputCls}>
              {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="sv-timeline" className="mb-1 block text-sm font-medium text-navy">Timeline to Sell</label>
          <select id="sv-timeline" name="timeline" value={form.timeline} onChange={handleChange} className={inputCls}>
            {SELL_TIMELINES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60">
          {loading ? 'Submitting…' : 'Get My Investor Offer Preview'}
        </button>
        <p className="text-[11px] text-muted text-center">100% free · Confidential · No obligation to list or sell</p>
      </form>
    </div>
  );
}
