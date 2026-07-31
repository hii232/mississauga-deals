'use client';
import { trackConversion } from '@/lib/track-conversion';

import { useState, useEffect } from 'react';
import { HOOD_DATA } from '@/lib/constants';
import { PageHero } from '@/components/layout/page-hero';

// ─────────────────────────────────────────────
//   SAMPLE ALERT PREVIEW — shown in the right
//   column before a visitor creates their first
//   alert. Shows the product before asking for
//   the email — a proven conversion pattern.
//   Clearly labelled "Example"; numbers are
//   illustrative and not market-current.
// ─────────────────────────────────────────────
function SampleAlertPreview() {
  return (
    <div className="space-y-5">
      {/* Section eyebrow */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
        What arrives in your inbox
      </p>

      {/* Sample deal card — dashed border signals "preview / not yet real" */}
      <div className="relative rounded-xl border border-dashed border-slate-300 bg-white p-5 shadow-sm">
        {/* "Example" badge — top-right, always visible */}
        <span className="absolute right-3 top-3 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
          Example
        </span>

        {/* Strategy chip + deal score */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
            <span aria-hidden="true">●</span> Cash-Flow+
          </span>
          <span className="inline-flex items-center rounded-full bg-navy px-2.5 py-0.5 text-[11px] font-bold text-white">
            7.8 / 10
          </span>
        </div>

        {/* Property info */}
        <p className="font-heading text-sm font-bold text-navy leading-snug">
          12 Lakeview Ave, Port Credit
        </p>
        <p className="mt-0.5 text-xs text-muted">3-bed · 2-bath · Detached · $879,000</p>

        {/* Key metrics — 3 tiles in a row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Cap Rate',   value: '4.8%',      cls: 'text-success' },
            { label: 'Cash Flow',  value: '+$340/mo',   cls: 'text-success' },
            { label: 'CoC Return', value: '6.2%',      cls: 'text-navy' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="rounded-lg bg-slate-50 px-1 py-2.5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted leading-none">{label}</p>
              <p className={`mt-1 text-sm font-bold tabular-nums ${cls}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Rent assumption — mirrors the real alert email's disclosure line */}
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          Assumes $3,100/mo rent · 20% down · 5.4% rate
        </p>
      </div>

      {/* Three-bullet value proposition */}
      <ul className="space-y-2.5">
        {[
          'Matched to your criteria — not every new listing',
          'Full cap rate, cash flow and deal score included',
          'Only sent when a real match exists — no daily noise',
        ].map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-snug text-slate-600">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const STRATEGIES = [
  { value: '', label: 'Any strategy' },
  { value: 'cashflow', label: 'Cash Flow' },
  { value: 'appreciation', label: 'Appreciation' },
  { value: 'brrr', label: 'BRRR' },
  { value: 'precon', label: 'Pre-Construction' },
];

const HOODS = Object.keys(HOOD_DATA);

export default function AlertsPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    maxPrice: '',
    minBeds: '',
    strategy: '',
    neighbourhood: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [savedAlerts, setSavedAlerts] = useState([]);

  useEffect(() => {
    const alerts = JSON.parse(localStorage.getItem('deal_alerts') || '[]');
    setSavedAlerts(alerts);
    // Pre-fill from user profile
    const name = localStorage.getItem('user_name') || '';
    const email = localStorage.getItem('user_email') || '';
    if (name || email) {
      setForm((f) => ({ ...f, name: name || f.name, email: email || f.email }));
    }
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      // Create the actual saved search — this is what the daily alert cron
      // matches against. (Previously the form only logged a lead + wrote to
      // localStorage, so the promised alerts could never fire.) Filters go in
      // the canonical client format the cron's applyFilters consumes;
      // 'cashflow'/'brrr' map to their strategy chips, other strategies have
      // no listing-level filter and simply don't constrain matches.
      const strategyMap = { cashflow: 'cf', brrr: 'brrr' };
      const res = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          filters: {
            ...(form.maxPrice ? { priceRange: [0, Number(form.maxPrice)] } : {}),
            ...(form.minBeds ? { beds: Number(form.minBeds) } : {}),
            ...(form.neighbourhood ? { neighbourhoods: [form.neighbourhood] } : {}),
            ...(strategyMap[form.strategy] ? { activeStrategies: [strategyMap[form.strategy]] } : {}),
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to submit');
      }

      // Lead capture with the human-readable criteria — fire-and-forget (the
      // subscribe route also captures a lead; /api/lead dedupes by email).
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          source: 'deal-alert',
          notes: `Max Price: ${form.maxPrice || 'Any'}, Min Beds: ${form.minBeds || 'Any'}, Strategy: ${form.strategy || 'Any'}, Neighbourhood: ${form.neighbourhood || 'Any'}`,
        }),
      }).catch(() => {});

      // Save alert locally
      const alert = {
        ...form,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('deal_alerts') || '[]');
      const updated = [...existing, alert];
      localStorage.setItem('deal_alerts', JSON.stringify(updated));
      setSavedAlerts(updated);

      setSuccess(true);
      trackConversion('alert_create', { source: 'alerts-page' });
      setForm({ name: form.name, email: form.email, maxPrice: '', minBeds: '', strategy: '', neighbourhood: '' });
    } catch (err) {
      setError(err?.message && err.message !== 'Failed to submit' ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteAlert(id) {
    const updated = savedAlerts.filter((a) => a.id !== id);
    localStorage.setItem('deal_alerts', JSON.stringify(updated));
    setSavedAlerts(updated);
  }

  return (
    <>
      <PageHero
        eyebrow="Never miss a deal"
        title="Free Mississauga Deal Alerts"
        subtitle="Get notified the moment a property matching your criteria hits the market — scored and analyzed, straight to your inbox."
        align="center"
        compact
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-lg text-navy mb-4">
            Create New Alert
          </h2>

          {success && (
            <div role="status" className="mb-4 rounded-lg bg-success/10 border border-success/20 px-4 py-3 text-sm text-success">
              Alert created! You will receive email notifications when matching deals are found.
            </div>
          )}

          {error && (
            <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Email-first: only the one REQUIRED field is visible up front.
              Everything else was already optional (name, and four selects that
              default to "Any"), but presenting six fields to someone who just
              tapped "Get Free Deal Alerts" reads as work. The rest sit one tap
              away in a native <details> — no step-2 state machine, so the form
              still submits in a single POST and a lead can never be stranded
              half-way through. Open it and nothing is lost; ignore it and the
              alert is created for all deals. */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">
                Email <span className="text-red-600" aria-hidden="true">*</span>
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

            <details className="group rounded-lg border border-slate-200 bg-slate-50/60">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-medium text-navy">
                <span>Narrow which deals you get <span className="font-normal text-muted">(optional)</span></span>
                <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">&#9662;</span>
              </summary>
              <div className="space-y-4 border-t border-slate-200 p-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-navy">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxPrice" className="mb-1 block text-sm font-medium text-navy">
                  Max Price
                </label>
                <select
                  id="maxPrice"
                  name="maxPrice"
                  value={form.maxPrice}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Any price</option>
                  <option value="500000">Under $500K</option>
                  <option value="750000">Under $750K</option>
                  <option value="1000000">Under $1M</option>
                  <option value="1250000">Under $1.25M</option>
                  <option value="1500000">Under $1.5M</option>
                  <option value="2000000">Under $2M</option>
                </select>
              </div>
              <div>
                <label htmlFor="minBeds" className="mb-1 block text-sm font-medium text-navy">
                  Min Bedrooms
                </label>
                <select
                  id="minBeds"
                  name="minBeds"
                  value={form.minBeds}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="strategy" className="mb-1 block text-sm font-medium text-navy">
                  Strategy
                </label>
                <select
                  id="strategy"
                  name="strategy"
                  value={form.strategy}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {STRATEGIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="neighbourhood" className="mb-1 block text-sm font-medium text-navy">
                  Neighbourhood
                </label>
                <select
                  id="neighbourhood"
                  name="neighbourhood"
                  value={form.neighbourhood}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Any neighbourhood</option>
                  {HOODS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
              </div>
            </details>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
            >
              {loading ? 'Creating Alert...' : 'Create Deal Alert'}
            </button>

            {/* Trust signals — expectation-setting next to the capture button */}
            <div className="flex items-start gap-2 pt-1">
              <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <p className="text-xs text-muted leading-relaxed">
                You'll get an email only when a listing matches your criteria — scored and analyzed, no spam.
                Free forever, unsubscribe in one click, and your email is never shared.
              </p>
            </div>
          </form>
        </div>

        {/* Right column — sample preview before first alert is saved;
            real alert list once one exists. */}
        <div>
          <h2 className="font-heading font-semibold text-lg text-navy mb-4">
            {savedAlerts.length === 0 ? "Here's what you'll get" : 'Your Active Alerts'}
          </h2>

          {savedAlerts.length === 0 ? (
            <SampleAlertPreview />
          ) : (
            <div className="space-y-3">
              {savedAlerts.map((alert) => (
                <div key={alert.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-2">
                        {alert.maxPrice && (
                          <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                            Max {alert.maxPrice >= 1000000 ? `$${(alert.maxPrice / 1000000).toFixed(1)}M` : `$${(alert.maxPrice / 1000).toFixed(0)}K`}
                          </span>
                        )}
                        {alert.minBeds && (
                          <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success">
                            {alert.minBeds}+ beds
                          </span>
                        )}
                        {alert.strategy && (
                          <span className="inline-flex items-center rounded-full bg-gold/10 px-2.5 py-0.5 text-[11px] font-medium text-gold-dark">
                            {STRATEGIES.find((s) => s.value === alert.strategy)?.label || alert.strategy}
                          </span>
                        )}
                        {alert.neighbourhood && (
                          <span className="inline-flex items-center rounded-full bg-navy/10 px-2.5 py-0.5 text-[11px] font-medium text-navy">
                            {alert.neighbourhood}
                          </span>
                        )}
                        {!alert.maxPrice && !alert.minBeds && !alert.strategy && !alert.neighbourhood && (
                          <span className="text-xs text-muted">All deals</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted">
                        Created {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-xs text-muted hover:text-red-500 transition-colors ml-4"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
