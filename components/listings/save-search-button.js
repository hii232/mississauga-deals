'use client';

import { useState, useRef, useEffect } from 'react';

export function SaveSearchButton({ filters }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

  // Pre-fill email from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('user_email');
    if (saved) setEmail(saved);
    const savedName = localStorage.getItem('user_name');
    if (savedName) setName(savedName);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Only save serializable filter values (no functions)
      const serializable = {
        search: filters.search || '',
        propertyType: filters.propertyType || 'All',
        activeStrategies: filters.activeStrategies || [],
        priceRange: filters.priceRange || [0, 3000000],
        beds: filters.beds,
        baths: filters.baths,
        minCapRate: filters.minCapRate,
        minCashFlow: filters.minCashFlow,
        minCashOnCash: filters.minCashOnCash,
        minDealScore: filters.minDealScore,
        domRange: filters.domRange || [0, 365],
        neighbourhoods: filters.neighbourhoods || [],
        lrtOnly: filters.lrtOnly || false,
        hasBasementSuite: filters.hasBasementSuite || false,
        isPowerOfSale: filters.isPowerOfSale || false,
        sortKey: filters.sortKey || 'score',
      };

      const res = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          filters: serializable,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setSuccess(true);
      localStorage.setItem('user_email', email.trim().toLowerCase());
      if (name) localStorage.setItem('user_name', name.trim());
      localStorage.setItem('user_registered', 'true');

      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 2500);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Build a human-readable summary of what the search is filtering
  const getSearchSummary = () => {
    const parts = [];
    if (filters.propertyType !== 'All') parts.push(filters.propertyType);
    if (filters.priceRange[1] < 3000000) parts.push(`under $${(filters.priceRange[1] / 1000).toFixed(0)}K`);
    if (filters.beds) parts.push(`${filters.beds}+ beds`);
    if (filters.activeStrategies?.length > 0) parts.push(filters.activeStrategies.join(', '));
    if (filters.neighbourhoods?.length > 0) parts.push(filters.neighbourhoods.slice(0, 2).join(', '));
    return parts.length > 0 ? parts.join(' · ') : 'All listings';
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10 hover:border-accent/50 transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        Save Search
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl z-50 animate-slideDown">
          {success ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-3">
                <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-navy">Search Saved!</p>
              <p className="text-sm text-muted mt-1">You'll get daily alerts for new matches.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-navy text-sm">Save This Search</h3>
                  <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-muted">Get emailed when new listings match:</p>
                <p className="text-xs text-accent font-medium mt-1">{getSearchSummary()}</p>
              </div>

              <div className="p-4 space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full rounded-lg border border-slate-200 bg-cloud px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="Your email address"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-cloud px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                {error && <p className="text-danger text-xs">{error}</p>}
              </div>

              <div className="px-4 pb-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 text-sm transition-all disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Save & Get Alerts'}
                </button>
                <p className="text-xs text-muted text-center mt-2">Daily alerts · Unsubscribe anytime</p>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
