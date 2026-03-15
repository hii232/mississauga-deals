'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { calcMonthly, calculateCashFlow, calculateNOI, calculateCapRate, calculateCashOnCash, calculateBRRR } from '@/lib/cash-flow-engine';
import { scoreColorHex } from '@/lib/deal-score';
import { fmtK, fmtNum } from '@/lib/utils/format';
import { processListings } from '@/lib/listings/process-listings';
import { PhotoLightbox } from '@/components/ui/photo-lightbox';
import { deduplicatePhotos } from '@/lib/utils/dedup-photos';

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
    { label: 'Suite Potential', value: listing.hasSuite ? 'Yes' : 'No' },
  ];

  return (
    <div className="space-y-6">
      {listing.remarks && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Remarks</h3>
          <p className="text-sm leading-relaxed text-navy/80">{listing.remarks}</p>
        </div>
      )}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Key Facts</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-muted">{f.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-navy">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
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
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(5.5);
  const [amort, setAmort] = useState(25);

  const calc = useMemo(() => {
    const monthly = calcMonthly(listing.price, downPct, rate, amort);
    const cf = calculateCashFlow(listing.price, listing.estimatedRent, downPct, rate, amort);
    return { monthly, ...cf, downPayment: listing.price * (downPct / 100) };
  }, [listing.price, listing.estimatedRent, downPct, rate, amort]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="Down Payment" value={downPct} onChange={setDownPct} min={5} max={50} step={5} suffix="%" />
        <Slider label="Interest Rate" value={rate} onChange={setRate} min={3} max={8} step={0.25} suffix="%" />
        <Slider label="Amortization" value={amort} onChange={setAmort} min={15} max={30} step={5} suffix=" yr" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ResultCard label="Down Payment" value={fmtK(calc.downPayment)} />
        <ResultCard label="Monthly Mortgage" value={`$${calc.mortgage.toLocaleString()}`} />
        <ResultCard label="Est. Rent" value={`$${listing.estimatedRent.toLocaleString()}`} />
        <ResultCard label="Cash Flow" value={fmtNum(calc.cashFlow)} positive={calc.cashFlow >= 0} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-navy">Monthly Breakdown</h4>
        <div className="space-y-2">
          <BreakdownRow label="Mortgage" value={calc.mortgage} />
          <BreakdownRow label="Property Tax" value={calc.propTax} />
          <BreakdownRow label="Insurance" value={calc.insurance} />
          <BreakdownRow label="Maintenance (5%)" value={calc.maintenance} />
          <BreakdownRow label="Vacancy (4%)" value={calc.vacancy} />
          <div className="border-t border-slate-300 pt-2">
            <BreakdownRow label="Total Expenses" value={calc.totalExpenses} bold />
          </div>
        </div>
      </div>
    </div>
  );
}

function CapRateTab({ listing }) {
  const [vacancyRate, setVacancyRate] = useState(9);
  const [opexRate, setOpexRate] = useState(30);

  const calc = useMemo(() => {
    const vr = vacancyRate / 100;
    const or = opexRate / 100;
    const gri = listing.estimatedRent * 12;
    const egi = gri * (1 - vr);
    const opex = egi * or;
    const noi = egi - opex;
    const capRate = calculateCapRate(noi, listing.price);
    const grm = listing.price / gri;
    const cashOnCash = calculateCashOnCash(
      (listing.estimatedRent - calcMonthly(listing.price) - Math.round((listing.price * 0.0095) / 12) - Math.round((listing.price * 0.003) / 12) - Math.round(listing.estimatedRent * 0.05) - Math.round(listing.estimatedRent * 0.04)) * 12,
      listing.price,
      20
    );
    return { gri, egi, opex, noi, capRate, grm, cashOnCash };
  }, [listing.price, listing.estimatedRent, vacancyRate, opexRate]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Vacancy Rate" value={vacancyRate} onChange={setVacancyRate} min={0} max={20} step={1} suffix="%" />
        <Slider label="Operating Expenses" value={opexRate} onChange={setOpexRate} min={15} max={50} step={1} suffix="%" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ResultCard label="Cap Rate" value={`${calc.capRate}%`} />
        <ResultCard label="NOI" value={`$${Math.round(calc.noi).toLocaleString()}`} />
        <ResultCard label="GRM" value={calc.grm.toFixed(1)} />
        <ResultCard label="Cash-on-Cash" value={`${calc.cashOnCash}%`} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-navy">NOI Breakdown</h4>
        <div className="space-y-2">
          <BreakdownRow label="Gross Rental Income" value={Math.round(calc.gri)} annual />
          <BreakdownRow label={`Vacancy (${vacancyRate}%)`} value={Math.round(calc.gri - calc.egi)} annual negative />
          <BreakdownRow label="Effective Gross Income" value={Math.round(calc.egi)} annual />
          <BreakdownRow label={`Operating Expenses (${opexRate}%)`} value={Math.round(calc.opex)} annual negative />
          <div className="border-t border-slate-300 pt-2">
            <BreakdownRow label="Net Operating Income" value={Math.round(calc.noi)} annual bold />
          </div>
        </div>
      </div>
    </div>
  );
}

