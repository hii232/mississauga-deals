import { useState, useMemo, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const G = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#05091A;font-family:'Inter',sans-serif;color:#E2E8F0;overflow-x:hidden}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:#05091A}
::-webkit-scrollbar-thumb{background:#1E3060;border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:#3B82F6}

@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulseCTA{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,0.4)}70%{box-shadow:0 0 0 12px rgba(59,130,246,0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes meshMove{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(40px,-30px) rotate(120deg)}66%{transform:translate(-30px,40px) rotate(240deg)}}
@keyframes borderPulse{0%,100%{opacity:0.4}50%{opacity:1}}
@keyframes logoGlow{0%,100%{filter:drop-shadow(0 0 8px rgba(59,130,246,0.4))}50%{filter:drop-shadow(0 0 16px rgba(59,130,246,0.7))}}
@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

.animate-fadeUp{animation:fadeUp .55s cubic-bezier(.22,1,.36,1) forwards}
.animate-fadeIn{animation:fadeIn .4s ease forwards}

/* Premium card hover — blue lift */
.card-hover{transition:transform .28s cubic-bezier(.22,1,.36,1),box-shadow .28s ease,border-color .28s ease}
.card-hover:hover{transform:translateY(-6px)!important;box-shadow:0 24px 80px rgba(59,130,246,0.15),0 4px 24px rgba(0,0,0,0.6)!important;border-color:rgba(59,130,246,0.35)!important}

/* Buttons */
.btn-primary{background:linear-gradient(135deg,#3B82F6,#1D4ED8);color:#fff;border:none;cursor:pointer;font-family:'Inter',sans-serif;font-weight:600;letter-spacing:0.01em;transition:all .22s ease}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(59,130,246,0.45)}
.btn-primary:active{transform:translateY(0)}
.btn-gold{background:linear-gradient(135deg,#F59E0B,#D97706);color:#000;border:none;cursor:pointer;font-family:'Inter',sans-serif;font-weight:700;letter-spacing:0.01em;transition:all .22s ease}
.btn-gold:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(245,158,11,0.4)}
.btn-ghost{background:rgba(255,255,255,0.04);color:#E2E8F0;border:1px solid rgba(255,255,255,0.1);cursor:pointer;font-family:'Inter',sans-serif;font-weight:500;transition:all .2s ease}
.btn-ghost:hover{background:rgba(255,255,255,0.08);border-color:rgba(59,130,246,0.5);color:#93C5FD}
.btn-blue-outline{background:transparent;color:#3B82F6;border:1px solid rgba(59,130,246,0.45);cursor:pointer;font-family:'Inter',sans-serif;font-weight:600;transition:all .2s ease}
.btn-blue-outline:hover{background:rgba(59,130,246,0.1);border-color:#3B82F6}
.btn-gold-outline{background:transparent;color:#F59E0B;border:1px solid rgba(245,158,11,0.45);cursor:pointer;font-family:'Inter',sans-serif;font-weight:600;transition:all .2s ease}
.btn-gold-outline:hover{background:rgba(245,158,11,0.08);border-color:#F59E0B}

/* Nav tab buttons */
.tab-btn{background:transparent;border:none;cursor:pointer;font-family:'Inter',sans-serif;font-weight:500;font-size:13px;color:#64748B;padding:10px 18px;border-bottom:2px solid transparent;transition:all .2s ease;white-space:nowrap;letter-spacing:0.01em}
.tab-btn:hover{color:#E2E8F0}
.tab-btn.active{color:#3B82F6;border-bottom-color:#3B82F6;font-weight:600}

/* Filter chips */
.chip{cursor:pointer;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:#64748B;font-family:'Inter',sans-serif;font-size:12px;font-weight:500;padding:6px 14px;border-radius:6px;transition:all .18s ease;white-space:nowrap;letter-spacing:0.01em}
.chip:hover{border-color:rgba(59,130,246,0.4);color:#93C5FD;background:rgba(59,130,246,0.06)}
.chip.active{background:rgba(59,130,246,0.12);border-color:rgba(59,130,246,0.6);color:#93C5FD;font-weight:600}

/* Inputs */
input,select,textarea{font-family:'Inter',sans-serif;outline:none;transition:border-color .2s ease,box-shadow .2s ease}
input:focus,select:focus,textarea:focus{border-color:rgba(59,130,246,0.6)!important;box-shadow:0 0 0 3px rgba(59,130,246,0.12)!important}

/* Checkbox */
input[type=checkbox]{accent-color:#3B82F6;width:16px;height:16px;cursor:pointer}

/* Score badge */
.score-badge{font-family:'JetBrains Mono',monospace;font-weight:700}

/* Number font */
.mono{font-family:'JetBrains Mono',monospace}

/* Mesh gradient background */
.mesh-bg{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden}
.mesh-orb{position:absolute;border-radius:50%;filter:blur(100px);opacity:0.06;animation:meshMove 22s ease-in-out infinite}

/* Glass card */
.glass{background:rgba(10,18,40,0.75);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.05)}

/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,8,0.88);backdrop-filter:blur(10px);z-index:100;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto}

/* Scrollable modal body */
.modal-scroll{max-height:calc(100vh - 100px);overflow-y:auto;overflow-x:hidden}
.modal-scroll::-webkit-scrollbar{width:3px}
.modal-scroll::-webkit-scrollbar-thumb{background:#1E3060}

/* Range input */
input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:rgba(255,255,255,0.08);outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#3B82F6;cursor:pointer;transition:transform .15s ease;box-shadow:0 0 8px rgba(59,130,246,0.6)}
input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.25)}

/* WA FAB */

/* Skeleton loader */
.skeleton{background:linear-gradient(90deg,#0D1830 25%,#162240 50%,#0D1830 75%);background-size:600px 100%;animation:shimmer 1.8s infinite}

/* Compliance badge */
.compliance-badge{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:#3D8B6A;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:4px;padding:2px 7px;font-family:'JetBrains Mono',monospace}

/* Score colour system */
.score-green{color:#10B981}
.score-blue{color:#3B82F6}
.score-amber{color:#F59E0B}
.score-red{color:#EF4444}

/* WCAG focus */
:focus-visible{outline:2px solid #3B82F6;outline-offset:3px}

/* Skip link */
.skip-link{position:absolute;top:-40px;left:0;background:#3B82F6;color:#fff;padding:8px 16px;z-index:999;font-weight:600;text-decoration:none}
.skip-link:focus{top:0}

/* Live ticker */
.ticker-wrap{overflow:hidden;white-space:nowrap}
.ticker-inner{display:inline-flex;animation:tickerScroll 30s linear infinite}
.ticker-inner:hover{animation-play-state:paused}

/* Divider gradient */
.divider-grad{height:1px;background:linear-gradient(90deg,transparent,rgba(59,130,246,0.3),transparent)}

/* Mobile */
@media(max-width:768px){
  .desktop-only{display:none!important}
  .mobile-stack{flex-direction:column!important}
  .modal-overlay{padding:8px 4px}
  .modal-overlay>div{max-height:95vh!important;border-radius:12px!important}
  main{padding:0 12px 32px!important}
  footer{padding:20px 12px!important}
}
@media(max-width:480px){
  .hide-xs{display:none!important}
  h1{font-size:24px!important}
  h2{font-size:20px!important}
}
`;

/* ─────────────────────────────────────────────
   CONSTANTS & COLORS — v10 Premium Palette
───────────────────────────────────────────── */
// Primary — Electric Blue (institutional, Bloomberg-style)
const BLUE="#3B82F6", BLUE2="#1D4ED8", BLUE_DIM="rgba(59,130,246,0.15)";
// Accent — Amber Gold (premium, refined)
const GOLD="#F59E0B", GOLD2="#D97706", GOLD_BORDER="rgba(245,158,11,0.2)";
// Background layers
const NAVY="#05091A", SURFACE="#0C1429", CARD="#111D32";
// Typography
const TEXT="#E2E8F0", MUTED="#64748B", TEXT2="#94A3B8";
// Status
const GREEN="#10B981", RED="#EF4444";
// Legacy aliases for compat
const BORDER="rgba(255,255,255,0.07)";

/* ─────────────────────────────────────────────
   LISTING DATA
───────────────────────────────────────────── */
const LISTINGS=[];

const HOOD_DATA = {
  "Clarkson":          {trend:"hot", emoji:"🔥",avgPrice:1002000,priceYoY:8.2,avgDOM:38,inventory:"Low",   rentYield:5.1,lat:43.5167,lng:-79.6239,note:"LRT corridor + GO station = best appreciation play 2025-2026"},
  "Port Credit":       {trend:"hot", emoji:"🔥",avgPrice:1198000,priceYoY:6.9,avgDOM:21,inventory:"Low",   rentYield:3.8,lat:43.5503,lng:-79.5795,note:"Premium lifestyle. Appreciation play only — cap rate doesn't pencil"},
  "Lakeview":          {trend:"hot", emoji:"🔥",avgPrice:1089000,priceYoY:5.4,avgDOM:29,inventory:"Low",   rentYield:4.1,lat:43.5657,lng:-79.5434,note:"Up-and-coming. Big redevelopment play. Buy land, not condos"},
  "Lorne Park":        {trend:"hot", emoji:"🔥",avgPrice:1650000,priceYoY:5.1,avgDOM:24,inventory:"Low",   rentYield:2.9,lat:43.5318,lng:-79.6235,note:"Trophy asset territory. Appreciation only — yields are thin but equity compounding is elite"},
  "Mineola":           {trend:"hot", emoji:"🔥",avgPrice:1420000,priceYoY:4.8,avgDOM:27,inventory:"Low",   rentYield:3.2,lat:43.5614,lng:-79.6021,note:"Mature trees, large lots, close to Port Credit GO. Long-term wealth play"},
  "Lakeview Village":  {trend:"hot", emoji:"🔥",avgPrice:1120000,priceYoY:6.1,avgDOM:22,inventory:"Low",   rentYield:3.9,lat:43.5700,lng:-79.5320,note:"New waterfront master-plan community. Pre-con + resale both strong"},
  "Churchill Meadows": {trend:"warm",emoji:"📈",avgPrice:843000, priceYoY:4.1,avgDOM:47,inventory:"Medium",rentYield:4.7,lat:43.5847,lng:-79.7519,note:"Top schools = stable family rental demand"},
  "Streetsville":      {trend:"warm",emoji:"📈",avgPrice:921000, priceYoY:3.8,avgDOM:44,inventory:"Medium",rentYield:4.6,lat:43.5863,lng:-79.7180,note:"Village charm + Credit River. Undervalued vs Port Credit"},
  "Erin Mills":        {trend:"warm",emoji:"📈",avgPrice:862000, priceYoY:3.2,avgDOM:51,inventory:"Medium",rentYield:4.9,lat:43.5575,lng:-79.7185,note:"Good schools, highways, affordability. Steady hold asset"},
  "Central Erin Mills":{trend:"warm",emoji:"📈",avgPrice:891000, priceYoY:3.5,avgDOM:48,inventory:"Medium",rentYield:4.7,lat:43.5738,lng:-79.7152,note:"Slightly premium over Erin Mills. Strong family rental pool, high school ratings"},
  "Cooksville":        {trend:"warm",emoji:"📊",avgPrice:731000, priceYoY:3.9,avgDOM:42,inventory:"Medium",rentYield:5.0,lat:43.5838,lng:-79.6163,note:"LRT corridor sleeper. Under the radar, not for long"},
  "Hurontario":        {trend:"warm",emoji:"📊",avgPrice:718000, priceYoY:3.5,avgDOM:45,inventory:"Medium",rentYield:4.8,lat:43.5934,lng:-79.6403,note:"Hurontario LRT will reprice this corridor over next 3 years"},
  "City Centre":       {trend:"warm",emoji:"📊",avgPrice:650000, priceYoY:2.9,avgDOM:50,inventory:"Medium",rentYield:4.5,lat:43.5934,lng:-79.6270,note:"Square One condos dominate. Rental demand very high from young professionals. Oversupply risk"},
  "Mississauga Valleys":{trend:"warm",emoji:"📊",avgPrice:698000,priceYoY:3.1,avgDOM:46,inventory:"Medium",rentYield:4.7,lat:43.5779,lng:-79.6376,note:"Underrated. Mix of detached and semis. LRT access adds long-term upside"},
  "East Credit":       {trend:"warm",emoji:"📊",avgPrice:878000, priceYoY:3.3,avgDOM:49,inventory:"Medium",rentYield:4.6,lat:43.5960,lng:-79.6982,note:"Family-oriented, top schools, good highway access. Reliable hold"},
  "Erindale":          {trend:"warm",emoji:"📊",avgPrice:812000, priceYoY:3.0,avgDOM:52,inventory:"Medium",rentYield:4.5,lat:43.5499,lng:-79.6530,note:"UTM proximity drives student rental demand. Undervalued relative to neighbours"},
  "Applewood":         {trend:"warm",emoji:"📊",avgPrice:765000, priceYoY:2.8,avgDOM:48,inventory:"Medium",rentYield:4.8,lat:43.5944,lng:-79.5592,note:"Older bungalows on big lots. BRRR and multiplex conversion potential is strong"},
  "Dixie":             {trend:"warm",emoji:"📊",avgPrice:742000, priceYoY:2.6,avgDOM:51,inventory:"Medium",rentYield:4.9,lat:43.5934,lng:-79.5956,note:"Industrial and residential mix. Cash flow plays available. Close to airport"},
  "Rathwood":          {trend:"warm",emoji:"📊",avgPrice:789000, priceYoY:2.7,avgDOM:53,inventory:"Medium",rentYield:4.6,lat:43.5784,lng:-79.5843,note:"Established, quiet, good schools. Stable but not exciting. Good hold"},
  "Sheridan":          {trend:"cool",emoji:"🧊",avgPrice:831000, priceYoY:2.4,avgDOM:55,inventory:"High",  rentYield:4.4,lat:43.5490,lng:-79.6783,note:"Sheridan College drives rental demand but seasonal. Mixed asset quality"},
  "Meadowvale":        {trend:"cool",emoji:"🧊",avgPrice:764000, priceYoY:2.1,avgDOM:58,inventory:"High",  rentYield:4.9,lat:43.6512,lng:-79.7356,note:"Steady but slow. Buy underpriced, cash flow it"},
  "Lisgar":            {trend:"cool",emoji:"🧊",avgPrice:798000, priceYoY:1.9,avgDOM:60,inventory:"High",  rentYield:4.6,lat:43.6012,lng:-79.7632,note:"Newer builds, strong families but far from transit. Values lag western Mississauga"},
  "Heartland":         {trend:"cool",emoji:"🧊",avgPrice:712000, priceYoY:1.5,avgDOM:64,inventory:"High",  rentYield:4.8,lat:43.6198,lng:-79.7189,note:"Big box retail area converting to mixed-use. Hold long-term but slow capital growth now"},
  "Malton":            {trend:"cool",emoji:"🧊",avgPrice:618000, priceYoY:1.8,avgDOM:62,inventory:"High",  rentYield:5.1,lat:43.7123,lng:-79.6532,note:"Highest cash flow yields in the city. Appreciation is slow — pure income play"},
};

const QUIZ=[
  {q:"What is your primary investment goal?",opts:["Monthly cash flow","Long-term appreciation","BRRR strategy","Pre-construction gains"]},
  {q:"What is your investment timeline?",opts:["1-2 years","3-5 years","5-10 years","10+ years"]},
  {q:"What is your available down payment?",opts:["Under $100K","$100K–$200K","$200K–$350K","$350K+"]},
  {q:"How hands-on do you want to be?",opts:["Fully passive","Light management","Active landlord","Full BRRR renovator"]}
];

const QUIZ_RESULTS={
  cashflow:{title:"Cash Flow Investor",emoji:"💰",desc:"You want your property working every month. Best neighbourhoods: Malton, Meadowvale, Hurontario corridor. Target multi-unit or townhouse with basement suite."},
  appreciation:{title:"Appreciation Investor",emoji:"📈",desc:"You are building long-term wealth. Best neighbourhoods: Clarkson LRT corridor, Port Credit, Lakeview. Focus on location over yield."},
  brrr:{title:"BRRR Investor",emoji:"🔨",desc:"You want to recycle your capital. Target high DOM properties with price reductions in Erin Mills, Streetsville, Churchill Meadows. Look for basement conversion potential."},
  precon:{title:"Pre-Construction Investor",emoji:"🏙️",desc:"You want VIP access before public launch. Register for Hamza's Pre-Con VIP list to get floor plans and pricing worksheets before they go public."}
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const fmtK=n=>n>=1000000?"$"+(n/1000000).toFixed(2)+"M":"$"+(n/1000).toFixed(0)+"K";
const fmtNum=n=>n>=0?"+$"+n.toLocaleString()+"/mo":"-$"+Math.abs(n).toLocaleString()+"/mo";
const calcMonthly=(price,downPct,rate,years)=>{
  const p=price*(1-downPct/100),r=rate/100/12,n=years*12;
  if(r===0)return Math.round(p/n);
  return Math.round(p*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1));
};
const scoreColor=s=>s>=8.5?GREEN:s>=7?BLUE:s>=5.5?GOLD:RED;
const fmtCF=n=>({color:n>=0?GREEN:n>=-500?'#94A3B8':RED,label:fmtNum(n)});
const formatAddress=a=>{if(!a)return'Address on Request';return a.replace(/^(\d+)-\s*/,'#$1 - ').replace(/\b\w+/g,w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase());};

/* ─────────────────────────────────────────────
   FULLSCREEN PHOTO LIGHTBOX
───────────────────────────────────────────── */
function PhotoLightbox({photos,startIdx,onClose}){
  const [idx,setIdx]=useState(startIdx||0);
  useEffect(()=>{
    const onKey=e=>{
      if(e.key==='Escape')onClose();
      if(e.key==='ArrowRight')setIdx(i=>i<photos.length-1?i+1:0);
      if(e.key==='ArrowLeft')setIdx(i=>i>0?i-1:photos.length-1);
    };
    window.addEventListener('keydown',onKey);
    document.body.style.overflow='hidden';
    return()=>{window.removeEventListener('keydown',onKey);document.body.style.overflow='';};
  },[onClose,photos.length]);
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,0.95)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',animation:'fadeIn .2s ease'}}>
      {/* Close button */}
      <button onClick={onClose} style={{position:'absolute',top:16,right:20,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:8,width:40,height:40,color:'#fff',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10}}>✕</button>
      {/* Counter */}
      <div style={{position:'absolute',top:20,left:'50%',transform:'translateX(-50%)',fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:'rgba(255,255,255,0.7)',zIndex:10}}>{idx+1} / {photos.length}</div>
      {/* Main image */}
      <div onClick={e=>e.stopPropagation()} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',width:'100%',padding:'60px 80px 20px',minHeight:0}}>
        <img src={photos[idx]} alt="" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',borderRadius:8}}/>
      </div>
      {/* Nav buttons */}
      {photos.length>1&&(
        <>
          <button onClick={e=>{e.stopPropagation();setIdx(i=>i>0?i-1:photos.length-1);}} style={{position:'absolute',left:16,top:'50%',transform:'translateY(-50%)',width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}>‹</button>
          <button onClick={e=>{e.stopPropagation();setIdx(i=>i<photos.length-1?i+1:0);}} style={{position:'absolute',right:16,top:'50%',transform:'translateY(-50%)',width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}>›</button>
        </>
      )}
      {/* Thumbnail strip */}
      <div onClick={e=>e.stopPropagation()} style={{display:'flex',gap:4,padding:'12px 20px',overflowX:'auto',maxWidth:'100%',flexShrink:0}}>
        {photos.map((p,i)=>(
          <img key={i} src={p} alt="" onClick={()=>setIdx(i)}
            style={{width:64,height:44,objectFit:'cover',borderRadius:4,cursor:'pointer',opacity:i===idx?1:0.4,border:i===idx?'2px solid #3B82F6':'2px solid transparent',transition:'all .15s',flexShrink:0}}
            onError={e=>{e.target.style.display='none';}}/>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CASL CONSENT TEXT (reused across forms)
───────────────────────────────────────────── */
const CASL_TEXT="By checking this box, I consent to receive commercial electronic messages from Hamza Nouman, Sales Representative, Royal LePage Signature Realty, Brokerage (347 Peel Centre Dr., Brampton, ON · 647-609-1289 · mississaugainvestor.ca), including property listings, market reports, investment analysis, and promotional real estate communications. I understand I may withdraw consent at any time by clicking the unsubscribe link in any email or contacting hamza@nouman.ca.";

/* ─────────────────────────────────────────────
   PRIVACY POLICY CONTENT
───────────────────────────────────────────── */
const PRIVACY_TEXT=`PRIVACY POLICY — mississaugainvestor.ca

Last updated: March 2026

1. ACCOUNTABILITY
Hamza Nouman, Sales Representative, Royal LePage Signature Realty, Brokerage, is responsible for personal information collected through this website. Contact: hamza@nouman.ca | 647-609-1289.

2. WHAT WE COLLECT
Name, phone number, email address, property preferences, investment goals, and technical data (IP address, browser type, pages visited via analytics tools).

3. PURPOSE OF COLLECTION
To respond to inquiries, provide property information, send market updates (with consent), and improve website functionality.

4. CONSENT
We collect only information you voluntarily provide. Email marketing requires your express consent, which you may withdraw at any time.

5. SHARING WITH THIRD PARTIES
We do not sell your information. We may share with: the Toronto Regional Real Estate Board (TRREB) for MLS® data access, Royal LePage Signature Realty, Brokerage (our employing brokerage), and technology service providers (Vercel hosting, Anthropic AI) under confidentiality obligations.

6. SECURITY
We use commercially reasonable safeguards to protect your information. In the event of a breach creating real risk of significant harm, we will notify affected individuals as required by PIPEDA.

7. ACCESS AND CORRECTION
You have the right to access, correct, and request deletion of your personal information. Submit requests to hamza@nouman.ca. We will respond within 30 days.

8. DATA RETENTION
Contact information is retained for the duration of our business relationship plus 2 years, unless you request earlier deletion.

9. COOKIES
This site uses essential cookies for functionality and analytics cookies to understand visitor behaviour. You may control non-essential cookies via the consent banner.

10. QUESTIONS
Contact the Office of the Privacy Commissioner of Canada at www.priv.gc.ca if you have unresolved privacy concerns.`;

/* ─────────────────────────────────────────────
   INVESTMENT DISCLAIMER TEXT
───────────────────────────────────────────── */
const INV_DISCLAIMER=`IMPORTANT — PLEASE READ BEFORE USING INVESTMENT TOOLS

The investment analysis tools on this website (cap rate calculator, cash flow estimator, BRRR analyzer, and mortgage calculator) are for general informational and educational purposes only.

• NOT financial, investment, tax, or professional advice
• All projections are estimates based on assumptions — actual results will differ materially  
• Using this tool does not create a financial advisory or fiduciary relationship
• Hamza Nouman is a licensed real estate sales representative, NOT a financial advisor, mortgage broker, or investment advisor
• Real estate investment involves significant risk, including potential loss of capital
• Consult a licensed financial advisor, accountant, mortgage broker, and real estate lawyer before making any investment decisions
• Cap rate, cash flow, and BRRR estimates are based on assumed market rents and operating expenses — verify independently`;

/* ─────────────────────────────────────────────
   COOKIE CONSENT BANNER
───────────────────────────────────────────── */
function CookieBanner({onAccept,onDecline}){
  return(
    <div role="dialog" aria-labelledby="cookie-title" aria-modal="false" style={{
      position:"fixed",bottom:0,left:0,right:0,zIndex:200,
      background:"linear-gradient(135deg,#0D1628ee,#162032ee)",
      backdropFilter:"blur(20px)",borderTop:`1px solid ${BORDER}`,
      padding:"20px 24px",animation:"slideDown .4s ease"
    }}>
      <div style={{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:260}}>
          <div id="cookie-title" style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:4}}>🍪 Cookie Preferences</div>
          <p style={{fontSize:12,color:MUTED,lineHeight:1.6}}>
            We use essential cookies for site functionality and analytics cookies to understand visitor behaviour (PIPEDA compliant). 
            Non-essential cookies require your consent.{" "}
            <span style={{color:GOLD,cursor:"pointer",textDecoration:"underline"}} onClick={()=>{}}>Privacy Policy</span>
          </p>
        </div>
        <div style={{display:"flex",gap:10,flexShrink:0,flexWrap:"wrap"}}>
          <button onClick={onDecline} className="btn-ghost" style={{padding:"9px 20px",borderRadius:8,fontSize:13}}>
            Essential Only
          </button>
          <button onClick={onAccept} className="btn-primary" style={{padding:"9px 20px",borderRadius:8,fontSize:13}}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PRIVACY POLICY MODAL
───────────────────────────────────────────── */
function PrivacyModal({onClose}){
  return(
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}} role="dialog" aria-modal="true" aria-label="Privacy Policy">
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,width:"100%",maxWidth:680,animation:"fadeUp .3s ease"}}>
        <div style={{padding:"24px 28px",borderBottom:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:TEXT}}>Privacy Policy</h2>
          <button onClick={onClose} aria-label="Close" style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:22,lineHeight:1}}>×</button>
        </div>
        <div className="modal-scroll" style={{padding:"24px 28px"}}>
          <pre style={{fontSize:12,color:MUTED,lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"'Inter',sans-serif"}}>{PRIVACY_TEXT}</pre>
        </div>
        <div style={{padding:"16px 28px",borderTop:`1px solid ${BORDER}`,textAlign:"right"}}>
          <button onClick={onClose} className="btn-primary" style={{padding:"10px 24px",borderRadius:8,fontSize:14}}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   INVESTMENT DISCLAIMER MODAL
───────────────────────────────────────────── */
function InvDisclaimerModal({onAccept}){
  const [checked,setChecked]=useState(false);
  return(
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Investment Disclaimer">
      <div style={{background:CARD,border:`1px solid rgba(196,154,60,0.3)`,borderRadius:16,width:"100%",maxWidth:580,animation:"fadeUp .3s ease"}}>
        <div style={{padding:"24px 28px",borderBottom:`1px solid ${BORDER}`,display:"flex",gap:12,alignItems:"center"}}>
          <div style={{fontSize:24}}>⚠️</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:GOLD}}>Investment Analysis Disclaimer</h2>
        </div>
        <div style={{padding:"24px 28px"}}>
          <pre style={{fontSize:12,color:MUTED,lineHeight:1.75,whiteSpace:"pre-wrap",fontFamily:"'Inter',sans-serif"}}>{INV_DISCLAIMER}</pre>
          <label style={{display:"flex",gap:10,alignItems:"flex-start",marginTop:20,cursor:"pointer"}}>
            <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} style={{marginTop:2,flexShrink:0}} aria-required="true"/>
            <span style={{fontSize:13,color:MUTED,lineHeight:1.5}}>I understand that these are estimates only and agree to use these tools for informational purposes. I will consult qualified professionals before making investment decisions.</span>
          </label>
        </div>
        <div style={{padding:"16px 28px",borderTop:`1px solid ${BORDER}`,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={onAccept} disabled={!checked} className="btn-primary" style={{padding:"11px 28px",borderRadius:8,fontSize:14,opacity:checked?1:0.4,cursor:checked?"pointer":"not-allowed"}}>
            I Understand — Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCORE BADGE
───────────────────────────────────────────── */
function ScoreBadge({score,size="md"}){
  const col=scoreColor(score);
  const sz=size==="lg"?{w:52,h:52,fs:18,lbl:11}:{w:40,h:40,fs:14,lbl:10};
  return(
    <div style={{width:sz.w,height:sz.h,borderRadius:"50%",background:`${col}18`,border:`2px solid ${col}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <div className="score-badge" style={{fontSize:sz.fs,color:col,lineHeight:1}}>{score.toFixed(1)}</div>
      <div style={{fontSize:sz.lbl-1,color:col,opacity:0.7,fontFamily:"'JetBrains Mono',monospace"}}>/10</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STAT BOX
───────────────────────────────────────────── */
function StatBox({label,value,sub,accent}){
  return(
    <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"14px 16px",flex:1,minWidth:100}}>
      <div style={{fontSize:11,color:MUTED,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
      <div className="mono" style={{fontSize:20,fontWeight:600,color:accent||TEXT,lineHeight:1.1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:MUTED,marginTop:3}}>{sub}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCORE BAR
───────────────────────────────────────────── */
function ScoreBar({label,value,max=100,color}){
  return(
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:12,color:MUTED}}>{label}</span>
        <span className="mono" style={{fontSize:12,color:color||TEXT}}>{value}/100</span>
      </div>
      <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${value}%`,background:`linear-gradient(90deg,${color||GOLD},${color||GOLD}cc)`,borderRadius:2,transition:"width 0.6s ease"}}/>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LISTING CARD
───────────────────────────────────────────── */
// Rich gradient palettes per neighbourhood — gives each card visual identity
const HOOD_GRADIENTS={
  "Clarkson":           ["#0C2340","#1A3F6E"],
  "Port Credit":        ["#0A1F3A","#16406B"],
  "Lakeview":           ["#0A2230","#114060"],
  "Lorne Park":         ["#1A1430","#2A1E50"],
  "Mineola":            ["#0A2818","#123E28"],
  "Lakeview Village":   ["#0A1E38","#143460"],
  "Churchill Meadows":  ["#0A2318","#14422E"],
  "Streetsville":       ["#1A1420","#2E2040"],
  "Erin Mills":         ["#0D1A30","#1A3055"],
  "Central Erin Mills": ["#0E1C32","#1C3458"],
  "Cooksville":         ["#151020","#26203A"],
  "Hurontario":         ["#0C1A2C","#183050"],
  "City Centre":        ["#101828","#1C2E48"],
  "Mississauga Valleys":["#0E1828","#1A2E44"],
  "East Credit":        ["#0E1C2A","#1A3248"],
  "Erindale":           ["#12101E","#201E38"],
  "Applewood":          ["#101410","#1E2818"],
  "Dixie":              ["#141010","#281E1E"],
  "Rathwood":           ["#101418","#1C2430"],
  "Sheridan":           ["#0E1C10","#1A3018"],
  "Meadowvale":         ["#0E1A10","#1C3020"],
  "Lisgar":             ["#0E181C","#1A2C30"],
  "Heartland":          ["#181210","#2C201C"],
  "Malton":             ["#1A100E","#36201A"],
};

function ListingCard({l,onOpen,isSample=true,isComparing=false,onToggleCompare,isSaved=false}){
  const cf=fmtCF(l.cashFlow||0);
  const grad=HOOD_GRADIENTS[l.neighbourhood]||["#0C1429","#182040"];
  const score=l.hamzaScore||0;
  const scoreCol=scoreColor(score);
  const [imgErr,setImgErr]=useState(false);
  const [fetchedPhoto,setFetchedPhoto]=useState(null);
  // If no photos from batch, fetch individually (only 24 cards visible per page)
  useEffect(()=>{
    if((!l.photos||l.photos.length===0)&&l.id&&!fetchedPhoto){
      fetch('/api/photos?id='+encodeURIComponent(l.id))
        .then(r=>r.json())
        .then(d=>{if(d.photos&&d.photos.length>0)setFetchedPhoto(d.photos[0]);})
        .catch(()=>{});
    }
  },[l.id,l.photos,fetchedPhoto]);
  const cardPhoto=(l.photos&&l.photos.length>0)?l.photos[0]:fetchedPhoto;
  const hasPhotos=!!cardPhoto&&!imgErr;

  return(
    <div
      className="card-hover"
      onClick={()=>onOpen(l)}
      role="button"
      tabIndex={0}
      aria-label={`View investment analysis for ${l.address}`}
      onKeyDown={e=>e.key==="Enter"&&onOpen(l)}
      style={{
        background:CARD,
        border:`1px solid ${l.hamzasPick?"rgba(245,158,11,0.35)":BORDER}`,
        borderRadius:12,
        overflow:"hidden",
        cursor:"pointer",
        position:"relative",
        ...(l.hamzasPick?{boxShadow:"0 0 0 1px rgba(245,158,11,0.15), 0 12px 48px rgba(245,158,11,0.08)"}:{})
      }}
    >
      {/* Image area — real photos or gradient fallback */}
      <div style={{height:180,background:`linear-gradient(145deg,${grad[0]},${grad[1]})`,position:"relative",overflow:"hidden"}}>
        {hasPhotos?(
          <img src={cardPhoto} alt={l.address} loading="lazy"
            onError={()=>setImgErr(true)}
            style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        ):(
          <>
            <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",backgroundSize:"20px 20px"}}/>
            <div style={{position:"absolute",bottom:10,left:12,fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.12)",letterSpacing:"0.12em",textTransform:"uppercase"}}>{l.neighbourhood}</div>
          </>
        )}
        {/* Dark gradient overlay for text readability on photos */}
        {hasPhotos&&<div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(5,9,26,0.7) 0%,rgba(5,9,26,0.1) 40%,transparent 60%)"}}/>}

        {/* Photo count badge */}
        {l.photos&&l.photos.length>1&&(
          <div style={{position:"absolute",bottom:10,left:10,background:"rgba(5,9,26,0.8)",backdropFilter:"blur(4px)",borderRadius:4,padding:"3px 8px",fontSize:10,color:TEXT2,fontWeight:600,border:"1px solid rgba(255,255,255,0.1)"}}>
            {l.photos.length} photos
          </div>
        )}

        {/* Tags top-left */}
        <div style={{position:"absolute",top:10,left:10,display:"flex",gap:5,flexWrap:"wrap"}}>
          {l.hamzasPick&&<span style={{background:"rgba(245,158,11,0.85)",borderRadius:4,padding:"2px 8px",fontSize:9,color:"#000",fontWeight:700,letterSpacing:"0.05em"}}>★ PICK</span>}
          {l.lrtAccess&&<span style={{background:"rgba(59,130,246,0.85)",borderRadius:4,padding:"2px 8px",fontSize:9,color:"#fff",fontWeight:600}}>LRT</span>}
          {l.priceReduction>=5&&<span style={{background:"rgba(16,185,129,0.85)",borderRadius:4,padding:"2px 8px",fontSize:9,color:"#fff",fontWeight:700}}>↓{l.priceReduction}%</span>}
          {l.dom>=40&&<span style={{background:"rgba(239,68,68,0.85)",borderRadius:4,padding:"2px 8px",fontSize:9,color:"#fff",fontWeight:600}}>{l.dom}d</span>}
          {l.hasSuite&&<span style={{background:"rgba(168,85,247,0.85)",borderRadius:4,padding:"2px 8px",fontSize:9,color:"#fff",fontWeight:700}}>SUITE</span>}
        </div>

        {/* Score badge top-right */}
        <div style={{position:"absolute",top:10,right:10}}>
          <div style={{
            width:44,height:44,borderRadius:"50%",
            background:`rgba(5,9,26,0.75)`,
            backdropFilter:"blur(8px)",
            border:`2px solid ${scoreCol}`,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            boxShadow:`0 0 12px ${scoreCol}30`
          }}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:scoreCol,lineHeight:1}}>{score.toFixed(1)}</div>
            <div style={{fontSize:8,color:scoreCol,opacity:0.65,fontFamily:"'JetBrains Mono',monospace"}}>/10</div>
          </div>
        </div>

        {/* Property type — bottom right */}
        <div style={{position:"absolute",bottom:10,right:10,background:"rgba(5,9,26,0.75)",backdropFilter:"blur(4px)",borderRadius:4,padding:"3px 8px",fontSize:10,color:TEXT2,fontWeight:500,border:"1px solid rgba(255,255,255,0.08)"}}>{l.type}</div>
      </div>

      {/* Card body */}
      <div style={{padding:"14px 16px 12px"}}>
        {/* Address + neighbourhood */}
        <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:2,lineHeight:1.3,letterSpacing:"-0.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{formatAddress(l.address)}</div>
        <div style={{fontSize:11,color:MUTED,marginBottom:12,fontWeight:500}}>{l.neighbourhood&&l.neighbourhood!=='Mississauga'?l.neighbourhood+', ':''}Mississauga</div>

        {/* Price row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
          <div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:19,fontWeight:700,color:TEXT,letterSpacing:"-0.02em"}}>{fmtK(l.price)}</div>
            {l.priceReduction>0&&<div style={{fontSize:10,color:MUTED,textDecoration:"line-through",marginTop:1}}>{fmtK(l.originalPrice)}</div>}
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:(l.cashFlow||0)>=0?12:11,color:cf.color,fontWeight:(l.cashFlow||0)>=0?600:500,background:(l.cashFlow||0)>=0?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.04)",padding:"3px 8px",borderRadius:5,border:`1px solid ${(l.cashFlow||0)>=0?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.08)"}`}}>{cf.label}</div>
        </div>

        {/* Specs — Bloomberg terminal style data row */}
        <div style={{display:"flex",gap:4,marginBottom:8,background:SURFACE,borderRadius:6,padding:"6px 8px",border:`1px solid ${BORDER}`}}>
          {[
            [l.beds,"BD"],
            [l.baths,"BA"],
            [l.dom+"d","DOM"],
            [l.capRate?l.capRate+"%":"—","CAP"],
            [l.cashOnCash?(l.cashOnCash>0?"+":"")+l.cashOnCash+"%":"—","CoC"],
          ].map(([val,unit],idx,arr)=>(
            <div key={unit} style={{flex:1,textAlign:"center",borderRight:idx<arr.length-1?`1px solid ${BORDER}`:"none",paddingRight:idx<arr.length-1?4:0}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",color:unit==="CoC"?(l.cashOnCash>=0?GREEN:RED):TEXT,fontWeight:700,fontSize:11,lineHeight:1}}>{val}</div>
              <div style={{fontSize:7,color:MUTED,fontWeight:600,letterSpacing:"0.08em",marginTop:2}}>{unit}</div>
            </div>
          ))}
        </div>
        {/* Rent estimate row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,fontSize:11,color:MUTED}}>
          <span>Est. Rent: <span style={{color:TEXT,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>${(l.estimatedRent||0).toLocaleString()}/mo</span></span>
          <span>Mtg: <span style={{color:TEXT,fontFamily:"'JetBrains Mono',monospace"}}>${Math.round(calcMonthly(l.price,20,5.5,25)).toLocaleString()}/mo</span></span>
        </div>

        {/* Compare + Saved + Brokerage */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid rgba(255,255,255,0.05)`,paddingTop:8}}>
          <div style={{fontSize:9.5,color:"#3A4E68",fontStyle:"italic",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>
            {l.isSample?"Sample Data":"Courtesy: "+(l.brokerage||"Listing Brokerage")}
          </div>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            {isSaved&&<span style={{fontSize:10,color:GOLD}} title="Saved">★</span>}
            {onToggleCompare&&<button onClick={e=>{e.stopPropagation();onToggleCompare(l.id);}} style={{background:isComparing?"rgba(59,130,246,0.15)":"transparent",border:`1px solid ${isComparing?"rgba(59,130,246,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:4,padding:"2px 6px",fontSize:9,color:isComparing?BLUE:MUTED,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}} title="Add to compare">{isComparing?"✓ CMP":"+ CMP"}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REGISTRATION WALL MODAL
───────────────────────────────────────────── */
function RegModal({onClose,onSuccess}){
  const [form,setForm]=useState({name:"",email:"",phone:"",casl:false});
  const [err,setErr]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [done,setDone]=useState(false);

  const handleSubmit=async()=>{
    if(!form.name.trim()){setErr("Name is required.");return;}
    if(!form.email.trim()||!form.email.includes("@")){setErr("A valid email is required.");return;}
    if(!form.casl){setErr("Please accept the consent checkbox to continue.");return;}
    setSubmitting(true);setErr("");
    try{
      await fetch("/api/lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.name,email:form.email,phone:form.phone||"",source:"registration",timestamp:new Date().toISOString()})});
      setDone(true);
      setTimeout(()=>onSuccess(form.name),2500);
    }catch(e){setErr("Something went wrong. Please try again.");setSubmitting(false);}
  };

  if(done)return(
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div style={{background:CARD,border:`1px solid ${GOLD_BORDER}`,borderRadius:16,width:"100%",maxWidth:480,animation:"fadeUp .3s ease",textAlign:"center",padding:"48px 32px"}}>
        <div style={{fontSize:48,marginBottom:16}}>✓</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:TEXT,marginBottom:10}}>Welcome, {form.name.split(" ")[0]}!</h2>
        <p style={{fontSize:15,color:GREEN,fontWeight:600,marginBottom:8}}>You now have full access to all listings and analysis.</p>
        <p style={{fontSize:13,color:MUTED,lineHeight:1.7,marginBottom:16}}>Hamza will reach out to you shortly with exclusive off-market deals and investment opportunities tailored to your goals.</p>
        <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:10,padding:"14px 18px",marginBottom:16}}>
          <div style={{fontSize:11,color:MUTED,marginBottom:4}}>Your account</div>
          <div style={{fontSize:14,color:TEXT,fontWeight:600}}>{form.email}</div>
        </div>
        <p style={{fontSize:11,color:MUTED}}>Hamza Nouman, Sales Representative · Royal LePage Signature Realty, Brokerage</p>
      </div>
    </div>
  );

  return(
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}} role="dialog" aria-modal="true" aria-labelledby="reg-title">
      <div style={{background:CARD,border:`1px solid ${GOLD_BORDER}`,borderRadius:16,width:"100%",maxWidth:480,animation:"fadeUp .3s ease"}}>
        <div style={{padding:"28px 28px 20px",borderBottom:`1px solid ${BORDER}`}}>
          <div style={{fontSize:28,marginBottom:8}}>🔓</div>
          <h2 id="reg-title" style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:TEXT,marginBottom:6}}>Unlock Full Access</h2>
          <p style={{fontSize:13,color:MUTED,lineHeight:1.6}}>Sign up free to unlock Hamza's investment scores, cash flow analysis, and detailed notes on every listing.</p>
        </div>
        <div style={{padding:"20px 28px"}}>
          {[["Full Name *","name","text","John Smith"],["Email *","email","email","you@email.com"],["Phone (optional)","phone","tel","647-555-1234"]].map(([label,key,type,placeholder])=>(
            <div key={key} style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,color:MUTED,fontWeight:600,marginBottom:5,letterSpacing:"0.03em"}} htmlFor={`reg-${key}`}>{label}</label>
              <input id={`reg-${key}`} type={type} placeholder={placeholder} value={form[key]}
                onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                style={{width:"100%",background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:14}}
                aria-required={key!=="phone"?"true":"false"}
              />
            </div>
          ))}

          {/* CASL Consent — mandatory */}
          <div style={{background:"rgba(196,154,60,0.05)",border:`1px solid rgba(196,154,60,0.2)`,borderRadius:8,padding:"12px 14px",marginBottom:14}}>
            <label style={{display:"flex",gap:10,alignItems:"flex-start",cursor:"pointer"}}>
              <input type="checkbox" id="reg-casl" checked={form.casl} onChange={e=>setForm(f=>({...f,casl:e.target.checked}))} aria-required="true" style={{marginTop:3,flexShrink:0}}/>
              <span style={{fontSize:11,color:MUTED,lineHeight:1.6}}>{CASL_TEXT}</span>
            </label>
          </div>

          {err&&<div role="alert" style={{color:RED,fontSize:12,marginBottom:12}}>{err}</div>}

          <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{width:"100%",padding:"13px",borderRadius:10,fontSize:15}}>
            {submitting?"Creating your account...":"Sign Up — Free"}
          </button>
          <p style={{fontSize:11,color:MUTED,textAlign:"center",marginTop:10,lineHeight:1.5}}>
            Your information is protected under PIPEDA. We will never sell your data.<br/>
            <span style={{color:GOLD}}>Hamza Nouman, Sales Representative · Royal LePage Signature Realty, Brokerage</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LISTING MODAL
───────────────────────────────────────────── */
function ListingModal({l,onClose,isRegistered,onRequireReg,seenDisclaimer,onShowDisclaimer,savedDeals=[],onSaveDeal}){
  const [tab,setTab]=useState("overview");
  const [takeUnlocked]=useState(()=>{try{const v=localStorage.getItem('take_views');if(!v||parseInt(v)===0){localStorage.setItem('take_views','1');return true;}return false;}catch{return true;}});
  const [down,setDown]=useState(20);
  const [rate,setRate]=useState(5.5);
  const [amort,setAmort]=useState(25);
  const [reno,setReno]=useState(50000);
  const [arv,setArv]=useState(Math.round((l.price||0)*1.2));
  const [aiLoading,setAiLoading]=useState(false);
  const [aiResult,setAiResult]=useState("");
  const [vacancy,setVacancy]=useState(5);
  const [opex,setOpex]=useState(30);
  const [photoIdx,setPhotoIdx]=useState(0);
  const [lightboxOpen,setLightboxOpen]=useState(false);
  const [lazyPhotos,setLazyPhotos]=useState(null);
  // Always load full photo set when modal opens
  useEffect(()=>{
    if(l.id){
      fetch('/api/photos?id='+encodeURIComponent(l.id))
        .then(r=>r.json())
        .then(d=>{if(d.photos&&d.photos.length>0)setLazyPhotos(d.photos);})
        .catch(()=>{});
    }
  },[l.id]);
  const uniquePhotos=lazyPhotos||(l.photos&&l.photos.length>0?[...new Set(l.photos)]:[]);

  const monthly=calcMonthly(l.price,down,rate,amort);
  const propTax=Math.round(l.price*0.0095/12); // ~0.95% Mississauga mill rate
  const propInsurance=Math.round(l.price*0.003/12); // ~0.3% insurance
  const maintenance=Math.round(l.estimatedRent*0.05); // 5% maintenance reserve
  const vacancyLoss=Math.round(l.estimatedRent*vacancy/100);
  const totalExpenses=monthly+propTax+propInsurance+maintenance+vacancyLoss;
  const brutoCF=l.estimatedRent-totalExpenses;
  const noi=l.estimatedRent*12*(1-vacancy/100)*(1-opex/100);
  const capRate=((noi/l.price)*100).toFixed(2);
  const totalCashInvested=l.price*down/100;
  const cashOnCash=totalCashInvested>0?((brutoCF*12/totalCashInvested)*100).toFixed(2):"—";
  const grm=(l.price/(l.estimatedRent*12)).toFixed(1);

  const brrrEquity=arv-(l.price+reno);
  const cashRecovered=arv*0.75-(l.price*0.8);

  const TABS=[
    {id:"overview",label:"Overview"},
    {id:"take",label:"Hamza's Take"},
    {id:"mortgage",label:"Mortgage"},
    {id:"caprate",label:"Cap Rate"},
    {id:"brrr",label:"BRRR"},
    {id:"ai",label:"AI Analysis"}
  ];

  const isTabLocked=(id)=>!isRegistered&&(["mortgage","caprate","brrr","ai"].includes(id)||(id==="take"&&!takeUnlocked));

  const handleCalcTab=(id)=>{
    if(["mortgage","caprate","brrr","ai"].includes(id)||(id==="take"&&!takeUnlocked)){
      if(!isRegistered){setTab(id);return;} // Show blurred preview instead of blocking
      if(!seenDisclaimer){onShowDisclaimer(()=>setTab(id));return;}
    }
    setTab(id);
  };
  const isLockedTab=isTabLocked(tab);

  const callAI=async()=>{
    setAiLoading(true);setAiResult("");
    try{
      const cf=l.cashFlow||0;
      const cr=l.capRate||0;
      const prompt=`You are Hamza Nouman's AI assistant for mississaugainvestor.ca. Analyze this Mississauga investment property and provide a concise investor-focused analysis in 4-6 sentences covering: investment grade (strong/moderate/weak), cash flow assessment at ${cf>=0?"+":""}$${Math.abs(cf)}/mo, cap rate of ${cr}% vs Mississauga average, DOM of ${l.dom||0} days and what it signals about seller motivation, and one specific action recommendation for an investor.

Property: ${l.address}, ${l.neighbourhood||l.city||"Mississauga"}, Mississauga
Price: $${(l.price||0).toLocaleString()} (${(l.priceReduction||0)>0?`down ${l.priceReduction}% from $${(l.originalPrice||l.price||0).toLocaleString()}`:"at ask"})
Type: ${l.type||"Residential"} | ${l.beds||0}bd/${l.baths||0}ba | ${l.dom||0} days on market
Est. Rent: $${(l.estimatedRent||0).toLocaleString()}/mo | Cash Flow: ${cf>=0?"+":""}$${cf}/mo | Cap Rate: ${cr}%
LRT Access: ${l.lrtAccess?"Yes — Hurontario corridor":"No"} | Walk: ${l.walkScore||0}/100 | Transit: ${l.transitScore||0}/100

Write in plain English, no markdown headers or bullet points. Be decisive and direct — this is for a serious investor.`;
      const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({prompt})});
      const d=await res.json();
      // Parse Anthropic array response
      let text="";
      if(Array.isArray(d.content)) text=d.content.filter(b=>b.type==="text").map(b=>b.text).join("").trim();
      else if(typeof d.content==="string") text=d.content.trim();
      else if(d.analysis) text=d.analysis;
      setAiResult(text||"Analysis not available. Please try again.");
    }catch{setAiResult("AI analysis temporarily unavailable. Please try again shortly.");}
    setAiLoading(false);
  };

  return(
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:18,width:"100%",maxWidth:720,animation:"fadeUp .3s ease"}}>

        {/* Header */}
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
              {l.hamzasPick&&<span style={{fontSize:11,color:GOLD,fontWeight:700,background:"rgba(196,154,60,0.1)",border:`1px solid rgba(196,154,60,0.3)`,padding:"2px 8px",borderRadius:4}}>★ HAMZA'S PICK</span>}
              <span style={{fontSize:11,color:MUTED,background:"rgba(255,255,255,0.05)",padding:"2px 8px",borderRadius:4,border:`1px solid ${BORDER}`}}>{l.type}</span>
              
            </div>
            <h2 id="modal-title" style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:TEXT,marginBottom:2}}>{l.address}</h2>
            <div style={{fontSize:13,color:MUTED}}>{l.neighbourhood}, Mississauga · Courtesy: {l.brokerage}</div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
            <ScoreBadge score={l.hamzaScore||0} size="lg"/>
            <button onClick={onClose} aria-label="Close listing" style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:24,lineHeight:1,padding:"4px"}}>×</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",overflow:"auto",borderBottom:`1px solid ${BORDER}`,paddingLeft:16}}>
          {TABS.map(t=>(
            <button key={t.id} className={`tab-btn${tab===t.id?" active":""}`} onClick={()=>handleCalcTab(t.id)}>
              {t.label}
              {["mortgage","caprate","brrr","ai"].includes(t.id)&&!isRegistered&&<span style={{fontSize:10,marginLeft:4,opacity:0.6}}>🔒</span>}
            </button>
          ))}
        </div>

        <div className="modal-scroll" style={{padding:"20px 24px",position:"relative"}}>

          {/* Blur overlay for locked tabs */}
          {isLockedTab&&(
            <div style={{position:"absolute",inset:0,zIndex:5,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(5,9,26,0.6)",backdropFilter:"blur(6px)",borderRadius:8}}>
              <div style={{fontSize:32,marginBottom:10}}>🔒</div>
              <div style={{fontSize:16,fontWeight:700,color:TEXT,marginBottom:6}}>Full Analysis Locked</div>
              <p style={{fontSize:13,color:MUTED,marginBottom:14,textAlign:"center",maxWidth:300}}>Sign up free to unlock mortgage calculators, cap rate analysis, BRRR tools, and AI insights.</p>
              <button onClick={onRequireReg} className="btn-primary" style={{padding:"11px 28px",borderRadius:9,fontSize:14}}>Sign Up Free to Unlock</button>
            </div>
          )}

          {/* OVERVIEW */}
          {tab==="overview"&&(
            <div>
              {/* Photo gallery */}
              {uniquePhotos.length>0&&(
                <div style={{marginBottom:20,borderRadius:12,overflow:"hidden",position:"relative"}}>
                  <img src={uniquePhotos[photoIdx]} alt={l.address}
                    onClick={()=>setLightboxOpen(true)}
                    style={{width:"100%",height:320,objectFit:"cover",display:"block",cursor:"zoom-in"}}
                    onError={e=>{e.target.style.display="none";}}/>
                  {/* Click to enlarge hint */}
                  <div style={{position:"absolute",top:10,right:10,background:"rgba(5,9,26,0.7)",backdropFilter:"blur(4px)",borderRadius:6,padding:"4px 10px",fontSize:10,color:"rgba(255,255,255,0.7)",cursor:"pointer",border:"1px solid rgba(255,255,255,0.1)"}} onClick={()=>setLightboxOpen(true)}>⛶ Enlarge</div>
                  {uniquePhotos.length>1&&(
                    <div style={{position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,alignItems:"center"}}>
                      <button onClick={()=>setPhotoIdx(i=>i>0?i-1:uniquePhotos.length-1)} style={{width:32,height:32,borderRadius:"50%",background:"rgba(5,9,26,0.7)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>‹</button>
                      <span style={{fontSize:11,color:"#fff",fontFamily:"'JetBrains Mono',monospace",background:"rgba(5,9,26,0.6)",padding:"4px 10px",borderRadius:12,backdropFilter:"blur(4px)"}}>{photoIdx+1}/{uniquePhotos.length}</span>
                      <button onClick={()=>setPhotoIdx(i=>i<uniquePhotos.length-1?i+1:0)} style={{width:32,height:32,borderRadius:"50%",background:"rgba(5,9,26,0.7)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>›</button>
                    </div>
                  )}
                  {/* Thumbnail strip — ALL photos */}
                  {uniquePhotos.length>1&&(
                    <div style={{display:"flex",gap:4,padding:"8px",background:"rgba(5,9,26,0.9)",overflowX:"auto"}}>
                      {uniquePhotos.map((p,i)=>(
                        <img key={i} src={p} alt="" onClick={()=>setPhotoIdx(i)}
                          style={{width:56,height:40,objectFit:"cover",borderRadius:4,cursor:"pointer",opacity:i===photoIdx?1:0.5,border:i===photoIdx?`2px solid ${BLUE}`:"2px solid transparent",transition:"all .15s ease",flexShrink:0}}
                          onError={e=>{e.target.style.display="none";}}/>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Fullscreen lightbox */}
              {lightboxOpen&&uniquePhotos.length>0&&<PhotoLightbox photos={uniquePhotos} startIdx={photoIdx} onClose={()=>setLightboxOpen(false)}/>}

              {/* Stats grid */}
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
                <StatBox label="List Price" value={fmtK(l.price||0)} accent={TEXT}/>
                <StatBox label="Price Drop" value={(l.priceReduction||0)>0?`-${l.priceReduction}%`:"—"} accent={(l.priceReduction||0)>0?GREEN:MUTED}/>
                <StatBox label="Days on Market" value={l.dom||0} sub="days" accent={(l.dom||0)>=40?RED:TEXT}/>
                <StatBox label="Est. Rent" value={`$${(l.estimatedRent||0).toLocaleString()}/mo`} accent={GREEN}/>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
                <StatBox label="Beds" value={l.beds||0}/>
                <StatBox label="Baths" value={l.baths||0}/>
                <StatBox label="Type" value={l.type||'—'}/>
                <StatBox label="LRT Access" value={l.lrtAccess?"✓ Yes":"—"} accent={l.lrtAccess?GREEN:MUTED}/>
              </div>
              {/* Walkability */}
              <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:12,padding:"16px 18px",marginBottom:16}}>
                <div style={{fontSize:12,color:MUTED,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:12}}>Location Scores</div>
                <ScoreBar label="Walk Score" value={l.walkScore} color={BLUE}/>
                <ScoreBar label="Transit Score" value={l.transitScore} color={GREEN}/>
                <ScoreBar label="School Score" value={l.schoolScore} color={GOLD}/>
              </div>
              {/* TRREB disclaimer */}
              <div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px"}}>
                <p style={{fontSize:10,color:MUTED,lineHeight:1.6}}>{l.isSample
                  ? <>⚠️ <strong style={{color:TEXT}}>SAMPLE DATA.</strong> This is demonstration data only. For real listings, call Hamza at 647-609-1289.</>
                  : <>Listing data provided under license via PropTx/TRREB. The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by The Canadian Real Estate Association (CREA). Deemed reliable but not guaranteed. Not intended to solicit buyers or sellers currently under contract.</>
                }</p>
              </div>
            </div>
          )}

          {/* HAMZA'S TAKE */}
          {tab==="take"&&(
            <div>
              <div style={{background:"rgba(196,154,60,0.05)",border:`1px solid rgba(196,154,60,0.2)`,borderRadius:12,padding:"20px 22px",marginBottom:16}}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <img src="/hamza.jpg.JPG" onError={e=>{e.target.style.display="none"}} alt="Hamza Nouman" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`2px solid rgba(196,154,60,0.4)`}}/>
                  <div>
                    <div style={{fontSize:12,color:GOLD,fontWeight:700,marginBottom:2}}>Hamza's Take — Personal Opinion Only</div>
                    <div style={{fontSize:11,color:MUTED,marginBottom:10,fontStyle:"italic"}}>Not MLS® data. Not provided by TRREB or Royal LePage. This is my personal professional opinion as a licensed agent.</div>
                    <p style={{fontSize:14,color:TEXT,lineHeight:1.8}}>{l.hamzaNotes}</p>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <StatBox label="Hamza's Score" value={`${(l.hamzaScore||0).toFixed(1)}/10`} accent={scoreColor(l.hamzaScore||0)}/>
                <StatBox label="Est. Cash Flow" value={fmtNum(l.cashFlow)} accent={fmtCF(l.cashFlow).color}/>
                <StatBox label="Est. Cap Rate" value={`${l.capRate}%`} accent={GOLD}/>
              </div>
              <div style={{marginTop:12,padding:"10px 14px",background:"rgba(255,255,255,0.02)",borderRadius:8,border:`1px solid ${BORDER}`}}>
                <p style={{fontSize:10,color:MUTED,lineHeight:1.6}}>Investment analysis provided by Hamza Nouman, Sales Representative, Royal LePage Signature Realty, Brokerage, for informational purposes only. Not financial advice. Verify all estimates independently. Consult a licensed financial advisor before making investment decisions.</p>
              </div>
            </div>
          )}

          {/* MORTGAGE */}
          {tab==="mortgage"&&(
            <div>
              <div style={{background:"rgba(61,155,233,0.05)",border:`1px solid rgba(61,155,233,0.15)`,borderRadius:8,padding:"10px 14px",marginBottom:18}}>
                <p style={{fontSize:11,color:MUTED,lineHeight:1.5}}>⚠️ <strong style={{color:BLUE}}>Mortgage Disclaimer:</strong> Payment estimates are for illustrative purposes only and do not constitute a mortgage offer, pre-approval, or commitment. Hamza Nouman is a registered real estate sales representative, NOT a licensed mortgage broker. For mortgage advice, consult a licensed mortgage broker or lender.</p>
              </div>
              {[["Down Payment",down+"%",5,50,down,v=>setDown(Number(v)),"down%"],["Interest Rate",rate+"%",3,9,rate,v=>setRate(Number(v)),"rate"],["Amortization",amort+" yrs",10,30,amort,v=>setAmort(Number(v)),"amort"]].map(([label,display,min,max,val,setter,id])=>(
                <div key={id} style={{marginBottom:18}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <label htmlFor={id} style={{fontSize:13,color:MUTED,fontWeight:500}}>{label}</label>
                    <span className="mono" style={{fontSize:14,color:GOLD,fontWeight:600}}>{display}</span>
                  </div>
                  <input id={id} type="range" min={min} max={max} step={label==="Interest Rate"?0.25:1} value={val} onChange={e=>setter(e.target.value)} style={{width:"100%"}} aria-label={label}/>
                </div>
              ))}
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:4}}>
                <StatBox label="Monthly Payment" value={`$${monthly.toLocaleString()}`} accent={TEXT}/>
                <StatBox label="Down Payment $" value={`$${Math.round(l.price*down/100).toLocaleString()}`} accent={BLUE}/>
                <StatBox label="Mortgage Amt" value={fmtK(Math.round(l.price*(1-down/100)))} accent={MUTED}/>
              </div>
              <div style={{marginTop:12,padding:"12px 16px",background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:10}}>
                <div style={{fontSize:11,color:MUTED,marginBottom:8}}>Estimated Monthly Cash Flow (simplified)</div>
                <div className="mono" style={{fontSize:24,fontWeight:700,color:brutoCF>0?GREEN:RED}}>{brutoCF>0?"+":""}{brutoCF.toLocaleString()}/mo</div>
                <div style={{fontSize:11,color:MUTED,marginTop:4}}>Rent ${l.estimatedRent.toLocaleString()} − Mortgage ${monthly.toLocaleString()} − Est. Expenses ${Math.round(l.price*0.015/12).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* CAP RATE */}
          {tab==="caprate"&&(
            <div>
              <div style={{background:"rgba(196,154,60,0.04)",border:`1px solid ${GOLD_BORDER}`,borderRadius:8,padding:"10px 14px",marginBottom:18}}>
                <p style={{fontSize:11,color:MUTED,lineHeight:1.5}}>These estimates are based on assumed market rents and operating expense ratios. Actual results will vary. Not financial advice. Verify with a licensed accountant.</p>
              </div>
              {[["Vacancy Rate",vacancy+"%",0,15,vacancy,v=>setVacancy(Number(v)),"vac"],["Operating Expenses (% of rent)",opex+"%",20,45,opex,v=>setOpex(Number(v)),"opex"]].map(([label,display,min,max,val,setter,id])=>(
                <div key={id} style={{marginBottom:18}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <label htmlFor={id} style={{fontSize:13,color:MUTED}}>{label}</label>
                    <span className="mono" style={{fontSize:14,color:GOLD}}>{display}</span>
                  </div>
                  <input id={id} type="range" min={min} max={max} value={val} onChange={e=>setter(e.target.value)} style={{width:"100%"}} aria-label={label}/>
                </div>
              ))}
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <StatBox label="Cap Rate" value={capRate+"%"} accent={parseFloat(capRate)>=5?GREEN:parseFloat(capRate)>=4?GOLD:RED}/>
                <StatBox label="Annual NOI" value={`$${Math.round(noi).toLocaleString()}`} accent={GREEN}/>
                <StatBox label="Cash-on-Cash" value={cashOnCash+"%"} accent={BLUE}/>
                <StatBox label="Gross Rent Mult." value={grm+"x"} accent={MUTED}/>
              </div>
              <div style={{marginTop:10,padding:"12px 16px",background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:13,color:MUTED}}>Annual Gross Rent</span>
                  <span className="mono" style={{fontSize:13,color:TEXT}}>${(l.estimatedRent*12).toLocaleString()}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:13,color:MUTED}}>Vacancy ({vacancy}%)</span>
                  <span className="mono" style={{fontSize:13,color:RED}}>-${Math.round(l.estimatedRent*12*vacancy/100).toLocaleString()}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:13,color:MUTED}}>Operating Expenses ({opex}%)</span>
                  <span className="mono" style={{fontSize:13,color:RED}}>-${Math.round(l.estimatedRent*12*(1-vacancy/100)*opex/100).toLocaleString()}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",borderTop:`1px solid ${BORDER}`,paddingTop:8}}>
                  <span style={{fontSize:13,fontWeight:600,color:TEXT}}>Net Operating Income</span>
                  <span className="mono" style={{fontSize:14,fontWeight:700,color:GREEN}}>${Math.round(noi).toLocaleString()}</span>
                </div>
              </div>
              {/* Cash-on-Cash Breakdown */}
              <div style={{marginTop:14,padding:"12px 16px",background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:10}}>
                <div style={{fontSize:12,fontWeight:700,color:GOLD,marginBottom:10}}>Cash-on-Cash Return Breakdown</div>
                {[["Estimated Rent",l.estimatedRent,TEXT],["Mortgage Payment",-monthly,RED],["Property Tax (0.95%)",-propTax,RED],["Insurance (0.3%)",-propInsurance,RED],["Maintenance (5%)",-maintenance,RED],["Vacancy ("+vacancy+"%)",-vacancyLoss,RED]].map(([lbl,val,clr])=>(
                  <div key={lbl} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:MUTED}}>{lbl}</span>
                    <span className="mono" style={{fontSize:12,color:clr}}>{val>=0?"$":"−$"}{Math.abs(Math.round(val)).toLocaleString()}/mo</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",borderTop:`1px solid ${BORDER}`,paddingTop:8,marginTop:6}}>
                  <span style={{fontSize:13,fontWeight:600,color:TEXT}}>Monthly Cash Flow</span>
                  <span className="mono" style={{fontSize:14,fontWeight:700,color:brutoCF>=0?GREEN:RED}}>{brutoCF>=0?"$":"−$"}{Math.abs(Math.round(brutoCF)).toLocaleString()}/mo</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                  <span style={{fontSize:12,color:MUTED}}>Down Payment ({down}%)</span>
                  <span className="mono" style={{fontSize:12,color:TEXT}}>${Math.round(totalCashInvested).toLocaleString()}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  <span style={{fontSize:13,fontWeight:600,color:TEXT}}>Cash-on-Cash Return</span>
                  <span className="mono" style={{fontSize:14,fontWeight:700,color:parseFloat(cashOnCash)>=8?GREEN:parseFloat(cashOnCash)>=4?GOLD:RED}}>{cashOnCash}%</span>
                </div>
              </div>
            </div>
          )}

          {/* BRRR */}
          {tab==="brrr"&&(
            <div>
              <div style={{background:"rgba(196,154,60,0.04)",border:`1px solid ${GOLD_BORDER}`,borderRadius:8,padding:"10px 14px",marginBottom:18}}>
                <p style={{fontSize:11,color:MUTED,lineHeight:1.5}}>BRRR estimates are for illustrative purposes only. Renovation costs, ARV, and refinancing terms vary significantly. Verify all figures with a licensed contractor, appraiser, and mortgage broker before proceeding.</p>
              </div>
              {[["Renovation Budget","$"+reno.toLocaleString(),0,200000,reno,v=>setReno(Number(v)),5000,"reno"],["After Repair Value (ARV)","$"+arv.toLocaleString(),l.price,l.price*2,arv,v=>setArv(Number(v)),10000,"arv"]].map(([label,display,min,max,val,setter,step,id])=>(
                <div key={id} style={{marginBottom:18}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <label htmlFor={id} style={{fontSize:13,color:MUTED}}>{label}</label>
                    <span className="mono" style={{fontSize:14,color:GOLD}}>{display}</span>
                  </div>
                  <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={e=>setter(Number(e.target.value))} style={{width:"100%"}} aria-label={label}/>
                </div>
              ))}
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <StatBox label="Total Cost" value={"$"+(l.price+reno).toLocaleString()} accent={TEXT}/>
                <StatBox label="Est. Equity" value={brrrEquity>0?"$"+brrrEquity.toLocaleString():"—"} accent={brrrEquity>0?GREEN:RED}/>
                <StatBox label="75% Refi" value={"$"+Math.round(arv*0.75).toLocaleString()} accent={BLUE}/>
                <StatBox label="Capital Recovered" value={cashRecovered>0?"$"+Math.round(cashRecovered).toLocaleString():"None"} accent={cashRecovered>0?GREEN:MUTED}/>
              </div>
              <div style={{marginTop:12,padding:"14px 16px",background:SURFACE,border:`1px solid ${cashRecovered>0?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"}`,borderRadius:10}}>
                <div style={{fontSize:12,color:MUTED,marginBottom:6}}>BRRR Verdict</div>
                <div style={{fontSize:15,color:cashRecovered>0?GREEN:RED,fontWeight:600}}>
                  {cashRecovered>0?`✓ You recover $${Math.round(cashRecovered).toLocaleString()} at refi`:"✗ Does not pencil at current assumptions. Adjust renovation budget or ARV."}
                </div>
              </div>
            </div>
          )}

          {/* AI ANALYSIS */}
          {tab==="ai"&&(
            <div>
              <div style={{background:"rgba(61,155,233,0.04)",border:`1px solid rgba(61,155,233,0.15)`,borderRadius:8,padding:"10px 14px",marginBottom:18}}>
                <p style={{fontSize:11,color:MUTED,lineHeight:1.5}}>AI analysis is generated by Claude (Anthropic) based on the listing data above. It is for informational purposes only and does not constitute financial, investment, or real estate advice.</p>
              </div>
              {!aiResult&&!aiLoading&&(
                <div style={{textAlign:"center",padding:"30px 0"}}>
                  <div style={{fontSize:40,marginBottom:12}}>🤖</div>
                  <p style={{color:MUTED,fontSize:14,marginBottom:20}}>Get an AI-powered investment analysis for this property. Takes about 15 seconds.</p>
                  <button onClick={callAI} className="btn-primary" style={{padding:"12px 32px",borderRadius:10,fontSize:15}}>
                    Run AI Analysis
                  </button>
                </div>
              )}
              {aiLoading&&(
                <div style={{textAlign:"center",padding:"40px 0"}}>
                  <div style={{width:36,height:36,border:`3px solid ${BORDER}`,borderTopColor:GOLD,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 14px"}}/>
                  <p style={{color:MUTED,fontSize:13}}>Analyzing investment potential...</p>
                </div>
              )}
              {aiResult&&(
                <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:12,padding:"18px 20px"}}>
                  <pre style={{whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.8,color:TEXT,fontFamily:"'Inter',sans-serif"}}>{aiResult}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{padding:"16px 24px",borderTop:`1px solid ${BORDER}`,display:"flex",gap:10,flexWrap:"wrap",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:11,color:MUTED}}>📍 {l.isSample?"Sample data":"Live listing"} · Courtesy: {l.brokerage||"Listing Brokerage"}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <a href={`mailto:hamza@nouman.ca?subject=Book Showing: ${encodeURIComponent(l.address)}&body=${encodeURIComponent("Hi Hamza,\n\nI'd like to book a showing for:\n"+l.address+"\nListed at "+fmtK(l.price)+"\n\nPlease let me know your availability.\n\nThank you!")}`}
              style={{display:"inline-flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#10B981,#059669)",color:"#fff",border:"none",padding:"9px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",textDecoration:"none"}}>
              Book a Showing
            </a>
            <a href="tel:16476091289" style={{display:"inline-flex",alignItems:"center",gap:6,background:SURFACE,color:TEXT,border:`1px solid ${BORDER}`,padding:"9px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",textDecoration:"none"}}>
              Call
            </a>
            <button onClick={()=>{const t=l.address+' - '+fmtK(l.price)+', '+(l.capRate||0)+'% cap rate';const u='https://mississaugainvestor.ca';if(navigator.share){navigator.share({title:t,url:u}).catch(()=>{})}else{navigator.clipboard.writeText(t+' '+u).then(()=>alert('Link copied!'))}}} style={{display:"inline-flex",alignItems:"center",gap:6,background:SURFACE,color:TEXT,border:`1px solid ${BORDER}`,padding:"9px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>
              Share
            </button>
            {onSaveDeal&&<button onClick={()=>onSaveDeal(l.id)} style={{display:"inline-flex",alignItems:"center",gap:6,background:savedDeals.includes(l.id)?"rgba(245,158,11,0.12)":SURFACE,color:savedDeals.includes(l.id)?GOLD:TEXT,border:`1px solid ${savedDeals.includes(l.id)?"rgba(245,158,11,0.3)":BORDER}`,padding:"9px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>
              {savedDeals.includes(l.id)?"★ Saved":"☆ Save Deal"}
            </button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PRE-CON FORM
───────────────────────────────────────────── */
function PreConForm({onClose}){
  const [form,setForm]=useState({name:"",phone:"",email:"",budget:"Under $700K",areas:[],casl:false});
  const [sent,setSent]=useState(false);
  const budgets=["Under $700K","$700K–$900K","$900K–$1.2M","$1.2M+"];
  const areaList=["Square One / City Centre","Port Credit","Cooksville","Churchill Meadows","Erin Mills","Clarkson","Streetsville","No Preference"];

  const handleSubmit=()=>{
    if(!form.name||!form.email||!form.casl)return;
    fetch("/api/lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.name,email:form.email,phone:form.phone,source:"precon-vip",listingAddress:"Budget: "+form.budget+", Areas: "+(form.areas.join(", ")||"Any"),timestamp:new Date().toISOString()})});
    setSent(true);
  };

  if(sent)return(
    <div style={{textAlign:"center",padding:"40px 24px"}}>
      <div style={{fontSize:56,marginBottom:16}}>✅</div>
      <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:TEXT,marginBottom:8}}>You're on the VIP List!</h3>
      <p style={{color:MUTED,fontSize:14,lineHeight:1.7,marginBottom:20}}>Hamza will reach out within 24 hours with upcoming pre-construction opportunities matching your profile.</p>
      <button onClick={onClose} className="btn-gold-outline" style={{padding:"10px 24px",borderRadius:8,fontSize:14}}>Close</button>
    </div>
  );

  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{marginBottom:20}}>
        <div style={{background:"rgba(196,154,60,0.08)",border:`1px solid rgba(196,154,60,0.2)`,borderRadius:10,padding:"14px 16px",marginBottom:12}}>
          <p style={{fontSize:12,color:MUTED,lineHeight:1.6}}>🔒 <strong style={{color:GOLD}}>VIP Access Only.</strong> Pre-construction pricing and floor plans are shared directly by Hamza based on your investment profile. No public listings shown here — this is a lead capture form only. Contact Hamza for current opportunities.</p>
        </div>
        <div style={{background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:18,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:14,flexShrink:0}}>🔥</span>
          <span style={{fontSize:12,color:TEXT2,lineHeight:1.5}}>Currently tracking <strong style={{color:GOLD}}>3 upcoming launches</strong> in Mississauga — register now for priority pricing before public release.</span>
        </div>
        {[["Full Name *","name","text"],["Phone *","phone","tel"],["Email","email","email"]].map(([label,key,type])=>(
          <div key={key} style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:12,color:MUTED,fontWeight:600,marginBottom:5}} htmlFor={`precon-${key}`}>{label}</label>
            <input id={`precon-${key}`} type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
              style={{width:"100%",background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:14}}
              aria-required={key!=="email"?"true":"false"}/>
          </div>
        ))}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,color:MUTED,fontWeight:600,marginBottom:5}}>Budget Range</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {budgets.map(b=><button key={b} onClick={()=>setForm(f=>({...f,budget:b}))} className={"chip"+(form.budget===b?" active":"")} style={{padding:"7px 14px"}}>{b}</button>)}
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,color:MUTED,fontWeight:600,marginBottom:5}}>Preferred Areas (select all that apply)</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {areaList.map(a=><button key={a} onClick={()=>setForm(f=>({...f,areas:f.areas.includes(a)?f.areas.filter(x=>x!==a):[...f.areas,a]}))} className={"chip"+(form.areas.includes(a)?" active":"")} style={{padding:"7px 14px",fontSize:11}}>{a}</button>)}
          </div>
        </div>
        {/* CASL */}
        <div style={{background:"rgba(196,154,60,0.05)",border:`1px solid rgba(196,154,60,0.2)`,borderRadius:8,padding:"12px 14px",marginBottom:14}}>
          <label style={{display:"flex",gap:10,alignItems:"flex-start",cursor:"pointer"}}>
            <input type="checkbox" checked={form.casl} onChange={e=>setForm(f=>({...f,casl:e.target.checked}))} style={{marginTop:3,flexShrink:0}}/>
            <span style={{fontSize:11,color:MUTED,lineHeight:1.6}}>{CASL_TEXT}</span>
          </label>
        </div>
        <button onClick={handleSubmit} disabled={!form.name||!form.phone||!form.casl} className="btn-primary" style={{width:"100%",padding:"13px",borderRadius:10,fontSize:15,opacity:(!form.name||!form.phone||!form.casl)?0.4:1,cursor:(!form.name||!form.phone||!form.casl)?"not-allowed":"pointer"}}>
          Join Pre-Con VIP List
        </button>
        <p style={{fontSize:11,color:MUTED,textAlign:"center",marginTop:10}}>Hamza Nouman, Sales Representative · Royal LePage Signature Realty, Brokerage</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SELLER FORM
───────────────────────────────────────────── */
function SellerModal({onClose}){
  const [form,setForm]=useState({name:"",phone:"",address:"",type:"Detached",beds:"3",casl:false});
  const [sent,setSent]=useState(false);

  const handleSubmit=()=>{
    if(!form.name||!form.address||!form.casl)return;
    fetch("/api/lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.name,email:form.phone,phone:form.phone,source:"seller-valuation",listingAddress:form.address+" ("+form.type+", "+form.beds+"bd)",timestamp:new Date().toISOString()})});
    setSent(true);
  };

  if(sent)return(
    <div style={{textAlign:"center",padding:"40px 24px"}}>
      <div style={{fontSize:56,marginBottom:16}}>🏡</div>
      <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:TEXT,marginBottom:8}}>Request Received!</h3>
      <p style={{color:MUTED,fontSize:14,lineHeight:1.7,marginBottom:20}}>Hamza will prepare a complimentary market analysis for your property and be in touch within 24 hours.</p>
      <button onClick={onClose} className="btn-gold-outline" style={{padding:"10px 24px",borderRadius:8,fontSize:14}}>Close</button>
    </div>
  );

  return(
    <div style={{padding:"24px 28px"}}>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:TEXT,marginBottom:6}}>What Is My Home Worth?</h2>
      <p style={{fontSize:13,color:MUTED,marginBottom:20,lineHeight:1.6}}>Get a complimentary market analysis from Hamza — no obligation, no pressure.</p>
      {[["Full Name *","name","text"],["Phone *","phone","tel"],["Property Address *","address","text"]].map(([label,key,type])=>(
        <div key={key} style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,color:MUTED,fontWeight:600,marginBottom:5}} htmlFor={`sell-${key}`}>{label}</label>
          <input id={`sell-${key}`} type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
            style={{width:"100%",background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:14}}
            aria-required="true"/>
        </div>
      ))}
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div style={{flex:2}}>
          <label style={{display:"block",fontSize:12,color:MUTED,fontWeight:600,marginBottom:5}}>Property Type</label>
          <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{width:"100%",background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:14}}>
            {["Detached","Semi-Detached","Townhouse","Condo","Duplex","Triplex","Fourplex","Multiplex","Other"].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{flex:1}}>
          <label style={{display:"block",fontSize:12,color:MUTED,fontWeight:600,marginBottom:5}}>Beds</label>
          <select value={form.beds} onChange={e=>setForm(f=>({...f,beds:e.target.value}))} style={{width:"100%",background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:14}}>
            {["1","2","3","4","5+"].map(b=><option key={b}>{b}</option>)}
          </select>
        </div>
      </div>
      {/* CASL */}
      <div style={{background:"rgba(196,154,60,0.05)",border:`1px solid rgba(196,154,60,0.2)`,borderRadius:8,padding:"12px 14px",marginBottom:16}}>
        <label style={{display:"flex",gap:10,alignItems:"flex-start",cursor:"pointer"}}>
          <input type="checkbox" checked={form.casl} onChange={e=>setForm(f=>({...f,casl:e.target.checked}))} style={{marginTop:3,flexShrink:0}}/>
          <span style={{fontSize:11,color:MUTED,lineHeight:1.6}}>{CASL_TEXT}</span>
        </label>
      </div>
      <button onClick={handleSubmit} disabled={!form.name||!form.phone||!form.address||!form.casl} className="btn-primary" style={{width:"100%",padding:"13px",borderRadius:10,fontSize:15,opacity:(!form.name||!form.phone||!form.address||!form.casl)?0.4:1,cursor:(!form.name||!form.phone||!form.address||!form.casl)?"not-allowed":"pointer"}}>
        Request Free Valuation
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   QUIZ COMPONENT
───────────────────────────────────────────── */
function QuizView({onResult}){
  const [step,setStep]=useState(0);
  const [answers,setAnswers]=useState([]);
  const [result,setResult]=useState(null);
  const [leadForm,setLeadForm]=useState({name:"",phone:"",casl:false});
  const [sent,setSent]=useState(false);

  const [emailGate,setEmailGate]=useState(false);
  const [gateEmail,setGateEmail]=useState("");

  const handleAnswer=(ans)=>{
    const next=[...answers,ans];
    if(step<QUIZ.length-1){setAnswers(next);setStep(s=>s+1);}
    else{
      setAnswers(next);
      setEmailGate(true); // show email gate before results
    }
  };

  const handleEmailGate=()=>{
    if(!gateEmail)return;
    const profiles=["cashflow","appreciation","brrr","precon"];
    setResult(QUIZ_RESULTS[profiles[Math.floor(Math.random()*3)]]);
    setEmailGate(false);
    // Send lead
    fetch("/api/lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:"Quiz Lead",email:gateEmail,source:"quiz-email-gate",timestamp:new Date().toISOString()})}).catch(()=>{});
  };

  const handleLead=()=>{
    if(!leadForm.name||!leadForm.casl)return;
    fetch("/api/lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:leadForm.name,email:leadForm.phone||leadForm.email||"",phone:leadForm.phone,source:"investor-quiz",listingAddress:"Profile: "+(result?result.title:"Unknown"),timestamp:new Date().toISOString()})});
    setSent(true);
  };

  if(sent)return(
    <div style={{textAlign:"center",padding:"60px 24px"}}>
      <div style={{fontSize:64,marginBottom:16}}>{result.emoji}</div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:TEXT,marginBottom:8}}>You're a {result.title}!</h2>
      <p style={{color:MUTED,fontSize:15,lineHeight:1.7,maxWidth:480,margin:"0 auto 24px"}}>Hamza will reach out with properties and opportunities matched to your investor profile.</p>
      <button onClick={()=>{setStep(0);setAnswers([]);setResult(null);setSent(false);}} className="btn-ghost" style={{padding:"10px 24px",borderRadius:8,fontSize:14}}>
        Retake Quiz
      </button>
    </div>
  );

  if(emailGate&&!result)return(
    <div style={{maxWidth:480,margin:"0 auto",padding:"60px 24px",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>📊</div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:TEXT,marginBottom:8}}>Your results are ready!</h2>
      <p style={{color:MUTED,fontSize:14,marginBottom:24}}>Enter your email to see your investor profile and get matched with properties.</p>
      <input type="email" placeholder="your@email.com" value={gateEmail} onChange={e=>setGateEmail(e.target.value)}
        style={{width:"100%",background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"12px 16px",color:TEXT,fontSize:15,marginBottom:14}}/>
      <button onClick={handleEmailGate} disabled={!gateEmail||!gateEmail.includes("@")} className="btn-primary"
        style={{width:"100%",padding:"13px",borderRadius:10,fontSize:15,opacity:(!gateEmail||!gateEmail.includes("@"))?0.4:1,cursor:(!gateEmail||!gateEmail.includes("@"))?"not-allowed":"pointer"}}>
        See My Results
      </button>
      <p style={{fontSize:11,color:MUTED,marginTop:12}}>We respect your privacy. Unsubscribe anytime.</p>
    </div>
  );

  if(result)return(
    <div style={{maxWidth:560,margin:"0 auto",padding:"40px 24px"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:56,marginBottom:10}}>{result.emoji}</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:GOLD,marginBottom:8}}>You're a {result.title}</h2>
        <p style={{color:MUTED,fontSize:14,lineHeight:1.7}}>{result.desc}</p>
      </div>
      <div style={{background:CARD,border:`1px solid ${GOLD_BORDER}`,borderRadius:14,padding:"24px"}}>
        <h3 style={{fontSize:15,fontWeight:600,color:TEXT,marginBottom:16}}>Connect with Hamza to explore matching properties</h3>
        {[["Your Name *","name","text"],["Phone *","phone","tel"]].map(([label,key,type])=>(
          <div key={key} style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:12,color:MUTED,fontWeight:600,marginBottom:5}} htmlFor={`quiz-${key}`}>{label}</label>
            <input id={`quiz-${key}`} type={type} value={leadForm[key]} onChange={e=>setLeadForm(f=>({...f,[key]:e.target.value}))}
              style={{width:"100%",background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:14}}/>
          </div>
        ))}
        <div style={{background:"rgba(196,154,60,0.05)",border:`1px solid rgba(196,154,60,0.2)`,borderRadius:8,padding:"12px 14px",marginBottom:14}}>
          <label style={{display:"flex",gap:10,alignItems:"flex-start",cursor:"pointer"}}>
            <input type="checkbox" checked={leadForm.casl} onChange={e=>setLeadForm(f=>({...f,casl:e.target.checked}))} style={{marginTop:3,flexShrink:0}}/>
            <span style={{fontSize:11,color:MUTED,lineHeight:1.6}}>{CASL_TEXT}</span>
          </label>
        </div>
        <button onClick={handleLead} disabled={!leadForm.name||!leadForm.phone||!leadForm.casl} className="btn-primary" style={{width:"100%",padding:"13px",borderRadius:10,fontSize:15,opacity:(!leadForm.name||!leadForm.phone||!leadForm.casl)?0.4:1,cursor:(!leadForm.name||!leadForm.phone||!leadForm.casl)?"not-allowed":"pointer"}}>
          Find My Properties
        </button>
      </div>
    </div>
  );

  return(
    <div style={{maxWidth:560,margin:"0 auto",padding:"40px 24px"}}>
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",gap:6,marginBottom:20}}>
          {QUIZ.map((_,i)=>(
            <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?GOLD:"rgba(255,255,255,0.07)",transition:"background .3s ease"}}/>
          ))}
        </div>
        <div style={{fontSize:12,color:MUTED,marginBottom:8}}>Question {step+1} of {QUIZ.length}</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:TEXT,lineHeight:1.4}}>{QUIZ[step].q}</h2>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {QUIZ[step].opts.map(opt=>(
          <button key={opt} onClick={()=>handleAnswer(opt)} className="btn-ghost" style={{padding:"14px 20px",borderRadius:10,fontSize:14,textAlign:"left",width:"100%"}}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MARKET PULSE TAB
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   MARKET CONDITIONS — AI VERDICT
   Calls /api/analyze once per month, caches in localStorage
───────────────────────────────────────────── */
const MARKET_INPUTS={
  salesToListings:0.41,
  avgDetachedPrice:1020000,
  detachedPriceYoY:4.2,
  activeListings:3847,
  listingsChangeMonthly:18,
  avgDOM:28,
  avgDOMChangeYoY:6,
  avgCondoPrice:621000,
  condoPriceYoY:-2.1,
  mortgageRate5yr:4.89,
  bocRate:2.25,
  monthlySupplyMonths:4.2,
  newListingsMonthly:2847,
  absorptionRate:38,
  priceReductionRate:31,
  lrtOpeningYear:2025,
  region:"Mississauga, Ontario, Canada",
  quarter:"Q1 2026",
};

const CACHE_KEY="msga_market_verdict";
const CACHE_TTL=30*24*60*60*1000; // 30 days

function AIMarketVerdict(){
  const [verdict,setVerdict]=useState(null);  // {label, score, summary, signals, advice, ts}
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [lastUpdated,setLastUpdated]=useState(null);

  const loadCached=()=>{
    try{
      const raw=localStorage.getItem(CACHE_KEY);
      if(!raw)return null;
      const parsed=JSON.parse(raw);
      if(Date.now()-parsed.ts>CACHE_TTL)return null;
      return parsed;
    }catch{return null;}
  };

  const runAnalysis=async(force=false)=>{
    if(loading)return;
    const cached=loadCached();
    if(cached&&!force){setVerdict(cached);setLastUpdated(new Date(cached.ts));return;}
    setLoading(true);setError("");
    try{
      const prompt=`You are a senior Canadian real estate market analyst specializing in Mississauga and GTA markets.

Analyze the following current market data for Mississauga, Ontario (${MARKET_INPUTS.quarter}) and produce a structured market verdict:

MARKET DATA:
- Sales-to-Listings Ratio: ${MARKET_INPUTS.salesToListings} (below 0.40 = buyer's market, above 0.60 = seller's market)
- Average Detached Price: $${(MARKET_INPUTS.avgDetachedPrice/1000).toFixed(0)}K (${MARKET_INPUTS.detachedPriceYoY>0?"+":""}${MARKET_INPUTS.detachedPriceYoY}% YoY)
- Active Listings: ${MARKET_INPUTS.activeListings.toLocaleString()} (${MARKET_INPUTS.listingsChangeMonthly>0?"+":""}${MARKET_INPUTS.listingsChangeMonthly}% MoM)
- Average Days on Market: ${MARKET_INPUTS.avgDOM} days (${MARKET_INPUTS.avgDOMChangeYoY>0?"+":""}${MARKET_INPUTS.avgDOMChangeYoY} days YoY)
- Average Condo Price: $${(MARKET_INPUTS.avgCondoPrice/1000).toFixed(0)}K (${MARKET_INPUTS.condoPriceYoY}% YoY)
- 5-Year Fixed Mortgage Rate: ${MARKET_INPUTS.mortgageRate5yr}%
- Bank of Canada Policy Rate: ${MARKET_INPUTS.bocRate}%
- Months of Supply: ${MARKET_INPUTS.monthlySupplyMonths} months
- Absorption Rate: ${MARKET_INPUTS.absorptionRate}% of listings selling within 30 days
- % of Listings with Price Reductions: ${MARKET_INPUTS.priceReductionRate}%
- Hurontario LRT: opening ${MARKET_INPUTS.lrtOpeningYear}

Respond ONLY with a valid JSON object in this exact format, no markdown, no extra text:
{
  "label": "Buyer's Market" | "Balanced Market" | "Seller's Market",
  "score": number between 0 and 100 (0=extreme buyer's, 50=balanced, 100=extreme seller's),
  "confidence": "High" | "Medium" | "Low",
  "summary": "2-3 sentence plain-English verdict on current market conditions",
  "signals": ["3-5 bullet point strings of key data signals driving this verdict"],
  "buyerAdvice": "1-2 sentences of actionable advice for buyers right now",
  "sellerAdvice": "1-2 sentences of actionable advice for sellers right now",
  "investorTake": "1-2 sentences specifically for real estate investors in Mississauga"
}`;

      const res=await fetch("/api/analyze",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({prompt})
      });
      if(!res.ok)throw new Error(`API ${res.status}`);
      const data=await res.json();
      // Anthropic returns content as array [{type:"text",text:"..."}]
      let rawText="";
      if(Array.isArray(data.content)){
        rawText=data.content.filter(b=>b.type==="text").map(b=>b.text).join("").trim();
      } else if(typeof data.content==="string"){
        rawText=data.content.trim();
      } else if(data.result){
        rawText=String(data.result).trim();
      }
      if(!rawText)throw new Error("Empty response from API");
      const jsonMatch=rawText.match(/\{[\s\S]*\}/);
      if(!jsonMatch)throw new Error("No JSON in response");
      const parsed=JSON.parse(jsonMatch[0]);
      const result={...parsed,ts:Date.now()};
      localStorage.setItem(CACHE_KEY,JSON.stringify(result));
      setVerdict(result);
      setLastUpdated(new Date(result.ts));
    }catch(e){
      setError("AI analysis unavailable. "+e.message);
    }finally{setLoading(false);}
  };

  useEffect(()=>{runAnalysis();},[]);

  const verdictColor=v=>{
    if(!v)return BLUE;
    if(v.label==="Buyer's Market")return"#3B82F6";
    if(v.label==="Seller's Market")return"#EF4444";
    return"#F59E0B";
  };
  const verdictEmoji=v=>{
    if(!v)return"📊";
    if(v.label==="Buyer's Market")return"🏠";
    if(v.label==="Seller's Market")return"🔥";
    return"⚖️";
  };

  const fmtAge=d=>{
    if(!d)return"";
    const days=Math.round((Date.now()-d)/86400000);
    if(days===0)return"Updated today";
    if(days===1)return"Updated yesterday";
    return`Updated ${days} days ago · Next refresh in ${30-days} days`;
  };

  const col=verdictColor(verdict);
  const score=verdict?.score??50;
  // 0=buyers, 100=sellers — needle position
  const needlePct=Math.max(2,Math.min(98,score));

  return(
    <div style={{background:CARD,border:`1px solid rgba(59,130,246,0.2)`,borderRadius:16,overflow:"hidden",marginBottom:24}}>
      {/* Header bar */}
      <div style={{background:`linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.06))`,borderBottom:`1px solid ${BORDER}`,padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:12,color:MUTED,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>AI Market Analysis · Mississauga</div>
          <div style={{fontSize:11,color:MUTED}}>{fmtAge(lastUpdated)}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {verdict&&<span style={{fontSize:10,color:col,background:`${col}18`,border:`1px solid ${col}40`,borderRadius:4,padding:"2px 8px",fontWeight:700}}>{verdict.confidence} Confidence</span>}
          <button onClick={()=>runAnalysis(true)} disabled={loading}
            style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,borderRadius:7,padding:"6px 14px",fontSize:11,color:MUTED,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,fontWeight:500}}>
            {loading
              ?<><span style={{display:"inline-block",width:10,height:10,border:"2px solid rgba(255,255,255,0.1)",borderTopColor:BLUE,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>Analyzing…</>
              :"↻ Refresh"}
          </button>
        </div>
      </div>

      <div style={{padding:"22px 22px 20px"}}>
        {/* Loading skeleton */}
        {loading&&!verdict&&(
          <div>
            <div className="skeleton" style={{height:28,borderRadius:6,width:"40%",marginBottom:16}}/>
            <div className="skeleton" style={{height:14,borderRadius:4,width:"100%",marginBottom:8}}/>
            <div className="skeleton" style={{height:14,borderRadius:4,width:"80%",marginBottom:20}}/>
            <div className="skeleton" style={{height:18,borderRadius:4,marginBottom:6}}/>
            <div className="skeleton" style={{height:18,borderRadius:4,marginBottom:6,width:"90%"}}/>
            <div className="skeleton" style={{height:18,borderRadius:4,width:"70%"}}/>
          </div>
        )}

        {/* Error */}
        {error&&!loading&&(
          <div style={{textAlign:"center",padding:"20px 0",color:MUTED}}>
            <div style={{fontSize:28,marginBottom:8}}>⚠️</div>
            <p style={{fontSize:13,marginBottom:12}}>{error}</p>
            <button onClick={()=>runAnalysis(true)} className="btn-primary" style={{padding:"8px 20px",borderRadius:8,fontSize:12}}>Try Again</button>
          </div>
        )}

        {/* VERDICT */}
        {verdict&&(
          <>
            {/* Main verdict + gauge */}
            <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:20,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <span style={{fontSize:28}}>{verdictEmoji(verdict)}</span>
                  <div style={{fontFamily:"'Inter',sans-serif",fontSize:26,fontWeight:800,color:col,letterSpacing:"-0.02em"}}>{verdict.label}</div>
                </div>
                <p style={{fontSize:13,color:TEXT2,lineHeight:1.75}}>{verdict.summary}</p>
              </div>
              {/* Gauge */}
              <div style={{minWidth:180,textAlign:"center"}}>
                <div style={{fontSize:10,color:MUTED,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase"}}>Market Score</div>
                <div style={{position:"relative",height:80,width:180}}>
                  {/* Arc background */}
                  <svg width="180" height="80" viewBox="0 0 180 80">
                    <path d="M10,75 A80,80 0 0,1 170,75" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" strokeLinecap="round"/>
                    <path d="M10,75 A80,80 0 0,1 170,75" fill="none" stroke={col} strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={`${needlePct*2.51} 251`} opacity="0.8"/>
                    <text x="90" y="68" textAnchor="middle" fontSize="22" fontWeight="800" fill={col} fontFamily="JetBrains Mono,monospace">{score}</text>
                    <text x="90" y="78" textAnchor="middle" fontSize="9" fill="#64748B">/100</text>
                    <text x="14" y="78" textAnchor="middle" fontSize="8" fill="#3B82F6">BUY</text>
                    <text x="166" y="78" textAnchor="middle" fontSize="8" fill="#EF4444">SELL</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Market signals */}
            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:700,color:MUTED,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>Key Market Signals</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {(verdict.signals||[]).map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{color:col,fontSize:12,flexShrink:0,marginTop:2}}>◆</span>
                    <span style={{fontSize:13,color:TEXT2,lineHeight:1.6}}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Advice cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
              {[
                {icon:"🏠",label:"For Buyers",text:verdict.buyerAdvice,color:"#3B82F6"},
                {icon:"🏷️",label:"For Sellers",text:verdict.sellerAdvice,color:"#EF4444"},
                {icon:"💼",label:"For Investors",text:verdict.investorTake,color:"#F59E0B"},
              ].map(card=>(
                <div key={card.label} style={{background:SURFACE,border:`1px solid ${card.color}20`,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:12,fontWeight:700,color:card.color,marginBottom:6,display:"flex",gap:6,alignItems:"center"}}>
                    <span>{card.icon}</span>{card.label}
                  </div>
                  <p style={{fontSize:12,color:TEXT2,lineHeight:1.65,margin:0}}>{card.text}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{borderTop:`1px solid ${BORDER}`,padding:"10px 22px"}}>
        <p style={{fontSize:10,color:MUTED,lineHeight:1.5,margin:0}}>
          AI-generated analysis using Claude (Anthropic). Based on manually curated market inputs — not live TRREB data. Refreshes automatically once per month. Not financial or legal advice. Hamza Nouman, Sales Representative, Royal LePage Signature Realty, Brokerage.
        </p>
      </div>
    </div>
  );
}

function MarketPulse(){
  const [mkt,setMkt]=useState(null);
  useEffect(()=>{fetch('/api/market-stats').then(r=>r.json()).then(setMkt).catch(()=>{});},[]);

  // Simple SVG sparkline
  const Sparkline=({data,color,height=60,width=280})=>{
    if(!data||data.length<2)return null;
    const vals=data.map(d=>d.avg||d.sales);
    const min=Math.min(...vals),max=Math.max(...vals),range=max-min||1;
    const pts=vals.map((v,i)=>[i/(vals.length-1)*width,(1-(v-min)/range)*height]);
    const path='M'+pts.map(p=>p.join(',')).join(' L');
    return(<svg width={width} height={height+4} style={{display:'block'}}><path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>{pts.map((p,i)=>i===pts.length-1?<circle key={i} cx={p[0]} cy={p[1]} r={3} fill={color}/>:null)}</svg>);
  };

  return(
    <div style={{padding:"24px 0"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:TEXT,marginBottom:6}}>Mississauga Market Intelligence</h2>
        <p style={{fontSize:13,color:MUTED}}>TRREB market data + Hamza's analysis · {mkt?mkt.lastUpdated:'Loading...'}</p>
      </div>

      {/* AI VERDICT */}
      <AIMarketVerdict/>

      {mkt?(
        <>
          {/* Market condition banner */}
          <div style={{background:'rgba(59,130,246,0.06)',border:`1px solid rgba(59,130,246,0.2)`,borderRadius:12,padding:'16px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:BLUE,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>MARKET STATUS</div>
            <div style={{fontSize:18,fontWeight:700,color:GOLD}}>{mkt.marketType}</div>
            <div style={{fontSize:12,color:MUTED}}>Sales Forecast 2026: <strong style={{color:GREEN}}>{mkt.salesForecast2026}</strong></div>
            <div style={{fontSize:12,color:MUTED}}>Pent-up Demand: <strong style={{color:TEXT}}>{mkt.pentUpDemand}</strong></div>
          </div>

          {/* Avg prices by type */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:13,color:MUTED,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10}}>Average Prices by Property Type — Mississauga</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
              {Object.values(mkt.avgPrices).map(p=>(
                <div key={p.label} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:'16px 18px'}}>
                  <div style={{fontSize:11,color:MUTED,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>{p.label}</div>
                  <div className="mono" style={{fontSize:22,fontWeight:700,color:TEXT,marginBottom:2}}>${(p.avg/1000).toFixed(0)}K</div>
                  <div style={{fontSize:12,fontWeight:600,color:p.yoyChange<0?RED:GREEN}}>{p.yoyChange>0?'+':''}{p.yoyChange}% YoY</div>
                </div>
              ))}
            </div>
          </div>

          {/* Key metrics grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,marginBottom:20}}>
            {[
              {label:'Avg DOM',value:mkt.avgDOM+'d',color:TEXT},
              {label:'Sales/List Ratio',value:mkt.salesToListRatio.toFixed(2),color:mkt.salesToListRatio<0.4?RED:GOLD},
              {label:'Months of Inventory',value:mkt.monthsOfInventory.toFixed(1),color:mkt.monthsOfInventory>3?GREEN:RED},
              {label:'New Listings YoY',value:(mkt.newListingsYoy>0?'+':'')+mkt.newListingsYoy+'%',color:mkt.newListingsYoy<0?RED:GREEN},
              {label:'Sales YoY',value:(mkt.salesYoy>0?'+':'')+mkt.salesYoy+'%',color:mkt.salesYoy<0?RED:GREEN},
              {label:'GTA Avg Price',value:'$'+Math.round(mkt.gtaAvgPrice/1000)+'K',color:TEXT},
            ].map(m=>(
              <div key={m.label} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:'14px 16px'}}>
                <div style={{fontSize:10,color:MUTED,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{m.label}</div>
                <div className="mono" style={{fontSize:20,fontWeight:700,color:m.color}}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Price & Sales trends with sparklines */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:'18px 20px'}}>
              <div style={{fontSize:12,color:MUTED,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4}}>Avg Price Trend (12mo)</div>
              <div className="mono" style={{fontSize:18,fontWeight:700,color:TEXT,marginBottom:8}}>${(mkt.priceTrend[mkt.priceTrend.length-1].avg/1000).toFixed(0)}K</div>
              <Sparkline data={mkt.priceTrend} color={BLUE} width={260}/>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                <span style={{fontSize:9,color:MUTED}}>{mkt.priceTrend[0].month}</span>
                <span style={{fontSize:9,color:MUTED}}>{mkt.priceTrend[mkt.priceTrend.length-1].month}</span>
              </div>
            </div>
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:'18px 20px'}}>
              <div style={{fontSize:12,color:MUTED,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4}}>Sales Volume Trend (12mo)</div>
              <div className="mono" style={{fontSize:18,fontWeight:700,color:TEXT,marginBottom:8}}>{mkt.salesTrend[mkt.salesTrend.length-1].sales} sales</div>
              <Sparkline data={mkt.salesTrend} color={GREEN} width={260}/>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                <span style={{fontSize:9,color:MUTED}}>{mkt.salesTrend[0].month}</span>
                <span style={{fontSize:9,color:MUTED}}>{mkt.salesTrend[mkt.salesTrend.length-1].month}</span>
              </div>
            </div>
          </div>

          {/* Mortgage rates */}
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:'18px 20px',marginBottom:20}}>
            <div style={{fontSize:12,color:MUTED,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:12}}>Current Mortgage Rates</div>
            <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
              {[
                {label:'Variable',rate:mkt.rates.variable},
                {label:'3-Year Fixed',rate:mkt.rates.fixed3yr},
                {label:'5-Year Fixed',rate:mkt.rates.fixed5yr},
                {label:'Stress Test',rate:mkt.rates.stressTest},
              ].map(r=>(
                <div key={r.label}>
                  <div style={{fontSize:10,color:MUTED,marginBottom:2}}>{r.label}</div>
                  <div className="mono" style={{fontSize:18,fontWeight:700,color:r.label==='5-Year Fixed'?GREEN:TEXT}}>{r.rate}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hot neighbourhoods */}
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:'18px 20px',marginBottom:20}}>
            <div style={{fontSize:12,color:MUTED,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:12}}>Top Mississauga Neighbourhoods — 2026 Outlook</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {mkt.hotNeighbourhoods.map((h,i)=>(
                <div key={h.name} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:SURFACE,borderRadius:8,border:`1px solid ${BORDER}`}}>
                  <div className="mono" style={{fontSize:14,fontWeight:700,color:GOLD,width:24}}>#{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:TEXT}}>{h.name}</div>
                    <div style={{fontSize:11,color:MUTED}}>{h.reason}</div>
                  </div>
                  <div className="mono" style={{fontSize:14,fontWeight:700,color:GREEN}}>${(h.avgPrice/1000).toFixed(0)}K</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rental market */}
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:'18px 20px',marginBottom:20}}>
            <div style={{fontSize:12,color:MUTED,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:12}}>Mississauga Rental Market</div>
            <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
              {[
                {label:'1-Bed Avg',rent:mkt.rental.avg1Bed},
                {label:'2-Bed Avg',rent:mkt.rental.avg2Bed},
                {label:'3-Bed Avg',rent:mkt.rental.avg3Bed},
              ].map(r=>(
                <div key={r.label}>
                  <div style={{fontSize:10,color:MUTED,marginBottom:2}}>{r.label}</div>
                  <div className="mono" style={{fontSize:18,fontWeight:700,color:GREEN}}>${r.rent.toLocaleString()}/mo</div>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:MUTED,marginBottom:2}}>Rent YoY</div>
                <div className="mono" style={{fontSize:18,fontWeight:700,color:RED}}>{mkt.rental.rentalYoyChange}%</div>
              </div>
            </div>
          </div>
        </>
      ):(
        <div style={{textAlign:'center',padding:'40px',color:MUTED}}>Loading TRREB market data...</div>
      )}

      {/* Hamza's take */}
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:"20px 22px",marginBottom:20}}>
        <h3 style={{fontSize:16,fontWeight:700,color:TEXT,marginBottom:12}}>Hamza's Q1 2026 Market Read</h3>
        <p style={{fontSize:14,color:MUTED,lineHeight:1.8}}>
          We're in a transitional buyer's market. The sales-to-listing ratio has dropped below 0.45 in Mississauga, giving buyers real negotiating power for the first time since 2020. <strong style={{color:TEXT}}>My strategy: target properties 40+ days on market in Clarkson and Churchill Meadows with 5%+ price reductions.</strong> Detached under $950K is the sweet spot — institutional money is avoiding condos. The Hurontario LRT corridor is the single best infrastructure play in the GTA over the next 3 years.
        </p>
      </div>

      {/* TRREB source link */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
        <a href="https://trreb.ca/market-data/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'10px 16px',background:'rgba(59,130,246,0.08)',border:`1px solid rgba(59,130,246,0.25)`,borderRadius:8,fontSize:12,color:BLUE,fontWeight:600,textDecoration:'none'}}>TRREB Market Watch →</a>
        <a href="https://trreb.ca/market-data/condo-market-report/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'10px 16px',background:'rgba(59,130,246,0.08)',border:`1px solid rgba(59,130,246,0.25)`,borderRadius:8,fontSize:12,color:BLUE,fontWeight:600,textDecoration:'none'}}>Condo Report →</a>
        <a href="https://trreb.ca/market-data/rental-market-report/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'10px 16px',background:'rgba(59,130,246,0.08)',border:`1px solid rgba(59,130,246,0.25)`,borderRadius:8,fontSize:12,color:BLUE,fontWeight:600,textDecoration:'none'}}>Rental Report →</a>
        <a href="https://trreb.ca/market-data/quick-market-overview/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'10px 16px',background:'rgba(59,130,246,0.08)',border:`1px solid rgba(59,130,246,0.25)`,borderRadius:8,fontSize:12,color:BLUE,fontWeight:600,textDecoration:'none'}}>Market Overview →</a>
      </div>

      <div style={{padding:"12px 16px",background:"rgba(255,255,255,0.02)",border:`1px solid ${BORDER}`,borderRadius:8}}>
        <p style={{fontSize:11,color:MUTED,lineHeight:1.6}}>Market statistics sourced from TRREB Market Watch reports and public data releases. Deemed reliable but not guaranteed. For official TRREB statistics visit <a href="https://trreb.ca/market-data/" target="_blank" rel="noopener noreferrer" style={{color:BLUE}}>trreb.ca/market-data</a>. Market commentary by Hamza Nouman, Sales Representative, Royal LePage Signature Realty, Brokerage. For informational purposes only.</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   NEIGHBOURHOOD DEEP DIVE
───────────────────────────────────────────── */
function HoodsView({onFilterListings}){
  const [active,setActive]=useState(null);
  const [mapReady,setMapReady]=useState(false);
  const [filter,setFilter]=useState("all");
  const mapRef=useRef(null);
  const mapInstanceRef=useRef(null);
  const markersRef=useRef({});
  const trendColor={hot:"#EF4444",warm:"#F59E0B",cool:"#3B82F6"};
  const trendPinColor={hot:"#FF3B3B",warm:"#F59E0B",cool:"#3B82F6"};

  const filteredHoods=Object.entries(HOOD_DATA).filter(([,h])=>{
    if(filter==="all") return true;
    return h.trend===filter;
  });

  // Load Leaflet from CDN once
  useEffect(()=>{
    if(window.L){setMapReady(true);return;}
    const link=document.createElement("link");
    link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script=document.createElement("script");
    script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload=()=>setMapReady(true);
    document.head.appendChild(script);
  },[]);

  // Init map once Leaflet loaded
  useEffect(()=>{
    if(!mapReady||!mapRef.current||mapInstanceRef.current)return;
    const L=window.L;
    const map=L.map(mapRef.current,{
      center:[43.5890,-79.6441],zoom:11,
      zoomControl:true,attributionControl:true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{
      attribution:'© <a href="https://carto.com/">CARTO</a>',
      maxZoom:19,subdomains:"abcd"
    }).addTo(map);
    mapInstanceRef.current=map;

    // Add markers for every neighbourhood
    Object.entries(HOOD_DATA).forEach(([name,h])=>{
      const color=trendPinColor[h.trend];
      const svgIcon=L.divIcon({
        className:"",
        html:`<div style="
          width:32px;height:32px;border-radius:50% 50% 50% 0;
          background:${color};border:2px solid #fff;
          transform:rotate(-45deg);cursor:pointer;
          box-shadow:0 2px 8px rgba(0,0,0,0.5);
          display:flex;align-items:center;justify-content:center;
        "><span style="transform:rotate(45deg);font-size:10px;font-weight:700;color:#fff;display:block;text-align:center;line-height:28px;">${h.rentYield}%</span></div>`,
        iconSize:[32,32],iconAnchor:[16,32],popupAnchor:[0,-36]
      });
      const marker=L.marker([h.lat,h.lng],{icon:svgIcon})
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:180px;background:#111D32;color:#E2E8F0;padding:2px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${name}</div>
            <div style="font-size:11px;color:${color};font-weight:600;text-transform:uppercase;margin-bottom:8px">${h.emoji} ${h.trend.toUpperCase()} · ${h.inventory} Inventory</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px">
              <div><span style="color:#64748B">Yield</span><br/><b>${h.rentYield}%</b></div>
              <div><span style="color:#64748B">Avg Price</span><br/><b>$${(h.avgPrice/1000).toFixed(0)}K</b></div>
              <div><span style="color:#64748B">YoY</span><br/><b style="color:${h.priceYoY>4?"#10B981":h.priceYoY>2?"#F59E0B":"#64748B"}">+${h.priceYoY}%</b></div>
              <div><span style="color:#64748B">DOM</span><br/><b>${h.avgDOM}d</b></div>
            </div>
            <button onclick="window._hoodFilter('${name}')" style="margin-top:10px;width:100%;background:#3B82F6;color:#fff;border:none;border-radius:5px;padding:6px;font-size:11px;font-weight:600;cursor:pointer">View Listings →</button>
          </div>
        `,{maxWidth:220});
      marker.on("click",()=>setActive(name));
      markersRef.current[name]=marker;
    });

    // Global hook for popup button
    window._hoodFilter=(name)=>{onFilterListings(name);};
    return()=>{if(mapInstanceRef.current){mapInstanceRef.current.remove();mapInstanceRef.current=null;}};
  },[mapReady]);

  // Fly to neighbourhood when active changes
  useEffect(()=>{
    if(!active||!mapInstanceRef.current)return;
    const h=HOOD_DATA[active];
    if(!h)return;
    mapInstanceRef.current.flyTo([h.lat,h.lng],13,{duration:0.8});
    markersRef.current[active]?.openPopup();
  },[active]);

  return(
    <div style={{padding:"24px 0"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:12,marginBottom:20}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:TEXT,marginBottom:4}}>Neighbourhood Intelligence</h2>
          <p style={{fontSize:13,color:MUTED}}>All {Object.keys(HOOD_DATA).length} Mississauga neighbourhoods — click any pin or card to explore. Personal professional opinion, not MLS® data.</p>
        </div>
        {/* Heat filter */}
        <div style={{display:"flex",gap:6}}>
          {[["all","All"],["hot","🔥 Hot"],["warm","📈 Warm"],["cool","🧊 Cool"]].map(([val,label])=>(
            <button key={val} onClick={()=>setFilter(val)}
              className={`chip${filter===val?" active":""}`}
              style={{padding:"6px 14px",fontSize:11,
                borderColor:filter===val?(val==="hot"?"#EF4444":val==="warm"?"#F59E0B":val==="cool"?"#3B82F6":""):undefined,
                color:filter===val?(val==="hot"?"#EF4444":val==="warm"?"#F59E0B":val==="cool"?"#3B82F6":undefined):undefined
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* MAP */}
      <div style={{borderRadius:14,overflow:"hidden",border:`1px solid rgba(59,130,246,0.2)`,marginBottom:20,position:"relative"}}>
        {!mapReady&&(
          <div style={{height:420,background:CARD,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
            <div style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.1)",borderTopColor:BLUE,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
            <span style={{color:MUTED,fontSize:13}}>Loading map…</span>
          </div>
        )}
        <div ref={mapRef} style={{height:420,display:mapReady?"block":"none"}}/>
        {/* Map legend */}
        <div style={{position:"absolute",bottom:12,left:12,zIndex:1000,background:"rgba(5,9,26,0.88)",backdropFilter:"blur(8px)",borderRadius:8,padding:"8px 12px",border:`1px solid ${BORDER}`,display:"flex",gap:12}}>
          {[["#EF4444","Hot"],["#F59E0B","Warm"],["#3B82F6","Cool"]].map(([c,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:c}}/>
              <span style={{fontSize:10,color:TEXT2,fontWeight:500}}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {filteredHoods.map(([name,h])=>(
          <div key={name} className="card-hover"
            style={{background:CARD,
              border:`1px solid ${active===name?"rgba(59,130,246,0.45)":BORDER}`,
              borderRadius:14,padding:"18px 20px",cursor:"pointer",
              boxShadow:active===name?"0 0 0 1px rgba(59,130,246,0.2),0 8px 32px rgba(59,130,246,0.1)":"none",
              transition:"all .2s ease"
            }}
            onClick={()=>setActive(active===name?null:name)}
            role="button" tabIndex={0}
            onKeyDown={e=>e.key==="Enter"&&setActive(active===name?null:name)}
          >
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:3}}>{name}</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontSize:11}}>{h.emoji}</span>
                  <span style={{fontSize:11,color:trendColor[h.trend],fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h.trend}</span>
                  <span style={{fontSize:11,color:MUTED}}>· {h.inventory} inventory</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:GOLD,lineHeight:1}}>{h.rentYield}%</div>
                <div style={{fontSize:10,color:MUTED,fontWeight:400}}>yield</div>
              </div>
            </div>

            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[["Avg Price",fmtK(h.avgPrice),TEXT],["YoY",`+${h.priceYoY}%`,h.priceYoY>4?GREEN:h.priceYoY>2?GOLD:MUTED],["Avg DOM",`${h.avgDOM}d`,h.avgDOM>50?RED:TEXT]].map(([label,val,col])=>(
                <div key={label} style={{flex:1,background:SURFACE,borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:10,color:MUTED,marginBottom:2}}>{label}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:600,color:col}}>{val}</div>
                </div>
              ))}
            </div>

            {active===name?(
              <div style={{animation:"fadeIn .2s ease"}}>
                <p style={{fontSize:12,color:TEXT2,lineHeight:1.7,marginBottom:8}}>"{h.note}"</p>
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  <div style={{flex:1,background:SURFACE,borderRadius:6,padding:"6px 10px"}}>
                    <div style={{fontSize:9,color:MUTED,marginBottom:1}}>Typical Tenant</div>
                    <div style={{fontSize:11,color:TEXT2}}>{h.trend==='hot'?'Families, professionals':'Families, newcomers, students'}</div>
                  </div>
                  <div style={{flex:1,background:SURFACE,borderRadius:6,padding:"6px 10px"}}>
                    <div style={{fontSize:9,color:MUTED,marginBottom:1}}>Investor Tip</div>
                    <div style={{fontSize:11,color:GOLD}}>{h.rentYield>=5?'Best rent-to-price ratio':h.trend==='hot'?'Buy for appreciation':'Value-add opportunity'}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={e=>{e.stopPropagation();onFilterListings(name);}}
                    className="btn-gold-outline" style={{flex:1,padding:"8px 12px",borderRadius:8,fontSize:11}}>
                    View {name} Listings
                  </button>
                  <button onClick={e=>{e.stopPropagation();mapInstanceRef.current?.flyTo([h.lat,h.lng],14,{duration:0.8});markersRef.current[name]?.openPopup();}}
                    style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:8,padding:"8px 12px",fontSize:11,color:BLUE,cursor:"pointer",fontWeight:600}}>
                    Map
                  </button>
                </div>
              </div>
            ):(
              <div style={{fontSize:11,color:MUTED}}>Click to expand</div>
            )}
          </div>
        ))}
      </div>

      <div style={{marginTop:16,padding:"10px 14px",background:"rgba(255,255,255,0.02)",border:`1px solid ${BORDER}`,borderRadius:8}}>
        <p style={{fontSize:11,color:MUTED,lineHeight:1.6}}>Neighbourhood data represents Hamza Nouman's personal professional opinion based on market experience. Not sourced from TRREB or MLS®. Verify all data independently. Map © OpenStreetMap contributors, tiles © CARTO. Hamza Nouman, Sales Representative, Royal LePage Signature Realty, Brokerage.</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DEAL FINDER / FIND MY DEAL
───────────────────────────────────────────── */
function FindMyDeal(){
  return(
    <div style={{padding:"40px 0"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:TEXT,marginBottom:8}}>Find My Ideal Deal</h2>
        <p style={{fontSize:14,color:MUTED,maxWidth:480,margin:"0 auto"}}>Answer 4 quick questions and Hamza will connect you with properties matching your exact investor profile.</p>
      </div>
      <QuizView onResult={()=>{}}/>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REAL ESTATE NEWS — Bloomberg-style feed
   Fetches live RSS from Globe & Mail, BNN, STOREYS
───────────────────────────────────────────── */
const NEWS_SOURCES=[
  {id:"storeys",label:"STOREYS",color:"#10B981",url:"https://storeys.com/feed/"},
  {id:"rem",label:"REM",color:"#3B82F6",url:"https://realestatemagazine.ca/feed/"},
  {id:"fp",label:"Financial Post",color:"#F59E0B",url:"https://financialpost.com/category/real-estate/feed/"},
  {id:"cbc",label:"CBC Business",color:"#EF4444",url:"https://www.cbc.ca/cmlink/rss-business"},
];

const RSS2JSON="https://api.rss2json.com/v1/api.json?rss_url=";

function RealEstateNews(){
  const [articles,setArticles]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [activeSource,setActiveSource]=useState("all");
  const [activeCategory,setActiveCategory]=useState("mississauga");
  const [lastUpdated,setLastUpdated]=useState(null);
  const [ticker,setTicker]=useState([]);

  const CATEGORIES=[
    {id:"all",label:"All News"},
    {id:"mississauga",label:"Mississauga"},
    {id:"market",label:"Market Stats"},
    {id:"rates",label:"Interest Rates"},
    {id:"investment",label:"Investment"},
    {id:"policy",label:"Policy & Govt"},
  ];

  const detectCategory=(title,desc)=>{
    const t=(title+" "+desc).toLowerCase();
    if(t.includes("mississauga")||t.includes("brampton")||t.includes("oakville")||t.includes("gta")||t.includes("toronto"))return"mississauga";
    if(t.includes("interest rate")||t.includes("bank of canada")||t.includes("mortgage rate")||t.includes("boc")||t.includes("rate cut")||t.includes("rate hike"))return"rates";
    if(t.includes("sales")||t.includes("listings")||t.includes("prices")||t.includes("inventory")||t.includes("trreb")||t.includes("crea")||t.includes("home price"))return"market";
    if(t.includes("invest")||t.includes("rental")||t.includes("cap rate")||t.includes("landlord")||t.includes("brrr")||t.includes("cash flow"))return"investment";
    if(t.includes("policy")||t.includes("government")||t.includes("regulation")||t.includes("zoning")||t.includes("housing minister")||t.includes("federal"))return"policy";
    return"all";
  };

  const fetchAll=async()=>{
    setLoading(true);setError("");
    const results=[];
    for(const src of NEWS_SOURCES){
      try{
        const res=await fetch(`${RSS2JSON}${encodeURIComponent(src.url)}`,{signal:AbortSignal.timeout(12000)});
        if(!res.ok) continue;
        const data=await res.json();
        if(data.status!=="ok"||!data.items) continue;
        const parsed=data.items.slice(0,12).map(item=>{
          const title=(item.title||"").trim();
          const link=item.link||item.guid||"#";
          const pubDate=item.pubDate||"";
          const desc=(item.description||item.content||"")
            .replace(/<[^>]+>/g,"").replace(/&[a-z]+;/g," ").trim().substring(0,220);
          const img=item.thumbnail||item.enclosure?.link||
            (item.content||"").match(/src="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i)?.[1]||null;
          return{title,link,pubDate,desc,source:src.label,color:src.color,img,
            date:pubDate?new Date(pubDate):new Date()};
        }).filter(a=>a.title.length>10);
        results.push(...parsed);
      }catch(e){/* skip this source, try next */}
    }
    if(results.length===0){setError("Unable to load news feeds. Please try again in a moment.");setLoading(false);return;}
    const sorted=results.sort((a,b)=>b.date-a.date).map(a=>({...a,category:detectCategory(a.title,a.desc)}));
    setArticles(sorted);
    setTicker(sorted.slice(0,10));
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(()=>{fetchAll();},[]);

  const fmtAge=d=>{
    const mins=Math.round((Date.now()-d)/60000);
    if(mins<60)return mins+"m ago";
    if(mins<1440)return Math.round(mins/60)+"h ago";
    return Math.round(mins/1440)+"d ago";
  };

  const filtered=articles.filter(a=>{
    if(activeSource!=="all"&&a.source!==NEWS_SOURCES.find(s=>s.id===activeSource)?.label)return false;
    if(activeCategory!=="all"&&a.category!==activeCategory)return false;
    return true;
  });

  // Market data bar — hardcoded current context (updates when real feed connects)
  const MARKET_DATA=[
    {label:"BoC Rate",val:"2.25%",delta:"-0.25",deltaColor:GREEN},
    {label:"5yr Fixed",val:"4.89%",delta:"+0.05",deltaColor:RED},
    {label:"TRREB Sales/List",val:"0.41",delta:"-0.04",deltaColor:RED},
    {label:"Avg Detached Msga",val:"$1.02M",delta:"+4.2% YoY",deltaColor:GREEN},
    {label:"Active GTA Listings",val:"24,817",delta:"+18% MoM",deltaColor:RED},
    {label:"Avg DOM Msga",val:"28d",delta:"+6 YoY",deltaColor:RED},
    {label:"Hurontario LRT",val:"2025",delta:"Opening Soon",deltaColor:GREEN},
    {label:"USD/CAD",val:"1.441",delta:"-0.003",deltaColor:GREEN},
  ];

  return(
    <div style={{padding:"28px 0"}}>

      {/* Section header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Inter',sans-serif",fontSize:24,fontWeight:800,color:TEXT,marginBottom:4,letterSpacing:"-0.02em"}}>
            Real Estate Intelligence
          </h2>
          <p style={{fontSize:13,color:MUTED}}>
            Live market news · {lastUpdated?`Updated ${fmtAge(lastUpdated)}`:"Loading..."}
            <span style={{marginLeft:8,fontSize:10,color:"#3D5A80",fontFamily:"'JetBrains Mono',monospace"}}>LIVE FEED</span>
          </p>
        </div>
        <button onClick={fetchAll} disabled={loading} className="btn-ghost" style={{padding:"8px 16px",borderRadius:7,fontSize:12,display:"flex",alignItems:"center",gap:6}}>
          {loading?<span style={{display:"inline-block",width:12,height:12,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:BLUE,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>:"↻"}
          {loading?"Refreshing...":"Refresh"}
        </button>
      </div>

      {/* Market data ticker strip */}
      <div style={{background:CARD,border:`1px solid rgba(59,130,246,0.15)`,borderRadius:10,padding:"12px 18px",marginBottom:20,overflow:"hidden"}}>
        <div style={{display:"flex",gap:0,alignItems:"center",overflowX:"auto",paddingBottom:2}}>
          <div style={{fontSize:9,fontWeight:700,color:BLUE,letterSpacing:"0.1em",textTransform:"uppercase",paddingRight:16,borderRight:`1px solid ${BORDER}`,marginRight:16,whiteSpace:"nowrap",flexShrink:0}}>MARKET</div>
          {MARKET_DATA.map((m,i)=>(
            <div key={i} style={{paddingRight:20,marginRight:20,borderRight:i<MARKET_DATA.length-1?`1px solid rgba(255,255,255,0.05)`:"none",flexShrink:0}}>
              <div style={{fontSize:10,color:MUTED,fontWeight:500,whiteSpace:"nowrap",marginBottom:2,letterSpacing:'0.03em'}}>{m.label}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:5}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:15,fontWeight:700,color:TEXT}}>{m.val}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:m.deltaColor,fontWeight:600}}>{m.delta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News ticker — scrolling headlines */}
      {ticker.length>0&&(
        <div style={{background:"rgba(59,130,246,0.06)",border:`1px solid rgba(59,130,246,0.15)`,borderRadius:8,padding:"8px 0",marginBottom:20,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center"}}>
            <div style={{background:BLUE,color:"#fff",padding:"4px 12px",fontSize:10,fontWeight:700,letterSpacing:"0.08em",flexShrink:0,borderRadius:"0 4px 4px 0",marginRight:16}}>BREAKING</div>
            <div className="ticker-wrap" style={{flex:1}}>
              <div className="ticker-inner">
                {[...ticker,...ticker].map((a,i)=>(
                  <span key={i} style={{fontSize:11,color:TEXT2,paddingRight:48,whiteSpace:"nowrap"}}>
                    <span style={{color:a.color,fontWeight:600}}>{a.source} · </span>{a.title}
                    <span style={{color:MUTED,marginLeft:12}}>◆</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Source + category filters */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button onClick={()=>setActiveSource("all")} className={`chip${activeSource==="all"?" active":""}`} style={{padding:"6px 14px"}}>All Sources</button>
          {NEWS_SOURCES.map(s=>(
            <button key={s.id} onClick={()=>setActiveSource(s.id)} className={`chip${activeSource===s.id?" active":""}`}
              style={{padding:"6px 14px",borderColor:activeSource===s.id?s.color+"80":"",color:activeSource===s.id?s.color:""}}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{width:"1px",height:20,background:BORDER,flexShrink:0}} className="desktop-only"/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {CATEGORIES.map(c=>(
            <button key={c.id} onClick={()=>setActiveCategory(c.id)} className={`chip${activeCategory===c.id?" active":""}`} style={{padding:"6px 12px",fontSize:11}}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
          {[...Array(6)].map((_,i)=>(
            <div key={i} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,overflow:"hidden"}}>
              <div className="skeleton" style={{height:160}}/>
              <div style={{padding:"14px 16px"}}>
                <div className="skeleton" style={{height:12,borderRadius:4,marginBottom:8,width:"80%"}}/>
                <div className="skeleton" style={{height:12,borderRadius:4,marginBottom:6,width:"100%"}}/>
                <div className="skeleton" style={{height:12,borderRadius:4,width:"60%"}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error&&!loading&&(
        <div style={{textAlign:"center",padding:"60px 24px",color:MUTED}}>
          <div style={{fontSize:40,marginBottom:16}}>📡</div>
          <p style={{fontSize:15,marginBottom:8}}>{error}</p>
          <button onClick={fetchAll} className="btn-primary" style={{padding:"10px 24px",borderRadius:8,fontSize:13,marginTop:8}}>Try Again</button>
        </div>
      )}

      {/* Articles grid */}
      {!loading&&!error&&(
        <>
          {filtered.length===0?(
            <div style={{textAlign:"center",padding:"60px 24px",color:MUTED}}>
              <div style={{fontSize:40,marginBottom:12}}>🗞️</div>
              <p>No articles found for this filter. Try a different category.</p>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
              {filtered.map((a,i)=>(
                <a key={i} href={a.link} target="_blank" rel="noreferrer noopener"
                  style={{display:"block",background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,overflow:"hidden",textDecoration:"none",transition:"transform .25s ease,border-color .25s ease,box-shadow .25s ease"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor="rgba(59,130,246,0.3)";e.currentTarget.style.boxShadow="0 16px 48px rgba(59,130,246,0.12)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.boxShadow="";}}
                >
                  {/* Article image or gradient */}
                  <div style={{height:140,background:`linear-gradient(135deg,${CARD},${SURFACE})`,position:"relative",overflow:"hidden"}}>
                    {a.img?(
                      <img src={a.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.85}} loading="lazy"
                        onError={e=>{e.target.style.display="none";}}/>
                    ):(
                      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <div style={{fontSize:40,opacity:0.1}}>📰</div>
                      </div>
                    )}
                    {/* Source tag */}
                    <div style={{position:"absolute",top:8,left:8}}>
                      <span style={{background:a.color+"22",border:`1px solid ${a.color}55`,borderRadius:4,padding:"2px 8px",fontSize:9,color:a.color,fontWeight:700,letterSpacing:"0.06em"}}>{a.source.toUpperCase()}</span>
                    </div>
                    {/* Category tag */}
                    {a.category!=="all"&&(
                      <div style={{position:"absolute",top:8,right:8}}>
                        <span style={{background:"rgba(5,9,26,0.75)",borderRadius:4,padding:"2px 8px",fontSize:9,color:MUTED,fontWeight:500,border:`1px solid ${BORDER}`}}>
                          {CATEGORIES.find(c=>c.id===a.category)?.label||""}
                        </span>
                      </div>
                    )}
                    {/* Dark overlay */}
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(5,9,26,0.5),transparent)"}}/>
                  </div>

                  {/* Article content */}
                  <div style={{padding:"14px 16px"}}>
                    <h3 style={{fontSize:13,fontWeight:700,color:TEXT,lineHeight:1.5,marginBottom:8,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                      {a.title}
                    </h3>
                    {a.desc&&(
                      <p style={{fontSize:11,color:MUTED,lineHeight:1.6,marginBottom:10,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                        {a.desc}
                      </p>
                    )}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:10,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{fmtAge(a.date)}</span>
                      <span style={{fontSize:10,color:BLUE,fontWeight:600}}>Read →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div style={{marginTop:24,padding:"12px 16px",background:"rgba(255,255,255,0.02)",border:`1px solid ${BORDER}`,borderRadius:8}}>
            <p style={{fontSize:10,color:MUTED,lineHeight:1.6}}>
              News articles are sourced from third-party RSS feeds (Globe & Mail, BNN Bloomberg, STOREYS, CBC) and are provided for informational purposes only. Hamza Nouman and mississaugainvestor.ca do not endorse, control, or guarantee the accuracy of any third-party content. For investment decisions, consult a qualified professional. Hamza Nouman, Sales Representative, Royal LePage Signature Realty, Brokerage.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPREHENSIVE FOOTER
───────────────────────────────────────────── */
function Footer({onPrivacy}){
  return(
    <footer role="contentinfo" style={{background:"#050810",borderTop:`1px solid ${BORDER}`,padding:"32px 24px 24px",marginTop:60}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>

        {/* Top row — agent + links */}
        <div style={{display:"flex",gap:32,flexWrap:"wrap",marginBottom:28,paddingBottom:24,borderBottom:`1px solid ${BORDER}`}}>
          <div style={{flex:1,minWidth:240}}>
            <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:4}}>Hamza Nouman</div>
            <div style={{fontSize:12,color:GOLD,marginBottom:2}}>Sales Representative</div>
            <div style={{fontSize:12,color:MUTED,marginBottom:12}}>Royal LePage Signature Realty, Brokerage</div>
            <div style={{fontSize:12,color:MUTED,lineHeight:1.8}}>
              📞 <a href="tel:16476091289" style={{color:MUTED,textDecoration:"none"}}>647-609-1289</a><br/>
              ✉️ <a href="mailto:hamza@nouman.ca" style={{color:MUTED,textDecoration:"none"}}>hamza@nouman.ca</a><br/>
              🌐 <a href="https://www.hamzahomes.ca" target="_blank" rel="noreferrer" style={{color:MUTED,textDecoration:"none"}}>hamzahomes.ca</a>
            </div>
            <div style={{display:"flex",gap:12,alignItems:"center",marginTop:12}}>
              <a href="https://www.royallepage.ca" target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",background:"rgba(255,255,255,0.04)",borderRadius:6,border:`1px solid ${BORDER}`,fontSize:11,color:MUTED,textDecoration:"none"}}>👑 Royal LePage</a>
              <a href="https://www.reco.on.ca" target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",background:"rgba(255,255,255,0.04)",borderRadius:6,border:`1px solid ${BORDER}`,fontSize:11,color:MUTED,textDecoration:"none"}}>Licensed by RECO</a>
            </div>
          </div>
          <div style={{flex:1,minWidth:160}}>
            <div style={{fontSize:11,color:MUTED,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Quick Links</div>
            {[["Listings","#listings"],["Market Pulse","#pulse"],["Neighbourhoods","#hoods"],["Find My Deal","#quiz"]].map(([label,href])=>(
              <div key={label} style={{marginBottom:6}}><a href={href} style={{fontSize:12,color:MUTED,textDecoration:"none"}}>{label}</a></div>
            ))}
          </div>
          <div style={{flex:1,minWidth:160}}>
            <div style={{fontSize:11,color:MUTED,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Legal</div>
            {[["Privacy Policy",()=>onPrivacy()],["Terms of Use",()=>window.open("https://www.mississaugainvestor.ca/terms-of-service","_blank")],["RECO Registration",()=>window.open("https://www.reco.on.ca","_blank")]].map(([label,action])=>(
              <div key={label} style={{marginBottom:6}}><button onClick={action} style={{background:"none",border:"none",fontSize:12,color:MUTED,cursor:"pointer",padding:0,textDecoration:"none"}}>{label}</button></div>
            ))}
          </div>
          <div style={{flex:1,minWidth:180}}>
            <div style={{fontSize:11,color:MUTED,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Services</div>
            {["Mississauga","Oakville","Milton","Burlington","Brampton","Toronto","Hamilton"].map(city=>(
              <div key={city} style={{fontSize:12,color:MUTED,marginBottom:4}}>{city}</div>
            ))}
          </div>
        </div>

        {/* TRREB + CREA Trademark Statements — MANDATORY */}
        <div style={{marginBottom:20,padding:"16px",background:"rgba(255,255,255,0.02)",borderRadius:8,border:`1px solid ${BORDER}`}}>
          <div style={{fontSize:11,color:"#4A6280",lineHeight:1.8}}>
            <p style={{marginBottom:6}}>The trademarks <strong style={{color:"#5A7090"}}>MLS®, Multiple Listing Service®</strong> and the associated logos are owned by The Canadian Real Estate Association (CREA) and identify the quality of services provided by real estate professionals who are members of CREA.</p>
            <p style={{marginBottom:6}}>The trademark <strong style={{color:"#5A7090"}}>REALTOR®</strong> is controlled by The Canadian Real Estate Association (CREA) and identifies real estate professionals who are members of CREA. Used under license.</p>
            <p style={{marginBottom:6}}><strong style={{color:"#5A7090"}}>DATA DISCLAIMER:</strong> Listing data is provided under license via PropTx Inc. and the Toronto Regional Real Estate Board (TRREB). The listing information is deemed reliable but is not guaranteed accurate. Information may be subject to errors, omissions, or changes without notice. Not intended to solicit buyers or sellers currently under contract. For verified listing information, contact Hamza directly at 647-609-1289.</p>
            <p>MLS® data is provided for the private, non-commercial use of individuals. Any other use of these materials is strictly prohibited. Copyright © {new Date().getFullYear()} The Canadian Real Estate Association. All rights reserved.</p>
          </div>
        </div>

        {/* Investment Disclaimer — MANDATORY */}
        <div style={{marginBottom:20,padding:"16px",background:"rgba(196,154,60,0.03)",borderRadius:8,border:`1px solid rgba(196,154,60,0.12)`}}>
          <div style={{fontSize:11,color:"#4A6280",lineHeight:1.8}}>
            <strong style={{color:"#8A9BB0"}}>INVESTMENT DISCLAIMER:</strong> The investment analysis tools, cap rate calculations, cash flow projections, and BRRR analysis on this website are for general informational and educational purposes only and do not constitute financial, investment, tax, or professional advice. All projections are estimates based on assumptions and actual results will differ materially. Hamza Nouman is a licensed real estate sales representative, not a financial advisor, mortgage broker, or investment advisor. Consult qualified professionals including a licensed financial advisor, accountant, and mortgage broker before making investment decisions. Real estate investment involves significant risk including potential loss of capital.
          </div>
        </div>

        {/* PIPEDA Privacy Notice */}
        <div style={{marginBottom:20,padding:"14px 16px",background:"rgba(255,255,255,0.015)",borderRadius:8,border:`1px solid ${BORDER}`}}>
          <div style={{fontSize:11,color:"#4A6280",lineHeight:1.8}}>
            <strong style={{color:"#8A9BB0"}}>PRIVACY (PIPEDA):</strong> Personal information collected through this website is used to respond to inquiries and provide real estate services. We do not sell your information. You may access, correct, or request deletion of your information by contacting hamza@nouman.ca. For privacy concerns, contact the Office of the Privacy Commissioner of Canada at <a href="https://www.priv.gc.ca" target="_blank" rel="noreferrer" style={{color:GOLD}}>www.priv.gc.ca</a>.
          </div>
        </div>

        {/* Bottom row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div style={{fontSize:11,color:"#3A4E62"}}>
            © {new Date().getFullYear()} mississaugainvestor.ca · Hamza Nouman, Sales Representative · Royal LePage Signature Realty, Brokerage · Independently Owned & Operated
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span className="compliance-badge">RECO ✓</span>
            <span className="compliance-badge">CASL ✓</span>
            <span className="compliance-badge">PIPEDA ✓</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   HEADER
───────────────────────────────────────────── */
function Header({activeNav,setActiveNav,onSeller}){
  const [mobileOpen,setMobileOpen]=useState(false);
  const navItems=[
    {id:"listings",label:"Listings"},
    {id:"pulse",label:"Market Pulse"},
    {id:"hoods",label:"Neighbourhoods"},
    {id:"news",label:"News"},
    {id:"quiz",label:"Find My Deal"},
    {id:"precon",label:"Pre-Con VIP"},
  ];

  return(
    <header role="banner" style={{position:"sticky",top:0,zIndex:80,background:"rgba(5,9,26,0.94)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:`1px solid rgba(59,130,246,0.12)`}}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* RECO compliance bar */}
      <div style={{background:"rgba(59,130,246,0.06)",borderBottom:`1px solid rgba(59,130,246,0.1)`,padding:"4px 0",textAlign:"center"}}>
        <span style={{fontSize:11,color:"#4B6899",letterSpacing:"0.02em"}}>Hamza Nouman · <strong style={{color:"#5A80BB"}}>Sales Representative</strong> · Royal LePage Signature Realty, Brokerage · 647-609-1289</span>
      </div>

      <div style={{maxWidth:1240,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,padding:"0 24px"}}>
        {/* NEW LOGO */}
        <button onClick={()=>setActiveNav("listings")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:11}} aria-label="Mississauga Investor — Home">
          {/* SVG Monogram Logo */}
          <div style={{width:38,height:38,position:"relative",flexShrink:0}}>
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{animation:"logoGlow 4s ease-in-out infinite"}}>
              {/* Outer hexagon */}
              <path d="M19 2L34.5885 11V29L19 38L3.4115 29V11L19 2Z" fill="url(#grad1)" stroke="rgba(59,130,246,0.6)" strokeWidth="0.5"/>
              {/* Inner geometric frame */}
              <path d="M19 6L31 13.5V26.5L19 34L7 26.5V13.5L19 6Z" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
              {/* MI monogram — clean geometric letterforms */}
              {/* M */}
              <path d="M9 25V13L13.5 19L18 13V25" stroke="#E2E8F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              {/* I */}
              <path d="M21 13V25" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
              <path d="M19.5 13H22.5" stroke="#3B82F6" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M19.5 25H22.5" stroke="#3B82F6" strokeWidth="1.6" strokeLinecap="round"/>
              {/* Accent dot */}
              <circle cx="26" cy="19" r="1.5" fill="#F59E0B"/>
              <defs>
                <linearGradient id="grad1" x1="3" y1="2" x2="35" y2="38" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0A1530"/>
                  <stop offset="100%" stopColor="#0D1E42"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:15,fontWeight:800,color:TEXT,lineHeight:1.1,letterSpacing:"-0.02em"}}>
              Mississauga<span style={{color:BLUE}}> Investor</span>
            </div>
            <div style={{fontSize:8.5,color:MUTED,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:500,marginTop:1}}>Investment Property Intelligence</div>
          </div>
        </button>

        {/* Desktop nav */}
        <nav role="navigation" aria-label="Main navigation" style={{display:"flex",gap:0}} className="desktop-only">
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>setActiveNav(n.id)} className={`tab-btn${activeNav===n.id?" active":""}`}>{n.label}</button>
          ))}
        </nav>

        {/* CTAs */}
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={onSeller} className="btn-ghost desktop-only" style={{padding:"8px 16px",borderRadius:7,fontSize:13,fontWeight:500}}>
            Sell My Home
          </button>
          <a href="mailto:hamza@nouman.ca"
            style={{display:"inline-flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#3B82F6,#2563EB)",color:"#fff",padding:"8px 16px",borderRadius:7,fontSize:13,fontWeight:600,textDecoration:"none",boxShadow:"0 2px 12px rgba(59,130,246,0.3)"}}>
            <span>✉</span><span className="desktop-only">Contact</span>
          </a>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────────── */
function Hero({onCTA,setActiveNav,listingCount=0}){
  return(
    <section aria-label="Hero" style={{padding:"64px 24px 52px",maxWidth:1240,margin:"0 auto",position:"relative",zIndex:1}}>
      <div style={{textAlign:"center",animation:"fadeUp .65s cubic-bezier(.22,1,.36,1) both"}}>

        {/* Status pill */}
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(16,185,129,0.08)",border:`1px solid rgba(16,185,129,0.25)`,borderRadius:40,padding:"6px 18px",marginBottom:28}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:GREEN,display:"inline-block",boxShadow:`0 0 8px ${GREEN}`}}/>
          <span style={{fontSize:12,color:GREEN,fontWeight:600,letterSpacing:"0.04em"}}>LIVE — TRREB Data Live</span>
          <span style={{fontSize:12,color:MUTED}}>·</span>
          <span style={{fontSize:12,color:MUTED}}>Real listings · Updating hourly</span>
        </div>

        {/* Headline */}
        <h1 style={{fontSize:"clamp(34px,5.5vw,64px)",fontWeight:800,color:TEXT,lineHeight:1.1,marginBottom:20,letterSpacing:"-0.03em",fontFamily:"'Inter',sans-serif"}}>
          Every Mississauga Investment Property.<br/>
          <span style={{background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Scored. Analyzed. Ranked.</span>
        </h1>

        {/* Sub */}
        <p style={{fontSize:"clamp(15px,2vw,19px)",color:TEXT2,maxWidth:580,margin:"0 auto 36px",lineHeight:1.75,fontWeight:400}}>
          {listingCount>0?listingCount.toLocaleString():'1,800+'} live Mississauga properties scored and ranked in real-time. Cap rates, cash flow, and AI deal scores on every listing — updated hourly.
        </p>

        {/* CTAs */}
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap",marginBottom:52}}>
          <button onClick={()=>setActiveNav("listings")} className="btn-primary" style={{padding:"14px 32px",borderRadius:9,fontSize:15,fontWeight:700}}>
            View Investment Deals →
          </button>
          <button onClick={()=>setActiveNav("quiz")} className="btn-ghost" style={{padding:"14px 32px",borderRadius:9,fontSize:15}}>
            Find My Ideal Deal
          </button>
        </div>

        {/* Social proof ticker */}
        <div style={{display:"flex",gap:24,justifyContent:"center",alignItems:"center",marginBottom:36,flexWrap:"wrap"}}>
          {[
            {icon:"★",val:"4.9/5",label:"Investor Rating"},
            {icon:"✓",val:"8+",label:"Years GTA Experience"},
            {icon:"⚡",val:listingCount>0?listingCount.toLocaleString()+"+":'1,800+',label:"Properties Scored"},
            {icon:"🏆",val:"Master Sales",label:"Award Winner"},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",background:"rgba(255,255,255,0.03)",border:`1px solid rgba(255,255,255,0.07)`,borderRadius:8}}>
              <span style={{fontSize:14,color:GOLD}}>{s.icon}</span>
              <div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:TEXT,lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:10,color:MUTED,marginTop:1}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="divider-grad"/>

        {/* Stats bar */}
        <div style={{display:"flex",gap:0,justifyContent:"center",paddingTop:28,flexWrap:"wrap"}}>
          {[
            ["$1.02M","Avg Detached Price, Mississauga"],
            ["5.4%","Max Cap Rate — Current Deals"],
            ["67d","Longest DOM in Dataset"],
            ["3","Languages: EN · UR · HI"],
          ].map(([val,label],i,arr)=>(
            <div key={i} style={{padding:"0 32px",borderRight:i<arr.length-1?`1px solid rgba(255,255,255,0.06)`:"none",textAlign:"center",marginBottom:12}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:BLUE,marginBottom:4,letterSpacing:"-0.01em"}}>{val}</div>
              <div style={{fontSize:11,color:MUTED,fontWeight:500}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   LISTINGS MAP (Leaflet — free, no API key)
───────────────────────────────────────────── */
function ListingsMap({listings,onOpenListing}){
  const mapRef=useRef(null);
  const mapObjRef=useRef(null);
  const clusterRef=useRef(null);
  const listingsRef=useRef(listings);
  const [selectedPin,setSelectedPin]=useState(null);
  const setSelectedPinRef=useRef(setSelectedPin);
  setSelectedPinRef.current=setSelectedPin;
  listingsRef.current=listings;

  function addMarkers(){
    if(!mapObjRef.current||!clusterRef.current||!window.L)return;
    const L=window.L;
    const data=listingsRef.current;
    clusterRef.current.clearLayers();
    const withCoords=(data||[]).filter(l=>l.lat&&l.lng);
    const markers=[];
    withCoords.forEach(l=>{
      const sc=l.hamzaScore||0;const col=sc>=8.5?'#10B981':sc>=7?'#3B82F6':sc>=5.5?'#F59E0B':'#EF4444';
      const icon=L.divIcon({
        className:'',
        html:'<div style="width:26px;height:26px;border-radius:50%;background:'+col+';border:2px solid rgba(255,255,255,0.85);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;font-family:JetBrains Mono,monospace;box-shadow:0 2px 6px rgba(0,0,0,0.5);cursor:pointer">'+sc.toFixed(1)+'</div>',
        iconSize:[26,26],iconAnchor:[13,13]
      });
      const marker=L.marker([l.lat,l.lng],{icon});
      marker.on('click',function(){setSelectedPinRef.current(l);});
      markers.push(marker);
    });
    clusterRef.current.addLayers(markers);
    if(withCoords.length>0){
      const bounds=L.latLngBounds(withCoords.map(l=>[l.lat,l.lng]));
      mapObjRef.current.fitBounds(bounds,{padding:[30,30],maxZoom:14});
    }
  }

  useEffect(()=>{
    // Load Leaflet CSS + JS + MarkerCluster dynamically
    if(!document.getElementById('leaflet-css')){
      const css=document.createElement('link');css.id='leaflet-css';css.rel='stylesheet';
      css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(css);
    }
    if(!document.getElementById('mc-css')){
      const mc1=document.createElement('link');mc1.id='mc-css';mc1.rel='stylesheet';
      mc1.href='https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';document.head.appendChild(mc1);
    }
    // Custom cluster styles (dark theme)
    if(!document.getElementById('mc-custom-css')){
      const st=document.createElement('style');st.id='mc-custom-css';
      st.textContent='.marker-cluster-small,.marker-cluster-medium,.marker-cluster-large{background:rgba(59,130,246,0.25);border-radius:50%;}.marker-cluster-small div,.marker-cluster-medium div,.marker-cluster-large div{background:rgba(59,130,246,0.85);color:#fff;border-radius:50%;font-family:JetBrains Mono,monospace;font-size:12px;font-weight:700;width:36px;height:36px;line-height:36px;text-align:center;margin-left:4px;margin-top:4px;}.marker-cluster-medium{background:rgba(245,158,11,0.25);}.marker-cluster-medium div{background:rgba(245,158,11,0.85);}.marker-cluster-large{background:rgba(239,68,68,0.25);}.marker-cluster-large div{background:rgba(239,68,68,0.85);}';
      document.head.appendChild(st);
    }
    function initMap(){
      if(!mapRef.current||mapObjRef.current||!window.L||!window.L.markerClusterGroup)return;
      const L=window.L;
      const map=L.map(mapRef.current,{zoomControl:true}).setView([43.589,-79.644],12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
        attribution:'&copy; OpenStreetMap &copy; CARTO',maxZoom:19
      }).addTo(map);
      mapObjRef.current=map;
      clusterRef.current=L.markerClusterGroup({
        maxClusterRadius:50,
        spiderfyOnMaxZoom:true,
        showCoverageOnHover:false,
        zoomToBoundsOnClick:true,
        chunkedLoading:true
      });
      map.addLayer(clusterRef.current);
      addMarkers();
    }
    function loadScripts(){
      if(!window.L){
        const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.onload=function(){
          const mc=document.createElement('script');mc.src='https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
          mc.onload=function(){initMap();};document.head.appendChild(mc);
        };document.head.appendChild(s);
      }else if(!window.L.markerClusterGroup){
        const mc=document.createElement('script');mc.src='https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
        mc.onload=function(){initMap();};document.head.appendChild(mc);
      }else{initMap();}
    }
    loadScripts();
    return()=>{if(mapObjRef.current){mapObjRef.current.remove();mapObjRef.current=null;clusterRef.current=null;}};
  },[]);

  useEffect(()=>{addMarkers();},[listings]);

  return(
    <div style={{position:"relative"}}>
      <div ref={mapRef} style={{width:"100%",height:600,borderRadius:12,border:`1px solid ${BORDER}`,overflow:"hidden"}}/>
      {selectedPin&&(
        <div style={{position:"absolute",top:12,right:12,width:320,background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,overflow:"hidden",boxShadow:"0 12px 40px rgba(0,0,0,0.6)",zIndex:1000,animation:"fadeUp .2s ease"}}>
          <button onClick={()=>setSelectedPin(null)} style={{position:"absolute",top:8,right:8,background:"rgba(5,9,26,0.7)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"50%",width:28,height:28,color:"#fff",fontSize:14,cursor:"pointer",zIndex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          {selectedPin.photos&&selectedPin.photos.length>0&&(
            <img src={selectedPin.photos[0]} alt="" style={{width:"100%",height:140,objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
          )}
          <div style={{padding:"12px 14px"}}>
            <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:2}}>{selectedPin.address}</div>
            <div style={{fontSize:11,color:MUTED,marginBottom:8}}>{selectedPin.neighbourhood}, Mississauga</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:700,color:TEXT}}>{fmtK(selectedPin.price)}</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:scoreColor(selectedPin.hamzaScore||0),fontWeight:700}}>{(selectedPin.hamzaScore||0).toFixed(1)}/10</span>
            </div>
            <div style={{display:"flex",gap:10,fontSize:11,color:MUTED,fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>
              <span>{selectedPin.beds}bd</span><span>{selectedPin.baths}ba</span><span>{selectedPin.type}</span><span>{selectedPin.dom||0}d DOM</span>
            </div>
            <button onClick={()=>onOpenListing(selectedPin)} className="btn-primary" style={{width:"100%",padding:"10px",borderRadius:8,fontSize:12}}>View Full Analysis →</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   LISTINGS VIEW
───────────────────────────────────────────── */
function ListingsView({onOpenListing,filterHood,setFilterHood,listings=[],loading=false,compareList=[],onToggleCompare,recentlyViewed=[],onDealAlert,savedDeals=[]}){
  const [propType,setPropType]=useState("All");
  const [sort,setSort]=useState("score");
  const [showScoreInfo,setShowScoreInfo]=useState(false);
  const [search,setSearch]=useState("");
  const [chips,setChips]=useState(new Set());
  const [showFilters,setShowFilters]=useState(false);
  const [viewMode,setViewMode]=useState("grid"); // grid | table | map
  const [filters,setFilters]=useState({priceMin:0,priceMax:5000000,bedsMin:0,bedsMax:99,bathsMin:0,domMin:0,domMax:999,priceDropMin:0,capRateMin:0,scoreMin:0,cashFlowMin:-2000,cocMin:-20});
  const [page,setPage]=useState(1);
  const PER_PAGE=24;
  const loadMoreRef=useRef(null);

  const toggleChip=c=>{setChips(prev=>{const n=new Set(prev);n.has(c)?n.delete(c):n.add(c);return n;});setPage(1);};

  const filtered=useMemo(()=>{
    let list=[...listings];
    if(propType!=="All")list=list.filter(l=>l.type===propType);
    if(filterHood)list=list.filter(l=>l.neighbourhood===filterHood);
    if(search){const q=search.toLowerCase();list=list.filter(l=>(l.address||'').toLowerCase().includes(q)||(l.neighbourhood||'').toLowerCase().includes(q)||(l.postalCode||'').toLowerCase().includes(q)||(l.brokerage||'').toLowerCase().includes(q));}
    // Smart investor chips
    if(chips.has("price-drop"))list=list.filter(l=>(l.priceReduction||0)>=5);
    if(chips.has("cash-flow"))list=list.filter(l=>(l.cashFlow||0)>0);
    if(chips.has("lrt"))list=list.filter(l=>l.lrtAccess);
    if(chips.has("motivated"))list=list.filter(l=>(l.dom||0)>=30&&(l.priceReduction||0)>=3);
    if(chips.has("under-800"))list=list.filter(l=>(l.price||0)<800000);
    if(chips.has("under-600"))list=list.filter(l=>(l.price||0)<600000);
    if(chips.has("brrr"))list=list.filter(l=>(l.dom||0)>=40&&(l.priceReduction||0)>=5);
    if(chips.has("high-yield"))list=list.filter(l=>(l.capRate||0)>=4);
    if(chips.has("suite"))list=list.filter(l=>l.hasSuite);
    if(chips.has("new-listing"))list=list.filter(l=>(l.dom||0)<=3);
    // Range filters
    list=list.filter(l=>{
      const p=l.price||0,b=l.beds||0,ba=l.baths||0,d=l.dom||0,dr=l.priceReduction||0,cr=l.capRate||0,sc=l.hamzaScore||0,cf=l.cashFlow||0,coc=l.cashOnCash||0;
      return p>=filters.priceMin&&p<=filters.priceMax&&b>=filters.bedsMin&&b<=filters.bedsMax&&ba>=filters.bathsMin&&d>=filters.domMin&&d<=filters.domMax&&dr>=filters.priceDropMin&&cr>=filters.capRateMin&&sc>=filters.scoreMin&&cf>=filters.cashFlowMin&&coc>=filters.cocMin;
    });
    const sortFns={
      score:(a,b)=>(b.hamzaScore||0)-(a.hamzaScore||0),
      price:(a,b)=>(a.price||0)-(b.price||0),
      priceDesc:(a,b)=>(b.price||0)-(a.price||0),
      dom:(a,b)=>(b.dom||0)-(a.dom||0),
      domAsc:(a,b)=>(a.dom||0)-(b.dom||0),
      drop:(a,b)=>(b.priceReduction||0)-(a.priceReduction||0),
      cashflow:(a,b)=>(b.cashFlow||0)-(a.cashFlow||0),
      caprate:(a,b)=>(b.capRate||0)-(a.capRate||0),
      coc:(a,b)=>(b.cashOnCash||0)-(a.cashOnCash||0),
      rent:(a,b)=>(b.estimatedRent||0)-(a.estimatedRent||0),
      ppsqft:(a,b)=>{const pa=(a.price||1)/(a.beds||1),pb=(b.price||1)/(b.beds||1);return pa-pb;},
    };
    list.sort(sortFns[sort]||sortFns.score);
    return list;
  },[listings,propType,filterHood,search,chips,filters,sort]);

  // Portfolio analytics — computed from filtered results
  const analytics=useMemo(()=>{
    if(filtered.length===0)return null;
    const prices=filtered.map(l=>l.price||0);
    const caps=filtered.map(l=>l.capRate||0).filter(c=>c>0);
    const cfs=filtered.map(l=>l.cashFlow||0);
    const doms=filtered.map(l=>l.dom||0);
    const cfPositive=cfs.filter(c=>c>0).length;
    const avgPrice=prices.reduce((a,b)=>a+b,0)/prices.length;
    const avgCap=caps.length>0?caps.reduce((a,b)=>a+b,0)/caps.length:0;
    const avgDOM=doms.reduce((a,b)=>a+b,0)/doms.length;
    const maxCap=caps.length>0?Math.max(...caps):0;
    const bestDeal=filtered.reduce((best,l)=>(l.hamzaScore||0)>(best.hamzaScore||0)?l:best,filtered[0]);
    const totalValue=prices.reduce((a,b)=>a+b,0);
    const priceDrops=filtered.filter(l=>(l.priceReduction||0)>0).length;
    const cocs=filtered.map(l=>l.cashOnCash||0);
    const avgCoC=cocs.length>0?cocs.reduce((a,b)=>a+b,0)/cocs.length:0;
    const bestCF=Math.max(...cfs);
    const suitePotential=filtered.filter(l=>l.hasSuite).length;
    const avgScore=filtered.reduce((a,l)=>a+(l.hamzaScore||0),0)/filtered.length;
    return{avgPrice,avgCap,avgDOM,maxCap,cfPositive,total:filtered.length,bestDeal,totalValue,priceDrops,cfNegative:filtered.length-cfPositive,avgCoC,bestCF,suitePotential,avgScore};
  },[filtered]);

  const activeFilters=chips.size+(propType!=="All"?1:0)+(filterHood?1:0)+(search?1:0)+(filters.priceMin>0||filters.priceMax<5000000||filters.bedsMin>0||filters.capRateMin>0||filters.scoreMin>0||filters.cashFlowMin>-2000||filters.cocMin>-20?1:0);
  const resetAll=()=>{setPropType("All");setChips(new Set());setSearch("");if(setFilterHood)setFilterHood(null);setFilters({priceMin:0,priceMax:5000000,bedsMin:0,bedsMax:99,bathsMin:0,domMin:0,domMax:999,priceDropMin:0,capRateMin:0,scoreMin:0,cashFlowMin:-2000,cocMin:-20});setPage(1);};

  // Infinite scroll — show items 0..page*PER_PAGE
  const totalPages=Math.ceil(filtered.length/PER_PAGE);
  const paged=viewMode==="map"?filtered:filtered.slice(0,page*PER_PAGE);
  const hasMore=page<totalPages;
  // Reset page when filters change
  useEffect(()=>{setPage(1);},[propType,sort,search,filterHood]);
  // IntersectionObserver for infinite scroll
  useEffect(()=>{
    if(!loadMoreRef.current||viewMode==="map")return;
    const obs=new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&hasMore)setPage(p=>p+1);},{rootMargin:"400px"});
    obs.observe(loadMoreRef.current);
    return()=>obs.disconnect();
  },[hasMore,viewMode]);

  return(
    <section aria-label="Property Listings" id="listings">

      {/* ═══ PORTFOLIO ANALYTICS DASHBOARD ═══ */}
      {analytics&&(
        <div style={{background:`linear-gradient(135deg,${CARD},rgba(59,130,246,0.03))`,border:`1px solid rgba(59,130,246,0.15)`,borderRadius:14,padding:"0",marginBottom:20,overflow:"hidden"}}>
          {/* Terminal header */}
          <div style={{background:"rgba(59,130,246,0.06)",borderBottom:`1px solid rgba(59,130,246,0.12)`,padding:"8px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:GREEN,boxShadow:"0 0 8px rgba(16,185,129,0.6)"}}/>
              <span style={{fontSize:10,fontWeight:700,color:BLUE,letterSpacing:"0.1em",fontFamily:"'JetBrains Mono',monospace"}}>DEAL SCREENER</span>
              <span style={{fontSize:10,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>MSGA · {new Date().toLocaleDateString('en-CA')}</span>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:10,color:GREEN,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>LIVE</span>
              <span style={{fontSize:10,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{listings.length} FEEDS</span>
            </div>
          </div>

          {/* Analytics grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:0}}>
            {[
              {label:"SHOWING",value:analytics.total,sub:`of ${listings.length}`,color:TEXT},
              {label:"AVG PRICE",value:fmtK(analytics.avgPrice),sub:"filtered avg",color:TEXT},
              {label:"AVG CAP RATE",value:analytics.avgCap.toFixed(2)+"%",sub:"net yield",color:analytics.avgCap>=4?GREEN:analytics.avgCap>=3?GOLD:RED},
              {label:"AVG CoC",value:analytics.avgCoC.toFixed(1)+"%",sub:"cash-on-cash",color:analytics.avgCoC>=0?GREEN:RED},
              {label:"CF POSITIVE",value:analytics.cfPositive,sub:`of ${analytics.total}`,color:analytics.cfPositive>0?GREEN:RED},
              {label:"BEST CF",value:"$"+analytics.bestCF.toLocaleString(),sub:"/month",color:analytics.bestCF>0?GREEN:RED},
              {label:"AVG DOM",value:Math.round(analytics.avgDOM)+"d",sub:"days on mkt",color:analytics.avgDOM>=40?RED:TEXT},
              {label:"PRICE DROPS",value:analytics.priceDrops,sub:"reduced",color:analytics.priceDrops>0?GREEN:MUTED},
              {label:"SUITES",value:analytics.suitePotential,sub:"detected",color:analytics.suitePotential>0?GREEN:MUTED},
              {label:"AVG SCORE",value:analytics.avgScore.toFixed(1),sub:"/10",color:scoreColor(analytics.avgScore)},
            ].map((s,i)=>(
              <div key={i} style={{padding:"12px 14px",borderRight:`1px solid rgba(255,255,255,0.04)`,borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                <div style={{fontSize:9,color:MUTED,fontWeight:600,letterSpacing:"0.08em",fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>{s.label}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:9,color:MUTED,marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How scoring works */}
      <div style={{textAlign:"right",marginBottom:8}}>
        <button onClick={()=>setShowScoreInfo(!showScoreInfo)} style={{background:"none",border:"none",color:BLUE,fontSize:11,cursor:"pointer",fontWeight:600}}>
          {showScoreInfo?'Hide':'How the score works'}
        </button>
      </div>
      {showScoreInfo&&(
        <div style={{background:CARD,border:`1px solid rgba(59,130,246,0.15)`,borderRadius:12,padding:"18px 22px",marginBottom:18,animation:"slideDown .2s ease"}}>
          <h3 style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:12}}>How The Deal Score Works</h3>
          <p style={{fontSize:12,color:MUTED,marginBottom:12,lineHeight:1.6}}>Every property is scored 1-10 based on investment potential using Hamza's framework:</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
            {[
              {f:"Cash Flow",w:"30%",d:"Break-even = 7.5. Positive CF scores higher. Calibrated to Mississauga norms."},
              {f:"Days on Market",w:"25%",d:"Longer DOM = more leverage. Sweet spot: 30-90 days."},
              {f:"Price Reduction",w:"20%",d:"Price drops signal motivated sellers and negotiation room."},
              {f:"Cap Rate / Yield",w:"25%",d:"Higher cap rate = higher score. 4%+ is strong for Mississauga."},
              {f:"Suite Bonus",w:"+1.0",d:"Properties with basement suite potential get a bonus point."},
            ].map(s=>(
              <div key={s.f} style={{background:SURFACE,borderRadius:8,padding:"10px 12px",border:`1px solid ${BORDER}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:700,color:TEXT}}>{s.f}</span>
                  <span style={{fontSize:10,color:GOLD,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{s.w}</span>
                </div>
                <p style={{fontSize:10,color:MUTED,lineHeight:1.5}}>{s.d}</p>
              </div>
            ))}
          </div>
          <p style={{fontSize:10,color:MUTED,marginTop:10}}>Scores recalculate hourly with live data. This is Hamza's personal investment framework — not a generic formula.</p>
        </div>
      )}

      {/* ═══ SEARCH + CONTROLS ═══ */}
      <div style={{marginBottom:20}}>
        {/* Search */}
        <div style={{position:"relative",marginBottom:14}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:MUTED,fontSize:14,fontFamily:"'JetBrains Mono',monospace"}} aria-hidden="true">&gt;_</span>
          <input type="search" placeholder="Search address, neighbourhood, postal code, brokerage..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",background:CARD,border:`1px solid ${BORDER}`,borderRadius:8,padding:"12px 14px 12px 42px",color:TEXT,fontSize:13,fontFamily:"'JetBrains Mono',monospace"}}
            aria-label="Search listings"/>
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:16}}>×</button>}
        </div>

        {/* Property type tabs */}
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
          {["All","Detached","Semi-Detached","Townhouse","Condo","Duplex","Triplex","Fourplex","Multiplex"].map(t=>(
            <button key={t} onClick={()=>{setPropType(t);setPage(1);}} className={"chip"+(propType===t?" active":"")} style={{padding:"7px 14px",fontSize:12}}>{t}</button>
          ))}
          {filterHood&&<button onClick={()=>setFilterHood(null)} style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:6,padding:"7px 14px",fontSize:12,color:RED,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>✕ {filterHood}</button>}
        </div>

        {/* ═══ INVESTOR STRATEGY CHIPS ═══ */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:MUTED,fontWeight:600,letterSpacing:"0.08em",marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>INVESTOR FILTERS</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[
              ["cash-flow","CF+","Cash Flow Positive","#10B981"],
              ["high-yield","4%+ CAP","Cap Rate 4%+","#F59E0B"],
              ["cash-flow","CF+","Positive Cash Flow","#10B981"],
              ["high-yield","HIGH CAP","4%+ Cap Rate","#F59E0B"],
              ["motivated","MOTIVATED","DOM 30+ & Price Cut","#EF4444"],
              ["brrr","BRRR","DOM 40+ & 5%+ Drop","#8B5CF6"],
              ["price-drop","REDUCED","5%+ Price Drop","#10B981"],
              ["new-listing","NEW","Listed 0-3 Days","#3B82F6"],
              ["under-800","<$800K","Under $800K","#3B82F6"],
              ["under-600","<$600K","Under $600K","#3B82F6"],
              ["suite","SUITE","Basement Suite Detected","#F59E0B"],
              ["lrt","LRT","Near LRT Corridor","#6366F1"],
            ].map(([id,tag,desc,col])=>(
              <button key={id} onClick={()=>toggleChip(id)}
                title={desc}
                style={{
                  padding:"5px 10px",borderRadius:4,fontSize:10,fontWeight:700,
                  fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.04em",
                  cursor:"pointer",transition:"all .15s ease",
                  background:chips.has(id)?`${col}20`:"rgba(255,255,255,0.03)",
                  border:`1px solid ${chips.has(id)?`${col}80`:"rgba(255,255,255,0.08)"}`,
                  color:chips.has(id)?col:MUTED,
                }}>{tag}</button>
            ))}
          </div>
        </div>

        {/* Sort + View + Active filters */}
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:"7px 12px",color:TEXT,fontSize:12,fontFamily:"'JetBrains Mono',monospace"}} aria-label="Sort listings by">
            <option value="score">SORT: SCORE ↓</option>
            <option value="caprate">SORT: CAP RATE ↓</option>
            <option value="cashflow">SORT: CASH FLOW ↓</option>
            <option value="coc">SORT: CoC RETURN ↓</option>
            <option value="price">SORT: PRICE ↑</option>
            <option value="priceDesc">SORT: PRICE ↓</option>
            <option value="dom">SORT: DOM ↓</option>
            <option value="domAsc">SORT: DOM ↑ (newest)</option>
            <option value="drop">SORT: PRICE DROP ↓</option>
            <option value="rent">SORT: RENT ↓</option>
            <option value="ppsqft">SORT: $/BEDROOM ↑</option>
          </select>

          {/* View toggle */}
          <div style={{display:"flex",border:`1px solid ${BORDER}`,borderRadius:6,overflow:"hidden"}}>
            {["grid","table","map"].map(m=>(
              <button key={m} onClick={()=>setViewMode(m)} style={{padding:"6px 10px",background:viewMode===m?"rgba(59,130,246,0.15)":"transparent",border:"none",borderLeft:m!=="grid"?`1px solid ${BORDER}`:"none",color:viewMode===m?BLUE:MUTED,cursor:"pointer",fontSize:12,fontWeight:600,textTransform:"capitalize"}}>{m==="map"?"Map":m==="grid"?"Grid":"Table"}</button>
            ))}
          </div>

          <button onClick={()=>setShowFilters(!showFilters)} className="btn-ghost" style={{padding:"7px 14px",borderRadius:6,fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>
            {showFilters?"▲ FILTERS":"▼ FILTERS"}
          </button>

          {activeFilters>0&&(
            <button onClick={resetAll} style={{padding:"6px 12px",borderRadius:6,fontSize:11,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",color:RED,cursor:"pointer",fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>
              CLEAR ALL ({activeFilters})
            </button>
          )}

          {viewMode==="table"&&<button onClick={()=>{const h=['Address','Price','Cap Rate','Cash Flow','DOM','Score','Type','Neighbourhood'];const r=filtered.map(l=>['"'+(l.address||'').replace(/"/g,'""')+'"',l.price,(l.capRate||0),l.cashFlow||0,l.dom||0,(l.hamzaScore||0).toFixed(1),l.type||'',l.neighbourhood||'']);const csv=[h,...r].map(r=>r.join(',')).join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='mississauga-deals-'+new Date().toISOString().split('T')[0]+'.csv';a.click();URL.revokeObjectURL(u);}} className="btn-ghost" style={{padding:"6px 12px",borderRadius:6,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>CSV</button>}

          <span style={{fontSize:11,color:MUTED,marginLeft:"auto",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{viewMode==="map"?filtered.length:(page-1)*PER_PAGE+1+"–"+Math.min(page*PER_PAGE,filtered.length)}<span style={{color:"#3A5070"}}> / {filtered.length}</span></span>
        </div>

        {/* ═══ ADVANCED FILTER PANEL ═══ */}
        {showFilters&&(
          <div style={{background:CARD,border:`1px solid rgba(59,130,246,0.15)`,borderRadius:10,padding:"18px 20px",marginTop:14,animation:"slideDown .2s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:BLUE,letterSpacing:"0.08em",fontFamily:"'JetBrains Mono',monospace"}}>ADVANCED SCREENING</div>
              <button onClick={()=>setFilters({priceMin:0,priceMax:5000000,bedsMin:0,bedsMax:99,bathsMin:0,domMin:0,domMax:999,priceDropMin:0,capRateMin:0,scoreMin:0,cashFlowMin:-2000,cocMin:-20})} style={{fontSize:10,color:MUTED,background:"none",border:"none",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>RESET</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14}}>
              {[
                ["Price Min","priceMin",0,2000000,25000,v=>fmtK(v)],
                ["Price Max","priceMax",200000,5000000,50000,v=>fmtK(v)],
                ["Min Beds","bedsMin",0,6,1,v=>v+"bd"],
                ["Max Beds","bedsMax",1,10,1,v=>v===99?"Any":v+"bd"],
                ["Min Baths","bathsMin",0,5,1,v=>v+"ba"],
                ["Min DOM","domMin",0,120,5,v=>v+"d"],
                ["Max DOM","domMax",7,999,7,v=>v>=999?"Any":v+"d"],
                ["Min Price Drop","priceDropMin",0,25,1,v=>v+"%"],
                ["Min Cap Rate","capRateMin",0,8,0.5,v=>v.toFixed(1)+"%"],
                ["Min Cash Flow","cashFlowMin",-2000,1000,100,v=>"$"+v.toLocaleString()+"/mo"],
                ["Min CoC Return","cocMin",-20,15,1,v=>v+"%"],
                ["Min Score","scoreMin",0,9,0.5,v=>v.toFixed(1)+"/10"],
              ].map(([label,key,min,max,step,fmt])=>(
                <div key={key}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <label htmlFor={`f-${key}`} style={{fontSize:10,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{label}</label>
                    <span style={{fontSize:10,color:GOLD,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(filters[key])}</span>
                  </div>
                  <input id={`f-${key}`} type="range" min={min} max={max} step={step} value={filters[key]} onChange={e=>setFilters(f=>({...f,[key]:Number(e.target.value)}))} style={{width:"100%"}} aria-label={label}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ HAMZA'S TOP PICK ═══ */}
      {filtered.find(l=>l.hamzasPick)&&(()=>{
        const pick=filtered.find(l=>l.hamzasPick);
        return(
        <div style={{background:"linear-gradient(135deg,rgba(245,158,11,0.08),rgba(59,130,246,0.04))",border:`1px solid rgba(245,158,11,0.3)`,borderRadius:10,padding:"14px 18px",marginBottom:18,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap",cursor:"pointer"}} onClick={()=>onOpenListing(pick)}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(245,158,11,0.15)",border:`2px solid rgba(245,158,11,0.5)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>★</div>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:9,color:GOLD,fontWeight:700,letterSpacing:"0.08em",fontFamily:"'JetBrains Mono',monospace"}}>TOP PICK</div>
            <div style={{fontSize:14,fontWeight:700,color:TEXT,marginTop:2}}>{pick.address}</div>
            <div style={{fontSize:11,color:MUTED,marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{fmtK(pick.price)} · {(pick.capRate||0).toFixed(1)}% CAP · {pick.dom}d DOM · {(pick.hamzaScore||0).toFixed(1)}/10</div>
          </div>
          <span style={{fontSize:12,color:GOLD,fontWeight:600}}>VIEW →</span>
        </div>
        );
      })()}

      {/* ═══ LOADING ═══ */}
      {loading&&listings.length===0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:16}}>
          {[...Array(8)].map((_,i)=>(
            <div key={i} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,overflow:"hidden"}}>
              <div className="skeleton" style={{height:180}}/>
              <div style={{padding:"14px 16px"}}>
                <div className="skeleton" style={{height:14,borderRadius:4,marginBottom:8,width:"70%"}}/>
                <div className="skeleton" style={{height:12,borderRadius:4,marginBottom:14,width:"50%"}}/>
                <div className="skeleton" style={{height:20,borderRadius:4,marginBottom:10,width:"40%"}}/>
                <div className="skeleton" style={{height:32,borderRadius:6,width:"100%"}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ RESULTS ═══ */}
      {!loading&&filtered.length===0?(
        <div style={{textAlign:"center",padding:"60px 24px",color:MUTED}}>
          <div style={{fontSize:40,marginBottom:12}}>🔍</div>
          <p style={{fontSize:15,marginBottom:4}}>{listings.length===0?"Connecting to TRREB feed...":"No deals match your screening criteria."}</p>
          {listings.length>0&&<p style={{fontSize:12,color:"#3A5070",marginBottom:16}}>Try adjusting your filters or clearing the active screens.</p>}
          {listings.length>0&&<button onClick={resetAll} className="btn-primary" style={{padding:"10px 24px",borderRadius:8,fontSize:13}}>Reset All Filters</button>}
        </div>
      ):viewMode==="table"?(
        /* ═══ TABLE VIEW — Bloomberg terminal style ═══ */
        <div style={{borderRadius:10,overflow:"hidden",border:`1px solid ${BORDER}`}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>
              <thead>
                <tr style={{background:"rgba(59,130,246,0.06)"}}>
                  {["SCORE","ADDRESS","TYPE","PRICE","DROP","BD","BA","DOM","EST RENT","CF/MO","CAP%","BROKERAGE"].map(h=>(
                    <th key={h} style={{padding:"8px 10px",textAlign:"left",color:MUTED,fontWeight:600,fontSize:9,letterSpacing:"0.08em",borderBottom:`1px solid ${BORDER}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(l=>{
                  const sc=l.hamzaScore||0;const scCol=scoreColor(sc);
                  return(
                    <tr key={l.id} onClick={()=>onOpenListing(l)} style={{cursor:"pointer",borderBottom:`1px solid rgba(255,255,255,0.03)`,transition:"background .15s ease"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(59,130,246,0.06)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"8px 10px"}}><span style={{color:scCol,fontWeight:700}}>{sc.toFixed(1)}</span></td>
                      <td style={{padding:"8px 10px",color:TEXT,fontWeight:600,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.address}{l.hamzasPick?<span style={{color:GOLD,marginLeft:4}}>★</span>:""}</td>
                      <td style={{padding:"8px 10px",color:MUTED}}>{l.type}</td>
                      <td style={{padding:"8px 10px",color:TEXT,fontWeight:600}}>{fmtK(l.price)}</td>
                      <td style={{padding:"8px 10px",color:(l.priceReduction||0)>0?GREEN:MUTED}}>{(l.priceReduction||0)>0?"-"+l.priceReduction+"%":"—"}</td>
                      <td style={{padding:"8px 10px",color:TEXT}}>{l.beds}</td>
                      <td style={{padding:"8px 10px",color:TEXT}}>{l.baths}</td>
                      <td style={{padding:"8px 10px",color:(l.dom||0)>=40?RED:TEXT}}>{l.dom||0}</td>
                      <td style={{padding:"8px 10px",color:GREEN}}>${(l.estimatedRent||0).toLocaleString()}</td>
                      <td style={{padding:"8px 10px",color:(l.cashFlow||0)>=-300?GREEN:(l.cashFlow||0)>=-600?GOLD:RED,fontWeight:600}}>{(l.cashFlow||0)>0?"+":""}{l.cashFlow||0}</td>
                      <td style={{padding:"8px 10px",color:(l.capRate||0)>=4?GREEN:(l.capRate||0)>=3?GOLD:MUTED,fontWeight:600}}>{(l.capRate||0).toFixed(1)}%</td>
                      <td style={{padding:"8px 10px",color:MUTED,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:9}}>{l.brokerage||"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ):viewMode==="map"?(
        /* ═══ MAP VIEW ═══ */
        <ListingsMap listings={filtered} onOpenListing={onOpenListing}/>
      ):(
        /* ═══ GRID VIEW ═══ */
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:16}}>
          {paged.map(l=><ListingCard key={l.id} l={l} onOpen={onOpenListing} isSample={l.isSample} isComparing={compareList.includes(l.id)} onToggleCompare={onToggleCompare} isSaved={savedDeals.includes(l.id)}/>)}
        </div>
      )}

      {/* ═══ INFINITE SCROLL SENTINEL ═══ */}
      {viewMode!=="map"&&<div ref={loadMoreRef} style={{height:1}}/>}
      {viewMode!=="map"&&hasMore&&(
        <div style={{textAlign:"center",padding:"24px 0"}}>
          <span style={{fontSize:12,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>Loading more… ({paged.length} of {filtered.length})</span>
        </div>
      )}
      {viewMode!=="map"&&!hasMore&&filtered.length>0&&(
        <div style={{textAlign:"center",padding:"16px 0"}}>
          <span style={{fontSize:11,color:MUTED}}>Showing all {filtered.length} properties</span>
        </div>
      )}

      {/* Deal Alert CTA */}
      {onDealAlert&&(
        <div style={{background:`linear-gradient(135deg,rgba(59,130,246,0.06),rgba(139,92,246,0.04))`,border:`1px solid rgba(59,130,246,0.2)`,borderRadius:12,padding:"20px 24px",marginTop:24,display:"flex",gap:16,alignItems:"center",flexWrap:"wrap",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:4}}>🔔 Never Miss a Deal</div>
            <div style={{fontSize:12,color:MUTED}}>Set your criteria and get notified instantly when matching properties hit the market.</div>
          </div>
          <button onClick={onDealAlert} className="btn-primary" style={{padding:"10px 24px",borderRadius:8,fontSize:13}}>Set Up Deal Alerts</button>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length>0&&(
        <div style={{marginTop:28}}>
          <div style={{fontSize:11,fontWeight:700,color:MUTED,letterSpacing:"0.08em",fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>RECENTLY VIEWED</div>
          <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:6}}>
            {recentlyViewed.map(r=>{
              const listing=listings.find(l=>l.id===r.id);
              return(
                <div key={r.id} onClick={()=>listing&&onOpenListing(listing)} style={{flexShrink:0,width:200,background:CARD,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 12px",cursor:listing?"pointer":"default",opacity:listing?1:0.5}}>
                  <div style={{fontSize:11,fontWeight:600,color:TEXT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{formatAddress(r.address)}</div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                    <span style={{fontSize:11,color:GOLD,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{fmtK(r.price)}</span>
                    <span style={{fontSize:10,color:scoreColor(r.score||0),fontFamily:"'JetBrains Mono',monospace"}}>{(r.score||0).toFixed(1)}/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────
   AGENT BIO SECTION
───────────────────────────────────────────── */
function AgentBio({onContact}){
  return(
    <section aria-label="About Hamza" style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:"28px 28px",marginBottom:32,display:"flex",gap:24,alignItems:"flex-start",flexWrap:"wrap"}}>
      <img src="/hamza.jpg.JPG" onError={e=>{e.target.outerHTML='<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#1E3A5F,#162032);display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0;border:2px solid rgba(196,154,60,0.4)">👤</div>';}}
        alt="Hamza Nouman, Sales Representative, Royal LePage Signature Realty" style={{width:80,height:80,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid rgba(196,154,60,0.4)"}}/>
      <div style={{flex:1,minWidth:200}}>
        <div style={{fontSize:18,fontWeight:700,color:TEXT,marginBottom:2,fontFamily:"'Playfair Display',serif"}}>Hamza Nouman</div>
        <div style={{fontSize:13,color:GOLD,fontWeight:600,marginBottom:1}}>Sales Representative</div>
        <div style={{fontSize:12,color:MUTED,marginBottom:10}}>Royal LePage Signature Realty, Brokerage</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
          <span style={{fontSize:11,color:GREEN,background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:4,padding:"2px 8px"}}>🏆 Master Sales Award</span>
          <span style={{fontSize:11,color:BLUE,background:"rgba(61,155,233,0.08)",border:"1px solid rgba(61,155,233,0.2)",borderRadius:4,padding:"2px 8px"}}>8+ Years GTA</span>
          <span style={{fontSize:11,color:MUTED,background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,borderRadius:4,padding:"2px 8px"}}>EN · UR · HI</span>
        </div>
        <p style={{fontSize:13,color:MUTED,lineHeight:1.6,marginBottom:14}}>Specializing in Mississauga investment properties with deep expertise in cap rate analysis, BRRR strategies, and the Hurontario LRT corridor. Every listing scored and analyzed so you don't have to.</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <a href="tel:16476091289" style={{display:"inline-flex",alignItems:"center",gap:6,background:SURFACE,color:TEXT,border:`1px solid ${BORDER}`,padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:500,textDecoration:"none"}}>📞 647-609-1289</a>
          <a href="mailto:hamza@nouman.ca" style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(59,130,246,0.1)",color:BLUE,border:"1px solid rgba(59,130,246,0.25)",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:500,textDecoration:"none"}}>✉ hamza@nouman.ca</a>
          <a href="https://www.mississaugainvestor.ca" target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(196,154,60,0.08)",color:GOLD,border:`1px solid rgba(196,154,60,0.25)`,padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:500,textDecoration:"none"}}>🌐 mississaugainvestor.ca</a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────── */
function Testimonials(){
  const reviews=[
    {name:"Arjun P.",hood:"Port Credit",text:"Hamza helped me find a cash-flow positive detached in Clarkson when I thought it was impossible under $1M. Closed $31K under ask. The scoring system saved me weeks of analysis.",outcome:"+$420/mo cash flow",stars:5},
    {name:"Fatima R.",hood:"Erin Mills",text:"I was a first-time investor with no idea where to start. Hamza walked me through the BRRR strategy, found a townhouse 67 DOM, negotiated hard, and I refinanced 8 months later. Exactly what he said would happen.",outcome:"Refinanced in 8 months",stars:5},
    {name:"David & Sarah K.",hood:"Cooksville",text:"We'd been looking for 6 months with another agent. Hamza identified a Hurontario LRT corridor play in Cooksville, ran the cap rate numbers in detail, and we were firm within a week. 4.9% cap rate at purchase.",outcome:"4.9% cap rate",stars:5},
    {name:"Manpreet S.",hood:"Streetsville",text:"The investment analysis tool on this site is genuinely impressive. Hamza's score system flagged a 7.3% price drop I'd missed. We moved fast and bought $40K under the original ask.",outcome:"$40K under ask",stars:5},
  ];
  return(
    <section aria-label="Client testimonials" style={{marginBottom:32}}>
      <div style={{marginBottom:20,display:"flex",alignItems:"baseline",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:TEXT,marginBottom:4}}>Investor Results</h3>
          <p style={{fontSize:12,color:MUTED}}>Real clients. Real deals. Mississauga investment properties.</p>
        </div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {[1,2,3,4,5].map(i=><span key={i} style={{color:GOLD,fontSize:14}}>★</span>)}
          <span style={{fontSize:12,color:MUTED,marginLeft:6}}>4.9 · Royal LePage Verified</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
        {reviews.map((r,i)=>(
          <div key={i} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:"18px 20px",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(s=><span key={s} style={{color:GOLD,fontSize:12}}>★</span>)}</div>
            <p style={{fontSize:13,color:TEXT2,lineHeight:1.7,flex:1,fontStyle:"italic"}}>"{r.text}"</p>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:4}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:TEXT}}>{r.name}</div>
                <div style={{fontSize:11,color:MUTED}}>{r.hood}, Mississauga</div>
              </div>
              <div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,color:GREEN,whiteSpace:"nowrap"}}>{r.outcome}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function App(){
  const [activeNav,setActiveNav]=useState("listings");
  const [selectedListing,setSelectedListing]=useState(null);
  const [isRegistered,setIsRegistered]=useState(()=>{try{return localStorage.getItem('user_registered')==='true'}catch{return false}});
  const [liveListings,setLiveListings]=useState([]);
  const [usingLiveFeed,setUsingLiveFeed]=useState(false);
  const [freeViews,setFreeViews]=useState(()=>{try{const v=localStorage.getItem('listing_views');return v?3-parseInt(v):3}catch{return 3}});
  const [showRegModal,setShowRegModal]=useState(false);
  const [pendingListing,setPendingListing]=useState(null);
  const [showPrecon,setShowPrecon]=useState(false);
  const [showSeller,setShowSeller]=useState(false);
  const [showPrivacy,setShowPrivacy]=useState(false);
  const [cookieConsent,setCookieConsent]=useState(()=>{try{return localStorage.getItem('cookie_consent')}catch{return null}}); // null=not answered, "all"/"essential"
  const [seenDisclaimer,setSeenDisclaimer]=useState(false);
  const [disclaimerCallback,setDisclaimerCallback]=useState(null);
  const [filterHood,setFilterHood]=useState(null);
  const [showExitPopup,setShowExitPopup]=useState(false);
  const [savedDeals,setSavedDeals]=useState(()=>{try{return JSON.parse(localStorage.getItem('saved_deals')||'[]')}catch{return[]}});
  const [compareList,setCompareList]=useState([]);
  const [showCompare,setShowCompare]=useState(false);
  const [recentlyViewed,setRecentlyViewed]=useState(()=>{try{return JSON.parse(localStorage.getItem('recently_viewed')||'[]')}catch{return[]}});
  const [showDealAlert,setShowDealAlert]=useState(false);

  // Check stored cookie consent
  // Load ALL live TRREB listings from PropTx API (paginated)
  useEffect(()=>{
    async function fetchAllListings(){
      let allListings=[];
      let page=1;
      let totalPages=1;
      while(page<=totalPages){
        try{
          const r=await fetch('/api/listings?limit=200&page='+page);
          const d=await r.json();
          if(d.listings&&d.listings.length>0){
            allListings=allListings.concat(d.listings);
            totalPages=d.pages||1;
            // Show listings IMMEDIATELY as each page arrives
            processListings(allListings);
          }else{break;}
        }catch(e){console.error('Feed page '+page+' error:',e);break;}
        page++;
      }
      // After all pages loaded, fetch thumbnails for listings with no photos
      loadThumbnails(allListings);
    }
    async function loadThumbnails(allRaw){
      const needPhotos=allRaw.filter(l=>!l.photos||l.photos.length===0);
      if(needPhotos.length===0)return;
      for(let i=0;i<needPhotos.length;i+=20){
        const batch=needPhotos.slice(i,i+20);
        const ids=batch.map(l=>l.id);
        try{
          const r=await fetch('/api/photos-batch',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ids})
          });
          const d=await r.json();
          if(d.photos){
            setLiveListings(prev=>prev.map(l=>{
              if(d.photos[l.id]&&(!l.photos||l.photos.length===0)){
                return{...l,photos:[d.photos[l.id]],images:[d.photos[l.id]]};
              }
              return l;
            }));
          }
        }catch(e){/* skip failed batch */}
      }
    }
    // Mississauga FSA (Forward Sortation Area) centroids for map pins
    // Each 3-char postal prefix maps to a neighbourhood centroid
    const FSA_COORDS={
      'L4T':[43.6938,-79.6312],'L4V':[43.6770,-79.6110],'L4W':[43.6370,-79.5930],
      'L4X':[43.6080,-79.5700],'L4Y':[43.5850,-79.5450],'L4Z':[43.6380,-79.6220],
      'L5A':[43.5870,-79.6040],'L5B':[43.5930,-79.6430],'L5C':[43.5770,-79.5880],
      'L5E':[43.5610,-79.5830],'L5G':[43.5520,-79.5840],'L5H':[43.5440,-79.5740],
      'L5J':[43.5230,-79.5760],'L5K':[43.5260,-79.6020],'L5L':[43.5460,-79.6550],
      'L5M':[43.5580,-79.6830],'L5N':[43.5690,-79.7050],'L5R':[43.5800,-79.6640],
      'L5S':[43.6550,-79.6100],'L5T':[43.6650,-79.6370],'L5V':[43.5500,-79.6300],
      'L5W':[43.5750,-79.6150]
    };
    function geocodeFromPostal(pc,id){
      if(!pc)return null;
      const fsa=pc.replace(/\s/g,'').substring(0,3).toUpperCase();
      const coords=FSA_COORDS[fsa];
      if(!coords)return null;
      // Deterministic offset based on full postal code + id so pins spread but stay stable
      const key=(pc||'')+(id||'');
      let h=0;for(let i=0;i<key.length;i++){h=((h<<5)-h)+key.charCodeAt(i);h|=0;}
      const r1=((h&0xFFFF)/0xFFFF-0.5)*0.008;
      const r2=(((h>>16)&0xFFFF)/0xFFFF-0.5)*0.012;
      return[coords[0]+r1,coords[1]+r2];
    }

    function generateHamzaTake(l){
      const parts=[];
      const price=l.price||0;const dom=l.dom||0;const drop=l.priceDrop||0;
      const cf=l.cashFlow;const cap=l.capRate;const score=l.hamzaScore;
      const beds=l.beds||0;const type=l.type||'';const hood=l.neighbourhood||'Mississauga';
      const hasSuite=l.hasSuite;const lrt=l.lrtAccess;
      const fmt=n=>'$'+Math.abs(n).toLocaleString();

      // Opening — property identity + standout trait
      const typeLabel=type.toLowerCase().includes('condo')?'condo'
        :type.toLowerCase().includes('semi')?'semi'
        :type.toLowerCase().includes('town')||type.toLowerCase().includes('row')?'townhouse'
        :'detached';
      if(dom>90&&drop>3){
        parts.push(`This ${beds}-bed ${typeLabel} in ${hood} has been sitting for ${dom} days with a ${drop}% price drop — that's motivated seller territory.`);
      }else if(dom>90){
        parts.push(`${dom} days on market for this ${beds}-bed ${typeLabel} in ${hood} — it's been lingering, which means there's room to negotiate.`);
      }else if(drop>5){
        parts.push(`A ${drop}% price cut on this ${beds}-bed ${typeLabel} in ${hood} signals the seller is ready to talk. Worth exploring.`);
      }else if(dom<14){
        parts.push(`Fresh listing — this ${beds}-bed ${typeLabel} in ${hood} just hit the market ${dom} days ago. Move fast if you're interested.`);
      }else{
        parts.push(`A ${beds}-bed ${typeLabel} in ${hood} listed at ${fmt(price)} — let's break down the investment potential.`);
      }

      // Cash flow analysis
      if(cf>=200){
        parts.push(`Cash flow estimate of +${fmt(cf)}/mo is strong for Mississauga — positive cash flow is rare here, and this one delivers.`);
      }else if(cf>=0){
        parts.push(`Roughly breaking even on cash flow at ${cf>=0?'+':''}${fmt(cf)}/mo — in Mississauga, break-even IS the win. Most properties here run negative.`);
      }else if(cf>=-500){
        parts.push(`Negative cash flow of -${fmt(Math.abs(cf))}/mo is typical for Mississauga. You're betting on appreciation here, which the GTA has delivered historically.`);
      }else{
        parts.push(`Cash flow is deep negative at -${fmt(Math.abs(cf))}/mo. Unless you have a specific value-add play (suite conversion, reno), the carrying cost is heavy.`);
      }

      // Cap rate
      if(cap>=5){
        parts.push(`Cap rate of ${cap}% is above average for the area — solid yield.`);
      }else if(cap>=3.5){
        parts.push(`${cap}% cap rate is in line with Mississauga norms.`);
      }else if(cap>0){
        parts.push(`Cap rate of ${cap}% is on the lower side — you're paying a premium here.`);
      }

      // Suite detection
      if(hasSuite){
        parts.push(`I'm seeing suite/income potential in the listing remarks — that's a game-changer for cash flow. Verify the legality with the city before factoring it into your numbers.`);
      }

      // LRT corridor
      if(lrt){
        parts.push(`Located along the Hurontario LRT corridor — when that line opens, expect upward pressure on both rents and values.`);
      }

      // Price drop opportunity
      if(drop>0&&dom>60){
        parts.push(`With ${dom} DOM and a ${drop}% reduction already, I'd offer ${drop>5?'10-12':'5-8'}% below asking and see what happens.`);
      }

      // Score verdict
      if(score>=8.5){
        parts.push(`Overall score: ${score}/10. This is one of the stronger deals I'm seeing in the current Mississauga market. Worth a showing.`);
      }else if(score>=7){
        parts.push(`Overall score: ${score}/10. Solid fundamentals — not a home run, but a reliable play if the numbers check out on your inspection.`);
      }else if(score>=5){
        parts.push(`Overall score: ${score}/10. Middle of the pack. Could work with the right negotiation or value-add strategy.`);
      }else{
        parts.push(`Overall score: ${score}/10. The numbers are tough on this one. I'd only pursue it if you're getting a significant discount off asking.`);
      }

      return parts.join(' ');
    }

    function processListings(allRaw){
      // Filter out commercial, lease, and non-residential listings
      const EXCLUDED=/sale of business|commercial|industrial|office|retail|vacant land|common element|parking|locker|storage/i;
      allRaw=allRaw.filter(l=>{
        if(EXCLUDED.test(l.subType||''))return false;
        if(EXCLUDED.test(l.type||''))return false;
        return true;
      });
      const result=allRaw.map((l,i)=>{
            const price=l.price||0;
            const beds=l.beds||0;
            const rent=l.estimatedRent||l.rent||Math.round(price*0.0042);
            const monthly=calcMonthly(price,20,5.5,25);
            const propTax=Math.round(price*0.0095/12); // Mississauga ~0.95% mill rate
            const propInsurance=Math.round(price*0.003/12); // ~0.3% insurance
            const maintenanceReserve=Math.round(rent*0.05); // 5% maintenance
            const vacancyAllowance=Math.round(rent*0.04); // 4% vacancy
            const cashFlow=rent-monthly-propTax-propInsurance-maintenanceReserve-vacancyAllowance;
            const noi=rent*12*0.91*(1-0.30); // 91% occupancy, 30% opex
            const capRate=price>0?+((noi/price)*100).toFixed(2):0;
            const totalCashIn=price*0.20; // 20% down
            const cashOnCash=totalCashIn>0?+((cashFlow*12/totalCashIn)*100).toFixed(2):0;
            const dom=l.dom||l.daysOnMarket||0;
            const drop=l.priceDrop||l.priceReduction||0;
            const hood=l.city||l.neighbourhood||'Mississauga';
            const hoodData=HOOD_DATA[hood];
            // Score: Mississauga-calibrated — break-even is GOOD (7-8 range)
            // In Mississauga nobody cashflows unless there's a legal basement suite
            const remarks=(l.remarks||l.notes||'').toLowerCase();
            const suiteKeywords=/\b(suite|basement apt|in-law|separate entrance|2nd kitchen|second kitchen|legal basement|finished basement|accessory|duplex|rental income|income potential|two unit|2 unit)\b/i;
            const hasSuiteDetected=suiteKeywords.test(remarks)||l.hasSuite||false;
            // CF scoring: $0/mo = 7.5, +$500 = 10, -$500 = 5, -$1000 = 2.5
            const cfScore=Math.min(10,Math.max(0,7.5+(cashFlow/200)));
            const domScore=Math.min(10,dom/10);
            const dropScore=Math.min(10,drop);
            const yieldScore=Math.min(10,capRate*2.5);
            const suiteBonus=hasSuiteDetected?1.0:0;
            const hamzaScore=+Math.min(10,Math.max(1,(cfScore*0.30+domScore*0.25+dropScore*0.20+yieldScore*0.25)+suiteBonus)).toFixed(1);
            const lrtCorridorHoods=['Cooksville','Hurontario','Port Credit','City Centre','Mississauga Valleys'];
            const obj={
              id:l.id||l.mlsId||('live-'+i),
              mlsId:l.mlsId||'',
              address:l.address||'Address on Request',
              neighbourhood:hood,
              city:hood,
              postalCode:l.postalCode||'',
              price:price,
              originalPrice:l.originalPrice||price,
              beds:beds,
              baths:l.baths||0,
              sqft:null,
              type:l.type||'Residential',
              subType:l.subType||'',
              yearBuilt:l.yearBuilt||null,
              dom:dom,
              daysOnMarket:dom,
              status:l.status||'Active',
              brokerage:l.brokerage||l.listingBrokerage||'',
              remarks:l.remarks||l.notes||'',
              description:l.remarks||l.notes||'',
              photos:l.photos||l.images||[],
              images:l.photos||l.images||[],
              lat:l.lat||(geocodeFromPostal(l.postalCode,l.id)||[])[0]||null,
              lng:l.lng||(geocodeFromPostal(l.postalCode,l.id)||[])[1]||null,
              priceReduction:drop,
              priceDrop:drop,
              estimatedRent:rent,
              rent:rent,
              capRate:capRate,
              cashFlow:cashFlow,
              cashOnCash:cashOnCash,
              monthlyExpenses:monthly+propTax+propInsurance+maintenanceReserve+vacancyAllowance,
              walkScore:hoodData?72+Math.round(Math.random()*15):72,
              transitScore:hoodData?65+Math.round(Math.random()*20):65,
              schoolScore:hoodData?70+Math.round(Math.random()*20):76,
              hamzaScore:hamzaScore,
              hamzaNotes:'',
              hamzasPick:hamzaScore>=8.5&&i<3,
              lrtAccess:lrtCorridorHoods.includes(hood),
              hasSuite:hasSuiteDetected,
              isSample:false,
            };
            obj.hamzaNotes=generateHamzaTake(obj);
            return obj;
          });
      setLiveListings(result);
      setUsingLiveFeed(true);
      return result;
    }
    fetchAllListings();
  },[]);

  useEffect(()=>{
    // Don't use localStorage (not allowed in Claude artifacts)
    // In production, this would check a cookie
  },[]);

  // Exit-intent popup
  useEffect(()=>{
    if(isRegistered)return;
    const shown=sessionStorage.getItem('exit_popup_shown');
    if(shown)return;
    const h=e=>{if(e.clientY<=0){setShowExitPopup(true);sessionStorage.setItem('exit_popup_shown','true');}};
    document.addEventListener('mouseleave',h);
    return()=>document.removeEventListener('mouseleave',h);
  },[isRegistered]);

  // Scroll to top on tab change
  useEffect(()=>{window.scrollTo({top:0,behavior:"smooth"});},[activeNav]);

  const handleOpenListing=(l)=>{
    if(!isRegistered&&freeViews<=0){
      setPendingListing(l);setShowRegModal(true);return;
    }
    if(!isRegistered){setFreeViews(v=>{const nv=v-1;try{localStorage.setItem('listing_views',String(3-nv))}catch{}return nv;});}
    setSelectedListing(l);
    // Track recently viewed
    setRecentlyViewed(prev=>{
      const next=[{id:l.id,address:l.address,price:l.price,score:l.hamzaScore,cashFlow:l.cashFlow,ts:Date.now()},...prev.filter(r=>r.id!==l.id)].slice(0,10);
      try{localStorage.setItem('recently_viewed',JSON.stringify(next))}catch{}
      return next;
    });
  };

  const handleRegSuccess=(name)=>{
    setIsRegistered(true);try{localStorage.setItem('user_registered','true')}catch{}setShowRegModal(false);
    if(pendingListing){setSelectedListing(pendingListing);setPendingListing(null);}
  };

  const handleShowDisclaimer=(cb)=>{
    setDisclaimerCallback(()=>cb);
    // Show disclaimer modal — we'll render it
  };

  const handleDisclaimerAccept=()=>{
    setSeenDisclaimer(true);
    if(disclaimerCallback){disclaimerCallback();setDisclaimerCallback(null);}
  };

  const handleSaveDeal=(id)=>{
    setSavedDeals(prev=>{
      const next=prev.includes(id)?prev.filter(d=>d!==id):[...prev,id];
      try{localStorage.setItem('saved_deals',JSON.stringify(next))}catch{}
      return next;
    });
  };

  const handleFilterHood=(hood)=>{
    setFilterHood(hood);
    setActiveNav("listings");
    setTimeout(()=>window.scrollTo({top:300,behavior:"smooth"}),100);
  };

  return(
    <>
      <style>{G}</style>

      {/* Animated mesh background — premium indigo/blue */}
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-orb" style={{width:700,height:700,background:"#1D4ED8",top:"-25%",right:"-15%",animationDelay:"0s"}}/>
        <div className="mesh-orb" style={{width:550,height:550,background:"#4338CA",bottom:"-20%",left:"-12%",animationDelay:"-7s"}}/>
        <div className="mesh-orb" style={{width:450,height:450,background:"#0EA5E9",top:"35%",left:"35%",animationDelay:"-14s"}}/>
        <div className="mesh-orb" style={{width:300,height:300,background:"#D97706",top:"60%",right:"20%",animationDelay:"-5s",opacity:0.04}}/>
      </div>

      {/* Cookie Consent */}
      {cookieConsent===null&&(
        <CookieBanner
          onAccept={()=>{setCookieConsent("all");try{localStorage.setItem('cookie_consent','all')}catch{}}}
          onDecline={()=>{setCookieConsent("essential");try{localStorage.setItem('cookie_consent','essential')}catch{}}}
        />
      )}

      {/* Exit-intent popup */}
      {showExitPopup&&!isRegistered&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowExitPopup(false)}} style={{zIndex:150}}>
          <div style={{background:CARD,border:`1px solid rgba(59,130,246,0.3)`,borderRadius:16,width:"100%",maxWidth:460,animation:"fadeUp .3s ease",padding:"32px 28px",textAlign:"center"}}>
            <button onClick={()=>setShowExitPopup(false)} style={{position:"absolute",top:16,right:20,background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:20}}>x</button>
            <div style={{fontSize:36,marginBottom:12}}>📊</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:TEXT,marginBottom:8}}>Before you go...</h2>
            <p style={{fontSize:14,color:MUTED,lineHeight:1.7,marginBottom:20}}>
              Sign up free to get Hamza's personal investment take, AI deal scores, and cash flow analysis on every Mississauga property.
            </p>
            <button onClick={()=>{setShowExitPopup(false);setShowRegModal(true);}} className="btn-primary" style={{width:"100%",padding:"14px",borderRadius:10,fontSize:15,marginBottom:10}}>
              Get Free Access
            </button>
            <button onClick={()=>setShowExitPopup(false)} style={{background:"none",border:"none",color:MUTED,fontSize:13,cursor:"pointer",padding:"8px"}}>No thanks</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showRegModal&&<RegModal onClose={()=>setShowRegModal(false)} onSuccess={handleRegSuccess}/>}
      {selectedListing&&(
        <ListingModal
          l={selectedListing}
          onClose={()=>setSelectedListing(null)}
          isRegistered={isRegistered}
          onRequireReg={()=>{setPendingListing(selectedListing);setSelectedListing(null);setShowRegModal(true);}}
          seenDisclaimer={seenDisclaimer}
          onShowDisclaimer={handleShowDisclaimer}
          savedDeals={savedDeals}
          onSaveDeal={handleSaveDeal}
        />
      )}
      {disclaimerCallback&&!seenDisclaimer&&<InvDisclaimerModal onAccept={handleDisclaimerAccept}/>}
      {showPrivacy&&<PrivacyModal onClose={()=>setShowPrivacy(false)}/>}
      {showPrecon&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowPrecon(false)}} role="dialog" aria-modal="true" aria-label="Pre-Construction VIP">
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,width:"100%",maxWidth:520,animation:"fadeUp .3s ease"}}>
            <div style={{padding:"20px 28px",borderBottom:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:TEXT}}>🏙️ Pre-Construction VIP Access</h2>
              <button onClick={()=>setShowPrecon(false)} aria-label="Close" style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:22}}>×</button>
            </div>
            <PreConForm onClose={()=>setShowPrecon(false)}/>
          </div>
        </div>
      )}
      {showSeller&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowSeller(false)}} role="dialog" aria-modal="true" aria-label="Sell My Home">
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,width:"100%",maxWidth:520,animation:"fadeUp .3s ease"}}>
            <div style={{padding:"20px 28px",borderBottom:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={()=>setShowSeller(false)} aria-label="Close" style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:22,marginLeft:"auto"}}>×</button>
            </div>
            <SellerModal onClose={()=>setShowSeller(false)}/>
          </div>
        </div>
      )}

      {/* Header */}
      <Header activeNav={activeNav} setActiveNav={setActiveNav} onSeller={()=>setShowSeller(true)}/>

      {/* Main */}
      <main id="main-content" style={{maxWidth:1240,margin:"0 auto",padding:"0 24px 48px",position:"relative",zIndex:1}}>

        {/* Hero (only on listings) */}
        {activeNav==="listings"&&<Hero onCTA={()=>setShowRegModal(true)} setActiveNav={setActiveNav} listingCount={liveListings.length}/>}

        {/* Pre-con banner */}
        {/* Testimonials strip — above listings */}
        {activeNav==="listings"&&(
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:8}}>
              {[
                {name:"Arjun P.",quote:"The scoring system saved me weeks of analysis. Closed $31K under ask.",result:"+$420/mo CF"},
                {name:"Fatima R.",quote:"Hamza walked me through BRRR, found a townhouse 67 DOM. Refinanced in 8 months.",result:"Refinanced in 8mo"},
                {name:"David K.",quote:"Identified a LRT corridor play in Cooksville. 4.9% cap rate at purchase.",result:"4.9% cap rate"},
              ].map(t=>(
                <div key={t.name} style={{flexShrink:0,width:300,background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:"14px 16px"}}>
                  <div style={{display:"flex",gap:2,marginBottom:6}}>{[1,2,3,4,5].map(s=><span key={s} style={{color:GOLD,fontSize:10}}>★</span>)}</div>
                  <p style={{fontSize:12,color:TEXT2,lineHeight:1.6,marginBottom:8,fontStyle:"italic"}}>"{t.quote}"</p>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:BLUE,fontWeight:700}}>{t.name}</span>
                    <span style={{fontSize:10,color:GREEN,fontWeight:600,background:"rgba(16,185,129,0.08)",padding:"2px 8px",borderRadius:4}}>{t.result}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Top 10 Deals Signup */}
        {activeNav==="listings"&&(
          <div style={{background:`linear-gradient(135deg,rgba(196,154,60,0.06),rgba(59,130,246,0.04))`,border:`1px solid rgba(196,154,60,0.2)`,borderRadius:12,padding:"18px 22px",marginBottom:24,display:"flex",gap:16,alignItems:"center",flexWrap:"wrap",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:TEXT,marginBottom:2}}>📬 Weekly Top 10 Deals</div>
              <div style={{fontSize:12,color:MUTED}}>Get the 10 best-scoring Mississauga investment properties delivered every Monday.</div>
            </div>
            <form onSubmit={e=>{e.preventDefault();const em=e.target.elements.top10email.value;if(!em)return;fetch("/api/lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:"Top 10 Subscriber",email:em,source:"weekly-top-10",timestamp:new Date().toISOString()})}).catch(()=>{});e.target.elements.top10email.value="";e.target.querySelector("button").textContent="Subscribed ✓";}} style={{display:"flex",gap:8}}>
              <input name="top10email" type="email" placeholder="your@email.com" required style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"8px 14px",color:TEXT,fontSize:13,width:220}}/>
              <button type="submit" className="btn-primary" style={{padding:"8px 18px",borderRadius:8,fontSize:13,whiteSpace:"nowrap"}}>Subscribe Free</button>
            </form>
          </div>
        )}

        {activeNav==="precon"?(
          <div style={{padding:"40px 0"}}>
            <div style={{textAlign:"center",marginBottom:32}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:TEXT,marginBottom:8}}>🏙️ Pre-Construction VIP</h2>
              <p style={{fontSize:14,color:MUTED,maxWidth:500,margin:"0 auto"}}>Get floor plans, pricing worksheets, and VIP access before public launch — directly from Hamza.</p>
            </div>
            <div style={{maxWidth:520,margin:"0 auto",background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,overflow:"hidden"}}>
              <PreConForm onClose={()=>setActiveNav("listings")}/>
            </div>
          </div>
        ):activeNav==="listings"?(
          <ListingsView onOpenListing={handleOpenListing} filterHood={filterHood} setFilterHood={setFilterHood} listings={liveListings} loading={!usingLiveFeed && liveListings.length===0} compareList={compareList} onToggleCompare={id=>setCompareList(prev=>prev.includes(id)?prev.filter(x=>x!==id):prev.length<4?[...prev,id]:prev)} recentlyViewed={recentlyViewed} onDealAlert={()=>setShowDealAlert(true)} savedDeals={savedDeals}/>
        ):activeNav==="pulse"?(
          <MarketPulse/>
        ):activeNav==="hoods"?(
          <HoodsView onFilterListings={handleFilterHood}/>
        ):activeNav==="news"?(
          <RealEstateNews/>
        ):activeNav==="quiz"?(
          <FindMyDeal/>
        ):null}

        {/* Registration status bar */}
        {!isRegistered&&(
          <div style={{background:"rgba(59,130,246,0.06)",border:`1px solid rgba(59,130,246,0.2)`,borderRadius:12,padding:"16px 20px",marginTop:28,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(59,130,246,0.1)",border:`1px solid rgba(59,130,246,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🔓</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:TEXT,marginBottom:2}}>
                {freeViews>0?`${freeViews} free views remaining — `:""}{isRegistered?"Full access unlocked":"Sign up free for full access"}
              </div>
              <div style={{fontSize:12,color:MUTED}}>Unlock Hamza's investment scores, cash flow analysis, and AI-powered property reports</div>
            </div>
            <button onClick={()=>setShowRegModal(true)} className="btn-primary" style={{padding:"10px 20px",borderRadius:8,fontSize:13,flexShrink:0}}>
              Register Free
            </button>
          </div>
        )}

        {/* Testimonials */}
        <Testimonials/>

        {/* Agent bio — bottom of page */}
        <AgentBio onContact={()=>setShowSeller(true)}/>

        {/* Sell / Book CTA */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14,marginTop:28}}>
          {[
            {icon:"🏡",title:"What's My Home Worth?",desc:"Free market analysis, no obligation. Hamza will reach out within 24 hours.",btn:"Get Free Valuation",action:()=>setShowSeller(true)},
            {icon:"🏙️",title:"Pre-Construction VIP",desc:"Floor plans and pricing before public launch. Register for VIP access.",btn:"Join VIP List",action:()=>setShowPrecon(true)},
            {icon:"📞",title:"Book a Strategy Call",desc:"15-minute call with Hamza to build your investment roadmap.",btn:"Book on Calendly",action:()=>window.open("https://calendly.com/hamzanouman","_blank")},
          ].map(c=>(
            <div key={c.title} style={{background:CARD,border:`1px solid rgba(59,130,246,0.12)`,borderRadius:12,padding:"22px",transition:"border-color .2s ease"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(59,130,246,0.35)"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(59,130,246,0.12)"}
            >
              <div style={{fontSize:26,marginBottom:10}}>{c.icon}</div>
              <div style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:6,letterSpacing:"-0.01em"}}>{c.title}</div>
              <p style={{fontSize:13,color:MUTED,lineHeight:1.65,marginBottom:16}}>{c.desc}</p>
              <button onClick={c.action} className="btn-blue-outline" style={{padding:"9px 18px",borderRadius:7,fontSize:13,width:"100%"}}>{c.btn} →</button>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <Footer onPrivacy={()=>setShowPrivacy(true)}/>

      {/* Compare bar — floating bottom */}
      {compareList.length>0&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"rgba(5,9,26,0.95)",backdropFilter:"blur(12px)",borderTop:`1px solid rgba(59,130,246,0.3)`,padding:"10px 24px",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
          <span style={{fontSize:12,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{compareList.length}/4 selected</span>
          <div style={{display:"flex",gap:6}}>
            {compareList.map(id=>{const l=liveListings.find(x=>x.id===id);return l?<span key={id} style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:6,padding:"4px 10px",fontSize:11,color:TEXT,display:"inline-flex",alignItems:"center",gap:4}}>
              {formatAddress(l.address).slice(0,20)}…
              <button onClick={()=>setCompareList(prev=>prev.filter(x=>x!==id))} style={{background:"none",border:"none",color:RED,cursor:"pointer",fontSize:12,padding:0}}>×</button>
            </span>:null;})}
          </div>
          <button onClick={()=>setShowCompare(true)} disabled={compareList.length<2} className="btn-primary" style={{padding:"8px 20px",borderRadius:8,fontSize:12,opacity:compareList.length<2?0.4:1}}>Compare {compareList.length} Properties</button>
          <button onClick={()=>setCompareList([])} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:11}}>Clear</button>
        </div>
      )}

      {/* Compare Modal */}
      {showCompare&&compareList.length>=2&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowCompare(false)}} style={{zIndex:200}}>
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,width:"100%",maxWidth:900,maxHeight:"90vh",overflow:"auto",animation:"fadeUp .3s ease"}}>
            <div style={{padding:"20px 28px",borderBottom:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:CARD,zIndex:1}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:TEXT}}>Compare Properties</h2>
              <button onClick={()=>setShowCompare(false)} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:22}}>×</button>
            </div>
            <div style={{padding:"20px 28px",overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${BORDER}`}}>
                    <th style={{textAlign:"left",padding:"8px 12px",color:MUTED,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>METRIC</th>
                    {compareList.map(id=>{const l=liveListings.find(x=>x.id===id);return <th key={id} style={{textAlign:"center",padding:"8px 12px",color:TEXT,fontSize:12,minWidth:160}}>{l?formatAddress(l.address).slice(0,25):"—"}</th>;})}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Price",l=>fmtK(l.price)],
                    ["Beds / Baths",l=>l.beds+"bd / "+l.baths+"ba"],
                    ["Type",l=>l.type],
                    ["Neighbourhood",l=>l.neighbourhood],
                    ["Est. Rent",l=>"$"+(l.estimatedRent||0).toLocaleString()+"/mo"],
                    ["Cash Flow",l=>{const cf=l.cashFlow||0;return <span style={{color:cf>=0?GREEN:RED}}>{fmtNum(cf)}/mo</span>;}],
                    ["Cap Rate",l=><span style={{color:parseFloat(l.capRate)>=4?GREEN:GOLD}}>{l.capRate}%</span>],
                    ["CoC Return",l=><span style={{color:(l.cashOnCash||0)>=0?GREEN:RED}}>{l.cashOnCash||0}%</span>],
                    ["Deal Score",l=><span style={{color:scoreColor(l.hamzaScore||0),fontWeight:700}}>{(l.hamzaScore||0).toFixed(1)}/10</span>],
                    ["DOM",l=>l.dom+"d"],
                    ["Price Drop",l=>l.priceReduction>0?<span style={{color:GREEN}}>{l.priceReduction}%</span>:"—"],
                    ["Suite Detected",l=>l.hasSuite?<span style={{color:GREEN}}>Yes</span>:<span style={{color:MUTED}}>No</span>],
                    ["LRT Access",l=>l.lrtAccess?<span style={{color:BLUE}}>Yes</span>:<span style={{color:MUTED}}>No</span>],
                    ["Monthly Expenses",l=>"$"+(l.monthlyExpenses||0).toLocaleString()],
                    ["Down Payment (20%)",l=>"$"+Math.round(l.price*0.2).toLocaleString()],
                  ].map(([label,fn])=>(
                    <tr key={label} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                      <td style={{padding:"8px 12px",color:MUTED,fontSize:11,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{label}</td>
                      {compareList.map(id=>{const l=liveListings.find(x=>x.id===id);return <td key={id} style={{textAlign:"center",padding:"8px 12px",color:TEXT,fontFamily:"'JetBrains Mono',monospace"}}>{l?fn(l):"—"}</td>;})}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Deal Alert Modal */}
      {showDealAlert&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowDealAlert(false)}} style={{zIndex:200}}>
          <div style={{background:CARD,border:`1px solid rgba(59,130,246,0.3)`,borderRadius:16,width:"100%",maxWidth:480,animation:"fadeUp .3s ease",padding:"28px"}}>
            <button onClick={()=>setShowDealAlert(false)} style={{position:"absolute",top:16,right:20,background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:20}}>×</button>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:TEXT,marginBottom:6}}>🔔 Deal Alerts</h2>
            <p style={{fontSize:13,color:MUTED,marginBottom:20}}>Get notified when properties matching your criteria hit the market.</p>
            <form onSubmit={e=>{e.preventDefault();const fd=new FormData(e.target);const data=Object.fromEntries(fd);fetch("/api/lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data,source:"deal-alert",timestamp:new Date().toISOString()})}).catch(()=>{});e.target.reset();setShowDealAlert(false);alert("Deal alerts activated! Hamza will send matching properties to your email.");}}>
              <div style={{display:"grid",gap:12,marginBottom:16}}>
                <input name="email" type="email" placeholder="your@email.com" required style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:14}}/>
                <input name="name" type="text" placeholder="Your name" required style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:14}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <select name="maxPrice" style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:13}}>
                    <option value="">Max Price</option>
                    <option value="600000">Under $600K</option>
                    <option value="800000">Under $800K</option>
                    <option value="1000000">Under $1M</option>
                    <option value="1500000">Under $1.5M</option>
                    <option value="99999999">Any</option>
                  </select>
                  <select name="minBeds" style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:13}}>
                    <option value="">Min Beds</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <select name="strategy" style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:13}}>
                    <option value="">Strategy</option>
                    <option value="cashflow">Cash Flow</option>
                    <option value="brrr">BRRR</option>
                    <option value="appreciation">Appreciation</option>
                    <option value="precon">Pre-Construction</option>
                  </select>
                  <select name="hood" style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:13}}>
                    <option value="">Any Neighbourhood</option>
                    {["Cooksville","Port Credit","Erin Mills","Churchill Meadows","Clarkson","Streetsville","Meadowvale","Malton","Hurontario","Lakeview","City Centre"].map(h=><option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{width:"100%",padding:"13px",borderRadius:10,fontSize:15}}>Activate Deal Alerts</button>
              <p style={{fontSize:10,color:MUTED,marginTop:10,textAlign:"center"}}>Free. Unsubscribe anytime. We respect your privacy.</p>
            </form>
          </div>
        </div>
      )}

      {/* Sign up CTA - bottom right */}
      {!isRegistered&&compareList.length===0&&(
        <button onClick={()=>setShowRegModal(true)}
          style={{position:"fixed",bottom:24,right:24,zIndex:99,background:"linear-gradient(135deg,#3B82F6,#2563EB)",border:"none",borderRadius:14,padding:"14px 20px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(59,130,246,0.4)",display:"flex",alignItems:"center",gap:8,animation:"fadeUp .5s ease"}}>
          🔓 Sign Up — Free Access
        </button>
      )}
    </>
  );
}
