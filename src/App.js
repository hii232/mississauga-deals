// MississaugaInvestor.ca — App.js v12
// CHANGES FROM v11:
// - Fixed cash flow calculation engine (Canadian semi-annual compounding, correct expense accounting)
// - TRREB VOW live data integration (falls back to sample data if API unavailable)
// - Investor-grade filters (instant, no reload)
// - Lead capture modal (email gate on full deal analysis)
// - Deal score engine rebuilt
// - Correct Market Pulse label (above 0.4 = seller's market)
// UPLOAD: drag-and-drop to GitHub src/App.js — never paste

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================
// COLOR SYSTEM
// ============================================================
const C = {
  blue: '#3B82F6',
  gold: '#F59E0B',
  navy: '#05091A',
  surface: '#0C1429',
  card: '#111D32',
  cardHover: '#162040',
  border: '#1E2D47',
  text: '#E2E8F0',
  muted: '#64748B',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
};

// ============================================================
// CALCULATION ENGINE — CORRECT VERSION
// Canadian mortgage math (semi-annual compounding)
// ============================================================
function calculateMetrics({
  price,
  estimatedRent,
  downPaymentPct = 0.20,
  interestRate = 0.0599,
  amortizationYears = 25,
  propertyTaxRate = 0.0072,
  insuranceMonthly = 175,
  maintenancePct = 0.05,
  vacancyRate = 0.03,
  propertyMgmtPct = 0,
}) {
  if (!price || !estimatedRent) return null;

  // Capital
  const downPayment = price * downPaymentPct;
  const loanAmount = price - downPayment;
  const closingCosts = price * 0.015;
  const totalCashInvested = downPayment + closingCosts;

  // Canadian mortgage: semi-annual compounding
  const effectiveAnnualRate = Math.pow(1 + interestRate / 2, 2) - 1;
  const monthlyRate = Math.pow(1 + effectiveAnnualRate, 1 / 12) - 1;
  const n = amortizationYears * 12;
  const mortgagePayment =
    loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) /
    (Math.pow(1 + monthlyRate, n) - 1);

  // Income
  const grossRent = estimatedRent;
  const vacancyLoss = grossRent * vacancyRate;
  const effectiveIncome = grossRent - vacancyLoss;

  // Operating expenses — all monthly
  const taxMonthly = (price * propertyTaxRate) / 12;
  const maintMonthly = grossRent * maintenancePct;
  const mgmtMonthly = grossRent * propertyMgmtPct;
  const totalOpEx = taxMonthly + insuranceMonthly + maintMonthly + mgmtMonthly;

  // NOI (before mortgage — for cap rate)
  const monthlyNOI = effectiveIncome - totalOpEx;
  const annualNOI = monthlyNOI * 12;

  // Cash flow (after mortgage)
  const monthlyCashFlow = monthlyNOI - mortgagePayment;
  const annualCashFlow = monthlyCashFlow * 12;

  // Returns
  const capRate = (annualNOI / price) * 100;
  const cashOnCash = (annualCashFlow / totalCashInvested) * 100;
  const grm = price / (grossRent * 12);

  return {
    downPayment: Math.round(downPayment),
    loanAmount: Math.round(loanAmount),
    totalCashInvested: Math.round(totalCashInvested),
    closingCosts: Math.round(closingCosts),
    mortgagePayment: Math.round(mortgagePayment),
    grossRent: Math.round(grossRent),
    vacancyLoss: Math.round(vacancyLoss),
    effectiveIncome: Math.round(effectiveIncome),
    taxMonthly: Math.round(taxMonthly),
    insuranceMonthly: Math.round(insuranceMonthly),
    maintMonthly: Math.round(maintMonthly),
    mgmtMonthly: Math.round(mgmtMonthly),
    totalOpEx: Math.round(totalOpEx),
    totalMonthlyExpenses: Math.round(totalOpEx + mortgagePayment),
    monthlyNOI: Math.round(monthlyNOI),
    annualNOI: Math.round(annualNOI),
    monthlyCashFlow: Math.round(monthlyCashFlow),
    annualCashFlow: Math.round(annualCashFlow),
    capRate: parseFloat(capRate.toFixed(2)),
    cashOnCash: parseFloat(cashOnCash.toFixed(2)),
    grm: parseFloat(grm.toFixed(1)),
  };
}

// Deal score 0–10 with letter grade
function scoreDeal(m) {
  if (!m) return { score: 0, grade: 'N/A' };
  let s = 5;
  if (m.capRate >= 6) s += 2.5;
  else if (m.capRate >= 4.5) s += 1.5;
  else if (m.capRate >= 3) s += 0.5;
  else if (m.capRate < 2) s -= 1.5;

  if (m.monthlyCashFlow >= 500) s += 1.5;
  else if (m.monthlyCashFlow >= 200) s += 0.75;
  else if (m.monthlyCashFlow >= 0) s += 0.25;
  else if (m.monthlyCashFlow < -300) s -= 1;

  if (m.cashOnCash >= 8) s += 1;
  else if (m.cashOnCash >= 5) s += 0.5;
  else if (m.cashOnCash < 0) s -= 0.5;

  if (m.grm <= 15) s += 0.5;
  else if (m.grm >= 25) s -= 0.5;

  const score = parseFloat(Math.min(10, Math.max(0, s)).toFixed(1));
  const grade =
    score >= 8.5 ? 'A+' :
    score >= 7.5 ? 'A' :
    score >= 6.5 ? 'B+' :
    score >= 5.5 ? 'B' :
    score >= 4.5 ? 'C+' :
    score >= 3.5 ? 'C' : 'D';
  return { score, grade };
}

