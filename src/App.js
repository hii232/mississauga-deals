// MississaugaInvestor.ca — App.js v13
// - No password wall. Users browse freely.
// - Gate at 10 property views: First Name, Last Name, Email, Phone, Working with realtor?
// - HouseSigma/Zolo-style professional layout
// UPLOAD: drag-drop to GitHub src/App.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';

const C = {
  blue: '#1A56DB', blueDark: '#1342B5', blueLight: '#EBF2FF',
  gold: '#F59E0B', navy: '#0A0F1E', surface: '#F8FAFC', white: '#FFFFFF',
  card: '#FFFFFF', border: '#E2E8F0', borderDark: '#CBD5E1',
  text: '#0F172A', textSec: '#475569', muted: '#94A3B8',
  green: '#059669', greenLight: '#ECFDF5', red: '#DC2626', redLight: '#FEF2F2',
  amber: '#D97706', amberLight: '#FFFBEB',
};

// Canadian mortgage math (semi-annual compounding)
function calculateMetrics({ price, estimatedRent, downPaymentPct=0.20, interestRate=0.0599, amortizationYears=25, propertyTaxRate=0.0072, insuranceMonthly=175, maintenancePct=0.05, vacancyRate=0.03, propertyMgmtPct=0 }) {
  if (!price || !estimatedRent) return null;
  const downPayment = price * downPaymentPct;
  const loanAmount = price - downPayment;
  const closingCosts = price * 0.015;
  const totalCashInvested = downPayment + closingCosts;
  const effAnnual = Math.pow(1 + interestRate/2, 2) - 1;
  const mRate = Math.pow(1 + effAnnual, 1/12) - 1;
  const n = amortizationYears * 12;
  const mortgagePayment = loanAmount * (mRate * Math.pow(1+mRate,n)) / (Math.pow(1+mRate,n)-1);
  const grossRent = estimatedRent;
  const vacancyLoss = grossRent * vacancyRate;
  const effectiveIncome = grossRent - vacancyLoss;
  const taxMonthly = (price * propertyTaxRate) / 12;
  const maintMonthly = grossRent * maintenancePct;
  const mgmtMonthly = grossRent * propertyMgmtPct;
  const totalOpEx = taxMonthly + insuranceMonthly + maintMonthly + mgmtMonthly;
  const monthlyNOI = effectiveIncome - totalOpEx;
  const annualNOI = monthlyNOI * 12;
  const monthlyCashFlow = monthlyNOI - mortgagePayment;
  const annualCashFlow = monthlyCashFlow * 12;
  const capRate = (annualNOI / price) * 100;
  const cashOnCash = (annualCashFlow / totalCashInvested) * 100;
  const grm = price / (grossRent * 12);
  return {
    downPayment:Math.round(downPayment), loanAmount:Math.round(loanAmount),
    totalCashInvested:Math.round(totalCashInvested), closingCosts:Math.round(closingCosts),
    mortgagePayment:Math.round(mortgagePayment), grossRent:Math.round(grossRent),
    vacancyLoss:Math.round(vacancyLoss), effectiveIncome:Math.round(effectiveIncome),
    taxMonthly:Math.round(taxMonthly), insuranceMonthly:Math.round(insuranceMonthly),
    maintMonthly:Math.round(maintMonthly), mgmtMonthly:Math.round(mgmtMonthly),
    totalOpEx:Math.round(totalOpEx), totalMonthlyExpenses:Math.round(totalOpEx+mortgagePayment),
    monthlyNOI:Math.round(monthlyNOI), annualNOI:Math.round(annualNOI),
    monthlyCashFlow:Math.round(monthlyCashFlow), annualCashFlow:Math.round(annualCashFlow),
    capRate:parseFloat(capRate.toFixed(2)), cashOnCash:parseFloat(cashOnCash.toFixed(2)),
    grm:parseFloat(grm.toFixed(1)),
  };
}

function scoreDeal(m) {
  if (!m) return { score:0, grade:'N/A' };
  let s = 5;
  if (m.capRate>=6) s+=2.5; else if (m.capRate>=4.5) s+=1.5; else if (m.capRate>=3) s+=0.5; else if (m.capRate<2) s-=1.5;
  if (m.monthlyCashFlow>=500) s+=1.5; else if (m.monthlyCashFlow>=200) s+=0.75; else if (m.monthlyCashFlow>=0) s+=0.25; else if (m.monthlyCashFlow<-300) s-=1;
  if (m.cashOnCash>=8) s+=1; else if (m.cashOnCash>=5) s+=0.5; else if (m.cashOnCash<0) s-=0.5;
  if (m.grm<=15) s+=0.5; else if (m.grm>=25) s-=0.5;
  const score = parseFloat(Math.min(10,Math.max(0,s)).toFixed(1));
  const grade = score>=8.5?'A+':score>=7.5?'A':score>=6.5?'B+':score>=5.5?'B':score>=4.5?'C+':score>=3.5?'C':'D';
  return { score, grade };
}

