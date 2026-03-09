import { useState, useMemo } from "react";

const MOCK_LISTINGS = [
  { id:"ML1001", address:"2847 Folkway Dr", neighbourhood:"Erin Mills", price:849000, bedrooms:4, bathrooms:3, sqft:2100, dom:34, priceReduction:6.2, originalPrice:906000, assessedValue:780000, estimatedRent:3800, type:"Detached", yearBuilt:1998, taxes:6890, garage:2, basement:"Finished" },
  { id:"ML1002", address:"1203 Haig Blvd", neighbourhood:"Lakeview", price:1125000, bedrooms:3, bathrooms:2, sqft:1650, dom:8, priceReduction:0, originalPrice:1125000, assessedValue:1050000, estimatedRent:4400, type:"Semi-Detached", yearBuilt:2005, taxes:8200, garage:1, basement:"Unfinished" },
  { id:"ML1003", address:"5521 Glen Erin Dr", neighbourhood:"Churchill Meadows", price:799000, bedrooms:3, bathrooms:3, sqft:1800, dom:47, priceReduction:8.5, originalPrice:873000, assessedValue:710000, estimatedRent:3500, type:"Townhouse", yearBuilt:2003, taxes:5900, garage:1, basement:"Finished" },
  { id:"ML1004", address:"3318 Redpath Cir", neighbourhood:"Meadowvale", price:689000, bedrooms:3, bathrooms:2, sqft:1450, dom:22, priceReduction:3.1, originalPrice:711000, assessedValue:640000, estimatedRent:3200, type:"Semi-Detached", yearBuilt:1992, taxes:5200, garage:1, basement:"Partial" },
  { id:"ML1005", address:"915 Inverhouse Dr", neighbourhood:"Clarkson", price:975000, bedrooms:4, bathrooms:3, sqft:2300, dom:61, priceReduction:11.2, originalPrice:1098000, assessedValue:880000, estimatedRent:4100, type:"Detached", yearBuilt:1987, taxes:7100, garage:2, basement:"Finished" },
  { id:"ML1006", address:"4402 Tahoe Blvd", neighbourhood:"Malton", price:599000, bedrooms:3, bathrooms:2, sqft:1300, dom:15, priceReduction:0, originalPrice:599000, assessedValue:570000, estimatedRent:2900, type:"Townhouse", yearBuilt:2001, taxes:4600, garage:1, basement:"None" },
  { id:"ML1007", address:"1876 Lakeshore Rd W", neighbourhood:"Port Credit", price:1380000, bedrooms:3, bathrooms:2, sqft:1550, dom:29, priceReduction:4.8, originalPrice:1450000, assessedValue:1200000, estimatedRent:5200, type:"Detached", yearBuilt:1965, taxes:9800, garage:2, basement:"Finished" },
  { id:"ML1008", address:"6634 Ninth Line", neighbourhood:"Streetsville", price:1049000, bedrooms:4, bathrooms:3, sqft:2450, dom:53, priceReduction:7.3, originalPrice:1131000, assessedValue:940000, estimatedRent:4300, type:"Detached", yearBuilt:1995, taxes:7600, garage:2, basement:"Finished" },
  { id:"ML1009", address:"345 Rathburn Rd W", neighbourhood:"Cooksville", price:729000, bedrooms:3, bathrooms:2, sqft:1600, dom:38, priceReduction:5.5, originalPrice:771000, assessedValue:660000, estimatedRent:3300, type:"Semi-Detached", yearBuilt:1990, taxes:5600, garage:1, basement:"Finished" },
  { id:"ML1010", address:"2211 Hurontario St", neighbourhood:"Cooksville", price:649000, bedrooms:2, bathrooms:2, sqft:1100, dom:19, priceReduction:2.0, originalPrice:662000, assessedValue:620000, estimatedRent:3000, type:"Condo", yearBuilt:2010, taxes:4900, garage:1, basement:"None" },
  { id:"ML1011", address:"7789 Magistrate Terr", neighbourhood:"Meadowvale", price:775000, bedrooms:4, bathrooms:3, sqft:1950, dom:44, priceReduction:9.1, originalPrice:853000, assessedValue:695000, estimatedRent:3600, type:"Semi-Detached", yearBuilt:1997, taxes:6100, garage:2, basement:"Finished" },
  { id:"ML1012", address:"432 Queen St S", neighbourhood:"Streetsville", price:899000, bedrooms:3, bathrooms:2, sqft:1750, dom:11, priceReduction:0, originalPrice:899000, assessedValue:855000, estimatedRent:3900, type:"Detached", yearBuilt:2001, taxes:6700, garage:2, basement:"Unfinished" },
  { id:"ML1013", address:"1590 Carolyn Rd", neighbourhood:"Erin Mills", price:869000, bedrooms:4, bathrooms:3, sqft:2050, dom:67, priceReduction:12.4, originalPrice:992000, assessedValue:760000, estimatedRent:3700, type:"Detached", yearBuilt:1989, taxes:6400, garage:2, basement:"Finished" },
  { id:"ML1014", address:"88 Port St E", neighbourhood:"Port Credit", price:1195000, bedrooms:2, bathrooms:2, sqft:1200, dom:5, priceReduction:0, originalPrice:1195000, assessedValue:1150000, estimatedRent:4800, type:"Condo", yearBuilt:2018, taxes:8800, garage:1, basement:"None" },
  { id:"ML1015", address:"3956 Tomken Rd", neighbourhood:"Malton", price:629000, bedrooms:3, bathrooms:2, sqft:1380, dom:31, priceReduction:4.4, originalPrice:658000, assessedValue:580000, estimatedRent:2950, type:"Semi-Detached", yearBuilt:1994, taxes:4800, garage:1, basement:"Partial" },
  { id:"ML1016", address:"1122 Clarkson Rd N", neighbourhood:"Clarkson", price:1025000, bedrooms:4, bathrooms:3, sqft:2200, dom:42, priceReduction:6.8, originalPrice:1100000, assessedValue:920000, estimatedRent:4200, type:"Detached", yearBuilt:1991, taxes:7400, garage:2, basement:"Finished" },
  { id:"ML1017", address:"671 Bristol Rd W", neighbourhood:"Hurontario", price:699000, bedrooms:3, bathrooms:2, sqft:1500, dom:26, priceReduction:3.7, originalPrice:726000, assessedValue:655000, estimatedRent:3150, type:"Townhouse", yearBuilt:2006, taxes:5300, garage:1, basement:"Finished" },
  { id:"ML1018", address:"2445 Burnhamthorpe Rd", neighbourhood:"Churchill Meadows", price:819000, bedrooms:4, bathrooms:3, sqft:1920, dom:55, priceReduction:8.9, originalPrice:899000, assessedValue:730000, estimatedRent:3650, type:"Semi-Detached", yearBuilt:2000, taxes:6300, garage:2, basement:"Finished" },
  { id:"ML1019", address:"509 Lakeshore Rd E", neighbourhood:"Lakeview", price:1250000, bedrooms:3, bathrooms:2, sqft:1700, dom:14, priceReduction:1.5, originalPrice:1269000, assessedValue:1180000, estimatedRent:5000, type:"Detached", yearBuilt:1972, taxes:9100, garage:1, basement:"Finished" },
  { id:"ML1020", address:"4123 Periwinkle Cres", neighbourhood:"Hurontario", price:749000, bedrooms:3, bathrooms:3, sqft:1680, dom:39, priceReduction:5.9, originalPrice:796000, assessedValue:680000, estimatedRent:3400, type:"Townhouse", yearBuilt:2004, taxes:5700, garage:1, basement:"Finished" },
];

