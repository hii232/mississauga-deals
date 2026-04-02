'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { calcMonthly, calculateCashFlow, calculateNOI, calculateCapRate, calculateCashOnCash, calculateBRRR, calculateGRM, getClosingCosts, DEFAULT_ASSUMPTIONS } from '@/lib/cash-flow-engine';
import { scoreColorHex } from '@/lib/deal-score';
import { fmtK, fmtNum } from '@/lib/utils/format';
import { processListings } from '@/lib/listings/process-listings';
import { PropertyJsonLd } from '@/components/seo/json-ld';
import { PhotoLightbox } from '@/components/ui/photo-lightbox';
import { deduplicatePhotos } from '@/lib/utils/dedup-photos';
import { calculateDistance } from '@/lib/sold-comps';

// ──────────────────────────────────────────
//  Auth Gate Overlay
// ──────────────────────────────────────────
function AuthGate({ children, isAuthenticated }) {
  if (isAuthenticated) return children;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm">
        <svg className="mb-3 h-10 w-10 text-navy/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <p className="mb-3 text-sm font-medium text-navy">Sign up to unlock this analysis</p>
        <Link
          href="/signup"
          className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
        >
          Sign up free
        </Link>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
//  Slider Component
// ──────────────────────────────────────────
function Slider({ label, value, onChange, min, max, step, suffix = '' }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm font-semibold text-navy">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}

// ──────────────────────────────────────────
//  Tab Components
// ──────────────────────────────────────────
function OverviewTab({ listing }) {
  const facts = [
    { label: 'Type', value: listing.subType || listing.type },
    { label: 'Bedrooms', value: listing.beds },
    { label: 'Bathrooms', value: listing.baths },
    { label: 'Days on Market', value: listing.dom },
    { label: 'Price Drop', value: listing.priceDrop ? `${listing.priceDrop}%` : 'None' },
    { label: 'Year Built', value: listing.yearBuilt || 'N/A' },
    { label: 'Status', value: listing.status },
    { label: 'Basement Income',
      value: listing.basementTier === 'legal' ? `Legal Suite (+$${(listing.basementIncome || 1200).toLocaleString()}/mo)`
           : listing.basementTier === 'potential' ? `Suite Potential (+$${(listing.basementIncome || 900).toLocaleString()}/mo)`
           : listing.basementTier === 'finished' ? 'Finished Basement'
           : 'None Detected' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Key Facts</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-muted">{f.label}</p>
              <p className={`mt-0.5 text-sm font-semibold ${f.label === 'Basement Income' && listing.basementTier === 'legal' ? 'text-success' : f.label === 'Basement Income' && listing.basementTier === 'potential' ? 'text-accent' : 'text-navy'}`}>{f.value}</p>
            </div>
          ))}
        </div>
      </div>
      {listing.basementIncome > 0 && (
        <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3">
          <p className="text-sm text-success font-medium">
            Potential cash flow includes estimated basement rental income of ${listing.basementIncome.toLocaleString()}/mo
            {listing.basementTier === 'potential' && ' — verify suite legality with the City of Mississauga before relying on this income'}
          </p>
        </div>
      )}
      {listing.remarks && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Remarks</h3>
          <p className="text-sm leading-relaxed text-navy/80">{listing.remarks}</p>
        </div>
      )}
    </div>
  );
}

function HamzaTakeTab({ listing }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">H</div>
        <div>
          <p className="text-sm font-semibold text-navy">Hamza&apos;s Take</p>
          <p className="text-xs text-muted">Investment Perspective</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-navy/80">{listing.hamzaNotes || 'Analysis pending for this property.'}</p>
    </div>
  );
}

