import { useState, useMemo } from "react";

const G = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#060B15}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#060B15}::-webkit-scrollbar-thumb{background:#1E3560;border-radius:3px}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes goldPulse{0%,100%{box-shadow:0 0 0 0 rgba(126,200,227,0.4)}70%{box-shadow:0 0 0 10px rgba(126,200,227,0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.card{transition:transform .25s ease,box-shadow .25s ease}
.card:hover{transform:translateY(-5px)!important;box-shadow:0 24px 60px rgba(126,200,227,0.1)!important}
.tbtn{transition:all .2s ease}.tbtn:hover{background:rgba(255,255,255,0.07)!important}
.chip{transition:all .18s ease}.chip:hover{border-color:#7EC8E3!important;color:#7EC8E3!important;background:rgba(126,200,227,0.08)!important}
.chip.active{background:rgba(126,200,227,0.15)!important;border-color:#7EC8E3!important;color:#7EC8E3!important}
input:focus,select:focus{outline:none!important;border-color:#7EC8E3!important;box-shadow:0 0 0 3px rgba(126,200,227,0.15)!important}
.mbtn:hover{background:#4DAAC8!important}
.wabtn{animation:goldPulse 2s infinite}
`;

const LISTINGS = [
  {id:"ML001",address:"2847 Folkway Dr",neighbourhood:"Erin Mills",price:849000,beds:4,baths:3,sqft:2100,dom:67,priceReduction:6.2,originalPrice:906000,estimatedRent:4300,type:"Detached",lrtAccess:false,brokerage:"Royal LePage Signature Realty",hamzaScore:8.4,hamzaNotes:"12.4% price reduction on a 4-bed det — seller has been sitting 67 days and is motivated. All brick detached basement suite potential. Best value in the neighbourhood right now.",cashFlow:310,capRate:5.1,walkScore:71,transitScore:64,schoolScore:88},
  {id:"ML002",address:"1203 Haig Blvd",neighbourhood:"Lakeview",price:1125000,beds:3,baths:2,sqft:1650,dom:8,priceReduction:0,originalPrice:1125000,estimatedRent:4400,type:"Semi-Detached",lrtAccess:false,brokerage:"RE/MAX Realty Specialists",hamzaScore:6.1,hamzaNotes:"Lakeview is appreciating fast but this one is fresh to market at ask. No negotiating room yet. Watch for a 30+ day reduction before jumping.",cashFlow:-180,capRate:4.2,walkScore:68,transitScore:72,schoolScore:82},
  {id:"ML003",address:"5521 Glen Erin Dr",neighbourhood:"Churchill Meadows",price:799000,beds:3,baths:3,sqft:1800,dom:47,priceReduction:8.5,originalPrice:873000,estimatedRent:3900,type:"Townhouse",lrtAccess:false,brokerage:"Century 21 Miller Real Estate",hamzaScore:7.8,hamzaNotes:"8.5% drop on a Churchill Meadows townhouse. Excellent school catchment. Top floor laundry, finished basement. Strong rental demand from hospital workers nearby.",cashFlow:120,capRate:4.7,walkScore:78,transitScore:70,schoolScore:94},
  {id:"ML004",address:"3318 Redpath Cir",neighbourhood:"Meadowvale",price:689000,beds:3,baths:2,sqft:1450,dom:22,priceReduction:3.1,originalPrice:711000,estimatedRent:3500,type:"Townhouse",lrtAccess:false,brokerage:"iPro Realty Ltd.",hamzaScore:6.8,hamzaNotes:"Decent price point for Meadowvale. Needs kitchen update. Conservative buy — not a home run but solid hold asset if you get it under $670K.",cashFlow:40,capRate:4.3,walkScore:82,transitScore:75,schoolScore:86},
  {id:"ML005",address:"915 Inverhouse Dr",neighbourhood:"Clarkson",price:975000,beds:4,baths:3,sqft:2300,dom:61,priceReduction:11.2,originalPrice:1099000,estimatedRent:4600,type:"Detached",lrtAccess:true,brokerage:"Sutton Group Quantum Realty",hamzaScore:9.1,hamzaNotes:"This is the one. 11.2% off, LRT access, 61 DOM — seller is cooked. 4-bed with in-law suite potential. Clarkson GO + future LRT stop walking distance. Cash flow positive from day one if you put 25% down.",cashFlow:480,capRate:5.4,walkScore:76,transitScore:88,schoolScore:79},
  {id:"ML006",address:"4402 Tahoe Blvd",neighbourhood:"Malton",price:599000,beds:3,baths:2,sqft:1300,dom:15,priceReduction:0,originalPrice:599000,estimatedRent:3200,type:"Townhouse",lrtAccess:false,brokerage:"Homelife/Miracle Realty Ltd",hamzaScore:5.9,hamzaNotes:"Malton entry-level. Rents are decent but appreciation is slow here. Only buy if you have a very long time horizon or strong cash flow strategy.",cashFlow:60,capRate:4.6,walkScore:74,transitScore:80,schoolScore:71},
  {id:"ML007",address:"1876 Lakeshore Rd W",neighbourhood:"Port Credit",price:1380000,beds:3,baths:3,sqft:1550,dom:29,priceReduction:4.8,originalPrice:1450000,estimatedRent:5400,type:"Semi-Detached",lrtAccess:true,brokerage:"Sotheby's International Realty",hamzaScore:7.3,hamzaNotes:"Port Credit premium. LRT access is the story here — buy the location. Numbers are thin today but appreciation play over 5 years is strong. Not for cash flow investors.",cashFlow:-210,capRate:3.8,walkScore:91,transitScore:86,schoolScore:83},
  {id:"ML008",address:"6634 Ninth Line",neighbourhood:"Streetsville",price:1049000,beds:4,baths:3,sqft:2450,dom:53,priceReduction:7.3,originalPrice:1131000,estimatedRent:4700,type:"Detached",lrtAccess:false,brokerage:"Royal LePage Meadowtowne Realty",hamzaScore:7.6,hamzaNotes:"7.3% drop in Streetsville village — very sellable area. Credit River trail access, heritage character streets. BRRR candidate with legal second suite conversion.",cashFlow:240,capRate:4.8,walkScore:84,transitScore:65,schoolScore:91},
  {id:"ML009",address:"345 Rathburn Rd W",neighbourhood:"Cooksville",price:729000,beds:3,baths:2,sqft:1600,dom:38,priceReduction:5.5,originalPrice:771000,estimatedRent:3700,type:"Condo",lrtAccess:true,brokerage:"Keller Williams Real Estate Associates",hamzaScore:7.1,hamzaNotes:"Hurontario LRT corridor play. Condo but freehold feel. 5.5% drop, 38 DOM. Ideal for a first investment — low maintenance, solid rental demand from young professionals.",cashFlow:150,capRate:5.0,walkScore:87,transitScore:91,schoolScore:78},
  {id:"ML010",address:"2211 Hurontario St",neighbourhood:"Cooksville",price:649000,beds:2,baths:2,sqft:1100,dom:19,priceReduction:2.8,originalPrice:668000,estimatedRent:3300,type:"Condo",lrtAccess:true,brokerage:"RE/MAX Aboutowne Realty Corp.",hamzaScore:6.5,hamzaNotes:"Hurontario corridor. Fresh drop but 19 days is still early. Good LRT story but wait another 2-3 weeks to see if they drop again before making a move.",cashFlow:80,capRate:4.8,walkScore:89,transitScore:93,schoolScore:75},
  {id:"ML011",address:"7789 Magistrate Terr",neighbourhood:"Meadowvale",price:775000,beds:4,baths:3,sqft:1950,dom:44,priceReduction:9.1,originalPrice:853000,estimatedRent:4000,type:"Townhouse",lrtAccess:false,brokerage:"Cityscape Real Estate Ltd.",hamzaScore:8.0,hamzaNotes:"9.1% drop is significant for this price point. Meadowvale Business Park nearby = strong rental demand from tech workers. Walkout basement adds legal unit potential.",cashFlow:290,capRate:5.2,walkScore:79,transitScore:71,schoolScore:89},
  {id:"ML012",address:"432 Queen St S",neighbourhood:"Streetsville",price:899000,beds:2,baths:2,sqft:1750,dom:11,priceReduction:0,originalPrice:899000,estimatedRent:4000,type:"Detached",lrtAccess:false,brokerage:"Harvey Kalles Real Estate Ltd.",hamzaScore:5.7,hamzaNotes:"Streetsville main drag. Character home but asking full price 11 days in. I want to see 30+ days before engaging. No urgency here.",cashFlow:-60,capRate:4.0,walkScore:88,transitScore:67,schoolScore:87},
  {id:"ML013",address:"1590 Carolyn Rd",neighbourhood:"Erin Mills",price:869000,beds:4,baths:3,sqft:2050,dom:67,priceReduction:12.4,originalPrice:992000,estimatedRent:4300,type:"Detached",lrtAccess:false,brokerage:"Intercity Realty Inc.",hamzaScore:9.0,hamzaNotes:"HAMZA'S PICK. 12.4% price reduction on a 4-bed det — seller has been sitting 67 days and is motivated. All brick, detached, basement suite potential. This is the best value in the neighbourhood right now.",cashFlow:460,capRate:5.6,walkScore:73,transitScore:68,schoolScore:92,dealOfWeek:true},
  {id:"ML014",address:"88 Port St E",neighbourhood:"Port Credit",price:1195000,beds:2,baths:2,sqft:1200,dom:5,priceReduction:0,originalPrice:1195000,estimatedRent:4800,type:"Condo",lrtAccess:true,brokerage:"Chestnut Park Real Estate Limited",hamzaScore:5.4,hamzaNotes:"Port Credit condo, fresh listing. Numbers don't work for investors at this price. Pure lifestyle buy. Pass.",cashFlow:-320,capRate:3.5,walkScore:94,transitScore:85,schoolScore:80},
  {id:"ML015",address:"3956 Tomken Rd",neighbourhood:"Malton",price:629000,beds:3,baths:2,sqft:1380,dom:31,priceReduction:4.4,originalPrice:658000,estimatedRent:3400,type:"Semi-Detached",lrtAccess:false,brokerage:"Ipro Realty Ltd.",hamzaScore:6.2,hamzaNotes:"Malton semi, modest drop. Decent cash flow but limited appreciation upside. Buy only if cash flow is your primary goal.",cashFlow:95,capRate:4.9,walkScore:76,transitScore:82,schoolScore:73},
  {id:"ML016",address:"1122 Clarkson Rd N",neighbourhood:"Clarkson",price:1025000,beds:4,baths:3,sqft:2200,dom:42,priceReduction:6.8,originalPrice:1100000,estimatedRent:4600,type:"Detached",lrtAccess:true,brokerage:"Royal LePage Signature Realty",hamzaScore:8.7,hamzaNotes:"LRT access + 6.8% reduction + 42 DOM. Clarkson is my top neighbourhood for 2025-2026. This hits the trifecta. Strong buy.",cashFlow:380,capRate:5.3,walkScore:77,transitScore:86,schoolScore:85},
  {id:"ML017",address:"671 Bristol Rd W",neighbourhood:"Hurontario",price:699000,beds:3,baths:2,sqft:1500,dom:26,priceReduction:3.7,originalPrice:726000,estimatedRent:3500,type:"Townhouse",lrtAccess:true,brokerage:"Sutton Group Elite Realty Inc.",hamzaScore:7.0,hamzaNotes:"Hurontario corridor townhouse with LRT access. Small drop, early days. Watch it another 2 weeks — if still sitting, make an aggressive offer.",cashFlow:110,capRate:4.5,walkScore:83,transitScore:94,schoolScore:77},
  {id:"ML018",address:"2445 Burnhamthorpe Rd",neighbourhood:"Churchill Meadows",price:819000,beds:4,baths:3,sqft:1920,dom:55,priceReduction:0.9,originalPrice:827000,estimatedRent:4100,type:"Detached",lrtAccess:false,brokerage:"RE/MAX Realty Specialists",hamzaScore:6.7,hamzaNotes:"Churchill Meadows detached but the drop is tiny. 55 days suggests overpricing. Needs a 5%+ reduction before I would touch this.",cashFlow:170,capRate:4.6,walkScore:80,transitScore:69,schoolScore:93},
  {id:"ML019",address:"509 Lakeshore Rd E",neighbourhood:"Lakeview",price:1250000,beds:3,baths:2,sqft:1700,dom:14,priceReduction:1.5,originalPrice:1269000,estimatedRent:5000,type:"Detached",lrtAccess:false,brokerage:"Sotheby's International Realty Canada",hamzaScore:6.3,hamzaNotes:"Lakeview bungalow on a large lot. Redevelopment play long-term but cap rate today is weak. Patient money only.",cashFlow:-150,capRate:3.9,walkScore:69,transitScore:66,schoolScore:81},
  {id:"ML020",address:"4123 Periwinkle Cres",neighbourhood:"Hurontario",price:749000,beds:3,baths:3,sqft:1680,dom:39,priceReduction:5.9,originalPrice:796000,estimatedRent:3800,type:"Townhouse",lrtAccess:true,brokerage:"Right At Home Realty",hamzaScore:7.9,hamzaNotes:"LRT access + 5.9% drop + 39 DOM. Townhouse in the Hurontario corridor is a strong medium-term hold. Cash flow positive and the LRT story isn't priced in yet.",cashFlow:220,capRate:4.9,walkScore:85,transitScore:92,schoolScore:79}
];

const HOOD_DATA = {
  "Clarkson":     {trend:"hot",   avgPrice:1002000, priceYoY:8.2,  avgDOM:38, inventory:"Low",    rentYield:5.1, note:"LRT corridor + GO station = best appreciation play 2025-2026"},
  "Port Credit":  {trend:"hot",   avgPrice:1198000, priceYoY:6.9,  avgDOM:21, inventory:"Low",    rentYield:3.8, note:"Premium lifestyle. Appreciation play only — numbers don't pencil for investors"},
  "Lakeview":     {trend:"warm",  avgPrice:1089000, priceYoY:5.4,  avgDOM:29, inventory:"Low",    rentYield:4.1, note:"Up-and-coming. Big redevelopment. Buy land, not condos"},
  "Churchill Meadows":{trend:"warm",avgPrice:843000,priceYoY:4.1,  avgDOM:47, inventory:"Medium", rentYield:4.7, note:"Top schools = stable family rental demand"},
  "Streetsville":  {trend:"warm",  avgPrice:921000, priceYoY:3.8,  avgDOM:44, inventory:"Medium", rentYield:4.6, note:"Village charm + Credit River. Undervalued vs Port Credit"},
  "Erin Mills":   {trend:"warm",  avgPrice:862000, priceYoY:3.2,  avgDOM:51, inventory:"Medium", rentYield:4.9, note:"Good schools, highways, affordability. Steady hold asset"},
  "Cooksville":   {trend:"warm",  avgPrice:731000, priceYoY:3.9,  avgDOM:42, inventory:"Medium", rentYield:5.0, note:"LRT corridor sleeper. Under the radar, not for long"},
  "Hurontario":   {trend:"warm",  avgPrice:718000, priceYoY:3.5,  avgDOM:45, inventory:"Medium", rentYield:4.8, note:"Hurontario LRT will reprice this corridor over next 3 years"},
  "Meadowvale":   {trend:"cool",  avgPrice:764000, priceYoY:2.1,  avgDOM:58, inventory:"High",   rentYield:4.9, note:"Steady but slow. Buy underpriced, cash flow it"},
  "Malton":       {trend:"cool",  avgPrice:618000, priceYoY:1.8,  avgDOM:62, inventory:"High",   rentYield:5.1, note:"Highest cash flow yields in the city. Appreciation is slow"}
};

const QUIZ = [
  {q:"What is your primary investment goal?",opts:["Monthly cash flow","Long-term appreciation","BRRR strategy","Pre-construction gains"]},
  {q:"What is your investment timeline?",opts:["1-2 years","3-5 years","5-10 years","10+ years"]},
  {q:"What is your available down payment?",opts:["Under $100K","$100K-$200K","$200K-$350K","$350K+"]},
  {q:"How hands-on do you want to be?",opts:["Fully passive","Light management","Active landlord","Full BRRR renovator"]}
];

const QUIZ_RESULTS = {
  cashflow: {title:"Cash Flow Investor",emoji:"💰",desc:"You want your property working every month. Best neighbourhoods: Malton, Meadowvale, Hurontario corridor. Target multi-unit or townhouse with basement suite.",filter:{cashFlowOnly:true}},
  appreciation: {title:"Appreciation Investor",emoji:"📈",desc:"You are building long-term wealth. Best neighbourhoods: Clarkson LRT corridor, Port Credit, Lakeview. Focus on location over yield.",filter:{neighbourhoods:["Clarkson","Port Credit","Lakeview"]}},
  brrr: {title:"BRRR Investor",emoji:"🔨",desc:"You want to recycle your capital. Target high DOM properties with price reductions in Erin Mills, Streetsville, Churchill Meadows. Look for basement conversion potential.",filter:{priceDropMin:5,domMax:90}},
  precon: {title:"Pre-Construction Investor",emoji:"🏙️",desc:"You want VIP access before public launch. Register for Hamza's Pre-Con VIP list to get floor plans and pricing worksheets before they go public.",filter:{}}
};

const fmtK = n => n >= 1000000 ? "$"+(n/1000000).toFixed(2)+"M" : "$"+(n/1000).toFixed(0)+"K";
const fmtNum = n => n >= 0 ? "+$"+n.toLocaleString()+"/mo" : "-$"+Math.abs(n).toLocaleString()+"/mo";
const calcMonthly = (price, downPct, rate, years) => {
  const principal = price * (1 - downPct/100);
  const r = rate/100/12;
  const n = years*12;
  return Math.round(principal * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1));
};

const GOLD="#7EC8E3"; const NAVY="#07111F"; const CARD="#0C1A2E"; const BORDER="rgba(126,200,227,0.12)";
const GREEN="#34D399"; const RED="#F87171"; const BLUE="#38BDF8";
const GOLD2="#5BB3D0"; const ACCENT="#A8DAEB";

export default function App() {
  const [view, setView] = useState("grid");
  const [propType, setPropType] = useState("All");
  const [sort, setSort] = useState("score");
  const [search, setSearch] = useState("");
  const [chips, setChips] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({priceMin:400000,priceMax:2000000,bedsMin:0,domMax:999,priceDropMin:0,neighbourhoods:[]});
  const [selectedListing, setSelectedListing] = useState(null);
  const [modalTab, setModalTab] = useState("overview");
  const [isRegistered, setIsRegistered] = useState(false);
  const [freeViews, setFreeViews] = useState(1);
  const [showRegModal, setShowRegModal] = useState(false);
  const [pendingListing, setPendingListing] = useState(null);
  const [regForm, setRegForm] = useState({name:"",phone:"",email:""});
  const [preconForm, setPreconForm] = useState({name:"",phone:"",email:"",budget:"Under $700K",areas:[]});
  const [preconSubmitted, setPreconSubmitted] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [sellerForm, setSellerForm] = useState({name:"",phone:"",email:"",address:"",type:"Detached",beds:"3"});
  const [sellerSubmitted, setSellerSubmitted] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizLeadForm, setQuizLeadForm] = useState({name:"",phone:""});
  const [quizLeadDone, setQuizLeadDone] = useState(false);
  const [mortDown, setMortDown] = useState(20);
  const [mortRate, setMortRate] = useState(5.5);
  const [mortYears, setMortYears] = useState(25);
  const [brrrReno, setBrrrReno] = useState(60000);
  const [brrrARV, setBrrrARV] = useState(115);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");

  const toggleChip = c => { const s=new Set(chips); s.has(c)?s.delete(c):s.add(c); setChips(s); };
  const toggleHood = h => { const arr=[...filters.neighbourhoods]; const i=arr.indexOf(h); i>=0?arr.splice(i,1):arr.push(h); setFilters(f=>({...f,neighbourhoods:arr})); };

  const filtered = useMemo(() => {
    let lst = LISTINGS.filter(l => {
      if(search && !l.address.toLowerCase().includes(search.toLowerCase()) && !l.neighbourhood.toLowerCase().includes(search.toLowerCase())) return false;
      if(propType!=="All" && l.type!==propType) return false;
      if(l.price<filters.priceMin||l.price>filters.priceMax) return false;
      if(l.beds<filters.bedsMin) return false;
      if(l.dom>filters.domMax) return false;
      if(l.priceReduction<filters.priceDropMin) return false;
      if(filters.neighbourhoods.length>0&&!filters.neighbourhoods.includes(l.neighbourhood)) return false;
      if(chips.has("pricedrop")&&l.priceReduction===0) return false;
      if(chips.has("under800")&&l.price>=800000) return false;
      if(chips.has("cashflow")&&l.cashFlow<=0) return false;
      if(chips.has("lrt")&&!l.lrtAccess) return false;
      if(chips.has("motivated")&&l.dom<40) return false;
      return true;
    });
    if(sort==="score") lst.sort((a,b)=>b.hamzaScore-a.hamzaScore);
    else if(sort==="price") lst.sort((a,b)=>a.price-b.price);
    else if(sort==="dom") lst.sort((a,b)=>b.dom-a.dom);
    else if(sort==="drop") lst.sort((a,b)=>b.priceReduction-a.priceReduction);
    else if(sort==="cf") lst.sort((a,b)=>b.cashFlow-a.cashFlow);
    return lst;
  },[search,propType,sort,filters,chips]);

  const handleListingClick = l => {
    if(isRegistered||freeViews>0){
      setSelectedListing(l); setModalTab("overview"); setAiResult("");
      if(!isRegistered) setFreeViews(v=>v-1);
    } else { setPendingListing(l); setShowRegModal(true); }
  };

  const handleRegister = () => {
    if(!regForm.name||!regForm.phone) return;
    setIsRegistered(true); setShowRegModal(false);
    if(pendingListing){ setSelectedListing(pendingListing); setModalTab("overview"); setPendingListing(null); }
    const msg=encodeURIComponent("NEW LEAD - MississaugaInvestor.ca\n\nName: "+regForm.name+"\nPhone: "+regForm.phone+"\nEmail: "+regForm.email+"\n\nFollow up ASAP!");
    window.open("https://wa.me/16476091289?text="+msg,"_blank");
  };

  const runAI = async (listing) => {
    setAiLoading(true); setAiResult("");
    try {
      const res = await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({listing})});
      const d = await res.json();
      setAiResult(d.result||"Analysis unavailable.");
    } catch(e){ setAiResult("Analysis service unavailable. Please try again later."); }
    setAiLoading(false);
  };

  const sel = selectedListing;
  const monthly = sel ? calcMonthly(sel.price, mortDown, mortRate, mortYears) : 0;
  const arv = sel ? Math.round(sel.price*(brrrARV/100)) : 0;
  const refiAmount = sel ? Math.round(arv*0.75) : 0;
  const totalInvested = sel ? sel.price*mortDown/100 + brrrReno : 0;
  const cashRecovered = sel ? refiAmount - sel.price*(1-mortDown/100) : 0;

  const scoreColor = s => s>=8.5?"#10B981":s>=7?"#7EC8E3":s>=5.5?"#94A3B8":"#EF4444";
  const trendColor = t => t==="hot"?"#EF4444":t==="warm"?"#F59E0B":"#3B82F6";
  const trendLabel = t => t==="hot"?"🔥 HOT":t==="warm"?"📈 WARM":"🧊 COOL";

  const stats = {
    total: LISTINGS.length,
    priceDrops: LISTINGS.filter(l=>l.priceReduction>0).length,
    cashFlowPos: LISTINGS.filter(l=>l.cashFlow>0).length,
    lrtAccess: LISTINGS.filter(l=>l.lrtAccess).length
  };

  const InputF = ({label,val,onChange,type="text",ph=""}) => (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:600,color:"#94A3B8",marginBottom:5,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>
      <input type={type} value={val} onChange={e=>onChange(e.target.value)} placeholder={ph}
        style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"11px 14px",fontSize:13,color:"#F8FAFC",fontFamily:"inherit"}}/>
    </div>
  );

  const Btn = ({children,onClick,disabled,style={}}) => (
    <button onClick={onClick} disabled={disabled} className="mbtn"
      style={{background:disabled?"#0F2A40":GOLD,color:disabled?"#64748B":"#060B15",border:"none",borderRadius:12,padding:"13px 24px",fontWeight:700,fontSize:14,cursor:disabled?"default":"pointer",fontFamily:"inherit",transition:"background .2s",...style}}>
      {children}
    </button>
  );

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:NAVY,minHeight:"100vh",color:"#F8FAFC"}}>
      <style>{G}</style>

      {/* ── HEADER ── */}
      <header style={{background:"rgba(6,11,21,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid "+BORDER,position:"sticky",top:0,zIndex:100,padding:"0 24px"}}>
        <div style={{maxWidth:1300,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:8,background:"linear-gradient(135deg,#1A4A6B,#0F3355)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⬡</div>
            <div>
              <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:17,color:"#F8FAFC",lineHeight:1}}>MississaugaInvestor</div>
              <div style={{fontSize:10,color:GOLD,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Investment Intelligence</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setShowSellerModal(true)} style={{background:"rgba(126,200,227,0.08)",border:"1px solid rgba(126,200,227,0.25)",color:GOLD,borderRadius:10,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🏷️ What Is My Home Worth?</button>
            <a href="tel:6476091289" style={{background:"linear-gradient(135deg,#5BB3D0,#2A8BB0)",color:"#060B15",borderRadius:10,padding:"8px 16px",fontSize:12,fontWeight:700,textDecoration:"none"}}>📞 647-609-1289</a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div style={{background:"linear-gradient(135deg,#060B15 0%,#0D1828 50%,#060B15 100%)",borderBottom:"1px solid "+BORDER,padding:"36px 24px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundImage:"radial-gradient(circle at 20% 50%, rgba(126,200,227,0.05) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.04) 0%, transparent 50%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:1300,margin:"0 auto"}}>
          <div style={{animation:"fadeUp .6s ease"}}>
            <div style={{fontSize:11,color:GOLD,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Mississauga Real Estate Intelligence</div>
            <h1 style={{fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:"clamp(26px,4vw,42px)",lineHeight:1.15,marginBottom:8}}>
              Find Investment Properties<br/><span style={{color:GOLD}}>Before Anyone Else</span>
            </h1>
            <p style={{fontSize:14,color:"#94A3B8",marginBottom:24,maxWidth:500,lineHeight:1.7}}>
              Powered by Hamza Nouman &bull; Royal LePage Signature Realty &bull; 647-609-1289
            </p>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:24,animation:"fadeUp .7s ease"}}>
            <div style={{flex:1,maxWidth:520,position:"relative"}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search address, neighbourhood, MLS#, or property type..."
                style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"13px 48px 13px 44px",fontSize:14,color:"#F8FAFC",fontFamily:"inherit"}}/>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,opacity:0.4}}>🔍</span>
            </div>
            <button onClick={()=>setShowFilters(f=>!f)} style={{background:showFilters?"rgba(126,200,227,0.15)":"rgba(255,255,255,0.06)",border:"1.5px solid "+(showFilters?GOLD:"rgba(255,255,255,0.1)"),color:showFilters?GOLD:"#94A3B8",borderRadius:12,padding:"0 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
              ⚙️ Filters {showFilters?"▲":"▼"}
            </button>
          </div>
          {showFilters&&(
            <div style={{background:"rgba(13,24,40,0.9)",border:"1px solid "+BORDER,borderRadius:16,padding:"20px",marginBottom:20,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,animation:"fadeIn .2s ease"}}>
              {[{l:"Min Price",key:"priceMin",type:"number",ph:"400000"},{l:"Max Price",key:"priceMax",type:"number",ph:"2000000"},{l:"Min Beds",key:"bedsMin",type:"number",ph:"0"},{l:"Max DOM",key:"domMax",type:"number",ph:"999"},{l:"Min Price Drop %",key:"priceDropMin",type:"number",ph:"0"}].map(f=>(
                <div key={f.key}>
                  <div style={{fontSize:10,color:"#94A3B8",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>{f.l}</div>
                  <input type={f.type} value={filters[f.key]} onChange={e=>setFilters(x=>({...x,[f.key]:Number(e.target.value)}))} placeholder={f.ph}
                    style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#F8FAFC",fontFamily:"inherit"}}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:"#94A3B8",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Neighbourhood</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {Object.keys(HOOD_DATA).map(h=>(
                    <button key={h} className="chip" onClick={()=>toggleHood(h)}
                      style={{background:filters.neighbourhoods.includes(h)?"rgba(126,200,227,0.15)":"rgba(255,255,255,0.04)",border:"1px solid "+(filters.neighbourhoods.includes(h)?GOLD:"rgba(255,255,255,0.1)"),color:filters.neighbourhoods.includes(h)?GOLD:"#94A3B8",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:24,flexWrap:"wrap",animation:"fadeUp .8s ease"}}>
            {[{l:"Active Listings",v:stats.total,icon:"🏠"},{l:"Price Reduced",v:stats.priceDrops,icon:"📉"},{l:"Cash Flow+",v:stats.cashFlowPos,icon:"💰"},{l:"LRT Access",v:stats.lrtAccess,icon:"🚇"}].map(s=>(
              <div key={s.l} style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18}}>{s.icon}</span>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,color:"#F8FAFC",lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:10,color:"#64748B",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{s.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── NAV TABS ── */}
      <div style={{background:"rgba(13,24,40,0.8)",backdropFilter:"blur(10px)",borderBottom:"1px solid "+BORDER,position:"sticky",top:64,zIndex:99}}>
        <div style={{maxWidth:1300,margin:"0 auto",padding:"0 24px",display:"flex",gap:2,overflowX:"auto"}}>
          {[{id:"grid",icon:"🏠",label:"Listings"},{id:"precon",icon:"🏙️",label:"Pre-Con VIP"},{id:"pulse",icon:"📊",label:"Market Pulse"},{id:"map",icon:"🗺️",label:"Map"},{id:"hoods",icon:"📍",label:"Hoods"},{id:"quiz",icon:"🧠",label:"Find My Deal"}].map(t=>(
            <button key={t.id} className="tbtn" onClick={()=>setView(t.id)}
              style={{background:view===t.id?"rgba(126,200,227,0.12)":"transparent",color:view===t.id?GOLD:"#94A3B8",border:"none",borderBottom:view===t.id?"2px solid "+GOLD:"2px solid transparent",padding:"14px 16px",fontSize:13,fontWeight:view===t.id?700:500,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID VIEW ── */}
      {view==="grid"&&(
        <div style={{maxWidth:1300,margin:"0 auto",padding:"24px"}}>
          {/* Deal of Week */}
          {LISTINGS.filter(l=>l.dealOfWeek).map(l=>(
            <div key={l.id} className="card" onClick={()=>handleListingClick(l)} style={{background:"linear-gradient(135deg,#0C1A2E,#0F2040)",border:"1px solid rgba(126,200,227,0.3)",borderRadius:18,padding:"20px 24px",marginBottom:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{background:"rgba(126,200,227,0.15)",borderRadius:12,padding:"10px 16px",border:"1px solid rgba(126,200,227,0.3)"}}>
                  <div style={{fontSize:10,color:GOLD,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>⭐ Hamza&apos;s Pick of the Week</div>
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:17,color:"#F8FAFC"}}>{l.address}</div>
                  <div style={{fontSize:13,color:"#94A3B8"}}>{l.neighbourhood} · {l.type} · {l.beds}bd {l.baths}ba</div>
                </div>
              </div>
              <div style={{display:"flex",gap:20,alignItems:"center"}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,color:GOLD}}>{fmtK(l.price)}</div>
                  <div style={{fontSize:11,color:GREEN,fontWeight:600}}>▼ {l.priceReduction}% · {l.dom} days on market</div>
                </div>
                <div style={{background:"linear-gradient(135deg,#5BB3D0,#2A8BB0)",borderRadius:10,padding:"10px 20px",color:"#060B15",fontWeight:700,fontSize:13}}>View Analysis →</div>
              </div>
            </div>
          ))}

          {/* Controls */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {["All","Detached","Semi-Detached","Townhouse","Condo"].map(t=>(
                <button key={t} className="chip" onClick={()=>setPropType(t)}
                  style={{background:propType===t?"rgba(126,200,227,0.15)":"rgba(255,255,255,0.04)",border:"1.5px solid "+(propType===t?GOLD:"rgba(255,255,255,0.1)"),color:propType===t?GOLD:"#94A3B8",borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:propType===t?700:500,cursor:"pointer",fontFamily:"inherit"}}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,color:"#64748B"}}>{filtered.length} listings · Sort:</span>
              <select value={sort} onChange={e=>setSort(e.target.value)}
                style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#F8FAFC",borderRadius:8,padding:"6px 10px",fontSize:12,fontFamily:"inherit"}}>
                <option value="score">Hamza&apos;s Score</option>
                <option value="price">Price ↑</option>
                <option value="priceDesc">Price ↓</option>
                <option value="dom">Days on Market</option>
                <option value="drop">Biggest Drop</option>
                <option value="cf">Cash Flow</option>
              </select>
            </div>
          </div>

          {/* Quick chips */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
            {[{k:"pricedrop",l:"📉 Price Reduced"},{k:"motivated",l:"⏰ 40+ Days Listed"},{k:"under800",l:"💲 Under $800K"},{k:"cashflow",l:"💰 Cash Flow+"},{k:"lrt",l:"🚇 LRT Access"}].map(c=>(
              <button key={c.k} className={"chip"+(chips.has(c.k)?" active":"")} onClick={()=>toggleChip(c.k)}
                style={{background:chips.has(c.k)?"rgba(126,200,227,0.15)":"rgba(255,255,255,0.04)",border:"1.5px solid "+(chips.has(c.k)?GOLD:"rgba(255,255,255,0.08)"),color:chips.has(c.k)?GOLD:"#64748B",borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:chips.has(c.k)?700:500,cursor:"pointer",fontFamily:"inherit"}}>
                {c.l}
              </button>
            ))}
          </div>

          {/* Listing Cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:18}}>
            {filtered.map(l=>(
              <div key={l.id} className="card" onClick={()=>handleListingClick(l)}
                style={{background:CARD,borderRadius:18,overflow:"hidden",border:"1px solid "+BORDER,cursor:"pointer",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
                {/* Photo area */}
                <div style={{height:170,background:"linear-gradient(135deg,#0C1A2E,#0F2040)",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{textAlign:"center",opacity:0.2}}>
                    <div style={{fontSize:48}}>🏠</div>
                  </div>
                  <div style={{position:"absolute",top:12,left:12,display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span style={{background:l.type==="Detached"?"#1B4FD8":l.type==="Condo"?"#7C3AED":"#0F766E",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{l.type}</span>
                    {l.lrtAccess&&<span style={{background:"rgba(14,165,233,0.9)",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20}}>🚇 LRT</span>}
                  </div>
                  {l.priceReduction>0&&(
                    <div style={{position:"absolute",top:12,right:12,background:"rgba(239,68,68,0.9)",color:"#fff",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20}}>▼ {l.priceReduction}%</div>
                  )}
                  <div style={{position:"absolute",bottom:12,right:12,background:"rgba(6,11,21,0.85)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"4px 10px",fontSize:11,color:"#94A3B8"}}>
                    {l.dom} days listed
                  </div>
                </div>
                {/* Card body */}
                <div style={{padding:"16px"}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,color:"#F8FAFC",marginBottom:2}}>{fmtK(l.price)}</div>
                  {l.priceReduction>0&&<div style={{fontSize:11,color:"#64748B",marginBottom:6,textDecoration:"line-through"}}>{fmtK(l.originalPrice)}</div>}
                  <div style={{fontSize:14,fontWeight:600,color:"#CBD5E1",marginBottom:4}}>{l.address}</div>
                  <div style={{fontSize:12,color:"#64748B",marginBottom:12}}>{l.neighbourhood}</div>
                  <div style={{display:"flex",gap:16,marginBottom:14}}>
                    {[{l:`${l.beds} Bed`},{l:`${l.baths} Bath`},{l:`${l.sqft.toLocaleString()} sqft`}].map(x=>(
                      <div key={x.l} style={{fontSize:12,color:"#94A3B8",fontWeight:600}}>{x.l}</div>
                    ))}
                  </div>
                  <div style={{borderTop:"1px solid "+BORDER,paddingTop:12,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:10,color:"#475569",fontStyle:"italic"}}>Courtesy of {l.brokerage}</div>
                  </div>
                  <button style={{width:"100%",background:"rgba(126,200,227,0.1)",border:"1px solid rgba(126,200,227,0.3)",color:GOLD,borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    View Investment Analysis →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length===0&&(
            <div style={{textAlign:"center",padding:"60px 0",color:"#475569"}}>
              <div style={{fontSize:48,marginBottom:12}}>🔍</div>
              <div style={{fontSize:16,fontWeight:600}}>No listings match your filters</div>
              <div style={{fontSize:13,marginTop:4}}>Try adjusting your search or clearing filters</div>
            </div>
          )}

          <div style={{marginTop:28,padding:"14px 20px",background:"rgba(13,24,40,0.5)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,fontSize:11,color:"#475569",lineHeight:1.8}}>
            The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by The Canadian Real Estate Association (CREA) and identify the quality of services provided by real estate professionals who are members of CREA. All listing information is provided by TRREB and is deemed reliable but not guaranteed. Hamza Nouman is a registered Sales Representative with Royal LePage Signature Realty, Brokerage. Investment analysis and deal scoring is the sole opinion of Hamza Nouman and does not constitute financial advice.
          </div>
        </div>
      )}

      {/* ── MAP VIEW ── */}
      {view==="map"&&(
        <div style={{maxWidth:1300,margin:"0 auto",padding:"40px 24px",textAlign:"center"}}>
          <div style={{background:CARD,border:"1px solid "+BORDER,borderRadius:20,padding:"60px 40px"}}>
            <div style={{fontSize:64,marginBottom:16}}>🗺️</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:700,color:"#F8FAFC",marginBottom:8}}>Interactive Map Coming Soon</div>
            <div style={{fontSize:14,color:"#64748B",maxWidth:400,margin:"0 auto",lineHeight:1.8}}>
              Full MLS map with live listing pins, price heat maps, and neighbourhood overlays — launching once TRREB data feed is connected.
            </div>
          </div>
        </div>
      )}

      {/* ── MARKET PULSE ── */}
      {view==="pulse"&&(
        <div style={{maxWidth:1300,margin:"0 auto",padding:"28px 24px"}}>
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:700,color:"#F8FAFC",marginBottom:4}}>Mississauga Market Pulse</div>
            <div style={{fontSize:13,color:"#64748B"}}>Neighbourhood-by-neighbourhood intelligence — updated weekly</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
            {Object.entries(HOOD_DATA).map(([h,d])=>(
              <div key={h} className="card" style={{background:CARD,border:"1px solid "+BORDER,borderRadius:16,padding:"20px",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:15,color:"#F8FAFC"}}>{h}</div>
                  <span style={{background:"rgba("+( d.trend==="hot"?"239,68,68":d.trend==="warm"?"245,158,11":"59,130,246")+",0.15)",color:trendColor(d.trend),fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,border:"1px solid "}}>{trendLabel(d.trend)}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  {[{l:"Avg Price",v:fmtK(d.avgPrice)},{l:"YoY Growth",v:"+"+d.priceYoY+"%"},{l:"Avg DOM",v:d.avgDOM+" days"},{l:"Rent Yield",v:d.rentYield+"%"}].map(s=>(
                    <div key={s.l} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"9px 10px",border:"1px solid rgba(255,255,255,0.05)"}}>
                      <div style={{fontSize:9,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>{s.l}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:"#F8FAFC"}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"rgba(126,200,227,0.07)",border:"1px solid rgba(126,200,227,0.15)",borderRadius:8,padding:"9px 12px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:GOLD,marginBottom:3}}>💬 Hamza&apos;s Take</div>
                  <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.6}}>{d.note}</div>
                </div>
                <div style={{marginTop:10,fontSize:10,color:"#475569"}}>Inventory: {d.inventory}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HOODS VIEW ── */}
      {view==="hoods"&&(
        <div style={{maxWidth:1300,margin:"0 auto",padding:"28px 24px"}}>
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:700,color:"#F8FAFC",marginBottom:4}}>Neighbourhood Profiles</div>
            <div style={{fontSize:13,color:"#64748B"}}>Deep dives on every major Mississauga investment neighbourhood</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:18}}>
            {Object.entries(HOOD_DATA).map(([h,d])=>{
              const hoodListings = LISTINGS.filter(l=>l.neighbourhood===h);
              return (
                <div key={h} className="card" style={{background:CARD,border:"1px solid "+BORDER,borderRadius:18,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
                  <div style={{background:"linear-gradient(135deg,#0C1A2E,#0F2040)",padding:"20px",borderBottom:"1px solid "+BORDER}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,color:"#F8FAFC",marginBottom:4}}>{h}</div>
                        <div style={{fontSize:12,color:"#64748B"}}>{hoodListings.length} active listings</div>
                      </div>
                      <span style={{background:"rgba("+( d.trend==="hot"?"239,68,68":d.trend==="warm"?"245,158,11":"59,130,246")+",0.15)",color:trendColor(d.trend),fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20}}>{trendLabel(d.trend)}</span>
                    </div>
                  </div>
                  <div style={{padding:"18px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                      {[{l:"Avg Price",v:fmtK(d.avgPrice)},{l:"YoY",v:"+"+d.priceYoY+"%"},{l:"Yield",v:d.rentYield+"%"}].map(s=>(
                        <div key={s.l} style={{textAlign:"center",background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 6px",border:"1px solid rgba(255,255,255,0.05)"}}>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:"#F8FAFC"}}>{s.v}</div>
                          <div style={{fontSize:9,color:"#64748B",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:12,color:"#94A3B8",lineHeight:1.7,marginBottom:14}}>{d.note}</div>
                    <button onClick={()=>{setView("grid");setFilters(f=>({...f,neighbourhoods:[h]}));}} style={{width:"100%",background:"rgba(126,200,227,0.1)",border:"1px solid rgba(126,200,227,0.3)",color:GOLD,borderRadius:10,padding:"10px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      View {h} Listings →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PRE-CON VIEW ── */}
      {view==="precon"&&(
        <div style={{maxWidth:620,margin:"0 auto",padding:"48px 24px"}}>
          {!preconSubmitted?(
            <div style={{background:CARD,borderRadius:24,border:"1px solid "+BORDER,overflow:"hidden"}}>
              <div style={{background:"linear-gradient(135deg,#0C1A2E,#0F2040)",padding:"40px",textAlign:"center",borderBottom:"1px solid "+BORDER}}>
                <div style={{fontSize:56,marginBottom:12}}>🏙️</div>
                <div style={{fontSize:11,color:GOLD,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>VIP Pre-Construction Access</div>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:700,color:"#F8FAFC",marginBottom:12,lineHeight:1.3}}>Get In Before The Public</h2>
                <p style={{fontSize:13,color:"#94A3B8",lineHeight:1.8,maxWidth:440,margin:"0 auto"}}>Register for VIP pre-construction access. I will send you projects matching your budget before public launch — including floor plans, pricing, and deposit structures not available online.</p>
              </div>
              <div style={{padding:"32px"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24}}>
                  {[{icon:"🔐",l:"VIP pricing"},{icon:"📐",l:"Floor plans"},{icon:"📞",l:"Direct access"}].map(b=>(
                    <div key={b.l} style={{background:"rgba(255,255,255,0.03)",border:"1px solid "+BORDER,borderRadius:12,padding:"14px 10px",textAlign:"center"}}>
                      <div style={{fontSize:24,marginBottom:6}}>{b.icon}</div>
                      <div style={{fontSize:11,fontWeight:600,color:"#94A3B8"}}>{b.l}</div>
                    </div>
                  ))}
                </div>
                {[{l:"Full Name",k:"name",ph:"John Smith",t:"text"},{l:"Phone Number",k:"phone",ph:"647-xxx-xxxx",t:"tel"},{l:"Email",k:"email",ph:"john@email.com",t:"email"}].map(f=>(
                  <InputF key={f.k} label={f.l} val={preconForm[f.k]} onChange={v=>setPreconForm(p=>({...p,[f.k]:v}))} type={f.t} ph={f.ph}/>
                ))}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,color:"#94A3B8",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Investment Budget</div>
                  <select value={preconForm.budget} onChange={e=>setPreconForm(p=>({...p,budget:e.target.value}))}
                    style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"11px 14px",fontSize:13,color:"#F8FAFC",fontFamily:"inherit"}}>
                    {["Under $700K","$700K-$900K","$900K-$1.2M","$1.2M+"].map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,color:"#94A3B8",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Areas of Interest</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {["Port Credit","Cooksville","Hurontario","Erin Mills","Churchill Meadows","Clarkson","Any Mississauga"].map(a=>{
                      const on=(preconForm.areas||[]).includes(a);
                      return <button key={a} type="button" className="chip" onClick={()=>setPreconForm(p=>({...p,areas:on?(p.areas||[]).filter(x=>x!==a):[...(p.areas||[]),a]}))}
                        style={{background:on?"rgba(126,200,227,0.15)":"rgba(255,255,255,0.04)",border:"1px solid "+(on?GOLD:"rgba(255,255,255,0.1)"),color:on?GOLD:"#64748B",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:on?700:400,cursor:"pointer",fontFamily:"inherit"}}>
                        {on?"✓ ":""}{a}
                      </button>;
                    })}
                  </div>
                </div>
                <Btn onClick={()=>{
                  if(!preconForm.name||!preconForm.phone)return;
                  setPreconSubmitted(true);
                  const msg=encodeURIComponent("NEW PRE-CON VIP - MississaugaInvestor.ca\n\nName: "+preconForm.name+"\nPhone: "+preconForm.phone+"\nEmail: "+preconForm.email+"\nBudget: "+preconForm.budget+"\nAreas: "+((preconForm.areas||[]).join(", ")||"Any")+"\n\nFollow up within 24hrs!");
                  window.open("https://wa.me/16476091289?text="+msg,"_blank");
                }} disabled={!preconForm.name||!preconForm.phone} style={{width:"100%",fontSize:15,padding:"15px"}}>
                  🔐 Register for VIP Access
                </Btn>
                <div style={{fontSize:11,color:"#475569",textAlign:"center",marginTop:10,lineHeight:1.6}}>No obligation. No spam. Hamza Nouman · Royal LePage Signature Realty · 647-609-1289</div>
              </div>
            </div>
          ):(
            <div style={{background:CARD,border:"1px solid "+BORDER,borderRadius:24,padding:"60px 36px",textAlign:"center"}}>
              <div style={{fontSize:64,marginBottom:16}}>🎉</div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:700,color:"#F8FAFC",marginBottom:8}}>You&apos;re on the VIP List!</div>
              <div style={{fontSize:14,color:"#64748B",lineHeight:1.8,maxWidth:380,margin:"0 auto 24px"}}>Hamza will contact you within 24 hours with projects matching your budget — before they go public.</div>
              <a href="tel:6476091289" style={{display:"inline-block",background:"rgba(126,200,227,0.08)",border:"1px solid rgba(126,200,227,0.25)",color:GOLD,borderRadius:12,padding:"12px 24px",fontWeight:700,fontSize:14,textDecoration:"none",marginBottom:16}}>📞 647-609-1289</a>
              <br/>
              <button onClick={()=>{setPreconSubmitted(false);setPreconForm({name:"",phone:"",email:"",budget:"Under $700K",areas:[]});setView("grid");}} style={{background:"transparent",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>Back to listings</button>
            </div>
          )}
        </div>
      )}

      {/* ── QUIZ VIEW ── */}
      {view==="quiz"&&(
        <div style={{maxWidth:600,margin:"0 auto",padding:"48px 24px"}}>
          {!quizResult?(
            <div style={{background:CARD,border:"1px solid "+BORDER,borderRadius:24,overflow:"hidden"}}>
              <div style={{background:"linear-gradient(135deg,#0C1A2E,#0F2040)",padding:"32px",textAlign:"center",borderBottom:"1px solid "+BORDER}}>
                <div style={{fontSize:11,color:GOLD,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Deal Type Quiz</div>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:700,color:"#F8FAFC",marginBottom:4}}>Find Your Ideal Investment Strategy</h2>
                <div style={{fontSize:12,color:"#64748B"}}>Question {Math.min(quizStep+1,4)} of 4</div>
                <div style={{display:"flex",gap:4,justifyContent:"center",marginTop:12}}>
                  {[0,1,2,3].map(i=><div key={i} style={{height:3,width:40,borderRadius:3,background:i<=quizStep?GOLD:"rgba(255,255,255,0.1)"}}/>)}
                </div>
              </div>
              <div style={{padding:"32px"}}>
                <div style={{fontSize:16,fontWeight:600,color:"#F8FAFC",marginBottom:20,lineHeight:1.5}}>{QUIZ[quizStep].q}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {QUIZ[quizStep].opts.map(o=>(
                    <button key={o} onClick={()=>{
                      const na={...quizAnswers,[quizStep]:o};
                      setQuizAnswers(na);
                      if(quizStep<3) { setQuizStep(s=>s+1); }
                      else {
                        const a0=na[0]||"";
                        let r="cashflow";
                        if(a0.includes("appreciation")||a0.includes("Pre-construction")) r="appreciation";
                        else if(a0.includes("BRRR")) r="brrr";
                        else if(a0.includes("Pre-con")) r="precon";
                        setQuizResult(QUIZ_RESULTS[r]);
                      }
                    }}
                      style={{background:quizAnswers[quizStep]===o?"rgba(126,200,227,0.15)":"rgba(255,255,255,0.04)",border:"1.5px solid "+(quizAnswers[quizStep]===o?GOLD:"rgba(255,255,255,0.08)"),color:quizAnswers[quizStep]===o?GOLD:"#94A3B8",borderRadius:12,padding:"14px 12px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textAlign:"left",lineHeight:1.4}}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ):(
            <div style={{background:CARD,border:"1px solid "+BORDER,borderRadius:24,overflow:"hidden"}}>
              <div style={{background:"linear-gradient(135deg,#0C1A2E,#0F2040)",padding:"32px",textAlign:"center",borderBottom:"1px solid "+BORDER}}>
                <div style={{fontSize:56,marginBottom:12}}>{quizResult.emoji}</div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:700,color:"#F8FAFC",marginBottom:6}}>{quizResult.title}</div>
                <div style={{fontSize:11,color:GOLD,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Your Investor Profile</div>
              </div>
              <div style={{padding:"28px"}}>
                <div style={{fontSize:14,color:"#94A3B8",lineHeight:1.8,marginBottom:24}}>{quizResult.desc}</div>
                {!quizLeadDone?(
                  <>
                    <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:700,color:"#F8FAFC",marginBottom:14}}>Get personalized listings matching your profile</div>
                    <InputF label="Your Name" val={quizLeadForm.name} onChange={v=>setQuizLeadForm(p=>({...p,name:v}))} ph="John Smith"/>
                    <InputF label="Phone Number" val={quizLeadForm.phone} onChange={v=>setQuizLeadForm(p=>({...p,phone:v}))} ph="647-xxx-xxxx" type="tel"/>
                    <Btn onClick={()=>{
                      if(!quizLeadForm.name||!quizLeadForm.phone)return;
                      setQuizLeadDone(true);
                      const msg=encodeURIComponent("QUIZ LEAD - MississaugaInvestor.ca\n\nName: "+quizLeadForm.name+"\nPhone: "+quizLeadForm.phone+"\nProfile: "+quizResult.title+"\n\nMatch them with "+quizResult.title+" properties!");
                      window.open("https://wa.me/16476091289?text="+msg,"_blank");
                      setFilters(f=>({...f,...quizResult.filter}));
                    }} disabled={!quizLeadForm.name||!quizLeadForm.phone} style={{width:"100%",fontSize:15,padding:"14px"}}>
                      📋 Get My Matched Listings
                    </Btn>
                  </>
                ):(
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:32,marginBottom:8}}>✅</div>
                    <div style={{fontWeight:700,color:"#F8FAFC",marginBottom:6}}>Hamza will reach out within 24 hours!</div>
                    <button onClick={()=>{setView("grid");}} style={{background:GOLD,color:"#060B15",border:"none",borderRadius:12,padding:"12px 28px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>View Your Matched Listings →</button>
                  </div>
                )}
                <button onClick={()=>{setQuizStep(0);setQuizAnswers({});setQuizResult(null);setQuizLeadDone(false);}} style={{display:"block",margin:"12px auto 0",background:"transparent",border:"none",color:"#475569",fontSize:12,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>Retake quiz</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LISTING MODAL ── */}
      {sel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px",overflowY:"auto",animation:"fadeIn .2s ease"}} onClick={e=>e.target===e.currentTarget&&setSelectedListing(null)}>
          <div style={{background:"#0D1828",borderRadius:24,width:"100%",maxWidth:800,border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 40px 100px rgba(0,0,0,0.8)"}}>
            {/* Modal header */}
            <div style={{background:"linear-gradient(135deg,#0C1A2E,#0F2040)",padding:"24px",borderRadius:"24px 24px 0 0",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                    <span style={{background:"rgba(126,200,227,0.15)",color:GOLD,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,border:"1px solid rgba(126,200,227,0.3)"}}>{sel.type}</span>
                    {sel.lrtAccess&&<span style={{background:"rgba(14,165,233,0.15)",color:"#38BDF8",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20}}>🚇 LRT Access</span>}
                    {sel.priceReduction>0&&<span style={{background:"rgba(239,68,68,0.15)",color:"#F87171",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20}}>📉 {sel.priceReduction}% Price Reduction</span>}
                  </div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:700,color:"#F8FAFC",marginBottom:2}}>{sel.address}</div>
                  <div style={{fontSize:13,color:"#64748B"}}>{sel.neighbourhood}, Mississauga &bull; {sel.beds}bd {sel.baths}ba {sel.sqft.toLocaleString()}sqft &bull; {sel.dom} days listed</div>
                  <div style={{fontSize:11,color:"#475569",marginTop:4}}>Courtesy of {sel.brokerage}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:26,fontWeight:700,color:"#F8FAFC"}}>{fmtK(sel.price)}</div>
                  {sel.priceReduction>0&&<div style={{fontSize:12,color:"#64748B",textDecoration:"line-through"}}>{fmtK(sel.originalPrice)}</div>}
                  <button onClick={()=>setSelectedListing(null)} style={{marginTop:8,background:"rgba(255,255,255,0.07)",border:"none",color:"#94A3B8",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕ Close</button>
                </div>
              </div>
            </div>

            {/* Modal tabs */}
            <div style={{display:"flex",gap:2,padding:"0 24px",borderBottom:"1px solid rgba(255,255,255,0.07)",overflowX:"auto"}}>
              {[{id:"overview",l:"Overview"},{id:"hamza",l:"Hamza's Take"},{id:"mortgage",l:"Mortgage"},{id:"brrr",l:"BRRR"},{id:"caprate",l:"Cap Rate"},{id:"ai",l:"AI Analysis"}].map(t=>(
                <button key={t.id} className="tbtn" onClick={()=>setModalTab(t.id)}
                  style={{background:"transparent",color:modalTab===t.id?GOLD:"#64748B",border:"none",borderBottom:modalTab===t.id?"2px solid "+GOLD:"2px solid transparent",padding:"12px 14px",fontSize:12,fontWeight:modalTab===t.id?700:500,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                  {t.l}
                </button>
              ))}
            </div>

            <div style={{padding:"24px"}}>
              {/* Overview tab */}
              {modalTab==="overview"&&(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,marginBottom:20}}>
                    {[{l:"Price",v:fmtK(sel.price)},{l:"Bedrooms",v:sel.beds},{l:"Bathrooms",v:sel.baths},{l:"Sqft",v:sel.sqft.toLocaleString()},{l:"Days Listed",v:sel.dom},{l:"Price Drop",v:sel.priceReduction>0?sel.priceReduction+"%":"None"},{l:"Type",v:sel.type},{l:"Neighbourhood",v:sel.neighbourhood}].map(s=>(
                      <div key={s.l} style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"12px",border:"1px solid rgba(255,255,255,0.06)"}}>
                        <div style={{fontSize:9,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:3}}>{s.l}</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:"#F8FAFC"}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
                    {[{l:"Walk Score",v:sel.walkScore,icon:"🚶"},{l:"Transit Score",v:sel.transitScore,icon:"🚌"},{l:"School Score",v:sel.schoolScore,icon:"🎓"}].map(s=>(
                      <div key={s.l} style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"14px",border:"1px solid rgba(255,255,255,0.06)",textAlign:"center"}}>
                        <div style={{fontSize:24,marginBottom:4}}>{s.icon}</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color:s.v>=80?GREEN:s.v>=60?GOLD:"#EF4444"}}>{s.v}</div>
                        <div style={{fontSize:10,color:"#64748B",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:"rgba(59,130,246,0.07)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:12,padding:"14px",fontSize:11,color:"#94A3B8",lineHeight:1.8}}>
                    ⚠️ <strong>MLS Disclaimer:</strong> The trademarks MLS®, Multiple Listing Service® are owned by CREA. Listing information is provided by TRREB and is deemed reliable but not guaranteed. Investment analysis tabs are Hamza Nouman&apos;s personal opinion only and do not constitute financial, legal, or investment advice.
                  </div>
                </div>
              )}

              {/* Hamza's Take tab */}
              {modalTab==="hamza"&&(
                <div>
                  <div style={{background:"rgba(126,200,227,0.07)",border:"1px solid rgba(126,200,227,0.2)",borderRadius:14,padding:"16px 20px",marginBottom:20}}>
                    <div style={{fontSize:11,color:GOLD,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>⚠️ Hamza&apos;s Personal Investment Opinion — Not MLS Data</div>
                    <div style={{fontSize:13,color:"#94A3B8",lineHeight:1.7}}>The following analysis represents Hamza Nouman&apos;s personal assessment based on market experience. It is not derived from MLS data and does not constitute financial advice.</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:20}}>
                    <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"16px",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Hamza&apos;s Score</div>
                      <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:32,fontWeight:700,color:scoreColor(sel.hamzaScore)}}>{sel.hamzaScore}</div>
                        <div style={{fontSize:14,color:"#64748B"}}>/10</div>
                      </div>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"16px",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Est. Monthly Cash Flow*</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:26,fontWeight:700,color:sel.cashFlow>0?GREEN:RED}}>{fmtNum(sel.cashFlow)}</div>
                      <div style={{fontSize:9,color:"#475569",marginTop:4}}>*At 20% down, 5.5%, 25yr</div>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"16px",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Est. Monthly Rent*</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,color:"#F8FAFC"}}>${sel.estimatedRent.toLocaleString()}</div>
                      <div style={{fontSize:9,color:"#475569",marginTop:4}}>*Hamza&apos;s market estimate</div>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"16px",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Est. Cap Rate*</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,color:GOLD}}>{sel.capRate}%</div>
                      <div style={{fontSize:9,color:"#475569",marginTop:4}}>*Hamza&apos;s estimate</div>
                    </div>
                  </div>
                  <div style={{background:"rgba(126,200,227,0.07)",border:"1px solid rgba(126,200,227,0.2)",borderRadius:12,padding:"16px 20px",marginBottom:16}}>
                    <div style={{fontSize:11,fontWeight:700,color:GOLD,marginBottom:8}}>💬 Hamza&apos;s Notes</div>
                    <div style={{fontSize:13,color:"#CBD5E1",lineHeight:1.8}}>{sel.hamzaNotes}</div>
                  </div>
                  <a href={"https://wa.me/16476091289?text="+encodeURIComponent("Hi Hamza, I am interested in "+sel.address+" listed at "+fmtK(sel.price)+". Can we talk?")+"&target=_blank"} onClick={e=>{e.preventDefault();window.open(e.currentTarget.href,"_blank");}}
                    style={{display:"block",width:"100%",background:"linear-gradient(135deg,#25D366,#128C7E)",color:"#fff",borderRadius:12,padding:"14px",fontWeight:700,fontSize:14,textAlign:"center",textDecoration:"none",cursor:"pointer"}}>
                    💬 Ask Hamza About This Property
                  </a>
                </div>
              )}

              {/* Mortgage tab */}
              {modalTab==="mortgage"&&(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
                    {[{l:"Down Payment %",v:mortDown,min:5,max:35,step:5,set:setMortDown,fmt:v=>v+"%"},{l:"Interest Rate %",v:mortRate,min:3,max:9,step:0.25,set:setMortRate,fmt:v=>v+"%"},{l:"Amortization",v:mortYears,min:15,max:30,step:5,set:setMortYears,fmt:v=>v+" yr"}].map(s=>(
                      <div key={s.l} style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"16px",border:"1px solid rgba(255,255,255,0.06)"}}>
                        <div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>{s.l}</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color:GOLD,marginBottom:8}}>{s.fmt(s.v)}</div>
                        <input type="range" min={s.min} max={s.max} step={s.step} value={s.v} onChange={e=>s.set(Number(e.target.value))} style={{width:"100%",accentColor:GOLD}}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:16}}>
                    {[{l:"Purchase Price",v:fmtK(sel.price)},{l:"Down Payment",v:fmtK(sel.price*mortDown/100)},{l:"Mortgage Amount",v:fmtK(sel.price*(1-mortDown/100))},{l:"Monthly Payment",v:"$"+monthly.toLocaleString()},{l:"Est. Monthly Rent*",v:"$"+sel.estimatedRent.toLocaleString()},{l:"Monthly Difference",v:fmtNum(sel.estimatedRent-monthly)}].map(s=>(
                      <div key={s.l} style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"12px",border:"1px solid rgba(255,255,255,0.06)"}}>
                        <div style={{fontSize:9,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:3}}>{s.l}</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:s.l==="Monthly Difference"?(sel.estimatedRent-monthly>0?GREEN:RED):"#F8FAFC"}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:10,color:"#475569",lineHeight:1.7}}>*Rent estimate is Hamza&apos;s market assessment. Actual rent may vary. Does not include property tax, insurance, maintenance, or condo fees. Consult a mortgage professional for exact rates.</div>
                </div>
              )}

              {/* BRRR tab */}
              {modalTab==="brrr"&&(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                    <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"16px",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Renovation Budget</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color:GOLD,marginBottom:8}}>${brrrReno.toLocaleString()}</div>
                      <input type="range" min={20000} max={200000} step={10000} value={brrrReno} onChange={e=>setBrrrReno(Number(e.target.value))} style={{width:"100%",accentColor:GOLD}}/>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"16px",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>After Repair Value % of Purchase</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color:GOLD,marginBottom:8}}>{brrrARV}%</div>
                      <input type="range" min={105} max={140} step={5} value={brrrARV} onChange={e=>setBrrrARV(Number(e.target.value))} style={{width:"100%",accentColor:GOLD}}/>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:16}}>
                    {[{l:"Purchase Price",v:fmtK(sel.price)},{l:"+ Renovation",v:"$"+brrrReno.toLocaleString()},{l:"Total All-In",v:fmtK(sel.price+brrrReno)},{l:"After Repair Value",v:fmtK(arv)},{l:"Refinance @ 75%",v:fmtK(refiAmount)},{l:"Capital Recovered",v:fmtK(Math.max(0,cashRecovered)),highlight:true}].map(s=>(
                      <div key={s.l} style={{background:s.highlight?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.03)",borderRadius:10,padding:"12px",border:"1px solid "+(s.highlight?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.06)")}}>
                        <div style={{fontSize:9,color:s.highlight?"#10B981":"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:3}}>{s.l}</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:s.highlight?GREEN:"#F8FAFC"}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:cashRecovered>0?"rgba(16,185,129,0.07)":"rgba(239,68,68,0.07)",border:"1px solid "+(cashRecovered>0?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)"),borderRadius:12,padding:"14px",fontSize:13,color:cashRecovered>0?"#10B981":"#F87171",fontWeight:600}}>
                    {cashRecovered>0?"✅ This BRRR recovers "+fmtK(cashRecovered)+" of your capital on refinance — your effective cash left in the deal is "+fmtK(totalInvested-cashRecovered)+".":"❌ At these numbers the BRRR does not fully recycle your capital. Adjust reno budget or target a higher ARV property."}
                  </div>
                </div>
              )}

              {/* Cap Rate tab */}
              {modalTab==="caprate"&&(
                <div>
                  <div style={{background:"rgba(126,200,227,0.07)",border:"1px solid rgba(126,200,227,0.15)",borderRadius:12,padding:"14px 18px",marginBottom:20,fontSize:11,color:"#94A3B8",lineHeight:1.7}}>
                    ⚠️ All return estimates below are Hamza Nouman&apos;s personal analysis using estimated market rents. They do not constitute financial advice. Consult a financial advisor before investing.
                  </div>
                  {(()=>{
                    const annualRent = sel.estimatedRent * 12;
                    const expenses = annualRent * 0.35;
                    const noi = annualRent - expenses;
                    const capRate = ((noi / sel.price) * 100).toFixed(2);
                    const cashInvested = sel.price * mortDown / 100;
                    const annualMort = monthly * 12;
                    const annualCF = noi - annualMort;
                    const coc = ((annualCF / cashInvested) * 100).toFixed(2);
                    const grm = (sel.price / annualRent).toFixed(2);
                    return (
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
                        {[{l:"Annual Gross Rent*",v:"$"+annualRent.toLocaleString()},{l:"Vacancy + Expenses (35%)",v:"-$"+Math.round(expenses).toLocaleString()},{l:"Net Operating Income",v:"$"+Math.round(noi).toLocaleString()},{l:"Cap Rate",v:capRate+"%",big:true},{l:"Cash-on-Cash Return",v:coc+"%",big:true},{l:"Gross Rent Multiplier",v:grm+"x"},{l:"Annual Cash Flow",v:"$"+Math.round(annualCF).toLocaleString(),cf:true},{l:"Monthly Cash Flow",v:"$"+Math.round(annualCF/12).toLocaleString()+"/mo",cf:true}].map(s=>(
                          <div key={s.l} style={{background:s.big?"rgba(126,200,227,0.08)":s.cf?( annualCF>0?"rgba(16,185,129,0.07)":"rgba(239,68,68,0.07)"):"rgba(255,255,255,0.03)",borderRadius:10,padding:"14px",border:"1px solid "+(s.big?"rgba(126,200,227,0.2)":s.cf?(annualCF>0?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)"):"rgba(255,255,255,0.06)")}}>
                            <div style={{fontSize:9,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>{s.l}</div>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:s.big?20:15,fontWeight:700,color:s.big?GOLD:s.cf?(annualCF>0?GREEN:RED):"#F8FAFC"}}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* AI Analysis tab */}
              {modalTab==="ai"&&(
                <div>
                  {!aiResult&&!aiLoading&&(
                    <div style={{textAlign:"center",padding:"20px 0"}}>
                      <div style={{fontSize:48,marginBottom:12}}>🤖</div>
                      <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,color:"#F8FAFC",marginBottom:8}}>AI Investment Analysis</div>
                      <div style={{fontSize:13,color:"#64748B",marginBottom:24,maxWidth:400,margin:"0 auto 24px",lineHeight:1.7}}>Get an AI-powered investment breakdown for this property — market context, risk factors, and opportunity assessment.</div>
                      <Btn onClick={()=>runAI(sel)}>🧠 Generate Analysis</Btn>
                    </div>
                  )}
                  {aiLoading&&(
                    <div style={{textAlign:"center",padding:"40px 0"}}>
                      <div style={{width:40,height:40,border:"3px solid rgba(126,200,227,0.2)",borderTop:"3px solid "+GOLD,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/>
                      <div style={{color:"#64748B",fontSize:14}}>Analyzing investment potential...</div>
                    </div>
                  )}
                  {aiResult&&(
                    <div>
                      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"20px",fontSize:13,color:"#CBD5E1",lineHeight:1.9,marginBottom:16,whiteSpace:"pre-wrap"}}>{aiResult}</div>
                      <div style={{fontSize:10,color:"#475569",lineHeight:1.7}}>AI analysis is for informational purposes only and does not constitute financial advice. Always conduct your own due diligence.</div>
                      <button onClick={()=>{setAiResult("");}} style={{marginTop:12,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#94A3B8",borderRadius:8,padding:"8px 16px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Regenerate</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REGISTER MODAL ── */}
      {showRegModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",animation:"fadeIn .2s ease"}} onClick={e=>e.target===e.currentTarget&&setShowRegModal(false)}>
          <div style={{background:"#0D1828",borderRadius:24,width:"100%",maxWidth:420,border:"1px solid rgba(126,200,227,0.2)",boxShadow:"0 40px 100px rgba(0,0,0,0.8)"}}>
            <div style={{background:"linear-gradient(135deg,#0C1A2E,#0F2040)",padding:"32px",borderRadius:"24px 24px 0 0",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{fontSize:44,marginBottom:10}}>🔐</div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,color:"#F8FAFC",marginBottom:6}}>Unlock Full Investment Analysis</div>
              <div style={{fontSize:13,color:"#94A3B8",lineHeight:1.7}}>Register for free to access Hamza&apos;s full investment breakdown, BRRR calculator, cap rate analysis, and AI analysis for every listing.</div>
            </div>
            <div style={{padding:"28px"}}>
              <InputF label="Full Name" val={regForm.name} onChange={v=>setRegForm(p=>({...p,name:v}))} ph="John Smith"/>
              <InputF label="Phone Number" val={regForm.phone} onChange={v=>setRegForm(p=>({...p,phone:v}))} ph="647-xxx-xxxx" type="tel"/>
              <InputF label="Email (optional)" val={regForm.email} onChange={v=>setRegForm(p=>({...p,email:v}))} ph="john@email.com" type="email"/>
              <Btn onClick={handleRegister} disabled={!regForm.name||!regForm.phone} style={{width:"100%",fontSize:15,padding:"14px",marginBottom:10}}>
                Unlock Free Access →
              </Btn>
              <div style={{fontSize:11,color:"#475569",textAlign:"center",lineHeight:1.6}}>Free forever. No spam. Hamza Nouman · Royal LePage Signature Realty</div>
            </div>
          </div>
        </div>
      )}

      {/* ── SELLER MODAL ── */}
      {showSellerModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",overflowY:"auto",animation:"fadeIn .2s ease"}} onClick={e=>e.target===e.currentTarget&&setShowSellerModal(false)}>
          <div style={{background:"#0D1828",borderRadius:24,width:"100%",maxWidth:460,border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 40px 100px rgba(0,0,0,0.8)"}}>
            {!sellerSubmitted?(
              <>
                <div style={{background:"linear-gradient(135deg,#0C1A2E,#0F2040)",padding:"28px",borderRadius:"24px 24px 0 0",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{fontSize:44,marginBottom:10}}>🏷️</div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,color:"#F8FAFC",marginBottom:6}}>What Is My Home Worth?</div>
                  <div style={{fontSize:13,color:"#94A3B8",lineHeight:1.7}}>Get Hamza&apos;s professional market valuation — based on real sold comparables in your neighbourhood.</div>
                </div>
                <div style={{padding:"24px"}}>
                  <InputF label="Full Name" val={sellerForm.name} onChange={v=>setSellerForm(p=>({...p,name:v}))} ph="John Smith"/>
                  <InputF label="Phone Number" val={sellerForm.phone} onChange={v=>setSellerForm(p=>({...p,phone:v}))} ph="647-xxx-xxxx" type="tel"/>
                  <InputF label="Property Address" val={sellerForm.address} onChange={v=>setSellerForm(p=>({...p,address:v}))} ph="123 Main St, Mississauga"/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                    <div>
                      <div style={{fontSize:11,color:"#94A3B8",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Property Type</div>
                      <select value={sellerForm.type} onChange={e=>setSellerForm(p=>({...p,type:e.target.value}))}
                        style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"11px 12px",fontSize:13,color:"#F8FAFC",fontFamily:"inherit"}}>
                        {["Detached","Semi-Detached","Townhouse","Condo"].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{fontSize:11,color:"#94A3B8",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Bedrooms</div>
                      <select value={sellerForm.beds} onChange={e=>setSellerForm(p=>({...p,beds:e.target.value}))}
                        style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"11px 12px",fontSize:13,color:"#F8FAFC",fontFamily:"inherit"}}>
                        {["1","2","3","4","5+"].map(b=><option key={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                  <Btn onClick={()=>{
                    if(!sellerForm.name||!sellerForm.phone)return;
                    setSellerSubmitted(true);
                    const msg=encodeURIComponent("SELLER LEAD - MississaugaInvestor.ca\n\nName: "+sellerForm.name+"\nPhone: "+sellerForm.phone+"\nAddress: "+sellerForm.address+"\nType: "+sellerForm.type+", "+sellerForm.beds+"bd\n\nBook a CMA ASAP!");
                    window.open("https://wa.me/16476091289?text="+msg,"_blank");
                  }} disabled={!sellerForm.name||!sellerForm.phone} style={{width:"100%",fontSize:15,padding:"14px"}}>
                    Get My Free Home Valuation
                  </Btn>
                  <button onClick={()=>setShowSellerModal(false)} style={{display:"block",margin:"10px auto 0",background:"transparent",border:"none",color:"#475569",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                </div>
              </>
            ):(
              <div style={{padding:"48px 32px",textAlign:"center"}}>
                <div style={{fontSize:56,marginBottom:12}}>✅</div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:700,color:"#F8FAFC",marginBottom:8}}>Request Received!</div>
                <div style={{fontSize:14,color:"#64748B",lineHeight:1.8,marginBottom:24}}>Hamza will contact you within 24 hours with a full comparative market analysis for your property.</div>
                <Btn onClick={()=>{setShowSellerModal(false);setSellerSubmitted(false);setSellerForm({name:"",phone:"",email:"",address:"",type:"Detached",beds:"3"});}}>Done</Btn>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BIO ── */}
      <div style={{background:CARD,borderTop:"1px solid "+BORDER,padding:"56px 24px"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"grid",gridTemplateColumns:"auto 1fr",gap:40,alignItems:"center"}}>
          <div style={{width:120,height:120,borderRadius:"50%",flexShrink:0,border:"3px solid rgba(126,200,227,0.3)",overflow:"hidden",background:"#0D1828"}}>
            <img src="/hamza.jpg.JPG" alt="Hamza Nouman" onError={e=>{e.target.style.display="none";e.target.parentNode.innerHTML="<div style='width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px'>👤</div>";}} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}}/>
          </div>
          <div>
            <div style={{fontSize:11,color:GOLD,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Your Agent</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:700,color:"#F8FAFC",marginBottom:4}}>Hamza Nouman</div>
            <div style={{fontSize:13,color:"#94A3B8",marginBottom:4}}>Sales Representative · Royal LePage Signature Realty</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
              <span style={{background:"rgba(126,200,227,0.12)",border:"1px solid rgba(126,200,227,0.25)",color:GOLD,fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:20}}>🏆 Master Sales Award</span>
              <span style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",color:"#60A5FA",fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:20}}>8+ Years GTA Experience</span>
              <span style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",color:"#34D399",fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:20}}>English · Urdu · Hindi</span>
            </div>
            <div style={{fontSize:13,color:"#94A3B8",lineHeight:1.8,marginBottom:18,maxWidth:580}}>Specializing in investment properties, BRRR strategy, pre-construction, and multi-family across Mississauga, Oakville, Milton, Burlington, Brampton and Toronto.</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <a href="tel:6476091289" style={{background:"linear-gradient(135deg,#5BB3D0,#2A8BB0)",color:"#060B15",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:13,textDecoration:"none"}}>📞 647-609-1289</a>
              <a href={"https://wa.me/16476091289?text="+encodeURIComponent("Hi Hamza, I found you on MississaugaInvestor.ca and would like to discuss investment properties.")} target="_blank" rel="noreferrer" style={{background:"linear-gradient(135deg,#25D366,#128C7E)",color:"#fff",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:13,textDecoration:"none"}}>💬 WhatsApp</a>
              <a href="https://hamzahomes.ca" target="_blank" rel="noreferrer" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#94A3B8",borderRadius:10,padding:"10px 20px",fontWeight:600,fontSize:13,textDecoration:"none"}}>🌐 hamzahomes.ca</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{background:"#040810",borderTop:"1px solid rgba(255,255,255,0.04)",padding:"32px 24px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          {/* CREA Trademark Logos + Statements */}
          <div style={{display:"flex",gap:20,alignItems:"flex-start",marginBottom:20,paddingBottom:20,borderBottom:"1px solid rgba(255,255,255,0.05)",flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:16,alignItems:"flex-start",flex:1,minWidth:280}}>
              <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,padding:"6px 10px",flexShrink:0,fontSize:13,fontWeight:900,color:"#CBD5E1",fontFamily:"serif",lineHeight:1}}>
                <div>R</div>
                <div style={{fontSize:8,fontWeight:400,letterSpacing:0.5}}>REALTOR®</div>
              </div>
              <p style={{fontSize:10,color:"#334155",lineHeight:1.7,margin:0}}>
                The trademarks REALTOR®, REALTORS®, and the REALTOR® logo are controlled by The Canadian Real Estate Association (CREA) and identify real estate professionals who are members of CREA.
              </p>
            </div>
            <div style={{display:"flex",gap:16,alignItems:"flex-start",flex:1,minWidth:280}}>
              <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,padding:"6px 10px",flexShrink:0,fontSize:11,fontWeight:900,color:"#CBD5E1",lineHeight:1,textAlign:"center"}}>
                <div style={{fontSize:9,letterSpacing:0.5}}>MLS®</div>
                <div style={{fontSize:7,fontWeight:400,marginTop:2}}>Multiple Listing Service®</div>
              </div>
              <p style={{fontSize:10,color:"#334155",lineHeight:1.7,margin:0}}>
                The trademarks MLS®, Multiple Listing Service® and the associated logos are owned by The Canadian Real Estate Association (CREA) and identify the quality of services provided by real estate professionals who are members of CREA.
              </p>
            </div>
          </div>
          {/* Data disclaimer */}
          <p style={{fontSize:10,color:"#334155",lineHeight:1.7,marginBottom:16,textAlign:"center"}}>
            The information contained on this website is based in whole or in part on information provided by members of CREA, who are responsible for its accuracy. CREA reproduces and distributes this information as a service for its members and assumes no responsibility for its accuracy. The listing content on this website is protected by copyright and other laws, and is intended solely for the private, non-commercial use by individuals. Investment analysis, deal scores, and all financial estimates are the personal opinion of Hamza Nouman and do not constitute financial, legal, or investment advice.
          </p>
          {/* Bottom bar */}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.04)",paddingTop:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
            <div style={{fontSize:10,color:"#334155"}}>
              Royal LePage Signature Realty, Brokerage &nbsp;|&nbsp; Independently Owned &amp; Operated &nbsp;|&nbsp; © 2026 Hamza Nouman
            </div>
            <div style={{display:"flex",gap:16}}>
              <a href="https://hamzahomes.ca/terms-of-service" target="_blank" rel="noreferrer" style={{fontSize:10,color:"#475569",textDecoration:"none"}}>Terms of Service</a>
              <a href="https://hamzahomes.ca/privacy-policy" target="_blank" rel="noreferrer" style={{fontSize:10,color:"#475569",textDecoration:"none"}}>Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── WHATSAPP FAB ── */}
      <a href={"https://wa.me/16476091289?text="+encodeURIComponent("Hi Hamza, I found you on MississaugaInvestor.ca — I am looking for investment properties in Mississauga.")} target="_blank" rel="noreferrer" className="wabtn"
        style={{position:"fixed",bottom:24,right:24,zIndex:150,width:58,height:58,borderRadius:"50%",background:"linear-gradient(135deg,#25D366,#128C7E)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,textDecoration:"none",boxShadow:"0 8px 32px rgba(37,211,102,0.4)"}}>
        💬
      </a>
    </div>
  );
}