const HOOD_COLORS = {
  "Erin Mills":{ bg:"#E8F4F0", text:"#0E7A5A", border:"#0E7A5A" },
  "Lakeview":{ bg:"#E8F0FB", text:"#1A4A8A", border:"#1A4A8A" },
  "Churchill Meadows":{ bg:"#F0EBF8", text:"#5A1A8A", border:"#5A1A8A" },
  "Meadowvale":{ bg:"#FFF3E8", text:"#7A4A1A", border:"#7A4A1A" },
  "Clarkson":{ bg:"#E8F8EE", text:"#1A6A3A", border:"#1A6A3A" },
  "Malton":{ bg:"#FFF0F0", text:"#8A1A1A", border:"#8A1A1A" },
  "Port Credit":{ bg:"#E8F4FF", text:"#1A5A8A", border:"#1A5A8A" },
  "Streetsville":{ bg:"#FEFAE8", text:"#6A5800", border:"#6A5800" },
  "Cooksville":{ bg:"#F5F0FF", text:"#4A1A8A", border:"#4A1A8A" },
  "Hurontario":{ bg:"#FFEFF5", text:"#8A1A4A", border:"#8A1A4A" },
};

const TYPE_ICON = { Detached:"🏠", "Semi-Detached":"🏡", Townhouse:"🏘️", Condo:"🏢" };
const PROPERTY_TYPES = ["All Types", "Detached", "Semi-Detached", "Townhouse", "Condo"];
const HOODS = [...new Set(MOCK_LISTINGS.map(l => l.neighbourhood))].sort();

function calcMortgage(price, rate=0.065, years=25, down=0.20) {
  const p = price*(1-down), m=rate/12, n=years*12;
  return (p*m*Math.pow(1+m,n))/(Math.pow(1+m,n)-1);
}

function calcMetrics(l) {
  const mortgage = calcMortgage(l.price);
  const tax = (l.assessedValue*0.0092)/12;
  const costs = mortgage+tax+150+l.estimatedRent*0.05+150;
  const cashFlow = l.estimatedRent-costs;
  const yld = ((l.estimatedRent*12-(tax+300+l.estimatedRent*0.05)*12)/l.price)*100;
  const ppsf = Math.round(l.price/l.sqft);
  let score = 5;
  if(cashFlow>0) score+=2; else if(cashFlow<-500) score-=2;
  if(l.priceReduction>8) score+=2; else if(l.priceReduction>5) score+=1.5; else if(l.priceReduction>3) score+=1;
  if(l.dom>60) score+=1.5; else if(l.dom>30) score+=1;
  if(yld>4) score+=1;
  return { mortgage, tax, cashFlow, yield:yld, ppsf, score:Math.min(10,Math.max(1,Math.round(score*10)/10)) };
}

const DATA = MOCK_LISTINGS.map(l=>({...l,...calcMetrics(l)}));
const fmt = n => new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD",maximumFractionDigits:0}).format(n);
const fmtK = n => n>=1000000?`$${(n/1000000).toFixed(2)}M`:`$${Math.round(n/1000)}K`;