const RAW = [
  {id:'L001',hamzasPick:true,address:'147 Lakeshore Rd E',city:'Mississauga',neighbourhood:'Port Credit',price:1125000,originalPrice:1175000,beds:4,baths:3,sqft:1950,type:'Semi-Detached',yearBuilt:1998,daysOnMarket:12,estimatedRent:4200,listingBrokerage:'Royal LePage Signature Realty',notes:'Corner lot, separate entrance to basement suite. Steps to Port Credit GO.'},
  {id:'L002',address:'3290 Battleford Rd #42',city:'Mississauga',neighbourhood:'Clarkson',price:689000,originalPrice:689000,beds:3,baths:2,sqft:1420,type:'Townhouse',yearBuilt:2008,daysOnMarket:5,estimatedRent:3100,listingBrokerage:'Royal LePage Signature Realty',notes:'5min to Clarkson GO. Strong rental demand.'},
  {id:'L003',address:'5985 Creditview Rd',city:'Mississauga',neighbourhood:'Hurontario',price:875000,originalPrice:920000,beds:4,baths:3,sqft:1780,type:'Detached',yearBuilt:2001,daysOnMarket:22,estimatedRent:3800,listingBrokerage:'Royal LePage Signature Realty',notes:'Finished basement suite. Near future Hazel McCallion LRT.'},
  {id:'L004',address:'2150 Burnhamthorpe Rd W #808',city:'Mississauga',neighbourhood:'Erin Mills',price:549000,originalPrice:549000,beds:2,baths:2,sqft:890,type:'Condo Apartment',yearBuilt:2016,daysOnMarket:3,estimatedRent:2400,listingBrokerage:'Royal LePage Signature Realty',notes:'High-floor unit. Low condo fees. Strong rental pool.'},
  {id:'L005',address:'1441 Dunwin Dr',city:'Mississauga',neighbourhood:'Cooksville',price:1345000,originalPrice:1399000,beds:5,baths:4,sqft:2600,type:'Detached',yearBuilt:1989,daysOnMarket:34,estimatedRent:5200,listingBrokerage:'Royal LePage Signature Realty',notes:'Full duplex conversion opportunity. Near Trillium Hospital.'},
  {id:'L006',address:'460 Meadowbrook Dr',city:'Mississauga',neighbourhood:'Meadowvale',price:798000,originalPrice:798000,beds:3,baths:2,sqft:1540,type:'Semi-Detached',yearBuilt:1995,daysOnMarket:8,estimatedRent:3300,listingBrokerage:'Royal LePage Signature Realty',notes:'Side entrance to basement. Top school catchment.'},
  {id:'L007',address:'225 Webb Dr #1205',city:'Mississauga',neighbourhood:'City Centre',price:499000,originalPrice:519000,beds:1,baths:1,sqft:640,type:'Condo Apartment',yearBuilt:2011,daysOnMarket:19,estimatedRent:2100,listingBrokerage:'Royal LePage Signature Realty',notes:'Steps to Square One. High-demand rental unit.'},
  {id:'L008',address:'1033 Andersons Lane',city:'Mississauga',neighbourhood:'Lakeview',price:1050000,originalPrice:1099000,beds:3,baths:2,sqft:1320,type:'Detached',yearBuilt:1962,daysOnMarket:41,estimatedRent:3800,listingBrokerage:'Royal LePage Signature Realty',notes:'Lakeview Village redevelopment zone. Long-term land value play.'},
];

const ALL_LISTINGS = RAW.map(l => {
  const m = calculateMetrics({price:l.price, estimatedRent:l.estimatedRent});
  const {score,grade} = scoreDeal(m);
  return {...l,...m, dealScore:score, dealGrade:grade, priceReduction:l.originalPrice>l.price?Math.round(((l.originalPrice-l.price)/l.originalPrice)*100):0};
});

const fmt$ = n => '$'+Math.abs(Math.round(n||0)).toLocaleString();
const fmtCF = n => n==null?'--':(n>=0?'+$':'-$')+Math.abs(Math.round(n)).toLocaleString();

// ── SIGNUP MODAL ──
function SignupModal({onSuccess,trigger}) {
  const [f,setF] = useState({firstName:'',lastName:'',email:'',phone:'',hasRealtor:''});
  const [err,setErr] = useState({});
  const [loading,setLoading] = useState(false);

  const validate = () => {
    const e={};
    if (!f.firstName.trim()) e.firstName='Required';
    if (!f.lastName.trim()) e.lastName='Required';
    if (!f.email.includes('@')) e.email='Enter a valid email';
    if (!f.phone.replace(/\D/g,'').match(/^\d{10}$/)) e.phone='Enter a valid 10-digit phone number';
    if (!f.hasRealtor) e.hasRealtor='Please select one';
    return e;
  };

  const submit = async () => {
    const e=validate(); if(Object.keys(e).length){setErr(e);return;}
    setLoading(true);
    await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...f,trigger,source:'signup_gate',timestamp:new Date().toISOString()})}).catch(()=>{});
    onSuccess({email:f.email, name:`${f.firstName} ${f.lastName}`, hasRealtor:f.hasRealtor});
    setLoading(false);
  };

  const inp = (label,key,type='text',placeholder='') => (
    <div style={{marginBottom:16}}>
      <label style={{display:'block',fontSize:13,fontWeight:600,color:C.text,marginBottom:6}}>{label}</label>
      <input type={type} placeholder={placeholder} value={f[key]}
        onChange={e=>{setF(p=>({...p,[key]:e.target.value}));setErr(p=>({...p,[key]:''}))} }
        style={{width:'100%',padding:'12px 14px',fontSize:15,border:`1.5px solid ${err[key]?C.red:C.border}`,borderRadius:8,outline:'none',boxSizing:'border-box',color:C.text,background:C.white}} />
      {err[key]&&<div style={{color:C.red,fontSize:12,marginTop:4}}>{err[key]}</div>}
    </div>
  );

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:C.white,borderRadius:16,width:'100%',maxWidth:480,padding:36,boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:13,fontWeight:700,color:C.blue,letterSpacing:'0.06em',marginBottom:8}}>FREE ACCESS</div>
          <div style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:8,lineHeight:1.3}}>Unlock Full Investment Analysis</div>
          <div style={{fontSize:14,color:C.textSec,lineHeight:1.6}}>See cash flow, cap rate, and ROI on every property in Mississauga. Free, no credit card.</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
          <div>{inp('First Name','firstName','text','John')}</div>
          <div>{inp('Last Name','lastName','text','Smith')}</div>
        </div>
        {inp('Email Address','email','email','john@email.com')}
        {inp('Phone Number','phone','tel','416-555-0123')}
        <div style={{marginBottom:20}}>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:C.text,marginBottom:10}}>Are you currently working with a realtor?</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {['Yes','No'].map(opt=>(
              <button key={opt} onClick={()=>{setF(p=>({...p,hasRealtor:opt}));setErr(p=>({...p,hasRealtor:''}))}}
                style={{padding:'12px',fontSize:14,fontWeight:600,borderRadius:8,cursor:'pointer',border:`2px solid ${f.hasRealtor===opt?C.blue:C.border}`,background:f.hasRealtor===opt?C.blueLight:C.white,color:f.hasRealtor===opt?C.blue:C.textSec}}>
                {opt}
              </button>
            ))}
          </div>
          {err.hasRealtor&&<div style={{color:C.red,fontSize:12,marginTop:6}}>{err.hasRealtor}</div>}
        </div>
        <button onClick={submit} disabled={loading}
          style={{width:'100%',padding:15,background:loading?C.muted:C.blue,border:'none',borderRadius:10,color:C.white,fontSize:16,fontWeight:700,cursor:loading?'not-allowed':'pointer',marginBottom:14}}>
          {loading?'Creating account...':'Get Free Access →'}
        </button>
        <div style={{fontSize:11,color:C.muted,textAlign:'center',lineHeight:1.6}}>
          By signing up you agree to receive property alerts from Hamza Nouman, Royal LePage Signature Realty. No spam. Unsubscribe anytime.
        </div>
      </div>
    </div>
  );
}

