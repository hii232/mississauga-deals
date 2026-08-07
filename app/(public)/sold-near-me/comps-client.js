'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AuthGate } from '@/components/ui/auth-gate';
import { parseFsa, hoodForFsa, filterCompetition } from '@/lib/comps/area-scan';
import { formatPhone, isValidPhone, isFakePhone } from '@/lib/phone';

// ─────────────────────────────────────────────────────────────────────────────
//  The interactive half of /sold-near-me.
//
//  FLOW: postal code + property type -> (VOW gate if anonymous) -> real solds
//  in that FSA from /api/sold-comps + the active competition in the same
//  neighbourhood -> "get the full report on YOUR home" capture (address +
//  phone), which is the lead this whole page exists to earn.
//
//  HONESTY RAILS, same as everywhere else on this site:
//    - Sold data renders ONLY behind the AuthGate (TRREB VOW requires a
//      terms agreement first), and the fetch does not even fire while
//      anonymous - gated data never touches the network for a visitor.
//    - Proximity is the FSA and its neighbourhood, said in those words. No
//      radius claims - the feed suppresses exact coordinates.
//    - The API's broad fallback (usedFilter 'broad_closed') is LABELLED: "no
//      close matches in your area" - city-wide sales are never dressed up as
//      the visitor's street.
//    - Competition renders only when the FSA maps to a known neighbourhood
//      (filterCompetition refuses otherwise), and dom=0 rows sort last.
//    - Phone is required WITH its honest reason: the full report is delivered
//      by call or text. "We" language; nothing automated.
// ─────────────────────────────────────────────────────────────────────────────

const TYPES = ['Detached', 'Semi-Detached', 'Townhouse', 'Condo Townhouse', 'Condo'];

