// MississaugaInvestor.ca — App.js v14
// - Dark investor design (navy theme)
// - Real property photos via Unsplash
// - Deal of the Week hero section
// - Horizontal filter bar (keep from v13)
// - Browse freely, signup gate at 10 views
// UPLOAD: drag-drop to GitHub src/App.js

import React, { useState, useCallback, useMemo } from 'react';

// ── COLORS (dark investor theme) ──
const C = {
  blue: '#3B82F6', blueDark: '#2563EB', blueLight: '#1E3A5F',
  gold: '#F59E0B', goldLight: '#FEF3C7',
  navy: '#05091A', surface: '#0C1429', card: '#0F1E35',
  cardHover: '#152540', border: '#1E2E45', borderLight: '#243552',
  text: '#F1F5F9', textSec: '#94A3B8', muted: '#4B6180',
  green: '#10B981', greenDark: '#059669', greenBg: '#022C22',
  red: '#EF4444', redBg: '#2D1015',
  amber: '#F59E0B', amberBg: '#2D1F00',
  white: '#FFFFFF',
};

// ── CANADIAN MORTGAGE CALC (semi-annual compounding) ──
function calcMetrics({ price, rent, dpPct = 0.20, rate = 0.0599, years = 25, taxRate = 0.0072, ins = 175, maintPct = 0.05, vacRate = 0.03, mgmtPct = 0 }) {
  if (!price || !rent) return null;
  const dp = price * dpPct;
  const loan = price - dp;
  const closing = price * 0.015;
  const cashIn = dp + closing;
  const effAnn = Math.pow(1 + rate / 2, 2) - 1;
  const mr = Math.pow(1 + effAnn, 1 / 12) - 1;
  const n = years * 12;
  const mtg = loan * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
  const gross = rent;
  const vac = gross * vacRate;
  const eff = gross - vac;
  const tax = (price * taxRate) / 12;
  const maint = gross * maintPct;
  const mgmt = gross * mgmtPct;
  const opex = tax + ins + maint + mgmt;
  const noi = eff - opex;
  const cf = noi - mtg;
  const capRate = ((noi * 12) / price) * 100;
  const coc = ((cf * 12) / cashIn) * 100;
  const grm = price / (gross * 12);
  return {
    dp: Math.round(dp), loan: Math.round(loan), cashIn: Math.round(cashIn), closing: Math.round(closing),
    mtg: Math.round(mtg), gross: Math.round(gross), vac: Math.round(vac), eff: Math.round(eff),
    tax: Math.round(tax), ins: Math.round(ins), maint: Math.round(maint), mgmt: Math.round(mgmt),
    opex: Math.round(opex), totalExp: Math.round(opex + mtg),
    noi: Math.round(noi), anoiYear: Math.round(noi * 12),
    cf: Math.round(cf), cfYear: Math.round(cf * 12),
    capRate: parseFloat(capRate.toFixed(2)),
    coc: parseFloat(coc.toFixed(2)),
    grm: parseFloat(grm.toFixed(1)),
  };
}

function score(m) {
  if (!m) return { s: 0, g: 'N/A' };
  let v = 5;
  if (m.capRate >= 6) v += 2.5; else if (m.capRate >= 4.5) v += 1.5; else if (m.capRate >= 3) v += 0.5; else if (m.capRate < 2) v -= 1.5;
  if (m.cf >= 500) v += 1.5; else if (m.cf >= 200) v += 0.75; else if (m.cf >= 0) v += 0.25; else if (m.cf < -300) v -= 1;
  if (m.coc >= 8) v += 1; else if (m.coc >= 5) v += 0.5; else if (m.coc < 0) v -= 0.5;
  if (m.grm <= 15) v += 0.5; else if (m.grm >= 25) v -= 0.5;
  const s = parseFloat(Math.min(10, Math.max(0, v)).toFixed(1));
  const g = s >= 8.5 ? 'A+' : s >= 7.5 ? 'A' : s >= 6.5 ? 'B+' : s >= 5.5 ? 'B' : s >= 4.5 ? 'C+' : s >= 3.5 ? 'C' : 'D';
  return { s, g };
}