// ── DEAL MODAL ──
function DealModal({listing,onClose}) {
  const [a,setA] = useState({downPaymentPct:0.20,interestRate:0.0599,amortizationYears:25,vacancyRate:0.03,maintenancePct:0.05,propertyMgmtPct:0,estimatedRent:listing.estimatedRent||2400});
  const m = useMemo(()=>calculateMetrics({price:listing.price,...a}),[listing.price,a]);
  const {score,grade} = useMemo(()=>scoreDeal(m),[m]);
  const upd=(k,v)=>setA(p=>({...p,[k]:v}));

  useEffect(()=>{const esc=e=>e.key==='Escape'&&onClose();window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc);},[onClose]);
  if(!m) return null;
  const cfColor=m.monthlyCashFlow>=0?C.green:C.red;
  const cfBg=m.monthlyCashFlow>=0?C.greenLight:C.redLight;

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.75)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'24px 16px',overflowY:'auto'}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.white,borderRadius:16,width:'100%',maxWidth:940,boxShadow:'0 25px 80px rgba(0,0,0,0.3)'}}>

        {/* Header */}
        <div style={{padding:'22px 28px 18px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4}}>
              <span style={{fontSize:18,fontWeight:800,color:C.text}}>{listing.address}</span>
              {listing.hamzasPick&&<span style={{background:'#FEF3C7',color:C.amber,fontSize:11,fontWeight:700,padding:'2px 10px',borderRadius:20,border:'1px solid #FDE68A'}}>⭐ HAMZA'S PICK</span>}
            </div>
            <div style={{fontSize:13,color:C.textSec}}>{listing.neighbourhood} · {listing.type} · {listing.beds} bed · {listing.baths} bath{listing.sqft?` · ${listing.sqft.toLocaleString()} sqft`:''}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:22,fontWeight:800,color:C.text}}>{fmt$(listing.price)}</div>
              {listing.priceReduction>0&&<div style={{fontSize:12,color:C.red,fontWeight:600}}>▼ {listing.priceReduction}% from asking</div>}
            </div>
            <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,width:36,height:36,fontSize:18,cursor:'pointer',color:C.textSec}}>✕</button>
          </div>
        </div>

        <div style={{padding:28,display:'grid',gridTemplateColumns:'1fr 340px',gap:24}}>
          {/* LEFT */}
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
              {[
                {label:'Monthly Cash Flow',value:fmtCF(m.monthlyCashFlow),bg:cfBg,color:cfColor},
                {label:'Cap Rate',value:m.capRate.toFixed(2)+'%',bg:m.capRate>=4?C.greenLight:C.amberLight,color:m.capRate>=4?C.green:C.amber},
                {label:'Cash-on-Cash',value:m.cashOnCash.toFixed(2)+'%',bg:m.cashOnCash>=5?C.greenLight:C.amberLight,color:m.cashOnCash>=5?C.green:C.amber},
                {label:'Deal Score',value:`${score} ${grade}`,bg:score>=7.5?C.greenLight:score>=5.5?C.amberLight:C.redLight,color:score>=7.5?C.green:score>=5.5?C.amber:C.red},
              ].map(s=>(
                <div key={s.label} style={{background:s.bg,borderRadius:10,padding:'14px 12px',textAlign:'center',border:`1px solid ${s.color}22`}}>
                  <div style={{fontSize:10,color:C.textSec,marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em'}}>{s.label}</div>
                  <div style={{fontSize:17,fontWeight:800,color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{background:C.surface,borderRadius:12,padding:20,border:`1px solid ${C.border}`,marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14}}>Monthly P&L Breakdown</div>
              {[
                {l:'Gross Rent',v:fmt$(m.grossRent),color:C.green},
                {l:'Vacancy Loss',v:'− '+fmt$(m.vacancyLoss),indent:true},
                {l:'Effective Income',v:fmt$(m.effectiveIncome),bold:true},
                {divider:true},
                {l:'Property Tax',v:'− '+fmt$(m.taxMonthly),indent:true},
                {l:'Insurance',v:'− '+fmt$(m.insuranceMonthly),indent:true},
                {l:'Maintenance Reserve',v:'− '+fmt$(m.maintMonthly),indent:true},
                ...(m.mgmtMonthly>0?[{l:'Property Mgmt',v:'− '+fmt$(m.mgmtMonthly),indent:true}]:[]),
                {l:'Total Operating Expenses',v:'− '+fmt$(m.totalOpEx),color:C.amber,bold:true},
                {divider:true},
                {l:'Net Operating Income',v:fmt$(m.monthlyNOI),bold:true},
                {l:'Mortgage Payment',v:'− '+fmt$(m.mortgagePayment),color:C.red,indent:true},
                {divider:true},
                {l:'Monthly Cash Flow',v:fmtCF(m.monthlyCashFlow),color:cfColor,bold:true,large:true},
              ].map((row,i)=>row.divider?<div key={i} style={{borderTop:`1px solid ${C.border}`,margin:'8px 0'}}/>:(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',paddingLeft:row.indent?14:0}}>
                  <span style={{fontSize:row.large?14:13,color:C.textSec,fontWeight:row.bold?600:400}}>{row.l}</span>
                  <span style={{fontSize:row.large?15:13,fontWeight:row.bold?700:500,color:row.color||C.text}}>{row.v}</span>
                </div>
              ))}
            </div>

            <div style={{background:C.surface,borderRadius:12,padding:20,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14}}>Capital Required to Close</div>
              {[
                {l:'Down Payment (20%)',v:fmt$(m.downPayment)},
                {l:'Closing Costs (~1.5%)',v:fmt$(m.closingCosts)},
                {l:'Total Cash Required',v:fmt$(m.totalCashInvested),bold:true},
              ].map((row,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0'}}>
                  <span style={{fontSize:13,color:C.textSec,fontWeight:row.bold?600:400}}>{row.l}</span>
                  <span style={{fontSize:13,fontWeight:row.bold?700:500,color:C.text}}>{row.v}</span>
                </div>
              ))}
              <div style={{marginTop:10,fontSize:12,color:C.muted}}>
                Mortgage: {fmt$(m.mortgagePayment)}/mo · {fmt$(m.loanAmount)} loan · 5.99% · 25yr · Canadian semi-annual compounding
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div style={{background:C.surface,borderRadius:12,padding:20,border:`1px solid ${C.border}`,marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:16}}>Adjust Assumptions</div>
              {[
                {label:'Monthly Rent',key:'estimatedRent',min:1000,max:8000,step:50,fmt:v=>fmt$(v)},
                {label:'Down Payment',key:'downPaymentPct',min:0.05,max:0.50,step:0.05,fmt:v=>(v*100).toFixed(0)+'%'},
                {label:'Interest Rate',key:'interestRate',min:0.03,max:0.10,step:0.0025,fmt:v=>(v*100).toFixed(2)+'%'},
                {label:'Amortization',key:'amortizationYears',min:15,max:30,step:5,fmt:v=>v+' yrs'},
                {label:'Vacancy Rate',key:'vacancyRate',min:0,max:0.15,step:0.01,fmt:v=>(v*100).toFixed(0)+'%'},
                {label:'Maintenance',key:'maintenancePct',min:0.02,max:0.15,step:0.01,fmt:v=>(v*100).toFixed(0)+'% rent'},
                {label:'Property Mgmt',key:'propertyMgmtPct',min:0,max:0.15,step:0.01,fmt:v=>v===0?'Self-managed':(v*100).toFixed(0)+'% rent'},
              ].map(s=>(
                <div key={s.key} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                    <span style={{fontSize:12,color:C.textSec}}>{s.label}</span>
                    <span style={{fontSize:12,fontWeight:700,color:C.text}}>{s.fmt(a[s.key])}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={a[s.key]}
                    onChange={e=>upd(s.key,parseFloat(e.target.value))}
                    style={{width:'100%',accentColor:C.blue,cursor:'pointer'}} />
                </div>
              ))}
            </div>

            <div style={{background:C.blue,borderRadius:12,padding:20,color:C.white,marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>Book a Showing</div>
              <div style={{fontSize:12,opacity:0.85,marginBottom:16}}>Hamza Nouman · Royal LePage Signature Realty</div>
              <a href="tel:6476091289" style={{display:'block',background:C.white,color:C.blue,textAlign:'center',padding:'12px',borderRadius:8,fontSize:14,fontWeight:700,textDecoration:'none',marginBottom:8}}>📞 647-609-1289</a>
              <a href={`mailto:hamza@nouman.ca?subject=Showing Request: ${listing.address}`}
                style={{display:'block',background:'rgba(255,255,255,0.15)',color:C.white,textAlign:'center',padding:'11px',borderRadius:8,fontSize:14,fontWeight:600,textDecoration:'none'}}>✉️ Email Hamza</a>
            </div>

            <div style={{fontSize:11,color:C.muted,lineHeight:1.7}}>
              Listed by: <strong style={{color:C.textSec}}>{listing.listingBrokerage}</strong><br/>
              Information deemed reliable but not guaranteed. Not intended to solicit listed properties.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PROPERTY CARD ──
function PropertyCard({listing,onClick}) {
  const [hov,setHov]=useState(false);
  const cf=listing.monthlyCashFlow;
  const cfColor=cf>=0?C.green:C.red;
  const cfBg=cf>=0?C.greenLight:C.redLight;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      style={{background:C.white,border:`1px solid ${hov?C.blue:C.border}`,borderRadius:12,overflow:'hidden',cursor:'pointer',transition:'all 0.15s',boxShadow:hov?'0 4px 20px rgba(26,86,219,0.12)':'0 1px 4px rgba(0,0,0,0.06)'}}>
      {/* Photo */}
      <div style={{height:175,background:'linear-gradient(135deg,#1B3A6B 0%,#2D5F9E 100%)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{fontSize:38,opacity:0.3}}>🏠</div>
        <div style={{position:'absolute',top:12,right:12,background:listing.dealScore>=7.5?C.green:listing.dealScore>=5.5?C.amber:C.red,color:'#fff',fontSize:12,fontWeight:800,padding:'4px 10px',borderRadius:20}}>
          {listing.dealScore} {listing.dealGrade}
        </div>
        {listing.hamzasPick&&<div style={{position:'absolute',top:12,left:12,background:C.gold,color:'#fff',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:20}}>⭐ TOP PICK</div>}
        {listing.priceReduction>0&&<div style={{position:'absolute',bottom:12,left:12,background:C.redLight,color:C.red,fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,border:`1px solid ${C.red}33`}}>▼ {listing.priceReduction}% Reduced</div>}
      </div>

      <div style={{padding:16}}>
        <div style={{fontSize:20,fontWeight:800,color:C.text,marginBottom:4}}>{fmt$(listing.price)}</div>
        <div style={{fontSize:13,color:C.textSec,marginBottom:2}}>{listing.beds} bed · {listing.baths} bath · {listing.sqft?.toLocaleString()} sqft</div>
        <div style={{fontSize:13,color:C.textSec,marginBottom:14}}>{listing.address}, {listing.neighbourhood}</div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[
            {label:'Cash Flow/mo',value:fmtCF(cf),color:cfColor,bg:cfBg},
            {label:'Cap Rate',value:listing.capRate?.toFixed(2)+'%',color:listing.capRate>=4?C.green:C.amber,bg:listing.capRate>=4?C.greenLight:C.amberLight},
            {label:'Est. Rent',value:fmt$(listing.estimatedRent)+'/mo',color:C.blue,bg:C.blueLight},
            {label:'Mortgage/mo',value:fmt$(listing.mortgagePayment),color:C.textSec,bg:C.surface},
          ].map(m=>(
            <div key={m.label} style={{background:m.bg,borderRadius:8,padding:'9px 11px'}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.04em',fontWeight:600}}>{m.label}</div>
              <div style={{fontSize:14,fontWeight:700,color:m.color}}>{m.value}</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
          <span style={{fontSize:11,color:C.muted}}>{listing.type} · {listing.daysOnMarket}d on market</span>
          <span style={{fontSize:12,fontWeight:600,color:C.blue}}>{hov?'View Analysis →':'Analyze Deal'}</span>
        </div>
      </div>
    </div>
  );
}

// ── FILTER BAR ──
function FilterBar({filters,onChange,onReset,count}) {
  const sel=(label,key,opts)=>(
    <select value={filters[key]||''} onChange={e=>onChange(key,e.target.value)}
      style={{padding:'9px 14px',fontSize:13,border:`1px solid ${filters[key]?C.blue:C.border}`,borderRadius:8,background:filters[key]?C.blueLight:C.white,color:filters[key]?C.blue:C.text,outline:'none',cursor:'pointer',fontWeight:filters[key]?600:400}}>
      <option value="">{label}</option>
      {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
  const active=Object.values(filters).filter(Boolean).length;
  return (
    <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:'12px 24px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
      {sel('Price Range','priceRange',[{v:'0-600000',l:'Under $600K'},{v:'600000-800000',l:'$600K–$800K'},{v:'800000-1000000',l:'$800K–$1M'},{v:'1000000-1500000',l:'$1M–$1.5M'},{v:'1500000-99999999',l:'$1.5M+'}])}
      {sel('Beds','minBeds',[1,2,3,4,5].map(n=>({v:n,l:n+'+ beds'})))}
      {sel('Type','type',['Detached','Semi-Detached','Townhouse','Condo Apartment'].map(t=>({v:t,l:t})))}
      {sel('Neighbourhood','neighbourhood',['Port Credit','Clarkson','Erin Mills','Cooksville','Hurontario','Meadowvale','City Centre','Lakeview'].map(n=>({v:n,l:n})))}
      {sel('Min Cap Rate','minCapRate',['2','3','4','5'].map(n=>({v:n,l:n+'%+ cap rate'})))}
      {sel('Cash Flow','minCashFlow',[{v:'-99999',l:'Any'},{v:'0',l:'Cash flow positive'},{v:'200',l:'+$200/mo min'},{v:'500',l:'+$500/mo min'}])}
      {sel('Days Listed','maxDom',[{v:'7',l:'New (7d)'},{v:'14',l:'Under 2 weeks'},{v:'30',l:'Under 30 days'}])}
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:13,color:C.muted}}>{count} {count===1?'property':'properties'}</span>
        {active>0&&<button onClick={onReset} style={{fontSize:13,color:C.red,background:'transparent',border:`1px solid ${C.red}44`,borderRadius:8,padding:'7px 14px',cursor:'pointer',fontWeight:600}}>Clear ({active})</button>}
      </div>
    </div>
  );
}

function applyFilters(listings,f) {
  return listings.filter(l=>{
    if(f.priceRange){const[mn,mx]=f.priceRange.split('-').map(Number);if(l.price<mn||l.price>mx)return false;}
    if(f.minBeds&&l.beds<parseInt(f.minBeds))return false;
    if(f.type&&l.type!==f.type)return false;
    if(f.neighbourhood&&l.neighbourhood!==f.neighbourhood)return false;
    if(f.minCapRate&&l.capRate<parseFloat(f.minCapRate))return false;
    if(f.minCashFlow&&l.monthlyCashFlow<parseInt(f.minCashFlow))return false;
    if(f.maxDom&&l.daysOnMarket>parseInt(f.maxDom))return false;
    return true;
  });
}

function applySort(listings,sort) {
  const s=[...listings];
  if(sort==='score')return s.sort((a,b)=>b.dealScore-a.dealScore);
  if(sort==='cashFlow')return s.sort((a,b)=>b.monthlyCashFlow-a.monthlyCashFlow);
  if(sort==='capRate')return s.sort((a,b)=>b.capRate-a.capRate);
  if(sort==='priceAsc')return s.sort((a,b)=>a.price-b.price);
  if(sort==='priceDesc')return s.sort((a,b)=>b.price-a.price);
  if(sort==='dom')return s.sort((a,b)=>a.daysOnMarket-b.daysOnMarket);
  return s;
}

const FREE_VIEWS=10;

export default function App() {
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('mi_user')||'null');}catch{return null;}});
  const [viewCount,setViewCount]=useState(()=>parseInt(localStorage.getItem('mi_views')||'0'));
  const [showSignup,setShowSignup]=useState(false);
  const [signupTrigger,setSignupTrigger]=useState('');
  const [selected,setSelected]=useState(null);
  const [filters,setFilters]=useState({});
  const [sort,setSort]=useState('score');
  const [tab,setTab]=useState('listings');

  const displayed=useMemo(()=>applySort(applyFilters(ALL_LISTINGS,filters),sort),[filters,sort]);

  const handleCardClick=useCallback((listing)=>{
    const nc=viewCount+1;
    setViewCount(nc);
    localStorage.setItem('mi_views',nc);
    if(!user&&nc>=FREE_VIEWS){setSignupTrigger(`${nc} views`);setShowSignup(true);return;}
    setSelected(listing);
  },[viewCount,user]);

  const handleSignup=useCallback(u=>{
    setUser(u);localStorage.setItem('mi_user',JSON.stringify(u));setShowSignup(false);
  },[]);

  const updateFilter=useCallback((k,v)=>setFilters(p=>({...p,[k]:v})),[]);
  const resetFilters=useCallback(()=>setFilters({}),[]);

  return (
    <div style={{minHeight:'100vh',background:C.surface,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',color:C.text}}>

      {/* HEADER */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,position:'sticky',top:0,zIndex:200}}>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',height:60,gap:32}}>
          <div style={{fontWeight:900,fontSize:17,letterSpacing:'-0.02em',whiteSpace:'nowrap'}}>
            <span style={{color:C.blue}}>Mississauga</span><span style={{color:C.text}}>Investor</span>
            <span style={{fontSize:10,fontWeight:500,color:C.muted,marginLeft:6}}>· AI Deal Screener</span>
          </div>
          <div style={{display:'flex',gap:0}}>
            {[['listings','Properties'],['calculator','Calculator'],['market','Market Pulse'],['contact','Contact']].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                style={{padding:'6px 18px',fontSize:13,fontWeight:tab===id?700:500,background:'transparent',border:'none',borderBottom:`2px solid ${tab===id?C.blue:'transparent'}`,color:tab===id?C.blue:C.textSec,cursor:'pointer',height:60,borderRadius:0}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:14}}>
            {!user&&viewCount>4&&<span style={{fontSize:12,color:C.amber,fontWeight:600}}>{FREE_VIEWS-viewCount} free views left</span>}
            {user
              ? <span style={{fontSize:13,color:C.textSec,fontWeight:600}}>👋 {user.name?.split(' ')[0]}</span>
              : <button onClick={()=>{setSignupTrigger('header');setShowSignup(true);}} style={{padding:'8px 18px',fontSize:13,fontWeight:700,background:C.blue,color:C.white,border:'none',borderRadius:8,cursor:'pointer'}}>Sign Up Free</button>
            }
            <a href="tel:6476091289" style={{fontSize:13,fontWeight:600,color:C.blue,textDecoration:'none'}}>647-609-1289</a>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      {tab==='listings'&&<FilterBar filters={filters} onChange={updateFilter} onReset={resetFilters} count={displayed.length}/>}

      {/* CONTENT */}
      <div style={{maxWidth:1400,margin:'0 auto',padding:'28px 24px'}}>
        {tab==='listings'&&(
          <>
            <div style={{marginBottom:22}}>
              <h1 style={{fontSize:24,fontWeight:800,color:C.text,margin:'0 0 6px'}}>Mississauga Investment Properties</h1>
              <p style={{fontSize:14,color:C.textSec,margin:0}}>
                AI-powered deal analysis · Cash flow, cap rate & ROI on every listing · 
                <a href="tel:6476091289" style={{color:C.blue,fontWeight:600,textDecoration:'none'}}> Hamza Nouman</a>, Royal LePage Signature Realty
              </p>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,flexWrap:'wrap'}}>
              <span style={{fontSize:13,color:C.textSec,fontWeight:600}}>Sort by:</span>
              <select value={sort} onChange={e=>setSort(e.target.value)}
                style={{padding:'8px 14px',fontSize:13,border:`1px solid ${C.border}`,borderRadius:8,background:C.white,color:C.text,outline:'none',cursor:'pointer'}}>
                {[['score','Best Deal Score'],['cashFlow','Highest Cash Flow'],['capRate','Best Cap Rate'],['priceAsc','Price: Low to High'],['priceDesc','Price: High to Low'],['dom','Newest Listed']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>

              {/* Nudge bar */}
              {!user&&viewCount>5&&viewCount<FREE_VIEWS&&(
                <div style={{marginLeft:'auto',background:C.amberLight,border:`1px solid #FDE68A`,borderRadius:10,padding:'9px 16px',display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:13,color:C.amber,fontWeight:600}}>🔔 {FREE_VIEWS-viewCount} free views remaining</span>
                  <button onClick={()=>{setSignupTrigger('nudge');setShowSignup(true);}} style={{fontSize:13,fontWeight:700,color:C.blue,background:'transparent',border:`1px solid ${C.blue}`,borderRadius:8,padding:'5px 12px',cursor:'pointer'}}>Sign up free →</button>
                </div>
              )}
            </div>

            {displayed.length===0?(
              <div style={{textAlign:'center',padding:80}}>
                <div style={{fontSize:36,marginBottom:12}}>🔍</div>
                <div style={{fontSize:16,color:C.textSec,marginBottom:12}}>No properties match your filters</div>
                <button onClick={resetFilters} style={{fontSize:14,color:C.blue,background:'transparent',border:`1px solid ${C.blue}`,borderRadius:8,padding:'9px 20px',cursor:'pointer',fontWeight:600}}>Clear Filters</button>
              </div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:20}}>
                {displayed.map(l=><PropertyCard key={l.id} listing={l} onClick={()=>handleCardClick(l)}/>)}
              </div>
            )}

            <div style={{marginTop:40,paddingTop:20,borderTop:`1px solid ${C.border}`,fontSize:11,color:C.muted,lineHeight:1.7}}>
              Listing information provided by PropTx Innovations Inc. and the Toronto Regional Real Estate Board (TRREB). All rights reserved. Information is deemed reliable but not guaranteed accurate. The trademarks MLS®, Multiple Listing Service® are owned by The Canadian Real Estate Association (CREA). Not intended to solicit properties already listed.
            </div>
          </>
        )}

        {tab==='calculator'&&<CalculatorTab/>}
        {tab==='market'&&<MarketPulseTab/>}
        {tab==='contact'&&<ContactTab/>}
      </div>

      {showSignup&&<SignupModal trigger={signupTrigger} onSuccess={handleSignup}/>}
      {selected&&<DealModal listing={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}

// ── CALCULATOR ──
function CalculatorTab() {
  const [inp,setInp]=useState({price:900000,estimatedRent:3500,downPaymentPct:0.20,interestRate:0.0599,amortizationYears:25,vacancyRate:0.03,maintenancePct:0.05,propertyMgmtPct:0});
  const m=useMemo(()=>calculateMetrics(inp),[inp]);
  const {score,grade}=useMemo(()=>scoreDeal(m),[m]);
  const u=(k,v)=>setInp(p=>({...p,[k]:v}));
  if(!m) return null;
  const cfColor=m.monthlyCashFlow>=0?C.green:C.red;
  const numInp=(label,key,pfx='$')=>(
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:13,fontWeight:600,color:C.text,marginBottom:6}}>{label}</label>
      <div style={{display:'flex',background:C.white,border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden'}}>
        <span style={{padding:'11px 12px',fontSize:14,color:C.muted,background:C.surface,borderRight:`1px solid ${C.border}`}}>{pfx}</span>
        <input type="number" value={inp[key]} onChange={e=>u(key,parseFloat(e.target.value)||0)}
          style={{flex:1,padding:'11px 14px',border:'none',outline:'none',fontSize:14,color:C.text,background:'transparent'}}/>
      </div>
    </div>
  );
  return (
    <div>
      <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:6}}>Investment Calculator</h2>
      <p style={{fontSize:14,color:C.textSec,marginBottom:28}}>Canadian mortgage math · semi-annual compounding · Mississauga property tax rates</p>
      <div style={{display:'grid',gridTemplateColumns:'380px 1fr',gap:28,maxWidth:1000}}>
        <div style={{background:C.white,borderRadius:12,padding:24,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:18}}>Inputs</div>
          {numInp('Property Price','price')}
          {numInp('Monthly Rent Estimate','estimatedRent')}
          {numInp('Down Payment %','downPaymentPct','%')}
          {numInp('Interest Rate %','interestRate','%')}
          {numInp('Amortization (years)','amortizationYears','yr')}
          {numInp('Vacancy Rate %','vacancyRate','%')}
          {numInp('Maintenance Reserve %','maintenancePct','%')}
          {numInp('Property Mgmt %','propertyMgmtPct','%')}
          <div style={{fontSize:11,color:C.muted,marginTop:8,lineHeight:1.6}}>Property tax: 0.72% (Mississauga 2025). Insurance: $175/mo est.</div>
        </div>
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:16}}>
            {[
              {label:'Monthly Cash Flow',value:fmtCF(m.monthlyCashFlow),bg:m.monthlyCashFlow>=0?C.greenLight:C.redLight,color:cfColor},
              {label:'Annual Cash Flow',value:fmtCF(m.annualCashFlow),bg:m.annualCashFlow>=0?C.greenLight:C.redLight,color:cfColor},
              {label:'Cap Rate',value:m.capRate.toFixed(2)+'%',bg:m.capRate>=4?C.greenLight:C.amberLight,color:m.capRate>=4?C.green:C.amber},
              {label:'Cash-on-Cash Return',value:m.cashOnCash.toFixed(2)+'%',bg:m.cashOnCash>=5?C.greenLight:C.amberLight,color:m.cashOnCash>=5?C.green:C.amber},
            ].map(s=>(
              <div key={s.label} style={{background:s.bg,borderRadius:10,padding:'14px 16px',border:`1px solid ${s.color}22`}}>
                <div style={{fontSize:11,color:C.textSec,marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em'}}>{s.label}</div>
                <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{background:C.white,borderRadius:12,padding:20,border:`1px solid ${C.border}`,marginBottom:12}}>
            {[
              {l:'Gross Rent',v:fmt$(m.grossRent),color:C.green},
              {l:'Vacancy',v:'− '+fmt$(m.vacancyLoss),indent:true},
              {l:'Effective Income',v:fmt$(m.effectiveIncome),bold:true},
              {divider:true},
              {l:'Property Tax',v:'− '+fmt$(m.taxMonthly),indent:true},
              {l:'Insurance',v:'− '+fmt$(m.insuranceMonthly),indent:true},
              {l:'Maintenance',v:'− '+fmt$(m.maintMonthly),indent:true},
              {l:'Net Operating Income',v:fmt$(m.monthlyNOI),bold:true},
              {l:'Mortgage',v:'− '+fmt$(m.mortgagePayment),color:C.red,indent:true},
              {divider:true},
              {l:'Monthly Cash Flow',v:fmtCF(m.monthlyCashFlow),color:cfColor,bold:true,large:true},
            ].map((row,i)=>row.divider?<div key={i} style={{borderTop:`1px solid ${C.border}`,margin:'8px 0'}}/> :(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',paddingLeft:row.indent?14:0}}>
                <span style={{fontSize:row.large?14:13,color:C.textSec,fontWeight:row.bold?600:400}}>{row.l}</span>
                <span style={{fontSize:row.large?15:13,fontWeight:row.bold?700:500,color:row.color||C.text}}>{row.v}</span>
              </div>
            ))}
          </div>
          <div style={{background:C.white,borderRadius:12,padding:20,border:`1px solid ${C.border}`,textAlign:'center'}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.06em',marginBottom:6}}>DEAL SCORE</div>
            <div style={{fontSize:52,fontWeight:900,color:score>=7.5?C.green:score>=5.5?C.amber:C.red,lineHeight:1}}>{score}</div>
            <div style={{fontSize:20,fontWeight:800,color:C.text,marginTop:4}}>{grade}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MARKET PULSE ──
function MarketPulseTab() {
  const stats=[
    {label:'Avg Sale-to-List Ratio',value:'0.97',note:'Below 1.0 = buyer has negotiating room',color:C.amber},
    {label:'Avg Days on Market',value:'28d',note:'Up from 18d year-over-year',color:C.amber},
    {label:'Active Listings (Mississauga)',value:'1,847',note:'Up 34% year-over-year',color:C.green},
    {label:'Sales-to-New Listings Ratio',value:'0.41',note:"0.41 = neutral/soft (seller's market is above 0.60)",color:C.amber},
    {label:'Benchmark Price (SFH)',value:'$1.14M',note:'Mississauga, March 2026 est.',color:C.text},
    {label:'Avg Cap Rate (Detached)',value:'3.2–4.1%',note:'Range across Mississauga neighbourhoods',color:C.blue},
  ];
  return (
    <div style={{maxWidth:800}}>
      <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:6}}>Mississauga Market Pulse</h2>
      <p style={{fontSize:14,color:C.textSec,marginBottom:28}}>Updated March 2026 · TRREB data · Hamza Nouman analysis</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:24}}>
        {stats.map((s,i)=>(
          <div key={i} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:8}}>{s.label}</div>
            <div style={{fontSize:26,fontWeight:800,color:s.color,marginBottom:6}}>{s.value}</div>
            <div style={{fontSize:12,color:C.textSec}}>{s.note}</div>
          </div>
        ))}
      </div>
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:24}}>
        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:10}}>Hamza's Take — March 2026</div>
        <div style={{fontSize:14,color:C.textSec,lineHeight:1.8}}>
          Market is soft but not distressed. Rate cuts haven't translated to buyer activity yet. Spring will be the test. Best plays: <strong style={{color:C.text}}>semi-detached with basement suite potential in Clarkson and Cooksville, under $950K</strong>. Avoid condos under 800sqft — rental premiums don't justify carrying costs. Lakeview is a long-term land value play.
        </div>
      </div>
    </div>
  );
}

// ── CONTACT ──
function ContactTab() {
  return (
    <div style={{maxWidth:520}}>
      <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:6}}>Talk to Hamza</h2>
      <p style={{fontSize:14,color:C.textSec,marginBottom:28}}>Mississauga investment specialist · Royal LePage Signature Realty</p>
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:28}}>
        <div style={{fontSize:19,fontWeight:800,color:C.text,marginBottom:2}}>Hamza Nouman</div>
        <div style={{fontSize:13,color:C.textSec,marginBottom:24}}>Sales Representative · Royal LePage Signature Realty</div>
        <a href="tel:6476091289" style={{display:'block',background:C.blue,color:C.white,textAlign:'center',padding:14,borderRadius:10,fontSize:15,fontWeight:700,textDecoration:'none',marginBottom:10}}>📞 Call: 647-609-1289</a>
        <a href="mailto:hamza@nouman.ca" style={{display:'block',border:`1.5px solid ${C.border}`,color:C.text,textAlign:'center',padding:13,borderRadius:10,fontSize:14,fontWeight:600,textDecoration:'none',marginBottom:10}}>✉️ hamza@nouman.ca</a>
        <a href="https://www.hamzahomes.ca" target="_blank" rel="noreferrer" style={{display:'block',border:`1.5px solid ${C.border}`,color:C.textSec,textAlign:'center',padding:13,borderRadius:10,fontSize:14,textDecoration:'none'}}>🌐 HamzaHomes.ca — Buyers & Sellers</a>
        <div style={{marginTop:20,fontSize:11,color:C.muted,textAlign:'center',lineHeight:1.7}}>
          8 Sampson Mews, Suite 201, Toronto ON<br/>
          <a href="https://www.mississaugainvestor.ca/privacy" style={{color:C.muted}}>Privacy Policy</a> · <a href="https://www.mississaugainvestor.ca/terms" style={{color:C.muted}}>Terms of Use</a>
        </div>
      </div>
    </div>
  );
}
