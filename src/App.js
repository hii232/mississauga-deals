import { useState, useMemo } from "react";

const MOCK_LISTINGS = [
  { id:"ML1001", address:"2847 Folkway Dr", neighbourhood:"Erin Mills", price:849000, bedrooms:4, bathrooms:3, sqft:2100, dom:34, priceReduction:6.2, originalPrice:906000, assessedValue:780000, estimatedRent:3800, type:"Detached", yearBuilt:1998, taxes:6890, garage:2, basement:"Finished", walkScore:72, transitScore:65, schoolScore:8 },
  { id:"ML1002", address:"1203 Haig Blvd", neighbourhood:"Lakeview", price:1125000, bedrooms:3, bathrooms:2, sqft:1650, dom:8, priceReduction:0, originalPrice:1125000, assessedValue:1050000, estimatedRent:4400, type:"Semi-Detached", yearBuilt:2005, taxes:8200, garage:1, basement:"Unfinished", walkScore:81, transitScore:78, schoolScore:7 },
  { id:"ML1003", address:"5521 Glen Erin Dr", neighbourhood:"Churchill Meadows", price:799000, bedrooms:3, bathrooms:3, sqft:1800, dom:47, priceReduction:8.5, originalPrice:873000, assessedValue:710000, estimatedRent:3500, type:"Townhouse", yearBuilt:2003, taxes:5900, garage:1, basement:"Finished", walkScore:68, transitScore:70, schoolScore:9 },
  { id:"ML1004", address:"3318 Redpath Cir", neighbourhood:"Meadowvale", price:689000, bedrooms:3, bathrooms:2, sqft:1450, dom:22, priceReduction:3.1, originalPrice:711000, assessedValue:640000, estimatedRent:3200, type:"Semi-Detached", yearBuilt:1992, taxes:5200, garage:1, basement:"Partial", walkScore:65, transitScore:62, schoolScore:7 },
  { id:"ML1005", address:"915 Inverhouse Dr", neighbourhood:"Clarkson", price:975000, bedrooms:4, bathrooms:3, sqft:2300, dom:61, priceReduction:11.2, originalPrice:1098000, assessedValue:880000, estimatedRent:4100, type:"Detached", yearBuilt:1987, taxes:7100, garage:2, basement:"Finished", walkScore:74, transitScore:68, schoolScore:8 },
  { id:"ML1006", address:"4402 Tahoe Blvd", neighbourhood:"Malton", price:599000, bedrooms:3, bathrooms:2, sqft:1300, dom:15, priceReduction:0, originalPrice:599000, assessedValue:570000, estimatedRent:2900, type:"Townhouse", yearBuilt:2001, taxes:4600, garage:1, basement:"None", walkScore:61, transitScore:74, schoolScore:6 },
  { id:"ML1007", address:"1876 Lakeshore Rd W", neighbourhood:"Port Credit", price:1380000, bedrooms:3, bathrooms:2, sqft:1550, dom:29, priceReduction:4.8, originalPrice:1450000, assessedValue:1200000, estimatedRent:5200, type:"Detached", yearBuilt:1965, taxes:9800, garage:2, basement:"Finished", walkScore:92, transitScore:85, schoolScore:8 },
  { id:"ML1008", address:"6634 Ninth Line", neighbourhood:"Streetsville", price:1049000, bedrooms:4, bathrooms:3, sqft:2450, dom:53, priceReduction:7.3, originalPrice:1131000, assessedValue:940000, estimatedRent:4300, type:"Detached", yearBuilt:1995, taxes:7600, garage:2, basement:"Finished", walkScore:77, transitScore:66, schoolScore:8 },
  { id:"ML1009", address:"345 Rathburn Rd W", neighbourhood:"Cooksville", price:729000, bedrooms:3, bathrooms:2, sqft:1600, dom:38, priceReduction:5.5, originalPrice:771000, assessedValue:660000, estimatedRent:3300, type:"Semi-Detached", yearBuilt:1990, taxes:5600, garage:1, basement:"Finished", walkScore:79, transitScore:80, schoolScore:7 },
  { id:"ML1010", address:"2211 Hurontario St", neighbourhood:"Cooksville", price:649000, bedrooms:2, bathrooms:2, sqft:1100, dom:19, priceReduction:2.0, originalPrice:662000, assessedValue:620000, estimatedRent:3000, type:"Condo", yearBuilt:2010, taxes:4900, garage:1, basement:"None", walkScore:85, transitScore:88, schoolScore:7 },
  { id:"ML1011", address:"7789 Magistrate Terr", neighbourhood:"Meadowvale", price:775000, bedrooms:4, bathrooms:3, sqft:1950, dom:44, priceReduction:9.1, originalPrice:853000, assessedValue:695000, estimatedRent:3600, type:"Semi-Detached", yearBuilt:1997, taxes:6100, garage:2, basement:"Finished", walkScore:66, transitScore:63, schoolScore:8 },
  { id:"ML1012", address:"432 Queen St S", neighbourhood:"Streetsville", price:899000, bedrooms:3, bathrooms:2, sqft:1750, dom:11, priceReduction:0, originalPrice:899000, assessedValue:855000, estimatedRent:3900, type:"Detached", yearBuilt:2001, taxes:6700, garage:2, basement:"Unfinished", walkScore:80, transitScore:67, schoolScore:8 },
  { id:"ML1013", address:"1590 Carolyn Rd", neighbourhood:"Erin Mills", price:869000, bedrooms:4, bathrooms:3, sqft:2050, dom:67, priceReduction:12.4, originalPrice:992000, assessedValue:760000, estimatedRent:3700, type:"Detached", yearBuilt:1989, taxes:6400, garage:2, basement:"Finished", walkScore:70, transitScore:64, schoolScore:9 },
  { id:"ML1014", address:"88 Port St E", neighbourhood:"Port Credit", price:1195000, bedrooms:2, bathrooms:2, sqft:1200, dom:5, priceReduction:0, originalPrice:1195000, assessedValue:1150000, estimatedRent:4800, type:"Condo", yearBuilt:2018, taxes:8800, garage:1, basement:"None", walkScore:94, transitScore:87, schoolScore:8 },
  { id:"ML1015", address:"3956 Tomken Rd", neighbourhood:"Malton", price:629000, bedrooms:3, bathrooms:2, sqft:1380, dom:31, priceReduction:4.4, originalPrice:658000, assessedValue:580000, estimatedRent:2950, type:"Semi-Detached", yearBuilt:1994, taxes:4800, garage:1, basement:"Partial", walkScore:63, transitScore:72, schoolScore:6 },
  { id:"ML1016", address:"1122 Clarkson Rd N", neighbourhood:"Clarkson", price:1025000, bedrooms:4, bathrooms:3, sqft:2200, dom:42, priceReduction:6.8, originalPrice:1100000, assessedValue:920000, estimatedRent:4200, type:"Detached", yearBuilt:1991, taxes:7400, garage:2, basement:"Finished", walkScore:76, transitScore:70, schoolScore:8 },
  { id:"ML1017", address:"671 Bristol Rd W", neighbourhood:"Hurontario", price:699000, bedrooms:3, bathrooms:2, sqft:1500, dom:26, priceReduction:3.7, originalPrice:726000, assessedValue:655000, estimatedRent:3150, type:"Townhouse", yearBuilt:2006, taxes:5300, garage:1, basement:"Finished", walkScore:71, transitScore:76, schoolScore:7 },
  { id:"ML1018", address:"2445 Burnhamthorpe Rd", neighbourhood:"Churchill Meadows", price:819000, bedrooms:4, bathrooms:3, sqft:1920, dom:55, priceReduction:8.9, originalPrice:899000, assessedValue:730000, estimatedRent:3650, type:"Semi-Detached", yearBuilt:2000, taxes:6300, garage:2, basement:"Finished", walkScore:67, transitScore:69, schoolScore:9 },
  { id:"ML1019", address:"509 Lakeshore Rd E", neighbourhood:"Lakeview", price:1250000, bedrooms:3, bathrooms:2, sqft:1700, dom:14, priceReduction:1.5, originalPrice:1269000, assessedValue:1180000, estimatedRent:5000, type:"Detached", yearBuilt:1972, taxes:9100, garage:1, basement:"Finished", walkScore:83, transitScore:79, schoolScore:7 },
  { id:"ML1020", address:"4123 Periwinkle Cres", neighbourhood:"Hurontario", price:749000, bedrooms:3, bathrooms:3, sqft:1680, dom:39, priceReduction:5.9, originalPrice:796000, assessedValue:680000, estimatedRent:3400, type:"Townhouse", yearBuilt:2004, taxes:5700, garage:1, basement:"Finished", walkScore:73, transitScore:77, schoolScore:7 },
];