// ── LISTINGS DATA with real Unsplash photos ──
const RAW = [
  {
    id: 'L001', dealOfWeek: true, hamzasPick: true,
    address: '147 Lakeshore Rd E', neighbourhood: 'Port Credit', price: 1125000, originalPrice: 1175000,
    beds: 4, baths: 3, sqft: 1950, type: 'Semi-Detached', yearBuilt: 1998, dom: 12, rent: 4200,
    brokerage: 'Royal LePage Signature Realty',
    notes: 'Corner lot with separate entrance to basement suite. Walking distance to Port Credit GO. Strong rental demand in this pocket.',
    photos: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
    ],
  },
  {
    id: 'L002',
    address: '3290 Battleford Rd #42', neighbourhood: 'Clarkson', price: 689000, originalPrice: 689000,
    beds: 3, baths: 2, sqft: 1420, type: 'Townhouse', yearBuilt: 2008, dom: 5, rent: 3100,
    brokerage: 'Royal LePage Signature Realty',
    notes: '5min to Clarkson GO. Well-maintained end unit. Basement rough-in ready.',
    photos: [
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    ],
  },
  {
    id: 'L003',
    address: '5985 Creditview Rd', neighbourhood: 'Hurontario', price: 875000, originalPrice: 920000,
    beds: 4, baths: 3, sqft: 1780, type: 'Detached', yearBuilt: 2001, dom: 22, rent: 3800,
    brokerage: 'Royal LePage Signature Realty',
    notes: 'Finished basement suite currently rented. Near future Hazel McCallion LRT stop.',
    photos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    ],
  },
  {
    id: 'L004',
    address: '2150 Burnhamthorpe Rd W #808', neighbourhood: 'Erin Mills', price: 549000, originalPrice: 549000,
    beds: 2, baths: 2, sqft: 890, type: 'Condo', yearBuilt: 2016, dom: 3, rent: 2400,
    brokerage: 'Royal LePage Signature Realty',
    notes: 'High-floor corner unit with unobstructed views. Low condo fees for size.',
    photos: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    ],
  },
  {
    id: 'L005',
    address: '1441 Dunwin Dr', neighbourhood: 'Cooksville', price: 1345000, originalPrice: 1399000,
    beds: 5, baths: 4, sqft: 2600, type: 'Detached', yearBuilt: 1989, dom: 34, rent: 5200,
    brokerage: 'Royal LePage Signature Realty',
    notes: 'Full duplex conversion done. Both units rented. Near Trillium Hospital.',
    photos: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&q=80',
    ],
  },
  {
    id: 'L006',
    address: '460 Meadowbrook Dr', neighbourhood: 'Meadowvale', price: 798000, originalPrice: 798000,
    beds: 3, baths: 2, sqft: 1540, type: 'Semi-Detached', yearBuilt: 1995, dom: 8, rent: 3300,
    brokerage: 'Royal LePage Signature Realty',
    notes: 'Side entrance basement. Top school catchment. Large pie-shaped lot.',
    photos: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80',
    ],
  },
  {
    id: 'L007',
    address: '225 Webb Dr #1205', neighbourhood: 'City Centre', price: 499000, originalPrice: 519000,
    beds: 1, baths: 1, sqft: 640, type: 'Condo', yearBuilt: 2011, dom: 19, rent: 2100,
    brokerage: 'Royal LePage Signature Realty',
    notes: 'Steps to Square One. High-demand rental location. Investor-ready.',
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    ],
  },
  {
    id: 'L008',
    address: '1033 Andersons Lane', neighbourhood: 'Lakeview', price: 1050000, originalPrice: 1099000,
    beds: 3, baths: 2, sqft: 1320, type: 'Detached', yearBuilt: 1962, dom: 41, rent: 3800,
    brokerage: 'Royal LePage Signature Realty',
    notes: 'Lakeview Village redevelopment zone. Long-term land value play. Tear-down potential.',
    photos: [
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
      'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&q=80',
    ],
  },
];

const LISTINGS = RAW.map(l => {
  const m = calcMetrics({ price: l.price, rent: l.rent });
  const { s, g } = score(m);
  return { ...l, ...m, dealScore: s, dealGrade: g, priceDrop: l.originalPrice > l.price ? Math.round(((l.originalPrice - l.price) / l.originalPrice) * 100) : 0 };
});

// ── FORMATTERS ──
const f$ = n => '$' + Math.abs(Math.round(n || 0)).toLocaleString();
const fCF = n => n == null ? '--' : (n >= 0 ? '+$' : '-$') + Math.abs(Math.round(n)).toLocaleString();
const fPct = n => (n >= 0 ? '' : '') + n.toFixed(2) + '%';