function BRRRTab({ listing }) {
  const [renoCost, setRenoCost] = useState(50000);
  const [arv, setArv] = useState(Math.round(listing.price * 1.2));

  const calc = useMemo(() => calculateBRRR(listing.price, renoCost, arv), [listing.price, renoCost, arv]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted">Renovation Cost</label>
          <input
            type="number"
            value={renoCost}
            onChange={(e) => setRenoCost(Number(e.target.value))}
            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">After Repair Value (ARV)</label>
          <input
            type="number"
            value={arv}
            onChange={(e) => setArv(Number(e.target.value))}
            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ResultCard label="Total Invested" value={fmtK(calc.totalInvested)} />
        <ResultCard label="Equity Gain" value={fmtK(calc.equityGain)} positive={calc.equityGain > 0} />
        <ResultCard label="Refinance (80% LTV)" value={fmtK(calc.refinanceAmount)} />
        <ResultCard label="Cash Recovered" value={fmtK(calc.cashRecovered)} positive={calc.cashRecovered > 0} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-navy">BRRR Breakdown</h4>
        <div className="space-y-2">
          <BreakdownRow label="Purchase Price" value={listing.price} annual />
          <BreakdownRow label="Renovation Cost" value={renoCost} annual />
          <div className="border-t border-slate-300 pt-2">
            <BreakdownRow label="Total Invested" value={calc.totalInvested} annual bold />
          </div>
          <BreakdownRow label="After Repair Value" value={arv} annual />
          <BreakdownRow label="Refinance Amount (80% LTV)" value={calc.refinanceAmount} annual />
          <div className="border-t border-slate-300 pt-2">
            <BreakdownRow label="Cash Left In Deal" value={calc.cashLeftIn} annual bold />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpertAnalysisTab({ listing }) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a real estate investment analyst specializing in Mississauga, Ontario. Provide concise, actionable analysis for investors. Focus on cash flow, appreciation potential, risks, and strategy recommendations. Keep it under 300 words.',
          prompt: `Analyze this Mississauga investment property:\n\nAddress: ${listing.address}\nPrice: $${listing.price.toLocaleString()}\nType: ${listing.type} (${listing.subType || 'N/A'})\nBeds/Baths: ${listing.beds}/${listing.baths}\nEst. Rent: $${listing.estimatedRent.toLocaleString()}/mo\nCap Rate: ${listing.capRate}%\nCash Flow: ${fmtNum(listing.cashFlow)}\nDOM: ${listing.dom}\nNeighbourhood: ${listing.neighbourhood}\nDeal Score: ${listing.hamzaScore}/10\nHas Suite: ${listing.hasSuite ? 'Yes' : 'No'}\nRemarks: ${listing.remarks?.substring(0, 400) || 'N/A'}\n\nProvide: 1) Quick verdict 2) Key strengths 3) Key risks 4) Recommended strategy`,
        }),
      });

      const data = await res.json();
      if (data.content?.[0]?.text) {
        setAnalysis(data.content[0].text);
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
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Expert Analysis</h3>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-navy/80">{analysis}</div>
        </div>
        <button
          onClick={fetchAnalysis}
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
      <p className="mb-4 text-xs text-muted">Powered by advanced real estate analysis</p>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      <button
        onClick={fetchAnalysis}
        disabled={loading}
        className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {loading ? 'Analyzing...' : 'Generate Expert Analysis'}
      </button>
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
    <div className="space-y-3">
      <div
        className="relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-200 cursor-pointer"
        onClick={() => hasRealPhotos && setLightboxOpen(true)}
      >
        <img
          src={images[activeIdx]}
          alt="Property photo"
          className="h-full w-full object-cover"
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
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
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
  { key: 'hamza', label: "Hamza's Take", gated: false },
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

  useEffect(() => {
    const registered = typeof window !== 'undefined' && localStorage.getItem('user_registered') === 'true';
    setIsAuthenticated(registered);
  }, []);

  useEffect(() => {
    async function fetchListing() {
      try {
        // Fetch page 1 to get total pages
        const res = await fetch('/api/listings?limit=200&page=1');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const raw = data.listings || data || [];
        const totalPages = data.pages || 1;

        // Check first page
        let processed = processListings(raw);
        let found = processed.find((l) => String(l.id) === String(params.id));

        // Paginate through remaining pages if not found
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

  return (
    <main className="min-h-screen bg-cloud">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link href="/listings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-dark">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to listings
        </Link>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Column: Photos */}
          <div className="lg:col-span-3">
            <PhotoGallery photos={listing.photos} listingId={listing.id} />
          </div>

          {/* Right Column: Header Info */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              {/* Score Badge */}
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
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-muted">Cap Rate</p>
                  <p className="text-sm font-bold text-navy">{listing.capRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted">Cash Flow</p>
                  <p className={`text-sm font-bold ${listing.cashFlow >= 0 ? 'text-success' : 'text-danger'}`}>
                    {fmtNum(listing.cashFlow)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted">Est. Rent</p>
                  <p className="text-sm font-bold text-navy">${listing.estimatedRent.toLocaleString()}</p>
                </div>
              </div>

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
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 border border-slate-200">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
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
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            {activeTab === 'overview' && <OverviewTab listing={listing} />}
            {activeTab === 'hamza' && <HamzaTakeTab listing={listing} />}
            {activeTab === 'mortgage' && (
              <AuthGate isAuthenticated={isAuthenticated}>
                <MortgageTab listing={listing} />
              </AuthGate>
            )}
            {activeTab === 'caprate' && (
              <AuthGate isAuthenticated={isAuthenticated}>
                <CapRateTab listing={listing} />
              </AuthGate>
            )}
            {activeTab === 'brrr' && (
              <AuthGate isAuthenticated={isAuthenticated}>
                <BRRRTab listing={listing} />
              </AuthGate>
            )}
            {activeTab === 'expert' && (
              <AuthGate isAuthenticated={isAuthenticated}>
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
