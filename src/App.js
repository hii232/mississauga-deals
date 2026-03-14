// MississaugaInvestor.ca — App.js v17
// KEY FIX: Fetches REAL TREB listings from /api/listings on load
// Real MLS photos, real addresses, real prices from PropTx VOW feed
// Falls back to sample data only if API unavailable
// All v16 UI kept: dark theme, X/10 score, AI analyzer, filters
// UPLOAD: drag-drop to GitHub → src/App.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ─── COLORS ──────────────────────────────────────────────────────────────
const C = {
  blue: '#3B82F6', blueDim: '#1E3A5F',
  gold: '#F59E0B', goldDim: '#78350F',
  navy: '#05091A', surface: '#0C1429',
  card: '#111D32', cardHov: '#162040',
  border: '#1E2D47',
  text: '#E2E8F0', textSec: '#94A3B8', muted: '#4B6180',
  green: '#10B981', greenDim: '#022C22',
  red: '#EF4444', redDim: '#2D1015',
  amber: '#F59E0B', amberDim: '#2D1F00',
  purple: '#8B5CF6', purpleDim: '#2E1065',
  white: '#FFFFFF',
};

// ─── CANADIAN MORTGAGE ───────────────────────────────────────────────────
function calcMetrics({ price, rent, dpPct=0.20, rate=0.0599, years=25, taxRate=0.0072, ins=175, maintPct=0.05, vacRate=0.03, mgmtPct=0 }) {
  if (!price || !rent) return null;
  const dp = price * dpPct;
  const loan = price - dp;
  const closing = price * 0.015;
  const cashIn = dp + closing;
  const effAnn = Math.pow(1 + rate/2, 2) - 1;
  const mr = Math.pow(1 + effAnn, 1/12) - 1;
  const n = years * 12;
  const mtg = loan * (mr * Math.pow(1+mr,n)) / (Math.pow(1+mr,n)-1);
  const annualEquity = (mtg - loan * mr) * 12;
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
  const totalReturn = ((cf * 12 + annualEquity) / cashIn) * 100;
  return {
    dp:Math.round(dp), loan:Math.round(loan), cashIn:Math.round(cashIn), closing:Math.round(closing),
    mtg:Math.round(mtg), gross:Math.round(gross), vac:Math.round(vac), eff:Math.round(eff),
    tax:Math.round(tax), ins:Math.round(ins), maint:Math.round(maint), mgmt:Math.round(mgmt),
    opex:Math.round(opex), noi:Math.round(noi), noiYear:Math.round(noi*12),
    cf:Math.round(cf), cfYear:Math.round(cf*12),
    capRate:parseFloat(capRate.toFixed(2)), coc:parseFloat(coc.toFixed(2)),
    grm:parseFloat(grm.toFixed(1)), annualEquity:Math.round(annualEquity),
    totalReturn:parseFloat(totalReturn.toFixed(2)),
  };
}

// ─── MISSISSAUGA-CALIBRATED DEAL SCORING ────────────────────────────────
// 90% of Mississauga properties don't cashflow. Breakeven = good deal.
// Suite/duplex/separate entrance = significant bonus.
function getDealScore(m, listing={}) {
  if (!m) return { s: 0, label: 'N/A' };
  let v = 5.0;

  // Cap rate (Mississauga avg 3–4%)
  if (m.capRate >= 5.5) v += 2.5;
  else if (m.capRate >= 4.5) v += 1.8;
  else if (m.capRate >= 4.0) v += 1.2;
  else if (m.capRate >= 3.5) v += 0.7;
  else if (m.capRate >= 3.0) v += 0.2;
  else if (m.capRate < 2.5) v -= 0.5;

  // Cash flow — LENIENT for Mississauga
  if (m.cf >= 500) v += 2.0;
  else if (m.cf >= 200) v += 1.5;
  else if (m.cf >= 0)   v += 1.0;   // breakeven = great
  else if (m.cf >= -300) v += 0.5;  // very good for Mississauga
  else if (m.cf >= -600) v += 0.0;  // average
  else if (m.cf >= -1000) v -= 0.3;
  else if (m.cf >= -1500) v -= 0.7;
  else if (m.cf >= -2000) v -= 1.0;
  else v -= 1.5;

  // Suite / income potential — KEY for Mississauga
  const notes = ((listing.notes || '') + ' ' + (listing.remarks || '')).toLowerCase();
  const hasSuite = listing.hasSuite
    || notes.includes('basement suite') || notes.includes('separate entrance')
    || notes.includes('legal suite') || notes.includes('in-law suite')
    || notes.includes('duplex') || notes.includes('two unit')
    || notes.includes('second unit') || notes.includes('accessory unit');
  const hasConvPotential = notes.includes('rough-in') || notes.includes('side entrance')
    || notes.includes('walk-up') || notes.includes('walk-out') || notes.includes('potential');

  if (hasSuite) v += 1.5;
  else if (hasConvPotential) v += 0.7;

  // Price reduction bonus
  if ((listing.priceDrop || 0) >= 5) v += 0.5;
  else if ((listing.priceDrop || 0) >= 3) v += 0.25;

  // Location premium
  const hood = (listing.neighbourhood || '').toLowerCase();
  if (hood.includes('port credit') || hood.includes('lakeview')) v += 0.5;
  if (hood.includes('clarkson') || hood.includes('cooksville')) v += 0.25;

  // GRM
  if (m.grm <= 16) v += 0.5;
  else if (m.grm >= 28) v -= 0.3;

  const s = parseFloat(Math.min(9.9, Math.max(1.0, v)).toFixed(1));
  const label =
    s >= 8.5 ? 'Exceptional Deal' :
    s >= 7.5 ? 'Strong Buy' :
    s >= 6.5 ? 'Good Deal' :
    s >= 5.5 ? 'Above Average' :
    s >= 4.5 ? 'Average' :
    s >= 3.5 ? 'Below Average' : 'Weak';
  return { s, label };
}

const scoreColor = s => s >= 7.5 ? C.green : s >= 5.5 ? C.amber : C.red;
const scoreBg    = s => s >= 7.5 ? C.greenDim : s >= 5.5 ? C.amberDim : C.redDim;

// ─── FORMATTERS ──────────────────────────────────────────────────────────
const f$   = n => '$' + Math.abs(Math.round(n||0)).toLocaleString();
const fCF  = n => n == null ? '--' : (n >= 0 ? '+$' : '-$') + Math.abs(Math.round(n)).toLocaleString();
const fPct = n => (n||0).toFixed(2) + '%';

// ─── SAMPLE FALLBACK DATA ────────────────────────────────────────────────
// Used ONLY if /api/listings is unavailable
const SAMPLE_LISTINGS = [
  { id:'S001', isSample:true, address:'147 Lakeshore Rd E', neighbourhood:'Port Credit', price:1125000, originalPrice:1175000, beds:4, baths:3, sqft:1950, type:'Semi-Detached', yearBuilt:1998, dom:12, rent:4200, brokerage:'Royal LePage Signature Realty', hasSuite:true, notes:'Corner lot with separate entrance to basement suite. Walking distance to Port Credit GO.', photos:['https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800&q=75'] },
  { id:'S002', isSample:true, address:'3290 Battleford Rd #42', neighbourhood:'Clarkson', price:689000, originalPrice:689000, beds:3, baths:2, sqft:1420, type:'Townhouse', yearBuilt:2008, dom:5, rent:3100, brokerage:'Royal LePage Signature Realty', hasSuite:false, notes:'End-unit townhouse 5 min to Clarkson GO. Basement rough-in ready.', photos:['https://images.unsplash.com/photo-1625750331870-624de6fd3452?w=800&q=75'] },
  { id:'S003', isSample:true, address:'5985 Creditview Rd', neighbourhood:'Hurontario', price:875000, originalPrice:920000, beds:4, baths:3, sqft:1780, type:'Detached', yearBuilt:2001, dom:22, rent:3800, brokerage:'Royal LePage Signature Realty', hasSuite:true, notes:'Finished basement suite generating $1,600/mo. Near future Hazel McCallion LRT.', photos:['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=75'] },
  { id:'S004', isSample:true, address:'2150 Burnhamthorpe Rd W #808', neighbourhood:'Erin Mills', price:549000, originalPrice:549000, beds:2, baths:2, sqft:890, type:'Condo', yearBuilt:2016, dom:3, rent:2400, brokerage:'Royal LePage Signature Realty', hasSuite:false, notes:'High-floor corner unit. Low condo fees $480/mo.', photos:['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=75'] },
  { id:'S005', isSample:true, address:'1441 Dunwin Dr', neighbourhood:'Cooksville', price:1345000, originalPrice:1399000, beds:5, baths:4, sqft:2600, type:'Detached', yearBuilt:1989, dom:34, rent:5200, brokerage:'Royal LePage Signature Realty', hasSuite:true, notes:'Legal duplex. Upper 3-bed at $2,900/mo, lower 2-bed at $2,300/mo.', photos:['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=75'] },
  { id:'S006', isSample:true, address:'460 Meadowbrook Dr', neighbourhood:'Meadowvale', price:798000, originalPrice:798000, beds:3, baths:2, sqft:1540, type:'Semi-Detached', yearBuilt:1995, dom:8, rent:3300, brokerage:'Royal LePage Signature Realty', hasSuite:false, notes:'Side entrance basement. Pie-shaped lot. Top school catchment.', photos:['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=75'] },
];