const HOOD_COLORS = {
  "Erin Mills":{ bg:"#E8F4F0", text:"#0E7A5A" },
  "Lakeview":{ bg:"#E8F0FB", text:"#1A4A8A" },
  "Churchill Meadows":{ bg:"#F0EBF8", text:"#5A1A8A" },
  "Meadowvale":{ bg:"#FFF3E8", text:"#7A4A1A" },
  "Clarkson":{ bg:"#E8F8EE", text:"#1A6A3A" },
  "Malton":{ bg:"#FFF0F0", text:"#8A1A1A" },
  "Port Credit":{ bg:"#E8F4FF", text:"#1A5A8A" },
  "Streetsville":{ bg:"#FEFAE8", text:"#6A5800" },
  "Cooksville":{ bg:"#F5F0FF", text:"#4A1A8A" },
  "Hurontario":{ bg:"#FFEFF5", text:"#8A1A4A" },
};

const HOOD_INFO = {
  "Erin Mills":{ avgPrice:859000, avgRent:3750, yield:3.8, trend:"+2.1%", lrtAccess:true, desc:"Family-oriented west Mississauga. Strong school ratings. High rental demand from Erin Mills Town Centre corridor.", emoji:"🌳" },
  "Port Credit":{ avgPrice:1287500, avgRent:5000, yield:3.4, trend:"+4.2%", lrtAccess:true, desc:"Premium lakefront location. Highest appreciation potential. LRT stop confirmed. Short-term rental goldmine.", emoji:"⚓" },
  "Churchill Meadows":{ avgPrice:809000, avgRent:3575, yield:3.9, trend:"+1.8%", lrtAccess:false, desc:"Newer builds, strong families. Top-rated schools. Consistent rental demand. Ideal buy-and-hold.", emoji:"🏡" },
  "Cooksville":{ avgPrice:689000, avgRent:3150, yield:4.1, trend:"+3.5%", lrtAccess:true, desc:"LRT corridor hub. Densifying fast. Best value play in Mississauga right now. Future appreciation upside.", emoji:"🚇" },
  "Clarkson":{ avgPrice:1000000, avgRent:4150, yield:3.7, trend:"+1.5%", lrtAccess:true, desc:"GO Train access. Lake proximity. Strong professional rental demographic. Solid long-term hold.", emoji:"🚂" },
  "Meadowvale":{ avgPrice:732000, avgRent:3400, yield:4.0, trend:"+0.9%", lrtAccess:false, desc:"Corporate campus proximity (Huawei, Microsoft, Nokia). Strong corporate rental demand. Stable yields.", emoji:"💼" },
  "Malton":{ avgPrice:614000, avgRent:2925, yield:4.2, trend:"+5.1%", lrtAccess:false, desc:"Highest yield neighbourhood. Airport proximity. Significant upside as area gentrifies. High cash flow potential.", emoji:"✈️" },
  "Lakeview":{ avgPrice:1187500, avgRent:4700, yield:3.5, trend:"+6.2%", lrtAccess:false, desc:"Lakeview Village redevelopment = massive appreciation play. Lakefront access. One of GTA's hottest corridors.", emoji:"🌊" },
  "Streetsville":{ avgPrice:974000, avgRent:4100, yield:3.8, trend:"+2.3%", lrtAccess:false, desc:"Village charm. Heritage designation limits supply. Strong community identity drives premium rents.", emoji:"🏘️" },
  "Hurontario":{ avgPrice:724000, avgRent:3275, yield:4.0, trend:"+3.8%", lrtAccess:true, desc:"LRT spine corridor. Highest density growth zone in Mississauga. Strong appreciation + rental demand.", emoji:"📈" },
};

const TYPE_ICON = { Detached:"🏠", "Semi-Detached":"🏡", Townhouse:"🏘️", Condo:"🏢" };
const PROPERTY_TYPES = ["All Types","Detached","Semi-Detached","Townhouse","Condo"];
const HOODS = [...new Set(MOCK_LISTINGS.map(l=>l.neighbourhood))].sort();

function calcMortgage(price, rate=0.065, years=25, down=0.20) {
  const p=price*(1-down), m=rate/12, n=years*12;
  return (p*m*Math.pow(1+m,n))/(Math.pow(1+m,n)-1);
}

function calcMetrics(l) {
  const mortgage=calcMortgage(l.price);
  const tax=(l.assessedValue*0.0092)/12;
  const costs=mortgage+tax+150+l.estimatedRent*0.05+150;
  const cashFlow=l.estimatedRent-costs;
  const yld=((l.estimatedRent*12-(tax+300+l.estimatedRent*0.05)*12)/l.price)*100;
  const ppsf=Math.round(l.price/l.sqft);
  let score=5;
  if(cashFlow>0) score+=2; else if(cashFlow<-500) score-=2;
  if(l.priceReduction>8) score+=2; else if(l.priceReduction>5) score+=1.5; else if(l.priceReduction>3) score+=1;
  if(l.dom>60) score+=1.5; else if(l.dom>30) score+=1;
  if(yld>4) score+=1;
  return { mortgage, tax, cashFlow, yield:yld, ppsf, score:Math.min(10,Math.max(1,Math.round(score*10)/10)) };
}

const DATA = MOCK_LISTINGS.map(l=>({...l,...calcMetrics(l)}));
const fmt = n=>new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD",maximumFractionDigits:0}).format(n);
const fmtK = n=>n>=1000000?`$${(n/1000000).toFixed(2)}M`:`$${Math.round(n/1000)}K`;

