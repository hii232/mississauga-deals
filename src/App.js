import { useState, useEffect } from "react";

const T = {
  bg: "#07090F", surface: "#0D1117", card: "#161B25", border: "rgba(255,255,255,0.07)",
  gold: "#C49A3C", goldDim: "rgba(196,154,60,0.12)", goldBorder: "rgba(196,154,60,0.25)",
  text: "#E8EDF4", muted: "#6B7A90", green: "#34D399", red: "#F87171", blue: "#60A5FA", purple: "#A78BFA",
};

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit',sans-serif;background:${T.bg};color:${T.text}}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:${T.bg}}
  ::-webkit-scrollbar-thumb{background:#1E3A5F;border-radius:4px}
  input,select,textarea{font-family:'Outfit',sans-serif}
  input:focus,select:focus,textarea:focus{outline:none!important;border-color:${T.gold}!important;box-shadow:0 0 0 3px rgba(196,154,60,0.12)!important}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fade-in{animation:fadeIn 0.25s ease forwards}
  .btn{cursor:pointer;font-family:'Outfit',sans-serif;font-weight:600;border:none;transition:all .18s ease}
  .btn-gold{background:linear-gradient(135deg,${T.gold},#A07820);color:#fff}
  .btn-gold:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(196,154,60,0.3)}
  .btn-ghost{background:rgba(255,255,255,0.05);color:${T.text};border:1px solid ${T.border}!important}
  .btn-ghost:hover{background:rgba(255,255,255,0.09)}
  .btn-danger{background:rgba(248,113,113,0.1);color:${T.red};border:1px solid rgba(248,113,113,0.2)!important}
  .nav-item{cursor:pointer;padding:10px 14px;border-radius:10px;transition:all .18s ease;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:500;color:${T.muted}}
  .nav-item:hover{background:rgba(255,255,255,0.05);color:${T.text}}
  .nav-item.active{background:${T.goldDim};color:${T.gold};border:1px solid ${T.goldBorder}}
  .card{background:${T.card};border:1px solid ${T.border};border-radius:14px}
  .input{width:100%;background:${T.surface};border:1px solid ${T.border};border-radius:8px;padding:10px 14px;color:${T.text};font-size:14px}
  .tag{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
  .img-slot{border:2px dashed ${T.border};border-radius:12px;transition:all .2s ease;cursor:pointer}
  .img-slot:hover{border-color:${T.gold};background:${T.goldDim}}
  .img-slot.has-image{border-style:solid;border-color:rgba(52,211,153,0.4)}
`;

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const store = {
  async get(key) { try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; } },
  async set(key, val) { try { await window.storage.set(key, JSON.stringify(val)); return true; } catch { return false; } }
};

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const DEFAULT_LISTINGS = [
  { id:"ML013", address:"1590 Carolyn Rd", neighbourhood:"Erin Mills", price:869000, beds:4, baths:3, sqft:2050, dom:67, priceReduction:12.4, estimatedRent:4300, type:"Detached", lrtAccess:false, brokerage:"Intercity Realty Inc.", hamzaScore:9.0, cashFlow:460, capRate:5.6, hamzaNotes:"HAMZA'S PICK.", status:"active", images:[], featured:true },
  { id:"ML005", address:"915 Inverhouse Dr", neighbourhood:"Clarkson", price:975000, beds:4, baths:3, sqft:2300, dom:61, priceReduction:11.2, estimatedRent:4600, type:"Detached", lrtAccess:true, brokerage:"Sutton Group Quantum Realty Inc.", hamzaScore:9.1, cashFlow:480, capRate:5.4, hamzaNotes:"This is the one.", status:"active", images:[], featured:false },
];
const DEFAULT_BLOGS = [
  { id:"b1", title:"Top 5 Cash Flow Properties in Mississauga", slug:"top-5-cashflow-mississauga", excerpt:"Hamza breaks down the best investment opportunities.", content:"", status:"published", date:"2025-03-01", tags:["investment","mississauga"], seoTitle:"", seoDesc:"", coverImage:null, views:147 },
];
const DEFAULT_SITE_IMAGES = {
  agentPhoto: null,         // Header + About section
  heroBg: null,             // Hero section background
  logoImage: null,          // Site logo (replaces ◈ diamond)
  aboutBanner: null,        // About/bio section banner
  neighbourhoods: {         // One per neighbourhood card
    "Clarkson": null, "Port Credit": null, "Lakeview": null,
    "Churchill Meadows": null, "Streetsville": null, "Erin Mills": null,
    "Cooksville": null, "Hurontario": null, "Meadowvale": null, "Malton": null,
  },
  marketPulseBanner: null,  // Market Pulse tab banner
  preconBanner: null,       // Pre-Con VIP section banner
};
const DEFAULT_BLOGS_DATA = DEFAULT_BLOGS;
const DEFAULT_SEO = {
  siteTitle:"Mississauga Investor | Investment Property Intelligence",
  siteDesc:"Find the best investment properties in Mississauga with expert analysis from Hamza Nouman, Sales Representative at Royal LePage Signature Realty.",
  keywords:"mississauga investment properties, cash flow properties mississauga",
  googleAnalytics:"", schemaAgent:true, canonicalBase:"https://mississaugainvestor.ca",
  pages:{ home:{title:"Mississauga Investment Properties | Hamza Nouman",desc:"Expert investment property analysis."}, listings:{title:"Investment Properties Mississauga",desc:"Browse Mississauga investment properties with cap rate analysis."}, blog:{title:"Mississauga Real Estate Blog",desc:"Expert investment insights from Hamza Nouman."} }
};
const DEFAULT_SETTINGS = {
  agentName:"Hamza Nouman", title:"Sales Representative", brokerage:"Royal LePage Signature Realty, Brokerage",
  phone:"647-609-1289", email:"hamza@nouman.ca", website:"https://www.hamzahomes.ca",
  whatsapp:"16476091289", calendly:"https://calendly.com/hamzanouman",
  bio:"Specializing in Mississauga investment properties with deep expertise in cap rate analysis, BRRR strategies, and the Hurontario LRT corridor.",
  awards:"Master Sales Award", languages:"English, Urdu, Hindi", brandColor:"#C49A3C", siteMode:"demo",
};
const DEFAULT_LEADS = [
  { id:"l1", name:"Ahmed Khan", phone:"905-555-1234", email:"ahmed@email.com", type:"Registration", date:"2025-03-08", casl:true, notes:"Cash flow under $800K" },
  { id:"l2", name:"Sarah Chen", phone:"416-555-5678", email:"", type:"Pre-Con VIP", date:"2025-03-07", casl:true, notes:"$700K-$900K, Churchill Meadows" },
  { id:"l3", name:"Mike Patel", phone:"647-555-9012", email:"mike@email.com", type:"Seller", date:"2025-03-06", casl:true, notes:"4-bed in Erin Mills, sell Q2" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const Spinner = ({ size=20, color=T.gold }) => (
  <div style={{width:size,height:size,border:`2px solid rgba(255,255,255,0.1)`,borderTopColor:color,borderRadius:"50%",animation:"spin 0.7s linear infinite",flexShrink:0}}/>
);
const fmtK = n => n >= 1000000 ? "$"+(n/1000000).toFixed(2)+"M" : "$"+(n/1000).toFixed(0)+"K";
const CASL_TEXT = "By checking this box, I consent to receive commercial electronic messages from Hamza Nouman, Sales Representative, Royal LePage Signature Realty, Brokerage (647-609-1289 · hamzahomes.ca). I may withdraw consent at any time.";

// ─── SINGLE IMAGE UPLOAD SLOT ─────────────────────────────────────────────────
function ImageSlot({ label, sublabel, value, onChange, aspectRatio="16/9", width="100%", showLocation=true }) {
  const inputId = "slot-" + label.replace(/\s+/g,"-").toLowerCase();
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => onChange({ url: e.target.result, name: file.name, alt: label });
    reader.readAsDataURL(file);
  };
  return (
    <div style={{width}}>
      {showLocation && (
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.text}}>{label}</div>
            {sublabel && <div style={{fontSize:11,color:T.muted,marginTop:1}}>{sublabel}</div>}
          </div>
          {value && (
            <button onClick={()=>onChange(null)} className="btn btn-danger" style={{padding:"3px 10px",borderRadius:6,fontSize:11,border:"1px solid rgba(248,113,113,0.2)"}}>
              Remove
            </button>
          )}
        </div>
      )}
      <div
        className={`img-slot${value?" has-image":""}`}
        style={{position:"relative",aspectRatio,overflow:"hidden",background:T.surface,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}
        onClick={()=>document.getElementById(inputId).click()}
        onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=T.gold;e.currentTarget.style.background=T.goldDim;}}
        onDragLeave={e=>{e.currentTarget.style.borderColor="";e.currentTarget.style.background="";}}
        onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor="";e.currentTarget.style.background="";handleFile(e.dataTransfer.files[0]);}}
      >
        {value ? (
          <>
            <img src={value.url} alt={value.alt||label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.6)",padding:"6px 10px",fontSize:11,color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>✓ {value.name}</span>
              <span style={{color:T.green,fontWeight:700}}>UPLOADED</span>
            </div>
          </>
        ) : (
          <div style={{textAlign:"center",padding:16}}>
            <div style={{fontSize:28,marginBottom:6}}>📸</div>
            <div style={{fontSize:12,color:T.muted}}>Click or drag image here</div>
            <div style={{fontSize:10,color:T.muted,marginTop:2}}>JPG, PNG, WebP</div>
          </div>
        )}
        <input id={inputId} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
      </div>
    </div>
  );
}

// ─── MULTI IMAGE UPLOADER ─────────────────────────────────────────────────────
function MultiImageUploader({ images=[], onChange, label }) {
  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = e => onChange(prev => [...prev, { id: Date.now()+Math.random(), url: e.target.result, name: file.name, alt: "" }]);
      reader.readAsDataURL(file);
    });
  };
  return (
    <div>
      {label && <div style={{fontSize:12,color:T.muted,fontWeight:600,marginBottom:8}}>{label}</div>}
      <div
        style={{border:`2px dashed ${T.border}`,borderRadius:10,padding:16,textAlign:"center",cursor:"pointer",background:T.surface,transition:"all .2s"}}
        onClick={()=>document.getElementById("multi-upload").click()}
        onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=T.gold;}}
        onDragLeave={e=>{e.currentTarget.style.borderColor="";}}
        onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor="";handleFiles(e.dataTransfer.files);}}
      >
        <div style={{fontSize:22,marginBottom:4}}>+</div>
        <div style={{fontSize:12,color:T.muted}}>Add more photos — drag & drop or click</div>
        <input id="multi-upload" type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
      </div>
      {images.length > 0 && (
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
          {images.map((img,i)=>(
            <div key={img.id} style={{position:"relative",width:80,height:64,borderRadius:8,overflow:"hidden",border:`1px solid ${T.border}`}}>
              <img src={img.url} alt={img.alt||img.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              {i===0&&<span style={{position:"absolute",top:2,left:2,background:T.gold,color:"#000",fontSize:8,fontWeight:700,padding:"1px 4px",borderRadius:3}}>MAIN</span>}
              <button onClick={()=>onChange(prev=>prev.filter(x=>x.id!==img.id))}
                style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,0.75)",color:T.red,border:"none",width:16,height:16,borderRadius:"50%",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI WRITER ────────────────────────────────────────────────────────────────
function AIWriter({ prompt, onInsert, placeholder="Describe what to write..." }) {
  const [input, setInput] = useState(prompt||"");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:"You are Hamza Nouman's real estate content writer for mississaugainvestor.ca. Write professional, data-driven content for Mississauga real estate investors. Hamza is Sales Representative at Royal LePage Signature Realty, Brokerage. Never give financial advice.",
          messages:[{role:"user",content:input}] }) });
      const d = await res.json();
      setResult(d.content?.[0]?.text||"Could not generate.");
    } catch { setResult("AI unavailable — check Anthropic billing."); }
    setLoading(false);
  };
  return (
    <div style={{background:"rgba(196,154,60,0.04)",border:`1px solid ${T.goldBorder}`,borderRadius:12,padding:16,marginTop:14}}>
      <div style={{fontSize:12,color:T.gold,fontWeight:700,marginBottom:10}}>🤖 AI Writer</div>
      <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={placeholder} className="input" style={{height:70,resize:"vertical",marginBottom:10}}/>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={generate} disabled={loading} className="btn btn-gold" style={{padding:"7px 16px",borderRadius:8,fontSize:13,display:"flex",alignItems:"center",gap:7}}>
          {loading?<><Spinner size={13} color="#fff"/>Generating...</>:"✨ Generate"}
        </button>
        {result&&<button onClick={()=>onInsert(result)} className="btn btn-ghost" style={{padding:"7px 14px",borderRadius:8,fontSize:13,border:`1px solid ${T.border}`}}>↑ Use this</button>}
      </div>
      {result&&<div style={{marginTop:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:12,maxHeight:160,overflow:"auto"}}>
        <pre style={{fontSize:12,color:T.text,whiteSpace:"pre-wrap",lineHeight:1.7,fontFamily:"'Outfit',sans-serif"}}>{result}</pre>
      </div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SITE IMAGE MANAGER — the new Media section
// Shows exactly where each image appears on the live site
// ─────────────────────────────────────────────────────────────────────────────
function SiteImageManager({ siteImages, setSiteImages, listings, setListings, blogs, setBlogs }) {
  const [activeTab, setActiveTab] = useState("global");
  const [saving, setSaving] = useState(false);
  const [editListingId, setEditListingId] = useState(listings[0]?.id||null);

  const saveAll = async () => {
    setSaving(true);
    await store.set("siteImages", siteImages);
    await store.set("listings", listings);
    await store.set("blogs", blogs);
    setSaving(false);
    alert("All images saved ✓");
  };

  const updateSiteImg = (key, val, subkey=null) => {
    if (subkey) setSiteImages(s=>({...s,[key]:{...s[key],[subkey]:val}}));
    else setSiteImages(s=>({...s,[key]:val}));
  };

  const updateListingImages = (id, imgs) => {
    setListings(ls=>ls.map(l=>l.id===id?{...l,images:typeof imgs==="function"?imgs(l.images||[]):imgs}:l));
  };

  const updateBlogImage = (id, img) => {
    setBlogs(bs=>bs.map(b=>b.id===id?{...b,coverImage:img}:b));
  };

  const currentListing = listings.find(l=>l.id===editListingId)||listings[0];

  const TABS = [
    {id:"global",label:"🌐 Global Site Images"},
    {id:"listings",label:"🏠 Listing Photos"},
    {id:"neighbourhoods",label:"🗺️ Neighbourhoods"},
    {id:"blog",label:"✍️ Blog Covers"},
  ];

  // Site section reference diagram
  const SITE_SECTIONS = [
    { key:"agentPhoto", label:"Agent Photo", sublabel:"Shows in: Header bio, About section, Listing modal", aspect:"1/1", width:"160px", hint:"Square photo. Your professional headshot. Min 400×400px recommended." },
    { key:"heroBg", label:"Hero Background", sublabel:"Shows in: Hero banner behind headline text", aspect:"16/5", width:"100%", hint:"Wide banner image. City skyline or Mississauga aerial. Min 1400×440px." },
    { key:"aboutBanner", label:"About / Bio Banner", sublabel:"Shows in: Agent bio card on all pages", aspect:"3/1", width:"100%", hint:"Wide horizontal banner behind your bio. Office photo or team shot works well." },
    { key:"marketPulseBanner", label:"Market Pulse Banner", sublabel:"Shows in: Market Pulse tab header", aspect:"3/1", width:"100%", hint:"Real estate market data visual. Chart screenshot or Mississauga skyline." },
    { key:"preconBanner", label:"Pre-Con VIP Banner", sublabel:"Shows in: Pre-Construction tab header", aspect:"3/1", width:"100%", hint:"Condo rendering or construction crane. High-rise Mississauga works well." },
    { key:"logoImage", label:"Site Logo Image", sublabel:"Shows in: Header top-left (replaces ◈ diamond)", aspect:"1/1", width:"80px", hint:"Square logo. Transparent PNG preferred. Replaces the gold diamond icon." },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:4}}>📸 Site Image Manager</h2>
          <p style={{fontSize:13,color:T.muted}}>Upload images to specific sections — each slot shows exactly where it appears on the live site</p>
        </div>
        <button onClick={saveAll} disabled={saving} className="btn btn-gold" style={{padding:"10px 22px",borderRadius:9,fontSize:13,display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {saving?<><Spinner size={14} color="#fff"/>Saving...</>:"💾 Save All Images"}
        </button>
      </div>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:4,borderBottom:`1px solid ${T.border}`,marginBottom:22,overflow:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{background:"none",border:"none",cursor:"pointer",padding:"9px 16px",fontSize:13,fontWeight:500,color:activeTab===t.id?T.gold:T.muted,borderBottom:`2px solid ${activeTab===t.id?T.gold:"transparent"}`,transition:"all .2s",whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* GLOBAL SITE IMAGES */}
      {activeTab==="global"&&(
        <div className="fade-in">
          <div style={{background:"rgba(61,155,233,0.06)",border:"1px solid rgba(61,155,233,0.2)",borderRadius:10,padding:"12px 16px",marginBottom:22,display:"flex",gap:10}}>
            <span style={{fontSize:20}}>ℹ️</span>
            <p style={{fontSize:13,color:T.muted,lineHeight:1.6}}>Each box below controls a specific section of <strong style={{color:T.text}}>mississaugainvestor.ca</strong>. Upload a photo and it immediately replaces that section when the site is next loaded. Images saved here override the default placeholders.</p>
          </div>

          {/* Agent Photo — special layout */}
          <div className="card" style={{padding:20,marginBottom:16}}>
            <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
              <ImageSlot
                key="agentPhoto"
                label="Agent Photo"
                sublabel="Shows in: Header bio, About section, Listing modals"
                value={siteImages.agentPhoto}
                onChange={v=>updateSiteImg("agentPhoto",v)}
                aspectRatio="1/1"
                width="160px"
              />
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:6}}>Where this appears</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {["Header agent bio card (every page)","Listing detail modal — Hamza's Take tab","About section in hero","Footer (if enabled)"].map(loc=>(
                    <div key={loc} style={{display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:T.green,flexShrink:0}}/>
                      <span style={{fontSize:12,color:T.muted}}>{loc}</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:12,background:T.surface,borderRadius:8,padding:"8px 12px",border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:11,color:T.muted,marginBottom:2}}>💡 Best practice</div>
                  <div style={{fontSize:12,color:T.text}}>Professional headshot, square crop, white or light background. Same photo as your RECO/Royal LePage profile for consistency.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Other site sections */}
          <div style={{display:"grid",gap:16}}>
            {SITE_SECTIONS.filter(s=>s.key!=="agentPhoto").map(section=>(
              <div key={section.key} className="card" style={{padding:20}}>
                <div style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:T.text}}>{section.label}</div>
                    <div style={{fontSize:12,color:T.gold,marginTop:2}}>{section.sublabel}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:4,fontStyle:"italic"}}>💡 {section.hint}</div>
                  </div>
                  {siteImages[section.key]&&(
                    <button onClick={()=>updateSiteImg(section.key,null)} className="btn btn-danger" style={{padding:"4px 12px",borderRadius:6,fontSize:11,border:"1px solid rgba(248,113,113,0.2)"}}>
                      Remove
                    </button>
                  )}
                </div>
                <ImageSlot
                  label={section.label}
                  value={siteImages[section.key]}
                  onChange={v=>updateSiteImg(section.key,v)}
                  aspectRatio={section.aspect}
                  width={section.width}
                  showLocation={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LISTING PHOTOS */}
      {activeTab==="listings"&&(
        <div className="fade-in">
          <div style={{background:"rgba(196,154,60,0.06)",border:`1px solid ${T.goldBorder}`,borderRadius:10,padding:"12px 16px",marginBottom:20}}>
            <p style={{fontSize:13,color:T.muted,lineHeight:1.6}}>Add real property photos to each listing. The <strong style={{color:T.gold}}>first image</strong> becomes the listing card photo. All others show in the gallery inside the detail modal. Max 8 photos per listing.</p>
          </div>

          {/* Listing selector */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
            {listings.map(l=>(
              <button key={l.id} onClick={()=>setEditListingId(l.id)}
                className={editListingId===l.id?"btn btn-gold":"btn btn-ghost"}
                style={{padding:"8px 14px",borderRadius:9,fontSize:12,border:editListingId===l.id?"none":`1px solid ${T.border}`,textAlign:"left",maxWidth:200}}>
                <div style={{fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.address}</div>
                <div style={{fontSize:10,opacity:0.7,marginTop:2}}>{(l.images||[]).length} photos · {l.neighbourhood}</div>
              </button>
            ))}
          </div>

          {currentListing&&(
            <div className="card" style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:T.text}}>{currentListing.address}</div>
                  <div style={{fontSize:13,color:T.muted}}>{currentListing.neighbourhood} · {fmtK(currentListing.price)} · {currentListing.type}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:12,color:T.muted}}>{(currentListing.images||[]).length}/8 photos</span>
                </div>
              </div>

              {/* Card preview */}
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:14,marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:700,color:T.gold,marginBottom:10}}>📌 Where listing photos appear on the site</div>
                <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                  {[
                    {slot:"1st photo",shows:"Listing card thumbnail — main grid view"},
                    {slot:"1st photo",shows:"Listing modal header image"},
                    {slot:"All photos",shows:"Gallery carousel inside detail modal"},
                    {slot:"1st photo",shows:"Hamza's Pick banner (if featured listing)"},
                  ].map((r,i)=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",flex:"1 1 200px"}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:T.blue,flexShrink:0,marginTop:4}}/>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:T.blue}}>{r.slot}</div>
                        <div style={{fontSize:11,color:T.muted}}>{r.shows}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* First image = main card photo */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>Main Card Photo <span style={{fontSize:11,color:T.gold}}>(1st image — shown on listing grid)</span></div>
                <ImageSlot
                  label="Main card photo"
                  value={(currentListing.images||[])[0]||null}
                  onChange={v=>{
                    const imgs=[...(currentListing.images||[])];
                    if(v){imgs[0]=v;}else{imgs.shift();}
                    updateListingImages(currentListing.id,imgs);
                  }}
                  aspectRatio="16/10"
                  width="100%"
                  showLocation={false}
                />
              </div>

              {/* Additional photos */}
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>Gallery Photos <span style={{fontSize:11,color:T.muted}}>(shown inside listing modal)</span></div>
                <MultiImageUploader
                  images={(currentListing.images||[]).slice(1)}
                  onChange={newImgs=>{
                    const first=(currentListing.images||[])[0];
                    updateListingImages(currentListing.id,first?[first,...newImgs(currentListing.images?.slice(1)||[])]:newImgs(currentListing.images?.slice(1)||[]));
                  }}
                  label=""
                />
              </div>

              {/* Alt text for SEO */}
              {(currentListing.images||[]).length>0&&(
                <div style={{marginTop:16}}>
                  <div style={{fontSize:12,color:T.muted,fontWeight:600,marginBottom:8}}>Alt Text (SEO — describe each photo for Google)</div>
                  {(currentListing.images||[]).map((img,i)=>(
                    <div key={img.id||i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
                      <img src={img.url} alt="" style={{width:48,height:36,objectFit:"cover",borderRadius:6,flexShrink:0}}/>
                      <input value={img.alt||""} onChange={e=>{
                        const imgs=[...(currentListing.images||[])];
                        imgs[i]={...imgs[i],alt:e.target.value};
                        updateListingImages(currentListing.id,imgs);
                      }} className="input" placeholder={`Alt text for photo ${i+1} — e.g. "4 bedroom detached home in Erin Mills Mississauga"`} style={{fontSize:12}}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* NEIGHBOURHOOD IMAGES */}
      {activeTab==="neighbourhoods"&&(
        <div className="fade-in">
          <div style={{background:"rgba(196,154,60,0.06)",border:`1px solid ${T.goldBorder}`,borderRadius:10,padding:"12px 16px",marginBottom:20}}>
            <p style={{fontSize:13,color:T.muted,lineHeight:1.6}}>Each neighbourhood card on the <strong style={{color:T.gold}}>Neighbourhoods tab</strong> can have a background photo. Use Google Street View screenshots, aerial drone shots, or neighbourhood landmark photos.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
            {Object.keys(siteImages.neighbourhoods||{}).map(hood=>(
              <div key={hood} className="card" style={{padding:16}}>
                <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:2}}>{hood}</div>
                <div style={{fontSize:11,color:T.muted,marginBottom:10}}>Shows on: Neighbourhoods tab → {hood} card background</div>
                <ImageSlot
                  label={hood}
                  value={siteImages.neighbourhoods?.[hood]||null}
                  onChange={v=>updateSiteImg("neighbourhoods",v,hood)}
                  aspectRatio="16/9"
                  width="100%"
                  showLocation={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BLOG COVERS */}
      {activeTab==="blog"&&(
        <div className="fade-in">
          <div style={{background:"rgba(96,165,250,0.06)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:10,padding:"12px 16px",marginBottom:20}}>
            <p style={{fontSize:13,color:T.muted,lineHeight:1.6}}>Upload a cover image for each blog post. The cover appears at the top of the post and in the blog listing grid. Recommended size: <strong style={{color:T.blue}}>1200×630px</strong> (also used as the Open Graph image for social media sharing).</p>
          </div>
          <div style={{display:"grid",gap:16}}>
            {blogs.map(b=>(
              <div key={b.id} className="card" style={{padding:20}}>
                <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
                  <div style={{flex:"0 0 300px",maxWidth:"100%"}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:2}}>{b.title}</div>
                    <div style={{fontSize:11,color:T.muted,marginBottom:10}}>
                      {b.status==="published"
                        ?<span style={{color:T.green}}>● Published · {b.date}</span>
                        :<span style={{color:T.muted}}>● Draft</span>}
                    </div>
                    <ImageSlot
                      label={b.title}
                      value={b.coverImage||null}
                      onChange={v=>updateBlogImage(b.id,v)}
                      aspectRatio="16/9"
                      width="100%"
                      showLocation={false}
                    />
                  </div>
                  <div style={{flex:1,minWidth:180}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.gold,marginBottom:8}}>Where cover image appears</div>
                    {["Blog listing grid card","Top of full blog post","Open Graph preview (WhatsApp/Facebook sharing)","Google search snippet image"].map(loc=>(
                      <div key={loc} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                        <div style={{width:5,height:5,borderRadius:"50%",background:T.blue,flexShrink:0}}/>
                        <span style={{fontSize:12,color:T.muted}}>{loc}</span>
                      </div>
                    ))}
                    {b.coverImage&&(
                      <div style={{marginTop:12}}>
                        <div style={{fontSize:11,color:T.muted,fontWeight:600,marginBottom:4}}>Alt Text (SEO)</div>
                        <input value={b.coverImage.alt||""} onChange={e=>updateBlogImage(b.id,{...b.coverImage,alt:e.target.value})}
                          className="input" placeholder="Describe the image for Google..." style={{fontSize:12}}/>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({icon,label,value,sub,color=T.gold})=>(
  <div className="card" style={{padding:"18px 20px"}}>
    <div style={{fontSize:24,marginBottom:8}}>{icon}</div>
    <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{label}</div>
    <div style={{fontSize:26,fontWeight:700,color,fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.muted,marginTop:4}}>{sub}</div>}
  </div>
);

// ─── DASHBOARD HOME ───────────────────────────────────────────────────────────
const DashboardHome = ({listings,blogs,leads,settings,siteImages})=>{
  const totalImages = Object.values(siteImages).reduce((acc,v)=>{
    if(v===null)return acc;
    if(typeof v==="object"&&!v.url)return acc+Object.values(v).filter(Boolean).length;
    return acc+1;
  },0) + listings.reduce((a,l)=>a+(l.images||[]).length,0) + blogs.reduce((a,b)=>a+(b.coverImage?1:0),0);

  return(
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:4}}>Dashboard</h2>
          <p style={{fontSize:13,color:T.muted}}>{settings.agentName} · {settings.brokerage} · {settings.siteMode==="live"?"🟢 LIVE":"🟡 DEMO MODE"}</p>
        </div>
      </div>
      {settings.siteMode==="demo"&&(
        <div style={{background:"rgba(196,154,60,0.08)",border:`1px solid ${T.goldBorder}`,borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.gold}}>Site in Demo Mode — Sample listings visible</div>
            <div style={{fontSize:12,color:T.muted}}>Connect TRREB data then switch to Live in Settings.</div>
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:12,marginBottom:24}}>
        <StatCard icon="🏠" label="Listings" value={listings.length} sub={`${listings.filter(l=>l.status==="active").length} active`}/>
        <StatCard icon="👥" label="Leads" value={leads.length} sub="CASL consented" color={T.green}/>
        <StatCard icon="✍️" label="Blog Posts" value={blogs.filter(b=>b.status==="published").length} sub={`${blogs.filter(b=>b.status==="draft").length} drafts`} color={T.blue}/>
        <StatCard icon="📸" label="Images" value={totalImages} sub="uploaded to site" color={T.purple}/>
      </div>
      <div className="card" style={{padding:20,marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:14}}>📥 Recent Leads</div>
        {leads.slice(0,5).map(lead=>(
          <div key={lead.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:T.text}}>{lead.name}</div>
              <div style={{fontSize:11,color:T.muted}}>{lead.phone} · {lead.type} · {lead.date}</div>
            </div>
            <a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Hi "+lead.name+", this is Hamza Nouman from Royal LePage Signature Realty.")}`} target="_blank" rel="noreferrer"
              style={{fontSize:11,background:"rgba(37,211,102,0.1)",color:"#25D366",border:"1px solid rgba(37,211,102,0.2)",padding:"5px 12px",borderRadius:6,textDecoration:"none",fontWeight:600}}>
              💬 WhatsApp
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── LISTINGS MANAGER (simplified) ──────────────────────────────────────────
const ListingsManager = ({listings,setListings})=>{
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({});
  const [saving,setSaving]=useState(false);
  const blank={id:"ML"+Date.now(),address:"",neighbourhood:"Erin Mills",price:0,beds:3,baths:2,sqft:0,dom:0,priceReduction:0,estimatedRent:0,type:"Detached",lrtAccess:false,brokerage:"",hamzaScore:7.0,cashFlow:0,capRate:0,hamzaNotes:"",status:"active",images:[],featured:false};
  const openEdit=l=>{setForm({...l});setEditing(l.id);};
  const openNew=()=>{setForm({...blank});setEditing("new");};
  const save=async()=>{
    setSaving(true);
    const updated=editing==="new"?[form,...listings]:listings.map(l=>l.id===editing?form:l);
    setListings(updated);await store.set("listings",updated);setSaving(false);setEditing(null);
  };
  const del=async id=>{if(!confirm("Delete?"))return;const u=listings.filter(l=>l.id!==id);setListings(u);await store.set("listings",u);};
  const F=({label,field,type="text",options})=>(
    <div style={{marginBottom:12}}>
      <label style={{display:"block",fontSize:11,color:T.muted,fontWeight:600,marginBottom:4}}>{label}</label>
      {options?<select value={form[field]||""} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} className="input">{options.map(o=><option key={o}>{o}</option>)}</select>
       :type==="checkbox"?<label style={{display:"flex",gap:8,cursor:"pointer"}}><input type="checkbox" checked={!!form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.checked}))}/><span style={{fontSize:13,color:T.muted}}>Yes</span></label>
       :type==="textarea"?<textarea value={form[field]||""} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} className="input" style={{height:90,resize:"vertical"}}/>
       :<input type={type} value={form[field]??""} onChange={e=>setForm(f=>({...f,[field]:type==="number"?parseFloat(e.target.value)||0:e.target.value}))} className="input"/>}
    </div>
  );
  if(editing)return(
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontSize:18,fontWeight:700,color:T.text}}>{editing==="new"?"Add Listing":"Edit Listing"}</h2>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setEditing(null)} className="btn btn-ghost" style={{padding:"8px 16px",borderRadius:8,fontSize:13,border:`1px solid ${T.border}`}}>Cancel</button>
          <button onClick={save} disabled={saving} className="btn btn-gold" style={{padding:"8px 18px",borderRadius:8,fontSize:13,display:"flex",alignItems:"center",gap:7}}>{saving?<><Spinner size={13} color="#fff"/>Saving...</>:"💾 Save"}</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div className="card" style={{padding:18}}>
          <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:12}}>Property Details</div>
          <F label="Address *" field="address"/><F label="Neighbourhood" field="neighbourhood" options={["Clarkson","Port Credit","Lakeview","Churchill Meadows","Streetsville","Erin Mills","Cooksville","Hurontario","Meadowvale","Malton"]}/>
          <F label="Type" field="type" options={["Detached","Semi-Detached","Townhouse","Condo"]}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}><F label="Beds" field="beds" type="number"/><F label="Baths" field="baths" type="number"/><F label="Sq Ft" field="sqft" type="number"/></div>
          <F label="Brokerage (TRREB required)" field="brokerage"/><F label="LRT Access" field="lrtAccess" type="checkbox"/><F label="Featured" field="featured" type="checkbox"/>
        </div>
        <div className="card" style={{padding:18}}>
          <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:12}}>Investment Numbers</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <F label="Price ($)" field="price" type="number"/><F label="Original Price ($)" field="originalPrice" type="number"/>
            <F label="Price Drop (%)" field="priceReduction" type="number"/><F label="Days on Market" field="dom" type="number"/>
            <F label="Est. Rent/mo ($)" field="estimatedRent" type="number"/><F label="Cash Flow/mo ($)" field="cashFlow" type="number"/>
            <F label="Cap Rate (%)" field="capRate" type="number"/><F label="Score (0-10)" field="hamzaScore" type="number"/>
          </div>
        </div>
      </div>
      <div className="card" style={{padding:18,marginTop:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:10}}>Hamza's Notes</div>
        <F label="Your investment analysis" field="hamzaNotes" type="textarea"/>
        <AIWriter prompt={`Write Hamza's investment analysis for ${form.address||"this property"} in ${form.neighbourhood||"Mississauga"}. Price $${(form.price||0).toLocaleString()}, ${form.beds||0} beds, ${form.dom||0} DOM, ${form.priceReduction||0}% price drop, rent $${(form.estimatedRent||0).toLocaleString()}/mo.`} onInsert={txt=>setForm(f=>({...f,hamzaNotes:txt}))} placeholder="Describe property and I'll write the analysis..."/>
      </div>
      <div className="card" style={{padding:18,marginTop:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:4}}>📸 Listing Photos</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:12}}>Go to <strong style={{color:T.text}}>Media → Listing Photos</strong> for the full photo manager with exact placement previews. Quick upload here adds to the gallery.</div>
        <MultiImageUploader images={form.images||[]} onChange={fn=>setForm(f=>({...f,images:fn(f.images||[])}))}/>
      </div>
    </div>
  );
  return(
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:700,color:T.text}}>Listings Manager</h2>
        <button onClick={openNew} className="btn btn-gold" style={{padding:"10px 20px",borderRadius:9,fontSize:13}}>+ Add Listing</button>
      </div>
      <div style={{display:"grid",gap:10}}>
        {listings.map(l=>(
          <div key={l.id} className="card" style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
            <div style={{width:52,height:52,borderRadius:10,overflow:"hidden",background:"#1E3A5F",flexShrink:0,position:"relative"}}>
              {(l.images||[])[0]?<img src={l.images[0].url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{l.type==="Detached"?"🏠":l.type==="Condo"?"🏢":"🏘️"}</div>}
              {(l.images||[]).length>0&&<div style={{position:"absolute",bottom:0,right:0,background:"rgba(0,0,0,0.7)",fontSize:9,color:"#fff",padding:"1px 4px",borderRadius:"4px 0 0 0"}}>{l.images.length}📸</div>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:2}}>{l.address} {l.featured&&<span className="tag" style={{background:T.goldDim,color:T.gold,border:`1px solid ${T.goldBorder}`,fontSize:10}}>★</span>}</div>
              <div style={{fontSize:12,color:T.muted}}>{l.neighbourhood} · {fmtK(l.price)} · Score {l.hamzaScore} · {l.dom}d · {l.status}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>openEdit(l)} className="btn btn-ghost" style={{padding:"7px 14px",borderRadius:7,fontSize:12,border:`1px solid ${T.border}`}}>✏️ Edit</button>
              <button onClick={()=>del(l.id)} className="btn btn-danger" style={{padding:"7px 14px",borderRadius:7,fontSize:12,border:"1px solid rgba(248,113,113,0.2)"}}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── BLOG MANAGER ────────────────────────────────────────────────────────────
const BlogManager = ({blogs,setBlogs})=>{
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({});
  const [saving,setSaving]=useState(false);
  const [autoSEOing,setAutoSEOing]=useState(false);
  const blank={id:"b"+Date.now(),title:"",slug:"",excerpt:"",content:"",status:"draft",date:new Date().toISOString().split("T")[0],tags:[],seoTitle:"",seoDesc:"",coverImage:null,views:0};
  const openEdit=b=>{setForm({...b});setEditing(b.id);};
  const openNew=()=>{setForm({...blank});setEditing("new");};
  const save=async(status)=>{
    setSaving(true);
    const slug=form.slug||form.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
    const data={...form,slug,status:status||form.status};
    const updated=editing==="new"?[data,...blogs]:blogs.map(b=>b.id===editing?data:b);
    setBlogs(updated);await store.set("blogs",updated);setSaving(false);setEditing(null);
  };
  const del=async id=>{if(!confirm("Delete?"))return;const u=blogs.filter(b=>b.id!==id);setBlogs(u);await store.set("blogs",u);};
  const autoSEO=async()=>{
    if(!form.title)return;setAutoSEOing(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,system:"SEO expert. Respond ONLY with JSON: {\"seoTitle\":\"...\",\"seoDesc\":\"...\",\"slug\":\"...\"}. Title max 60 chars, desc max 155 chars.",messages:[{role:"user",content:`Title: "${form.title}". Site: mississaugainvestor.ca, Hamza Nouman real estate agent Mississauga.`}]})});
      const d=await res.json();
      const parsed=JSON.parse(d.content?.[0]?.text?.replace(/```json|```/g,"").trim()||"{}");
      setForm(f=>({...f,...parsed}));
    }catch{}
    setAutoSEOing(false);
  };
  if(editing)return(
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <h2 style={{fontSize:18,fontWeight:700,color:T.text}}>{editing==="new"?"New Post":"Edit Post"}</h2>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setEditing(null)} className="btn btn-ghost" style={{padding:"8px 14px",borderRadius:8,fontSize:13,border:`1px solid ${T.border}`}}>Cancel</button>
          <button onClick={()=>save("draft")} className="btn btn-ghost" style={{padding:"8px 14px",borderRadius:8,fontSize:13,border:`1px solid ${T.border}`}}>Save Draft</button>
          <button onClick={()=>save("published")} disabled={saving} className="btn btn-gold" style={{padding:"8px 18px",borderRadius:8,fontSize:13,display:"flex",alignItems:"center",gap:7}}>{saving?<><Spinner size={13} color="#fff"/>Publishing...</>:"🚀 Publish"}</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        <div>
          <div className="card" style={{padding:18,marginBottom:14}}>
            <div style={{marginBottom:12}}><label style={{display:"block",fontSize:11,color:T.muted,fontWeight:600,marginBottom:4}}>Title *</label><input value={form.title||""} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="input" style={{fontSize:15,fontWeight:600}}/></div>
            <div style={{marginBottom:12}}><label style={{display:"block",fontSize:11,color:T.muted,fontWeight:600,marginBottom:4}}>Excerpt</label><textarea value={form.excerpt||""} onChange={e=>setForm(f=>({...f,excerpt:e.target.value}))} className="input" style={{height:70,resize:"vertical"}}/></div>
            <div><label style={{display:"block",fontSize:11,color:T.muted,fontWeight:600,marginBottom:4}}>Full Content</label><textarea value={form.content||""} onChange={e=>setForm(f=>({...f,content:e.target.value}))} className="input" style={{height:280,resize:"vertical",lineHeight:1.7}}/></div>
            <AIWriter prompt={`Write a full SEO blog post titled "${form.title||"Mississauga real estate investment"}". Target: Mississauga real estate investors. Include specific neighbourhood data, cap rates, investment advice. Hamza Nouman's voice — direct and data-driven.`} onInsert={txt=>setForm(f=>({...f,content:txt}))} placeholder="Give a topic and I'll write the full post..."/>
          </div>
          <div className="card" style={{padding:18}}>
            <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:10}}>📸 Cover Image</div>
            <div style={{fontSize:12,color:T.muted,marginBottom:10}}>Appears on blog card grid, top of post, and when shared on WhatsApp/Facebook. Recommended: 1200×630px.</div>
            <ImageSlot label="Blog Cover" value={form.coverImage||null} onChange={v=>setForm(f=>({...f,coverImage:v}))} aspectRatio="16/9" width="100%" showLocation={false}/>
            {form.coverImage&&<div style={{marginTop:8}}><label style={{display:"block",fontSize:11,color:T.muted,marginBottom:4}}>Alt Text (SEO)</label><input value={form.coverImage.alt||""} onChange={e=>setForm(f=>({...f,coverImage:{...f.coverImage,alt:e.target.value}}))} className="input" placeholder="Describe the image for Google..." style={{fontSize:12}}/></div>}
          </div>
        </div>
        <div>
          <div className="card" style={{padding:18,marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:12}}>Settings</div>
            <div style={{marginBottom:12}}><label style={{display:"block",fontSize:11,color:T.muted,marginBottom:4}}>Status</label><select value={form.status||"draft"} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="input"><option value="draft">Draft</option><option value="published">Published</option></select></div>
            <div style={{marginBottom:12}}><label style={{display:"block",fontSize:11,color:T.muted,marginBottom:4}}>Date</label><input type="date" value={form.date||""} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="input"/></div>
            <div><label style={{display:"block",fontSize:11,color:T.muted,marginBottom:4}}>Tags</label><input value={(form.tags||[]).join(", ")} onChange={e=>setForm(f=>({...f,tags:e.target.value.split(",").map(t=>t.trim()).filter(Boolean)}))} className="input" placeholder="investment, mississauga"/></div>
          </div>
          <div className="card" style={{padding:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700,color:T.gold}}>SEO</div>
              <button onClick={autoSEO} disabled={autoSEOing} className="btn btn-ghost" style={{padding:"4px 10px",borderRadius:6,fontSize:11,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:5}}>
                {autoSEOing?<><Spinner size={11}/>Auto</>:"✨ Auto-fill"}
              </button>
            </div>
            <div style={{marginBottom:10}}><label style={{display:"block",fontSize:11,color:T.muted,marginBottom:4}}>URL Slug</label><input value={form.slug||""} onChange={e=>setForm(f=>({...f,slug:e.target.value}))} className="input" style={{fontSize:12}}/><div style={{fontSize:10,color:T.muted,marginTop:2}}>mississaugainvestor.ca/blog/{form.slug||"..."}</div></div>
            <div style={{marginBottom:10}}><label style={{display:"block",fontSize:11,color:T.muted,marginBottom:4}}>SEO Title <span style={{color:(form.seoTitle||"").length>60?T.red:T.muted}}>({(form.seoTitle||"").length}/60)</span></label><input value={form.seoTitle||""} onChange={e=>setForm(f=>({...f,seoTitle:e.target.value}))} className="input" style={{fontSize:12}}/></div>
            <div><label style={{display:"block",fontSize:11,color:T.muted,marginBottom:4}}>Meta Description <span style={{color:(form.seoDesc||"").length>155?T.red:T.muted}}>({(form.seoDesc||"").length}/155)</span></label><textarea value={form.seoDesc||""} onChange={e=>setForm(f=>({...f,seoDesc:e.target.value}))} className="input" style={{height:70,resize:"vertical",fontSize:12}}/></div>
          </div>
        </div>
      </div>
    </div>
  );
  return(
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:700,color:T.text}}>Blog Manager</h2>
        <button onClick={openNew} className="btn btn-gold" style={{padding:"10px 20px",borderRadius:9,fontSize:13}}>+ New Post</button>
      </div>
      <div style={{display:"grid",gap:10}}>
        {blogs.map(b=>(
          <div key={b.id} className="card" style={{padding:"14px 18px",display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{width:72,height:50,borderRadius:8,overflow:"hidden",background:T.surface,flexShrink:0}}>
              {b.coverImage?<img src={b.coverImage.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>✍️</div>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:2}}>{b.title}</div>
              <div style={{fontSize:12,color:T.muted}}>{b.date} · {b.views} views · <span style={{color:b.status==="published"?T.green:T.muted}}>{b.status}</span></div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>openEdit(b)} className="btn btn-ghost" style={{padding:"7px 14px",borderRadius:7,fontSize:12,border:`1px solid ${T.border}`}}>✏️ Edit</button>
              <button onClick={()=>del(b.id)} className="btn btn-danger" style={{padding:"7px 14px",borderRadius:7,fontSize:12,border:"1px solid rgba(248,113,113,0.2)"}}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── LEADS ───────────────────────────────────────────────────────────────────
const LeadsManager = ({leads,setLeads,settings})=>{
  const [filter,setFilter]=useState("All");
  const types=["All","Registration","Pre-Con VIP","Seller","Quiz"];
  const filtered=filter==="All"?leads:leads.filter(l=>l.type===filter);
  const del=async id=>{const u=leads.filter(l=>l.id!==id);setLeads(u);await store.set("leads",u);};
  return(
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><h2 style={{fontSize:20,fontWeight:700,color:T.text}}>Leads Manager</h2><span style={{fontSize:13,color:T.muted}}>{leads.length} total · all CASL consented</span></div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {types.map(t=><button key={t} onClick={()=>setFilter(t)} className={filter===t?"btn btn-gold":"btn btn-ghost"} style={{padding:"7px 16px",borderRadius:8,fontSize:12,border:filter===t?"none":`1px solid ${T.border}`}}>{t}{t!=="All"&&` (${leads.filter(l=>l.type===t).length})`}</button>)}
      </div>
      <div style={{display:"grid",gap:10}}>
        {filtered.map(lead=>(
          <div key={lead.id} className="card" style={{padding:"14px 18px",display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{fontSize:28,flexShrink:0}}>{lead.type==="Seller"?"🏡":lead.type==="Pre-Con VIP"?"🏙️":"👤"}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:2}}>{lead.name} <span className="tag" style={{background:T.goldDim,color:T.gold,border:`1px solid ${T.goldBorder}`,fontSize:10}}>{lead.type}</span></div>
              <div style={{fontSize:12,color:T.muted}}>{lead.phone}{lead.email?` · ${lead.email}`:""} · {lead.date}</div>
              {lead.notes&&<div style={{fontSize:12,color:T.text,fontStyle:"italic",marginTop:2}}>"{lead.notes}"</div>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Hi "+lead.name+", this is Hamza Nouman from Royal LePage Signature Realty. Thank you for registering on mississaugainvestor.ca!")}`} target="_blank" rel="noreferrer"
                style={{fontSize:12,background:"rgba(37,211,102,0.1)",color:"#25D366",border:"1px solid rgba(37,211,102,0.2)",padding:"7px 12px",borderRadius:7,textDecoration:"none",fontWeight:600}}>💬</a>
              {lead.phone&&<a href={`tel:${lead.phone}`} style={{fontSize:12,background:T.surface,color:T.text,border:`1px solid ${T.border}`,padding:"7px 12px",borderRadius:7,textDecoration:"none"}}>📞</a>}
              <button onClick={()=>del(lead.id)} className="btn btn-danger" style={{padding:"7px 12px",borderRadius:7,fontSize:12,border:"1px solid rgba(248,113,113,0.2)"}}>🗑️</button>
            </div>
          </div>
        ))}
        {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:T.muted}}>No leads yet.</div>}
      </div>
    </div>
  );
};

// ─── SEO ─────────────────────────────────────────────────────────────────────
const SEOManager = ({seo,setSeo})=>{
  const [saving,setSaving]=useState(false);
  const [auditing,setAuditing]=useState(false);
  const [audit,setAudit]=useState("");
  const save=async()=>{setSaving(true);await store.set("seo",seo);setSaving(false);alert("SEO saved ✓");};
  const runAudit=async()=>{
    setAuditing(true);setAudit("");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:700,system:"Expert SEO auditor for real estate websites. Be specific and actionable.",messages:[{role:"user",content:`Audit SEO for mississaugainvestor.ca:\nSite Title: ${seo.siteTitle}\nMeta Desc: ${seo.siteDesc}\nKeywords: ${seo.keywords}\n\nRate each out of 10, flag issues, give 5 improvements to rank for "Mississauga investment properties".`}]})});
      const d=await res.json();setAudit(d.content?.[0]?.text||"Failed.");
    }catch{setAudit("Audit failed.");}
    setAuditing(false);
  };
  const F=({label,value,onChange,type="text",hint,maxLen})=>(
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <label style={{fontSize:12,color:T.muted,fontWeight:600}}>{label}</label>
        {maxLen&&<span style={{fontSize:11,color:value?.length>maxLen?T.red:T.muted}}>{value?.length||0}/{maxLen}</span>}
      </div>
      {type==="textarea"?<textarea value={value||""} onChange={e=>onChange(e.target.value)} className="input" style={{height:75,resize:"vertical"}}/>:<input type={type} value={value||""} onChange={e=>onChange(e.target.value)} className="input"/>}
      {hint&&<div style={{fontSize:11,color:T.muted,marginTop:3}}>{hint}</div>}
    </div>
  );
  return(
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <h2 style={{fontSize:20,fontWeight:700,color:T.text}}>SEO Manager</h2>
        <div style={{display:"flex",gap:8}}>
          <button onClick={runAudit} disabled={auditing} className="btn btn-ghost" style={{padding:"9px 16px",borderRadius:9,fontSize:13,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:7}}>{auditing?<><Spinner size={13}/>Auditing...</>:"🔍 AI Audit"}</button>
          <button onClick={save} disabled={saving} className="btn btn-gold" style={{padding:"9px 18px",borderRadius:9,fontSize:13,display:"flex",alignItems:"center",gap:7}}>{saving?<><Spinner size={13} color="#fff"/>Saving...</>:"💾 Save SEO"}</button>
        </div>
      </div>
      {audit&&<div className="card" style={{padding:18,marginBottom:18,border:"1px solid rgba(96,165,250,0.3)"}}><div style={{fontSize:13,fontWeight:700,color:T.blue,marginBottom:8}}>AI SEO Audit</div><pre style={{fontSize:12,color:T.text,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"'Outfit',sans-serif"}}>{audit}</pre></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div>
          <div className="card" style={{padding:18,marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:12}}>Global SEO</div>
            <F label="Site Title" value={seo.siteTitle} onChange={v=>setSeo(s=>({...s,siteTitle:v}))} maxLen={60}/>
            <F label="Meta Description" value={seo.siteDesc} onChange={v=>setSeo(s=>({...s,siteDesc:v}))} type="textarea" maxLen={155}/>
            <F label="Keywords" value={seo.keywords} onChange={v=>setSeo(s=>({...s,keywords:v}))}/>
            <F label="Google Analytics ID" value={seo.googleAnalytics} onChange={v=>setSeo(s=>({...s,googleAnalytics:v}))} hint="e.g. G-XXXXXXXXXX"/>
          </div>
          <div className="card" style={{padding:18}}>
            <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:10}}>SEO Checklist</div>
            {[[!!seo.siteTitle&&seo.siteTitle.length<=60,"Site title ≤60 chars"],[!!seo.siteDesc&&seo.siteDesc.length<=155,"Meta desc ≤155 chars"],[!!seo.googleAnalytics,"Google Analytics connected"],[!!seo.schemaAgent,"Schema markup enabled"],[!!seo.canonicalBase,"Canonical URL set"]].map(([pass,label])=>(
              <div key={label} style={{display:"flex",gap:8,alignItems:"center",marginBottom:7}}><span>{pass?"✅":"❌"}</span><span style={{fontSize:12,color:pass?T.text:T.muted}}>{label}</span></div>
            ))}
          </div>
        </div>
        <div className="card" style={{padding:18}}>
          <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:12}}>Page SEO</div>
          {Object.entries(seo.pages||{}).map(([page,data])=>(
            <div key={page} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:12,fontWeight:700,color:T.blue,marginBottom:8,textTransform:"capitalize"}}>/{page}</div>
              <F label="Title" value={data.title} onChange={v=>setSeo(s=>({...s,pages:{...s.pages,[page]:{...data,title:v}}}))} maxLen={60}/>
              <F label="Description" value={data.desc} onChange={v=>setSeo(s=>({...s,pages:{...s.pages,[page]:{...data,desc:v}}}))} type="textarea" maxLen={155}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
const SettingsPanel = ({settings,setSettings})=>{
  const [saving,setSaving]=useState(false);
  const save=async()=>{setSaving(true);await store.set("settings",settings);setSaving(false);alert("Settings saved ✓");};
  const F=({label,field,type="text",options,hint})=>(
    <div style={{marginBottom:13}}>
      <label style={{display:"block",fontSize:11,color:T.muted,fontWeight:600,marginBottom:4}}>{label}</label>
      {options?<select value={settings[field]||""} onChange={e=>setSettings(s=>({...s,[field]:e.target.value}))} className="input">{options.map(o=><option key={o}>{o}</option>)}</select>
       :type==="textarea"?<textarea value={settings[field]||""} onChange={e=>setSettings(s=>({...s,[field]:e.target.value}))} className="input" style={{height:80,resize:"vertical"}}/>
       :<input type={type} value={settings[field]||""} onChange={e=>setSettings(s=>({...s,[field]:e.target.value}))} className="input"/>}
      {hint&&<div style={{fontSize:10,color:T.muted,marginTop:2}}>{hint}</div>}
    </div>
  );
  return(
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:700,color:T.text}}>Settings</h2>
        <button onClick={save} disabled={saving} className="btn btn-gold" style={{padding:"10px 20px",borderRadius:9,fontSize:13,display:"flex",alignItems:"center",gap:7}}>{saving?<><Spinner size={14} color="#fff"/>Saving...</>:"💾 Save"}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div className="card" style={{padding:18}}>
          <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:12}}>Agent Profile (RECO Mandatory)</div>
          <F label="Registered Name" field="agentName"/><F label="Registration Category" field="title" options={["Sales Representative","Broker","Real Estate Salesperson"]}/>
          <F label="Brokerage (exact RECO name)" field="brokerage" hint="Must include 'Brokerage'"/>
          <F label="Phone" field="phone" type="tel"/><F label="Email" field="email" type="email"/><F label="Website" field="website" type="url"/>
          <F label="Languages" field="languages"/><F label="Awards" field="awards"/>
        </div>
        <div>
          <div className="card" style={{padding:18,marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:12}}>Site Config</div>
            <F label="Site Mode" field="siteMode" options={["demo","live"]} hint="Demo = sample data. Live = real TRREB listings only."/>
            <F label="WhatsApp (no + or spaces)" field="whatsapp"/><F label="Calendly URL" field="calendly" type="url"/>
            <div style={{marginBottom:13}}>
              <label style={{display:"block",fontSize:11,color:T.muted,fontWeight:600,marginBottom:6}}>Brand Color</label>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <input type="color" value={settings.brandColor||"#C49A3C"} onChange={e=>setSettings(s=>({...s,brandColor:e.target.value}))} style={{width:44,height:34,border:`1px solid ${T.border}`,borderRadius:7,cursor:"pointer",background:"none"}}/>
                <input value={settings.brandColor||"#C49A3C"} onChange={e=>setSettings(s=>({...s,brandColor:e.target.value}))} className="input" style={{flex:1}}/>
              </div>
            </div>
          </div>
          <div className="card" style={{padding:18}}>
            <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:10}}>Compliance Status</div>
            {[[true,"RECO category displayed"],[true,"Brokerage name on all pages"],[true,"CASL on all lead forms"],[true,"PIPEDA privacy policy"],[true,"TRREB sample data disclaimer"],[!!settings.calendly,"Calendly connected"]].map(([pass,label])=>(
              <div key={label} style={{display:"flex",gap:8,marginBottom:7}}><span>{pass?"✅":"⚠️"}</span><span style={{fontSize:12,color:pass?T.text:T.muted}}>{label}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const LoginScreen = ({onLogin})=>{
  const [pass,setPass]=useState("");const [err,setErr]=useState("");
  const attempt=async()=>{const stored=await store.get("dashpass")||"hamza2025";if(pass===stored)onLogin();else{setErr("Incorrect password.");setPass("");}};
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg}}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"40px 36px",width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{width:52,height:52,background:`linear-gradient(135deg,${T.gold},#A07820)`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 16px",boxShadow:`0 0 30px rgba(196,154,60,0.3)`}}>◈</div>
        <h1 style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:4}}>Admin Dashboard</h1>
        <p style={{fontSize:13,color:T.muted,marginBottom:24}}>mississaugainvestor.ca</p>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&attempt()} className="input" placeholder="Enter password" style={{marginBottom:12,textAlign:"center",letterSpacing:"0.1em"}} autoFocus/>
        {err&&<div style={{color:T.red,fontSize:12,marginBottom:10}}>{err}</div>}
        <button onClick={attempt} className="btn btn-gold" style={{width:"100%",padding:12,borderRadius:10,fontSize:15}}>Enter Dashboard</button>
        <p style={{fontSize:11,color:T.muted,marginTop:12}}>Default: hamza2025 · Change in Settings</p>
      </div>
    </div>
  );
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [loggedIn,setLoggedIn]=useState(false);
  const [section,setSection]=useState("dashboard");
  const [listings,setListings]=useState(DEFAULT_LISTINGS);
  const [blogs,setBlogs]=useState(DEFAULT_BLOGS);
  const [leads,setLeads]=useState(DEFAULT_LEADS);
  const [seo,setSeo]=useState(DEFAULT_SEO);
  const [settings,setSettings]=useState(DEFAULT_SETTINGS);
  const [siteImages,setSiteImages]=useState(DEFAULT_SITE_IMAGES);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      const [sl,sb,sle,ss,sse,si]=await Promise.all([
        store.get("listings"),store.get("blogs"),store.get("leads"),
        store.get("settings"),store.get("seo"),store.get("siteImages")
      ]);
      if(sl)setListings(sl);if(sb)setBlogs(sb);if(sle)setLeads(sle);
      if(ss)setSettings(ss);if(sse)setSeo(sse);if(si)setSiteImages(si);
      setLoading(false);
    })();
  },[]);

  if(loading)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg}}><Spinner size={32}/></div>;
  if(!loggedIn)return <><style>{G}</style><LoginScreen onLogin={()=>setLoggedIn(true)}/></>;

  const NAV=[
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"listings",icon:"🏠",label:"Listings",badge:listings.length},
    {id:"blogs",icon:"✍️",label:"Blog",badge:blogs.filter(b=>b.status==="draft").length||null},
    {id:"leads",icon:"👥",label:"Leads",badge:leads.length},
    {id:"media",icon:"📸",label:"Site Images"},
    {id:"seo",icon:"🔍",label:"SEO"},
    {id:"settings",icon:"⚙️",label:"Settings"},
  ];

  return(
    <>
      <style>{G}</style>
      <div style={{display:"flex",minHeight:"100vh",background:T.bg}}>
        {/* Sidebar */}
        <aside style={{width:210,background:T.surface,borderRight:`1px solid ${T.border}`,padding:"18px 10px",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:9,padding:"0 6px",marginBottom:24}}>
            <div style={{width:30,height:30,background:`linear-gradient(135deg,${T.gold},#A07820)`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>◈</div>
            <div><div style={{fontSize:12,fontWeight:700,color:T.text,lineHeight:1.2}}>MI Admin</div><div style={{fontSize:10,color:T.muted}}>mississaugainvestor.ca</div></div>
          </div>
          <nav style={{flex:1}}>
            {NAV.map(s=>(
              <div key={s.id} className={`nav-item${section===s.id?" active":""}`} onClick={()=>setSection(s.id)}>
                <span style={{fontSize:15}}>{s.icon}</span>
                <span style={{flex:1}}>{s.label}</span>
                {s.badge>0&&<span style={{background:section===s.id?T.gold:"rgba(255,255,255,0.1)",color:section===s.id?"#000":T.muted,fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:8,minWidth:18,textAlign:"center"}}>{s.badge}</span>}
              </div>
            ))}
          </nav>
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,marginTop:12}}>
            <a href="https://mississauga-deals.vercel.app" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px",borderRadius:8,background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.15)",textDecoration:"none",marginBottom:6}}>
              <span style={{fontSize:7,color:T.green}}>●</span><span style={{fontSize:12,color:T.green,fontWeight:600}}>View Live Site</span>
            </a>
            <div className="nav-item" onClick={()=>setLoggedIn(false)} style={{color:T.red}}><span>🚪</span><span>Log Out</span></div>
          </div>
        </aside>
        {/* Main */}
        <main style={{flex:1,padding:"26px 28px",overflow:"auto",minWidth:0}}>
          {section==="dashboard"&&<DashboardHome listings={listings} blogs={blogs} leads={leads} settings={settings} siteImages={siteImages}/>}
          {section==="listings"&&<ListingsManager listings={listings} setListings={setListings}/>}
          {section==="blogs"&&<BlogManager blogs={blogs} setBlogs={setBlogs}/>}
          {section==="leads"&&<LeadsManager leads={leads} setLeads={setLeads} settings={settings}/>}
          {section==="media"&&<SiteImageManager siteImages={siteImages} setSiteImages={setSiteImages} listings={listings} setListings={setListings} blogs={blogs} setBlogs={setBlogs}/>}
          {section==="seo"&&<SEOManager seo={seo} setSeo={setSeo}/>}
          {section==="settings"&&<SettingsPanel settings={settings} setSettings={setSettings}/>}
        </main>
      </div>
    </>
  );
}