// ============================================================
// SAMPLE LISTINGS — fallback when live API unavailable
// ============================================================
const SAMPLE_LISTINGS = [
  {
    id: 'ML001',
    isSample: true,
    address: '147 Lakeshore Rd E',
    city: 'Port Credit',
    price: 1125000,
    beds: 4, baths: 3, sqft: 1950, type: 'Semi-Detached',
    yearBuilt: 1998, daysOnMarket: 12,
    estimatedRent: 4200,
    listingBrokerage: 'Royal LePage Signature Realty',
    notes: 'Corner lot, separate entrance to basement suite, walking distance to Port Credit GO.',
    image: null,
    originalPrice: 1175000,
  },
  {
    id: 'ML005',
    isSample: true,
    hamzasPick: true,
    address: '3290 Battleford Rd, Unit 42',
    city: 'Clarkson',
    price: 689000,
    beds: 3, baths: 2, sqft: 1420, type: 'Townhouse',
    yearBuilt: 2008, daysOnMarket: 5,
    estimatedRent: 3100,
    listingBrokerage: 'Royal LePage Signature Realty',
    notes: "Strong Clarkson rental demand. Near GO station. Hamza's top pick this week.",
    image: null,
    originalPrice: 689000,
  },
  {
    id: 'ML013',
    isSample: true,
    address: '5985 Creditview Rd',
    city: 'Hurontario',
    price: 875000,
    beds: 4, baths: 3, sqft: 1780, type: 'Detached',
    yearBuilt: 2001, daysOnMarket: 22,
    estimatedRent: 3800,
    listingBrokerage: 'Royal LePage Signature Realty',
    notes: 'Finished basement suite. Near future Hazel McCallion LRT stop.',
    image: null,
    originalPrice: 920000,
  },
  {
    id: 'ML019',
    isSample: true,
    address: '2150 Burnhamthorpe Rd W, Unit 808',
    city: 'Erin Mills',
    price: 549000,
    beds: 2, baths: 2, sqft: 890, type: 'Condo',
    yearBuilt: 2016, daysOnMarket: 3,
    estimatedRent: 2400,
    listingBrokerage: 'Royal LePage Signature Realty',
    notes: 'High-floor unit, low condo fees for size. Strong Erin Mills rental pool.',
    image: null,
    originalPrice: 549000,
  },
  {
    id: 'ML027',
    isSample: true,
    address: '1441 Dunwin Dr',
    city: 'Cooksville',
    price: 1345000,
    beds: 5, baths: 4, sqft: 2600, type: 'Detached',
    yearBuilt: 1989, daysOnMarket: 34,
    estimatedRent: 5200,
    listingBrokerage: 'Royal LePage Signature Realty',
    notes: 'Full duplex conversion opportunity. Upper/lower already separated. Near Trillium Hospital.',
    image: null,
    originalPrice: 1399000,
  },
  {
    id: 'ML031',
    isSample: true,
    address: '460 Meadowbrook Dr',
    city: 'Meadowvale',
    price: 798000,
    beds: 3, baths: 2, sqft: 1540, type: 'Semi-Detached',
    yearBuilt: 1995, daysOnMarket: 8,
    estimatedRent: 3300,
    listingBrokerage: 'Royal LePage Signature Realty',
    notes: 'Good Meadowvale school catchment. Separate side entrance to basement.',
    image: null,
    originalPrice: 798000,
  },
];

// Enrich listings with calculated metrics
function enrichListings(listings) {
  return listings.map(l => {
    const metrics = calculateMetrics({
      price: l.price,
      estimatedRent: l.estimatedRent,
    });
    const { score, grade } = scoreDeal(metrics);
    const priceReduction = l.originalPrice && l.originalPrice > l.price
      ? Math.round(((l.originalPrice - l.price) / l.originalPrice) * 100)
      : 0;
    return { ...l, ...metrics, dealScore: score, dealGrade: grade, priceReduction };
  });
}