async function analyzeWithClaude(listing, metrics) {
  const prompt = `You are a Mississauga real estate investment expert. Analyze this listing for an investor.

LISTING: ${listing.address}, ${listing.neighbourhood} | ${listing.type} | ${fmt(listing.price)} | Built ${listing.yearBuilt}
${listing.bedrooms}bd/${listing.bathrooms}ba/${listing.sqft.toLocaleString()}sqft | $${metrics.ppsf}/sqft | ${listing.dom} DOM
Price Drop: ${listing.priceReduction>0?`${listing.priceReduction}% (was ${fmt(listing.originalPrice)})`:"None"}
MPAC: ${fmt(listing.assessedValue)} | Mortgage: ${fmt(metrics.mortgage)}/mo | Rent: ${fmt(listing.estimatedRent)}/mo | Cash Flow: ${fmt(metrics.cashFlow)} | Yield: ${metrics.yield.toFixed(2)}%

MARKET 2025: Avg $970K, -5-8% YoY, 2800+ active, buyer's market, Hurontario LRT confirmed, rents +42% over 7yr.

Return ONLY valid JSON:
{"verdict":"BUY or WATCH or PASS","verdictReason":"Max 15 words","highlights":["12 words max","12 words max","12 words max"],"risks":["12 words max","12 words max"],"hamzaNote":"One sentence local insight","rentalOutlook":"Strong or Moderate or Weak","motivationSignal":"High or Medium or Low","bestFor":"First-time investor or Cash flow investor or Appreciation play or BRRR strategy or End user"}`;

  const r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:prompt}]})});
  const d=await r.json();
  return JSON.parse((d.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
}

// ── SCORE COLORS
const scoreColor=s=>s>=8?"#16A865":s>=6?"#F5A623":"#E84040";
const scoreBg=s=>s>=8?"#E8F8EF":s>=6?"#FFF8ED":"#FFF0F0";
const cfColor=cf=>cf>0?"#16A865":cf>-300?"#F5A623":"#E84040";
const vColor=v=>v==="BUY"?"#16A865":v==="WATCH"?"#F5A623":"#E84040";
const vBg=v=>v==="BUY"?"#E8F8EF":v==="WATCH"?"#FFF8ED":"#FFF0F0";
const walkColor=s=>s>=80?"#16A865":s>=60?"#F5A623":"#94A3B8";

export default function App() {
  const [view, setView] = useState("grid"); // grid | map | neighbourhoods
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({minPrice:400000,maxPrice:1400000,minYield:0,minPriceReduction:0,maxDom:90,cashFlowOnly:false,hoods:[],propertyType:"All Types",sort:"score"});
  const [filterOpen, setFilterOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalTab, setModalTab] = useState("overview"); // overview | mortgage | brrr
  const [analysis, setAnalysis] = useState({});
  const [loading, setLoading] = useState({});
  const [alertModal, setAlertModal] = useState(false);
  const [form, setForm] = useState({name:"",phone:"",email:""});
  const [submitted, setSubmitted] = useState(false);
  const [favourites, setFavourites] = useState([]);
  const [favGate, setFavGate] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [selectedHood, setSelectedHood] = useState(null);

  // MORTGAGE CALC STATE
  const [mortCalc, setMortCalc] = useState({downPct:20,rate:6.5,years:25});

  // BRRR CALC STATE
  const [brrr, setBrrr] = useState({arv:0,rehabCost:0,refinanceLTV:80,closingCosts:15000});

  const results = useMemo(()=>{
    let r=DATA.filter(l=>{
      if(search){const s=search.toLowerCase();if(!(l.address.toLowerCase().includes(s)||l.neighbourhood.toLowerCase().includes(s)||l.id.toLowerCase().includes(s)||l.type.toLowerCase().includes(s)))return false;}
      if(l.price>filters.maxPrice||l.price<filters.minPrice)return false;
      if(l.yield<filters.minYield)return false;
      if(l.priceReduction<filters.minPriceReduction)return false;
      if(l.dom>filters.maxDom)return false;
      if(filters.cashFlowOnly&&l.cashFlow<=0)return false;
      if(filters.hoods.length&&!filters.hoods.includes(l.neighbourhood))return false;
      if(filters.propertyType!=="All Types"&&l.type!==filters.propertyType)return false;
      return true;
    });
    return r.sort((a,b)=>{
      if(filters.sort==="score")return b.score-a.score;
      if(filters.sort==="yield")return b.yield-a.yield;
      if(filters.sort==="cashflow")return b.cashFlow-a.cashFlow;
      if(filters.sort==="dom")return b.dom-a.dom;
      if(filters.sort==="reduction")return b.priceReduction-a.priceReduction;
      if(filters.sort==="price")return a.price-b.price;
      return 0;
    });
  },[search,filters]);

  const toggleHood=h=>setFilters(f=>({...f,hoods:f.hoods.includes(h)?f.hoods.filter(x=>x!==h):[...f.hoods,h]}));

  const toggleFav=(id,e)=>{
    e.stopPropagation();
    if(!registered&&!favourites.includes(id)){setFavGate(id);return;}
    setFavourites(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id]);
  };

  const runAnalysis=async(listing)=>{
    if(analysis[listing.id]||loading[listing.id])return;
    if(analysisCount>=3&&!registered){setAlertModal(true);return;}
    setLoading(l=>({...l,[listing.id]:true}));
    try{
      const metrics={mortgage:listing.mortgage,tax:listing.tax,cashFlow:listing.cashFlow,yield:listing.yield,ppsf:listing.ppsf,score:listing.score};
      const result=await analyzeWithClaude(listing,metrics);
      setAnalysis(a=>({...a,[listing.id]:result}));
      if(!registered)setAnalysisCount(c=>c+1);
    }catch{
      setAnalysis(a=>({...a,[listing.id]:{verdict:"ERROR"}}));
    }
    setLoading(l=>({...l,[listing.id]:false}));
  };

  const openModal=(l)=>{
    setModal(l);
    setModalTab("overview");
    setBrrr({arv:Math.round(l.price*1.15),rehabCost:30000,refinanceLTV:80,closingCosts:15000});
    if(!analysis[l.id]&&!loading[l.id])runAnalysis(l);
  };

  const shareListing=(l,e)=>{
    e.stopPropagation();
    const text=`🏠 ${l.address}, ${l.neighbourhood}\n💰 ${fmtK(l.price)} | ${l.bedrooms}bd/${l.bathrooms}ba\n📈 Yield: ${l.yield.toFixed(2)}% | Cash Flow: ${fmt(l.cashFlow)}/mo\n🤖 Deal Score: ${l.score}/10\n\nFound on MississaugaInvestor.ca — AI-Powered Investment Screener by Hamza Nouman 647-609-1289`;
    if(navigator.share){navigator.share({text});}
    else{navigator.clipboard.writeText(text).then(()=>alert("Listing copied to clipboard!"));}
  };

  const analysisLeft=Math.max(0,3-analysisCount);

  // MORTGAGE CALC
  const calcMort=(price,downPct,rate,years)=>{
    const p=price*(1-downPct/100),m=rate/100/12,n=years*12;
    return n===0?0:(p*m*Math.pow(1+m,n))/(Math.pow(1+m,n)-1);
  };

  // BRRR CALC
  const brrrCalc=(listing)=>{
    const purchasePrice=listing.price;
    const totalInvested=purchasePrice*(mortCalc.downPct/100)+brrr.rehabCost+brrr.closingCosts;
    const refinanceValue=brrr.arv*(brrr.refinanceLTV/100);
    const originalMortgage=purchasePrice*(1-mortCalc.downPct/100);
    const cashBack=refinanceValue-originalMortgage-brrr.rehabCost;
    const equityLeft=brrr.arv-refinanceValue;
    const newMortgage=calcMort(refinanceValue,0,mortCalc.rate,mortCalc.years);
    const newCashFlow=listing.estimatedRent-newMortgage-(listing.assessedValue*0.0092/12)-300-listing.estimatedRent*0.05;
    return{totalInvested,refinanceValue,cashBack,equityLeft,newMortgage,newCashFlow};
  };

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#F0F2F5;font-family:'Outfit',sans-serif}
    input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:#E2E8F0;outline:none;cursor:pointer;width:100%}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#1B4FD8;cursor:pointer}
    input[type=number]{border:1.5px solid #E2E8F0;border-radius:8px;padding:8px 10px;font-size:13px;width:100%;outline:none;font-family:inherit}
    input[type=number]:focus{border-color:#1B4FD8}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#CBD5E0;border-radius:4px}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
    .card{transition:all 0.2s cubic-bezier(0.4,0,0.2,1);cursor:pointer;position:relative}
    .card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,0.14)!important}
    .fav-btn{transition:transform 0.15s}
    .fav-btn:hover{transform:scale(1.2)}
    .tab-btn{transition:all 0.15s}
  `;

  return (
    <div style={{minHeight:"100vh",background:"#F0F2F5",fontFamily:"'Outfit',sans-serif"}}>
      <style>{css}</style>

      {/* ── NAVBAR ── */}
      <div style={{background:"#0A1628",padding:"0 24px",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 20px rgba(0,0,0,0.3)"}}>
        <div style={{maxWidth:1220,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:66}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#1B4FD8,#0EA5E9)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(27,79,216,0.5)"}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3L21 9.5V20C21 20.6 20.6 21 20 21H15V15H9V21H4C3.4 21 3 20.6 3 20V9.5Z" fill="white" opacity="0.9"/>
                <circle cx="18" cy="6" r="3" fill="#10B981"/>
                <path d="M17 6L18 7L20 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"baseline",gap:1}}>
                <span style={{fontWeight:900,fontSize:18,color:"#fff",letterSpacing:-0.5}}>Mississauga</span>
                <span style={{fontWeight:900,fontSize:18,color:"#38BDF8",letterSpacing:-0.5}}>Investor</span>
                <span style={{fontWeight:900,fontSize:18,color:"#fff",letterSpacing:-0.5}}>.ca</span>
              </div>
              <div style={{fontSize:9,color:"#475569",fontWeight:600,letterSpacing:1.5,textTransform:"uppercase"}}>AI-POWERED · LIVE MLS DATA · MISSISSAUGA</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:8,padding:"5px 12px",fontSize:11,color:"#10B981",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#10B981",display:"inline-block",animation:"pulse 2s infinite"}}/>LIVE
            </div>
            {favourites.length>0&&(
              <div style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"5px 12px",fontSize:11,color:"#EF4444",fontWeight:700,cursor:"pointer"}} onClick={()=>setFilters(f=>({...f,hoods:[]}))}>
                ❤️ {favourites.length} Saved
              </div>
            )}
            <div style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"5px 12px",fontSize:11,color:"#94A3B8",fontWeight:600}}>
              🤖 {registered?"∞":analysisLeft+"/3"} AI
            </div>
            <button onClick={()=>setAlertModal(true)} style={{background:"linear-gradient(135deg,#1B4FD8,#0EA5E9)",color:"#fff",border:"none",borderRadius:10,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(27,79,216,0.4)"}}>
              🔔 Get Deal Alerts
            </button>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{background:"linear-gradient(135deg,#0A1628 0%,#0F2850 50%,#0A1628 100%)",padding:"32px 24px 0"}}>
        <div style={{maxWidth:1220,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <h1 style={{fontWeight:900,fontSize:28,color:"#fff",letterSpacing:-0.5,marginBottom:8}}>
              Find Mississauga Investment Deals{" "}
              <span style={{background:"linear-gradient(90deg,#38BDF8,#10B981)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Before Anyone Else</span>
            </h1>
            <p style={{color:"#64748B",fontSize:14}}>AI-scored listings · BRRR Calculator · Neighbourhood Profiles · Powered by Hamza Nouman · Royal LePage Signature · 647-609-1289</p>
          </div>
          <div style={{maxWidth:700,margin:"0 auto 20px"}}>
            <div style={{display:"flex",gap:0,background:"#fff",borderRadius:14,padding:6,boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:10,padding:"8px 14px"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" placeholder="Search address, neighbourhood, MLS #, or property type..." value={searchInput} onChange={e=>setSearchInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setSearch(searchInput)}
                  style={{flex:1,border:"none",outline:"none",fontSize:14,color:"#0F172A",background:"transparent",fontFamily:"inherit"}}/>
                {searchInput&&<button onClick={()=>{setSearchInput("");setSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:18}}>×</button>}
              </div>
              <button onClick={()=>setSearch(searchInput)} style={{background:"linear-gradient(135deg,#1B4FD8,#0EA5E9)",color:"#fff",border:"none",borderRadius:10,padding:"12px 24px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Search</button>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:28,paddingBottom:20,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            {[{n:DATA.length,l:"Active Listings",i:"🏘️"},{n:DATA.filter(l=>l.cashFlow>0).length,l:"Cash Flow+",i:"✅"},{n:DATA.filter(l=>l.priceReduction>5).length,l:"Price Reduced 5%+",i:"📉"},{n:DATA.filter(l=>l.dom>45).length,l:"Motivated Sellers",i:"⏳"}].map(s=>(
              <div key={s.l} style={{textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:900,color:"#38BDF8"}}>{s.n}</div>
                <div style={{fontSize:11,color:"#475569",fontWeight:500}}>{s.i} {s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── VIEW TABS + PROPERTY TYPES ── */}
      <div style={{background:"#0A1628",padding:"12px 24px",position:"sticky",top:66,zIndex:40,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{maxWidth:1220,margin:"0 auto",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {["grid","map","neighbourhoods"].map(v=>(
            <button key={v} onClick={()=>setView(v)}
              style={{background:view===v?"rgba(27,79,216,0.3)":"rgba(255,255,255,0.05)",color:view===v?"#38BDF8":"#64748B",border:`1px solid ${view===v?"rgba(27,79,216,0.5)":"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"7px 16px",fontSize:12,fontWeight:view===v?700:500,cursor:"pointer",fontFamily:"inherit"}}>
              {v==="grid"?"🏘️ Listings":v==="map"?"🗺️ Map View":"🏙️ Neighbourhoods"}
            </button>
          ))}
          <div style={{width:"1px",height:20,background:"rgba(255,255,255,0.1)",margin:"0 4px"}}/>
          {PROPERTY_TYPES.map(t=>{
            const active=filters.propertyType===t;
            return <button key={t} onClick={()=>setFilters(f=>({...f,propertyType:t}))}
              style={{background:active?"linear-gradient(135deg,#1B4FD8,#0EA5E9)":"rgba(255,255,255,0.05)",color:active?"#fff":"#64748B",border:`1px solid ${active?"transparent":"rgba(255,255,255,0.1)"}`,borderRadius:20,padding:"6px 14px",fontSize:11,fontWeight:active?700:500,cursor:"pointer",fontFamily:"inherit"}}>
              {t==="All Types"?"All":t==="Semi-Detached"?"Semi":t}
            </button>;
          })}
          <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setFilterOpen(!filterOpen)}
              style={{background:filterOpen?"rgba(27,79,216,0.3)":"rgba(255,255,255,0.05)",color:filterOpen?"#38BDF8":"#64748B",border:`1px solid ${filterOpen?"rgba(27,79,216,0.5)":"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              ⚙️ Filters {filterOpen?"▲":"▼"}
            </button>
            <select value={filters.sort} onChange={e=>setFilters(f=>({...f,sort:e.target.value}))}
              style={{background:"rgba(255,255,255,0.05)",color:"#94A3B8",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"7px 12px",fontSize:12,outline:"none",cursor:"pointer",fontFamily:"inherit"}}>
              <option value="score">Best Deal Score</option>
              <option value="yield">Highest Yield</option>
              <option value="cashflow">Best Cash Flow</option>
              <option value="reduction">Biggest Price Drop</option>
              <option value="dom">Longest Listed</option>
              <option value="price">Lowest Price</option>
            </select>
            <span style={{fontSize:12,color:"#475569",whiteSpace:"nowrap"}}><span style={{color:"#38BDF8",fontWeight:800}}>{results.length}</span> listings</span>
          </div>
        </div>
        {filterOpen&&(
          <div style={{maxWidth:1220,margin:"12px auto 0",background:"rgba(255,255,255,0.04)",borderRadius:14,border:"1px solid rgba(255,255,255,0.08)",padding:"20px",animation:"slideUp 0.2s ease"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:20,marginBottom:16}}>
              {[
                {label:"Min Price",key:"minPrice",min:300000,max:1400000,step:25000,display:fmtK(filters.minPrice)},
                {label:"Max Price",key:"maxPrice",min:300000,max:1400000,step:25000,display:fmtK(filters.maxPrice)},
                {label:"Min Yield",key:"minYield",min:0,max:6,step:0.5,display:`${filters.minYield.toFixed(1)}%`},
                {label:"Min Price Drop",key:"minPriceReduction",min:0,max:12,step:1,display:`${filters.minPriceReduction}%`},
                {label:"Max Days Listed",key:"maxDom",min:7,max:90,step:7,display:filters.maxDom===90?"Any":`${filters.maxDom}d`},
              ].map(f=>(
                <div key={f.key}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
                    <span style={{color:"#64748B",fontWeight:600}}>{f.label}</span>
                    <span style={{color:"#38BDF8",fontWeight:700}}>{f.display}</span>
                  </div>
                  <input type="range" min={f.min} max={f.max} step={f.step} value={filters[f.key]} onChange={e=>setFilters(p=>({...p,[f.key]:+e.target.value}))}/>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
              <button onClick={()=>setFilters(f=>({...f,cashFlowOnly:!f.cashFlowOnly}))}
                style={{background:filters.cashFlowOnly?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.05)",color:filters.cashFlowOnly?"#10B981":"#64748B",border:`1px solid ${filters.cashFlowOnly?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.1)"}`,borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                ✅ Cash Flow+ Only
              </button>
              <button onClick={()=>setFilters({minPrice:400000,maxPrice:1400000,minYield:0,minPriceReduction:0,maxDom:90,cashFlowOnly:false,hoods:[],propertyType:"All Types",sort:filters.sort})}
                style={{fontSize:12,color:"#EF4444",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Clear all</button>
            </div>
            <div style={{fontSize:10,color:"#475569",fontWeight:700,marginBottom:8,letterSpacing:1,textTransform:"uppercase"}}>Neighbourhood</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {HOODS.map(h=>{const on=filters.hoods.includes(h);const c=HOOD_COLORS[h]||{bg:"#E8F4F0",text:"#0E7A5A"};return(
                <button key={h} onClick={()=>toggleHood(h)}
                  style={{background:on?c.bg:"rgba(255,255,255,0.05)",color:on?c.text:"#64748B",border:`1.5px solid ${on?c.text:"rgba(255,255,255,0.1)"}`,borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:on?700:400,cursor:"pointer",fontFamily:"inherit"}}>
                  {on&&"✓ "}{h}
                </button>
              );})}
            </div>
          </div>
        )}
      </div>

      {/* ── QUICK CHIPS ── */}
      {view==="grid"&&(
        <div style={{background:"#fff",borderBottom:"1px solid #E8EDF4",padding:"10px 24px"}}>
          <div style={{maxWidth:1220,margin:"0 auto",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:11,color:"#94A3B8",fontWeight:600}}>QUICK:</span>
            {[
              {label:"📉 Price Reduced",active:filters.minPriceReduction>=5,fn:()=>setFilters(f=>({...f,minPriceReduction:f.minPriceReduction>=5?0:5}))},
              {label:"⏳ Motivated Seller",active:filters.maxDom<=60,fn:()=>setFilters(f=>({...f,maxDom:f.maxDom<=60?90:60}))},
              {label:"💰 Under $800K",active:filters.maxPrice<=800000,fn:()=>setFilters(f=>({...f,maxPrice:f.maxPrice<=800000?1400000:800000}))},
              {label:"✅ Cash Flow+",active:filters.cashFlowOnly,fn:()=>setFilters(f=>({...f,cashFlowOnly:!f.cashFlowOnly}))},
              {label:"❤️ Saved",active:false,fn:()=>{}},
            ].map(c=>(
              <button key={c.label} onClick={c.fn}
                style={{background:c.active?"#EFF6FF":"#F8FAFC",color:c.active?"#1B4FD8":"#64748B",border:`1.5px solid ${c.active?"#1B4FD8":"#E2E8F0"}`,borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:c.active?700:500,cursor:"pointer",fontFamily:"inherit"}}>
                {c.label}
              </button>
            ))}
            {search&&<div style={{marginLeft:"auto",background:"#FFF8ED",border:"1px solid #FDE68A",borderRadius:8,padding:"5px 12px",fontSize:12,color:"#92400E",display:"flex",alignItems:"center",gap:8}}>
              🔍 "{search}" <button onClick={()=>{setSearch("");setSearchInput("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#D97706",fontWeight:700,fontSize:14}}>×</button>
            </div>}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{maxWidth:1220,margin:"0 auto",padding:"28px 24px"}}>

        {/* ── NEIGHBOURHOODS VIEW ── */}
        {view==="neighbourhoods"&&(
          <div>
            <div style={{marginBottom:24}}>
              <h2 style={{fontSize:22,fontWeight:800,color:"#0F172A",marginBottom:6}}>Mississauga Neighbourhood Investment Guide</h2>
              <p style={{color:"#64748B",fontSize:14}}>Click any neighbourhood to see active listings and investment metrics.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
              {HOODS.map(h=>{
                const info=HOOD_INFO[h]||{avgPrice:800000,avgRent:3500,yield:3.8,trend:"+2%",lrtAccess:false,desc:"",emoji:"🏘️"};
                const hListings=DATA.filter(l=>l.neighbourhood===h);
                const c=HOOD_COLORS[h]||{bg:"#E8F4F0",text:"#0E7A5A"};
                return(
                  <div key={h} onClick={()=>{setSelectedHood(h);setView("grid");setFilters(f=>({...f,hoods:[h]}));}}
                    style={{background:"#fff",borderRadius:16,padding:"20px",cursor:"pointer",border:`2px solid transparent`,boxShadow:"0 2px 12px rgba(0,0,0,0.07)",transition:"all 0.2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=c.text;e.currentTarget.style.transform="translateY(-3px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="transparent";e.currentTarget.style.transform="translateY(0)";}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div>
                        <div style={{fontSize:28,marginBottom:4}}>{info.emoji}</div>
                        <div style={{fontSize:17,fontWeight:800,color:"#0F172A"}}>{h}</div>
                        <div style={{background:c.bg,color:c.text,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,display:"inline-block",marginTop:4}}>
                          {hListings.length} active listings
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,color:"#94A3B8",marginBottom:2}}>Avg Price</div>
                        <div style={{fontSize:16,fontWeight:800,color:"#0F172A"}}>{fmtK(info.avgPrice)}</div>
                        <div style={{fontSize:12,fontWeight:700,color:"#16A865",marginTop:2}}>{info.trend} YoY</div>
                      </div>
                    </div>
                    <p style={{fontSize:12,color:"#64748B",lineHeight:1.6,marginBottom:14}}>{info.desc}</p>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      {[{l:"Avg Rent",v:`${fmtK(info.avgRent*12)}/yr`},{l:"Yield",v:`${info.yield}%`},{l:"LRT Access",v:info.lrtAccess?"✅ Yes":"—"}].map(s=>(
                        <div key={s.l} style={{background:"#F8FAFC",borderRadius:8,padding:"8px",textAlign:"center"}}>
                          <div style={{fontSize:9,color:"#94A3B8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>{s.l}</div>
                          <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginTop:2}}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MAP VIEW ── */}
        {view==="map"&&(
          <div>
            <div style={{marginBottom:20}}>
              <h2 style={{fontSize:20,fontWeight:800,color:"#0F172A",marginBottom:4}}>Mississauga Investment Map</h2>
              <p style={{color:"#64748B",fontSize:13}}>Click a neighbourhood to filter listings. Size = number of deals. Color = avg deal score.</p>
            </div>
            <div style={{background:"#fff",borderRadius:20,padding:"28px",boxShadow:"0 2px 16px rgba(0,0,0,0.07)"}}>
              <div style={{position:"relative",width:"100%",maxWidth:700,margin:"0 auto",aspectRatio:"1.4",background:"linear-gradient(135deg,#EFF6FF 0%,#F0FDF4 100%)",borderRadius:16,border:"2px solid #E2E8F0",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#CBD5E0",fontSize:13,fontWeight:600}}>Mississauga, Ontario</div>
                {[
                  {h:"Port Credit",x:48,y:78,size:32},{h:"Lakeview",x:58,y:72},{h:"Cooksville",x:55,y:55},{h:"Hurontario",x:62,y:45},
                  {h:"Churchill Meadows",x:35,y:42},{h:"Erin Mills",x:28,y:48},{h:"Meadowvale",x:22,y:35},{h:"Streetsville",x:38,y:35},
                  {h:"Clarkson",x:30,y:70},{h:"Malton",x:72,y:28},
                ].map(p=>{
                  const hListings=DATA.filter(l=>l.neighbourhood===p.h);
                  const avgScore=hListings.length?hListings.reduce((a,b)=>a+b.score,0)/hListings.length:5;
                  const c=HOOD_COLORS[p.h]||{bg:"#E8F4F0",text:"#0E7A5A"};
                  const active=filters.hoods.includes(p.h);
                  return(
                    <div key={p.h} onClick={()=>{toggleHood(p.h);setView("grid");}}
                      style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,transform:"translate(-50%,-50%)",cursor:"pointer",textAlign:"center",zIndex:active?10:1}}>
                      <div style={{width:p.size||28,height:p.size||28,borderRadius:"50%",background:active?"#1B4FD8":scoreColor(avgScore),border:`3px solid ${active?"#fff":"rgba(255,255,255,0.8)"}`,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",boxShadow:`0 4px 12px ${active?"rgba(27,79,216,0.5)":"rgba(0,0,0,0.2)"}`,transition:"all 0.2s"}}>
                        {hListings.length}
                      </div>
                      <div style={{fontSize:10,fontWeight:700,color:active?"#1B4FD8":"#334155",marginTop:4,background:"rgba(255,255,255,0.9)",padding:"2px 6px",borderRadius:6,whiteSpace:"nowrap"}}>
                        {p.h}
                      </div>
                    </div>
                  );
                })}
                <div style={{position:"absolute",bottom:12,left:12,background:"rgba(255,255,255,0.9)",borderRadius:10,padding:"8px 12px",fontSize:10}}>
                  <div style={{fontWeight:700,marginBottom:4,color:"#475569"}}>DEAL SCORE</div>
                  {[{c:"#16A865",l:"8-10 Strong Buy"},{c:"#F5A623",l:"6-7 Watch"},{c:"#E84040",l:"Below 6"}].map(s=>(
                    <div key={s.l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:s.c}}/>
                      <span style={{color:"#64748B"}}>{s.l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{textAlign:"center",fontSize:12,color:"#94A3B8",marginTop:16}}>Click any dot to filter listings by neighbourhood</p>
            </div>
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {view==="grid"&&(
          results.length===0?(
            <div style={{textAlign:"center",padding:"80px 0",background:"#fff",borderRadius:20}}>
              <div style={{fontSize:52}}>🔍</div>
              <div style={{fontSize:16,color:"#64748B",marginTop:12,fontWeight:600}}>No listings match</div>
              <button onClick={()=>{setSearch("");setSearchInput("");setFilters({minPrice:400000,maxPrice:1400000,minYield:0,minPriceReduction:0,maxDom:90,cashFlowOnly:false,hoods:[],propertyType:"All Types",sort:"score"});}}
                style={{marginTop:16,background:"#EFF6FF",color:"#1B4FD8",border:"none",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                Clear Filters
              </button>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",gap:20}}>
              {results.map((l,i)=>{
                const ai=analysis[l.id];
                const hp=HOOD_COLORS[l.neighbourhood]||{bg:"#E8F4F0",text:"#0E7A5A"};
                const isFav=favourites.includes(l.id);
                return(
                  <div key={l.id} className="card" onClick={()=>openModal(l)}
                    style={{background:"#fff",borderRadius:18,boxShadow:"0 2px 16px rgba(0,0,0,0.07)",overflow:"hidden",animation:`slideUp 0.3s ease ${i*0.025}s both`,border:"1px solid #F1F5F9"}}>
                    <div style={{height:110,background:`linear-gradient(135deg,${hp.bg} 0%,#F8FAFC 100%)`,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <div style={{fontSize:44}}>{TYPE_ICON[l.type]||"🏠"}</div>
                      <div style={{position:"absolute",top:10,left:10,display:"flex",gap:5}}>
                        {l.priceReduction>0&&<span style={{background:"#EF4444",color:"#fff",fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:6}}>▼ {l.priceReduction}% Off</span>}
                        {l.dom>45&&<span style={{background:"#F59E0B",color:"#fff",fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:6}}>{l.dom}d</span>}
                      </div>
                      <div style={{position:"absolute",top:10,right:50,background:scoreBg(l.score),border:`2px solid ${scoreColor(l.score)}`,borderRadius:10,padding:"4px 10px",textAlign:"center"}}>
                        <div style={{fontSize:15,fontWeight:900,color:scoreColor(l.score),lineHeight:1}}>{l.score}</div>
                        <div style={{fontSize:8,color:scoreColor(l.score),fontWeight:700}}>SCORE</div>
                      </div>
                      <button className="fav-btn" onClick={(e)=>toggleFav(l.id,e)}
                        style={{position:"absolute",top:10,right:10,background:"rgba(255,255,255,0.9)",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {isFav?"❤️":"🤍"}
                      </button>
                      {ai&&ai.verdict!=="ERROR"&&<div style={{position:"absolute",bottom:8,right:10,background:vBg(ai.verdict),border:`1.5px solid ${vColor(ai.verdict)}`,borderRadius:7,padding:"3px 10px",fontSize:10,fontWeight:800,color:vColor(ai.verdict)}}>🤖 {ai.verdict}</div>}
                    </div>
                    <div style={{padding:"14px 16px 16px"}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:4}}>{l.address}</div>
                      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{background:hp.bg,color:hp.text,fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20}}>{l.neighbourhood}</span>
                        <span style={{color:"#94A3B8",fontSize:11}}>{l.type}</span>
                        <span style={{color:"#94A3B8",fontSize:11}}>#{l.id}</span>
                      </div>
                      {/* PRICE HISTORY BAR */}
                      {l.priceReduction>0&&(
                        <div style={{marginBottom:10}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#94A3B8",marginBottom:3}}>
                            <span>Original: {fmtK(l.originalPrice)}</span>
                            <span style={{color:"#EF4444",fontWeight:700}}>Now: {fmtK(l.price)}</span>
                          </div>
                          <div style={{height:5,background:"#F1F5F9",borderRadius:3,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${(l.price/l.originalPrice)*100}%`,background:"linear-gradient(90deg,#EF4444,#F59E0B)",borderRadius:3}}/>
                          </div>
                        </div>
                      )}
                      <div style={{fontSize:22,fontWeight:900,color:"#0F172A",marginBottom:10}}>{fmtK(l.price)}</div>
                      <div style={{display:"flex",gap:12,fontSize:12,color:"#64748B",marginBottom:12}}>
                        <span>🛏 {l.bedrooms}</span><span>🚿 {l.bathrooms}</span><span>📐 {l.sqft.toLocaleString()}</span><span>📅 {l.dom}d</span>
                      </div>
                      <div style={{background:"#F8FAFC",borderRadius:10,padding:"10px 12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,border:"1px solid #F1F5F9",marginBottom:10}}>
                        <div><div style={{fontSize:9,color:"#94A3B8",fontWeight:700,marginBottom:2,textTransform:"uppercase"}}>Cash Flow</div><div style={{fontSize:14,fontWeight:800,color:cfColor(l.cashFlow)}}>{l.cashFlow>=0?"+":""}{fmt(l.cashFlow)}</div></div>
                        <div><div style={{fontSize:9,color:"#94A3B8",fontWeight:700,marginBottom:2,textTransform:"uppercase"}}>Yield</div><div style={{fontSize:14,fontWeight:800,color:l.yield>4?"#16A865":l.yield>3?"#F5A623":"#64748B"}}>{l.yield.toFixed(2)}%</div></div>
                        <div><div style={{fontSize:9,color:"#94A3B8",fontWeight:700,marginBottom:2,textTransform:"uppercase"}}>Est Rent</div><div style={{fontSize:13,fontWeight:700}}>{fmt(l.estimatedRent)}/mo</div></div>
                        <div><div style={{fontSize:9,color:"#94A3B8",fontWeight:700,marginBottom:2,textTransform:"uppercase"}}>$/sqft</div><div style={{fontSize:13,fontWeight:700}}>${l.ppsf}</div></div>
                      </div>
                      <button onClick={(e)=>shareListing(l,e)}
                        style={{width:"100%",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"7px",fontSize:12,color:"#475569",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                        📤 Share Listing
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {modal&&(()=>{
        const ai=analysis[modal.id];
        const ld=loading[modal.id];
        const hp=HOOD_COLORS[modal.neighbourhood]||{bg:"#E8F4F0",text:"#0E7A5A"};
        const custMort=calcMort(modal.price,mortCalc.downPct,mortCalc.rate,mortCalc.years);
        const custTax=(modal.assessedValue*0.0092)/12;
        const custCashFlow=modal.estimatedRent-custMort-custTax-300-modal.estimatedRent*0.05;
        const brrrResult=brrrCalc(modal);
        return(
          <div onClick={()=>setModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)"}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:600,maxHeight:"94vh",overflowY:"auto",animation:"slideUp 0.25s cubic-bezier(0.4,0,0.2,1)"}}>
              <div style={{padding:"10px 0 4px",display:"flex",justifyContent:"center",position:"sticky",top:0,background:"#fff",zIndex:10}}>
                <div style={{width:40,height:4,background:"#E2E8F0",borderRadius:2}}/>
              </div>

              {/* MODAL HEADER */}
              <div style={{height:130,background:`linear-gradient(135deg,${hp.bg},#fff)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:56,position:"relative"}}>
                {TYPE_ICON[modal.type]||"🏠"}
                {modal.priceReduction>0&&<span style={{position:"absolute",top:12,left:12,background:"#EF4444",color:"#fff",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:8}}>▼ {modal.priceReduction}% Off</span>}
                <button onClick={(e)=>shareListing(modal,e)} style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,0.9)",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#475569"}}>📤 Share</button>
                <button onClick={(e)=>toggleFav(modal.id,e)} style={{position:"absolute",bottom:12,right:12,background:"rgba(255,255,255,0.9)",border:"none",borderRadius:8,padding:"6px 12px",fontSize:14,cursor:"pointer"}}>
                  {favourites.includes(modal.id)?"❤️ Saved":"🤍 Save"}
                </button>
              </div>

              <div style={{padding:"20px 24px 40px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{fontSize:19,fontWeight:800,color:"#0F172A",marginBottom:4}}>{modal.address}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <span style={{background:hp.bg,color:hp.text,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{modal.neighbourhood}</span>
                      <span style={{color:"#94A3B8",fontSize:12}}>{modal.type} · #{modal.id}</span>
                    </div>
                  </div>
                  <div style={{background:scoreBg(modal.score),border:`2px solid ${scoreColor(modal.score)}`,borderRadius:12,padding:"8px 14px",textAlign:"center",flexShrink:0}}>
                    <div style={{fontSize:24,fontWeight:900,color:scoreColor(modal.score),lineHeight:1}}>{modal.score}</div>
                    <div style={{fontSize:9,color:scoreColor(modal.score),fontWeight:700,textTransform:"uppercase"}}>Deal Score</div>
                  </div>
                </div>
                <div style={{fontSize:28,fontWeight:900,color:"#0F172A",marginBottom:4}}>{fmt(modal.price)}</div>
                {modal.priceReduction>0&&(
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#94A3B8",marginBottom:4}}>
                      <span>Original: {fmt(modal.originalPrice)}</span><span style={{color:"#EF4444",fontWeight:700}}>Saved: {fmt(modal.originalPrice-modal.price)}</span>
                    </div>
                    <div style={{height:6,background:"#F1F5F9",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(modal.price/modal.originalPrice)*100}%`,background:"linear-gradient(90deg,#EF4444,#F59E0B)",borderRadius:3}}/>
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:14,fontSize:13,color:"#64748B",marginBottom:16,flexWrap:"wrap"}}>
                  <span>🛏 {modal.bedrooms} bed</span><span>🚿 {modal.bathrooms} bath</span><span>📐 {modal.sqft.toLocaleString()} sqft</span><span>📅 {modal.dom}d</span><span>🏗 {modal.yearBuilt}</span>
                </div>

                {/* WALK/TRANSIT/SCHOOL SCORES */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
                  {[{label:"Walk Score",val:modal.walkScore,icon:"🚶"},{label:"Transit",val:modal.transitScore,icon:"🚇"},{label:"Schools",val:`${modal.schoolScore}/10`,icon:"🏫",raw:modal.schoolScore*10}].map(s=>(
                    <div key={s.label} style={{background:"#F8FAFC",borderRadius:10,padding:"10px",textAlign:"center",border:"1px solid #F1F5F9"}}>
                      <div style={{fontSize:16}}>{s.icon}</div>
                      <div style={{fontSize:16,fontWeight:800,color:walkColor(s.raw||s.val),marginTop:2}}>{s.val}</div>
                      <div style={{fontSize:9,color:"#94A3B8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* MODAL TABS */}
                <div style={{display:"flex",gap:4,marginBottom:20,background:"#F8FAFC",borderRadius:12,padding:4}}>
                  {[{k:"overview",l:"📊 Overview"},{k:"mortgage",l:"🏦 Mortgage Calc"},{k:"brrr",l:"🔄 BRRR Calc"},{k:"ai",l:"🤖 AI Analysis"}].map(t=>(
                    <button key={t.k} className="tab-btn" onClick={()=>setModalTab(t.k)}
                      style={{flex:1,background:modalTab===t.k?"#fff":"transparent",color:modalTab===t.k?"#1B4FD8":"#64748B",border:"none",borderRadius:9,padding:"8px 4px",fontSize:11,fontWeight:modalTab===t.k?700:500,cursor:"pointer",fontFamily:"inherit",boxShadow:modalTab===t.k?"0 2px 8px rgba(0,0,0,0.08)":"none",whiteSpace:"nowrap"}}>
                      {t.l}
                    </button>
                  ))}
                </div>

                {/* OVERVIEW TAB */}
                {modalTab==="overview"&&(
                  <div style={{animation:"fadeIn 0.2s ease"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                      {[
                        {l:"List Price",v:fmt(modal.price)},
                        {l:"MPAC Assessment",v:fmt(modal.assessedValue)},
                        {l:"Est. Monthly Rent",v:`${fmt(modal.estimatedRent)}/mo`},
                        {l:"Rental Yield",v:`${modal.yield.toFixed(2)}%`,c:modal.yield>4?"#16A865":modal.yield>3?"#F5A623":null},
                        {l:"Mortgage (20% dn)",v:`${fmt(modal.mortgage)}/mo`},
                        {l:"Property Tax",v:`${fmt(modal.tax)}/mo`},
                        {l:"Monthly Cash Flow",v:`${modal.cashFlow>=0?"+":""}${fmt(modal.cashFlow)}`,c:cfColor(modal.cashFlow)},
                        {l:"Price/sqft",v:`$${modal.ppsf}/sqft`},
                      ].map(r=>(
                        <div key={r.l} style={{background:"#F8FAFC",borderRadius:10,padding:"10px 12px",border:"1px solid #F1F5F9"}}>
                          <div style={{fontSize:9,color:"#94A3B8",fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",marginBottom:3}}>{r.l}</div>
                          <div style={{fontSize:14,fontWeight:700,color:r.c||"#0F172A"}}>{r.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MORTGAGE CALC TAB */}
                {modalTab==="mortgage"&&(
                  <div style={{animation:"fadeIn 0.2s ease"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
                      {[
                        {label:"Down Payment %",key:"downPct",min:5,max:35,step:5,display:`${mortCalc.downPct}%`},
                        {label:"Interest Rate %",key:"rate",min:3,max:10,step:0.25,display:`${mortCalc.rate}%`},
                        {label:"Amortization",key:"years",min:10,max:30,step:5,display:`${mortCalc.years} yrs`},
                      ].map(f=>(
                        <div key={f.key} style={{gridColumn:f.key==="years"?"span 2":"span 1"}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
                            <span style={{color:"#475569",fontWeight:600}}>{f.label}</span>
                            <span style={{color:"#1B4FD8",fontWeight:700}}>{f.display}</span>
                          </div>
                          <input type="range" min={f.min} max={f.max} step={f.step} value={mortCalc[f.key]} onChange={e=>setMortCalc(m=>({...m,[f.key]:+e.target.value}))}/>
                        </div>
                      ))}
                    </div>
                    <div style={{background:"linear-gradient(135deg,#EFF6FF,#F0FDF4)",borderRadius:14,padding:"20px",border:"1.5px solid #BFDBFE"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#1E40AF",textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Your Numbers</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        {[
                          {l:"Down Payment",v:fmt(modal.price*mortCalc.downPct/100)},
                          {l:"Mortgage Amount",v:fmt(modal.price*(1-mortCalc.downPct/100))},
                          {l:"Monthly Payment",v:`${fmt(custMort)}/mo`},
                          {l:"Monthly Tax",v:`${fmt(custTax)}/mo`},
                          {l:"Est. Rent",v:`${fmt(modal.estimatedRent)}/mo`},
                          {l:"Cash Flow",v:`${custCashFlow>=0?"+":""}${fmt(custCashFlow)}`,c:cfColor(custCashFlow),big:true},
                        ].map(r=>(
                          <div key={r.l} style={{background:"rgba(255,255,255,0.7)",borderRadius:10,padding:"10px 12px",gridColumn:r.big?"span 2":"span 1"}}>
                            <div style={{fontSize:9,color:"#94A3B8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:3}}>{r.l}</div>
                            <div style={{fontSize:r.big?18:14,fontWeight:800,color:r.c||"#0F172A"}}>{r.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* BRRR CALC TAB */}
                {modalTab==="brrr"&&(
                  <div style={{animation:"fadeIn 0.2s ease"}}>
                    <div style={{background:"#FFF8ED",borderRadius:10,padding:"10px 14px",marginBottom:16,border:"1px solid #FDE68A",fontSize:12,color:"#92400E"}}>
                      💡 BRRR = Buy · Renovate · Rent · Refinance · Repeat. Enter your numbers below.
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                      {[
                        {label:"After Repair Value (ARV)",key:"arv"},
                        {label:"Rehab Cost",key:"rehabCost"},
                        {label:"Refinance LTV %",key:"refinanceLTV",isRange:true,min:60,max:85,step:5,display:`${brrr.refinanceLTV}%`},
                        {label:"Closing Costs",key:"closingCosts"},
                      ].map(f=>(
                        <div key={f.key}>
                          <div style={{fontSize:11,color:"#475569",fontWeight:600,marginBottom:6}}>{f.label}</div>
                          {f.isRange?(
                            <>
                              <div style={{fontSize:12,color:"#1B4FD8",fontWeight:700,marginBottom:4}}>{f.display}</div>
                              <input type="range" min={f.min} max={f.max} step={f.step} value={brrr[f.key]} onChange={e=>setBrrr(b=>({...b,[f.key]:+e.target.value}))}/>
                            </>
                          ):(
                            <input type="number" value={brrr[f.key]} onChange={e=>setBrrr(b=>({...b,[f.key]:+e.target.value}))} style={{width:"100%"}}/>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{background:"linear-gradient(135deg,#EFF6FF,#F0FDF4)",borderRadius:14,padding:"20px",border:"1.5px solid #BFDBFE"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#1E40AF",textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>BRRR Results</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        {[
                          {l:"Total Invested",v:fmt(brrrResult.totalInvested)},
                          {l:"Refinance Value",v:fmt(brrrResult.refinanceValue)},
                          {l:"Cash Back on Refi",v:fmt(brrrResult.cashBack),c:brrrResult.cashBack>0?"#16A865":"#E84040"},
                          {l:"Equity Retained",v:fmt(brrrResult.equityLeft)},
                          {l:"New Mortgage/mo",v:fmt(brrrResult.newMortgage)},
                          {l:"New Cash Flow",v:`${brrrResult.newCashFlow>=0?"+":""}${fmt(brrrResult.newCashFlow)}`,c:cfColor(brrrResult.newCashFlow),big:true},
                        ].map(r=>(
                          <div key={r.l} style={{background:"rgba(255,255,255,0.7)",borderRadius:10,padding:"10px 12px",gridColumn:r.big?"span 2":"span 1"}}>
                            <div style={{fontSize:9,color:"#94A3B8",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:3}}>{r.l}</div>
                            <div style={{fontSize:r.big?18:14,fontWeight:800,color:r.c||"#0F172A"}}>{r.v}</div>
                          </div>
                        ))}
                      </div>
                      {brrrResult.cashBack>0&&<div style={{marginTop:12,background:"rgba(16,185,129,0.1)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#065F46",fontWeight:600}}>✅ Infinite return potential — you pulled equity back out</div>}
                    </div>
                  </div>
                )}

                {/* AI TAB */}
                {modalTab==="ai"&&(
                  <div style={{animation:"fadeIn 0.2s ease"}}>
                    <div style={{background:"linear-gradient(135deg,#EFF6FF,#F0FDF4)",border:"1.5px solid #BFDBFE",borderRadius:16,padding:"18px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                        <div style={{fontSize:22}}>🤖</div>
                        <div>
                          <div style={{fontSize:14,fontWeight:800,color:"#1E40AF"}}>Claude AI Investment Analysis</div>
                          <div style={{fontSize:11,color:"#64748B"}}>{registered?"Unlimited access":""+analysisLeft+" free analyses remaining"}</div>
                        </div>
                      </div>
                      {!ai&&!ld&&(analysisLeft>0||registered)&&(
                        <button onClick={()=>runAnalysis(modal)} style={{width:"100%",background:"linear-gradient(135deg,#1B4FD8,#0EA5E9)",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(27,79,216,0.35)"}}>
                          ✨ Analyze with Claude AI
                        </button>
                      )}
                      {!ai&&!ld&&analysisLeft<=0&&!registered&&(
                        <div style={{textAlign:"center",padding:"10px 0"}}>
                          <div style={{fontSize:13,color:"#64748B",marginBottom:12}}>You've used your 3 free analyses today.</div>
                          <button onClick={()=>setAlertModal(true)} style={{width:"100%",background:"linear-gradient(135deg,#1B4FD8,#0EA5E9)",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                            Register for Unlimited Access
                          </button>
                        </div>
                      )}
                      {ld&&<div style={{textAlign:"center",padding:"20px 0"}}><div style={{width:32,height:32,border:"3px solid #BFDBFE",borderTop:"3px solid #1B4FD8",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/><div style={{fontSize:13,color:"#3B82F6",fontWeight:600}}>Analyzing {modal.neighbourhood}...</div></div>}
                      {ai&&ai.verdict!=="ERROR"&&(
                        <div style={{animation:"fadeIn 0.4s ease"}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"12px 14px",background:vBg(ai.verdict),borderRadius:10,border:`1.5px solid ${vColor(ai.verdict)}`}}>
                            <div style={{fontSize:24,fontWeight:900,color:vColor(ai.verdict)}}>{ai.verdict}</div>
                            <div style={{fontSize:13,color:vColor(ai.verdict),fontWeight:600,lineHeight:1.4}}>{ai.verdictReason}</div>
                          </div>
                          <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:12}}>
                            {[{l:"Rental",v:ai.rentalOutlook},{l:"Motivation",v:ai.motivationSignal},{l:"Best For",v:ai.bestFor}].map(t=>(
                              <div key={t.l} style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:8,padding:"5px 10px",fontSize:11}}>
                                <span style={{color:"#94A3B8"}}>{t.l}: </span><span style={{color:"#1E40AF",fontWeight:700}}>{t.v}</span>
                              </div>
                            ))}
                          </div>
                          {ai.highlights?.length>0&&<div style={{marginBottom:10}}><div style={{fontSize:10,fontWeight:700,color:"#16A865",marginBottom:6,textTransform:"uppercase"}}>✅ Highlights</div>{ai.highlights.map((h,i)=><div key={i} style={{fontSize:13,color:"#334155",padding:"5px 0",borderBottom:i<ai.highlights.length-1?"1px solid #F1F5F9":"none"}}>· {h}</div>)}</div>}
                          {ai.risks?.length>0&&<div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:700,color:"#EF4444",marginBottom:6,textTransform:"uppercase"}}>⚠️ Risks</div>{ai.risks.map((r,i)=><div key={i} style={{fontSize:13,color:"#334155",padding:"5px 0",borderBottom:i<ai.risks.length-1?"1px solid #F1F5F9":"none"}}>· {r}</div>)}</div>}
                          {ai.hamzaNote&&<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"12px 14px",display:"flex",gap:10}}><div style={{fontSize:18,flexShrink:0}}>👤</div><div><div style={{fontSize:10,fontWeight:700,color:"#92400E",marginBottom:4,textTransform:"uppercase"}}>Hamza's Local Insight</div><div style={{fontSize:13,color:"#78350F",lineHeight:1.5}}>{ai.hamzaNote}</div></div></div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{marginTop:20}}>
                  <button onClick={()=>{setModal(null);setAlertModal(true);}} style={{width:"100%",background:"linear-gradient(135deg,#0A1628,#1B4FD8)",color:"#fff",border:"none",borderRadius:14,padding:"15px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(10,22,40,0.3)"}}>
                    🔔 Alert Me When Similar Deals Hit
                  </button>
                  <div style={{textAlign:"center",marginTop:12,fontSize:12,color:"#CBD5E0"}}>Hamza Nouman · Royal LePage Signature Realty · 647-609-1289</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── FAV GATE MODAL ── */}
      {favGate&&(
        <div onClick={()=>setFavGate(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:"32px 28px",maxWidth:380,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:10}}>❤️</div>
            <div style={{fontSize:18,fontWeight:800,color:"#0F172A",marginBottom:8}}>Save Your Favourites</div>
            <p style={{fontSize:13,color:"#64748B",lineHeight:1.7,marginBottom:20}}>Register to save listings and get alerts when similar properties hit the market.</p>
            <button onClick={()=>{setFavGate(null);setAlertModal(true);}} style={{width:"100%",background:"linear-gradient(135deg,#0A1628,#1B4FD8)",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
              Register Free
            </button>
          </div>
        </div>
      )}

      {/* ── LEAD CAPTURE MODAL ── */}
      {alertModal&&(
        <div onClick={()=>!submitted&&setAlertModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)",animation:"fadeIn 0.2s ease"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:"36px 30px",maxWidth:420,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.25)"}}>
            {!submitted?(
              <>
                <div style={{fontSize:44,textAlign:"center",marginBottom:10}}>🔔</div>
                <div style={{fontSize:22,fontWeight:900,color:"#0F172A",textAlign:"center",marginBottom:6}}>Get Deal Alerts</div>
                <p style={{fontSize:13,color:"#64748B",textAlign:"center",lineHeight:1.7,marginBottom:24}}>Register for <strong>unlimited AI analyses</strong>, saved favourites, and instant WhatsApp alerts on new Mississauga investment deals.</p>
                {[{k:"name",l:"Full Name",p:"Your full name",req:true},{k:"phone",l:"Phone / WhatsApp",p:"+1 (647) 000-0000",req:true},{k:"email",l:"Email (optional)",p:"your@email.com",req:false}].map(f=>(
                  <div key={f.k} style={{marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#475569",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>{f.l}{f.req&&<span style={{color:"#EF4444"}}> *</span>}</div>
                    <input type="text" placeholder={f.p} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}
                      style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",fontFamily:"inherit",color:"#0F172A"}}/>
                  </div>
                ))}
                <button onClick={()=>{if(form.name&&form.phone)setSubmitted(true);}} disabled={!form.name||!form.phone}
                  style={{width:"100%",background:form.name&&form.phone?"linear-gradient(135deg,#0A1628,#1B4FD8)":"#E2E8F0",color:form.name&&form.phone?"#fff":"#94A3B8",border:"none",borderRadius:12,padding:"15px",fontWeight:700,fontSize:15,cursor:form.name&&form.phone?"pointer":"not-allowed",fontFamily:"inherit"}}>
                  Unlock Full Access
                </button>
                <div style={{fontSize:11,color:"#CBD5E0",textAlign:"center",marginTop:12}}>Hamza Nouman · Royal LePage Signature · Never shared.</div>
              </>
            ):(
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:60,marginBottom:14}}>✅</div>
                <div style={{fontSize:22,fontWeight:900,color:"#16A865",marginBottom:8}}>You're registered!</div>
                <p style={{fontSize:14,color:"#64748B",lineHeight:1.7,marginBottom:24}}>Hamza will reach out on WhatsApp shortly. You now have unlimited AI analyses and saved favourites.</p>
                <button onClick={()=>{setAlertModal(false);setSubmitted(false);setRegistered(true);if(favGate){setFavourites(f=>[...f,favGate]);setFavGate(null);}}}
                  style={{background:"#F8FAFC",color:"#475569",border:"1px solid #E2E8F0",borderRadius:10,padding:"12px 24px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                  Back to Listings
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