const money = (v) => '$' + Math.round(Number(v) || 0).toLocaleString('en-CA');
const dateLabel = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function CompsClient() {
  const [postal, setPostal] = useState('');
  const [type, setType] = useState('');
  const [scanFsa, setScanFsa] = useState(null); // set on submit - drives everything below
  const [inputError, setInputError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [solds, setSolds] = useState(null);       // { comps, stats, usedFilter }
  const [competition, setCompetition] = useState([]);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    setIsAuthenticated(typeof window !== 'undefined' && localStorage.getItem('user_registered') === 'true');
  }, []);

  const hood = hoodForFsa(scanFsa);

  const runScan = useCallback(async (fsa, t) => {
    setLoading(true);
    setFetchError('');
    setSolds(null);
    setCompetition([]);
    try {
      const params = new URLSearchParams({ postal: fsa, limit: '12' });
      if (t) params.set('type', t);
      const res = await fetch('/api/sold-comps?' + params.toString());
      if (!res.ok) throw new Error('sold-comps ' + res.status);
      setSolds(await res.json());
    } catch {
      setFetchError('We could not load sold records right now. Try again in a minute.');
    }
    // Competition is best-effort and independent - a solds failure should not
    // hide it, and vice versa.
    try {
      const h = hoodForFsa(fsa);
      if (h) {
        const res = await fetch('/api/listings?limit=100&nomedia=1');
        if (res.ok) {
          const data = await res.json();
          setCompetition(filterCompetition(data.listings || [], { hood: h, type: t }));
        }
      }
    } catch { /* competition section simply doesn't render */ }
    setLoading(false);
  }, []);

  // Fetch only when BOTH a scan was requested AND the visitor is registered -
  // the VOW gate stands between anonymous visitors and this data.
  useEffect(() => {
    if (scanFsa && isAuthenticated) runScan(scanFsa, type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanFsa, isAuthenticated]);

  function onSubmit(e) {
    e.preventDefault();
    const fsa = parseFsa(postal);
    if (!fsa) {
      setInputError('Enter a Mississauga postal code, like L5M 7L9 - the first three characters are enough.');
      return;
    }
    setInputError('');
    setScanFsa(fsa);
  }

  const stats = solds?.stats;
  const isBroad = solds && solds.usedFilter === 'broad_closed';

  return (
    <div>
      {/* ── Step 1: the scan input ── */}
      <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="snm-postal" className="block text-sm font-semibold text-navy mb-1.5">
          Your postal code
        </label>
        <div className="flex gap-2">
          <input
            id="snm-postal"
            type="text"
            inputMode="text"
            autoComplete="postal-code"
            value={postal}
            onChange={(e) => setPostal(e.target.value)}
            placeholder="L5M 7L9"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <button type="submit" className="btn-primary !px-5 whitespace-nowrap">
            Scan my area
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Property type">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(type === t ? '' : t)}
              aria-pressed={type === t}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                type === t
                  ? 'border-accent bg-accent text-white'
                  : 'border-slate-200 bg-cloud text-navy hover:border-accent/40'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {inputError && <p className="mt-2 text-xs text-red-600">{inputError}</p>}
        <p className="mt-2 text-[11px] text-muted">
          We match by postal district ({'"'}FSA{'"'}) and neighbourhood - the honest resolution of
          MLS data. No account needed to scan; sold prices unlock free below.
        </p>
      </form>

      {/* ── Step 2: gated results ── */}
      {scanFsa && (
        <div className="mt-6">
          <AuthGate
            isAuthenticated={isAuthenticated}
            title={`See what actually sold near ${scanFsa}`}
            valueLine="Real close prices, dates and days-on-market from TRREB sold records - free with a registered email. One unlock covers the whole site."
            source="home-comps"
            onUnlock={() => setIsAuthenticated(true)}
          >
            {loading && (
              <div className="py-10 text-center text-sm text-muted">Scanning {scanFsa}{hood ? ` · ${hood}` : ''}…</div>
            )}
            {fetchError && !loading && (
              <div className="py-6 text-center text-sm text-red-600">{fetchError}</div>
            )}

            {solds && !loading && (
              <>
                {/* Area summary - only figures the API actually returned */}
                <div className="mb-1 flex items-baseline justify-between gap-2 flex-wrap">
                  <h2 className="font-heading text-lg font-bold text-navy">
                    {isBroad ? 'Recent Mississauga sales' : `Sold near ${scanFsa}${hood ? ` · ${hood}` : ''}`}
                  </h2>
                  {!isBroad && stats?.windowDays && (
                    <span className="text-[11px] text-muted">last {stats.windowDays} days{type ? ` · ${type}` : ''}</span>
                  )}
                </div>
                {isBroad && (
                  <p className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    No sold records matched {scanFsa}{type ? ` (${type})` : ''} closely enough, so these are
                    the most recent Mississauga sales instead - wider than your area. The full report below
                    goes deeper on your street specifically.
                  </p>
                )}
                {!isBroad && stats?.count > 0 && (
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-cloud border border-slate-200 px-3 py-2 text-center">
                      <div className="font-heading text-base font-bold text-navy">{money(stats.avgSoldPrice)}</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted">avg sold</div>
                    </div>
                    <div className="rounded-lg bg-cloud border border-slate-200 px-3 py-2 text-center">
                      <div className="font-heading text-base font-bold text-navy">{stats.avgDOM}</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted">avg days</div>
                    </div>
                    <div className="rounded-lg bg-cloud border border-slate-200 px-3 py-2 text-center">
                      <div className="font-heading text-base font-bold text-navy">
                        {stats.avgNegotiationGap > 0 ? '+' : ''}{stats.avgNegotiationGap}%
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-muted">vs asking</div>
                    </div>
                  </div>
                )}

                {/* Sold records */}
                {(solds.comps || []).length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">
                    No sold records came back for this area. The full report below is hand-pulled, so it can go where the automatic scan cannot.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                    {solds.comps.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-navy">{c.address}</p>
                          <p className="text-[11px] text-muted">
                            {[c.subType || c.type, c.beds ? `${c.beds} bd` : '', c.baths ? `${c.baths} ba` : '', dateLabel(c.closeDate)]
                              .filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-navy">{c.closePrice > 0 ? money(c.closePrice) : '-'}</p>
                          {c.closePrice > 0 && c.listPrice > 0 && c.priceDelta !== 0 && (
                            <p className={`text-[11px] font-semibold ${c.priceDelta > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                              {c.priceDelta > 0 ? '+' : ''}{c.priceDelta}% vs ask
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* The competition - only when the FSA maps to a real hood */}
                {competition.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-heading text-base font-bold text-navy mb-1">
                      Your competition in {hood} right now
                    </h3>
                    <p className="text-xs text-muted mb-3">
                      Active listings a buyer would compare against yours - freshest first.
                    </p>
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                      {competition.map((l) => (
                        <li key={l.id}>
                          <Link href={`/listings/${l.id}`} className="flex items-center justify-between gap-3 px-4 py-3 no-underline hover:bg-cloud">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-navy">{l.address}</p>
                              <p className="text-[11px] text-muted">
                                {[l.type, l.beds ? `${l.beds} bd` : '', Number(l.dom) >= 1 ? `${l.dom} days on market` : ''].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-bold text-navy">{money(l.price)}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mt-4 text-[11px] leading-relaxed text-muted">
                  Sold data from TRREB records, deemed reliable but not guaranteed. Matched by postal
                  district and property type - not an appraisal or an opinion of your home&apos;s value.
                </p>

                {/* ── Step 3: the full-report capture ── */}
                <FullReportForm fsa={scanFsa} hood={hood} type={type} />
              </>
            )}
          </AuthGate>
        </div>
      )}
    </div>
  );
}

function FullReportForm({ fsa, hood, type }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('user_email') : '';
    if (email) setForm((f) => ({ ...f, email }));
  }, []);

  function onChange(e) {
    const v = e.target.name === 'phone' ? formatPhone(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: v });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.address.trim()) { setError('Enter your home address - the report is about your specific home.'); return; }
    if (!form.name.trim() || !form.email.trim()) { setError('Please add your name and email.'); return; }
    if (!form.phone) { setError("Please enter a phone number - it's how we deliver your report."); return; }
    if (!isValidPhone(form.phone)) { setError('Please enter a valid phone number (e.g. 647-361-1234).'); return; }
    if (isFakePhone(form.phone)) { setError('Please enter a real phone number we can reach you at.'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone,
          source: 'home-comps',
          notes: `Full comparables report requested for: ${form.address.trim()} | scanned area ${fsa}${hood ? ` (${hood})` : ''}${type ? ` | type ${type}` : ''}`,
        }),
      });
      if (!res.ok) throw new Error('lead ' + res.status);
      setDone(true);
    } catch {
      setError('That did not go through - please try again, or call 647-609-1289.');
    }
    setSending(false);
  }

  if (done) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-heading text-base font-bold text-navy mb-1">Got it - your report is in the queue.</p>
        <p className="text-sm text-navy/70">
          We&apos;ll pull the comparables for your specific home and call or text you with the full
          picture - usually within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-white p-5 md:p-6">
      <h3 className="font-heading text-lg font-bold text-navy">Get the full report on your home</h3>
      <p className="mt-1 text-xs text-navy/70 leading-relaxed">
        The scan above matches by area. Your home isn&apos;t an average - we&apos;ll pull the sales that
        actually compare to <em>your</em> place (same street where possible, same style, same
        finishes matter) and walk you through it by call or text. Free, no obligation.
      </p>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="address" value={form.address} onChange={onChange} placeholder="Your home address" autoComplete="street-address"
          className="sm:col-span-2 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none" />
        <input name="name" value={form.name} onChange={onChange} placeholder="Name" autoComplete="name"
          className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none" />
        <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Email" autoComplete="email"
          className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none" />
        <input name="phone" type="tel" value={form.phone} onChange={onChange} placeholder="Phone (how we deliver the report)" autoComplete="tel"
          className="sm:col-span-2 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none" />
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={sending} className="btn-primary mt-4 w-full sm:w-auto !px-6 disabled:opacity-60">
        {sending ? 'Sending…' : 'Get my free report'}
      </button>
      <p className="mt-2 text-[11px] text-muted">
        No spam, no robo-calls - a real comparables report, delivered personally. Not an appraisal.
      </p>
    </form>
  );
}