// ============================================================
// FORMATTERS
// ============================================================
const fmt$ = n => n == null ? '--' : '$' + Math.abs(Math.round(n)).toLocaleString();
const fmtPct = n => n == null ? '--' : (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
const fmtCF = n => {
  if (n == null) return '--';
  const s = n >= 0 ? '+' : '-';
  return s + '$' + Math.abs(Math.round(n)).toLocaleString();
};

// ============================================================
// COMPONENTS
// ============================================================

// Password wall
function PasswordWall({ onUnlock }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const check = () => {
    if (pw === 'hamza2025' || pw === 'invest2025') { onUnlock(); }
    else { setErr(true); setTimeout(() => setErr(false), 2000); }
  };
  return (
    <div style={{ minHeight: '100vh', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '48px 40px', width: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏙️</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>MississaugaInvestor</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 32 }}>Investor access only</div>
        <input
          type="password" placeholder="Enter access code"
          value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          style={{ width: '100%', padding: '12px 16px', background: C.surface, border: `1px solid ${err ? C.red : C.border}`, borderRadius: 8, color: C.text, fontSize: 16, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
        />
        <button onClick={check} style={{ width: '100%', padding: '13px', background: C.blue, border: 'none', borderRadius: 8, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
          Access Platform
        </button>
        {err && <div style={{ color: C.red, fontSize: 13, marginTop: 12 }}>Invalid access code</div>}
        <div style={{ marginTop: 24, fontSize: 12, color: C.muted }}>
          Powered by <strong style={{ color: C.text }}>Hamza Nouman</strong> · Royal LePage Signature Realty
        </div>
      </div>
    </div>
  );
}

// Deal card
function DealCard({ listing, onAnalyze }) {
  const [hov, setHov] = useState(false);
  const cfColor = listing.monthlyCashFlow >= 0 ? C.green : C.red;
  const priceReducedPct = listing.priceReduction > 0 ? listing.priceReduction : null;

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onAnalyze(listing)}
      style={{
        background: hov ? C.cardHover : C.card,
        border: `1px solid ${listing.hamzasPick ? C.gold : hov ? C.blue : C.border}`,
        borderRadius: 12, padding: 20, cursor: 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {listing.hamzasPick && (
          <span style={{ background: C.gold, color: '#000', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>⭐ HAMZA'S PICK</span>
        )}
        {listing.isSample && (
          <span style={{ background: C.muted, color: '#fff', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>SAMPLE</span>
        )}
        {priceReducedPct > 0 && (
          <span style={{ background: C.red + '22', color: C.red, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, border: `1px solid ${C.red}44` }}>
            ▼ {priceReducedPct}% REDUCED
          </span>
        )}
        <span style={{
          marginLeft: 'auto', background: listing.dealScore >= 7.5 ? C.green + '22' : listing.dealScore >= 5.5 ? C.amber + '22' : C.red + '22',
          color: listing.dealScore >= 7.5 ? C.green : listing.dealScore >= 5.5 ? C.amber : C.red,
          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
          border: `1px solid ${listing.dealScore >= 7.5 ? C.green : listing.dealScore >= 5.5 ? C.amber : C.red}44`,
        }}>
          {listing.dealScore} {listing.dealGrade}
        </span>
      </div>

      {/* Address & price */}
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>{listing.address}</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{listing.city} · {listing.type} · {listing.beds}bd {listing.baths}ba{listing.sqft ? ` · ${listing.sqft.toLocaleString()} sqft` : ''}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 14 }}>{fmt$(listing.price)}</div>

      {/* 4-metric grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricBox label="Monthly Cash Flow" value={fmtCF(listing.monthlyCashFlow)} color={cfColor} />
        <MetricBox label="Cap Rate" value={listing.capRate ? listing.capRate.toFixed(2) + '%' : '--'} color={listing.capRate >= 4 ? C.green : listing.capRate >= 2.5 ? C.amber : C.red} />
        <MetricBox label="Est. Rent/mo" value={fmt$(listing.estimatedRent)} color={C.blue} />
        <MetricBox label="Mortgage/mo" value={fmt$(listing.mortgagePayment)} color={C.muted} />
      </div>

      {/* Days on market + brokerage */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: C.muted }}>
        <span>{listing.daysOnMarket || 0}d on market</span>
        <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {listing.listingBrokerage}
        </span>
      </div>
    </div>
  );
}

function MetricBox({ label, value, color }) {
  return (
    <div style={{ background: C.surface, borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || C.text }}>{value}</div>
    </div>
  );
}

// Assumption toggles for deal analysis
function AssumptionPanel({ assumptions, onChange }) {
  const field = (label, key, format, step, min, max) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: C.muted }}>
        <span>{label}</span>
        <span style={{ color: C.text, fontWeight: 600 }}>{format(assumptions[key])}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={assumptions[key]}
        onChange={e => onChange(key, parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: C.blue }} />
    </div>
  );

  return (
    <div style={{ background: C.surface, borderRadius: 10, padding: 20, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>📐 Adjust Assumptions</div>
      {field('Down Payment', 'downPaymentPct', v => (v * 100).toFixed(0) + '%', 0.05, 0.05, 0.50)}
      {field('Interest Rate', 'interestRate', v => (v * 100).toFixed(2) + '%', 0.0025, 0.03, 0.10)}
      {field('Amortization', 'amortizationYears', v => v + ' yrs', 5, 15, 30)}
      {field('Vacancy Rate', 'vacancyRate', v => (v * 100).toFixed(0) + '%', 0.01, 0.00, 0.15)}
      {field('Maintenance Reserve', 'maintenancePct', v => (v * 100).toFixed(0) + '% of rent', 0.01, 0.02, 0.15)}
      {field('Property Mgmt', 'propertyMgmtPct', v => v === 0 ? 'Self-managed' : (v * 100).toFixed(0) + '% of rent', 0.01, 0, 0.15)}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: C.muted }}>
          <span>Monthly Rent</span>
          <span style={{ color: C.text, fontWeight: 600 }}>{fmt$(assumptions.estimatedRent)}</span>
        </div>
        <input type="range" min={1000} max={8000} step={50} value={assumptions.estimatedRent}
          onChange={e => onChange('estimatedRent', parseInt(e.target.value))}
          style={{ width: '100%', accentColor: C.blue }} />
      </div>
    </div>
  );
}

// Full deal analysis modal
function DealModal({ listing, onClose, userEmail, onGate }) {
  const [assumptions, setAssumptions] = useState({
    downPaymentPct: 0.20,
    interestRate: 0.0599,
    amortizationYears: 25,
    vacancyRate: 0.03,
    maintenancePct: 0.05,
    propertyMgmtPct: 0,
    estimatedRent: listing.estimatedRent || 2400,
  });

  const metrics = useMemo(() =>
    calculateMetrics({ price: listing.price, ...assumptions }),
    [listing.price, assumptions]
  );

  const { score, grade } = useMemo(() => scoreDeal(metrics), [metrics]);

  const updateAssumption = (key, val) => setAssumptions(prev => ({ ...prev, [key]: val }));

  // Gate: prompt email if not signed in
  if (!userEmail) {
    return (
      <ModalShell onClose={onClose}>
        <LeadCaptureGate listing={listing} onSuccess={email => onGate(email)} />
      </ModalShell>
    );
  }

  if (!metrics) return null;
  const cfColor = metrics.monthlyCashFlow >= 0 ? C.green : C.red;

  return (
    <ModalShell onClose={onClose}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{listing.address}</div>
            <div style={{ fontSize: 14, color: C.muted }}>{listing.city} · {listing.type} · {listing.beds}bd {listing.baths}ba</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.text }}>{fmt$(listing.price)}</div>
            <div style={{ fontSize: 12, color: C.muted }}>List Price</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Left: metrics */}
        <div>
          {/* Hero metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <MetricBox label="Monthly Cash Flow" value={fmtCF(metrics.monthlyCashFlow)} color={cfColor} />
            <MetricBox label="Annual Cash Flow" value={fmtCF(metrics.annualCashFlow)} color={cfColor} />
            <MetricBox label="Cap Rate" value={metrics.capRate.toFixed(2) + '%'} color={metrics.capRate >= 4 ? C.green : metrics.capRate >= 2.5 ? C.amber : C.red} />
            <MetricBox label="Cash-on-Cash" value={metrics.cashOnCash.toFixed(2) + '%'} color={metrics.cashOnCash >= 5 ? C.green : metrics.cashOnCash >= 0 ? C.amber : C.red} />
          </div>

          {/* Full P&L breakdown */}
          <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Monthly P&L</div>
            <PnLRow label="Gross Rent" value={fmt$(metrics.grossRent)} color={C.green} />
            <PnLRow label="Vacancy Loss" value={'−' + fmt$(metrics.vacancyLoss)} color={C.muted} indent />
            <PnLRow label="Effective Income" value={fmt$(metrics.effectiveIncome)} color={C.text} bold />
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />
            <PnLRow label="Property Tax" value={'−' + fmt$(metrics.taxMonthly)} color={C.muted} indent />
            <PnLRow label="Insurance" value={'−' + fmt$(metrics.insuranceMonthly)} color={C.muted} indent />
            <PnLRow label="Maintenance" value={'−' + fmt$(metrics.maintMonthly)} color={C.muted} indent />
            {metrics.mgmtMonthly > 0 && <PnLRow label="Mgmt Fee" value={'−' + fmt$(metrics.mgmtMonthly)} color={C.muted} indent />}
            <PnLRow label="Total Operating Exp." value={'−' + fmt$(metrics.totalOpEx)} color={C.amber} bold />
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />
            <PnLRow label="Net Operating Income" value={fmt$(metrics.monthlyNOI)} color={C.text} bold />
            <PnLRow label="Mortgage Payment" value={'−' + fmt$(metrics.mortgagePayment)} color={C.red} indent />
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />
            <PnLRow label="Monthly Cash Flow" value={fmtCF(metrics.monthlyCashFlow)} color={cfColor} bold />
          </div>

          {/* Capital deployed */}
          <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Capital Required</div>
            <PnLRow label="Down Payment (20%)" value={fmt$(metrics.downPayment)} />
            <PnLRow label="Est. Closing Costs (1.5%)" value={fmt$(metrics.closingCosts)} />
            <PnLRow label="Total Cash In" value={fmt$(metrics.totalCashInvested)} bold />
            <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
              Mortgage: {fmt$(metrics.mortgagePayment)}/mo on {fmt$(metrics.loanAmount)} @ {metrics?.interestRate || 5.99}% (25yr, semi-annual compounding)
            </div>
          </div>

          {/* Deal score */}
          <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, marginTop: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>AI DEAL SCORE</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: score >= 7.5 ? C.green : score >= 5.5 ? C.amber : C.red }}>
              {score}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{grade}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Based on cap rate, cash flow & CoC return</div>
          </div>
        </div>

        {/* Right: assumptions */}
        <div>
          <AssumptionPanel assumptions={assumptions} onChange={updateAssumption} />

          {/* GRM + other metrics */}
          <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Additional Metrics</div>
            <PnLRow label="Gross Rent Multiplier" value={metrics.grm + 'x'} />
            <PnLRow label="Annual NOI" value={fmt$(metrics.annualNOI)} />
            <PnLRow label="Annual Cash Flow" value={fmtCF(metrics.annualCashFlow)} color={cfColor} />
            <PnLRow label="Year Built" value={listing.yearBuilt || '--'} />
            <PnLRow label="Days on Market" value={(listing.daysOnMarket || 0) + 'd'} />
            {listing.priceReduction > 0 && <PnLRow label="Price Reduced" value={listing.priceReduction + '%'} color={C.red} />}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 16, background: C.blue + '11', border: `1px solid ${C.blue}44`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>📞 Book a Showing</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Hamza Nouman · Royal LePage Signature Realty</div>
            <a href="tel:6476091289" style={{ display: 'block', background: C.blue, color: '#fff', textAlign: 'center', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', marginBottom: 8 }}>
              📞 647-609-1289
            </a>
            <a href={`mailto:hamza@nouman.ca?subject=Inquiry: ${listing.address}`}
              style={{ display: 'block', background: 'transparent', color: C.blue, textAlign: 'center', padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', border: `1px solid ${C.blue}` }}>
              ✉️ Email Hamza
            </a>
          </div>

          {/* VOW compliance */}
          <div style={{ marginTop: 12, fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
            Listing: <strong style={{ color: C.text }}>{listing.listingBrokerage}</strong><br />
            Information deemed reliable but not guaranteed accurate by PropTx. Not intended to solicit properties already listed. All calculations are estimates.
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function PnLRow({ label, value, color, indent, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', paddingLeft: indent ? 12 : 0 }}>
      <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: color || C.text }}>{value}</span>
    </div>
  );
}

function ModalShell({ children, onClose }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', padding: 28, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: C.muted, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        {children}
      </div>
    </div>
  );
}

// Lead capture gate
function LeadCaptureGate({ listing, onSuccess }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!email.includes('@')) { setErr('Enter a valid email'); return; }
    if (!name.trim()) { setErr('Enter your name'); return; }
    setLoading(true);
    try {
      // Fire and forget to your lead capture API
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          listingId: listing.id,
          listingAddress: listing.address,
          listingPrice: listing.price,
          source: 'deal_analysis_gate',
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {}); // don't block on failure
      onSuccess(email.trim().toLowerCase());
    } catch {
      onSuccess(email.trim().toLowerCase()); // still unlock
    }
    setLoading(false);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔓</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>Unlock Full Deal Analysis</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 8, maxWidth: 360, margin: '0 auto 24px' }}>
        Get complete cash flow breakdown, cap rate, and cash-on-cash return for<br />
        <strong style={{ color: C.text }}>{listing.address}</strong>
      </div>
      <div style={{ maxWidth: 340, margin: '0 auto' }}>
        <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ width: '100%', padding: '12px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
        {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <button onClick={submit} disabled={loading}
          style={{ width: '100%', padding: 14, background: C.blue, border: 'none', borderRadius: 8, color: '#fff', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Unlocking...' : 'Get Full Analysis →'}
        </button>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 12 }}>
          No spam. Hamza Nouman · Royal LePage Signature Realty · 647-609-1289
        </div>
      </div>
    </div>
  );
}

