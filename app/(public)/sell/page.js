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

const SELL_TIMELINES = [
  { value: '', label: 'Select timeline' },
  { value: 'asap', label: 'As soon as possible' },
  { value: '1-3mo', label: '1-3 months' },
  { value: '3-6mo', label: '3-6 months' },
  { value: '6-12mo', label: '6-12 months' },
  { value: 'exploring', label: 'Just exploring' },
];

export default function SellPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    propertyType: '',
    estimatedValue: '',
    timeline: '',
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
    setSuccess(false);

    if (!form.name || !form.email || !form.address) {
      setError('Name, email, and property address are required.');
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
          source: 'seller-valuation',
          notes: `Address: ${form.address}, Type: ${form.propertyType || 'Not specified'}, Est. Value: ${form.estimatedValue || 'Not specified'}, Timeline: ${form.timeline || 'Not specified'}`,
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">🏡</div>
          <h1 className="font-heading font-bold text-2xl text-navy mb-3">
            Valuation Request Received!
          </h1>
          <p className="text-sm text-muted leading-relaxed max-w-md mx-auto mb-6">
            Hamza will prepare a complimentary comparative market analysis for your property. Expect a personalized report within 24-48 hours.
          </p>
          <a href="/listings" className="btn-primary !px-8 !py-3 no-underline">
            Browse Investment Listings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left side - Info */}
        <div>
          <h1 className="section-title mb-3">What&apos;s Your Property Worth?</h1>
          <p className="section-subtitle mb-8">
            Get a free, no-obligation comparative market analysis from a Mississauga investment specialist
          </p>

          <div className="space-y-5 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy">Comparable Sales Analysis</h3>
                <p className="text-xs text-muted">Review of recent sales of similar properties in your neighbourhood.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy">Market Positioning</h3>
                <p className="text-xs text-muted">Strategic pricing recommendation to maximize your return.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy">Investor Network</h3>
                <p className="text-xs text-muted">Access to our network of pre-qualified investors looking to buy in Mississauga.</p>
              </div>
            </div>
          </div>

          <div className="card bg-cloud p-5">
            <p className="text-xs text-muted leading-relaxed">
              As an investment-focused realtor, Hamza understands what investors look for — and positions your property to attract serious, pre-qualified buyers who move quickly and close reliably.
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-lg text-navy mb-5">
            Request Your Free Valuation
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-navy">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-navy">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="647-XXX-XXXX"
                  className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="mb-1 block text-sm font-medium text-navy">
                Property Address <span className="text-red-400">*</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                value={form.address}
                onChange={handleChange}
                placeholder="123 Main Street, Mississauga ON"
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="propertyType" className="mb-1 block text-sm font-medium text-navy">
                  Property Type
                </label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={form.propertyType}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="estimatedValue" className="mb-1 block text-sm font-medium text-navy">
                  Estimated Value
                </label>
                <input
                  id="estimatedValue"
                  name="estimatedValue"
                  type="text"
                  value={form.estimatedValue}
                  onChange={handleChange}
                  placeholder="e.g. $850,000"
                  className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="timeline" className="mb-1 block text-sm font-medium text-navy">
                Timeline to Sell
              </label>
              <select
                id="timeline"
                name="timeline"
                value={form.timeline}
                onChange={handleChange}
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {SELL_TIMELINES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
            >
              {loading ? 'Submitting...' : 'Get Free Valuation'}
            </button>

            <p className="text-[11px] text-muted text-center">
              100% free. No obligation. Your information is kept confidential.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
