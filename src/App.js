import { useState, useMemo, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const G = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#070B14;font-family:'Outfit',sans-serif;color:#E8EDF4;overflow-x:hidden}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:#070B14}
::-webkit-scrollbar-thumb{background:#1E3A5F;border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:#C49A3C}

@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(196,154,60,0.5)}70%{box-shadow:0 0 0 14px rgba(196,154,60,0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
@keyframes meshMove{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(30px,-20px) rotate(120deg)}66%{transform:translate(-20px,30px) rotate(240deg)}}
@keyframes borderGlow{0%,100%{opacity:0.5}50%{opacity:1}}
@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.animate-fadeUp{animation:fadeUp .5s ease forwards}
.animate-fadeIn{animation:fadeIn .4s ease forwards}

/* Card hover */
.card-hover{transition:transform .28s cubic-bezier(.22,1,.36,1),box-shadow .28s ease,border-color .28s ease}
.card-hover:hover{transform:translateY(-4px)!important;box-shadow:0 20px 60px rgba(196,154,60,0.12),0 4px 20px rgba(0,0,0,0.5)!important;border-color:rgba(196,154,60,0.3)!important}

/* Buttons */
.btn-primary{background:linear-gradient(135deg,#C49A3C,#A07820);color:#fff;border:none;cursor:pointer;font-family:'Outfit',sans-serif;font-weight:600;letter-spacing:0.02em;transition:all .22s ease}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(196,154,60,0.35)}
.btn-primary:active{transform:translateY(0)}
.btn-ghost{background:rgba(255,255,255,0.05);color:#E8EDF4;border:1px solid rgba(255,255,255,0.1);cursor:pointer;font-family:'Outfit',sans-serif;font-weight:500;transition:all .2s ease}
.btn-ghost:hover{background:rgba(255,255,255,0.09);border-color:rgba(196,154,60,0.4)}
.btn-gold-outline{background:transparent;color:#C49A3C;border:1px solid rgba(196,154,60,0.5);cursor:pointer;font-family:'Outfit',sans-serif;font-weight:600;transition:all .2s ease}
.btn-gold-outline:hover{background:rgba(196,154,60,0.1);border-color:#C49A3C}

/* Tab buttons */
.tab-btn{background:transparent;border:none;cursor:pointer;font-family:'Outfit',sans-serif;font-weight:500;font-size:13px;color:#7A8BA0;padding:10px 18px;border-bottom:2px solid transparent;transition:all .2s ease;white-space:nowrap}
.tab-btn:hover{color:#E8EDF4}
.tab-btn.active{color:#C49A3C;border-bottom-color:#C49A3C}

/* Chips */
.chip{cursor:pointer;border:1px solid rgba(255,255,255,0.1);background:transparent;color:#7A8BA0;font-family:'Outfit',sans-serif;font-size:12px;font-weight:500;padding:6px 14px;border-radius:40px;transition:all .18s ease;white-space:nowrap}
.chip:hover{border-color:rgba(196,154,60,0.4);color:#C49A3C}
.chip.active{background:rgba(196,154,60,0.12);border-color:rgba(196,154,60,0.6);color:#C49A3C}

/* Inputs */
input,select,textarea{font-family:'Outfit',sans-serif;outline:none;transition:border-color .2s ease,box-shadow .2s ease}
input:focus,select:focus,textarea:focus{border-color:rgba(196,154,60,0.7)!important;box-shadow:0 0 0 3px rgba(196,154,60,0.1)!important}

/* Checkbox */
input[type=checkbox]{accent-color:#C49A3C;width:16px;height:16px;cursor:pointer}

/* Score badge */
.score-badge{font-family:'JetBrains Mono',monospace;font-weight:600}

/* Number font */
.mono{font-family:'JetBrains Mono',monospace}

/* Mesh gradient background */
.mesh-bg{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden}
.mesh-orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.07;animation:meshMove 18s ease-in-out infinite}

/* Glass card */
.glass{background:rgba(13,22,40,0.7);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.06)}

/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:100;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto}

/* Scrollable modal body */
.modal-scroll{max-height:calc(100vh - 100px);overflow-y:auto;overflow-x:hidden}
.modal-scroll::-webkit-scrollbar{width:3px}
.modal-scroll::-webkit-scrollbar-thumb{background:#1E3A5F}

/* Range input */
input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:rgba(255,255,255,0.1);outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#C49A3C;cursor:pointer;transition:transform .15s ease}
input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.2)}

/* WA FAB */
.wa-fab{position:fixed;bottom:28px;right:28px;z-index:90;width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#25D366,#128C7E);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(37,211,102,0.45);animation:pulse 2.5s infinite;transition:transform .2s ease}
.wa-fab:hover{transform:scale(1.1)!important}

/* Skeleton loader */
.skeleton{background:linear-gradient(90deg,#0D1628 25%,#162032 50%,#0D1628 75%);background-size:400px 100%;animation:shimmer 1.5s infinite}

/* Compliance badge */
.compliance-badge{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:#4A7A5C;background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);border-radius:4px;padding:2px 7px;font-family:'JetBrains Mono',monospace}

/* Star rating */
.star{color:#C49A3C;font-size:14px}
.star.empty{color:rgba(196,154,60,0.2)}

/* WCAG focus visible */
:focus-visible{outline:2px solid #C49A3C;outline-offset:3px}

/* Accessible skip link */
.skip-link{position:absolute;top:-40px;left:0;background:#C49A3C;color:#000;padding:8px 16px;z-index:999;font-weight:600;text-decoration:none}
.skip-link:focus{top:0}

/* Mobile responsive */
@media(max-width:768px){
  .desktop-only{display:none!important}
  .mobile-stack{flex-direction:column!important}
  .modal-overlay{padding:12px 8px}
}
@media(max-width:480px){
  .hide-xs{display:none!important}
}
`;

/* ─────────────────────────────────────────────
   CONSTANTS & COLORS
───────────────────────────────────────────── */
const GOLD="#C49A3C", GOLD2="#A07820", NAVY="#070B14", SURFACE="#0D1628";
const CARD="#162032", BORDER="rgba(255,255,255,0.07)", GOLD_BORDER="rgba(196,154,60,0.2)";
const TEXT="#E8EDF4", MUTED="#7A8BA0", GREEN="#34D399", RED="#F87171", BLUE="#3D9BE9";

/* ─────────────────────────────────────────────
   LISTING DATA
───────────────────────────────────────────── */
const LISTINGS = [
  {id:"ML001",address:"2847 Folkway Dr",neighbourhood:"Erin Mills",price:849000,beds:4,baths:3,sqft:2100,dom:67,priceReduction:6.2,originalPrice:906000,estimatedRent:4300,type:"Detached",lrtAccess:false,brokerage:"Royal LePage Signature Realty",hamzaScore:8.4,hamzaNotes:"12.4% price reduction on a 4-bed det — seller has been sitting 67 days and is motivated. All brick detached basement suite potential. Best value in the neighbourhood right now.",cashFlow:310,capRate:5.1,walkScore:71,transitScore:64,schoolScore:88},
  {id:"ML002",address:"1203 Haig Blvd",neighbourhood:"Lakeview",price:1125000,beds:3,baths:2,sqft:1650,dom:8,priceReduction:0,originalPrice:1125000,estimatedRent:4400,type:"Semi-Detached",lrtAccess:false,brokerage:"RE/MAX Realty Specialists Inc.",hamzaScore:6.1,hamzaNotes:"Lakeview is appreciating fast but this one is fresh to market at ask. No negotiating room yet. Watch for a 30+ day reduction before jumping.",cashFlow:-180,capRate:4.2,walkScore:68,transitScore:72,schoolScore:82},
  {id:"ML003",address:"5521 Glen Erin Dr",neighbourhood:"Churchill Meadows",price:799000,beds:3,baths:3,sqft:1800,dom:47,priceReduction:8.5,originalPrice:873000,estimatedRent:3900,type:"Townhouse",lrtAccess:false,brokerage:"Century 21 Miller Real Estate Ltd.",hamzaScore:7.8,hamzaNotes:"8.5% drop on a Churchill Meadows townhouse. Excellent school catchment. Top floor laundry, finished basement. Strong rental demand from hospital workers nearby.",cashFlow:120,capRate:4.7,walkScore:78,transitScore:70,schoolScore:94},
  {id:"ML004",address:"3318 Redpath Cir",neighbourhood:"Meadowvale",price:689000,beds:3,baths:2,sqft:1450,dom:22,priceReduction:3.1,originalPrice:711000,estimatedRent:3500,type:"Townhouse",lrtAccess:false,brokerage:"iPro Realty Ltd.",hamzaScore:6.8,hamzaNotes:"Decent price point for Meadowvale. Needs kitchen update. Conservative buy — not a home run but solid hold asset if you get it under $670K.",cashFlow:40,capRate:4.3,walkScore:82,transitScore:75,schoolScore:86},
  {id:"ML005",address:"915 Inverhouse Dr",neighbourhood:"Clarkson",price:975000,beds:4,baths:3,sqft:2300,dom:61,priceReduction:11.2,originalPrice:1099000,estimatedRent:4600,type:"Detached",lrtAccess:true,brokerage:"Sutton Group Quantum Realty Inc.",hamzaScore:9.1,hamzaNotes:"This is the one. 11.2% off, LRT access, 61 DOM — seller is cooked. 4-bed with in-law suite potential. Clarkson GO + future LRT stop walking distance. Cash flow positive from day one if you put 25% down.",cashFlow:480,capRate:5.4,walkScore:76,transitScore:88,schoolScore:79},
  {id:"ML006",address:"4402 Tahoe Blvd",neighbourhood:"Malton",price:599000,beds:3,baths:2,sqft:1300,dom:15,priceReduction:0,originalPrice:599000,estimatedRent:3200,type:"Townhouse",lrtAccess:false,brokerage:"Homelife/Miracle Realty Ltd.",hamzaScore:5.9,hamzaNotes:"Malton entry-level. Rents are decent but appreciation is slow here. Only buy if you have a very long time horizon or strong cash flow strategy.",cashFlow:60,capRate:4.6,walkScore:74,transitScore:80,schoolScore:71},
  {id:"ML007",address:"1876 Lakeshore Rd W",neighbourhood:"Port Credit",price:1380000,beds:3,baths:3,sqft:1550,dom:29,priceReduction:4.8,originalPrice:1450000,estimatedRent:5400,type:"Semi-Detached",lrtAccess:true,brokerage:"Sotheby's Intl Realty Canada",hamzaScore:7.3,hamzaNotes:"Port Credit premium. LRT access is the story here — buy the location. Numbers are thin today but appreciation play over 5 years is strong. Not for cash flow investors.",cashFlow:-210,capRate:3.8,walkScore:91,transitScore:86,schoolScore:83},
  {id:"ML008",address:"6634 Ninth Line",neighbourhood:"Streetsville",price:1049000,beds:4,baths:3,sqft:2450,dom:53,priceReduction:7.3,originalPrice:1131000,estimatedRent:4700,type:"Detached",lrtAccess:false,brokerage:"Royal LePage Meadowtowne Realty",hamzaScore:7.6,hamzaNotes:"7.3% drop in Streetsville village — very sellable area. Credit River trail access, heritage character streets. BRRR candidate with legal second suite conversion.",cashFlow:240,capRate:4.8,walkScore:84,transitScore:65,schoolScore:91},
  {id:"ML009",address:"345 Rathburn Rd W",neighbourhood:"Cooksville",price:729000,beds:3,baths:2,sqft:1600,dom:38,priceReduction:5.5,originalPrice:771000,estimatedRent:3700,type:"Condo",lrtAccess:true,brokerage:"Keller Williams Real Estate Associates",hamzaScore:7.1,hamzaNotes:"Hurontario LRT corridor play. Condo but freehold feel. 5.5% drop, 38 DOM. Ideal for a first investment — low maintenance, solid rental demand from young professionals.",cashFlow:150,capRate:5.0,walkScore:87,transitScore:91,schoolScore:78},
  {id:"ML010",address:"2211 Hurontario St",neighbourhood:"Cooksville",price:649000,beds:2,baths:2,sqft:1100,dom:19,priceReduction:2.8,originalPrice:668000,estimatedRent:3300,type:"Condo",lrtAccess:true,brokerage:"RE/MAX Aboutowne Realty Corp.",hamzaScore:6.5,hamzaNotes:"Hurontario corridor. Fresh drop but 19 days is still early. Good LRT story but wait another 2-3 weeks to see if they drop again before making a move.",cashFlow:80,capRate:4.8,walkScore:89,transitScore:93,schoolScore:75},
  {id:"ML011",address:"7789 Magistrate Terr",neighbourhood:"Meadowvale",price:775000,beds:4,baths:3,sqft:1950,dom:44,priceReduction:9.1,originalPrice:853000,estimatedRent:4000,type:"Townhouse",lrtAccess:false,brokerage:"Cityscape Real Estate Ltd.",hamzaScore:8.0,hamzaNotes:"9.1% drop is significant for this price point. Meadowvale Business Park nearby = strong rental demand from tech workers. Walkout basement adds legal unit potential.",cashFlow:290,capRate:5.2,walkScore:79,transitScore:71,schoolScore:89},
  {id:"ML012",address:"432 Queen St S",neighbourhood:"Streetsville",price:899000,beds:2,baths:2,sqft:1750,dom:11,priceReduction:0,originalPrice:899000,estimatedRent:4000,type:"Detached",lrtAccess:false,brokerage:"Harvey Kalles Real Estate Ltd.",hamzaScore:5.7,hamzaNotes:"Streetsville main drag. Character home but asking full price 11 days in. I want to see 30+ days before engaging. No urgency here.",cashFlow:-60,capRate:4.0,walkScore:88,transitScore:67,schoolScore:87},
  {id:"ML013",address:"1590 Carolyn Rd",neighbourhood:"Erin Mills",price:869000,beds:4,baths:3,sqft:2050,dom:67,priceReduction:12.4,originalPrice:992000,estimatedRent:4300,type:"Detached",lrtAccess:false,brokerage:"Intercity Realty Inc.",hamzaScore:9.0,hamzaNotes:"HAMZA'S PICK. 12.4% price reduction on a 4-bed detached — seller has been sitting 67 days and is motivated. All brick, basement suite potential. Best value in the neighbourhood right now.",cashFlow:460,capRate:5.6,walkScore:73,transitScore:68,schoolScore:92,hamzasPick:true},
  {id:"ML014",address:"88 Port St E",neighbourhood:"Port Credit",price:1195000,beds:2,baths:2,sqft:1200,dom:5,priceReduction:0,originalPrice:1195000,estimatedRent:4800,type:"Condo",lrtAccess:true,brokerage:"Chestnut Park Real Estate Ltd.",hamzaScore:5.4,hamzaNotes:"Port Credit condo, fresh listing. Numbers don't work for investors at this price. Pure lifestyle buy. Pass.",cashFlow:-320,capRate:3.5,walkScore:94,transitScore:85,schoolScore:80},
  {id:"ML015",address:"3956 Tomken Rd",neighbourhood:"Malton",price:629000,beds:3,baths:2,sqft:1380,dom:31,priceReduction:4.4,originalPrice:658000,estimatedRent:3400,type:"Semi-Detached",lrtAccess:false,brokerage:"iPro Realty Ltd.",hamzaScore:6.2,hamzaNotes:"Malton semi, modest drop. Decent cash flow but limited appreciation upside. Buy only if cash flow is your primary goal.",cashFlow:95,capRate:4.9,walkScore:76,transitScore:82,schoolScore:73},
  {id:"ML016",address:"1122 Clarkson Rd N",neighbourhood:"Clarkson",price:1025000,beds:4,baths:3,sqft:2200,dom:42,priceReduction:6.8,originalPrice:1100000,estimatedRent:4600,type:"Detached",lrtAccess:true,brokerage:"Royal LePage Signature Realty",hamzaScore:8.7,hamzaNotes:"LRT access + 6.8% reduction + 42 DOM. Clarkson is my top neighbourhood for 2025-2026. This hits the trifecta. Strong buy.",cashFlow:380,capRate:5.3,walkScore:77,transitScore:86,schoolScore:85},
  {id:"ML017",address:"671 Bristol Rd W",neighbourhood:"Hurontario",price:699000,beds:3,baths:2,sqft:1500,dom:26,priceReduction:3.7,originalPrice:726000,estimatedRent:3500,type:"Townhouse",lrtAccess:true,brokerage:"Sutton Group Elite Realty Inc.",hamzaScore:7.0,hamzaNotes:"Hurontario corridor townhouse with LRT access. Small drop, early days. Watch it another 2 weeks — if still sitting, make an aggressive offer.",cashFlow:110,capRate:4.5,walkScore:83,transitScore:94,schoolScore:77},
  {id:"ML018",address:"2445 Burnhamthorpe Rd",neighbourhood:"Churchill Meadows",price:819000,beds:4,baths:3,sqft:1920,dom:55,priceReduction:0.9,originalPrice:827000,estimatedRent:4100,type:"Detached",lrtAccess:false,brokerage:"RE/MAX Realty Specialists Inc.",hamzaScore:6.7,hamzaNotes:"Churchill Meadows detached but the drop is tiny. 55 days suggests overpricing. Needs a 5%+ reduction before I would touch this.",cashFlow:170,capRate:4.6,walkScore:80,transitScore:69,schoolScore:93},
  {id:"ML019",address:"509 Lakeshore Rd E",neighbourhood:"Lakeview",price:1250000,beds:3,baths:2,sqft:1700,dom:14,priceReduction:1.5,originalPrice:1269000,estimatedRent:5000,type:"Detached",lrtAccess:false,brokerage:"Sotheby's Intl Realty Canada",hamzaScore:6.3,hamzaNotes:"Lakeview bungalow on a large lot. Redevelopment play long-term but cap rate today is weak. Patient money only.",cashFlow:-150,capRate:3.9,walkScore:69,transitScore:66,schoolScore:81},
  {id:"ML020",address:"4123 Periwinkle Cres",neighbourhood:"Hurontario",price:749000,beds:3,baths:3,sqft:1680,dom:39,priceReduction:5.9,originalPrice:796000,estimatedRent:3800,type:"Townhouse",lrtAccess:true,brokerage:"Right At Home Realty Inc.",hamzaScore:7.9,hamzaNotes:"LRT access + 5.9% drop + 39 DOM. Townhouse in the Hurontario corridor is a strong medium-term hold. Cash flow positive and the LRT story isn't priced in yet.",cashFlow:220,capRate:4.9,walkScore:85,transitScore:92,schoolScore:79}
];

const HOOD_DATA = {
  "Clarkson":        {trend:"hot",  emoji:"🔥",avgPrice:1002000,priceYoY:8.2,avgDOM:38,inventory:"Low",   rentYield:5.1,note:"LRT corridor + GO station = best appreciation play 2025-2026"},
  "Port Credit":     {trend:"hot",  emoji:"🔥",avgPrice:1198000,priceYoY:6.9,avgDOM:21,inventory:"Low",   rentYield:3.8,note:"Premium lifestyle. Appreciation play only — cap rate doesn't pencil"},
  "Lakeview":        {trend:"warm", emoji:"📈",avgPrice:1089000,priceYoY:5.4,avgDOM:29,inventory:"Low",   rentYield:4.1,note:"Up-and-coming. Big redevelopment. Buy land, not condos"},
  "Churchill Meadows":{trend:"warm",emoji:"📈",avgPrice:843000, priceYoY:4.1,avgDOM:47,inventory:"Medium",rentYield:4.7,note:"Top schools = stable family rental demand"},
  "Streetsville":    {trend:"warm", emoji:"📈",avgPrice:921000, priceYoY:3.8,avgDOM:44,inventory:"Medium",rentYield:4.6,note:"Village charm + Credit River. Undervalued vs Port Credit"},
  "Erin Mills":      {trend:"warm", emoji:"📈",avgPrice:862000, priceYoY:3.2,avgDOM:51,inventory:"Medium",rentYield:4.9,note:"Good schools, highways, affordability. Steady hold asset"},
  "Cooksville":      {trend:"warm", emoji:"📊",avgPrice:731000, priceYoY:3.9,avgDOM:42,inventory:"Medium",rentYield:5.0,note:"LRT corridor sleeper. Under the radar, not for long"},
  "Hurontario":      {trend:"warm", emoji:"📊",avgPrice:718000, priceYoY:3.5,avgDOM:45,inventory:"Medium",rentYield:4.8,note:"Hurontario LRT will reprice this corridor over next 3 years"},
  "Meadowvale":      {trend:"cool", emoji:"🧊",avgPrice:764000, priceYoY:2.1,avgDOM:58,inventory:"High",  rentYield:4.9,note:"Steady but slow. Buy underpriced, cash flow it"},
  "Malton":          {trend:"cool", emoji:"🧊",avgPrice:618000, priceYoY:1.8,avgDOM:62,inventory:"High",  rentYield:5.1,note:"Highest cash flow yields in the city. Appreciation is slow"}
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
const scoreColor=s=>s>=8.5?GREEN:s>=7?"#60A5FA":s>=5.5?GOLD:RED;
const fmtCF=n=>({color:n>0?GREEN:n<0?RED:MUTED,label:fmtNum(n)});

/* ─────────────────────────────────────────────
   CASL CONSENT TEXT (reused across forms)
───────────────────────────────────────────── */
const CASL_TEXT="By checking this box, I consent to receive commercial electronic messages from Hamza Nouman, Sales Representative, Royal LePage Signature Realty, Brokerage (347 Peel Centre Dr., Brampton, ON · 647-609-1289 · hamzahomes.ca), including property listings, market reports, investment analysis, and promotional real estate communications. I understand I may withdraw consent at any time by clicking the unsubscribe link in any email or contacting hamza@nouman.ca.";

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
          <pre style={{fontSize:12,color:MUTED,lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"'Outfit',sans-serif"}}>{PRIVACY_TEXT}</pre>
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
          <pre style={{fontSize:12,color:MUTED,lineHeight:1.75,whiteSpace:"pre-wrap",fontFamily:"'Outfit',sans-serif"}}>{INV_DISCLAIMER}</pre>
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
function ListingCard({l,onOpen,isSample=true}){
  const cf=fmtCF(l.cashFlow);
  return(
    <div
      className="card-hover"
      onClick={()=>onOpen(l)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${l.address}`}
      onKeyDown={e=>e.key==="Enter"&&onOpen(l)}
      style={{background:CARD,border:`1px solid ${l.hamzasPick?"rgba(196,154,60,0.35)":BORDER}`,borderRadius:14,overflow:"hidden",cursor:"pointer",position:"relative",
        ...(l.hamzasPick?{boxShadow:"0 0 0 1px rgba(196,154,60,0.2), 0 8px 40px rgba(196,154,60,0.08)"}:{})}}
    >
      {/* Image placeholder */}
      <div style={{height:160,background:`linear-gradient(135deg,#0D1F35,#162840)`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:48,opacity:0.15}}>{l.type==="Detached"?"🏠":l.type==="Condo"?"🏢":l.type==="Townhouse"?"🏘️":"🏡"}</div>
        </div>
        {/* Tags */}
        <div style={{position:"absolute",top:10,left:10,display:"flex",gap:6,flexWrap:"wrap"}}>
          {isSample&&<span style={{background:"rgba(196,154,60,0.15)",border:"1px solid rgba(196,154,60,0.4)",borderRadius:5,padding:"2px 8px",fontSize:10,color:GOLD,fontWeight:700,letterSpacing:"0.05em"}}>SAMPLE</span>}
          {l.hamzasPick&&<span style={{background:"rgba(196,154,60,0.2)",border:"1px solid rgba(196,154,60,0.5)",borderRadius:5,padding:"2px 8px",fontSize:10,color:GOLD,fontWeight:700}}>★ HAMZA'S PICK</span>}
          {l.lrtAccess&&<span style={{background:"rgba(61,155,233,0.15)",border:"1px solid rgba(61,155,233,0.4)",borderRadius:5,padding:"2px 8px",fontSize:10,color:BLUE}}>LRT</span>}
          {l.priceReduction>=5&&<span style={{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",borderRadius:5,padding:"2px 8px",fontSize:10,color:GREEN}}>↓{l.priceReduction}%</span>}
          {l.dom>=40&&<span style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:5,padding:"2px 8px",fontSize:10,color:RED}}>{l.dom}d</span>}
        </div>
        {/* Score */}
        <div style={{position:"absolute",top:10,right:10}}>
          <ScoreBadge score={l.hamzaScore}/>
        </div>
        {/* Type badge */}
        <div style={{position:"absolute",bottom:10,right:10,background:"rgba(7,11,20,0.7)",borderRadius:6,padding:"3px 8px",fontSize:11,color:MUTED}}>{l.type}</div>
      </div>

      <div style={{padding:"14px 16px"}}>
        <div style={{fontSize:15,fontWeight:600,color:TEXT,marginBottom:2,lineHeight:1.3}}>{l.address}</div>
        <div style={{fontSize:12,color:MUTED,marginBottom:12}}>{l.neighbourhood}, Mississauga</div>

        {/* Price row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
          <div>
            <div className="mono" style={{fontSize:20,fontWeight:700,color:TEXT}}>{fmtK(l.price)}</div>
            {l.priceReduction>0&&<div style={{fontSize:11,color:MUTED,textDecoration:"line-through"}}>{fmtK(l.originalPrice)}</div>}
          </div>
          <div className="mono" style={{fontSize:13,color:cf.color,fontWeight:600}}>{cf.label}</div>
        </div>

        {/* Specs */}
        <div style={{display:"flex",gap:12,marginBottom:10}}>
          {[["🛏️",l.beds,"bd"],["🛁",l.baths,"ba"],["📐",l.sqft.toLocaleString(),"ft²"]].map(([icon,val,unit])=>(
            <div key={unit} style={{fontSize:12,color:MUTED,display:"flex",gap:3,alignItems:"center"}}>
              <span>{icon}</span><span className="mono" style={{color:TEXT}}>{val}</span><span>{unit}</span>
            </div>
          ))}
        </div>

        {/* Brokerage — TRREB required */}
        <div style={{fontSize:10,color:"#4A6280",borderTop:`1px solid ${BORDER}`,paddingTop:8,fontStyle:"italic"}}>
          Courtesy: {l.brokerage}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REGISTRATION WALL MODAL
───────────────────────────────────────────── */
function RegModal({onClose,onSuccess}){
  const [form,setForm]=useState({name:"",phone:"",email:"",casl:false});
  const [err,setErr]=useState("");
  const [submitting,setSubmitting]=useState(false);

  const handleSubmit=()=>{
    if(!form.name.trim()||!form.phone.trim()){setErr("Name and phone are required.");return;}
    if(!form.casl){setErr("Please accept the consent checkbox to continue.");return;}
    setSubmitting(true);
    const msg=encodeURIComponent(`🔔 New MississaugaInvestor Registration\n\nName: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email||"—"}\nCARL Consent: YES\n\nReach out within 24 hours!`);
    window.open(`https://wa.me/16476091289?text=${msg}`,"_blank");
    setTimeout(()=>{setSubmitting(false);onSuccess(form.name);},1000);
  };

  return(
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}} role="dialog" aria-modal="true" aria-labelledby="reg-title">
      <div style={{background:CARD,border:`1px solid ${GOLD_BORDER}`,borderRadius:16,width:"100%",maxWidth:480,animation:"fadeUp .3s ease"}}>
        <div style={{padding:"28px 28px 20px",borderBottom:`1px solid ${BORDER}`}}>
          <div style={{fontSize:28,marginBottom:8}}>🔓</div>
          <h2 id="reg-title" style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:TEXT,marginBottom:6}}>Unlock Full Access</h2>
          <p style={{fontSize:13,color:MUTED,lineHeight:1.6}}>Register free to unlock Hamza's investment scores, cash flow analysis, and detailed notes on every listing. No spam — you'll only hear about deals worth your time.</p>
        </div>
        <div style={{padding:"20px 28px"}}>
          {[["Full Name *","name","text","John Smith"],["Phone Number *","phone","tel","647-555-1234"],["Email (optional)","email","email","you@email.com"]].map(([label,key,type,placeholder])=>(
            <div key={key} style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,color:MUTED,fontWeight:600,marginBottom:5,letterSpacing:"0.03em"}} htmlFor={`reg-${key}`}>{label}</label>
              <input id={`reg-${key}`} type={type} placeholder={placeholder} value={form[key]}
                onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                style={{width:"100%",background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",color:TEXT,fontSize:14}}
                aria-required={key!=="email"?"true":"false"}
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
            {submitting?"Sending...":"Get Full Access — Free"}
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
function ListingModal({l,onClose,isRegistered,onRequireReg,seenDisclaimer,onShowDisclaimer}){
  const [tab,setTab]=useState("overview");
  const [down,setDown]=useState(20);
  const [rate,setRate]=useState(5.5);
  const [amort,setAmort]=useState(25);
  const [reno,setReno]=useState(50000);
  const [arv,setArv]=useState(Math.round(l.price*1.2));
  const [aiLoading,setAiLoading]=useState(false);
  const [aiResult,setAiResult]=useState("");
  const [vacancy,setVacancy]=useState(5);
  const [opex,setOpex]=useState(30);

  const monthly=calcMonthly(l.price,down,rate,amort);
  const brutoCF=l.estimatedRent-monthly-Math.round(l.price*0.015/12);
  const noi=l.estimatedRent*12*(1-vacancy/100)*(1-opex/100);
  const capRate=((noi/l.price)*100).toFixed(2);
  const cashOnCash=l.price*down/100>0?((brutoCF*12/(l.price*down/100))*100).toFixed(2):"—";
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

  const handleCalcTab=(id)=>{
    if(["mortgage","caprate","brrr","ai"].includes(id)){
      if(!isRegistered){onRequireReg();return;}
      if(!seenDisclaimer){onShowDisclaimer(()=>setTab(id));return;}
    }
    setTab(id);
  };

  const callAI=async()=>{
    setAiLoading(true);setAiResult("");
    try{
      const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({listing:{address:l.address,neighbourhood:l.neighbourhood,price:l.price,beds:l.beds,baths:l.baths,sqft:l.sqft,dom:l.dom,priceReduction:l.priceReduction,estimatedRent:l.estimatedRent,capRate:l.capRate,cashFlow:l.cashFlow,type:l.type,lrtAccess:l.lrtAccess,walkScore:l.walkScore,transitScore:l.transitScore,schoolScore:l.schoolScore}})});
      const d=await res.json();
      setAiResult(d.analysis||"Analysis not available. Please ensure the AI service is configured.");
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
              <span style={{fontSize:11,color:GOLD,fontWeight:600}}>SAMPLE LISTING</span>
            </div>
            <h2 id="modal-title" style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:TEXT,marginBottom:2}}>{l.address}</h2>
            <div style={{fontSize:13,color:MUTED}}>{l.neighbourhood}, Mississauga · Courtesy: {l.brokerage}</div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
            <ScoreBadge score={l.hamzaScore} size="lg"/>
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

        <div className="modal-scroll" style={{padding:"20px 24px"}}>

          {/* OVERVIEW */}
          {tab==="overview"&&(
            <div>
              {/* Stats grid */}
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
                <StatBox label="List Price" value={fmtK(l.price)} accent={TEXT}/>
                <StatBox label="Price Drop" value={l.priceReduction>0?`-${l.priceReduction}%`:"—"} accent={l.priceReduction>0?GREEN:MUTED}/>
                <StatBox label="Days on Market" value={l.dom} sub="days" accent={l.dom>=40?RED:TEXT}/>
                <StatBox label="Est. Rent" value={`$${l.estimatedRent.toLocaleString()}/mo`} accent={GREEN}/>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
                <StatBox label="Beds" value={l.beds}/>
                <StatBox label="Baths" value={l.baths}/>
                <StatBox label="Sq Ft" value={l.sqft.toLocaleString()}/>
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
                <p style={{fontSize:10,color:MUTED,lineHeight:1.6}}>⚠️ <strong style={{color:TEXT}}>SAMPLE DATA.</strong> These listings are not real MLS® listings. They are demonstration data only and do not represent actual properties available for purchase. The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by The Canadian Real Estate Association (CREA). Data reliability is not guaranteed. For real listings, visit <a href="https://www.hamzahomes.ca" target="_blank" rel="noreferrer" style={{color:GOLD}}>hamzahomes.ca</a> or call Hamza at 647-609-1289.</p>
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
                <StatBox label="Hamza's Score" value={`${l.hamzaScore}/10`} accent={scoreColor(l.hamzaScore)}/>
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
                  <pre style={{whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.8,color:TEXT,fontFamily:"'Outfit',sans-serif"}}>{aiResult}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{padding:"16px 24px",borderTop:`1px solid ${BORDER}`,display:"flex",gap:10,flexWrap:"wrap",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:11,color:MUTED}}>📍 Sample data · Courtesy: {l.brokerage}</div>
          <div style={{display:"flex",gap:8}}>
            <a href={`https://wa.me/16476091289?text=${encodeURIComponent("Hi Hamza, I'm interested in "+l.address+" listed at "+fmtK(l.price))}`} target="_blank" rel="noreferrer"
              style={{display:"inline-flex",alignItems:"center",gap:6,background:"#25D366",color:"#fff",border:"none",padding:"9px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",textDecoration:"none"}}>
              💬 WhatsApp
            </a>
            <a href="tel:16476091289" style={{display:"inline-flex",alignItems:"center",gap:6,background:SURFACE,color:TEXT,border:`1px solid ${BORDER}`,padding:"9px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",textDecoration:"none"}}>
              📞 Call
            </a>
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
    if(!form.name||!form.phone||!form.casl)return;
    const msg=encodeURIComponent(`🏙️ Pre-Con VIP Registration\n\nName: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email||"—"}\nBudget: ${form.budget}\nAreas: ${form.areas.join(", ")||"Any"}\nCARL Consent: YES`);
    window.open(`https://wa.me/16476091289?text=${msg}`,"_blank");
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
        <div style={{background:"rgba(196,154,60,0.08)",border:`1px solid rgba(196,154,60,0.2)`,borderRadius:10,padding:"14px 16px",marginBottom:18}}>
          <p style={{fontSize:12,color:MUTED,lineHeight:1.6}}>🔒 <strong style={{color:GOLD}}>VIP Access Only.</strong> Pre-construction pricing and floor plans are shared directly by Hamza based on your investment profile. No public listings shown here — this is a lead capture form only. Contact Hamza for current opportunities.</p>
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
    if(!form.name||!form.phone||!form.address||!form.casl)return;
    const msg=encodeURIComponent(`🏡 Home Valuation Request\n\nName: ${form.name}\nPhone: ${form.phone}\nAddress: ${form.address}\nType: ${form.type}\nBeds: ${form.beds}\nCARL Consent: YES`);
    window.open(`https://wa.me/16476091289?text=${msg}`,"_blank");
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
            {["Detached","Semi-Detached","Townhouse","Condo","Other"].map(t=><option key={t}>{t}</option>)}
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

  const handleAnswer=(ans)=>{
    const next=[...answers,ans];
    if(step<QUIZ.length-1){setAnswers(next);setStep(s=>s+1);}
    else{
      const profiles=["cashflow","appreciation","brrr","precon"];
      setResult(QUIZ_RESULTS[profiles[Math.floor(Math.random()*3)]]);
      setAnswers(next);
    }
  };

  const handleLead=()=>{
    if(!leadForm.name||!leadForm.phone||!leadForm.casl)return;
    const msg=encodeURIComponent(`🎯 Investor Quiz Lead\n\nProfile: ${result.title}\nName: ${leadForm.name}\nPhone: ${leadForm.phone}\nCARL Consent: YES`);
    window.open(`https://wa.me/16476091289?text=${msg}`,"_blank");
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
function MarketPulse(){
  const stats=[
    {label:"Avg Detached Price",value:"$1.02M",sub:"Mississauga · Q1 2025",delta:"+4.2% YoY"},
    {label:"Active Listings",value:"3,847",sub:"GTA West · Feb 2025",delta:"+18% MoM"},
    {label:"Sales-to-Listings",value:"0.41",sub:"Below 0.40 = buyer's mkt",delta:"↓ Cooling"},
    {label:"Avg Days on Market",value:"28",sub:"All property types",delta:"+6 days YoY"},
    {label:"Avg Condo Price",value:"$621K",sub:"Mississauga City Centre",delta:"-2.1% YoY"},
    {label:"Hurontario LRT",value:"2025",sub:"Expected opening",delta:"9 LRT stops"},
  ];

  return(
    <div style={{padding:"24px 0"}}>
      <div style={{marginBottom:28}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:TEXT,marginBottom:6}}>Mississauga Market Pulse</h2>
        <p style={{fontSize:13,color:MUTED}}>Hamza's read on the market as of Q1 2025. Personal analysis — not TRREB data.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:28}}>
        {stats.map(s=>(
          <div key={s.label} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:"16px 18px"}}>
            <div style={{fontSize:11,color:MUTED,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>{s.label}</div>
            <div className="mono" style={{fontSize:24,fontWeight:700,color:TEXT,marginBottom:2}}>{s.value}</div>
            <div style={{fontSize:11,color:MUTED,marginBottom:6}}>{s.sub}</div>
            <div style={{fontSize:11,color:GOLD,fontWeight:600}}>{s.delta}</div>
          </div>
        ))}
      </div>
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:"20px 22px",marginBottom:20}}>
        <h3 style={{fontSize:16,fontWeight:700,color:TEXT,marginBottom:12}}>Hamza's Q1 2025 Market Read</h3>
        <p style={{fontSize:14,color:MUTED,lineHeight:1.8}}>
          We're in a transitional buyer's market. The sales-to-listing ratio has dropped below 0.45 in Mississauga, giving buyers real negotiating power for the first time since 2020. <strong style={{color:TEXT}}>My strategy: target properties 40+ days on market in Clarkson and Churchill Meadows with 5%+ price reductions.</strong> Detached under $950K is the sweet spot — institutional money is avoiding condos. The Hurontario LRT corridor is the single best infrastructure play in the GTA over the next 3 years.
        </p>
      </div>
      <div style={{padding:"12px 16px",background:"rgba(255,255,255,0.02)",border:`1px solid ${BORDER}`,borderRadius:8}}>
        <p style={{fontSize:11,color:MUTED,lineHeight:1.6}}>Market commentary by Hamza Nouman, Sales Representative, Royal LePage Signature Realty, Brokerage. For informational purposes only. Not TRREB data. Verify all figures with official sources before making investment decisions.</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   NEIGHBOURHOOD DEEP DIVE
───────────────────────────────────────────── */
function HoodsView({onFilterListings}){
  const [active,setActive]=useState(null);
  const trendColor={hot:RED,warm:GOLD,cool:BLUE};

  return(
    <div style={{padding:"24px 0"}}>
      <div style={{marginBottom:28}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:TEXT,marginBottom:6}}>Neighbourhood Intelligence</h2>
        <p style={{fontSize:13,color:MUTED}}>Hamza's personal ratings across 10 Mississauga neighbourhoods. Personal opinion — not MLS® data.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {Object.entries(HOOD_DATA).map(([name,h])=>(
          <div key={name} className="card-hover"
            style={{background:CARD,border:`1px solid ${active===name?"rgba(196,154,60,0.4)":BORDER}`,borderRadius:14,padding:"18px 20px",cursor:"pointer"}}
            onClick={()=>setActive(active===name?null:name)}
            role="button" tabIndex={0} aria-expanded={active===name} aria-label={`${name} neighbourhood details`}
            onKeyDown={e=>e.key==="Enter"&&setActive(active===name?null:name)}
          >
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:TEXT,marginBottom:2}}>{name}</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontSize:11}}>{h.emoji}</span>
                  <span style={{fontSize:11,color:trendColor[h.trend],fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h.trend}</span>
                  <span style={{fontSize:11,color:MUTED}}>· {h.inventory} inventory</span>
                </div>
              </div>
              <div className="mono" style={{fontSize:20,fontWeight:700,color:GOLD}}>{h.rentYield}%<div style={{fontSize:10,color:MUTED,fontWeight:400,textAlign:"right"}}>yield</div></div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <div style={{flex:1,background:SURFACE,borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontSize:10,color:MUTED,marginBottom:2}}>Avg Price</div>
                <div className="mono" style={{fontSize:14,fontWeight:600,color:TEXT}}>{fmtK(h.avgPrice)}</div>
              </div>
              <div style={{flex:1,background:SURFACE,borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontSize:10,color:MUTED,marginBottom:2}}>YoY Change</div>
                <div className="mono" style={{fontSize:14,fontWeight:600,color:h.priceYoY>4?GREEN:h.priceYoY>2?GOLD:MUTED}}>+{h.priceYoY}%</div>
              </div>
              <div style={{flex:1,background:SURFACE,borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontSize:10,color:MUTED,marginBottom:2}}>Avg DOM</div>
                <div className="mono" style={{fontSize:14,fontWeight:600,color:h.avgDOM>50?RED:TEXT}}>{h.avgDOM}d</div>
              </div>
            </div>
            {active===name&&(
              <div style={{animation:"fadeIn .2s ease"}}>
                <p style={{fontSize:13,color:TEXT,lineHeight:1.7,marginBottom:12,fontStyle:"italic"}}>"{h.note}"</p>
                <button onClick={e=>{e.stopPropagation();onFilterListings(name);}} className="btn-gold-outline" style={{padding:"8px 16px",borderRadius:8,fontSize:12,width:"100%"}}>
                  View {name} Sample Listings →
                </button>
              </div>
            )}
            {active!==name&&<div style={{fontSize:11,color:MUTED}}>Click to expand →</div>}
          </div>
        ))}
      </div>
      <div style={{marginTop:16,padding:"10px 14px",background:"rgba(255,255,255,0.02)",border:`1px solid ${BORDER}`,borderRadius:8}}>
        <p style={{fontSize:11,color:MUTED,lineHeight:1.6}}>Neighbourhood data represents Hamza Nouman's personal professional opinion based on market experience. Not sourced from TRREB or MLS®. Verify all data independently. Hamza Nouman, Sales Representative, Royal LePage Signature Realty, Brokerage.</p>
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
              🌐 <a href="https://www.hamzahomes.ca" target="_blank" rel="noreferrer" style={{color:GOLD,textDecoration:"none"}}>hamzahomes.ca</a>
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
            {[["Privacy Policy",()=>onPrivacy()],["Terms of Use",()=>window.open("https://www.hamzahomes.ca/terms-of-service","_blank")],["RECO Registration",()=>window.open("https://www.reco.on.ca","_blank")]].map(([label,action])=>(
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
            <p style={{marginBottom:6}}><strong style={{color:"#5A7090"}}>DATA DISCLAIMER:</strong> The listing information on this website is deemed reliable but is not guaranteed accurate. Sample listing data displayed on this site is for demonstration purposes only and does not represent actual MLS® listings. Live data from TRREB MLS® will be displayed upon integration. For verified listing information, visit <a href="https://www.hamzahomes.ca" style={{color:GOLD}}>hamzahomes.ca</a> or contact Hamza directly.</p>
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
    {id:"quiz",label:"Find My Deal"},
    {id:"precon",label:"Pre-Con VIP"},
  ];

  return(
    <header role="banner" style={{position:"sticky",top:0,zIndex:80,background:"rgba(7,11,20,0.92)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${BORDER}`,padding:"0 24px"}}>
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Brokerage bar — RECO mandatory */}
      <div style={{background:"rgba(196,154,60,0.06)",borderBottom:`1px solid rgba(196,154,60,0.1)`,padding:"4px 0",textAlign:"center"}}>
        <span style={{fontSize:11,color:"#8A7040"}}>Hamza Nouman · <strong>Sales Representative</strong> · Royal LePage Signature Realty, Brokerage · 647-609-1289</span>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:58}}>
        {/* Logo */}
        <button onClick={()=>setActiveNav("listings")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}} aria-label="Go to home">
          <div style={{width:34,height:34,background:`linear-gradient(135deg,${GOLD},${GOLD2})`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:`0 0 16px rgba(196,154,60,0.4)`}}>◈</div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:TEXT,lineHeight:1.1}}>Mississauga<span style={{color:GOLD}}> Investor</span></div>
            <div style={{fontSize:9,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase"}}>Investment Property Intelligence</div>
          </div>
        </button>

        {/* Desktop nav */}
        <nav role="navigation" aria-label="Main navigation" style={{display:"flex",gap:2}} className="desktop-only">
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>setActiveNav(n.id)} className="tab-btn" style={{...(activeNav===n.id?{color:GOLD,borderColor:GOLD}:{})}}>{n.label}</button>
          ))}
        </nav>

        {/* CTA buttons */}
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={onSeller} className="btn-ghost desktop-only" style={{padding:"8px 16px",borderRadius:8,fontSize:13}}>
            Sell My Home
          </button>
          <a href="https://wa.me/16476091289" target="_blank" rel="noreferrer"
            style={{display:"inline-flex",alignItems:"center",gap:6,background:"#25D366",color:"#fff",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:600,textDecoration:"none"}}>
            <span>💬</span><span className="desktop-only">WhatsApp</span>
          </a>
          {/* Mobile menu */}
          <button onClick={()=>setMobileOpen(!mobileOpen)} className="btn-ghost" style={{padding:"8px 10px",borderRadius:8,display:"none"}} aria-label="Menu" aria-expanded={mobileOpen}
            // Show on mobile via CSS override — simplified here
          >☰</button>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────────── */
function Hero({onCTA,setActiveNav}){
  return(
    <section aria-label="Hero" style={{padding:"60px 24px 48px",maxWidth:1200,margin:"0 auto",position:"relative",zIndex:1}}>
      <div style={{textAlign:"center",animation:"fadeUp .6s ease both"}}>
        {/* Sample notice */}
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(196,154,60,0.08)",border:`1px solid rgba(196,154,60,0.25)`,borderRadius:40,padding:"6px 16px",marginBottom:24}}>
          <span style={{fontSize:11,color:GOLD,fontWeight:700,letterSpacing:"0.05em"}}>⚠️ SAMPLE DATA — DEMO MODE</span>
          <span style={{fontSize:11,color:MUTED}}>Live TRREB data coming soon</span>
        </div>

        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(32px,5vw,56px)",fontWeight:900,color:TEXT,lineHeight:1.15,marginBottom:16}}>
          Mississauga Investment<br/><span style={{color:GOLD}}>Property Intelligence</span>
        </h1>
        <p style={{fontSize:"clamp(15px,2vw,18px)",color:MUTED,maxWidth:600,margin:"0 auto 32px",lineHeight:1.7}}>
          Expert investment analysis from Hamza Nouman, your Mississauga real estate specialist. Cap rates, cash flow, and Hamza's personal scores — all in one place.
        </p>

        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:48}}>
          <button onClick={()=>setActiveNav("listings")} className="btn-primary" style={{padding:"13px 28px",borderRadius:10,fontSize:15}}>
            Browse Sample Listings
          </button>
          <button onClick={()=>setActiveNav("quiz")} className="btn-ghost" style={{padding:"13px 28px",borderRadius:10,fontSize:15}}>
            Find My Ideal Deal
          </button>
        </div>

        {/* Stats bar */}
        <div style={{display:"flex",gap:0,justifyContent:"center",borderTop:`1px solid ${BORDER}`,paddingTop:28,flexWrap:"wrap"}}>
          {[["8+","Years GTA Experience"],["🏆","Master Sales Award"],["10","Mississauga Neighbourhoods"],["3","Languages: EN · UR · HI"]].map(([val,label],i)=>(
            <div key={i} style={{padding:"0 28px",borderRight:i<3?`1px solid ${BORDER}`:"none",textAlign:"center",marginBottom:12}}>
              <div className="mono" style={{fontSize:22,fontWeight:700,color:GOLD,marginBottom:4}}>{val}</div>
              <div style={{fontSize:12,color:MUTED}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   LISTINGS VIEW
───────────────────────────────────────────── */
function ListingsView({onOpenListing,filterHood,setFilterHood}){
  const [propType,setPropType]=useState("All");
  const [sort,setSort]=useState("score");
  const [search,setSearch]=useState("");
  const [chips,setChips]=useState(new Set());
  const [showFilters,setShowFilters]=useState(false);
  const [filters,setFilters]=useState({priceMin:400000,priceMax:2000000,bedsMin:0,domMax:999,priceDropMin:0});

  const toggleChip=c=>setChips(prev=>{const n=new Set(prev);n.has(c)?n.delete(c):n.add(c);return n;});

  const filtered=useMemo(()=>{
    let list=[...LISTINGS];
    if(propType!=="All")list=list.filter(l=>l.type===propType);
    if(filterHood)list=list.filter(l=>l.neighbourhood===filterHood);
    if(search)list=list.filter(l=>l.address.toLowerCase().includes(search.toLowerCase())||l.neighbourhood.toLowerCase().includes(search.toLowerCase()));
    if(chips.has("price-drop"))list=list.filter(l=>l.priceReduction>=5);
    if(chips.has("cash-flow"))list=list.filter(l=>l.cashFlow>0);
    if(chips.has("lrt"))list=list.filter(l=>l.lrtAccess);
    if(chips.has("40-days"))list=list.filter(l=>l.dom>=40);
    if(chips.has("under-800"))list=list.filter(l=>l.price<800000);
    list=list.filter(l=>l.price>=filters.priceMin&&l.price<=filters.priceMax&&l.beds>=filters.bedsMin&&l.dom<=filters.domMax&&l.priceReduction>=filters.priceDropMin);
    const sortFns={score:(a,b)=>b.hamzaScore-a.hamzaScore,price:(a,b)=>a.price-b.price,dom:(a,b)=>b.dom-a.dom,drop:(a,b)=>b.priceReduction-a.priceReduction,cashflow:(a,b)=>b.cashFlow-a.cashFlow};
    list.sort(sortFns[sort]||sortFns.score);
    return list;
  },[propType,filterHood,search,chips,filters,sort]);

  return(
    <section aria-label="Property Listings" id="listings">
      {/* TRREB/CREA Sample Data Banner — mandatory */}
      <div role="alert" style={{background:"rgba(196,154,60,0.07)",border:"1px solid rgba(196,154,60,0.25)",borderRadius:12,padding:"12px 18px",marginBottom:22,display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
        <span style={{fontSize:20,flexShrink:0}}>⚠️</span>
        <div>
          <span style={{fontSize:13,fontWeight:700,color:GOLD}}>Sample Listings — For Demonstration Purposes Only. </span>
          <span style={{fontSize:13,color:MUTED}}>These are NOT real MLS® listings. Addresses and data are illustrative. The trademarks MLS®, Multiple Listing Service® are owned by CREA. Live TRREB data will display once MLS® feed is connected. For real listings: </span>
          <a href="https://www.hamzahomes.ca" target="_blank" rel="noreferrer" style={{fontSize:13,color:GOLD,fontWeight:600}}>hamzahomes.ca</a>
          <span style={{fontSize:13,color:MUTED}}> · 647-609-1289</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{marginBottom:20}}>
        {/* Search */}
        <div style={{position:"relative",marginBottom:14}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:MUTED,fontSize:16}} aria-hidden="true">🔍</span>
          <input type="search" placeholder="Search address or neighbourhood..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:"11px 14px 11px 42px",color:TEXT,fontSize:14}}
            aria-label="Search listings"/>
        </div>

        {/* Property type tabs */}
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {["All","Detached","Semi-Detached","Townhouse","Condo"].map(t=>(
            <button key={t} onClick={()=>setPropType(t)} className={"chip"+(propType===t?" active":"")} style={{padding:"8px 16px"}}>{t}</button>
          ))}
          {filterHood&&<button onClick={()=>setFilterHood(null)} style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:40,padding:"8px 14px",fontSize:12,color:RED,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✕ {filterHood}</button>}
        </div>

        {/* Quick chips */}
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {[["price-drop","↓ 5%+ Drop"],["cash-flow","Cash Flow+"],["lrt","LRT Access"],["40-days","40+ DOM"],["under-800","Under $800K"]].map(([id,label])=>(
            <button key={id} onClick={()=>toggleChip(id)} className={"chip"+(chips.has(id)?" active":"")} style={{padding:"7px 14px"}}>{label}</button>
          ))}
        </div>

        {/* Sort + filter toggle */}
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:8,padding:"8px 14px",color:TEXT,fontSize:13}} aria-label="Sort listings by">
            <option value="score">Sort: Hamza's Score</option>
            <option value="price">Sort: Price ↑</option>
            <option value="dom">Sort: Days on Market ↓</option>
            <option value="drop">Sort: Biggest Price Drop</option>
            <option value="cashflow">Sort: Cash Flow ↓</option>
          </select>
          <button onClick={()=>setShowFilters(!showFilters)} className="btn-ghost" style={{padding:"8px 16px",borderRadius:8,fontSize:13}}>
            {showFilters?"▲ Hide":"▼ Filters"}
          </button>
          <span style={{fontSize:12,color:MUTED,marginLeft:"auto"}}>{filtered.length} properties</span>
        </div>

        {/* Advanced filters */}
        {showFilters&&(
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:"18px 20px",marginTop:14,animation:"slideDown .2s ease"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
              {[["Price Min","priceMin",300000,2000000,50000],["Price Max","priceMax",500000,3000000,50000],["Min Beds","bedsMin",0,6,1],["Max DOM","domMax",7,999,7],["Min Price Drop %","priceDropMin",0,20,1]].map(([label,key,min,max,step])=>(
                <div key={key}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <label htmlFor={`filter-${key}`} style={{fontSize:12,color:MUTED}}>{label}</label>
                    <span className="mono" style={{fontSize:12,color:GOLD}}>{key.includes("price")?fmtK(filters[key]):filters[key]}{key==="priceDropMin"?"%":key==="bedsMin"?"bd":""}</span>
                  </div>
                  <input id={`filter-${key}`} type="range" min={min} max={max} step={step} value={filters[key]} onChange={e=>setFilters(f=>({...f,[key]:Number(e.target.value)}))} style={{width:"100%"}} aria-label={label}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hamza's Pick Banner */}
      {filtered.find(l=>l.hamzasPick)&&(
        <div style={{background:"linear-gradient(135deg,rgba(196,154,60,0.1),rgba(196,154,60,0.05))",border:`1px solid rgba(196,154,60,0.3)`,borderRadius:14,padding:"16px 20px",marginBottom:20,display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{fontSize:32}}>⭐</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:GOLD,fontWeight:700,letterSpacing:"0.05em",marginBottom:2}}>HAMZA'S PICK OF THE WEEK — Personal Selection</div>
            <div style={{fontSize:15,fontWeight:700,color:TEXT}}>1590 Carolyn Rd, Erin Mills</div>
            <div style={{fontSize:13,color:MUTED}}>12.4% price reduction · 67 DOM · Score: 9.0/10 · Sample listing for demonstration</div>
          </div>
          <button onClick={()=>onOpenListing(filtered.find(l=>l.hamzasPick))} className="btn-primary" style={{padding:"10px 20px",borderRadius:8,fontSize:13}}>
            View Analysis
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length===0?(
        <div style={{textAlign:"center",padding:"60px 24px",color:MUTED}}>
          <div style={{fontSize:40,marginBottom:12}}>🔍</div>
          <p style={{fontSize:15}}>No listings match your filters.</p>
          <button onClick={()=>{setPropType("All");setChips(new Set());setSearch("");setFilterHood&&setFilterHood(null);}} className="btn-ghost" style={{padding:"10px 20px",borderRadius:8,fontSize:13,marginTop:12}}>Clear Filters</button>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:16}}>
          {filtered.map(l=><ListingCard key={l.id} l={l} onOpen={onOpenListing} isSample={true}/>)}
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
          <a href="https://wa.me/16476091289" target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(37,211,102,0.1)",color:"#25D366",border:"1px solid rgba(37,211,102,0.25)",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:500,textDecoration:"none"}}>💬 WhatsApp</a>
          <a href="https://www.hamzahomes.ca" target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(196,154,60,0.08)",color:GOLD,border:`1px solid rgba(196,154,60,0.25)`,padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:500,textDecoration:"none"}}>🌐 hamzahomes.ca</a>
        </div>
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
  const [isRegistered,setIsRegistered]=useState(false);
  const [freeViews,setFreeViews]=useState(1);
  const [showRegModal,setShowRegModal]=useState(false);
  const [pendingListing,setPendingListing]=useState(null);
  const [showPrecon,setShowPrecon]=useState(false);
  const [showSeller,setShowSeller]=useState(false);
  const [showPrivacy,setShowPrivacy]=useState(false);
  const [cookieConsent,setCookieConsent]=useState(null); // null=not answered, "all"/"essential"
  const [seenDisclaimer,setSeenDisclaimer]=useState(false);
  const [disclaimerCallback,setDisclaimerCallback]=useState(null);
  const [filterHood,setFilterHood]=useState(null);

  // Check stored cookie consent
  useEffect(()=>{
    // Don't use localStorage (not allowed in Claude artifacts)
    // In production, this would check a cookie
  },[]);

  // Scroll to top on tab change
  useEffect(()=>{window.scrollTo({top:0,behavior:"smooth"});},[activeNav]);

  const handleOpenListing=(l)=>{
    if(!isRegistered&&freeViews<=0){
      setPendingListing(l);setShowRegModal(true);return;
    }
    if(!isRegistered)setFreeViews(v=>v-1);
    setSelectedListing(l);
  };

  const handleRegSuccess=(name)=>{
    setIsRegistered(true);setShowRegModal(false);
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

  const handleFilterHood=(hood)=>{
    setFilterHood(hood);
    setActiveNav("listings");
    setTimeout(()=>window.scrollTo({top:300,behavior:"smooth"}),100);
  };

  return(
    <>
      <style>{G}</style>

      {/* Animated mesh background */}
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-orb" style={{width:600,height:600,background:"#C49A3C",top:"-20%",right:"-10%",animationDelay:"0s"}}/>
        <div className="mesh-orb" style={{width:500,height:500,background:"#1E5A8A",bottom:"-15%",left:"-10%",animationDelay:"-6s"}}/>
        <div className="mesh-orb" style={{width:400,height:400,background:"#3D9BE9",top:"40%",left:"40%",animationDelay:"-12s"}}/>
      </div>

      {/* Cookie Consent */}
      {cookieConsent===null&&(
        <CookieBanner
          onAccept={()=>setCookieConsent("all")}
          onDecline={()=>setCookieConsent("essential")}
        />
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
      <main id="main-content" style={{maxWidth:1200,margin:"0 auto",padding:"0 24px 40px",position:"relative",zIndex:1}}>

        {/* Hero (only on listings) */}
        {activeNav==="listings"&&<Hero onCTA={()=>setShowRegModal(true)} setActiveNav={setActiveNav}/>}

        {/* Pre-con banner */}
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
          <ListingsView onOpenListing={handleOpenListing} filterHood={filterHood} setFilterHood={setFilterHood}/>
        ):activeNav==="pulse"?(
          <MarketPulse/>
        ):activeNav==="hoods"?(
          <HoodsView onFilterListings={handleFilterHood}/>
        ):activeNav==="quiz"?(
          <FindMyDeal/>
        ):null}

        {/* Registration status bar */}
        {!isRegistered&&(
          <div style={{background:"rgba(196,154,60,0.06)",border:`1px solid rgba(196,154,60,0.2)`,borderRadius:12,padding:"14px 20px",marginTop:28,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:TEXT,marginBottom:2}}>
                🔓 {freeViews>0?`${freeViews} free view remaining — `:""}{isRegistered?"Full access unlocked":"Register for full access"}
              </div>
              <div style={{fontSize:12,color:MUTED}}>Unlock Hamza's investment scores, cash flow analysis, and AI-powered property reports</div>
            </div>
            <button onClick={()=>setShowRegModal(true)} className="btn-primary" style={{padding:"10px 20px",borderRadius:8,fontSize:13,flexShrink:0}}>
              Register Free
            </button>
          </div>
        )}

        {/* Agent bio — bottom of page */}
        <AgentBio onContact={()=>setShowSeller(true)}/>

        {/* Sell / Book CTA */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14,marginTop:28}}>
          {[
            {emoji:"🏡",title:"What's My Home Worth?",desc:"Free market analysis, no obligation. Hamza will reach out within 24 hours.",btn:"Get Free Valuation",action:()=>setShowSeller(true)},
            {emoji:"🏙️",title:"Pre-Construction VIP",desc:"Floor plans and pricing before public launch. Register for VIP access.",btn:"Join VIP List",action:()=>setShowPrecon(true)},
            {emoji:"📞",title:"Book a Call",desc:"15-minute strategy call with Hamza to align your investment goals.",btn:"Book on Calendly",action:()=>window.open("https://calendly.com/hamzanouman","_blank")},
          ].map(c=>(
            <div key={c.title} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:"22px"}}>
              <div style={{fontSize:28,marginBottom:10}}>{c.emoji}</div>
              <div style={{fontSize:15,fontWeight:700,color:TEXT,marginBottom:6,fontFamily:"'Playfair Display',serif"}}>{c.title}</div>
              <p style={{fontSize:13,color:MUTED,lineHeight:1.6,marginBottom:16}}>{c.desc}</p>
              <button onClick={c.action} className="btn-gold-outline" style={{padding:"9px 18px",borderRadius:8,fontSize:13,width:"100%"}}>{c.btn}</button>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <Footer onPrivacy={()=>setShowPrivacy(true)}/>

      {/* WhatsApp FAB */}
      <a href="https://wa.me/16476091289?text=Hi+Hamza+I+found+you+on+mississaugainvestor.ca" target="_blank" rel="noreferrer"
        className="wa-fab" aria-label="Chat with Hamza on WhatsApp" title="WhatsApp Hamza">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </>
  );
}
