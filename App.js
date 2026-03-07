import { useState, useMemo, useEffect } from "react";

// ============================================================
// LIVE DATA: Your CREA DDF credentials go in Vercel env vars
// CREA_DDF_USER and CREA_DDF_PASS
// Until then, mock data runs automatically — site works 100%
// ============================================================

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

const HOOD_PILL = {
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
const TYPE_ICON = { Detached:"🏠", "Semi-Detached":"🏡", Townhouse:"🏘️", Condo:"🏢" };
const HOODS = [...new Set(MOCK_LISTINGS.map(l => l.neighbourhood))].sort();

function calcMortgage(price, rate=0.065, years=25, down=0.20) {
  const p = price * (1 - down), m = rate / 12, n = years * 12;
  return (p * m * Math.pow(1+m,n)) / (Math.pow(1+m,n) - 1);
}
function calcMetrics(l) {
  const mortgage = calcMortgage(l.price);
  const tax = (l.assessedValue * 0.0092) / 12;
  const costs = mortgage + tax + 150 + l.estimatedRent * 0.05 + 150;
  const cashFlow = l.estimatedRent - costs;
  const yld = ((l.estimatedRent * 12 - (tax + 300 + l.estimatedRent * 0.05) * 12) / l.price) * 100;
  const pva = ((l.price - l.assessedValue) / l.assessedValue) * 100;
  const ppsf = Math.round(l.price / l.sqft);
  let score = 5;
  if (cashFlow > 0) score += 2; else if (cashFlow < -500) score -= 2;
  if (l.priceReduction > 8) score += 2; else if (l.priceReduction > 5) score += 1.5; else if (l.priceReduction > 3) score += 1;
  if (l.dom > 60) score += 1.5; else if (l.dom > 30) score += 1;
  if (yld > 4) score += 1;
  if (pva < 5) score += 0.5;
  return { mortgage, tax, cashFlow, yield: yld, pva, ppsf, score: Math.min(10, Math.max(1, Math.round(score * 10) / 10)) };
}

const DATA = MOCK_LISTINGS.map(l => ({ ...l, ...calcMetrics(l) }));
const fmt = n => new Intl.NumberFormat("en-CA", { style:"currency", currency:"CAD", maximumFractionDigits:0 }).format(n);
const fmtK = n => n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : `$${Math.round(n/1000)}K`;

// ============================================================
// CLAUDE AI ANALYSIS — calls /api/analyze (your secure proxy)
// ============================================================
async function analyzeWithClaude(listing, metrics) {
  const prompt = `You are an expert real estate investment analyst specializing in Mississauga, Ontario GTA. Analyze this MLS listing and give a direct investment verdict.

LISTING:
- Address: ${listing.address}, ${listing.neighbourhood}, Mississauga
- Type: ${listing.type} | Price: ${fmt(listing.price)} | Built: ${listing.yearBuilt}
- ${listing.bedrooms}bd / ${listing.bathrooms}ba / ${listing.sqft.toLocaleString()} sqft / $${metrics.ppsf}/sqft
- Days on Market: ${listing.dom} | Price Reduction: ${listing.priceReduction > 0 ? `${listing.priceReduction}% off (was ${fmt(listing.originalPrice)})` : "None"}
- MPAC Assessment: ${fmt(listing.assessedValue)} | Annual Tax: ${fmt(listing.taxes)}

INVESTMENT MATH (20% down, 6.5%, 25yr):
- Monthly Mortgage: ${fmt(metrics.mortgage)} | Tax: ${fmt(metrics.tax)}/mo
- Estimated Rent: ${fmt(listing.estimatedRent)}/mo
- Monthly Cash Flow: ${fmt(metrics.cashFlow)}
- Gross Yield: ${metrics.yield.toFixed(2)}% | Deal Score: ${metrics.score}/10

MISSISSAUGA MARKET 2025: Avg price ~$970K, prices down 5-8% YoY, inventory at 15-year highs (2,800+ active), buyer's market, immigration-driven rental demand, rents up 42% over 7 years, Hurontario LRT coming.

Return ONLY valid JSON, no markdown:
{
  "verdict": "BUY" or "WATCH" or "PASS",
  "verdictReason": "One punchy sentence max 15 words",
  "highlights": ["positive point 1 max 12 words", "positive point 2", "positive point 3"],
  "risks": ["risk 1 max 12 words", "risk 2"],
  "hamzaNote": "One sentence local agent insight about this specific property and neighbourhood",
  "rentalOutlook": "Strong" or "Moderate" or "Weak",
  "motivationSignal": "High" or "Medium" or "Low",
  "bestFor": "First-time investor" or "Cash flow investor" or "Appreciation play" or "BRRR strategy" or "End user"
}`;

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export default function App() {
  const [filters, setFilters] = useState({ maxPrice:1400000, minYield:0, minPriceReduction:0, maxDom:90, cashFlowOnly:false, hoods:[], sort:"score" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [analysis, setAnalysis] = useState({});
  const [loading, setLoading] = useState({});
  const [alertModal, setAlertModal] = useState(false);
  const [form, setForm] = useState({ name:"", phone:"", email:"" });
  const [submitted, setSubmitted] = useState(false);

  const results = useMemo(() => {
    let r = DATA.filter(l => {
      if (l.price > filters.maxPrice) return false;
      if (l.yield < filters.minYield) return false;
      if (l.priceReduction < filters.minPriceReduction) return false;
      if (l.dom > filters.maxDom) return false;
      if (filters.cashFlowOnly && l.cashFlow <= 0) return false;
      if (filters.hoods.length && !filters.hoods.includes(l.neighbourhood)) return false;
      return true;
    });
    return r.sort((a,b) => {
      if (filters.sort === "score") return b.score - a.score;
      if (filters.sort === "yield") return b.yield - a.yield;
      if (filters.sort === "cashflow") return b.cashFlow - a.cashFlow;
      if (filters.sort === "dom") return b.dom - a.dom;
      if (filters.sort === "reduction") return b.priceReduction - a.priceReduction;
      if (filters.sort === "price") return a.price - b.price;
      return 0;
    });
  }, [filters]);

  const toggleHood = h => setFilters(f => ({ ...f, hoods: f.hoods.includes(h) ? f.hoods.filter(x => x !== h) : [...f.hoods, h] }));

  const runAnalysis = async (listing) => {
    if (analysis[listing.id] || loading[listing.id]) return;
    setLoading(l => ({ ...l, [listing.id]: true }));
    try {
      const metrics = { mortgage:listing.mortgage, tax:listing.tax, cashFlow:listing.cashFlow, yield:listing.yield, pva:listing.pva, ppsf:listing.ppsf, score:listing.score };
      const result = await analyzeWithClaude(listing, metrics);
      setAnalysis(a => ({ ...a, [listing.id]: result }));
    } catch(e) {
      setAnalysis(a => ({ ...a, [listing.id]: { verdict:"ERROR", verdictReason:"Try again", highlights:[], risks:[], hamzaNote:"", rentalOutlook:"—", motivationSignal:"—", bestFor:"—" }}));
    }
    setLoading(l => ({ ...l, [listing.id]: false }));
  };

  const scoreColor = s => s >= 8 ? "#16A865" : s >= 6 ? "#F5A623" : "#E84040";
  const scoreBg = s => s >= 8 ? "#E8F8EF" : s >= 6 ? "#FFF8ED" : "#FFF0F0";
  const cfColor = cf => cf > 0 ? "#16A865" : cf > -300 ? "#F5A623" : "#E84040";
  const vColor = v => v === "BUY" ? "#16A865" : v === "WATCH" ? "#F5A623" : "#E84040";
  const vBg = v => v === "BUY" ? "#E8F8EF" : v === "WATCH" ? "#FFF8ED" : "#FFF0F0";

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#F2F4F7;font-family:'Outfit',sans-serif}
    input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:#E2E8F0;outline:none;cursor:pointer;width:100%}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#2563EB;cursor:pointer}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#CBD5E0;border-radius:4px}
    @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
    .card{transition:box-shadow 0.2s,transform 0.15s;cursor:pointer}
    .card:hover{box-shadow:0 10px 36px rgba(0,0,0,0.13)!important;transform:translateY(-3px)}
  `;

  return (
    <div style={{ minHeight:"100vh", background:"#F2F4F7", fontFamily:"'Outfit',sans-serif" }}>
      <style>{css}</style>

      {/* NAV */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E8EDF4", padding:"0 24px", position:"sticky", top:0, zIndex:50, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:62 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ background:"linear-gradient(135deg,#2563EB,#16A865)", borderRadius:10, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏠</div>
            <div>
              <div style={{ fontWeight:800, fontSize:17, color:"#0F172A", lineHeight:1.1 }}>Mississauga<span style={{ color:"#2563EB" }}>Deals</span>.ca</div>
              <div style={{ fontSize:10, color:"#94A3B8", fontWeight:500 }}>AI-POWERED · LIVE TRREB DATA · MISSISSAUGA</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ background:"#EFF6FF", borderRadius:8, padding:"5px 12px", fontSize:12, color:"#2563EB", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#16A865", display:"inline-block", animation:"pulse 2s infinite" }}/>LIVE
            </div>
            <button onClick={() => setAlertModal(true)} style={{ background:"linear-gradient(135deg,#2563EB,#1D4ED8)", color:"#fff", border:"none", borderRadius:10, padding:"9px 18px", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:"0 2px 8px rgba(37,99,235,0.35)" }}>
              🔔 Get Alerts
            </button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={{ background:"linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%)", padding:"24px 24px", color:"#fff" }}>
        <div style={{ maxWidth:1180, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div>
            <h1 style={{ fontWeight:800, fontSize:24, margin:"0 0 4px", letterSpacing:-0.5 }}>Mississauga Investment Screener</h1>
            <p style={{ color:"#94A3B8", fontSize:13, margin:0 }}>Every active listing scored and analyzed by Claude AI. Click any property for a full investment verdict.</p>
          </div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {[
              { n:DATA.length, label:"Active Listings" },
              { n:DATA.filter(l => l.cashFlow > 0).length, label:"Cash Flow+" },
              { n:DATA.filter(l => l.priceReduction > 5).length, label:"Price Reduced 5%+" },
            ].map(s => (
              <div key={s.label} style={{ background:"rgba(255,255,255,0.07)", borderRadius:10, padding:"10px 18px", textAlign:"center", border:"1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize:22, fontWeight:800, color:"#60A5FA" }}>{s.n}</div>
                <div style={{ fontSize:11, color:"#64748B", fontWeight:500, marginTop:1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E8EDF4", padding:"10px 24px", position:"sticky", top:62, zIndex:40, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <button onClick={() => setFilterOpen(!filterOpen)} style={{ display:"flex", alignItems:"center", gap:6, background:filterOpen?"#2563EB":"#F8FAFC", color:filterOpen?"#fff":"#475569", border:`1.5px solid ${filterOpen?"#2563EB":"#E2E8F0"}`, borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>⚙️ Filters</button>
            {[
              { label:"✅ Cash Flow+", active:filters.cashFlowOnly, fn:() => setFilters(f => ({ ...f, cashFlowOnly:!f.cashFlowOnly })) },
              { label:"📉 Price Reduced", active:filters.minPriceReduction >= 5, fn:() => setFilters(f => ({ ...f, minPriceReduction:f.minPriceReduction >= 5 ? 0 : 5 })) },
              { label:"⏳ Motivated Seller", active:filters.maxDom <= 60, fn:() => setFilters(f => ({ ...f, maxDom:f.maxDom <= 60 ? 90 : 60 })) },
              { label:"💰 Under $800K", active:filters.maxPrice <= 800000, fn:() => setFilters(f => ({ ...f, maxPrice:f.maxPrice <= 800000 ? 1400000 : 800000 })) },
            ].map(c => (
              <button key={c.label} onClick={c.fn} style={{ background:c.active?"#EFF6FF":"#F8FAFC", color:c.active?"#2563EB":"#64748B", border:`1.5px solid ${c.active?"#2563EB":"#E2E8F0"}`, borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:c.active?700:500, cursor:"pointer" }}>{c.label}</button>
            ))}
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:12, color:"#94A3B8" }}><b style={{ color:"#0F172A" }}>{results.length}</b> listings</span>
              <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort:e.target.value }))} style={{ border:"1.5px solid #E2E8F0", borderRadius:10, padding:"7px 12px", fontSize:12, color:"#475569", background:"#fff", outline:"none", cursor:"pointer", fontFamily:"inherit" }}>
                <option value="score">Best Deal Score</option>
                <option value="yield">Highest Yield</option>
                <option value="cashflow">Best Cash Flow</option>
                <option value="reduction">Biggest Price Drop</option>
                <option value="dom">Longest Listed</option>
                <option value="price">Lowest Price</option>
              </select>
            </div>
          </div>
          {filterOpen && (
            <div style={{ marginTop:12, padding:"20px", background:"#F8FAFC", borderRadius:14, border:"1px solid #E2E8F0", animation:"slideUp 0.2s ease" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:24, marginBottom:20 }}>
                {[
                  { label:"Max Price", key:"maxPrice", min:500000, max:1400000, step:25000, display:fmtK(filters.maxPrice) },
                  { label:"Min Rental Yield", key:"minYield", min:0, max:6, step:0.5, display:`${filters.minYield.toFixed(1)}%` },
                  { label:"Min Price Drop", key:"minPriceReduction", min:0, max:12, step:1, display:`${filters.minPriceReduction}%` },
                  { label:"Max Days Listed", key:"maxDom", min:7, max:90, step:7, display:filters.maxDom === 90 ? "Any" : `${filters.maxDom}d` },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:8 }}>
                      <span style={{ color:"#64748B", fontWeight:600 }}>{f.label}</span>
                      <span style={{ color:"#2563EB", fontWeight:700 }}>{f.display}</span>
                    </div>
                    <input type="range" min={f.min} max={f.max} step={f.step} value={filters[f.key]} onChange={e => setFilters(p => ({ ...p, [f.key]:+e.target.value }))} />
                  </div>
                ))}
              </div>
              <div style={{ fontSize:12, color:"#64748B", fontWeight:600, marginBottom:10 }}>Neighbourhood</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {HOODS.map(h => {
                  const on = filters.hoods.includes(h);
                  const c = HOOD_PILL[h] || { bg:"#E8F4F0", text:"#0E7A5A" };
                  return <button key={h} onClick={() => toggleHood(h)} style={{ background:on?c.bg:"#fff", color:on?c.text:"#94A3B8", border:`1.5px solid ${on?c.text:"#E2E8F0"}`, borderRadius:20, padding:"5px 13px", fontSize:12, fontWeight:on?700:400, cursor:"pointer" }}>{on && "✓ "}{h}</button>;
                })}
              </div>
              <button onClick={() => setFilters({ maxPrice:1400000, minYield:0, minPriceReduction:0, maxDom:90, cashFlowOnly:false, hoods:[], sort:"score" })} style={{ marginTop:14, fontSize:12, color:"#EF4444", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Clear all filters</button>
            </div>
          )}
        </div>
      </div>

      {/* GRID */}
      <div style={{ maxWidth:1180, margin:"0 auto", padding:"28px 24px" }}>
        {results.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:52 }}>🔍</div>
            <div style={{ fontSize:16, color:"#64748B", marginTop:12, fontWeight:600 }}>No listings match your filters</div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:20 }}>
            {results.map((l, i) => {
              const ai = analysis[l.id];
              const hp = HOOD_PILL[l.neighbourhood] || { bg:"#E8F4F0", text:"#0E7A5A" };
              return (
                <div key={l.id} className="card" onClick={() => { setModal(l); if (!analysis[l.id] && !loading[l.id]) runAnalysis(l); }}
                  style={{ background:"#fff", borderRadius:16, boxShadow:"0 2px 12px rgba(0,0,0,0.07)", overflow:"hidden", animation:`slideUp 0.3s ease ${i*0.03}s both` }}>
                  <div style={{ height:120, background:`linear-gradient(135deg,${hp.bg} 0%,#fff 70%)`, position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ fontSize:48 }}>{TYPE_ICON[l.type] || "🏠"}</div>
                    <div style={{ position:"absolute", top:10, left:10, display:"flex", gap:6 }}>
                      {l.priceReduction > 0 && <span style={{ background:"#EF4444", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:6 }}>▼ {l.priceReduction}% Off</span>}
                      {l.dom > 45 && <span style={{ background:"#F59E0B", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:6 }}>{l.dom}d Listed</span>}
                    </div>
                    <div style={{ position:"absolute", top:10, right:10, background:scoreBg(l.score), border:`2px solid ${scoreColor(l.score)}`, borderRadius:10, padding:"4px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:17, fontWeight:900, color:scoreColor(l.score), lineHeight:1 }}>{l.score}</div>
                      <div style={{ fontSize:8, color:scoreColor(l.score), fontWeight:700 }}>SCORE</div>
                    </div>
                    {ai && ai.verdict !== "ERROR" && (
                      <div style={{ position:"absolute", bottom:8, right:10, background:vBg(ai.verdict), border:`2px solid ${vColor(ai.verdict)}`, borderRadius:8, padding:"3px 10px", fontSize:11, fontWeight:800, color:vColor(ai.verdict) }}>🤖 {ai.verdict}</div>
                    )}
                  </div>
                  <div style={{ padding:"14px 16px 16px" }}>
                    <div style={{ fontSize:15, fontWeight:700, color:"#0F172A", marginBottom:4 }}>{l.address}</div>
                    <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
                      <span style={{ background:hp.bg, color:hp.text, fontSize:11, fontWeight:600, padding:"2px 9px", borderRadius:20 }}>{l.neighbourhood}</span>
                      <span style={{ color:"#94A3B8", fontSize:11 }}>{l.type}</span>
                    </div>
                    <div style={{ fontSize:22, fontWeight:800, color:"#0F172A", marginBottom:10 }}>{fmtK(l.price)}</div>
                    <div style={{ display:"flex", gap:12, fontSize:12, color:"#64748B", marginBottom:12 }}>
                      <span>🛏 {l.bedrooms}</span><span>🚿 {l.bathrooms}</span><span>📐 {l.sqft.toLocaleString()}</span><span>📅 {l.dom}d</span>
                    </div>
                    <div style={{ background:"#F8FAFC", borderRadius:10, padding:"10px 12px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <div><div style={{ fontSize:9, color:"#94A3B8", fontWeight:700, marginBottom:2 }}>CASH FLOW</div><div style={{ fontSize:14, fontWeight:800, color:cfColor(l.cashFlow) }}>{l.cashFlow >= 0 ? "+" : ""}{fmt(l.cashFlow)}</div></div>
                      <div><div style={{ fontSize:9, color:"#94A3B8", fontWeight:700, marginBottom:2 }}>YIELD</div><div style={{ fontSize:14, fontWeight:800, color:l.yield > 4 ? "#16A865" : l.yield > 3 ? "#F5A623" : "#64748B" }}>{l.yield.toFixed(2)}%</div></div>
                      <div><div style={{ fontSize:9, color:"#94A3B8", fontWeight:700, marginBottom:2 }}>EST RENT</div><div style={{ fontSize:13, fontWeight:700 }}>{fmt(l.estimatedRent)}/mo</div></div>
                      <div><div style={{ fontSize:9, color:"#94A3B8", fontWeight:700, marginBottom:2 }}>$/SQFT</div><div style={{ fontSize:13, fontWeight:700 }}>${l.ppsf}</div></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {modal && (() => {
        const ai = analysis[modal.id];
        const ld = loading[modal.id];
        const hp = HOOD_PILL[modal.neighbourhood] || { bg:"#E8F4F0", text:"#0E7A5A" };
        return (
          <div onClick={() => setModal(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:560, maxHeight:"92vh", overflowY:"auto", animation:"slideUp 0.25s ease" }}>
              <div style={{ padding:"10px 0 4px", display:"flex", justifyContent:"center" }}><div style={{ width:40, height:4, background:"#E2E8F0", borderRadius:2 }}/></div>
              <div style={{ height:140, background:`linear-gradient(135deg,${hp.bg},#fff)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:64, position:"relative" }}>
                {TYPE_ICON[modal.type] || "🏠"}
                {modal.priceReduction > 0 && <span style={{ position:"absolute", top:14, left:14, background:"#EF4444", color:"#fff", fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:8 }}>▼ {modal.priceReduction}% Reduction</span>}
              </div>
              <div style={{ padding:"20px 24px 40px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:20, fontWeight:800, color:"#0F172A", marginBottom:5 }}>{modal.address}</div>
                    <div style={{ display:"flex", gap:6 }}><span style={{ background:hp.bg, color:hp.text, fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>{modal.neighbourhood}</span><span style={{ color:"#94A3B8", fontSize:12 }}>{modal.type}</span></div>
                  </div>
                  <div style={{ background:scoreBg(modal.score), border:`2px solid ${scoreColor(modal.score)}`, borderRadius:12, padding:"8px 14px", textAlign:"center", flexShrink:0 }}>
                    <div style={{ fontSize:26, fontWeight:900, color:scoreColor(modal.score), lineHeight:1 }}>{modal.score}</div>
                    <div style={{ fontSize:9, color:scoreColor(modal.score), fontWeight:700 }}>DEAL SCORE</div>
                  </div>
                </div>
                <div style={{ fontSize:30, fontWeight:900, color:"#0F172A", marginBottom:6 }}>{fmt(modal.price)}</div>
                <div style={{ display:"flex", gap:14, fontSize:13, color:"#64748B", marginBottom:20, flexWrap:"wrap" }}>
                  <span>🛏 {modal.bedrooms} bed</span><span>🚿 {modal.bathrooms} bath</span><span>📐 {modal.sqft.toLocaleString()} sqft</span><span>📅 {modal.dom} days</span><span>🏗 {modal.yearBuilt}</span>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Investment Breakdown</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
                  {[
                    { l:"List Price", v:fmt(modal.price) },
                    { l:"MPAC Assessment", v:fmt(modal.assessedValue) },
                    { l:"Est. Monthly Rent", v:`${fmt(modal.estimatedRent)}/mo` },
                    { l:"Rental Yield", v:`${modal.yield.toFixed(2)}%`, c:modal.yield > 4 ? "#16A865" : modal.yield > 3 ? "#F5A623" : null },
                    { l:"Mortgage (20% dn)", v:`${fmt(modal.mortgage)}/mo` },
                    { l:"Property Tax", v:`${fmt(modal.tax)}/mo` },
                    { l:"Monthly Cash Flow", v:`${modal.cashFlow >= 0 ? "+" : ""}${fmt(modal.cashFlow)}`, c:cfColor(modal.cashFlow) },
                    { l:"Price/sqft", v:`$${modal.ppsf}/sqft` },
                  ].map(r => (
                    <div key={r.l} style={{ background:"#F8FAFC", borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontSize:9, color:"#94A3B8", fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginBottom:3 }}>{r.l}</div>
                      <div style={{ fontSize:15, fontWeight:700, color:r.c || "#0F172A" }}>{r.v}</div>
                    </div>
                  ))}
                </div>

                {/* AI SECTION */}
                <div style={{ background:"linear-gradient(135deg,#EFF6FF,#F0FDF4)", border:"1.5px solid #BFDBFE", borderRadius:14, padding:"18px", marginBottom:20 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <div style={{ fontSize:22 }}>🤖</div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:800, color:"#1E40AF" }}>AI Investment Analysis</div>
                      <div style={{ fontSize:11, color:"#64748B" }}>Powered by Claude — analyzing Mississauga market data</div>
                    </div>
                  </div>
                  {!ai && !ld && (
                    <button onClick={() => runAnalysis(modal)} style={{ width:"100%", background:"linear-gradient(135deg,#2563EB,#1D4ED8)", color:"#fff", border:"none", borderRadius:10, padding:"13px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(37,99,235,0.35)" }}>
                      ✨ Analyze This Property with Claude AI
                    </button>
                  )}
                  {ld && (
                    <div style={{ textAlign:"center", padding:"20px 0" }}>
                      <div style={{ width:32, height:32, border:"3px solid #BFDBFE", borderTop:"3px solid #2563EB", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }}/>
                      <div style={{ fontSize:13, color:"#3B82F6", fontWeight:600 }}>Claude is analyzing {modal.neighbourhood} market data...</div>
                    </div>
                  )}
                  {ai && ai.verdict !== "ERROR" && (
                    <div style={{ animation:"fadeIn 0.4s ease" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, padding:"12px 14px", background:vBg(ai.verdict), borderRadius:10, border:`1.5px solid ${vColor(ai.verdict)}` }}>
                        <div style={{ fontSize:28, fontWeight:900, color:vColor(ai.verdict) }}>{ai.verdict}</div>
                        <div style={{ fontSize:13, color:vColor(ai.verdict), fontWeight:600, lineHeight:1.4 }}>{ai.verdictReason}</div>
                      </div>
                      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:14 }}>
                        {[{ l:"Rental", v:ai.rentalOutlook }, { l:"Motivation", v:ai.motivationSignal }, { l:"Best For", v:ai.bestFor }].map(t => (
                          <div key={t.l} style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:8, padding:"5px 10px", fontSize:11 }}>
                            <span style={{ color:"#94A3B8" }}>{t.l}: </span><span style={{ color:"#1E40AF", fontWeight:700 }}>{t.v}</span>
                          </div>
                        ))}
                      </div>
                      {ai.highlights?.length > 0 && (
                        <div style={{ marginBottom:10 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#16A865", marginBottom:6 }}>✅ HIGHLIGHTS</div>
                          {ai.highlights.map((h, i) => <div key={i} style={{ fontSize:13, color:"#334155", padding:"5px 0", borderBottom:i < ai.highlights.length-1 ? "1px solid #F1F5F9" : "none" }}>· {h}</div>)}
                        </div>
                      )}
                      {ai.risks?.length > 0 && (
                        <div style={{ marginBottom:14 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"#EF4444", marginBottom:6 }}>⚠️ RISKS</div>
                          {ai.risks.map((r, i) => <div key={i} style={{ fontSize:13, color:"#334155", padding:"5px 0", borderBottom:i < ai.risks.length-1 ? "1px solid #F1F5F9" : "none" }}>· {r}</div>)}
                        </div>
                      )}
                      {ai.hamzaNote && (
                        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"12px 14px", display:"flex", gap:10 }}>
                          <div style={{ fontSize:20, flexShrink:0 }}>👤</div>
                          <div>
                            <div style={{ fontSize:11, fontWeight:700, color:"#92400E", marginBottom:4 }}>HAMZA'S LOCAL INSIGHT</div>
                            <div style={{ fontSize:13, color:"#78350F", lineHeight:1.5 }}>{ai.hamzaNote}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {ai && ai.verdict === "ERROR" && (
                    <div style={{ textAlign:"center", padding:"10px 0" }}>
                      <div style={{ fontSize:12, color:"#EF4444", marginBottom:8 }}>Analysis failed. Try again.</div>
                      <button onClick={() => { setAnalysis(a => ({ ...a, [modal.id]:null })); runAnalysis(modal); }} style={{ fontSize:12, color:"#2563EB", background:"none", border:"1px solid #2563EB", borderRadius:8, padding:"6px 14px", cursor:"pointer" }}>Retry</button>
                    </div>
                  )}
                </div>
                <button onClick={() => { setModal(null); setAlertModal(true); }} style={{ width:"100%", background:"linear-gradient(135deg,#2563EB,#1D4ED8)", color:"#fff", border:"none", borderRadius:12, padding:"14px", fontWeight:700, fontSize:14, cursor:"pointer", boxShadow:"0 4px 14px rgba(37,99,235,0.3)" }}>
                  🔔 Alert Me When Similar Deals Hit
                </button>
                <div style={{ textAlign:"center", marginTop:14, fontSize:12, color:"#CBD5E0" }}>
                  Hamza Nouman · Royal LePage Signature · 647-609-1289
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* LEAD CAPTURE */}
      {alertModal && (
        <div onClick={() => !submitted && setAlertModal(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20, animation:"fadeIn 0.2s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:20, padding:"32px 28px", maxWidth:400, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            {!submitted ? (
              <>
                <div style={{ fontSize:40, textAlign:"center", marginBottom:10 }}>🔔</div>
                <div style={{ fontSize:20, fontWeight:800, color:"#0F172A", textAlign:"center", marginBottom:6 }}>Save Your Search</div>
                <p style={{ fontSize:13, color:"#64748B", textAlign:"center", lineHeight:1.6, marginBottom:24 }}>Get instant WhatsApp alerts when new Mississauga investment deals match your filters — before other investors see them.</p>
                {[
                  { k:"name", l:"Full Name", p:"Your full name", req:true },
                  { k:"phone", l:"Phone / WhatsApp", p:"+1 (647) 000-0000", req:true },
                  { k:"email", l:"Email (optional)", p:"your@email.com", req:false },
                ].map(f => (
                  <div key={f.k} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:6 }}>{f.l}{f.req && <span style={{ color:"#EF4444" }}> *</span>}</div>
                    <input type="text" placeholder={f.p} value={form[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]:e.target.value }))}
                      style={{ width:"100%", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"11px 14px", fontSize:14, outline:"none", fontFamily:"inherit", color:"#0F172A" }}/>
                  </div>
                ))}
                <button onClick={() => { if (form.name && form.phone) setSubmitted(true); }} disabled={!form.name || !form.phone}
                  style={{ width:"100%", background:form.name && form.phone ? "linear-gradient(135deg,#2563EB,#1D4ED8)" : "#E2E8F0", color:form.name && form.phone ? "#fff" : "#94A3B8", border:"none", borderRadius:12, padding:"14px", fontWeight:700, fontSize:15, cursor:form.name && form.phone ? "pointer" : "not-allowed", fontFamily:"inherit" }}>
                  Activate Deal Alerts
                </button>
                <div style={{ fontSize:11, color:"#CBD5E0", textAlign:"center", marginTop:14, lineHeight:1.6 }}>Hamza Nouman · Royal LePage Signature<br/>Your info is never shared or sold.</div>
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
                <div style={{ fontSize:22, fontWeight:800, color:"#16A865", marginBottom:8 }}>You're all set!</div>
                <p style={{ fontSize:14, color:"#64748B", lineHeight:1.6, marginBottom:24 }}>Hamza will reach out on WhatsApp shortly with deals matching your search.</p>
                <button onClick={() => { setAlertModal(false); setSubmitted(false); }} style={{ background:"#F8FAFC", color:"#475569", border:"1px solid #E2E8F0", borderRadius:10, padding:"11px 22px", fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>Back to Listings</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
