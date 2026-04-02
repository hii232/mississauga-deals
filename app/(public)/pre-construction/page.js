'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HOOD_DATA } from '@/lib/constants';

const BUDGETS = [
  { value: '', label: 'Select budget range' },
  { value: 'under-500k', label: 'Under $500K' },
  { value: '500k-750k', label: '$500K - $750K' },
  { value: '750k-1m', label: '$750K - $1M' },
  { value: '1m-plus', label: '$1M+' },
];

const TIMELINES = [
  { value: '', label: 'Select timeline' },
  { value: '1-6mo', label: '1-6 months' },
  { value: '6-12mo', label: '6-12 months' },
  { value: '1-2yr', label: '1-2 years' },
];

const HOODS = Object.keys(HOOD_DATA);

export default function PreConstructionPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    budget: '',
    area: '',
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

    if (!form.name || !form.email) {
      setError('Name and email are required.');
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
          source: 'precon-vip',
          notes: `Budget: ${form.budget || 'Not specified'}, Area: ${form.area || 'Not specified'}, Timeline: ${form.timeline || 'Not specified'}`,
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
          <div className="text-5xl mb-4">🏙️</div>
          <h1 className="font-heading font-bold text-2xl text-navy mb-3">
            You are on the VIP list!
          </h1>
          <p className="text-sm text-muted leading-relaxed max-w-md mx-auto mb-6">
            Hamza will personally send you pre-construction floor plans, pricing worksheets, and VIP incentives before they go public. Expect to hear from us within 24 hours.
          </p>
          <a href="/listings" className="btn-primary !px-8 !py-3 no-underline">
            Browse Current Listings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* HST Rebate Highlight */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-amber-500/15 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🔥</span>
          </div>
          <div className="flex-1">
            <h2 className="font-heading font-bold text-lg text-navy mb-1">
              Save Up to $130,000 — Ontario HST Rebate Now Active
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Get VIP access to pre-construction projects <strong>plus save up to $130,000 in HST</strong> on new builds.
              APS must be signed between April 1, 2026 and March 31, 2027. This changes the investment math entirely.
            </p>
          </div>
          <Link
            href="/pre-construction/hst-rebate"
            className="flex-shrink-0 btn-primary !px-5 !py-2.5 no-underline text-sm"
          >
            Full HST Breakdown
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left side - Info */}
        <div>
          <h1 className="section-title mb-3">Pre-Construction VIP Access</h1>
          <p className="section-subtitle mb-8">
            Get exclusive first access to new developments in Mississauga + save up to $130K in HST
          </p>

          <div className="space-y-5 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy">First Access Pricing</h3>
                <p className="text-xs text-muted">Get VIP pricing before public launch — often 5-10% below retail.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy">Floor Plans + Worksheets</h3>
                <p className="text-xs text-muted">Receive detailed floor plans and investment analysis worksheets.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy">Best Unit Selection</h3>
                <p className="text-xs text-muted">Priority access means picking the best floors, views, and layouts.</p>
              </div>
            </div>
          </div>

          <div className="card bg-cloud p-5">
            <p className="text-xs text-muted leading-relaxed">
              Pre-construction investing allows you to lock in today&apos;s pricing for a property delivered in 2-4 years. With only 15-20% down spread over the build period, it is a capital-efficient way to build your portfolio.
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-lg text-navy mb-5">
            Join the VIP List
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

            <div>
              <label htmlFor="budget" className="mb-1 block text-sm font-medium text-navy">
                Budget Range
              </label>
              <select
                id="budget"
                name="budget"
                value={form.budget}
                onChange={handleChange}
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {BUDGETS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="area" className="mb-1 block text-sm font-medium text-navy">
                Preferred Area
              </label>
              <select
                id="area"
                name="area"
                value={form.area}
                onChange={handleChange}
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Any area</option>
                {HOODS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="timeline" className="mb-1 block text-sm font-medium text-navy">
                Timeline
              </label>
              <select
                id="timeline"
                name="timeline"
                value={form.timeline}
                onChange={handleChange}
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {TIMELINES.map((t) => (
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
              {loading ? 'Submitting...' : 'Get VIP Access'}
            </button>

            <p className="text-[11px] text-muted text-center">
              No obligation. We respect your privacy — unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