// ── SIGNUP MODAL ──
function SignupModal({ onSuccess, trigger }) {
  const [fm, setFm] = useState({ firstName: '', lastName: '', email: '', phone: '', hasRealtor: '' });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!fm.firstName.trim()) e.firstName = 'Required';
    if (!fm.lastName.trim()) e.lastName = 'Required';
    if (!fm.email.includes('@')) e.email = 'Enter a valid email';
    if (!fm.phone.replace(/\D/g, '').match(/^\d{10}$/)) e.phone = 'Valid 10-digit number required';
    if (!fm.hasRealtor) e.hasRealtor = 'Please select one';
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErr(e); return; }
    setLoading(true);
    await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fm, trigger, source: 'signup_gate', timestamp: new Date().toISOString() }) }).catch(() => {});
    onSuccess({ email: fm.email, name: `${fm.firstName} ${fm.lastName}`, hasRealtor: fm.hasRealtor });
    setLoading(false);
  };

  const inp = (label, key, type = 'text', ph = '') => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#CBD5E1', marginBottom: 5, letterSpacing: '0.03em' }}>{label}</label>
      <input type={type} placeholder={ph} value={fm[key]}
        onChange={e => { setFm(p => ({ ...p, [key]: e.target.value })); setErr(p => ({ ...p, [key]: '' })); }}
        style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: `1.5px solid ${err[key] ? C.red : C.border}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: C.text, background: C.surface }}
      />
      {err[key] && <div style={{ color: C.red, fontSize: 11, marginTop: 3 }}>{err[key]}</div>}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 460, padding: 36, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-block', background: C.blueLight, color: C.blue, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 12, border: `1px solid ${C.blue}44`, letterSpacing: '0.06em' }}>FREE ACCESS</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: C.text, marginBottom: 8, lineHeight: 1.3 }}>Unlock Full Investment Analysis</div>
          <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>Cash flow, cap rate & ROI on every Mississauga listing. Free, no credit card.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div>{inp('First Name', 'firstName', 'text', 'John')}</div>
          <div>{inp('Last Name', 'lastName', 'text', 'Smith')}</div>
        </div>
        {inp('Email Address', 'email', 'email', 'john@email.com')}
        {inp('Phone Number', 'phone', 'tel', '416-555-0123')}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#CBD5E1', marginBottom: 8, letterSpacing: '0.03em' }}>ARE YOU WORKING WITH A REALTOR?</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['Yes', 'No'].map(opt => (
              <button key={opt} onClick={() => { setFm(p => ({ ...p, hasRealtor: opt })); setErr(p => ({ ...p, hasRealtor: '' })); }}
                style={{ padding: '11px', fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: `2px solid ${fm.hasRealtor === opt ? C.blue : C.border}`, background: fm.hasRealtor === opt ? C.blueLight : C.surface, color: fm.hasRealtor === opt ? C.blue : C.textSec, transition: 'all 0.12s' }}>
                {opt}
              </button>
            ))}
          </div>
          {err.hasRealtor && <div style={{ color: C.red, fontSize: 11, marginTop: 4 }}>{err.hasRealtor}</div>}
        </div>

        <button onClick={submit} disabled={loading}
          style={{ width: '100%', padding: 14, background: loading ? C.muted : C.blue, border: 'none', borderRadius: 10, color: C.white, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 14 }}>
          {loading ? 'Creating your account...' : 'Get Free Access →'}
        </button>
        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.6 }}>
          By signing up you agree to receive property alerts from Hamza Nouman, Royal LePage Signature Realty. Unsubscribe anytime.
        </div>
      </div>
    </div>
  );
}

// ── DEAL MODAL ──
function DealModal({ listing, onClose }) {
  const [photo, setPhoto] = useState(0);
  const [a, setA] = useState({ dpPct: 0.20, rate: 0.0599, years: 25, vacRate: 0.03, maintPct: 0.05, mgmtPct: 0, rent: listing.rent });
  const m = useMemo(() => calcMetrics({ price: listing.price, ...a }), [listing.price, a]);
  const { s, g } = useMemo(() => score(m), [m]);
  const upd = (k, v) => setA(p => ({ ...p, [k]: v }));

  React.useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  if (!m) return null;
  const cfColor = m.cf >= 0 ? C.green : C.red;

  const Chip = ({ label, value, color }) => (
    <div style={{ background: C.surface, borderRadius: 10, padding: '12px 14px', textAlign: 'center', border: `1px solid ${color}33` }}>
      <div style={{ fontSize: 10, color: C.textSec, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
    </div>
  );

  const Row = ({ l, v, color, indent, bold, div: d }) => d
    ? <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />
    : (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', paddingLeft: indent ? 14 : 0 }}>
        <span style={{ fontSize: 13, color: C.textSec, fontWeight: bold ? 600 : 400 }}>{l}</span>
        <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: color || C.text }}>{v}</span>
      </div>
    );

  const Sl = ({ label, k, min, max, step, fmt }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: C.textSec }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{fmt(a[k])}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={a[k]}
        onChange={e => upd(k, parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: C.blue, cursor: 'pointer' }} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 960, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ padding: '20px 26px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{listing.address}</span>
              {listing.hamzasPick && <span style={{ background: '#78350F', color: C.gold, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, border: `1px solid ${C.gold}44` }}>⭐ TOP PICK</span>}
              {listing.dealOfWeek && <span style={{ background: '#1A3A5C', color: '#60A5FA', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, border: '1px solid #3B82F644' }}>🏆 DEAL OF THE WEEK</span>}
            </div>
            <div style={{ fontSize: 13, color: C.textSec }}>{listing.neighbourhood} · {listing.type} · {listing.beds} bed · {listing.baths} bath{listing.sqft ? ` · ${listing.sqft.toLocaleString()} sqft` : ''} · Built {listing.yearBuilt}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{f$(listing.price)}</div>
              {listing.priceDrop > 0 && <div style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>▼ {listing.priceDrop}% from asking</div>}
            </div>
            <button onClick={onClose} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, width: 34, height: 34, fontSize: 16, cursor: 'pointer', color: C.textSec, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 0 }}>
          {/* LEFT */}
          <div style={{ padding: 26, borderRight: `1px solid ${C.border}` }}>
            {/* Photo gallery */}
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20, position: 'relative', height: 280 }}>
              <img src={listing.photos?.[photo] || listing.photos?.[0]} alt={listing.address}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; }} />
              {listing.photos?.length > 1 && (
                <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                  {listing.photos.map((_, i) => (
                    <button key={i} onClick={() => setPhoto(i)}
                      style={{ width: i === photo ? 20 : 8, height: 8, borderRadius: 4, background: i === photo ? C.white : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
                  ))}
                </div>
              )}
              {listing.photos?.length > 1 && (
                <>
                  <button onClick={() => setPhoto(p => p === 0 ? listing.photos.length - 1 : p - 1)}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: C.white, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                  <button onClick={() => setPhoto(p => p === listing.photos.length - 1 ? 0 : p + 1)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: C.white, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                </>
              )}
            </div>

            {/* 4 hero chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
              <Chip label="Monthly Cash Flow" value={fCF(m.cf)} color={cfColor} />
              <Chip label="Cap Rate" value={fPct(m.capRate)} color={m.capRate >= 4 ? C.green : C.amber} />
              <Chip label="Cash-on-Cash" value={fPct(m.coc)} color={m.coc >= 5 ? C.green : C.amber} />
              <Chip label="Deal Score" value={`${s} ${g}`} color={s >= 7.5 ? C.green : s >= 5.5 ? C.amber : C.red} />
            </div>

            {/* P&L */}
            <div style={{ background: C.surface, borderRadius: 10, padding: 18, border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Monthly P&L</div>
              {[
                { l: 'Gross Rent', v: f$(m.gross), color: C.green },
                { l: 'Vacancy Loss', v: '− ' + f$(m.vac), indent: true },
                { l: 'Effective Income', v: f$(m.eff), bold: true },
                { div: true },
                { l: 'Property Tax', v: '− ' + f$(m.tax), indent: true },
                { l: 'Insurance', v: '− ' + f$(m.ins), indent: true },
                { l: 'Maintenance Reserve', v: '− ' + f$(m.maint), indent: true },
                ...(m.mgmt > 0 ? [{ l: 'Property Mgmt', v: '− ' + f$(m.mgmt), indent: true }] : []),
                { l: 'Total Operating Expenses', v: '− ' + f$(m.opex), color: C.amber, bold: true },
                { div: true },
                { l: 'Net Operating Income', v: f$(m.noi), bold: true },
                { l: 'Mortgage Payment', v: '− ' + f$(m.mtg), color: C.red, indent: true },
                { div: true },
                { l: 'Monthly Cash Flow', v: fCF(m.cf), color: cfColor, bold: true },
              ].map((r, i) => <Row key={i} {...r} />)}
            </div>

            {/* Capital */}
            <div style={{ background: C.surface, borderRadius: 10, padding: 18, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Capital Required</div>
              <Row l="Down Payment" v={f$(m.dp)} />
              <Row l="Closing Costs (~1.5%)" v={f$(m.closing)} />
              <Row l="Total Cash In" v={f$(m.cashIn)} bold />
              <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>{f$(m.mtg)}/mo mortgage · {f$(m.loan)} loan · 5.99% · 25yr amort · Canadian semi-annual compounding</div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ padding: 24 }}>
            {/* Assumptions */}
            <div style={{ background: C.surface, borderRadius: 10, padding: 18, border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Adjust Assumptions</div>
              <Sl label="Monthly Rent" k="rent" min={1000} max={8000} step={50} fmt={v => f$(v)} />
              <Sl label="Down Payment" k="dpPct" min={0.05} max={0.50} step={0.05} fmt={v => (v * 100).toFixed(0) + '%'} />
              <Sl label="Interest Rate" k="rate" min={0.03} max={0.10} step={0.0025} fmt={v => (v * 100).toFixed(2) + '%'} />
              <Sl label="Amortization" k="years" min={15} max={30} step={5} fmt={v => v + ' yrs'} />
              <Sl label="Vacancy Rate" k="vacRate" min={0} max={0.15} step={0.01} fmt={v => (v * 100).toFixed(0) + '%'} />
              <Sl label="Maintenance" k="maintPct" min={0.02} max={0.15} step={0.01} fmt={v => (v * 100).toFixed(0) + '% rent'} />
              <Sl label="Property Mgmt" k="mgmtPct" min={0} max={0.15} step={0.01} fmt={v => v === 0 ? 'Self-managed' : (v * 100).toFixed(0) + '% rent'} />
            </div>

            {/* Notes */}
            {listing.notes && (
              <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent Notes</div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{listing.notes}</div>
              </div>
            )}

            {/* CTA */}
            <div style={{ background: C.blue, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.white, marginBottom: 3 }}>Book a Showing</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>Hamza Nouman · Royal LePage Signature Realty</div>
              <a href="tel:6476091289" style={{ display: 'block', background: C.white, color: C.blue, textAlign: 'center', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 8 }}>📞 647-609-1289</a>
              <a href={`mailto:hamza@nouman.ca?subject=Showing Request: ${listing.address}`}
                style={{ display: 'block', background: 'rgba(255,255,255,0.15)', color: C.white, textAlign: 'center', padding: '11px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>✉️ Email Hamza</a>
            </div>

            <div style={{ marginTop: 12, fontSize: 10, color: C.muted, lineHeight: 1.7 }}>
              Listed by: <strong style={{ color: C.textSec }}>{listing.brokerage}</strong><br />
              Information deemed reliable but not guaranteed. Not intended to solicit listed properties.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PROPERTY CARD ──
function PropertyCard({ listing, onClick }) {
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const cf = listing.cf;
  const cfColor = cf >= 0 ? C.green : C.red;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{ background: hov ? C.cardHover : C.card, border: `1px solid ${hov ? C.blue : listing.hamzasPick ? C.gold + '66' : C.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s', boxShadow: hov ? '0 8px 32px rgba(59,130,246,0.2)' : '0 2px 8px rgba(0,0,0,0.3)' }}>

      {/* Photo */}
      <div style={{ height: 185, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${C.blueLight} 0%, #0D2137 100%)` }}>
        {!imgErr && listing.photos?.[0] ? (
          <img src={listing.photos[0]} alt={listing.address}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease', transform: hov ? 'scale(1.04)' : 'scale(1)' }}
            onError={() => setImgErr(true)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 36, opacity: 0.25 }}>🏠</div>
            <div style={{ fontSize: 11, color: C.muted }}>Photo loading...</div>
          </div>
        )}

        {/* Overlay badges */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {listing.hamzasPick && <span style={{ background: C.gold, color: '#000', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>⭐ TOP PICK</span>}
            {listing.dealOfWeek && <span style={{ background: C.blue, color: C.white, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>🏆 DEAL OF WEEK</span>}
          </div>
          <span style={{
            background: listing.dealScore >= 7.5 ? C.green : listing.dealScore >= 5.5 ? C.amber : C.red,
            color: C.white, fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>{listing.dealScore} {listing.dealGrade}</span>
        </div>

        {listing.priceDrop > 0 && (
          <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(239,68,68,0.9)', color: C.white, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>▼ {listing.priceDrop}% Reduced</div>
        )}
        <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', color: C.white, fontSize: 10, padding: '3px 8px', borderRadius: 20 }}>{listing.dom}d listed</div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 3 }}>{f$(listing.price)}</div>
        <div style={{ fontSize: 12, color: C.textSec, marginBottom: 2 }}>{listing.beds} bed · {listing.baths} bath · {listing.sqft?.toLocaleString()} sqft · {listing.type}</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{listing.address}, {listing.neighbourhood}</div>

        {/* 4 investor metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {[
            { label: 'Cash Flow/mo', value: fCF(cf), color: cfColor, bg: cf >= 0 ? C.greenBg : C.redBg },
            { label: 'Cap Rate', value: fPct(listing.capRate), color: listing.capRate >= 4 ? C.green : C.amber, bg: listing.capRate >= 4 ? C.greenBg : C.amberBg },
            { label: 'Est. Rent/mo', value: f$(listing.rent), color: C.blue, bg: C.blueLight },
            { label: 'Mortgage/mo', value: f$(listing.mtg), color: C.textSec, bg: C.surface },
          ].map(m => (
            <div key={m.label} style={{ background: m.bg, borderRadius: 8, padding: '9px 10px', border: `1px solid ${m.color}22` }}>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{m.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: C.muted }}>{listing.brokerage}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.blue }}>{hov ? 'View Analysis →' : 'Analyze Deal'}</span>
        </div>
      </div>
    </div>
  );
}

// ── DEAL OF THE WEEK HERO ──
function DealOfWeek({ listing, onClick }) {
  const [hov, setHov] = useState(false);
  if (!listing) return null;
  const cfColor = listing.cf >= 0 ? C.green : C.red;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>🏆 Deal of the Week</div>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <div style={{ fontSize: 11, color: C.textSec }}>Hamza's hand-picked top deal</div>
      </div>

      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
        style={{ background: hov ? C.cardHover : C.card, border: `1px solid ${C.gold}55`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s', boxShadow: hov ? `0 12px 40px rgba(245,158,11,0.15)` : '0 4px 16px rgba(0,0,0,0.3)', display: 'grid', gridTemplateColumns: '420px 1fr' }}>

        {/* Photo */}
        <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
          <img src={listing.photos?.[0]} alt={listing.address}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: hov ? 'scale(1.05)' : 'scale(1)' }}
            onError={e => e.target.style.display = 'none'} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, rgba(15,30,53,0.9) 100%)' }} />
          <div style={{ position: 'absolute', top: 14, left: 14 }}>
            <span style={{ background: C.gold, color: '#000', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>⭐ HAMZA'S TOP PICK</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 3 }}>{listing.address}</div>
              <div style={{ fontSize: 13, color: C.textSec }}>{listing.neighbourhood} · {listing.type} · {listing.beds} bed {listing.baths} bath · {listing.sqft?.toLocaleString()} sqft</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{f$(listing.price)}</div>
              {listing.priceDrop > 0 && <div style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>▼ {listing.priceDrop}% reduced</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, margin: '16px 0' }}>
            {[
              { l: 'Cash Flow', v: fCF(listing.cf), color: cfColor },
              { l: 'Cap Rate', v: fPct(listing.capRate), color: listing.capRate >= 4 ? C.green : C.amber },
              { l: 'Deal Score', v: `${listing.dealScore} ${listing.dealGrade}`, color: listing.dealScore >= 7 ? C.green : C.amber },
              { l: 'Est. Rent/mo', v: f$(listing.rent), color: C.blue },
            ].map(({ l, v, color }) => (
              <div key={l} style={{ background: C.surface, borderRadius: 8, padding: '10px 12px', textAlign: 'center', border: `1px solid ${color}22` }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7, marginBottom: 16 }}>{listing.notes}</div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ flex: 1, padding: '11px', background: C.blue, border: 'none', borderRadius: 8, color: C.white, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              View Full Analysis →
            </button>
            <a href="tel:6476091289" style={{ padding: '11px 18px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              📞 647-609-1289
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FILTER BAR ──
function FilterBar({ filters, onChange, onReset, count }) {
  const sel = (label, key, opts) => (
    <select value={filters[key] || ''} onChange={e => onChange(key, e.target.value)}
      style={{ padding: '8px 13px', fontSize: 12, border: `1px solid ${filters[key] ? C.blue : C.border}`, borderRadius: 8, background: filters[key] ? C.blueLight : C.surface, color: filters[key] ? C.blue : C.textSec, outline: 'none', cursor: 'pointer', fontWeight: filters[key] ? 700 : 400 }}>
      <option value="">{label}</option>
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
  const active = Object.values(filters).filter(Boolean).length;
  return (
    <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {sel('Price Range', 'priceRange', [{ v: '0-600000', l: 'Under $600K' }, { v: '600000-800000', l: '$600K–$800K' }, { v: '800000-1000000', l: '$800K–$1M' }, { v: '1000000-1500000', l: '$1M–$1.5M' }, { v: '1500000-99999999', l: '$1.5M+' }])}
      {sel('Beds', 'minBeds', [1, 2, 3, 4, 5].map(n => ({ v: n, l: n + '+ beds' })))}
      {sel('Type', 'type', ['Detached', 'Semi-Detached', 'Townhouse', 'Condo'].map(t => ({ v: t, l: t })))}
      {sel('Neighbourhood', 'hood', ['Port Credit', 'Clarkson', 'Erin Mills', 'Cooksville', 'Hurontario', 'Meadowvale', 'City Centre', 'Lakeview'].map(n => ({ v: n, l: n })))}
      {sel('Min Cap Rate', 'minCap', ['2', '3', '4', '5'].map(n => ({ v: n, l: n + '%+ cap rate' })))}
      {sel('Cash Flow', 'minCF', [{ v: '-99999', l: 'Any' }, { v: '0', l: 'Cash flow +' }, { v: '200', l: '+$200/mo min' }, { v: '500', l: '+$500/mo min' }])}
      {sel('Days Listed', 'maxDom', [{ v: '7', l: '< 1 week' }, { v: '14', l: '< 2 weeks' }, { v: '30', l: '< 30 days' }])}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: C.muted }}>{count} listing{count !== 1 ? 's' : ''}</span>
        {active > 0 && <button onClick={onReset} style={{ fontSize: 12, color: C.red, background: 'transparent', border: `1px solid ${C.red}44`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>Clear ({active})</button>}
      </div>
    </div>
  );
}

function applyFilters(ls, f) {
  return ls.filter(l => {
    if (f.priceRange) { const [mn, mx] = f.priceRange.split('-').map(Number); if (l.price < mn || l.price > mx) return false; }
    if (f.minBeds && l.beds < +f.minBeds) return false;
    if (f.type && l.type !== f.type) return false;
    if (f.hood && l.neighbourhood !== f.hood) return false;
    if (f.minCap && l.capRate < +f.minCap) return false;
    if (f.minCF && l.cf < +f.minCF) return false;
    if (f.maxDom && l.dom > +f.maxDom) return false;
    return true;
  });
}

function applySort(ls, s) {
  const a = [...ls];
  if (s === 'score') return a.sort((x, y) => y.dealScore - x.dealScore);
  if (s === 'cf') return a.sort((x, y) => y.cf - x.cf);
  if (s === 'cap') return a.sort((x, y) => y.capRate - x.capRate);
  if (s === 'pAsc') return a.sort((x, y) => x.price - y.price);
  if (s === 'pDesc') return a.sort((x, y) => y.price - x.price);
  if (s === 'dom') return a.sort((x, y) => x.dom - y.dom);
  return a;
}

const DOTW = LISTINGS.find(l => l.dealOfWeek);
const FREE_VIEWS = 10;

// ── MAIN APP ──
export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('mi_user') || 'null'); } catch { return null; } });
  const [views, setViews] = useState(() => parseInt(localStorage.getItem('mi_views') || '0'));
  const [showSignup, setShowSignup] = useState(false);
  const [signupTrigger, setSignupTrigger] = useState('');
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState('score');
  const [tab, setTab] = useState('listings');

  const displayed = useMemo(() => applySort(applyFilters(LISTINGS, filters), sort), [filters, sort]);

  const handleCardClick = useCallback((listing) => {
    const nv = views + 1;
    setViews(nv);
    localStorage.setItem('mi_views', nv);
    if (!user && nv >= FREE_VIEWS) {
      setSignupTrigger(`${nv} views`);
      setShowSignup(true);
      return;
    }
    setSelected(listing);
  }, [views, user]);

  const handleSignup = useCallback(u => {
    setUser(u);
    localStorage.setItem('mi_user', JSON.stringify(u));
    setShowSignup(false);
  }, []);

  const updFilter = useCallback((k, v) => setFilters(p => ({ ...p, [k]: v })), []);
  const resetFilters = useCallback(() => setFilters({}), []);

  return (
    <div style={{ minHeight: '100vh', background: C.navy, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', color: C.text }}>

      {/* ── HEADER ── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 200, backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 58, gap: 28 }}>
          <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            <span style={{ color: C.blue }}>Mississauga</span><span style={{ color: C.text }}>Investor</span>
            <span style={{ fontSize: 9, fontWeight: 500, color: C.muted, marginLeft: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI Deal Screener</span>
          </div>

          {/* Nav */}
          <div style={{ display: 'flex' }}>
            {[['listings', 'Properties'], ['calculator', 'Calculator'], ['market', 'Market Pulse'], ['contact', 'Contact']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ padding: '0 16px', fontSize: 13, fontWeight: tab === id ? 700 : 400, background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === id ? C.blue : 'transparent'}`, color: tab === id ? C.blue : C.textSec, cursor: 'pointer', height: 58, borderRadius: 0 }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            {!user && views > 4 && views < FREE_VIEWS && (
              <span style={{ fontSize: 11, color: C.amber, fontWeight: 600 }}>{FREE_VIEWS - views} free views left</span>
            )}
            {user
              ? <span style={{ fontSize: 13, color: C.textSec, fontWeight: 600 }}>👋 {user.name?.split(' ')[0]}</span>
              : <button onClick={() => { setSignupTrigger('header'); setShowSignup(true); }}
                  style={{ padding: '7px 16px', fontSize: 13, fontWeight: 700, background: C.blue, color: C.white, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Sign Up Free
                </button>
            }
            <a href="tel:6476091289" style={{ fontSize: 13, fontWeight: 600, color: C.blue, textDecoration: 'none' }}>647-609-1289</a>
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      {tab === 'listings' && <FilterBar filters={filters} onChange={updFilter} onReset={resetFilters} count={displayed.length} />}

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 24px' }}>

        {tab === 'listings' && (
          <>
            {/* Nudge bar */}
            {!user && views > 5 && views < FREE_VIEWS && (
              <div style={{ background: C.amberBg, border: `1px solid ${C.amber}44`, borderRadius: 10, padding: '11px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: C.amber, fontWeight: 600 }}>🔔 {FREE_VIEWS - views} free property views remaining — sign up to unlock full access</span>
                <button onClick={() => { setSignupTrigger('nudge'); setShowSignup(true); }}
                  style={{ fontSize: 13, fontWeight: 700, color: C.blue, background: 'transparent', border: `1px solid ${C.blue}66`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
                  Sign up free →
                </button>
              </div>
            )}

            {/* Deal of the Week */}
            <DealOfWeek listing={DOTW} onClick={() => handleCardClick(DOTW)} />

            {/* Sort + heading */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>All Listings</div>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Sort:</span>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  style={{ padding: '7px 12px', fontSize: 12, border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, outline: 'none', cursor: 'pointer' }}>
                  {[['score', 'Best Deal Score'], ['cf', 'Highest Cash Flow'], ['cap', 'Best Cap Rate'], ['pAsc', 'Price: Low → High'], ['pDesc', 'Price: High → Low'], ['dom', 'Newest Listed']].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {displayed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, color: C.muted }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 15, marginBottom: 12 }}>No listings match your filters</div>
                <button onClick={resetFilters} style={{ color: C.blue, background: 'transparent', border: `1px solid ${C.blue}`, borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Clear Filters</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 18 }}>
                {displayed.map(l => <PropertyCard key={l.id} listing={l} onClick={() => handleCardClick(l)} />)}
              </div>
            )}

            <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.muted, lineHeight: 1.8 }}>
              Listing information provided by PropTx Innovations Inc. and the Toronto Regional Real Estate Board (TRREB). All rights reserved. Information deemed reliable but not guaranteed accurate. The trademarks MLS®, Multiple Listing Service® are owned by The Canadian Real Estate Association (CREA). Not intended to solicit properties already listed.
            </div>
          </>
        )}

        {tab === 'calculator' && <CalculatorTab />}
        {tab === 'market' && <MarketPulseTab />}
        {tab === 'contact' && <ContactTab />}
      </div>

      {showSignup && <SignupModal trigger={signupTrigger} onSuccess={handleSignup} />}
      {selected && <DealModal listing={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── CALCULATOR ──
function CalculatorTab() {
  const [inp, setInp] = useState({ price: 900000, rent: 3500, dpPct: 0.20, rate: 0.0599, years: 25, vacRate: 0.03, maintPct: 0.05, mgmtPct: 0 });
  const m = useMemo(() => calcMetrics(inp), [inp]);
  const { s, g } = useMemo(() => score(m), [m]);
  const u = (k, v) => setInp(p => ({ ...p, [k]: v }));
  if (!m) return null;
  const cfColor = m.cf >= 0 ? C.green : C.red;
  const ni = (label, key, pfx = '$') => (
    <div style={{ marginBottom: 13 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 5 }}>{label}</label>
      <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <span style={{ padding: '10px 11px', fontSize: 13, color: C.muted, borderRight: `1px solid ${C.border}` }}>{pfx}</span>
        <input type="number" value={inp[key]} onChange={e => u(key, parseFloat(e.target.value) || 0)}
          style={{ flex: 1, padding: '10px 13px', border: 'none', outline: 'none', fontSize: 14, color: C.text, background: 'transparent' }} />
      </div>
    </div>
  );
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Investment Calculator</h2>
      <p style={{ fontSize: 13, color: C.textSec, marginBottom: 26 }}>Canadian semi-annual compounding · Mississauga 2025 tax rate (0.72%)</p>
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, maxWidth: 960 }}>
        <div style={{ background: C.card, borderRadius: 12, padding: 22, border: `1px solid ${C.border}` }}>
          {ni('Property Price', 'price')} {ni('Monthly Rent', 'rent')} {ni('Down Payment %', 'dpPct', '%')}
          {ni('Interest Rate %', 'rate', '%')} {ni('Amortization (years)', 'years', 'yr')} {ni('Vacancy %', 'vacRate', '%')}
          {ni('Maintenance %', 'maintPct', '%')} {ni('Property Mgmt %', 'mgmtPct', '%')}
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { l: 'Monthly Cash Flow', v: fCF(m.cf), color: cfColor },
              { l: 'Annual Cash Flow', v: fCF(m.cfYear), color: cfColor },
              { l: 'Cap Rate', v: fPct(m.capRate), color: m.capRate >= 4 ? C.green : C.amber },
              { l: 'Cash-on-Cash Return', v: fPct(m.coc), color: m.coc >= 5 ? C.green : C.amber },
            ].map(s => (
              <div key={s.l} style={{ background: C.card, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}22` }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{s.l}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: C.card, borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, marginBottom: 12 }}>
            {[
              { l: 'Gross Rent', v: f$(m.gross), color: C.green },
              { l: 'Vacancy Loss', v: '− ' + f$(m.vac), indent: true },
              { l: 'Effective Income', v: f$(m.eff), bold: true },
              { div: true },
              { l: 'Tax + Insurance + Maint.', v: '− ' + f$(m.opex), color: C.amber },
              { l: 'Net Operating Income', v: f$(m.noi), bold: true },
              { l: 'Mortgage', v: '− ' + f$(m.mtg), color: C.red, indent: true },
              { div: true },
              { l: 'Monthly Cash Flow', v: fCF(m.cf), color: cfColor, bold: true },
            ].map((r, i) => r.div ? <div key={i} style={{ borderTop: `1px solid ${C.border}`, margin: '7px 0' }} /> : (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', paddingLeft: r.indent ? 14 : 0 }}>
                <span style={{ fontSize: 13, color: C.textSec, fontWeight: r.bold ? 600 : 400 }}>{r.l}</span>
                <span style={{ fontSize: 13, fontWeight: r.bold ? 700 : 500, color: r.color || C.text }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: C.card, borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', marginBottom: 4 }}>DEAL SCORE</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: s >= 7.5 ? C.green : s >= 5.5 ? C.amber : C.red, lineHeight: 1 }}>{s}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4 }}>{g}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MARKET PULSE ──
function MarketPulseTab() {
  return (
    <div style={{ maxWidth: 800 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Mississauga Market Pulse</h2>
      <p style={{ fontSize: 13, color: C.textSec, marginBottom: 26 }}>Updated March 2026 · TRREB data · Hamza Nouman analysis</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Sale-to-List Ratio', v: '0.97', note: 'Below 1.0 — buyer has room to negotiate', color: C.amber },
          { l: 'Avg Days on Market', v: '28d', note: 'Up from 18d year-over-year', color: C.amber },
          { l: 'Active Listings', v: '1,847', note: 'Up 34% year-over-year in Mississauga', color: C.green },
          { l: 'Sales-to-New Listings', v: '0.41', note: "Neutral/soft — seller's market is 0.60+", color: C.amber },
          { l: 'Benchmark SFH Price', v: '$1.14M', note: 'Mississauga, March 2026 estimate', color: C.text },
          { l: 'Avg Cap Rate (Detached)', v: '3.2–4.1%', note: 'Range across Mississauga neighbourhoods', color: C.blue },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{s.l}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 6 }}>{s.v}</div>
            <div style={{ fontSize: 12, color: C.textSec }}>{s.note}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>Hamza's Take — March 2026</div>
        <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.8 }}>
          Market is soft but not distressed. Best plays: <strong style={{ color: C.text }}>semi-detached with basement suite potential in Clarkson and Cooksville, under $950K.</strong> Avoid condos under 800sqft — rental premiums don't justify carrying costs at current rates. Lakeview is the long-term land value play to watch.
        </div>
      </div>
    </div>
  );
}

// ── CONTACT ──
function ContactTab() {
  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Talk to Hamza</h2>
      <p style={{ fontSize: 13, color: C.textSec, marginBottom: 26 }}>Mississauga investment specialist · Royal LePage Signature Realty</p>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 2 }}>Hamza Nouman</div>
        <div style={{ fontSize: 13, color: C.textSec, marginBottom: 22 }}>Sales Representative · Royal LePage Signature Realty</div>
        <a href="tel:6476091289" style={{ display: 'block', background: C.blue, color: C.white, textAlign: 'center', padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none', marginBottom: 10 }}>📞 Call: 647-609-1289</a>
        <a href="mailto:hamza@nouman.ca" style={{ display: 'block', border: `1px solid ${C.border}`, color: C.text, textAlign: 'center', padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', marginBottom: 10 }}>✉️ hamza@nouman.ca</a>
        <a href="https://www.hamzahomes.ca" target="_blank" rel="noreferrer" style={{ display: 'block', border: `1px solid ${C.border}`, color: C.textSec, textAlign: 'center', padding: 13, borderRadius: 10, fontSize: 14, textDecoration: 'none' }}>🌐 HamzaHomes.ca</a>
        <div style={{ marginTop: 20, fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.7 }}>
          8 Sampson Mews, Suite 201, Toronto ON<br />
          <a href="https://www.mississaugainvestor.ca/privacy" style={{ color: C.muted }}>Privacy Policy</a> · <a href="https://www.mississaugainvestor.ca/terms" style={{ color: C.muted }}>Terms of Use</a>
        </div>
      </div>
    </div>
  );
}