function MortgageTab({ listing }) {
  const [downPct, setDownPct] = useState(DEFAULT_ASSUMPTIONS.downPaymentPercent);
  const [rate, setRate] = useState(DEFAULT_ASSUMPTIONS.annualInterestRate);
  const [amort, setAmort] = useState(DEFAULT_ASSUMPTIONS.amortizationYears);
  const [insurance, setInsurance] = useState(DEFAULT_ASSUMPTIONS.monthlyInsurance);
  const [maintenancePct, setMaintenancePct] = useState(DEFAULT_ASSUMPTIONS.maintenancePercent);
  const [vacancyPct, setVacancyPct] = useState(DEFAULT_ASSUMPTIONS.vacancyPercent);
  const [managementPct, setManagementPct] = useState(DEFAULT_ASSUMPTIONS.managementPercent);

  const calc = useMemo(() => {
    const cf = calculateCashFlow(listing.price, listing.estimatedRent, {
      downPct, rate, amortYears: amort,
      annualPropertyTax: listing.annualPropertyTax || null,
      city: listing.neighbourhood,
      monthlyInsurance: insurance,
      maintenancePct, vacancyPct, managementPct,
    });
    const closing = getClosingCosts(listing.price, downPct);
    const cocReturn = calculateCashOnCash(cf.cashFlow * 12, listing.price, downPct);
    return { ...cf, ...closing, cashOnCash: cocReturn };
  }, [listing.price, listing.estimatedRent, listing.annualPropertyTax, listing.neighbourhood, downPct, rate, amort, insurance, maintenancePct, vacancyPct, managementPct]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="Down Payment" value={downPct} onChange={setDownPct} min={20} max={50} step={5} suffix="%" />
        <Slider label="Interest Rate" value={rate} onChange={setRate} min={1} max={10} step={0.25} suffix="%" />
        <Slider label="Amortization" value={amort} onChange={setAmort} min={15} max={30} step={5} suffix=" yr" />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Slider label="Insurance" value={insurance} onChange={setInsurance} min={50} max={500} step={25} suffix="/mo" />
        <Slider label="Maintenance" value={maintenancePct} onChange={setMaintenancePct} min={1} max={15} step={1} suffix="%" />
        <Slider label="Vacancy" value={vacancyPct} onChange={setVacancyPct} min={0} max={15} step={1} suffix="%" />
        <Slider label="Management" value={managementPct} onChange={setManagementPct} min={0} max={12} step={1} suffix="%" />
      </div>
      {downPct < 20 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Canadian lenders require minimum 20% down for investment properties.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ResultCard label="Monthly Mortgage" value={`$${calc.mortgage.toLocaleString()}`} />
        <ResultCard label="Est. Rent" value={`$${listing.estimatedRent.toLocaleString()}`} />
        <ResultCard label="Potential Cash Flow" value={fmtNum(calc.cashFlow)} positive={calc.cashFlow >= 0} />
        <ResultCard label="Cash-on-Cash" value={`${calc.cashOnCash}%`} positive={calc.cashOnCash > 0} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-navy">Monthly Breakdown</h4>
        <div className="space-y-2">
          <BreakdownRow label="Mortgage" value={calc.mortgage} />
          <BreakdownRow label="Property Tax" value={calc.propTax} />
          <BreakdownRow label={`Insurance`} value={calc.insurance} />
          <BreakdownRow label={`Maintenance (${maintenancePct}%)`} value={calc.maintenance} />
          <BreakdownRow label={`Vacancy (${vacancyPct}%)`} value={calc.vacancy} />
          {managementPct > 0 && <BreakdownRow label={`Management (${managementPct}%)`} value={calc.management} />}
          <div className="border-t border-slate-300 pt-2">
            <BreakdownRow label="Total Expenses" value={calc.totalExpenses} bold />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-navy">Total Cash Required to Close</h4>
        <div className="space-y-2">
          <BreakdownRow label="Down Payment" value={calc.downPayment} annual />
          <BreakdownRow label="Ontario Land Transfer Tax" value={calc.ltt} annual />
          <BreakdownRow label="Legal & Title Insurance" value={calc.legalAndTitle} annual />
          <BreakdownRow label="Inspection & Misc" value={calc.inspectionMisc} annual />
          <div className="border-t border-slate-300 pt-2">
            <BreakdownRow label="Total Cash Required" value={calc.totalCashRequired} annual bold />
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted">Land transfer tax calculated for Ontario only. Toronto properties are subject to additional municipal LTT.</p>
      </div>

      <p className="text-[10px] text-muted">Canadian fixed-rate mortgage with semi-annual compounding. All figures are estimates.</p>
    </div>
  );
}

function CapRateTab({ listing }) {
  const [insurance, setInsurance] = useState(DEFAULT_ASSUMPTIONS.monthlyInsurance);
  const [maintenancePct, setMaintenancePct] = useState(DEFAULT_ASSUMPTIONS.maintenancePercent);
  const [vacancyPct, setVacancyPct] = useState(DEFAULT_ASSUMPTIONS.vacancyPercent);
  const [managementPct, setManagementPct] = useState(DEFAULT_ASSUMPTIONS.managementPercent);

  const calc = useMemo(() => {
    const annualPropertyTax = listing.annualPropertyTax || Math.round(listing.price * 0.0084);
    const noiResult = calculateNOI(listing.estimatedRent, {
      annualPropertyTax,
      monthlyInsurance: insurance,
      maintenancePct, vacancyPct, managementPct,
    });
    const capRate = calculateCapRate(noiResult.noi, listing.price);
    const grm = calculateGRM(listing.price, listing.estimatedRent);
    const cocReturn = calculateCashOnCash(
      calculateCashFlow(listing.price, listing.estimatedRent, {
        annualPropertyTax, city: listing.neighbourhood,
        monthlyInsurance: insurance, maintenancePct, vacancyPct, managementPct,
      }).cashFlow * 12,
      listing.price, 20
    );
    return { ...noiResult, capRate, grm, cashOnCash: cocReturn };
  }, [listing.price, listing.estimatedRent, listing.annualPropertyTax, listing.neighbourhood, insurance, maintenancePct, vacancyPct, managementPct]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Slider label="Insurance" value={insurance} onChange={setInsurance} min={50} max={500} step={25} suffix="/mo" />
        <Slider label="Maintenance" value={maintenancePct} onChange={setMaintenancePct} min={1} max={15} step={1} suffix="%" />
        <Slider label="Vacancy" value={vacancyPct} onChange={setVacancyPct} min={0} max={15} step={1} suffix="%" />
        <Slider label="Management" value={managementPct} onChange={setManagementPct} min={0} max={12} step={1} suffix="%" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ResultCard label="Cap Rate" value={`${calc.capRate}%`} />
        <ResultCard label="Annual NOI" value={`$${Math.round(calc.noi).toLocaleString()}`} />
        <ResultCard label="GRM" value={calc.grm} />
        <ResultCard label="Cash-on-Cash" value={`${calc.cashOnCash}%`} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-navy">NOI Breakdown</h4>
        <div className="space-y-2">
          <BreakdownRow label="Gross Rental Income" value={Math.round(calc.annualGrossRent)} annual />
          <BreakdownRow label={`Vacancy (${vacancyPct}%)`} value={Math.round(calc.annualVacancyLoss)} annual negative />
          <div className="border-t border-slate-200 pt-2">
            <BreakdownRow label="Effective Gross Income" value={Math.round(calc.effectiveGrossIncome)} annual bold />
          </div>
          <BreakdownRow label="Property Tax" value={Math.round(calc.annualOpExPropertyTax)} annual negative />
          <BreakdownRow label="Insurance" value={Math.round(calc.annualOpExInsurance)} annual negative />
          <BreakdownRow label={`Maintenance (${maintenancePct}%)`} value={Math.round(calc.annualOpExMaintenance)} annual negative />
          {managementPct > 0 && <BreakdownRow label={`Management (${managementPct}%)`} value={Math.round(calc.annualOpExManagement)} annual negative />}
          <div className="border-t border-slate-300 pt-2">
            <BreakdownRow label="Net Operating Income" value={Math.round(calc.noi)} annual bold />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted">NOI measures property performance independent of financing. It does not include mortgage payments.</p>
    </div>
  );
}

function BRRRTab({ listing, initialARV }) {
  const [renoCost, setRenoCost] = useState(0);
  const [arv, setArv] = useState(initialARV || listing.price);
  const [refinanceLTV, setRefinanceLTV] = useState(80);

  useEffect(() => {
    if (initialARV) setArv(initialARV);
  }, [initialARV]);

  const calc = useMemo(() => calculateBRRR(listing.price, renoCost, arv, refinanceLTV), [listing.price, renoCost, arv, refinanceLTV]);
  const isDefault = renoCost === 0 && arv === listing.price;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-muted">Renovation Cost</label>
          <p className="text-[10px] text-muted mb-1">Enter your estimated renovation budget based on contractor quotes.</p>
          <input
            type="number"
            value={renoCost}
            onChange={(e) => setRenoCost(Number(e.target.value) || 0)}
            placeholder="0"
            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">After Repair Value (ARV)</label>
          <p className="text-[10px] text-muted mb-1">Estimated value after renovations. Research recent sold prices nearby.</p>
          <input
            type="number"
            value={arv}
            onChange={(e) => setArv(Number(e.target.value) || 0)}
            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Refinance LTV</label>
          <Slider label="" value={refinanceLTV} onChange={setRefinanceLTV} min={50} max={80} step={5} suffix="%" />
        </div>
      </div>

      {isDefault ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm text-muted">Enter your renovation budget and after-repair value estimate to see BRRR projections.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ResultCard label="Total Invested" value={fmtK(calc.totalInvested)} />
            <ResultCard label="Equity Created" value={fmtK(calc.equityCreated)} positive={calc.equityCreated > 0} />
            <ResultCard label={`Refinance (${refinanceLTV}% LTV)`} value={fmtK(calc.refinanceAmount)} />
            {calc.cashRecovered > 0
              ? <ResultCard label="Cash Recovered" value={fmtK(calc.cashRecovered)} positive />
              : <ResultCard label="Cash Left in Deal" value={fmtK(calc.cashLeftInDeal)} positive={false} />
            }
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-navy">BRRR Breakdown</h4>
            <div className="space-y-2">
              <BreakdownRow label="Purchase Price" value={listing.price} annual />
              <BreakdownRow label="Renovation Cost" value={renoCost} annual />
              <div className="border-t border-slate-300 pt-2">
                <BreakdownRow label="Total Invested" value={calc.totalInvested} annual bold />
              </div>
              <BreakdownRow label="After Repair Value (ARV)" value={arv} annual />
              <BreakdownRow label={`Refinance Amount (${refinanceLTV}% LTV)`} value={calc.refinanceAmount} annual />
              <div className="border-t border-slate-300 pt-2">
                {calc.cashRecovered > 0
                  ? <BreakdownRow label="Cash Recovered" value={calc.cashRecovered} annual bold />
                  : <BreakdownRow label="Cash Left in Deal" value={calc.cashLeftInDeal} annual bold />
                }
              </div>
              <BreakdownRow label="Equity Created" value={calc.equityCreated} annual />
            </div>
          </div>

          <p className="text-[10px] text-muted">BRRR analysis assumes all-cash initial purchase (standard BRRR strategy).</p>
        </>
      )}
    </div>
  );
}

