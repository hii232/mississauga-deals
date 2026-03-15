'use client';

import { useState, useEffect } from 'react';
import { HOOD_DATA } from '@/lib/constants';

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

    if (!form.email) {
      setError('Email is required.');
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
          source: 'deal-alert',
          notes: `Max Price: ${form.maxPrice || 'Any'}, Min Beds: ${form.minBeds || 'Any'}, Strategy: ${form.strategy || 'Any'}, Neighbourhood: ${form.neighbourhood || 'Any'}`,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit');

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
      setForm({ name: form.name, email: form.email, maxPrice: '', minBeds: '', strategy: '', neighbourhood: '' });
    } catch {
      setError('Something went wrong. Please try again.');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="section-title mb-2">Deal Alerts</h1>
        <p className="section-subtitle">
          Get notified when properties matching your criteria hit the market
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-lg text-navy mb-4">
            Create New Alert
          </h2>

          {success && (
            <div className="mb-4 rounded-lg bg-success/10 border border-success/20 px-4 py-3 text-sm text-success">
              Alert created! You will receive email notifications when matching deals are found.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
            >
              {loading ? 'Creating Alert...' : 'Create Deal Alert'}
            </button>
          </form>
        </div>

        {/* Current Alerts */}
        <div>
          <h2 className="font-heading font-semibold text-lg text-navy mb-4">
            Your Active Alerts
          </h2>

          {savedAlerts.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-3">🔔</div>
              <p className="text-sm text-muted">
                No active alerts yet. Create one to get notified about matching deals.
              </p>
            </div>
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
  );
}