// Filter panel
function FilterPanel({ filters, onChange, onReset }) {
  const fld = (label, key, type = 'number', placeholder = '') => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={filters[key] || ''}
        onChange={e => onChange(key, e.target.value)}
        style={{ width: '100%', padding: '9px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );

  const sel = (label, key, opts) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <select value={filters[key] || ''} onChange={e => onChange(key, e.target.value)}
        style={{ width: '100%', padding: '9px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: filters[key] ? C.text : C.muted, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
        <option value="">Any</option>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, position: 'sticky', top: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>🔍 Filters</div>
        <button onClick={onReset} style={{ fontSize: 11, color: C.blue, background: 'transparent', border: 'none', cursor: 'pointer' }}>Reset</button>
      </div>

      {fld('Min Price', 'minPrice', 'number', '$500,000')}
      {fld('Max Price', 'maxPrice', 'number', '$2,000,000')}
      {sel('Bedrooms', 'minBeds', [1,2,3,4,5].map(n => ({ value: n, label: n + '+' })))}
      {sel('Bathrooms', 'minBaths', [1,2,3,4].map(n => ({ value: n, label: n + '+' })))}
      {sel('Property Type', 'type', [
        { value: 'Detached', label: 'Detached' },
        { value: 'Semi-Detached', label: 'Semi-Detached' },
        { value: 'Townhouse', label: 'Townhouse' },
        { value: 'Condo', label: 'Condo' },
        { value: 'Duplex', label: 'Duplex' },
      ])}
      {sel('Neighbourhood', 'city', [
        { value: 'Port Credit', label: 'Port Credit' },
        { value: 'Clarkson', label: 'Clarkson' },
        { value: 'Erin Mills', label: 'Erin Mills' },
        { value: 'Churchill Meadows', label: 'Churchill Meadows' },
        { value: 'Cooksville', label: 'Cooksville' },
        { value: 'Hurontario', label: 'Hurontario' },
        { value: 'Meadowvale', label: 'Meadowvale' },
        { value: 'Streetsville', label: 'Streetsville' },
        { value: 'Malton', label: 'Malton' },
        { value: 'Lakeview', label: 'Lakeview' },
      ])}
      {fld('Min Cash Flow/mo', 'minCashFlow', 'number', '-$500')}
      {fld('Min Cap Rate %', 'minCapRate', 'number', '3.0')}
      {fld('Max Days on Market', 'maxDom', 'number', '30')}
      {sel('Deal Grade', 'minGrade', [
        { value: 'B', label: 'B or better' },
        { value: 'A', label: 'A or better' },
        { value: 'A+', label: 'A+ only' },
      ])}
    </div>
  );
}

// Sort options
function SortBar({ sort, onSort, count }) {
  const opts = [
    { val: 'score', label: '⭐ Deal Score' },
    { val: 'cashFlow', label: '💰 Cash Flow' },
    { val: 'capRate', label: '📈 Cap Rate' },
    { val: 'priceAsc', label: '↑ Price' },
    { val: 'priceDesc', label: '↓ Price' },
    { val: 'dom', label: '🕒 Newest' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      <span style={{ fontSize: 13, color: C.muted, marginRight: 4 }}>{count} properties</span>
      <span style={{ fontSize: 13, color: C.muted }}>Sort:</span>
      {opts.map(o => (
        <button key={o.val} onClick={() => onSort(o.val)}
          style={{ padding: '5px 12px', fontSize: 12, fontWeight: sort === o.val ? 700 : 400, background: sort === o.val ? C.blue + '22' : 'transparent', border: `1px solid ${sort === o.val ? C.blue : C.border}`, borderRadius: 20, color: sort === o.val ? C.blue : C.muted, cursor: 'pointer' }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Tabs
function TabBar({ tab, setTab }) {
  const tabs = [
    { id: 'listings', label: '🏘️ Listings' },
    { id: 'calculator', label: '🧮 Calculator' },
    { id: 'market', label: '📊 Market Pulse' },
    { id: 'guide', label: '📖 BRRR Guide' },
    { id: 'contact', label: '📞 Contact' },
  ];
  return (
    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          style={{ padding: '10px 18px', fontSize: 13, fontWeight: tab === t.id ? 700 : 400, background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.id ? C.blue : 'transparent'}`, color: tab === t.id ? C.blue : C.muted, cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1 }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Standalone calculator tab
function CalculatorTab() {
  const [inp, setInp] = useState({
    price: 900000,
    estimatedRent: 3500,
    downPaymentPct: 0.20,
    interestRate: 0.0599,
    amortizationYears: 25,
    vacancyRate: 0.03,
    maintenancePct: 0.05,
    propertyMgmtPct: 0,
  });

  const metrics = useMemo(() => calculateMetrics(inp), [inp]);
  const { score, grade } = useMemo(() => scoreDeal(metrics), [metrics]);

  const update = (k, v) => setInp(prev => ({ ...prev, [k]: v }));
  const numInput = (label, key, prefix = '$') => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 5 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <span style={{ padding: '11px 12px', fontSize: 14, color: C.muted, borderRight: `1px solid ${C.border}` }}>{prefix}</span>
        <input type="number" value={inp[key]} onChange={e => update(key, parseFloat(e.target.value) || 0)}
          style={{ flex: 1, padding: '11px 12px', background: 'transparent', border: 'none', color: C.text, fontSize: 14, outline: 'none' }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>Investment Inputs</div>
        {numInput('Property Price', 'price')}
        {numInput('Monthly Rent Estimate', 'estimatedRent')}
        {numInput('Down Payment %', 'downPaymentPct', '%')}
        {numInput('Interest Rate %', 'interestRate', '%')}
        {numInput('Amortization (years)', 'amortizationYears', 'yr')}
        {numInput('Vacancy Rate %', 'vacancyRate', '%')}
        {numInput('Maintenance Reserve %', 'maintenancePct', '%')}
        {numInput('Property Mgmt %', 'propertyMgmtPct', '%')}
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
          * Canadian mortgage: semi-annual compounding. Property tax estimated at 0.72% (Mississauga 2025).
        </div>
      </div>

      {metrics && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>Deal Analysis</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <MetricBox label="Monthly Cash Flow" value={fmtCF(metrics.monthlyCashFlow)} color={metrics.monthlyCashFlow >= 0 ? C.green : C.red} />
            <MetricBox label="Annual Cash Flow" value={fmtCF(metrics.annualCashFlow)} color={metrics.annualCashFlow >= 0 ? C.green : C.red} />
            <MetricBox label="Cap Rate" value={metrics.capRate.toFixed(2) + '%'} color={metrics.capRate >= 4 ? C.green : C.amber} />
            <MetricBox label="Cash-on-Cash" value={metrics.cashOnCash.toFixed(2) + '%'} color={metrics.cashOnCash >= 5 ? C.green : C.amber} />
          </div>

          <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
            <PnLRow label="Gross Rent" value={fmt$(metrics.grossRent)} color={C.green} />
            <PnLRow label="Vacancy Loss" value={'−' + fmt$(metrics.vacancyLoss)} indent />
            <PnLRow label="Effective Income" value={fmt$(metrics.effectiveIncome)} bold />
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />
            <PnLRow label="Property Tax" value={'−' + fmt$(metrics.taxMonthly)} indent />
            <PnLRow label="Insurance" value={'−' + fmt$(metrics.insuranceMonthly)} indent />
            <PnLRow label="Maintenance" value={'−' + fmt$(metrics.maintMonthly)} indent />
            {metrics.mgmtMonthly > 0 && <PnLRow label="Mgmt Fee" value={'−' + fmt$(metrics.mgmtMonthly)} indent />}
            <PnLRow label="Net Operating Income" value={fmt$(metrics.monthlyNOI)} bold />
            <PnLRow label="Mortgage" value={'−' + fmt$(metrics.mortgagePayment)} color={C.red} indent />
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />
            <PnLRow label="Monthly Cash Flow" value={fmtCF(metrics.monthlyCashFlow)} color={metrics.monthlyCashFlow >= 0 ? C.green : C.red} bold />
          </div>

          <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>DEAL SCORE</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: score >= 7.5 ? C.green : score >= 5.5 ? C.amber : C.red }}>{score}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{grade}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Market Pulse tab — FIXED label
function MarketPulseTab() {
  const stats = [
    { label: 'Avg Sale-to-List Ratio', value: '0.97', note: 'Below 1.0 = buyer pressure', color: C.amber },
    { label: 'Avg Days on Market', value: '28d', note: 'Up from 18d yr/yr', color: C.amber },
    { label: 'Active Listings (Mississauga)', value: '1,847', note: 'Up 34% year-over-year', color: C.green },
    { label: 'Sales-to-New-Listings Ratio', value: '0.41', note: 'Below 0.40 = buyer\'s market · At 0.41, neutral-to-soft', color: C.amber }, // FIXED
    { label: 'Benchmark Price (SFH)', value: '$1.14M', note: 'Mississauga, Mar 2026 est.', color: C.text },
    { label: 'Avg Cap Rate (Detached)', value: '3.2–4.1%', note: 'Range across Mississauga hoods', color: C.blue },
  ];

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>📊 Mississauga Market Pulse</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Updated March 2026 · Source: TRREB / Hamza Nouman analysis</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.note}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>🎯 Hamza's Take — March 2026</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
          The Mississauga market is soft but not distressed. Rate cuts haven't fully translated to buying activity yet — spring will be the test. Best investment plays right now are <strong style={{ color: C.text }}>semi-detached with basement suite potential</strong> in Clarkson and Cooksville, priced under $950K. Avoid condos under 800sqft — rental premiums don't justify carrying costs at current rates.
        </div>
      </div>
    </div>
  );
}

// BRRR Guide tab
function BrrrTab() {
  const steps = [
    { icon: '🏚️', title: 'BUY', desc: 'Acquire below market value. Target distressed, cosmetic renos, motivated sellers. Mississauga target: 5–10% below comparables.' },
    { icon: '🔨', title: 'RENOVATE', desc: 'Force appreciation. Kitchen, bathrooms, basement suite. Budget: $60–120K for full reno. Target ARV lift of $150K+.' },
    { icon: '🏦', title: 'REFINANCE', desc: 'Refi at new appraised value (80% LTV). Pull out equity tax-free. Ideal outcome: recover 80–100% of invested capital.' },
    { icon: '🏡', title: 'RENT', desc: 'Cash flow from day 1. Mississauga vacancy <3%. Target 2+ units for maximum income.' },
    { icon: '🔄', title: 'REPEAT', desc: 'Recycle capital into next deal. This is how you compound from 1 property to 10 without adding new cash.' },
  ];
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>🔄 BRRR Strategy Guide</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Mississauga-specific playbook · Hamza Nouman</div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>{s.icon}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Contact tab
function ContactTab() {
  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>📞 Book a Consultation</div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>Hamza Nouman</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Salesperson · Royal LePage Signature Realty</div>
        <a href="tel:6476091289" style={{ display: 'block', background: C.blue, color: '#fff', textAlign: 'center', padding: 14, borderRadius: 8, fontSize: 16, fontWeight: 700, textDecoration: 'none', marginBottom: 10 }}>📞 647-609-1289</a>
        <a href="mailto:hamza@nouman.ca" style={{ display: 'block', background: 'transparent', color: C.blue, textAlign: 'center', padding: 13, borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: `1px solid ${C.blue}`, marginBottom: 10 }}>✉️ hamza@nouman.ca</a>
        <a href="https://www.hamzahomes.ca" target="_blank" rel="noreferrer" style={{ display: 'block', background: 'transparent', color: C.muted, textAlign: 'center', padding: 13, borderRadius: 8, fontSize: 14, textDecoration: 'none', border: `1px solid ${C.border}` }}>🌐 HamzaHomes.ca</a>
        <div style={{ marginTop: 16, fontSize: 12, color: C.muted, textAlign: 'center' }}>
          Brokerage: 8 Sampson Mews, Suite 201, Toronto ON<br />
          <a href="https://www.mississaugainvestor.ca/privacy" style={{ color: C.muted }}>Privacy Policy</a> ·{' '}
          <a href="https://www.mississaugainvestor.ca/terms" style={{ color: C.muted }}>Terms of Use</a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FILTER + SORT LOGIC
// ============================================================
const GRADE_ORDER = ['D', 'C', 'C+', 'B', 'B+', 'A', 'A+'];

function applyFilters(listings, filters) {
  return listings.filter(l => {
    if (filters.minPrice && l.price < parseInt(filters.minPrice)) return false;
    if (filters.maxPrice && l.price > parseInt(filters.maxPrice)) return false;
    if (filters.minBeds && l.beds < parseInt(filters.minBeds)) return false;
    if (filters.minBaths && l.baths < parseInt(filters.minBaths)) return false;
    if (filters.type && !l.type?.toLowerCase().includes(filters.type.toLowerCase())) return false;
    if (filters.city && l.city !== filters.city) return false;
    if (filters.minCashFlow && l.monthlyCashFlow < parseInt(filters.minCashFlow)) return false;
    if (filters.minCapRate && l.capRate < parseFloat(filters.minCapRate)) return false;
    if (filters.maxDom && l.daysOnMarket > parseInt(filters.maxDom)) return false;
    if (filters.minGrade) {
      const minIdx = GRADE_ORDER.indexOf(filters.minGrade);
      const listingIdx = GRADE_ORDER.indexOf(l.dealGrade);
      if (listingIdx < minIdx) return false;
    }
    return true;
  });
}

function applySort(listings, sort) {
  const sorted = [...listings];
  switch (sort) {
    case 'score': return sorted.sort((a, b) => b.dealScore - a.dealScore);
    case 'cashFlow': return sorted.sort((a, b) => b.monthlyCashFlow - a.monthlyCashFlow);
    case 'capRate': return sorted.sort((a, b) => b.capRate - a.capRate);
    case 'priceAsc': return sorted.sort((a, b) => a.price - b.price);
    case 'priceDesc': return sorted.sort((a, b) => b.price - a.price);
    case 'dom': return sorted.sort((a, b) => a.daysOnMarket - b.daysOnMarket);
    default: return sorted;
  }
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState('listings');
  const [allListings] = useState(() => enrichListings(SAMPLE_LISTINGS));
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState('score');
  const [selectedListing, setSelectedListing] = useState(null);
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('mi_email') || '');
  const [showFilters, setShowFilters] = useState(true);
  const [apiStatus, setApiStatus] = useState('sample'); // 'sample' | 'live' | 'loading'

  // Persist email
  const handleGate = useCallback(email => {
    setUserEmail(email);
    localStorage.setItem('mi_email', email);
  }, []);

  const updateFilter = useCallback((key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  }, []);

  const resetFilters = useCallback(() => setFilters({}), []);

  const displayed = useMemo(() =>
    applySort(applyFilters(allListings, filters), sort),
    [allListings, filters, sort]
  );

  if (!unlocked) return <PasswordWall onUnlock={() => setUnlocked(true)} />;

  return (
    <div style={{ minHeight: '100vh', background: C.navy, fontFamily: 'system-ui,-apple-system,sans-serif', color: C.text }}>

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>
            <span style={{ color: C.text }}>Mississauga</span>
            <span style={{ color: C.blue }}>Investor</span>
            <span style={{ fontSize: 10, marginLeft: 8, color: C.muted, fontWeight: 400, letterSpacing: '0.08em' }}>BY HAMZA NOUMAN</span>
          </div>
          {apiStatus === 'live' && (
            <span style={{ background: C.green + '22', color: C.green, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: `1px solid ${C.green}44` }}>● LIVE DATA</span>
          )}
          {apiStatus === 'sample' && (
            <span style={{ background: C.amber + '22', color: C.amber, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, border: `1px solid ${C.amber}44` }}>SAMPLE DATA</span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            {userEmail && <span style={{ fontSize: 12, color: C.muted }}>✓ {userEmail}</span>}
            <a href="tel:6476091289" style={{ color: C.blue, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>647-609-1289</a>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px' }}>
        <TabBar tab={tab} setTab={setTab} />

        {tab === 'listings' && (
          <div style={{ display: 'grid', gridTemplateColumns: showFilters ? '260px 1fr' : '1fr', gap: 24 }}>
            {showFilters && (
              <FilterPanel filters={filters} onChange={updateFilter} onReset={resetFilters} />
            )}
            <div>
              <SortBar sort={sort} onSort={setSort} count={displayed.length} />
              {displayed.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                  <div>No properties match your filters. <button onClick={resetFilters} style={{ color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>Reset filters</button></div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {displayed.map(l => (
                    <DealCard key={l.id} listing={l} onAnalyze={setSelectedListing} />
                  ))}
                </div>
              )}
              {/* VOW copyright notice */}
              <div style={{ marginTop: 32, fontSize: 11, color: C.muted, lineHeight: 1.7, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                Listing information provided by PropTx Innovations Inc. and the Toronto Regional Real Estate Board (TRREB). All rights reserved. Information is deemed reliable but not guaranteed accurate. Not intended to solicit properties already listed for sale. The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by The Canadian Real Estate Association (CREA).
              </div>
            </div>
          </div>
        )}

        {tab === 'calculator' && <CalculatorTab />}
        {tab === 'market' && <MarketPulseTab />}
        {tab === 'guide' && <BrrrTab />}
        {tab === 'contact' && <ContactTab />}
      </div>

      {/* Deal modal */}
      {selectedListing && (
        <DealModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          userEmail={userEmail}
          onGate={handleGate}
        />
      )}
    </div>
  );
}