async function analyzeWithClaude(listing, metrics) {
  const prompt = `You are an expert real estate investment analyst specializing in Mississauga, Ontario GTA. Analyze this listing and give a direct investment verdict.

LISTING: ${listing.address}, ${listing.neighbourhood} | ${listing.type} | ${fmt(listing.price)} | Built ${listing.yearBuilt}
${listing.bedrooms}bd/${listing.bathrooms}ba/${listing.sqft.toLocaleString()}sqft | $${metrics.ppsf}/sqft | ${listing.dom} DOM
Price Reduction: ${listing.priceReduction>0?`${listing.priceReduction}% off (was ${fmt(listing.originalPrice)})`:"None"}
MPAC: ${fmt(listing.assessedValue)} | Tax: ${fmt(listing.taxes)}/yr

INVESTMENT (20% dn, 6.5%, 25yr): Mortgage ${fmt(metrics.mortgage)}/mo | Tax ${fmt(metrics.tax)}/mo | Rent ${fmt(listing.estimatedRent)}/mo | Cash Flow ${fmt(metrics.cashFlow)} | Yield ${metrics.yield.toFixed(2)}% | Score ${metrics.score}/10

MARKET 2025: Avg $970K, prices -5-8% YoY, 2800+ active listings, buyer's market, Hurontario LRT coming, rents +42% over 7 years.

Return ONLY valid JSON, no markdown:
{"verdict":"BUY or WATCH or PASS","verdictReason":"One punchy sentence max 15 words","highlights":["point 1 max 12 words","point 2","point 3"],"risks":["risk 1 max 12 words","risk 2"],"hamzaNote":"One sentence local agent insight","rentalOutlook":"Strong or Moderate or Weak","motivationSignal":"High or Medium or Low","bestFor":"First-time investor or Cash flow investor or Appreciation play or BRRR strategy or End user"}`;

  const response = await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:prompt}]})});
  const data = await response.json();
  const text = data.content?.[0]?.text||"";
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