function enrichListing(l) {
  const rent = l.rent || l.estimatedRent || l.gross || 0;
  const m = calcMetrics({ price: l.price, rent });
  const priceDrop = l.originalPrice > l.price
    ? Math.round(((l.originalPrice - l.price) / l.originalPrice) * 100) : (l.priceReduction || 0);
  const { s, label } = getDealScore(m, { ...l, priceDrop });
  return { ...l, rent, ...m, dealScore: s, dealLabel: label, priceDrop };
}

// ═══════════════════════════════════════════════════════════════════════════
// SIGNUP MODAL
// ═══════════════════════════════════════════════════════════════════════════
function SignupModal({ onSuccess, trigger }) {
  const [fm, setFm] = useState({ firstName:'', lastName:'', email:'', phone:'', hasRealtor:'' });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!fm.firstName.trim()) e.firstName = 'Required';
    if (!fm.lastName.trim())  e.lastName  = 'Required';
    if (!fm.email.includes('@')) e.email   = 'Valid email required';
    if (!fm.phone.replace(/\D/g,'').match(/^\d{10}$/)) e.phone = 'Valid 10-digit number required';
    if (!fm.hasRealtor) e.hasRealtor = 'Please select one';
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErr(e); return; }
    setLoading(true);
    await fetch('/api/lead', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...fm, trigger, source:'signup_gate', timestamp: new Date().toISOString() }),
    }).catch(()=>{});
    onSuccess({ email: fm.email, name: `${fm.firstName} ${fm.lastName}`, hasRealtor: fm.hasRealtor });
    setLoading(false);
  };

  const Inp = ({ label, k, type='text', ph='' }) => (
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:C.textSec,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</label>
      <input type={type} placeholder={ph} value={fm[k]}
        onChange={e=>{setFm(p=>({...p,[k]:e.target.value}));setErr(p=>({...p,[k]:''}));}}
        style={{width:'100%',padding:'11px 14px',fontSize:14,border:`1.5px solid ${err[k]?C.red:C.border}`,borderRadius:8,outline:'none',boxSizing:'border-box',color:C.text,background:C.surface}}/>
      {err[k]&&<div style={{color:C.red,fontSize:11,marginTop:3}}>{err[k]}</div>}
    </div>
  );

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,width:'100%',maxWidth:460,padding:36,boxShadow:'0 32px 80px rgba(0,0,0,0.7)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{display:'inline-block',background:C.blueDim,color:C.blue,fontSize:10,fontWeight:700,padding:'4px 12px',borderRadius:20,marginBottom:12,border:`1px solid ${C.blue}44`,letterSpacing:'0.08em'}}>FREE ACCESS</div>
          <div style={{fontSize:20,fontWeight:800,color:C.text,marginBottom:8,lineHeight:1.3}}>Unlock Full Deal Analysis</div>
          <div style={{fontSize:13,color:C.textSec,lineHeight:1.6}}>Cash flow, cap rate & AI analysis on every Mississauga listing. Free.</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
          <Inp label="First Name" k="firstName" ph="John"/>
          <Inp label="Last Name"  k="lastName"  ph="Smith"/>
        </div>
        <Inp label="Email Address" k="email" type="email" ph="john@email.com"/>
        <Inp label="Phone Number"  k="phone" type="tel"   ph="416-555-0123"/>
        <div style={{marginBottom:22}}>
          <label style={{display:'block',fontSize:11,fontWeight:700,color:C.textSec,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Working with a realtor?</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {['Yes','No'].map(opt=>(
              <button key={opt} onClick={()=>{setFm(p=>({...p,hasRealtor:opt}));setErr(p=>({...p,hasRealtor:''}));}}
                style={{padding:'11px',fontSize:14,fontWeight:600,borderRadius:8,cursor:'pointer',border:`2px solid ${fm.hasRealtor===opt?C.blue:C.border}`,background:fm.hasRealtor===opt?C.blueDim:C.surface,color:fm.hasRealtor===opt?C.blue:C.textSec}}>
                {opt}
              </button>
            ))}
          </div>
          {err.hasRealtor&&<div style={{color:C.red,fontSize:11,marginTop:4}}>{err.hasRealtor}</div>}
        </div>
        <button onClick={submit} disabled={loading}
          style={{width:'100%',padding:14,background:loading?C.muted:C.blue,border:'none',borderRadius:10,color:C.white,fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer',marginBottom:14}}>
          {loading?'Creating your account...':'Get Free Access →'}
        </button>
        <div style={{fontSize:11,color:C.muted,textAlign:'center',lineHeight:1.7}}>
          Hamza Nouman · Royal LePage Signature Realty · No spam. Unsubscribe anytime.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AI DEAL ANALYZER
// ═══════════════════════════════════════════════════════════════════════════
function AIDealAnalyzer({ listing, metrics }) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setAnalysis('');
    setDone(false);
    const prompt = `You are an expert real estate investment analyst specializing in Mississauga, Ontario.

Analyze this property for an investor:

PROPERTY: ${listing.address}, ${listing.neighbourhood}, Mississauga
Type: ${listing.type} | ${listing.beds}bd ${listing.baths}ba${listing.sqft ? ` | ${listing.sqft} sqft` : ''}
Price: $${listing.price?.toLocaleString()} | Year Built: ${listing.yearBuilt || 'N/A'} | DOM: ${listing.dom || listing.daysOnMarket || 0}d
${listing.priceDrop > 0 ? `Price reduced ${listing.priceDrop}% from $${listing.originalPrice?.toLocaleString()}` : ''}
${listing.hasSuite ? '⚑ Has income suite / separate entrance' : ''}

FINANCIALS (20% down, 5.99%, 25yr):
Rent: $${metrics.gross?.toLocaleString()}/mo | Mortgage: $${metrics.mtg?.toLocaleString()}/mo
Cash Flow: ${metrics.cf >= 0 ? '+' : ''}$${metrics.cf?.toLocaleString()}/mo | Cap Rate: ${metrics.capRate}%
Cash-on-Cash: ${metrics.coc}% | Annual Equity Paydown: $${metrics.annualEquity?.toLocaleString()}
Total Return (CF+equity): ${metrics.totalReturn}% | Cash to Close: $${metrics.cashIn?.toLocaleString()}

NOTES: ${listing.notes || listing.remarks || 'N/A'}

CONTEXT: In Mississauga, 90% of properties don't cashflow at current rates. Breakeven is a genuinely good deal. Properties with basement suites or separate entrances are significantly more valuable as they approach cashflow positive or achieve it. Total return including equity paydown matters.

Write 3 short paragraphs (no bullets):
1. Deal assessment vs Mississauga market
2. Key risks and upside  
3. Direct recommendation — buy, pass, or negotiate

Under 220 words. Be direct and decisive.`;

    try {
      const res = await fetch('/api/analyze', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:500, messages:[{role:'user',content:prompt}] }),
      });
      const data = await res.json();
      setAnalysis(data?.content?.[0]?.text || 'Analysis unavailable. Call Hamza at 647-609-1289.');
    } catch {
      setAnalysis('AI analysis temporarily unavailable. Call Hamza directly at 647-609-1289 for a live assessment.');
    }
    setLoading(false);
    setDone(true);
  };

  if (!done && !loading) return (
    <div style={{background:C.surface,borderRadius:10,padding:18,border:`1px solid ${C.purple}44`,marginBottom:14}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
        <div style={{fontSize:18}}>🤖</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.text}}>AI Deal Analyzer</div>
          <div style={{fontSize:11,color:C.muted}}>Powered by Claude · Mississauga market context</div>
        </div>
      </div>
      <button onClick={analyze} style={{width:'100%',padding:'11px',background:C.purple,border:'none',borderRadius:8,color:C.white,fontSize:13,fontWeight:700,cursor:'pointer'}}>
        Analyze This Deal with AI →
      </button>
    </div>
  );

  if (loading) return (
    <div style={{background:C.surface,borderRadius:10,padding:18,border:`1px solid ${C.purple}44`,marginBottom:14}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <div style={{fontSize:16}}>🤖</div>
        <div style={{fontSize:13,fontWeight:700,color:C.text}}>Analyzing deal...</div>
      </div>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:8,height:8,borderRadius:'50%',background:C.purple,
            animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>
        ))}
        <span style={{fontSize:12,color:C.muted,marginLeft:4}}>Reading Mississauga market data...</span>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );

  return (
    <div style={{background:C.surface,borderRadius:10,padding:18,border:`1px solid ${C.purple}44`,marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{fontSize:16}}>🤖</div>
          <div style={{fontSize:13,fontWeight:700,color:C.text}}>AI Deal Analysis</div>
        </div>
        <button onClick={()=>{setDone(false);setAnalysis('');}} style={{fontSize:11,color:C.muted,background:'transparent',border:'none',cursor:'pointer'}}>Re-analyze</button>
      </div>
      <div style={{fontSize:13,color:C.textSec,lineHeight:1.85}}>{analysis}</div>
      <div style={{marginTop:8,fontSize:10,color:C.muted}}>AI analysis by Claude. Not financial advice.</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAL MODAL
// ═══════════════════════════════════════════════════════════════════════════
function DealModal({ listing, onClose }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [a, setA] = useState({
    dpPct:0.20, rate:0.0599, years:25,
    vacRate:0.03, maintPct:0.05, mgmtPct:0,
    rent: listing.rent || listing.estimatedRent || 2500,
  });
  const m = useMemo(()=>calcMetrics({price:listing.price,...a}),[listing.price,a]);
  const {s,label} = useMemo(()=>getDealScore(m,listing),[m,listing]);
  const upd = (k,v) => setA(p=>({...p,[k]:v}));

  React.useEffect(()=>{
    const esc = e => e.key==='Escape'&&onClose();
    window.addEventListener('keydown',esc);
    return ()=>window.removeEventListener('keydown',esc);
  },[onClose]);

  if(!m) return null;
  const cfColor = m.cf>=0?C.green:C.red;
  const cfBg    = m.cf>=0?C.greenDim:C.redDim;

  const photos = listing.photos || [];
  const hasPhotos = photos.length > 0;

  const PLRow = ({l,v,color,indent,bold,divider}) => divider
    ? <div style={{borderTop:`1px solid ${C.border}`,margin:'8px 0'}}/>
    : (
      <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',paddingLeft:indent?14:0}}>
        <span style={{fontSize:13,color:C.textSec,fontWeight:bold?600:400}}>{l}</span>
        <span style={{fontSize:13,fontWeight:bold?700:500,color:color||C.text}}>{v}</span>
      </div>
    );

  const Slider = ({label,k,min,max,step,fmt}) => (
    <div style={{marginBottom:13}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
        <span style={{fontSize:12,color:C.textSec}}>{label}</span>
        <span style={{fontSize:12,fontWeight:700,color:C.text}}>{fmt(a[k])}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={a[k]}
        onChange={e=>upd(k,parseFloat(e.target.value))}
        style={{width:'100%',accentColor:C.blue,cursor:'pointer'}}/>
    </div>
  );

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.87)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'16px',overflowY:'auto'}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,width:'100%',maxWidth:1020,boxShadow:'0 32px 80px rgba(0,0,0,0.7)',marginBottom:20}}>

        {/* Header */}
        <div style={{padding:'18px 24px 14px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
              <span style={{fontSize:18,fontWeight:800,color:C.text}}>{listing.address}</span>
              {listing.hasSuite&&<span style={{background:C.greenDim,color:C.green,fontSize:10,fontWeight:700,padding:'2px 10px',borderRadius:20,border:`1px solid ${C.green}44`}}>🏠 INCOME SUITE</span>}
              {listing.isSample&&<span style={{background:C.muted+'33',color:C.muted,fontSize:10,fontWeight:600,padding:'2px 10px',borderRadius:20}}>SAMPLE DATA</span>}
            </div>
            <div style={{fontSize:13,color:C.textSec}}>{listing.neighbourhood} · {listing.type} · {listing.beds}bd · {listing.baths}ba{listing.sqft?` · ${listing.sqft.toLocaleString()} sqft`:''}{listing.yearBuilt?` · Built ${listing.yearBuilt}`:''}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:22,fontWeight:800,color:C.text}}>{f$(listing.price)}</div>
              {listing.priceDrop>0&&<div style={{fontSize:11,color:C.red,fontWeight:600}}>▼ {listing.priceDrop}% from asking</div>}
            </div>
            <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,width:34,height:34,fontSize:17,cursor:'pointer',color:C.textSec,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 330px'}}>
          {/* LEFT */}
          <div style={{padding:'22px 24px',borderRight:`1px solid ${C.border}`}}>

            {/* Photo gallery */}
            <div style={{borderRadius:12,overflow:'hidden',marginBottom:18,position:'relative',height:260,background:C.surface}}>
              {hasPhotos ? (
                <img src={photos[photoIdx]} alt={listing.address}
                  style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                  onError={e=>{e.target.style.display='none';}}/>
              ) : (
                <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8}}>
                  <div style={{fontSize:40,opacity:0.2}}>🏠</div>
                  <div style={{fontSize:12,color:C.muted}}>No photo available</div>
                </div>
              )}
              {photos.length > 1 && (
                <>
                  <button onClick={()=>setPhotoIdx(p=>p===0?photos.length-1:p-1)}
                    style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.6)',border:'none',borderRadius:'50%',width:32,height:32,color:C.white,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
                  <button onClick={()=>setPhotoIdx(p=>p===photos.length-1?0:p+1)}
                    style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.6)',border:'none',borderRadius:'50%',width:32,height:32,color:C.white,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
                  <div style={{position:'absolute',bottom:10,left:'50%',transform:'translateX(-50%)',display:'flex',gap:5}}>
                    {photos.map((_,i)=>(
                      <button key={i} onClick={()=>setPhotoIdx(i)}
                        style={{width:i===photoIdx?18:7,height:7,borderRadius:4,background:i===photoIdx?C.white:'rgba(255,255,255,0.4)',border:'none',cursor:'pointer',padding:0,transition:'all 0.2s'}}/>
                    ))}
                  </div>
                </>
              )}
              {/* Score overlay */}
              <div style={{position:'absolute',top:12,right:12,background:scoreBg(s),border:`1px solid ${scoreColor(s)}55`,borderRadius:10,padding:'8px 14px',textAlign:'center'}}>
                <div style={{fontSize:22,fontWeight:900,color:scoreColor(s),lineHeight:1}}>{s}/10</div>
                <div style={{fontSize:10,color:scoreColor(s),fontWeight:600,marginTop:2}}>{label}</div>
              </div>
            </div>

            {/* Hero chips */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:9,marginBottom:6}}>
              {[
                {label:'Monthly Cash Flow',value:fCF(m.cf),color:cfColor,bg:cfBg},
                {label:'Cap Rate',value:fPct(m.capRate),color:m.capRate>=4?C.green:C.amber,bg:m.capRate>=4?C.greenDim:C.amberDim},
                {label:'Cash-on-Cash',value:fPct(m.coc),color:m.coc>=0?C.amber:C.red,bg:m.coc>=0?C.amberDim:C.redDim},
                {label:'Total Return*',value:fPct(m.totalReturn),color:m.totalReturn>=0?C.green:C.amber,bg:m.totalReturn>=0?C.greenDim:C.amberDim},
              ].map(chip=>(
                <div key={chip.label} style={{background:chip.bg,borderRadius:9,padding:'11px 9px',textAlign:'center',border:`1px solid ${chip.color}33`}}>
                  <div style={{fontSize:9,color:C.textSec,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:700}}>{chip.label}</div>
                  <div style={{fontSize:15,fontWeight:800,color:chip.color}}>{chip.value}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:10,color:C.muted,marginBottom:16}}>*Total return = cash flow + ${f$(m.annualEquity)} annual equity paydown</div>

            {/* P&L */}
            <div style={{background:C.surface,borderRadius:10,padding:16,border:`1px solid ${C.border}`,marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:12}}>Monthly P&L</div>
              {[
                {l:'Gross Rent',v:f$(m.gross),color:C.green},
                {l:'Vacancy Loss (3%)',v:'− '+f$(m.vac),indent:true},
                {l:'Effective Income',v:f$(m.eff),bold:true},
                {divider:true},
                {l:'Property Tax',v:'− '+f$(m.tax),indent:true},
                {l:'Insurance',v:'− '+f$(m.ins),indent:true},
                {l:'Maintenance Reserve',v:'− '+f$(m.maint),indent:true},
                ...(m.mgmt>0?[{l:'Property Mgmt',v:'− '+f$(m.mgmt),indent:true}]:[]),
                {l:'Total Operating Expenses',v:'− '+f$(m.opex),color:C.amber,bold:true},
                {divider:true},
                {l:'Net Operating Income',v:f$(m.noi),bold:true},
                {l:'Mortgage Payment',v:'− '+f$(m.mtg),color:C.red,indent:true},
                {divider:true},
                {l:'Monthly Cash Flow',v:fCF(m.cf),color:cfColor,bold:true},
                {l:'Monthly Equity Paydown',v:'+'+f$(Math.round(m.annualEquity/12)),color:C.purple,indent:true},
              ].map((r,i)=><PLRow key={i} {...r}/>)}
            </div>

            {/* Capital */}
            <div style={{background:C.surface,borderRadius:10,padding:16,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:12}}>Capital Required</div>
              {[
                {l:'Down Payment (20%)',v:f$(m.dp)},
                {l:'Closing Costs (~1.5%)',v:f$(m.closing)},
                {l:'Total Cash to Close',v:f$(m.cashIn),bold:true},
              ].map((r,i)=><PLRow key={i} {...r}/>)}
              <div style={{marginTop:8,fontSize:11,color:C.muted}}>
                {f$(m.mtg)}/mo · {f$(m.loan)} loan · 5.99% · 25yr · Canadian semi-annual compounding
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{padding:'22px 20px',overflowY:'auto',maxHeight:'90vh'}}>
            <AIDealAnalyzer listing={listing} metrics={m}/>

            <div style={{background:C.surface,borderRadius:10,padding:16,border:`1px solid ${C.border}`,marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Adjust Assumptions</div>
              <Slider label="Monthly Rent"   k="rent"     min={1000} max={8000} step={50}     fmt={v=>f$(v)}/>
              <Slider label="Down Payment"    k="dpPct"    min={0.05} max={0.50} step={0.05}   fmt={v=>(v*100).toFixed(0)+'%'}/>
              <Slider label="Interest Rate"   k="rate"     min={0.03} max={0.10} step={0.0025} fmt={v=>(v*100).toFixed(2)+'%'}/>
              <Slider label="Amortization"    k="years"    min={15}   max={30}   step={5}      fmt={v=>v+' yrs'}/>
              <Slider label="Vacancy Rate"    k="vacRate"  min={0}    max={0.15} step={0.01}   fmt={v=>(v*100).toFixed(0)+'%'}/>
              <Slider label="Maintenance"     k="maintPct" min={0.02} max={0.15} step={0.01}   fmt={v=>(v*100).toFixed(0)+'% rent'}/>
              <Slider label="Property Mgmt"   k="mgmtPct"  min={0}    max={0.15} step={0.01}   fmt={v=>v===0?'Self-managed':(v*100).toFixed(0)+'% rent'}/>
            </div>

            {(listing.notes||listing.remarks)&&(
              <div style={{background:C.surface,borderRadius:10,padding:14,border:`1px solid ${C.border}`,marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Agent Notes</div>
                <div style={{fontSize:12,color:C.textSec,lineHeight:1.75}}>{listing.notes||listing.remarks}</div>
              </div>
            )}

            <div style={{background:C.surface,borderRadius:10,padding:14,border:`1px solid ${C.border}`,marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>More Metrics</div>
              {[
                {l:'Gross Rent Multiplier',v:m.grm+'x'},
                {l:'Annual NOI',v:f$(m.noiYear)},
                {l:'Annual Equity Paydown',v:f$(m.annualEquity),color:C.purple},
                {l:'Days on Market',v:(listing.dom||listing.daysOnMarket||0)+'d'},
                {l:'Year Built',v:listing.yearBuilt||'—'},
                ...(listing.priceDrop>0?[{l:'Price Reduction',v:listing.priceDrop+'%',color:C.red}]:[]),
              ].map((r,i)=><PLRow key={i} {...r}/>)}
            </div>

            <div style={{background:C.blue,borderRadius:12,padding:18}}>
              <div style={{fontSize:14,fontWeight:800,color:C.white,marginBottom:2}}>Book a Showing</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.7)',marginBottom:14}}>Hamza Nouman · Royal LePage Signature Realty</div>
              <a href="tel:6476091289" style={{display:'block',background:C.white,color:C.blue,textAlign:'center',padding:'11px',borderRadius:8,fontSize:14,fontWeight:700,textDecoration:'none',marginBottom:7}}>📞 647-609-1289</a>
              <a href={`mailto:hamza@nouman.ca?subject=Showing Request: ${listing.address}`}
                style={{display:'block',background:'rgba(255,255,255,0.15)',color:C.white,textAlign:'center',padding:'10px',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>✉️ Email Hamza</a>
            </div>

            <div style={{marginTop:12,fontSize:10,color:C.muted,lineHeight:1.7}}>
              Listed by: <strong style={{color:C.textSec}}>{listing.brokerage||listing.listingBrokerage}</strong><br/>
              Information deemed reliable but not guaranteed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAL OF THE WEEK HERO
// ═══════════════════════════════════════════════════════════════════════════
function DealOfWeek({ listing, onClick }) {
  const [hov, setHov] = useState(false);
  if (!listing) return null;
  const cfColor = listing.cf>=0?C.green:C.red;
  const cfBg    = listing.cf>=0?C.greenDim:C.redDim;
  const photo   = listing.photos?.[0];

  return (
    <div style={{marginBottom:30}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:800,color:C.gold}}>🏆 Deal of the Week</div>
        <div style={{flex:1,height:1,background:`linear-gradient(to right, ${C.gold}44, transparent)`}}/>
        <div style={{fontSize:11,color:C.muted}}>Highest-scored active listing</div>
      </div>

      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
        style={{background:hov?C.cardHov:C.card,border:`1px solid ${hov?C.gold:C.gold+'44'}`,borderRadius:14,overflow:'hidden',cursor:'pointer',transition:'all 0.18s',boxShadow:hov?`0 16px 48px rgba(245,158,11,0.15)`:'0 4px 20px rgba(0,0,0,0.4)',display:'grid',gridTemplateColumns:'420px 1fr'}}>

        {/* Photo */}
        <div style={{position:'relative',height:250,overflow:'hidden',background:C.surface}}>
          {photo ? (
            <img src={photo} alt={listing.address}
              style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.4s',transform:hov?'scale(1.05)':'scale(1)'}}
              onError={e=>{e.target.style.display='none';}}/>
          ) : (
            <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:50,opacity:0.15}}>🏠</span>
            </div>
          )}
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to right, transparent 50%, rgba(15,30,53,0.95) 100%)'}}/>
          <div style={{position:'absolute',top:14,left:14}}>
            <span style={{background:C.gold,color:'#000',fontSize:11,fontWeight:800,padding:'4px 12px',borderRadius:20}}>⭐ BEST DEAL THIS WEEK</span>
          </div>
          <div style={{position:'absolute',bottom:12,left:12,display:'flex',gap:7}}>
            <span style={{background:'rgba(0,0,0,0.65)',color:C.textSec,fontSize:10,padding:'3px 8px',borderRadius:16}}>{listing.beds}bd {listing.baths}ba</span>
            {listing.sqft&&<span style={{background:'rgba(0,0,0,0.65)',color:C.textSec,fontSize:10,padding:'3px 8px',borderRadius:16}}>{listing.sqft.toLocaleString()} sqft</span>}
            {listing.hasSuite&&<span style={{background:C.greenDim,color:C.green,fontSize:10,padding:'3px 8px',borderRadius:16,fontWeight:700}}>🏠 Suite</span>}
          </div>
        </div>

        {/* Content */}
        <div style={{padding:'22px 26px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:C.text,marginBottom:3}}>{listing.address}</div>
              <div style={{fontSize:13,color:C.textSec}}>{listing.neighbourhood} · {listing.type}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:22,fontWeight:800,color:C.text}}>{f$(listing.price)}</div>
              {listing.priceDrop>0&&<div style={{fontSize:11,color:C.red,fontWeight:600}}>▼ {listing.priceDrop}% reduced</div>}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:9,marginBottom:12}}>
            {[
              {l:'Deal Score',v:`${listing.dealScore}/10`,color:scoreColor(listing.dealScore),bg:scoreBg(listing.dealScore)},
              {l:'Cash Flow',v:fCF(listing.cf),color:cfColor,bg:cfBg},
              {l:'Cap Rate',v:fPct(listing.capRate),color:listing.capRate>=4?C.green:C.amber,bg:listing.capRate>=4?C.greenDim:C.amberDim},
              {l:'Est. Rent/mo',v:f$(listing.rent||listing.gross),color:C.blue,bg:C.blueDim},
            ].map(({l,v,color,bg})=>(
              <div key={l} style={{background:bg,borderRadius:8,padding:'9px 10px',textAlign:'center',border:`1px solid ${color}33`}}>
                <div style={{fontSize:9,color:C.muted,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:700}}>{l}</div>
                <div style={{fontSize:15,fontWeight:800,color}}>{v}</div>
              </div>
            ))}
          </div>

          {(listing.notes||listing.remarks)&&(
            <div style={{fontSize:12,color:C.textSec,lineHeight:1.75,marginBottom:14}}>
              {(listing.notes||listing.remarks).substring(0,200)}{(listing.notes||listing.remarks).length>200?'...':''}
            </div>
          )}

          <div style={{display:'flex',gap:9}}>
            <button style={{flex:1,padding:'10px',background:C.blue,border:'none',borderRadius:8,color:C.white,fontSize:13,fontWeight:700,cursor:'pointer'}}>
              View Analysis + AI Breakdown →
            </button>
            <a href="tel:6476091289" style={{padding:'10px 16px',background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,fontWeight:600,textDecoration:'none',display:'flex',alignItems:'center',whiteSpace:'nowrap'}}>
              📞 647-609-1289
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROPERTY CARD
// ═══════════════════════════════════════════════════════════════════════════
function PropertyCard({ listing, onClick, isDoW }) {
  const [hov, setHov] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const cfColor = listing.cf>=0?C.green:C.red;
  const cfBg    = listing.cf>=0?C.greenDim:C.redDim;
  const photo   = listing.photos?.[0];

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      style={{background:hov?C.cardHov:C.card,border:`1px solid ${hov?C.blue:isDoW?C.gold+'55':C.border}`,borderRadius:12,overflow:'hidden',cursor:'pointer',transition:'all 0.15s',boxShadow:hov?'0 8px 32px rgba(59,130,246,0.2)':'0 2px 8px rgba(0,0,0,0.3)'}}>

      {/* Photo */}
      <div style={{height:192,position:'relative',overflow:'hidden',background:`linear-gradient(135deg, ${C.blueDim} 0%, #0D2137 100%)`}}>
        {imgOk && photo ? (
          <img src={photo} alt={listing.address}
            style={{width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform 0.3s',transform:hov?'scale(1.05)':'scale(1)'}}
            onError={()=>setImgOk(false)}/>
        ) : (
          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontSize:40,opacity:0.2}}>🏠</span>
          </div>
        )}

        <div style={{position:'absolute',top:0,left:0,right:0,padding:'9px 10px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {isDoW&&<span style={{background:C.blue,color:C.white,fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20}}>🏆 DEAL OF WEEK</span>}
            {listing.hasSuite&&<span style={{background:C.greenDim,color:C.green,fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,border:`1px solid ${C.green}55`}}>🏠 SUITE</span>}
            {listing.isSample&&<span style={{background:C.muted+'33',color:C.muted,fontSize:9,fontWeight:600,padding:'2px 8px',borderRadius:20}}>SAMPLE</span>}
          </div>
          <div style={{background:scoreBg(listing.dealScore),border:`1px solid ${scoreColor(listing.dealScore)}44`,borderRadius:8,padding:'5px 9px',textAlign:'center'}}>
            <div style={{fontSize:14,fontWeight:900,color:scoreColor(listing.dealScore),lineHeight:1}}>{listing.dealScore}/10</div>
          </div>
        </div>

        <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'8px 10px',display:'flex',justifyContent:'space-between',alignItems:'flex-end',background:'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)'}}>
          {listing.priceDrop>0
            ?<span style={{background:'rgba(239,68,68,0.85)',color:C.white,fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:16}}>▼ {listing.priceDrop}% Reduced</span>
            :<span/>}
          <span style={{color:'rgba(255,255,255,0.55)',fontSize:10}}>{listing.dom||listing.daysOnMarket||0}d listed</span>
        </div>
      </div>

      {/* Body */}
      <div style={{padding:'13px 15px 15px'}}>
        <div style={{fontSize:19,fontWeight:800,color:C.text,marginBottom:3}}>{f$(listing.price)}</div>
        <div style={{fontSize:12,color:C.textSec,marginBottom:2}}>{listing.beds}bd · {listing.baths}ba{listing.sqft?` · ${listing.sqft.toLocaleString()} sqft`:''} · {listing.type}</div>
        <div style={{fontSize:11,color:C.muted,marginBottom:13}}>{listing.address}, {listing.neighbourhood}</div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          {[
            {label:'Cash Flow/mo', value:fCF(listing.cf),       color:cfColor,                                   bg:cfBg},
            {label:'Cap Rate',     value:fPct(listing.capRate),  color:listing.capRate>=4?C.green:C.amber,        bg:listing.capRate>=4?C.greenDim:C.amberDim},
            {label:'Est. Rent/mo', value:f$(listing.rent||listing.gross), color:C.blue,                          bg:C.blueDim},
            {label:'Mortgage/mo',  value:f$(listing.mtg),        color:C.textSec,                                bg:C.surface},
          ].map(m=>(
            <div key={m.label} style={{background:m.bg,borderRadius:7,padding:'8px 9px',border:`1px solid ${m.color}22`}}>
              <div style={{fontSize:9,color:C.muted,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:700}}>{m.label}</div>
              <div style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</div>
            </div>
          ))}
        </div>

        <div style={{marginTop:11,paddingTop:10,borderTop:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:10,color:C.muted,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{listing.brokerage||listing.listingBrokerage}</span>
          <span style={{fontSize:11,fontWeight:600,color:hov?C.blue:C.textSec}}>{hov?'View Analysis + AI →':'Analyze Deal'}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTER BAR
// ═══════════════════════════════════════════════════════════════════════════
function FilterBar({ filters, onChange, onReset, count }) {
  const Sel = ({label,k,opts}) => (
    <select value={filters[k]||''} onChange={e=>onChange(k,e.target.value)}
      style={{padding:'8px 12px',fontSize:12,border:`1px solid ${filters[k]?C.blue:C.border}`,borderRadius:8,background:filters[k]?C.blueDim:C.surface,color:filters[k]?C.blue:C.textSec,outline:'none',cursor:'pointer',fontWeight:filters[k]?700:400}}>
      <option value="">{label}</option>
      {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
  const active = Object.values(filters).filter(Boolean).length;
  return (
    <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'10px 24px',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
      <Sel label="Price Range" k="priceRange" opts={[{v:'0-600000',l:'Under $600K'},{v:'600000-800000',l:'$600K–$800K'},{v:'800000-1000000',l:'$800K–$1M'},{v:'1000000-1500000',l:'$1M–$1.5M'},{v:'1500000-99999999',l:'$1.5M+'}]}/>
      <Sel label="Beds" k="minBeds" opts={[1,2,3,4,5].map(n=>({v:n,l:n+'+ beds'}))}/>
      <Sel label="Type" k="type" opts={['Detached','Semi-Detached','Townhouse','Condo','Duplex'].map(t=>({v:t,l:t}))}/>
      <Sel label="Neighbourhood" k="hood" opts={['Port Credit','Clarkson','Erin Mills','Cooksville','Hurontario','Meadowvale','City Centre','Lakeview','Streetsville','Malton'].map(n=>({v:n,l:n}))}/>
      <Sel label="Min Cap Rate" k="minCap" opts={['2','3','4','5'].map(n=>({v:n,l:n+'%+ cap rate'}))}/>
      <Sel label="Cash Flow" k="minCF" opts={[{v:'-99999',l:'Any'},{v:'0',l:'Positive only'},{v:'-500',l:'Under -$500/mo'}]}/>
      <Sel label="Days Listed" k="maxDom" opts={[{v:'7',l:'< 1 week'},{v:'14',l:'< 2 weeks'},{v:'30',l:'< 30 days'}]}/>
      <Sel label="Income Suite" k="suite" opts={[{v:'yes',l:'Has income suite'}]}/>
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:12,color:C.muted}}>{count} listing{count!==1?'s':''}</span>
        {active>0&&<button onClick={onReset} style={{fontSize:12,color:C.red,background:'transparent',border:`1px solid ${C.red}44`,borderRadius:8,padding:'6px 12px',cursor:'pointer',fontWeight:600}}>Clear ({active})</button>}
      </div>
    </div>
  );
}

function applyFilters(ls,f) {
  return ls.filter(l=>{
    if(f.priceRange){const[mn,mx]=f.priceRange.split('-').map(Number);if(l.price<mn||l.price>mx)return false;}
    if(f.minBeds&&l.beds<+f.minBeds)return false;
    if(f.type&&!l.type?.toLowerCase().includes(f.type.toLowerCase()))return false;
    if(f.hood&&l.neighbourhood!==f.hood)return false;
    if(f.minCap&&l.capRate<+f.minCap)return false;
    if(f.minCF&&l.cf<+f.minCF)return false;
    if(f.maxDom&&(l.dom||l.daysOnMarket||0)>+f.maxDom)return false;
    if(f.suite==='yes'&&!l.hasSuite)return false;
    return true;
  });
}

function applySort(ls,s) {
  const a=[...ls];
  if(s==='score') return a.sort((x,y)=>y.dealScore-x.dealScore);
  if(s==='cf')    return a.sort((x,y)=>y.cf-x.cf);
  if(s==='cap')   return a.sort((x,y)=>y.capRate-x.capRate);
  if(s==='pAsc')  return a.sort((x,y)=>x.price-y.price);
  if(s==='pDesc') return a.sort((x,y)=>y.price-x.price);
  if(s==='dom')   return a.sort((x,y)=>(x.dom||x.daysOnMarket||0)-(y.dom||y.daysOnMarket||0));
  return a;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
const FREE_VIEWS = 10;

export default function App() {
  const [user,setUser]     = useState(()=>{try{return JSON.parse(localStorage.getItem('mi_user')||'null');}catch{return null;}});
  const [views,setViews]   = useState(()=>parseInt(localStorage.getItem('mi_views')||'0'));
  const [showSignup,setShowSignup] = useState(false);
  const [sigTrigger,setSigTrigger] = useState('');
  const [selected,setSelected]     = useState(null);
  const [filters,setFilters]       = useState({});
  const [sort,setSort]             = useState('score');
  const [tab,setTab]               = useState('listings');

  // ── LIVE TREB DATA FETCH ──────────────────────────────────────────────
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [liveData, setLiveData]   = useState(false);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [apiError, setApiError]   = useState('');

  const fetchListings = useCallback(async (pageNum=1, activeFilters={}) => {
    setLoading(true);
    setApiError('');
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 50 });
      if(activeFilters.priceRange) { const[mn,mx]=activeFilters.priceRange.split('-'); params.append('minPrice',mn); params.append('maxPrice',mx); }
      if(activeFilters.minBeds)   params.append('beds', activeFilters.minBeds);
      if(activeFilters.type)      params.append('type', activeFilters.type);
      if(activeFilters.hood)      params.append('city', activeFilters.hood);

      const res = await fetch(`/api/listings?${params}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();

      if (data.listings && data.listings.length > 0) {
        // API returned real TREB listings — enrich with our calc engine
        const enriched = data.listings.map(l => {
          // Map TREB field names to our format
          const normalized = {
            ...l,
            rent: l.estimatedRent || l.grossRent || l.gross || 0,
            neighbourhood: l.city || l.neighbourhood || 'Mississauga',
            dom: l.daysOnMarket || l.dom || 0,
            brokerage: l.listingBrokerage || l.brokerage || '',
            originalPrice: l.originalPrice || l.OriginalListPrice || l.price,
            photos: l.images || l.photos || [],
          };
          return enrichListing(normalized);
        });
        // Sort by deal score descending by default
        const sorted = applySort(enriched, sort);
        setListings(sorted);
        setLiveData(true);
        setTotalPages(data.pages || 1);
      } else {
        throw new Error('No listings returned');
      }
    } catch (err) {
      console.warn('TREB API unavailable, using sample data:', err.message);
      setApiError(err.message);
      setLiveData(false);
      // Fall back to sample data
      const enriched = SAMPLE_LISTINGS.map(enrichListing);
      setListings(applySort(enriched, sort));
    }
    setLoading(false);
  }, [sort]);

  useEffect(()=>{ fetchListings(1, filters); }, []);

  // Re-fetch when page changes (live data only)
  useEffect(()=>{
    if(liveData && page > 1) fetchListings(page, filters);
  }, [page, liveData]);

  const displayed = useMemo(()=>applySort(applyFilters(listings,filters),sort),[listings,filters,sort]);
  const dealOfWeek = useMemo(()=>[...displayed].sort((a,b)=>b.dealScore-a.dealScore)[0],[displayed]);

  const handleCardClick = useCallback((listing)=>{
    const nv=views+1;
    setViews(nv);
    localStorage.setItem('mi_views',nv);
    if(!user&&nv>=FREE_VIEWS){setSigTrigger(`${nv} views`);setShowSignup(true);return;}
    setSelected(listing);
  },[views,user]);

  const handleSignup = useCallback(u=>{
    setUser(u);
    localStorage.setItem('mi_user',JSON.stringify(u));
    setShowSignup(false);
  },[]);

  const updFilter  = useCallback((k,v)=>setFilters(p=>({...p,[k]:v})),[]);
  const resetFilters = useCallback(()=>setFilters({}),[]);

  return (
    <div style={{minHeight:'100vh',background:C.navy,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',color:C.text}}>

      {/* HEADER */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,position:'sticky',top:0,zIndex:200}}>
        <div style={{maxWidth:1440,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',height:56,gap:24}}>
          <div style={{fontWeight:900,fontSize:17,letterSpacing:'-0.02em',whiteSpace:'nowrap',flexShrink:0}}>
            <span style={{color:C.blue}}>Mississauga</span><span style={{color:C.text}}>Investor</span>
            <span style={{fontSize:9,fontWeight:500,color:C.muted,marginLeft:6,letterSpacing:'0.09em',textTransform:'uppercase'}}>AI Deal Screener</span>
          </div>
          <div style={{display:'flex'}}>
            {[['listings','Properties'],['calculator','Calculator'],['market','Market Pulse'],['contact','Contact']].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                style={{padding:'0 16px',fontSize:13,fontWeight:tab===id?700:400,background:'transparent',border:'none',borderBottom:`2px solid ${tab===id?C.blue:'transparent'}`,color:tab===id?C.blue:C.textSec,cursor:'pointer',height:56,borderRadius:0,whiteSpace:'nowrap'}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:14}}>
            {liveData&&<span style={{background:C.greenDim,color:C.green,fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,border:`1px solid ${C.green}44`}}>● LIVE TREB DATA</span>}
            {!liveData&&!loading&&<span style={{background:C.amberDim,color:C.amber,fontSize:10,fontWeight:600,padding:'3px 10px',borderRadius:20,border:`1px solid ${C.amber}44`}}>SAMPLE DATA</span>}
            {!user&&views>4&&views<FREE_VIEWS&&<span style={{fontSize:11,color:C.amber,fontWeight:600}}>{FREE_VIEWS-views} free views left</span>}
            {user
              ?<span style={{fontSize:13,color:C.textSec,fontWeight:600}}>👋 {user.name?.split(' ')[0]}</span>
              :<button onClick={()=>{setSigTrigger('header');setShowSignup(true);}} style={{padding:'7px 16px',fontSize:13,fontWeight:700,background:C.blue,color:C.white,border:'none',borderRadius:8,cursor:'pointer'}}>Sign Up Free</button>
            }
            <a href="tel:6476091289" style={{fontSize:13,fontWeight:600,color:C.blue,textDecoration:'none'}}>647-609-1289</a>
          </div>
        </div>
      </div>

      {tab==='listings'&&<FilterBar filters={filters} onChange={updFilter} onReset={resetFilters} count={displayed.length}/>}

      <div style={{maxWidth:1440,margin:'0 auto',padding:'28px 24px'}}>
        {tab==='listings'&&(
          <>
            {!user&&views>5&&views<FREE_VIEWS&&(
              <div style={{background:C.amberDim,border:`1px solid ${C.amber}44`,borderRadius:10,padding:'11px 18px',marginBottom:22,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:13,color:C.amber,fontWeight:600}}>🔔 {FREE_VIEWS-views} free views remaining — sign up for full AI analysis</span>
                <button onClick={()=>{setSigTrigger('nudge');setShowSignup(true);}} style={{fontSize:13,fontWeight:700,color:C.blue,background:'transparent',border:`1px solid ${C.blue}55`,borderRadius:8,padding:'6px 14px',cursor:'pointer'}}>Sign up free →</button>
              </div>
            )}

            {/* Loading state */}
            {loading&&(
              <div style={{textAlign:'center',padding:80}}>
                <div style={{fontSize:36,marginBottom:16}}>⏳</div>
                <div style={{fontSize:16,color:C.textSec,marginBottom:8}}>Loading live listings from TREB...</div>
                <div style={{fontSize:13,color:C.muted}}>Fetching Mississauga investment properties</div>
              </div>
            )}

            {!loading&&(
              <>
                <DealOfWeek listing={dealOfWeek} onClick={()=>dealOfWeek&&handleCardClick(dealOfWeek)}/>

                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                  <div style={{fontSize:14,fontWeight:800,color:C.text}}>
                    All Listings {liveData&&<span style={{fontSize:11,color:C.muted,fontWeight:400}}>— live TREB data</span>}
                  </div>
                  <div style={{flex:1,height:1,background:C.border}}/>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:12,color:C.muted}}>Sort:</span>
                    <select value={sort} onChange={e=>setSort(e.target.value)}
                      style={{padding:'7px 12px',fontSize:12,border:`1px solid ${C.border}`,borderRadius:8,background:C.surface,color:C.text,outline:'none',cursor:'pointer'}}>
                      {[['score','Best Deal Score'],['cf','Highest Cash Flow'],['cap','Best Cap Rate'],['pAsc','Price: Low → High'],['pDesc','Price: High → Low'],['dom','Newest Listed']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {displayed.length===0?(
                  <div style={{textAlign:'center',padding:80}}>
                    <div style={{fontSize:36,marginBottom:12}}>🔍</div>
                    <div style={{fontSize:15,color:C.textSec,marginBottom:12}}>No listings match your filters</div>
                    <button onClick={resetFilters} style={{color:C.blue,background:'transparent',border:`1px solid ${C.blue}`,borderRadius:8,padding:'9px 20px',cursor:'pointer',fontSize:13,fontWeight:600}}>Clear Filters</button>
                  </div>
                ):(
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(305px, 1fr))',gap:18}}>
                    {displayed.map(l=>(
                      <PropertyCard key={l.id||l.ListingKey} listing={l} onClick={()=>handleCardClick(l)} isDoW={l.id===dealOfWeek?.id}/>
                    ))}
                  </div>
                )}

                {/* Pagination (live data only) */}
                {liveData&&totalPages>1&&(
                  <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:32}}>
                    {Array.from({length:Math.min(totalPages,10)},(_,i)=>i+1).map(p=>(
                      <button key={p} onClick={()=>setPage(p)}
                        style={{padding:'8px 14px',fontSize:13,fontWeight:p===page?700:400,background:p===page?C.blue:C.surface,color:p===page?C.white:C.textSec,border:`1px solid ${p===page?C.blue:C.border}`,borderRadius:8,cursor:'pointer'}}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{marginTop:40,paddingTop:20,borderTop:`1px solid ${C.border}`,fontSize:10,color:C.muted,lineHeight:1.8}}>
                  {liveData
                    ? 'Listing information provided by PropTx Innovations Inc. and the Toronto Regional Real Estate Board (TRREB). All rights reserved. Information deemed reliable but not guaranteed accurate. The trademarks MLS®, Multiple Listing Service® are owned by The Canadian Real Estate Association (CREA). Not intended to solicit properties already listed.'
                    : 'Sample listings shown for demonstration. Live TREB data will appear once the API connection is active. Investment calculations are estimates only.'
                  }
                </div>
              </>
            )}
          </>
        )}
        {tab==='calculator'&&<CalculatorTab/>}
        {tab==='market'&&<MarketPulseTab/>}
        {tab==='contact'&&<ContactTab/>}
      </div>

      {showSignup&&<SignupModal trigger={sigTrigger} onSuccess={handleSignup}/>}
      {selected&&<DealModal listing={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}

// ── CALCULATOR ────────────────────────────────────────────────────────────
function CalculatorTab() {
  const [inp,setInp]=useState({price:900000,rent:3500,dpPct:0.20,rate:0.0599,years:25,vacRate:0.03,maintPct:0.05,mgmtPct:0});
  const m=useMemo(()=>calcMetrics(inp),[inp]);
  const {s,label}=useMemo(()=>getDealScore(m,{notes:'',neighbourhood:''}),[m]);
  const u=(k,v)=>setInp(p=>({...p,[k]:v}));
  if(!m)return null;
  const cfColor=m.cf>=0?C.green:C.red;
  const NI=({lbl,k,pfx='$'})=>(
    <div style={{marginBottom:12}}>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:C.textSec,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{lbl}</label>
      <div style={{display:'flex',background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden'}}>
        <span style={{padding:'10px 11px',fontSize:13,color:C.muted,borderRight:`1px solid ${C.border}`}}>{pfx}</span>
        <input type="number" value={inp[k]} onChange={e=>u(k,parseFloat(e.target.value)||0)}
          style={{flex:1,padding:'10px 13px',border:'none',outline:'none',fontSize:14,color:C.text,background:'transparent'}}/>
      </div>
    </div>
  );
  const PR=({l,v,color,indent,bold,divider})=>divider?<div style={{borderTop:`1px solid ${C.border}`,margin:'7px 0'}}/> :(
    <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',paddingLeft:indent?14:0}}>
      <span style={{fontSize:13,color:C.textSec,fontWeight:bold?600:400}}>{l}</span>
      <span style={{fontSize:13,fontWeight:bold?700:500,color:color||C.text}}>{v}</span>
    </div>
  );
  return (
    <div>
      <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:4}}>Investment Calculator</div>
      <div style={{fontSize:13,color:C.textSec,marginBottom:24}}>Canadian semi-annual compounding · Mississauga 0.72% tax rate · Score calibrated to Mississauga market</div>
      <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:22,maxWidth:960}}>
        <div style={{background:C.card,borderRadius:12,padding:20,border:`1px solid ${C.border}`}}>
          <NI lbl="Property Price" k="price"/> <NI lbl="Monthly Rent" k="rent"/> <NI lbl="Down Payment %" k="dpPct" pfx="%"/>
          <NI lbl="Interest Rate %" k="rate" pfx="%"/> <NI lbl="Amortization (yrs)" k="years" pfx="yr"/>
          <NI lbl="Vacancy %" k="vacRate" pfx="%"/> <NI lbl="Maintenance %" k="maintPct" pfx="%"/> <NI lbl="Mgmt %" k="mgmtPct" pfx="%"/>
        </div>
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:14}}>
            {[
              {l:'Monthly Cash Flow',v:fCF(m.cf),color:cfColor,bg:m.cf>=0?C.greenDim:C.redDim},
              {l:'Annual Cash Flow',v:fCF(m.cfYear),color:cfColor,bg:m.cf>=0?C.greenDim:C.redDim},
              {l:'Cap Rate',v:fPct(m.capRate),color:m.capRate>=4?C.green:C.amber,bg:m.capRate>=4?C.greenDim:C.amberDim},
              {l:'Total Return (CF+Equity)',v:fPct(m.totalReturn),color:m.totalReturn>=3?C.green:C.amber,bg:m.totalReturn>=3?C.greenDim:C.amberDim},
            ].map(chip=>(
              <div key={chip.l} style={{background:chip.bg,borderRadius:10,padding:'14px 16px',border:`1px solid ${chip.color}22`}}>
                <div style={{fontSize:10,color:C.muted,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:700}}>{chip.l}</div>
                <div style={{fontSize:22,fontWeight:800,color:chip.color}}>{chip.v}</div>
              </div>
            ))}
          </div>
          <div style={{background:C.card,borderRadius:12,padding:18,border:`1px solid ${C.border}`,marginBottom:12}}>
            {[
              {l:'Gross Rent',v:f$(m.gross),color:C.green},{l:'Vacancy',v:'− '+f$(m.vac),indent:true},
              {l:'Effective Income',v:f$(m.eff),bold:true},{divider:true},
              {l:'Tax + Ins + Maint',v:'− '+f$(m.opex),color:C.amber},
              {l:'Net Operating Income',v:f$(m.noi),bold:true},{l:'Mortgage',v:'− '+f$(m.mtg),color:C.red,indent:true},
              {divider:true},{l:'Monthly Cash Flow',v:fCF(m.cf),color:cfColor,bold:true},
              {l:'Monthly Equity Paydown',v:'+'+f$(Math.round(m.annualEquity/12)),color:C.purple,indent:true},
            ].map((r,i)=><PR key={i} {...r}/>)}
          </div>
          <div style={{background:C.card,borderRadius:12,padding:18,border:`1px solid ${C.border}`,textAlign:'center'}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:'0.08em',marginBottom:4}}>DEAL SCORE (MISSISSAUGA CALIBRATED)</div>
            <div style={{fontSize:52,fontWeight:900,color:scoreColor(s),lineHeight:1}}>{s}</div>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:4}}>out of 10</div>
            <div style={{fontSize:15,fontWeight:700,color:scoreColor(s)}}>{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketPulseTab() {
  return (
    <div style={{maxWidth:820}}>
      <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:4}}>Mississauga Market Pulse</div>
      <div style={{fontSize:13,color:C.textSec,marginBottom:26}}>Updated March 2026 · TRREB data · Hamza Nouman analysis</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
        {[
          {l:'Sale-to-List Ratio',v:'0.97',note:'Below 1.0 — buyer has negotiating room',color:C.amber},
          {l:'Avg Days on Market',v:'28d',note:'Up from 18 days year-over-year',color:C.amber},
          {l:'Active Listings (Mississauga)',v:'1,847',note:'Up 34% year-over-year',color:C.green},
          {l:'Sales-to-New Listings',v:'0.41',note:"Neutral/soft — seller's market is above 0.60",color:C.amber},
          {l:'Benchmark SFH Price',v:'$1.14M',note:'Mississauga, March 2026 estimate',color:C.text},
          {l:'Avg Cap Rate (Detached)',v:'3.2–4.1%',note:'Range across Mississauga neighbourhoods',color:C.blue},
        ].map((s,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>{s.l}</div>
            <div style={{fontSize:26,fontWeight:800,color:s.color,marginBottom:6}}>{s.v}</div>
            <div style={{fontSize:12,color:C.textSec}}>{s.note}</div>
          </div>
        ))}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
        <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:10}}>Hamza's Take — March 2026</div>
        <div style={{fontSize:13,color:C.textSec,lineHeight:1.85}}>
          Market is soft but not distressed. Best plays: <strong style={{color:C.text}}>semi-detached with basement suite potential in Clarkson and Cooksville, under $950K.</strong> Avoid condos under 800 sqft. Lakeview is the long-term land value play.
        </div>
      </div>
    </div>
  );
}

function ContactTab() {
  return (
    <div style={{maxWidth:500}}>
      <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:4}}>Talk to Hamza</div>
      <div style={{fontSize:13,color:C.textSec,marginBottom:26}}>Mississauga investment specialist · Royal LePage Signature Realty</div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:28}}>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:2}}>Hamza Nouman</div>
        <div style={{fontSize:13,color:C.textSec,marginBottom:22}}>Sales Representative · Royal LePage Signature Realty</div>
        <a href="tel:6476091289" style={{display:'block',background:C.blue,color:C.white,textAlign:'center',padding:14,borderRadius:10,fontSize:15,fontWeight:700,textDecoration:'none',marginBottom:10}}>📞 647-609-1289</a>
        <a href="mailto:hamza@nouman.ca" style={{display:'block',border:`1px solid ${C.border}`,color:C.text,textAlign:'center',padding:13,borderRadius:10,fontSize:14,fontWeight:600,textDecoration:'none',marginBottom:10}}>✉️ hamza@nouman.ca</a>
        <a href="https://www.hamzahomes.ca" target="_blank" rel="noreferrer" style={{display:'block',border:`1px solid ${C.border}`,color:C.textSec,textAlign:'center',padding:13,borderRadius:10,fontSize:14,textDecoration:'none'}}>🌐 HamzaHomes.ca</a>
        <div style={{marginTop:20,fontSize:11,color:C.muted,textAlign:'center',lineHeight:1.7}}>
          8 Sampson Mews, Suite 201, Toronto ON<br/>
          <a href="https://www.mississaugainvestor.ca/privacy" style={{color:C.muted}}>Privacy Policy</a> · <a href="https://www.mississaugainvestor.ca/terms" style={{color:C.muted}}>Terms of Use</a>
        </div>
      </div>
    </div>
  );
}