function ExpertAnalysisTab({ listing }) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCached, setIsCached] = useState(false);

  const fetchAnalysis = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError('');
    setIsCached(false);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          listing: {
            address: listing.address,
            price: listing.price,
            type: listing.type,
            subType: listing.subType,
            beds: listing.beds,
            baths: listing.baths,
            estimatedRent: listing.estimatedRent,
            capRate: listing.capRate,
            cashFlow: listing.cashFlow,
            cashOnCash: listing.cashOnCash,
            dom: listing.dom,
            neighbourhood: listing.neighbourhood,
            hamzaScore: listing.hamzaScore,
            basementTier: listing.basementTier,
            priceDrop: listing.priceDrop,
            remarks: listing.remarks,
          },
          price: listing.price,
          dom: listing.dom,
          force: forceRefresh,
        }),
      });

      const data = await res.json();
      if (data.content?.[0]?.text) {
        setAnalysis(data.content[0].text);
        setIsCached(!!data.cached);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError('Unable to generate analysis. Please try again.');
      }
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [listing]);

  if (analysis) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Expert Analysis</h3>
            {isCached && (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-200 rounded-full px-2 py-0.5">cached</span>
            )}
          </div>
          <div className="prose prose-sm max-w-none text-navy/80 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-navy [&_h2]:mt-4 [&_h2]:mb-1 [&_ul]:mt-1 [&_li]:text-sm">
            <div dangerouslySetInnerHTML={{ __html: analysis.replace(/## /g, '<h2>').replace(/\n- /g, '<br/>• ').replace(/\n/g, '<br/>') }} />
          </div>
        </div>
        <button
          onClick={() => fetchAnalysis(true)}
          className="text-sm font-medium text-accent hover:text-accent-dark"
        >
          Regenerate analysis
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8">
      <svg className="mb-4 h-12 w-12 text-accent/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
      <p className="mb-2 text-sm font-medium text-navy">Get expert analysis on this deal</p>
      <p className="mb-4 text-xs text-muted">AI-powered investment analysis with Mississauga market context</p>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      <button
        onClick={() => fetchAnalysis(false)}
        disabled={loading}
        className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {loading ? 'Analyzing...' : 'Generate Expert Analysis'}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────
//  Sold Comps Tab
// ──────────────────────────────────────────
function SoldCompsTab({ listing, onUseAsARV }) {
  const [comps, setComps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchComps() {
      try {
        const params = new URLSearchParams({
          city: 'Mississauga',
          type: listing.type || '',
          beds: String(listing.beds || 0),
          baths: String(listing.baths || 0),
          postal: (listing.postalCode || '').substring(0, 3),
          limit: '20',
        });
        let res = await fetch('/api/sold-comps?' + params);
        if (!res.ok) throw new Error('Failed to load comps');
        let data = await res.json();

        // If no comps found with postal filter, retry without it for broader area
        if ((data.comps || []).length === 0 && params.get('postal')) {
          params.delete('postal');
          res = await fetch('/api/sold-comps?' + params);
          if (res.ok) data = await res.json();
        }
        // Calculate distance from current listing for each comp
        const enriched = (data.comps || []).map((c) => ({
          ...c,
          distance: calculateDistance(listing.lat, listing.lng, c.lat, c.lng),
        }));
        // Sort by distance (closest first)
        enriched.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        setComps(enriched);
        setStats(data.stats || null);
      } catch {
        setError('Unable to load sold comps for this area.');
      } finally {
        setLoading(false);
      }
    }
    fetchComps();
  }, [listing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <span className="ml-3 text-sm text-muted">Loading sold comps...</span>
      </div>
    );
  }

  if (error || comps.length === 0) {
    return (
      <div className="py-8 text-center">
        <svg className="mx-auto mb-3 h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
        </svg>
        <p className="text-sm text-muted">{error || 'No sold comps found in this area. Try checking nearby cities.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {stats && stats.count > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-muted">Avg Sold Price</p>
            <p className="mt-0.5 text-lg font-bold text-navy">${stats.avgSoldPrice.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-muted">Avg Days to Sell</p>
            <p className="mt-0.5 text-lg font-bold text-navy">{stats.avgDOM}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-muted">Avg Negotiation</p>
            <p className={`mt-0.5 text-lg font-bold ${stats.avgNegotiationGap <= 0 ? 'text-success' : 'text-danger'}`}>
              {stats.avgNegotiationGap > 0 ? '+' : ''}{stats.avgNegotiationGap}%
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-muted">Comps Found</p>
            <p className="mt-0.5 text-lg font-bold text-navy">{stats.count}</p>
          </div>
        </div>
      )}

      {/* Current Listing Context */}
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
        <p className="text-xs font-medium text-accent">Current listing: {listing.address} — ${listing.price.toLocaleString()}</p>
      </div>

      {/* Comps Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-muted">Address</th>
              <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-muted">Sold</th>
              <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-muted">List</th>
              <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-muted">Gap</th>
              <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-muted">DOM</th>
              <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-muted">Date</th>
              <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-muted">Dist.</th>
              <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-muted">ARV</th>
            </tr>
          </thead>
          <tbody>
            {comps.map((comp) => (
              <tr key={comp.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2.5 pr-4">
                  <p className="font-medium text-navy">{comp.address}</p>
                  <p className="text-xs text-muted">{comp.beds}bd / {comp.baths}ba</p>
                </td>
                <td className="py-2.5 pr-4 font-semibold text-navy">
                  ${comp.closePrice.toLocaleString()}
                </td>
                <td className="py-2.5 pr-4 text-muted">
                  ${comp.listPrice.toLocaleString()}
                </td>
                <td className={`py-2.5 pr-4 font-medium ${comp.priceDelta <= 0 ? 'text-success' : 'text-danger'}`}>
                  {comp.priceDelta > 0 ? '+' : ''}{comp.priceDelta}%
                </td>
                <td className="py-2.5 pr-4 text-muted">{comp.dom}d</td>
                <td className="py-2.5 pr-4 text-muted whitespace-nowrap">
                  {comp.closeDate ? new Date(comp.closeDate).toLocaleDateString('en-CA') : 'N/A'}
                </td>
                <td className="py-2.5 pr-4 text-muted">
                  {comp.distance !== null ? comp.distance + ' km' : '—'}
                </td>
                <td className="py-2.5">
                  <button
                    onClick={() => onUseAsARV && onUseAsARV(comp.closePrice)}
                    className="rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition"
                    title="Use this sold price as ARV in BRRR calculator"
                  >
                    Use
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted">
        Showing {comps.length} recently sold comparable properties in {listing.city || 'Mississauga'}.
        Sorted by distance from current listing.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────
//  Price History Tab
// ──────────────────────────────────────────
function PriceHistoryTab({ listing }) {
  const [history, setHistory] = useState([]);
  const [appreciation, setAppreciation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      try {
        // Parse address into components
        // Format from AMPRE: "UnitNumber- StreetNumber StreetName StreetSuffix"
        // e.g. "123- 3045 Confederation Pkwy" or "3045 Confederation Pkwy"
        const parts = (listing.address || '').split(' ').filter(Boolean);
        let unit = '';
        let startIdx = 0;

        // First part ending with '-' is the unit number (e.g. "123-")
        if (parts[0] && parts[0].endsWith('-')) {
          unit = parts[0].replace(/-$/, '');
          startIdx = 1;
        } else if (parts[0] && parts[0].includes('-')) {
          // Format "unit-streetnum" (e.g. "123-3045")
          const [u, sn] = parts[0].split('-');
          unit = u;
          parts[0] = sn; // replace with just the street number
        }

        const actualNumber = parts[startIdx] || '';
        // Street name is everything after the street number, excluding the last word (suffix like Dr, Ave, Pkwy)
        const nameParts = parts.slice(startIdx + 1);
        // Use just the core street name (drop suffix for better AMPRE contains() matching)
        const streetName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts.join(' ');

        if (!streetName) {
          setError('Unable to parse address for history lookup.');
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          streetNumber: actualNumber,
          streetName,
          city: 'Mississauga',
        });
        if (unit) params.set('unit', unit);

        const res = await fetch('/api/price-history?' + params);
        if (!res.ok) throw new Error('Failed to load history');
        const data = await res.json();
        setHistory(data.history || []);
        setAppreciation(data.appreciation || null);
      } catch {
        setError('Unable to load price history for this property.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [listing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <span className="ml-3 text-sm text-muted">Loading price history...</span>
      </div>
    );
  }

  if (error || history.length === 0) {
    return (
      <div className="py-8 text-center">
        <svg className="mx-auto mb-3 h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <p className="text-sm text-muted">{error || 'No historical listing data found for this property.'}</p>
      </div>
    );
  }

  const eventColors = {
    'Sold': 'bg-success text-white',
    'For Sale': 'bg-accent text-white',
    'Terminated': 'bg-danger text-white',
    'Expired': 'bg-slate-400 text-white',
    'Pending': 'bg-gold text-white',
    'Listed': 'bg-accent text-white',
  };

  return (
    <div className="space-y-6">
      {/* Appreciation Summary */}
      {appreciation && (
        <div className="rounded-lg border border-success/20 bg-success/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
              <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">
                {appreciation.annualizedRate > 0 ? '+' : ''}{appreciation.annualizedRate}% annualized appreciation
              </p>
              <p className="text-xs text-muted">
                ${appreciation.fromPrice.toLocaleString()} → ${appreciation.toPrice.toLocaleString()} over {appreciation.years} years
                ({appreciation.totalChange > 0 ? '+' : ''}{appreciation.totalChange}% total)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
        <div className="space-y-4">
          {history.map((entry, i) => (
            <div key={entry.id + '-' + i} className="relative flex gap-4 pl-10">
              {/* Timeline dot */}
              <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-white bg-slate-300"
                style={{
                  backgroundColor: entry.event === 'Sold' ? '#10B981'
                    : entry.event === 'Terminated' ? '#EF4444'
                    : entry.event === 'For Sale' ? '#2563EB'
                    : '#94A3B8'
                }}
              />
              {/* Content */}
              <div className="flex-1 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${eventColors[entry.event] || 'bg-slate-200 text-slate-700'}`}>
                    {entry.event}
                  </span>
                  <span className="text-xs text-muted">
                    {entry.date ? new Date(entry.date).toLocaleDateString('en-CA') : 'Date unknown'}
                  </span>
                  {entry.dom > 0 && (
                    <span className="text-xs text-muted">· {entry.dom} DOM</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-3">
                  {entry.event === 'Sold' && entry.closePrice ? (
                    <>
                      <p className="text-lg font-bold text-navy">${entry.closePrice.toLocaleString()}</p>
                      {entry.listPrice > 0 && entry.listPrice !== entry.closePrice && (
                        <p className="text-xs text-muted">
                          Listed: ${entry.listPrice.toLocaleString()}
                          <span className={`ml-1 font-medium ${entry.closePrice <= entry.listPrice ? 'text-success' : 'text-danger'}`}>
                            ({(((entry.closePrice - entry.listPrice) / entry.listPrice) * 100).toFixed(1)}%)
                          </span>
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-lg font-bold text-navy">${entry.listPrice.toLocaleString()}</p>
                  )}
                </div>
                {entry.brokerage && (
                  <p className="mt-1 text-[11px] text-muted">{entry.brokerage}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted">
        Showing {history.length} historical listing event{history.length !== 1 ? 's' : ''} for this property.
        Data sourced from TRREB MLS.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────
//  Shared UI Components
// ──────────────────────────────────────────
function ResultCard({ label, value, positive }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${positive === true ? 'text-success' : positive === false ? 'text-danger' : 'text-navy'}`}>
        {value}
      </p>
    </div>
  );
}

function BreakdownRow({ label, value, bold, annual, negative }) {
  const formatted = annual
    ? `$${Math.abs(value).toLocaleString()}`
    : `$${Math.abs(value).toLocaleString()}/mo`;
  return (
    <div className={`flex items-center justify-between text-sm ${bold ? 'font-semibold text-navy' : 'text-navy/70'}`}>
      <span>{label}</span>
      <span className={negative ? 'text-danger' : ''}>{negative ? `-${formatted}` : formatted}</span>
    </div>
  );
}

// ──────────────────────────────────────────
//  Photo Gallery
// ──────────────────────────────────────────
function PhotoGallery({ photos, listingId }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [fetchedPhotos, setFetchedPhotos] = useState(null);

  // Fetch photos from API if listing has none
  useEffect(() => {
    if (photos?.length > 0 || !listingId) return;
    let cancelled = false;
    async function loadPhotos() {
      try {
        const res = await fetch('/api/photos-all?id=' + encodeURIComponent(listingId));
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.photos?.length > 0) {
          setFetchedPhotos(data.photos);
        }
      } catch {
        // silently fail
      }
    }
    loadPhotos();
    return () => { cancelled = true; };
  }, [photos, listingId]);

  const resolvedPhotos = photos?.length > 0 ? photos : fetchedPhotos;
  const dedupedPhotos = resolvedPhotos?.length ? deduplicatePhotos(resolvedPhotos) : null;
  const images = dedupedPhotos?.length ? dedupedPhotos : ['/images/placeholder-property.jpg'];
  const hasRealPhotos = dedupedPhotos?.length > 0;

  return (
    <div className="space-y-3 w-full min-w-0">
      <div
        className="relative aspect-[4/3] sm:aspect-[16/10] max-h-[50vh] sm:max-h-[55vh] lg:max-h-none overflow-hidden rounded-xl bg-slate-200 cursor-pointer w-full"
        onClick={() => hasRealPhotos && setLightboxOpen(true)}
      >
        <img
          src={images[activeIdx]}
          alt="Property photo"
          className="h-full w-full object-cover object-center"
          onError={(e) => { e.target.src = '/images/placeholder-property.jpg'; }}
        />
        {/* Photo count overlay */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {activeIdx + 1} / {images.length} — Click to enlarge
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`h-12 w-16 sm:h-16 sm:w-20 flex-shrink-0 overflow-hidden rounded-md sm:rounded-lg border-2 transition ${
                i === activeIdx ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={src}
                alt={`Thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
                onError={(e) => { e.target.src = '/images/placeholder-property.jpg'; }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && hasRealPhotos && (
        <PhotoLightbox
          photos={images}
          initialIndex={activeIdx}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────
//  Main Detail Page
// ──────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Overview', gated: false },
  { key: 'comps', label: 'Sold Comps', gated: true },
  { key: 'history', label: 'Price History', gated: false },
  { key: 'mortgage', label: 'Mortgage', gated: true },
  { key: 'caprate', label: 'Cap Rate', gated: true },
  { key: 'brrr', label: 'BRRR', gated: true },
  { key: 'expert', label: 'Expert Analysis', gated: true },
];

export default function PropertyDetailPage() {
  const params = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [arvFromComps, setArvFromComps] = useState(null);

  useEffect(() => {
    const registered = typeof window !== 'undefined' && localStorage.getItem('user_registered') === 'true';
    setIsAuthenticated(registered);
  }, []);

  useEffect(() => {
    async function fetchListing() {
      try {
        let found = null;

        // Fast path: try single-listing API first (direct AMPRE lookup, ~300ms)
        try {
          const singleRes = await fetch('/api/listing-single?id=' + encodeURIComponent(params.id));
          if (singleRes.ok) {
            const singleData = await singleRes.json();
            if (singleData.listing) {
              const enriched = processListings([singleData.listing]);
              found = enriched[0] || null;
            }
          }
        } catch { /* fall through to bulk lookup */ }

        // Fallback: search Mississauga listings (for full processed data with rent estimates)
        if (!found) {
          const res = await fetch('/api/listings?limit=200&page=1');
          if (res.ok) {
            const data = await res.json();
            const raw = data.listings || data || [];
            const totalPages = data.pages || 1;

            let processed = processListings(raw);
            found = processed.find((l) => String(l.id) === String(params.id));

            if (!found && totalPages > 1) {
              for (let p = 2; p <= totalPages; p++) {
                const r = await fetch('/api/listings?limit=200&page=' + p);
                if (!r.ok) continue;
                const pg = await r.json();
                if (pg?.listings?.length) {
                  const batch = processListings(pg.listings);
                  found = batch.find((l) => String(l.id) === String(params.id));
                  if (found) break;
                }
              }
            }
          }
        }

        if (!found) {
          setError('Property not found.');
        } else {
          setListing(found);
        }
      } catch {
        setError('Failed to load property details.');
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [params.id]);

  async function handleShare() {
    if (!listing) return;
    const url = window.location.href;
    const text = `Check out this investment property: ${listing.address} - ${fmtK(listing.price)}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: listing.address, text, url });
        return;
      } catch {
        // User cancelled or not supported, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied!');
      setTimeout(() => setShareMsg(''), 2000);
    } catch {
      setShareMsg('Could not copy link');
      setTimeout(() => setShareMsg(''), 2000);
    }
  }

  function handleSave() {
    if (!listing) return;
    const savedDeals = JSON.parse(localStorage.getItem('saved_deals') || '[]');
    if (saved) {
      const filtered = savedDeals.filter((id) => id !== listing.id);
      localStorage.setItem('saved_deals', JSON.stringify(filtered));
      setSaved(false);
    } else {
      savedDeals.push(listing.id);
      localStorage.setItem('saved_deals', JSON.stringify(savedDeals));
      setSaved(true);
    }
  }

  useEffect(() => {
    if (listing) {
      const savedDeals = JSON.parse(localStorage.getItem('saved_deals') || '[]');
      setSaved(savedDeals.includes(listing.id));
    }
  }, [listing]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-cloud">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center">
          <p className="text-lg text-navy">{error || 'Property not found.'}</p>
          <Link href="/listings" className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-dark">
            Back to listings
          </Link>
        </div>
      </main>
    );
  }

  const scoreColor = scoreColorHex(listing.hamzaScore);
  const isPremium = listing.hamzaScore >= 7;
  const isGated = !isAuthenticated && isPremium;

  return (
    <main className="min-h-screen bg-cloud overflow-x-hidden">
      <PropertyJsonLd listing={listing} />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 w-full">
        {/* Back Link */}
        <Link href="/listings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-dark">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to listings
        </Link>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Column: Photos */}
          <div className="lg:col-span-3 min-w-0">
            <PhotoGallery photos={listing.photos} listingId={listing.id} />
          </div>

          {/* Right Column: Header Info */}
          <div className="lg:col-span-2 min-w-0">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              {/* Score Badge — always visible */}
              <div className="mb-4 flex items-start justify-between">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white"
                  style={{ backgroundColor: scoreColor }}
                >
                  {listing.hamzaScore}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="rounded-lg border border-slate-200 p-2 text-muted transition hover:bg-slate-50 hover:text-navy"
                    title="Share"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleSave}
                    className={`rounded-lg border p-2 transition ${
                      saved
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-slate-200 text-muted hover:bg-slate-50 hover:text-navy'
                    }`}
                    title={saved ? 'Unsave' : 'Save deal'}
                  >
                    <svg className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                    </svg>
                  </button>
                </div>
              </div>
              {shareMsg && (
                <p className="mb-2 text-xs font-medium text-success">{shareMsg}</p>
              )}

              {/* Address & Price */}
              <h1 className="font-heading text-xl font-bold text-navy">{listing.address}</h1>
              <p className="mt-1 text-sm text-muted">{listing.neighbourhood}</p>
              <p className="mt-3 font-heading text-2xl font-bold text-navy">
                ${listing.price.toLocaleString()}
              </p>

              {/* Quick Stats */}
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-navy">
                  {listing.subType || listing.type}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-navy">
                  {listing.beds} bed / {listing.baths} bath
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-navy">
                  {listing.dom} DOM
                </span>
              </div>

              {/* Key Metrics */}
              {!isGated ? (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="text-center">
                    <p className="text-xs text-muted">Cap Rate</p>
                    <p className="text-sm font-bold text-navy">{listing.capRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted">Potential CF</p>
                    <p className={`text-sm font-bold ${listing.cashFlow >= 0 ? 'text-success' : 'text-danger'}`}>
                      {fmtNum(listing.cashFlow)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted">Est. Rent</p>
                    <p className="text-sm font-bold text-navy">${listing.estimatedRent.toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center justify-center rounded-lg bg-slate-50 py-4 sm:py-5">
                  <p className="mb-2 text-xs font-medium text-navy">This is a premium deal</p>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-accent px-4 py-2 text-center text-xs font-semibold text-white shadow-md transition-colors hover:bg-accent/90 no-underline"
                  >
                    Sign up free to unlock analysis
                  </Link>
                  <p className="mt-1 text-[10px] text-slate-500">See cash flow, cap rate & deal score</p>
                </div>
              )}

              {/* Brokerage Attribution */}
              {listing.brokerage && (
                <p className="mt-5 border-t border-slate-100 pt-3 text-[11px] text-muted">
                  Listed by {listing.brokerage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8">
          {/* Tab Bar */}
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 border border-slate-200 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-muted hover:bg-slate-50 hover:text-navy'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            {activeTab === 'overview' && <OverviewTab listing={listing} />}
            {activeTab === 'comps' && (
              <AuthGate isAuthenticated={!isGated}>
                <SoldCompsTab
                  listing={listing}
                  onUseAsARV={(price) => {
                    setArvFromComps(price);
                    setActiveTab('brrr');
                  }}
                />
              </AuthGate>
            )}
            {activeTab === 'history' && <PriceHistoryTab listing={listing} />}
            {activeTab === 'mortgage' && (
              <AuthGate isAuthenticated={!isGated}>
                <MortgageTab listing={listing} />
              </AuthGate>
            )}
            {activeTab === 'caprate' && (
              <AuthGate isAuthenticated={!isGated}>
                <CapRateTab listing={listing} />
              </AuthGate>
            )}
            {activeTab === 'brrr' && (
              <AuthGate isAuthenticated={!isGated}>
                <BRRRTab listing={listing} initialARV={arvFromComps} />
              </AuthGate>
            )}
            {activeTab === 'expert' && (
              <AuthGate isAuthenticated={!isGated}>
                <ExpertAnalysisTab listing={listing} />
              </AuthGate>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ──────────────────────────────────────────
//  Loading Skeleton (inline fallback)
// ──────────────────────────────────────────
function DetailSkeleton() {
  return (
    <main className="min-h-screen bg-cloud">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="aspect-[16/10] animate-pulse rounded-xl bg-slate-200" />
          </div>
          <div className="lg:col-span-2">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
              <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="flex gap-3">
                <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
                <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="h-7 w-16 animate-pulse rounded-full bg-slate-200" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="h-12 animate-pulse rounded bg-slate-200" />
                <div className="h-12 animate-pulse rounded bg-slate-200" />
                <div className="h-12 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 w-24 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </main>
  );
}