export default function App() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({minPrice:400000,maxPrice:1400000,minYield:0,minPriceReduction:0,maxDom:90,cashFlowOnly:false,hoods:[],propertyType:"All Types",sort:"score"});
  const [filterOpen, setFilterOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [analysis, setAnalysis] = useState({});
  const [loading, setLoading] = useState({});
  const [alertModal, setAlertModal] = useState(false);
  const [form, setForm] = useState({name:"",phone:"",email:""});
  const [submitted, setSubmitted] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(() => {
    try { return parseInt(localStorage.getItem("analysisCount")||"0"); } catch { return 0; }
  });

  const results = useMemo(()=>{
    let r = DATA.filter(l=>{
      if(search){
        const s = search.toLowerCase();
        const match = l.address.toLowerCase().includes(s)||l.neighbourhood.toLowerCase().includes(s)||l.id.toLowerCase().includes(s)||l.type.toLowerCase().includes(s);
        if(!match) return false;
      }
      if(l.price>filters.maxPrice||l.price<filters.minPrice) return false;
      if(l.yield<filters.minYield) return false;
      if(l.priceReduction<filters.minPriceReduction) return false;
      if(l.dom>filters.maxDom) return false;
      if(filters.cashFlowOnly&&l.cashFlow<=0) return false;
      if(filters.hoods.length&&!filters.hoods.includes(l.neighbourhood)) return false;
      if(filters.propertyType!=="All Types"&&l.type!==filters.propertyType) return false;
      return true;
    });
    return r.sort((a,b)=>{
      if(filters.sort==="score") return b.score-a.score;
      if(filters.sort==="yield") return b.yield-a.yield;
      if(filters.sort==="cashflow") return b.cashFlow-a.cashFlow;
      if(filters.sort==="dom") return b.dom-a.dom;
      if(filters.sort==="reduction") return b.priceReduction-a.priceReduction;
      if(filters.sort==="price") return a.price-b.price;
      return 0;
    });
  },[search,filters]);

  const toggleHood = h=>setFilters(f=>({...f,hoods:f.hoods.includes(h)?f.hoods.filter(x=>x!==h):[...f.hoods,h]}));

  const runAnalysis = async(listing)=>{
    if(analysis[listing.id]||loading[listing.id]) return;
    if(analysisCount>=3){setAlertModal(true);return;}
    setLoading(l=>({...l,[listing.id]:true}));
    try{
      const metrics={mortgage:listing.mortgage,tax:listing.tax,cashFlow:listing.cashFlow,yield:listing.yield,ppsf:listing.ppsf,score:listing.score};
      const result = await analyzeWithClaude(listing,metrics);
      setAnalysis(a=>({...a,[listing.id]:result}));
      const newCount = analysisCount+1;
      setAnalysisCount(newCount);
      try{localStorage.setItem("analysisCount",newCount.toString());}catch{}
    }catch(e){
      setAnalysis(a=>({...a,[listing.id]:{verdict:"ERROR",verdictReason:"Try again",highlights:[],risks:[],hamzaNote:"",rentalOutlook:"—",motivationSignal:"—",bestFor:"—"}}));
    }
    setLoading(l=>({...l,[listing.id]:false}));
  };

  const scoreColor=s=>s>=8?"#16A865":s>=6?"#F5A623":"#E84040";
  const scoreBg=s=>s>=8?"#E8F8EF":s>=6?"#FFF8ED":"#FFF0F0";
  const cfColor=cf=>cf>0?"#16A865":cf>-300?"#F5A623":"#E84040";
  const vColor=v=>v==="BUY"?"#16A865":v==="WATCH"?"#F5A623":"#E84040";
  const vBg=v=>v==="BUY"?"#E8F8EF":v==="WATCH"?"#FFF8ED":"#FFF0F0";
  const analysisLeft = Math.max(0,3-analysisCount);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#F0F2F5;font-family:'Outfit',sans-serif}
    input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:#E2E8F0;outline:none;cursor:pointer;width:100%}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#1B4FD8;cursor:pointer;box-shadow:0 2px 6px rgba(27,79,216,0.4)}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#CBD5E0;border-radius:4px}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    .card{transition:all 0.2s cubic-bezier(0.4,0,0.2,1);cursor:pointer}
    .card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,0.14)!important}
    .search-input:focus{outline:none;border-color:#1B4FD8;box-shadow:0 0 0 3px rgba(27,79,216,0.12)}
    .filter-btn:hover{background:#F1F5F9!important}
    .type-btn{transition:all 0.15s ease}
    .type-btn:hover{transform:translateY(-1px)}
  `;

  return (
    <div style={{minHeight:"100vh",background:"#F0F2F5",fontFamily:"'Outfit',sans-serif"}}>
      <style>{css}</style>

      {/* ── NAVBAR ── */}
      <div style={{background:"#0A1628",padding:"0 24px",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 20px rgba(0,0,0,0.3)"}}>
        <div style={{maxWidth:1220,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:66}}>
          
          {/* LOGO */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{position:"relative"}}>
              <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#1B4FD8 0%,#0EA5E9 100%)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(27,79,216,0.5)"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5L12 3L21 9.5V20C21 20.6 20.6 21 20 21H15V15H9V21H4C3.4 21 3 20.6 3 20V9.5Z" fill="white" opacity="0.9"/>
                  <path d="M9 21V15H15V21" fill="white"/>
                  <circle cx="18" cy="6" r="3" fill="#10B981"/>
                  <path d="M17 6L18 7L20 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
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

          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:8,padding:"5px 12px",fontSize:11,color:"#10B981",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#10B981",display:"inline-block",animation:"pulse 2s infinite"}}/>
              LIVE
            </div>
            <div style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"5px 12px",fontSize:11,color:"#94A3B8",fontWeight:600}}>
              🤖 {analysisLeft}/3 AI left today
            </div>
            <button onClick={()=>setAlertModal(true)} style={{background:"linear-gradient(135deg,#1B4FD8,#0EA5E9)",color:"#fff",border:"none",borderRadius:10,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 14px rgba(27,79,216,0.4)",fontFamily:"inherit"}}>
              🔔 Get Deal Alerts
            </button>
          </div>
        </div>
      </div>

      {/* ── HERO WITH SEARCH ── */}
      <div style={{background:"linear-gradient(135deg,#0A1628 0%,#0F2850 50%,#0A1628 100%)",padding:"32px 24px 0"}}>
        <div style={{maxWidth:1220,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <h1 style={{fontWeight:900,fontSize:28,color:"#fff",letterSpacing:-0.5,marginBottom:8}}>
              Find Mississauga Investment Deals{" "}
              <span style={{background:"linear-gradient(90deg,#38BDF8,#10B981)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Before Anyone Else</span>
            </h1>
            <p style={{color:"#64748B",fontSize:14}}>Every active MLS listing scored and analyzed by Claude AI · Powered by Hamza Nouman · Royal LePage Signature</p>
          </div>

          {/* SEARCH BAR */}
          <div style={{maxWidth:700,margin:"0 auto 0"}}>
            <div style={{display:"flex",gap:0,background:"#fff",borderRadius:14,padding:6,boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:10,padding:"8px 14px"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search address, neighbourhood, MLS #, or property type..."
                  value={searchInput}
                  onChange={e=>setSearchInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&setSearch(searchInput)}
                  style={{flex:1,border:"none",outline:"none",fontSize:14,color:"#0F172A",background:"transparent",fontFamily:"inherit"}}
                />
                {searchInput && (
                  <button onClick={()=>{setSearchInput("");setSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",fontSize:18,lineHeight:1,padding:"0 4px"}}>×</button>
                )}
              </div>
              <button
                onClick={()=>setSearch(searchInput)}
                style={{background:"linear-gradient(135deg,#1B4FD8,#0EA5E9)",color:"#fff",border:"none",borderRadius:10,padding:"12px 24px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:"0 4px 12px rgba(27,79,216,0.3)"}}>
                Search
              </button>
            </div>
          </div>

          {/* STATS ROW */}
          <div style={{display:"flex",justifyContent:"center",gap:32,marginTop:24,paddingBottom:24,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            {[
              {n:DATA.length,label:"Active Listings",icon:"🏘️"},
              {n:DATA.filter(l=>l.cashFlow>0).length,label:"Cash Flow+",icon:"✅"},
              {n:DATA.filter(l=>l.priceReduction>5).length,label:"Price Reduced 5%+",icon:"📉"},
              {n:DATA.filter(l=>l.dom>45).length,label:"Motivated Sellers",icon:"⏳"},
            ].map(s=>(
              <div key={s.label} style={{textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:900,color:"#38BDF8"}}>{s.n}</div>
                <div style={{fontSize:11,color:"#475569",fontWeight:500}}>{s.icon} {s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROPERTY TYPE TABS ── */}
      <div style={{background:"#0A1628",padding:"14px 24px",position:"sticky",top:66,zIndex:40,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{maxWidth:1220,margin:"0 auto",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {PROPERTY_TYPES.map(t=>{
            const active=filters.propertyType===t;
            return(
              <button key={t} className="type-btn" onClick={()=>setFilters(f=>({...f,propertyType:t}))}
                style={{background:active?"linear-gradient(135deg,#1B4FD8,#0EA5E9)":"rgba(255,255,255,0.05)",color:active?"#fff":"#64748B",border:`1px solid ${active?"transparent":"rgba(255,255,255,0.1)"}`,borderRadius:20,padding:"7px 16px",fontSize:12,fontWeight:active?700:500,cursor:"pointer",fontFamily:"inherit"}}>
                {t==="All Types"?"🏘️ All":t==="Detached"?"🏠 Detached":t==="Semi-Detached"?"🏡 Semi-Detached":t==="Townhouse"?"🏘️ Townhouse":"🏢 Condo"}
              </button>
            );
          })}
          <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
            <button className="filter-btn" onClick={()=>setFilterOpen(!filterOpen)}
              style={{display:"flex",alignItems:"center",gap:6,background:filterOpen?"rgba(27,79,216,0.3)":"rgba(255,255,255,0.05)",color:filterOpen?"#38BDF8":"#64748B",border:`1px solid ${filterOpen?"rgba(27,79,216,0.5)":"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              ⚙️ More Filters {filterOpen?"▲":"▼"}
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
            <span style={{fontSize:12,color:"#475569",fontWeight:600,whiteSpace:"nowrap"}}>
              <span style={{color:"#38BDF8",fontWeight:800}}>{results.length}</span> listings
            </span>
          </div>
        </div>

        {/* EXPANDED FILTERS */}
        {filterOpen&&(
          <div style={{maxWidth:1220,margin:"14px auto 0",background:"rgba(255,255,255,0.04)",borderRadius:14,border:"1px solid rgba(255,255,255,0.08)",padding:"20px",animation:"slideUp 0.2s ease"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:24,marginBottom:20}}>
              {[
                {label:"Min Price",key:"minPrice",min:300000,max:1400000,step:25000,display:fmtK(filters.minPrice)},
                {label:"Max Price",key:"maxPrice",min:300000,max:1400000,step:25000,display:fmtK(filters.maxPrice)},
                {label:"Min Yield",key:"minYield",min:0,max:6,step:0.5,display:`${filters.minYield.toFixed(1)}%`},
                {label:"Min Price Drop",key:"minPriceReduction",min:0,max:12,step:1,display:`${filters.minPriceReduction}%`},
                {label:"Max Days Listed",key:"maxDom",min:7,max:90,step:7,display:filters.maxDom===90?"Any":`${filters.maxDom}d`},
              ].map(f=>(
                <div key={f.key}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:8}}>
                    <span style={{color:"#64748B",fontWeight:600}}>{f.label}</span>
                    <span style={{color:"#38BDF8",fontWeight:700}}>{f.display}</span>
                  </div>
                  <input type="range" min={f.min} max={f.max} step={f.step} value={filters[f.key]} onChange={e=>setFilters(p=>({...p,[f.key]:+e.target.value}))}/>
                </div>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <button onClick={()=>setFilters(f=>({...f,cashFlowOnly:!f.cashFlowOnly}))}
                style={{background:filters.cashFlowOnly?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.05)",color:filters.cashFlowOnly?"#10B981":"#64748B",border:`1px solid ${filters.cashFlowOnly?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.1)"}`,borderRadius:20,padding:"7px 16px",fontSize:12,fontWeight:filters.cashFlowOnly?700:500,cursor:"pointer",fontFamily:"inherit"}}>
                ✅ Cash Flow+ Only
              </button>
              <button onClick={()=>setFilters({minPrice:400000,maxPrice:1400000,minYield:0,minPriceReduction:0,maxDom:90,cashFlowOnly:false,hoods:[],propertyType:"All Types",sort:filters.sort})}
                style={{fontSize:12,color:"#EF4444",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>
                Clear all
              </button>
            </div>
            <div style={{fontSize:11,color:"#475569",fontWeight:700,marginBottom:10,letterSpacing:1,textTransform:"uppercase"}}>Neighbourhood</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {HOODS.map(h=>{
                const on=filters.hoods.includes(h);
                const c=HOOD_COLORS[h]||{bg:"#E8F4F0",text:"#0E7A5A"};
                return(
                  <button key={h} onClick={()=>toggleHood(h)}
                    style={{background:on?c.bg:"rgba(255,255,255,0.05)",color:on?c.text:"#64748B",border:`1.5px solid ${on?c.text:"rgba(255,255,255,0.1)"}`,borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:on?700:400,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                    {on&&"✓ "}{h}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── QUICK FILTER CHIPS ── */}
      <div style={{background:"#fff",borderBottom:"1px solid #E8EDF4",padding:"10px 24px"}}>
        <div style={{maxWidth:1220,margin:"0 auto",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:11,color:"#94A3B8",fontWeight:600,marginRight:4}}>QUICK:</span>
          {[
            {label:"📉 Price Reduced",active:filters.minPriceReduction>=5,fn:()=>setFilters(f=>({...f,minPriceReduction:f.minPriceReduction>=5?0:5}))},
            {label:"⏳ Motivated Seller",active:filters.maxDom<=60,fn:()=>setFilters(f=>({...f,maxDom:f.maxDom<=60?90:60}))},
            {label:"💰 Under $800K",active:filters.maxPrice<=800000,fn:()=>setFilters(f=>({...f,maxPrice:f.maxPrice<=800000?1400000:800000}))},
            {label:"✅ Cash Flow+",active:filters.cashFlowOnly,fn:()=>setFilters(f=>({...f,cashFlowOnly:!f.cashFlowOnly}))},
            {label:"🏆 Score 7+",active:false,fn:()=>{}},
          ].map(c=>(
            <button key={c.label} onClick={c.fn}
              style={{background:c.active?"#EFF6FF":"#F8FAFC",color:c.active?"#1B4FD8":"#64748B",border:`1.5px solid ${c.active?"#1B4FD8":"#E2E8F0"}`,borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:c.active?700:500,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
              {c.label}
            </button>
          ))}
          {search&&(
            <div style={{marginLeft:"auto",background:"#FFF8ED",border:"1px solid #FDE68A",borderRadius:8,padding:"5px 12px",fontSize:12,color:"#92400E",display:"flex",alignItems:"center",gap:8}}>
              🔍 Searching: "{search}"
              <button onClick={()=>{setSearch("");setSearchInput("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#D97706",fontWeight:700,fontSize:14,padding:0}}>×</button>
            </div>
          )}
        </div>
      </div>

      {/* ── LISTING GRID ── */}
      <div style={{maxWidth:1220,margin:"0 auto",padding:"28px 24px"}}>
        {results.length===0?(
          <div style={{textAlign:"center",padding:"80px 0",background:"#fff",borderRadius:20}}>
            <div style={{fontSize:52}}>🔍</div>
            <div style={{fontSize:16,color:"#64748B",marginTop:12,fontWeight:600}}>No listings match your search</div>
            <button onClick={()=>{setSearch("");setSearchInput("");setFilters({minPrice:400000,maxPrice:1400000,minYield:0,minPriceReduction:0,maxDom:90,cashFlowOnly:false,hoods:[],propertyType:"All Types",sort:"score"});}}
              style={{marginTop:16,background:"#EFF6FF",color:"#1B4FD8",border:"none",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
              Clear All Filters
            </button>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",gap:20}}>
            {results.map((l,i)=>{
              const ai=analysis[l.id];
              const hp=HOOD_COLORS[l.neighbourhood]||{bg:"#E8F4F0",text:"#0E7A5A"};
              return(
                <div key={l.id} className="card"
                  onClick={()=>{setModal(l);if(!analysis[l.id]&&!loading[l.id])runAnalysis(l);}}
                  style={{background:"#fff",borderRadius:18,boxShadow:"0 2px 16px rgba(0,0,0,0.07)",overflow:"hidden",animation:`slideUp 0.3s ease ${i*0.025}s both`,border:"1px solid #F1F5F9"}}>
                  <div style={{height:110,background:`linear-gradient(135deg,${hp.bg} 0%,#F8FAFC 100%)`,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontSize:44}}>{TYPE_ICON[l.type]||"🏠"}</div>
                    <div style={{position:"absolute",top:10,left:10,display:"flex",gap:5,flexWrap:"wrap"}}>
                      {l.priceReduction>0&&<span style={{background:"#EF4444",color:"#fff",fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:6}}>▼ {l.priceReduction}% Off</span>}
                      {l.dom>45&&<span style={{background:"#F59E0B",color:"#fff",fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:6}}>{l.dom}d Listed</span>}
                    </div>
                    <div style={{position:"absolute",top:10,right:10,background:scoreBg(l.score),border:`2px solid ${scoreColor(l.score)}`,borderRadius:10,padding:"4px 10px",textAlign:"center"}}>
                      <div style={{fontSize:16,fontWeight:900,color:scoreColor(l.score),lineHeight:1}}>{l.score}</div>
                      <div style={{fontSize:8,color:scoreColor(l.score),fontWeight:700}}>SCORE</div>
                    </div>
                    {ai&&ai.verdict!=="ERROR"&&(
                      <div style={{position:"absolute",bottom:8,right:10,background:vBg(ai.verdict),border:`1.5px solid ${vColor(ai.verdict)}`,borderRadius:7,padding:"3px 10px",fontSize:10,fontWeight:800,color:vColor(ai.verdict)}}>
                        🤖 {ai.verdict}
                      </div>
                    )}
                  </div>
                  <div style={{padding:"14px 16px 16px"}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:4,lineHeight:1.3}}>{l.address}</div>
                    <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{background:hp.bg,color:hp.text,fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20}}>{l.neighbourhood}</span>
                      <span style={{color:"#94A3B8",fontSize:11}}>{l.type}</span>
                      <span style={{color:"#94A3B8",fontSize:11}}>#{l.id}</span>
                    </div>
                    <div style={{fontSize:22,fontWeight:900,color:"#0F172A",marginBottom:10}}>{fmtK(l.price)}</div>
                    <div style={{display:"flex",gap:12,fontSize:12,color:"#64748B",marginBottom:12}}>
                      <span>🛏 {l.bedrooms}</span><span>🚿 {l.bathrooms}</span><span>📐 {l.sqft.toLocaleString()}</span><span>📅 {l.dom}d</span>
                    </div>
                    <div style={{background:"#F8FAFC",borderRadius:10,padding:"10px 12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,border:"1px solid #F1F5F9"}}>
                      <div><div style={{fontSize:9,color:"#94A3B8",fontWeight:700,marginBottom:2,textTransform:"uppercase",letterSpacing:0.5}}>Cash Flow</div><div style={{fontSize:14,fontWeight:800,color:cfColor(l.cashFlow)}}>{l.cashFlow>=0?"+":""}{fmt(l.cashFlow)}</div></div>
                      <div><div style={{fontSize:9,color:"#94A3B8",fontWeight:700,marginBottom:2,textTransform:"uppercase",letterSpacing:0.5}}>Yield</div><div style={{fontSize:14,fontWeight:800,color:l.yield>4?"#16A865":l.yield>3?"#F5A623":"#64748B"}}>{l.yield.toFixed(2)}%</div></div>
                      <div><div style={{fontSize:9,color:"#94A3B8",fontWeight:700,marginBottom:2,textTransform:"uppercase",letterSpacing:0.5}}>Est Rent</div><div style={{fontSize:13,fontWeight:700}}>{fmt(l.estimatedRent)}/mo</div></div>
                      <div><div style={{fontSize:9,color:"#94A3B8",fontWeight:700,marginBottom:2,textTransform:"uppercase",letterSpacing:0.5}}>$/sqft</div><div style={{fontSize:13,fontWeight:700}}>${l.ppsf}</div></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {modal&&(()=>{
        const ai=analysis[modal.id];
        const ld=loading[modal.id];
        const hp=HOOD_COLORS[modal.neighbourhood]||{bg:"#E8F4F0",text:"#0E7A5A"};
        return(
          <div onClick={()=>setModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)"}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:580,maxHeight:"92vh",overflowY:"auto",animation:"slideUp 0.25s cubic-bezier(0.4,0,0.2,1)"}}>
              <div style={{padding:"10px 0 4px",display:"flex",justifyContent:"center"}}>
                <div style={{width:40,height:4,background:"#E2E8F0",borderRadius:2}}/>
              </div>
              <div style={{height:150,background:`linear-gradient(135deg,${hp.bg},#fff)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:64,position:"relative"}}>
                {TYPE_ICON[modal.type]||"🏠"}
                {modal.priceReduction>0&&<span style={{position:"absolute",top:14,left:14,background:"#EF4444",color:"#fff",fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:8}}>▼ {modal.priceReduction}% Price Reduction</span>}
                <span style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,0.1)",color:"#475569",fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:8}}>#{modal.id}</span>
              </div>
              <div style={{padding:"20px 24px 40px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div>
                    <div style={{fontSize:20,fontWeight:800,color:"#0F172A",marginBottom:5}}>{modal.address}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <span style={{background:hp.bg,color:hp.text,fontSize:12,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{modal.neighbourhood}</span>
                      <span style={{color:"#94A3B8",fontSize:12}}>{modal.type}</span>
                    </div>
                  </div>
                  <div style={{background:scoreBg(modal.score),border:`2px solid ${scoreColor(modal.score)}`,borderRadius:12,padding:"8px 14px",textAlign:"center",flexShrink:0}}>
                    <div style={{fontSize:26,fontWeight:900,color:scoreColor(modal.score),lineHeight:1}}>{modal.score}</div>
                    <div style={{fontSize:9,color:scoreColor(modal.score),fontWeight:700,textTransform:"uppercase"}}>Deal Score</div>
                  </div>
                </div>
                <div style={{fontSize:30,fontWeight:900,color:"#0F172A",marginBottom:6}}>{fmt(modal.price)}</div>
                <div style={{display:"flex",gap:14,fontSize:13,color:"#64748B",marginBottom:20,flexWrap:"wrap"}}>
                  <span>🛏 {modal.bedrooms} bed</span><span>🚿 {modal.bathrooms} bath</span><span>📐 {modal.sqft.toLocaleString()} sqft</span><span>📅 {modal.dom} days</span><span>🏗 {modal.yearBuilt}</span>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Investment Breakdown</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
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
                      <div style={{fontSize:15,fontWeight:700,color:r.c||"#0F172A"}}>{r.v}</div>
                    </div>
                  ))}
                </div>

                {/* AI SECTION */}
                <div style={{background:"linear-gradient(135deg,#EFF6FF,#F0FDF4)",border:"1.5px solid #BFDBFE",borderRadius:16,padding:"18px",marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                    <div style={{fontSize:24}}>🤖</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:800,color:"#1E40AF"}}>Claude AI Investment Analysis</div>
                      <div style={{fontSize:11,color:"#64748B"}}>{analysisLeft>0?`${analysisLeft} free analyses remaining today`:"Daily limit reached — register for unlimited access"}</div>
                    </div>
                  </div>
                  {!ai&&!ld&&analysisLeft>0&&(
                    <button onClick={()=>runAnalysis(modal)} style={{width:"100%",background:"linear-gradient(135deg,#1B4FD8,#0EA5E9)",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(27,79,216,0.35)"}}>
                      ✨ Analyze This Property with Claude AI
                    </button>
                  )}
                  {!ai&&!ld&&analysisLeft<=0&&(
                    <div style={{textAlign:"center",padding:"10px 0"}}>
                      <div style={{fontSize:13,color:"#64748B",marginBottom:12}}>You've used your 3 free analyses today.</div>
                      <button onClick={()=>{setModal(null);setAlertModal(true);}} style={{width:"100%",background:"linear-gradient(135deg,#1B4FD8,#0EA5E9)",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                        Register for Unlimited Access → Call Hamza
                      </button>
                    </div>
                  )}
                  {ld&&(
                    <div style={{textAlign:"center",padding:"20px 0"}}>
                      <div style={{width:32,height:32,border:"3px solid #BFDBFE",borderTop:"3px solid #1B4FD8",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/>
                      <div style={{fontSize:13,color:"#3B82F6",fontWeight:600}}>Analyzing {modal.neighbourhood} market data...</div>
                    </div>
                  )}
                  {ai&&ai.verdict!=="ERROR"&&(
                    <div style={{animation:"fadeIn 0.4s ease"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"12px 14px",background:vBg(ai.verdict),borderRadius:10,border:`1.5px solid ${vColor(ai.verdict)}`}}>
                        <div style={{fontSize:26,fontWeight:900,color:vColor(ai.verdict)}}>{ai.verdict}</div>
                        <div style={{fontSize:13,color:vColor(ai.verdict),fontWeight:600,lineHeight:1.4}}>{ai.verdictReason}</div>
                      </div>
                      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
                        {[{l:"Rental",v:ai.rentalOutlook},{l:"Motivation",v:ai.motivationSignal},{l:"Best For",v:ai.bestFor}].map(t=>(
                          <div key={t.l} style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:8,padding:"5px 10px",fontSize:11}}>
                            <span style={{color:"#94A3B8"}}>{t.l}: </span><span style={{color:"#1E40AF",fontWeight:700}}>{t.v}</span>
                          </div>
                        ))}
                      </div>
                      {ai.highlights?.length>0&&(
                        <div style={{marginBottom:10}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#16A865",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>✅ Highlights</div>
                          {ai.highlights.map((h,i)=><div key={i} style={{fontSize:13,color:"#334155",padding:"5px 0",borderBottom:i<ai.highlights.length-1?"1px solid #F1F5F9":"none"}}>· {h}</div>)}
                        </div>
                      )}
                      {ai.risks?.length>0&&(
                        <div style={{marginBottom:14}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#EF4444",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>⚠️ Risks</div>
                          {ai.risks.map((r,i)=><div key={i} style={{fontSize:13,color:"#334155",padding:"5px 0",borderBottom:i<ai.risks.length-1?"1px solid #F1F5F9":"none"}}>· {r}</div>)}
                        </div>
                      )}
                      {ai.hamzaNote&&(
                        <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"12px 14px",display:"flex",gap:10}}>
                          <div style={{fontSize:20,flexShrink:0}}>👤</div>
                          <div>
                            <div style={{fontSize:11,fontWeight:700,color:"#92400E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Hamza's Local Insight</div>
                            <div style={{fontSize:13,color:"#78350F",lineHeight:1.5}}>{ai.hamzaNote}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={()=>{setModal(null);setAlertModal(true);}} style={{width:"100%",background:"linear-gradient(135deg,#0A1628,#1B4FD8)",color:"#fff",border:"none",borderRadius:14,padding:"15px",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 16px rgba(10,22,40,0.3)",fontFamily:"inherit"}}>
                  🔔 Alert Me When Similar Deals Hit
                </button>
                <div style={{textAlign:"center",marginTop:14,fontSize:12,color:"#CBD5E0"}}>
                  Hamza Nouman · Royal LePage Signature Realty · 647-609-1289
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── LEAD CAPTURE MODAL ── */}
      {alertModal&&(
        <div onClick={()=>!submitted&&setAlertModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)",animation:"fadeIn 0.2s ease"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:"36px 30px",maxWidth:420,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.25)"}}>
            {!submitted?(
              <>
                <div style={{fontSize:44,textAlign:"center",marginBottom:10}}>🔔</div>
                <div style={{fontSize:22,fontWeight:900,color:"#0F172A",textAlign:"center",marginBottom:6}}>Get Deal Alerts</div>
                <p style={{fontSize:13,color:"#64748B",textAlign:"center",lineHeight:1.7,marginBottom:24}}>
                  Register for <strong>unlimited AI analyses</strong> and instant WhatsApp alerts when new Mississauga investment deals match your criteria.
                </p>
                {[
                  {k:"name",l:"Full Name",p:"Your full name",req:true},
                  {k:"phone",l:"Phone / WhatsApp",p:"+1 (647) 000-0000",req:true},
                  {k:"email",l:"Email (optional)",p:"your@email.com",req:false},
                ].map(f=>(
                  <div key={f.k} style={{marginBottom:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#475569",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>{f.l}{f.req&&<span style={{color:"#EF4444"}}> *</span>}</div>
                    <input type="text" placeholder={f.p} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}
                      style={{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",fontFamily:"inherit",color:"#0F172A",transition:"border-color 0.15s"}}/>
                  </div>
                ))}
                <button onClick={()=>{if(form.name&&form.phone)setSubmitted(true);}} disabled={!form.name||!form.phone}
                  style={{width:"100%",background:form.name&&form.phone?"linear-gradient(135deg,#0A1628,#1B4FD8)":"#E2E8F0",color:form.name&&form.phone?"#fff":"#94A3B8",border:"none",borderRadius:12,padding:"15px",fontWeight:700,fontSize:15,cursor:form.name&&form.phone?"pointer":"not-allowed",fontFamily:"inherit",boxShadow:form.name&&form.phone?"0 4px 16px rgba(27,79,216,0.3)":"none"}}>
                  Unlock Unlimited Access
                </button>
                <div style={{fontSize:11,color:"#CBD5E0",textAlign:"center",marginTop:14,lineHeight:1.6}}>
                  Hamza Nouman · Royal LePage Signature<br/>Your info is never shared or sold.
                </div>
              </>
            ):(
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:60,marginBottom:14}}>✅</div>
                <div style={{fontSize:22,fontWeight:900,color:"#16A865",marginBottom:8}}>You're registered!</div>
                <p style={{fontSize:14,color:"#64748B",lineHeight:1.7,marginBottom:24}}>Hamza will reach out on WhatsApp shortly. You now have unlimited AI analyses.</p>
                <button onClick={()=>{setAlertModal(false);setSubmitted(false);setAnalysisCount(0);try{localStorage.setItem("analysisCount","0");}catch{}}}
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
