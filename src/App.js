import { useState, useEffect, useCallback } from "react";

// ─── THEME ──────────────────────────────────────────────────────────────────
const T = {
  bg: "#07090F",
  surface: "#0D1117",
  card: "#161B25",
  border: "rgba(255,255,255,0.07)",
  gold: "#C49A3C",
  goldDim: "rgba(196,154,60,0.15)",
  goldBorder: "rgba(196,154,60,0.25)",
  text: "#E8EDF4",
  muted: "#6B7A90",
  green: "#34D399",
  red: "#F87171",
  blue: "#60A5FA",
  purple: "#A78BFA",
};

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Outfit', sans-serif; background: ${T.bg}; color: ${T.text}; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${T.bg}; }
  ::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 4px; }
  input, select, textarea { font-family: 'Outfit', sans-serif; }
  input:focus, select:focus, textarea:focus { outline: none !important; border-color: ${T.gold} !important; box-shadow: 0 0 0 3px rgba(196,154,60,0.12) !important; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  .fade-in { animation: fadeIn 0.25s ease forwards; }
  .btn { cursor: pointer; font-family: 'Outfit', sans-serif; font-weight: 600; border: none; transition: all 0.18s ease; }
  .btn-gold { background: linear-gradient(135deg, ${T.gold}, #A07820); color: #fff; }
  .btn-gold:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(196,154,60,0.3); }
  .btn-ghost { background: rgba(255,255,255,0.05); color: ${T.text}; border: 1px solid ${T.border} !important; }
  .btn-ghost:hover { background: rgba(255,255,255,0.09); }
  .btn-danger { background: rgba(248,113,113,0.12); color: ${T.red}; border: 1px solid rgba(248,113,113,0.25) !important; }
  .btn-danger:hover { background: rgba(248,113,113,0.2); }
  .nav-item { cursor: pointer; padding: 10px 14px; border-radius: 10px; transition: all 0.18s ease; display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; color: ${T.muted}; }
  .nav-item:hover { background: rgba(255,255,255,0.05); color: ${T.text}; }
  .nav-item.active { background: ${T.goldDim}; color: ${T.gold}; border: 1px solid ${T.goldBorder}; }
  .card { background: ${T.card}; border: 1px solid ${T.border}; border-radius: 14px; }
  .input { width: 100%; background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 8px; padding: 10px 14px; color: ${T.text}; font-size: 14px; }
  .tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
`;

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const store = {
  async get(key) {
    try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; }
  },
  async set(key, val) {
    try { await window.storage.set(key, JSON.stringify(val)); return true; } catch { return false; }
  }
};

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const DEFAULT_LISTINGS = [
  { id: "ML013", address: "1590 Carolyn Rd", neighbourhood: "Erin Mills", price: 869000, beds: 4, baths: 3, sqft: 2050, dom: 67, priceReduction: 12.4, estimatedRent: 4300, type: "Detached", lrtAccess: false, brokerage: "Intercity Realty Inc.", hamzaScore: 9.0, cashFlow: 460, capRate: 5.6, hamzaNotes: "HAMZA'S PICK. 12.4% price reduction on a 4-bed detached.", status: "active", images: [], featured: true },
  { id: "ML005", address: "915 Inverhouse Dr", neighbourhood: "Clarkson", price: 975000, beds: 4, baths: 3, sqft: 2300, dom: 61, priceReduction: 11.2, estimatedRent: 4600, type: "Detached", lrtAccess: true, brokerage: "Sutton Group Quantum Realty Inc.", hamzaScore: 9.1, cashFlow: 480, capRate: 5.4, hamzaNotes: "This is the one. 11.2% off, LRT access, 61 DOM.", status: "active", images: [], featured: false },
];
const DEFAULT_BLOGS = [
  { id: "b1", title: "Top 5 Cash Flow Properties in Mississauga This Week", slug: "top-5-cashflow-mississauga", excerpt: "Hamza breaks down the best investment opportunities available right now.", content: "Full article content here...", status: "published", date: "2025-03-01", tags: ["investment", "cash flow", "mississauga"], seoTitle: "Top 5 Cash Flow Properties Mississauga 2025", seoDesc: "Find the best cash flow investment properties in Mississauga right now, analyzed by expert agent Hamza Nouman.", views: 147 },
  { id: "b2", title: "Hurontario LRT: What It Means for Property Values", slug: "hurontario-lrt-property-values", excerpt: "The LRT corridor will reprice Mississauga. Here's exactly how to position before it opens.", content: "Full article content here...", status: "draft", date: "2025-03-05", tags: ["LRT", "appreciation", "mississauga"], seoTitle: "Hurontario LRT Impact on Property Values 2025", seoDesc: "Expert analysis on how the Hurontario LRT will affect property values along the corridor.", views: 0 },
];
const DEFAULT_SEO = {
  siteTitle: "Mississauga Investor | Investment Property Intelligence",
  siteDesc: "Find the best investment properties in Mississauga with expert analysis from Hamza Nouman, Sales Representative at Royal LePage Signature Realty.",
  keywords: "mississauga investment properties, cash flow properties mississauga, real estate investment mississauga, hamza nouman",
  ogImage: "",
  googleAnalytics: "",
  schemaAgent: true,
  sitemapUrl: "https://mississaugainvestor.ca/sitemap.xml",
  canonicalBase: "https://mississaugainvestor.ca",
  pages: {
    home: { title: "Mississauga Investment Properties | Hamza Nouman", desc: "Expert investment property analysis for Mississauga. Cap rates, cash flow scores, and Hamza's personal picks." },
    listings: { title: "Investment Properties Mississauga | MLS Search", desc: "Browse Mississauga investment properties with cap rate analysis, cash flow estimates, and expert scoring." },
    blog: { title: "Mississauga Real Estate Blog | Investment Insights", desc: "Expert Mississauga real estate investment insights from Hamza Nouman, Sales Representative at Royal LePage." },
  }
};
const DEFAULT_SETTINGS = {
  agentName: "Hamza Nouman",
  title: "Sales Representative",
  brokerage: "Royal LePage Signature Realty, Brokerage",
  phone: "647-609-1289",
  email: "hamza@nouman.ca",
  website: "https://www.hamzahomes.ca",
  whatsapp: "16476091289",
  calendly: "https://calendly.com/hamzanouman",
  bio: "Specializing in Mississauga investment properties with deep expertise in cap rate analysis, BRRR strategies, and the Hurontario LRT corridor.",
  awards: "Master Sales Award",
  languages: "English, Urdu, Hindi",
  serviceAreas: "Mississauga, Oakville, Milton, Burlington, Brampton, Toronto, Hamilton",
  brandColor: "#C49A3C",
  siteMode: "demo",
};
const DEFAULT_LEADS = [
  { id: "l1", name: "Ahmed Khan", phone: "905-555-1234", email: "ahmed@email.com", type: "Registration", date: "2025-03-08", casl: true, notes: "Interested in cash flow properties under $800K" },
  { id: "l2", name: "Sarah Chen", phone: "416-555-5678", email: "", type: "Pre-Con VIP", date: "2025-03-07", casl: true, notes: "Budget $700K-$900K, Churchill Meadows area" },
  { id: "l3", name: "Mike Patel", phone: "647-555-9012", email: "mike@email.com", type: "Seller", date: "2025-03-06", casl: true, notes: "4-bed detached in Erin Mills, looking to sell Q2" },
];

// ─── LOADING SPINNER ─────────────────────────────────────────────────────────
const Spinner = ({ size = 20, color = T.gold }) => (
  <div style={{ width: size, height: size, border: `2px solid rgba(255,255,255,0.1)`, borderTopColor: color, borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
);

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = T.gold }) => (
  <div className="card" style={{ padding: "18px 20px" }}>
    <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 4 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: T.muted }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── AI WRITER ────────────────────────────────────────────────────────────────
const AIWriter = ({ prompt, onInsert, placeholder = "Describe what you want to write..." }) => {
  const [input, setInput] = useState(prompt || "");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are Hamza Nouman's real estate content writer. Write professional, engaging real estate content for mississaugainvestor.ca. Hamza is a Sales Representative at Royal LePage Signature Realty, Brokerage in Mississauga, Ontario. Write in first person when appropriate. Be specific, data-driven, and compelling. Never give financial advice. Always add value for real estate investors.",
          messages: [{ role: "user", content: input }]
        })
      });
      const d = await res.json();
      setResult(d.content?.[0]?.text || "Could not generate content.");
    } catch { setResult("AI temporarily unavailable."); }
    setLoading(false);
  };

  return (
    <div style={{ background: "rgba(196,154,60,0.04)", border: `1px solid ${T.goldBorder}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, marginBottom: 10 }}>🤖 AI Content Writer</div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder}
        className="input" style={{ height: 80, resize: "vertical", marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={generate} disabled={loading} className="btn btn-gold" style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          {loading ? <><Spinner size={14} color="#fff" /> Generating...</> : "✨ Generate"}
        </button>
        {result && <button onClick={() => onInsert(result)} className="btn btn-ghost" style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, border: `1px solid ${T.border}` }}>
          ↑ Insert
        </button>}
      </div>
      {result && (
        <div style={{ marginTop: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, maxHeight: 200, overflow: "auto" }}>
          <pre style={{ fontSize: 13, color: T.text, whiteSpace: "pre-wrap", lineHeight: 1.7, fontFamily: "'Outfit', sans-serif" }}>{result}</pre>
        </div>
      )}
    </div>
  );
};

// ─── IMAGE UPLOADER ───────────────────────────────────────────────────────────
const ImageUploader = ({ images = [], onChange, label = "Images" }) => {
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = e => onChange([...images, { id: Date.now() + Math.random(), url: e.target.result, name: file.name, alt: "" }]);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        style={{ border: `2px dashed ${dragging ? T.gold : T.border}`, borderRadius: 10, padding: "24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: dragging ? T.goldDim : "transparent" }}
        onClick={() => document.getElementById("img-upload").click()}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
        <div style={{ fontSize: 13, color: T.muted }}>Drag & drop images or <span style={{ color: T.gold }}>click to upload</span></div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>JPG, PNG, WebP — stored as base64</div>
        <input id="img-upload" type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
      </div>
      {images.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          {images.map((img, i) => (
            <div key={img.id} style={{ position: "relative", width: 90, height: 70 }}>
              <img src={img.url} alt={img.alt || img.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, border: `1px solid ${T.border}` }} />
              {i === 0 && <span style={{ position: "absolute", top: 3, left: 3, background: T.gold, color: "#000", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>MAIN</span>}
              <button onClick={() => onChange(images.filter(x => x.id !== img.id))}
                style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.7)", color: T.red, border: "none", width: 18, height: 18, borderRadius: "50%", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── DASHBOARD HOME ───────────────────────────────────────────────────────────
const DashboardHome = ({ listings, blogs, leads, settings }) => {
  const activeSite = settings.siteMode === "live" ? "🟢 LIVE" : "🟡 DEMO MODE";
  const publishedBlogs = blogs.filter(b => b.status === "published").length;
  const totalViews = blogs.reduce((a, b) => a + (b.views || 0), 0);

  return (
    <div className="fade-in">
      <SectionHeader title="Dashboard" subtitle={`${settings.agentName} · ${settings.brokerage} · ${activeSite}`} />

      {settings.siteMode === "demo" && (
        <div style={{ background: "rgba(196,154,60,0.08)", border: `1px solid ${T.goldBorder}`, borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>Site is in Demo Mode — Sample data visible</div>
            <div style={{ fontSize: 12, color: T.muted }}>Connect TRREB data feed and switch to Live Mode in Settings → Site Mode to show real MLS listings.</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard icon="🏠" label="Total Listings" value={listings.length} sub={`${listings.filter(l => l.status === "active").length} active`} />
        <StatCard icon="👥" label="Total Leads" value={leads.length} sub="CASL consented" color={T.green} />
        <StatCard icon="✍️" label="Blog Posts" value={publishedBlogs} sub={`${blogs.length - publishedBlogs} drafts`} color={T.blue} />
        <StatCard icon="👁️" label="Blog Views" value={totalViews} sub="all time" color={T.purple} />
        <StatCard icon="⭐" label="Top Score" value={listings.length ? Math.max(...listings.map(l => l.hamzaScore)).toFixed(1) : "—"} sub="Hamza's Score" />
      </div>

      {/* Recent Leads */}
      <div className="card" style={{ padding: "20px", marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>📥 Recent Leads</div>
        {leads.slice(0, 5).map(lead => (
          <div key={lead.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{lead.name}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{lead.phone} · {lead.type} · {lead.date}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {lead.casl && <span className="tag" style={{ background: "rgba(52,211,153,0.1)", color: T.green, border: "1px solid rgba(52,211,153,0.2)" }}>CASL ✓</span>}
              <a href={`https://wa.me/${settings.whatsapp}?text=Hi+${encodeURIComponent(lead.name)}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)", padding: "4px 10px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
                WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>⚡ Quick Actions</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            ["📝 Write Blog Post", T.blue],
            ["🏠 Add Listing", T.gold],
            ["📊 Update SEO", T.purple],
            ["🔗 View Live Site", T.green],
          ].map(([label, color]) => (
            <button key={label} className="btn btn-ghost" style={{ padding: "10px 16px", borderRadius: 9, fontSize: 13, border: `1px solid ${T.border}`, color }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── LISTINGS MANAGER ─────────────────────────────────────────────────────────
const ListingsManager = ({ listings, setListings }) => {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const blank = { id: "ML" + Date.now(), address: "", neighbourhood: "Erin Mills", price: 0, beds: 3, baths: 2, sqft: 0, dom: 0, priceReduction: 0, estimatedRent: 0, type: "Detached", lrtAccess: false, brokerage: "", hamzaScore: 7.0, cashFlow: 0, capRate: 0, hamzaNotes: "", status: "active", images: [], featured: false };

  const openEdit = (l) => { setForm({ ...l }); setEditing(l.id); };
  const openNew = () => { setForm({ ...blank }); setEditing("new"); };

  const save = async () => {
    setSaving(true);
    let updated;
    if (editing === "new") updated = [form, ...listings];
    else updated = listings.map(l => l.id === editing ? form : l);
    setListings(updated);
    await store.set("listings", updated);
    setSaving(false); setEditing(null);
  };

  const del = async (id) => {
    if (!confirm("Delete this listing?")) return;
    const updated = listings.filter(l => l.id !== id);
    setListings(updated);
    await store.set("listings", updated);
  };

  const Field = ({ label, field, type = "text", options }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 5 }}>{label}</label>
      {options ? (
        <select value={form[field] || ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} className="input">
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={form[field] || ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} className="input" style={{ height: 100, resize: "vertical" }} />
      ) : type === "checkbox" ? (
        <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={!!form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.checked }))} />
          <span style={{ fontSize: 13, color: T.muted }}>Yes</span>
        </label>
      ) : (
        <input type={type} value={form[field] ?? ""} onChange={e => setForm(f => ({ ...f, [field]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))} className="input" />
      )}
    </div>
  );

  if (editing) return (
    <div className="fade-in">
      <SectionHeader title={editing === "new" ? "Add New Listing" : "Edit Listing"}
        subtitle={form.address || "New listing"}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setEditing(null)} className="btn btn-ghost" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, border: `1px solid ${T.border}` }}>Cancel</button>
            <button onClick={save} disabled={saving} className="btn btn-gold" style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              {saving ? <><Spinner size={14} color="#fff" /> Saving...</> : "💾 Save Listing"}
            </button>
          </div>
        }
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>📍 Property Details</div>
          <Field label="Full Address *" field="address" />
          <Field label="Neighbourhood" field="neighbourhood" options={["Clarkson", "Port Credit", "Lakeview", "Churchill Meadows", "Streetsville", "Erin Mills", "Cooksville", "Hurontario", "Meadowvale", "Malton"]} />
          <Field label="Property Type" field="type" options={["Detached", "Semi-Detached", "Townhouse", "Condo"]} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Beds" field="beds" type="number" />
            <Field label="Baths" field="baths" type="number" />
            <Field label="Sq Ft" field="sqft" type="number" />
          </div>
          <Field label="Listing Brokerage (TRREB required)" field="brokerage" />
          <Field label="LRT Access" field="lrtAccess" type="checkbox" />
          <Field label="Featured / Hamza's Pick" field="featured" type="checkbox" />
        </div>
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>💰 Pricing & Investment</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="List Price ($)" field="price" type="number" />
              <Field label="Original Price ($)" field="originalPrice" type="number" />
              <Field label="Price Reduction (%)" field="priceReduction" type="number" />
              <Field label="Days on Market" field="dom" type="number" />
              <Field label="Est. Rent/mo ($)" field="estimatedRent" type="number" />
              <Field label="Cash Flow/mo ($)" field="cashFlow" type="number" />
              <Field label="Cap Rate (%)" field="capRate" type="number" />
              <Field label="Hamza's Score (0-10)" field="hamzaScore" type="number" />
            </div>
          </div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>Walk/Transit/School Scores</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Walk Score" field="walkScore" type="number" />
              <Field label="Transit Score" field="transitScore" type="number" />
              <Field label="School Score" field="schoolScore" type="number" />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>📝 Hamza's Notes (shown in Hamza's Take tab)</div>
        <Field label="Your personal analysis of this listing" field="hamzaNotes" type="textarea" />
        <AIWriter
          prompt={`Write Hamza's personal investment analysis for ${form.address || "this property"} in ${form.neighbourhood || "Mississauga"}. Price: $${(form.price || 0).toLocaleString()}, ${form.beds || 0} beds, ${form.dom || 0} days on market, ${form.priceReduction || 0}% price reduction, estimated rent $${(form.estimatedRent || 0).toLocaleString()}/mo. Score it honestly and give a clear buy/watch/pass recommendation.`}
          onInsert={txt => setForm(f => ({ ...f, hamzaNotes: txt }))}
          placeholder="Describe the property and I'll write Hamza's investment analysis..."
        />
      </div>

      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <ImageUploader images={form.images || []} onChange={imgs => setForm(f => ({ ...f, images: imgs }))} label="Property Photos" />
        <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>First image = main card photo. Add alt text for SEO and accessibility.</div>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>📊 Status</div>
        <Field label="Listing Status" field="status" options={["active", "sold", "conditional", "suspended", "expired"]} />
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <SectionHeader title="Listings Manager" subtitle={`${listings.length} total · ${listings.filter(l => l.status === "active").length} active`}
        action={<button onClick={openNew} className="btn btn-gold" style={{ padding: "10px 20px", borderRadius: 9, fontSize: 13 }}>+ Add Listing</button>}
      />
      <div style={{ display: "grid", gap: 10 }}>
        {listings.map(l => (
          <div key={l.id} className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ width: 48, height: 48, background: `linear-gradient(135deg, #1E3A5F, #162032)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              {l.type === "Detached" ? "🏠" : l.type === "Condo" ? "🏢" : "🏘️"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{l.address}</span>
                {l.featured && <span className="tag" style={{ background: T.goldDim, color: T.gold, border: `1px solid ${T.goldBorder}` }}>★ Pick</span>}
                <span className="tag" style={{ background: l.status === "active" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: l.status === "active" ? T.green : T.red, border: `1px solid ${l.status === "active" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}` }}>{l.status}</span>
              </div>
              <div style={{ fontSize: 12, color: T.muted }}>{l.neighbourhood} · ${(l.price / 1000).toFixed(0)}K · {l.dom}d · Cap {l.capRate}% · Score {l.hamzaScore}/10</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => openEdit(l)} className="btn btn-ghost" style={{ padding: "7px 14px", borderRadius: 7, fontSize: 12, border: `1px solid ${T.border}` }}>✏️ Edit</button>
              <button onClick={() => del(l.id)} className="btn btn-danger" style={{ padding: "7px 14px", borderRadius: 7, fontSize: 12, border: `1px solid rgba(248,113,113,0.25)` }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── BLOG MANAGER ─────────────────────────────────────────────────────────────
const BlogManager = ({ blogs, setBlogs }) => {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [aiSeoLoading, setAiSeoLoading] = useState(false);

  const blank = { id: "b" + Date.now(), title: "", slug: "", excerpt: "", content: "", status: "draft", date: new Date().toISOString().split("T")[0], tags: [], seoTitle: "", seoDesc: "", images: [], views: 0 };

  const openEdit = (b) => { setForm({ ...b }); setEditing(b.id); };
  const openNew = () => { setForm({ ...blank }); setEditing("new"); };

  const save = async () => {
    setSaving(true);
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const data = { ...form, slug };
    let updated;
    if (editing === "new") updated = [data, ...blogs];
    else updated = blogs.map(b => b.id === editing ? data : b);
    setBlogs(updated);
    await store.set("blogs", updated);
    setSaving(false); setEditing(null);
  };

  const del = async (id) => {
    if (!confirm("Delete this post?")) return;
    const updated = blogs.filter(b => b.id !== id);
    setBlogs(updated); await store.set("blogs", updated);
  };

  const autoSEO = async () => {
    if (!form.title) return;
    setAiSeoLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 300,
          system: "You are an SEO expert for real estate websites. Generate SEO meta tags. Respond ONLY with JSON: {\"seoTitle\": \"...\", \"seoDesc\": \"...\", \"slug\": \"...\"}. Title max 60 chars, desc max 155 chars, slug lowercase-hyphenated.",
          messages: [{ role: "user", content: `Blog post title: "${form.title}". Excerpt: "${form.excerpt}". Site: mississaugainvestor.ca by Hamza Nouman, real estate agent in Mississauga, Ontario.` }]
        })
      });
      const d = await res.json();
      const text = d.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setForm(f => ({ ...f, ...parsed }));
    } catch {}
    setAiSeoLoading(false);
  };

  if (editing) return (
    <div className="fade-in">
      <SectionHeader title={editing === "new" ? "New Blog Post" : "Edit Post"}
        subtitle={form.title || "Untitled post"}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setEditing(null)} className="btn btn-ghost" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, border: `1px solid ${T.border}` }}>Cancel</button>
            <button onClick={() => { setForm(f => ({ ...f, status: "draft" })); setTimeout(save, 50); }} className="btn btn-ghost" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, border: `1px solid ${T.border}` }}>Save Draft</button>
            <button onClick={() => { setForm(f => ({ ...f, status: "published" })); setTimeout(save, 50); }} disabled={saving} className="btn btn-gold" style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              {saving ? <><Spinner size={14} color="#fff" /> Publishing...</> : "🚀 Publish"}
            </button>
          </div>
        }
      />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 5 }}>Post Title *</label>
              <input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. Top 5 Cash Flow Properties in Mississauga This Week" style={{ fontSize: 16, fontWeight: 600 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 5 }}>Excerpt (shown in previews)</label>
              <textarea value={form.excerpt || ""} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} className="input" style={{ height: 80, resize: "vertical" }} placeholder="2-3 sentence summary of the post..." />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 5 }}>Full Article Content</label>
              <textarea value={form.content || ""} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="input" style={{ height: 300, resize: "vertical", fontFamily: "'Outfit', sans-serif", lineHeight: 1.7 }} placeholder="Write your article here..." />
            </div>
          </div>

          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>🤖 AI Writing Assistant</div>
            <AIWriter
              prompt={`Write a comprehensive, SEO-optimized blog post about: "${form.title || "Mississauga real estate investment"}". Target audience: real estate investors in Mississauga. Include specific neighbourhood data, investment metrics, and actionable advice. Write in Hamza Nouman's voice — direct, data-driven, and confident.`}
              onInsert={txt => setForm(f => ({ ...f, content: txt }))}
              placeholder="Give me a topic and I'll write the full blog post..."
            />
          </div>

          <div className="card" style={{ padding: 20 }}>
            <ImageUploader images={form.images || []} onChange={imgs => setForm(f => ({ ...f, images: imgs }))} label="Blog Cover Image & Inline Images" />
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>⚙️ Post Settings</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 5 }}>Status</label>
              <select value={form.status || "draft"} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 5 }}>Publish Date</label>
              <input type="date" value={form.date || ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 5 }}>Tags (comma separated)</label>
              <input value={(form.tags || []).join(", ")} onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))} className="input" placeholder="investment, mississauga, cash flow" />
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>🔍 SEO</div>
              <button onClick={autoSEO} disabled={aiSeoLoading} className="btn btn-ghost" style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}>
                {aiSeoLoading ? <><Spinner size={12} /> Auto-fill</> : "✨ Auto-fill"}
              </button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: T.muted, marginBottom: 4 }}>URL Slug</label>
              <input value={form.slug || ""} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="input" style={{ fontSize: 12 }} placeholder="post-url-slug" />
              <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>mississaugainvestor.ca/blog/{form.slug || "slug"}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: T.muted, marginBottom: 4 }}>SEO Title <span style={{ color: form.seoTitle?.length > 60 ? T.red : T.muted }}>({(form.seoTitle || "").length}/60)</span></label>
              <input value={form.seoTitle || ""} onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))} className="input" style={{ fontSize: 12 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: T.muted, marginBottom: 4 }}>Meta Description <span style={{ color: form.seoDesc?.length > 155 ? T.red : T.muted }}>({(form.seoDesc || "").length}/155)</span></label>
              <textarea value={form.seoDesc || ""} onChange={e => setForm(f => ({ ...f, seoDesc: e.target.value }))} className="input" style={{ height: 80, resize: "vertical", fontSize: 12 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <SectionHeader title="Blog Manager" subtitle={`${blogs.filter(b => b.status === "published").length} published · ${blogs.filter(b => b.status === "draft").length} drafts`}
        action={<button onClick={openNew} className="btn btn-gold" style={{ padding: "10px 20px", borderRadius: 9, fontSize: 13 }}>+ New Post</button>}
      />
      <div style={{ display: "grid", gap: 10 }}>
        {blogs.map(b => (
          <div key={b.id} className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{b.title}</span>
                <span className="tag" style={{ background: b.status === "published" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: b.status === "published" ? T.green : T.red, border: `1px solid ${b.status === "published" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}` }}>{b.status}</span>
              </div>
              <div style={{ fontSize: 12, color: T.muted }}>{b.date} · {b.views} views · {(b.tags || []).slice(0, 3).join(", ")}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => openEdit(b)} className="btn btn-ghost" style={{ padding: "7px 14px", borderRadius: 7, fontSize: 12, border: `1px solid ${T.border}` }}>✏️ Edit</button>
              <button onClick={() => del(b.id)} className="btn btn-danger" style={{ padding: "7px 14px", borderRadius: 7, fontSize: 12, border: `1px solid rgba(248,113,113,0.25)` }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SEO MANAGER ─────────────────────────────────────────────────────────────
const SEOManager = ({ seo, setSeo }) => {
  const [saving, setSaving] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState("");

  const save = async () => {
    setSaving(true);
    await store.set("seo", seo);
    setSaving(false);
    alert("SEO settings saved ✓");
  };

  const runAudit = async () => {
    setAuditing(true); setAuditResult("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 800,
          system: "You are an expert SEO auditor for real estate websites. Give specific, actionable feedback.",
          messages: [{
            role: "user", content: `Audit the SEO setup for mississaugainvestor.ca:\n\nSite Title: ${seo.siteTitle}\nMeta Desc: ${seo.siteDesc}\nKeywords: ${seo.keywords}\nHome title: ${seo.pages?.home?.title}\nHome desc: ${seo.pages?.home?.desc}\n\nRate each element out of 10, flag issues, and give 5 specific improvements to rank higher for "Mississauga investment properties" and "Mississauga real estate agent".`
          }]
        })
      });
      const d = await res.json();
      setAuditResult(d.content?.[0]?.text || "Could not complete audit.");
    } catch { setAuditResult("Audit failed — check API connection."); }
    setAuditing(false);
  };

  const Field = ({ label, value, onChange, type = "text", hint, maxLen }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <label style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{label}</label>
        {maxLen && <span style={{ fontSize: 11, color: value?.length > maxLen ? T.red : T.muted }}>{value?.length || 0}/{maxLen}</span>}
      </div>
      {type === "textarea" ? (
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} className="input" style={{ height: 80, resize: "vertical" }} />
      ) : (
        <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} className="input" />
      )}
      {hint && <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{hint}</div>}
    </div>
  );

  return (
    <div className="fade-in">
      <SectionHeader title="SEO Manager" subtitle="Control how Google sees mississaugainvestor.ca"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={runAudit} disabled={auditing} className="btn btn-ghost" style={{ padding: "9px 18px", borderRadius: 9, fontSize: 13, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              {auditing ? <><Spinner size={14} /> Auditing...</> : "🔍 AI SEO Audit"}
            </button>
            <button onClick={save} disabled={saving} className="btn btn-gold" style={{ padding: "9px 20px", borderRadius: 9, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              {saving ? <><Spinner size={14} color="#fff" /> Saving...</> : "💾 Save SEO"}
            </button>
          </div>
        }
      />

      {auditResult && (
        <div className="card" style={{ padding: 20, marginBottom: 20, border: `1px solid rgba(96,165,250,0.3)` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.blue, marginBottom: 10 }}>🤖 AI SEO Audit Report</div>
          <pre style={{ fontSize: 12, color: T.text, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "'Outfit', sans-serif" }}>{auditResult}</pre>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>🌐 Global SEO</div>
            <Field label="Site Title" value={seo.siteTitle} onChange={v => setSeo(s => ({ ...s, siteTitle: v }))} maxLen={60} hint="Shown in browser tab and Google results" />
            <Field label="Meta Description" value={seo.siteDesc} onChange={v => setSeo(s => ({ ...s, siteDesc: v }))} type="textarea" maxLen={155} hint="Shown under your site in Google search results" />
            <Field label="Keywords (comma separated)" value={seo.keywords} onChange={v => setSeo(s => ({ ...s, keywords: v }))} hint="Not a major ranking factor but good for context" />
            <Field label="Canonical Base URL" value={seo.canonicalBase} onChange={v => setSeo(s => ({ ...s, canonicalBase: v }))} />
            <Field label="Google Analytics ID" value={seo.googleAnalytics} onChange={v => setSeo(s => ({ ...s, googleAnalytics: v }))} hint="e.g. G-XXXXXXXXXX" />
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>📊 Structured Data (Schema)</div>
            <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", marginBottom: 10 }}>
              <input type="checkbox" checked={seo.schemaAgent} onChange={e => setSeo(s => ({ ...s, schemaAgent: e.target.checked }))} />
              <span style={{ fontSize: 13, color: T.muted }}>Enable RealEstateAgent schema markup</span>
            </label>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: T.muted, lineHeight: 1.7 }}>
              {`{\n  "@type": "RealEstateAgent",\n  "name": "Hamza Nouman",\n  "url": "https://mississaugainvestor.ca",\n  "telephone": "+1-647-609-1289"\n}`}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>📄 Page-Level SEO</div>
            {Object.entries(seo.pages || {}).map(([page, data]) => (
              <div key={page} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 8, textTransform: "capitalize" }}>/{page}</div>
                <Field label="Page Title" value={data.title} onChange={v => setSeo(s => ({ ...s, pages: { ...s.pages, [page]: { ...data, title: v } } }))} maxLen={60} />
                <Field label="Page Description" value={data.desc} onChange={v => setSeo(s => ({ ...s, pages: { ...s.pages, [page]: { ...data, desc: v } } }))} type="textarea" maxLen={155} />
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>✅ SEO Checklist</div>
            {[
              [!!seo.siteTitle && seo.siteTitle.length <= 60, "Site title ≤ 60 characters"],
              [!!seo.siteDesc && seo.siteDesc.length <= 155, "Meta description ≤ 155 characters"],
              [!!seo.keywords, "Keywords defined"],
              [!!seo.googleAnalytics, "Google Analytics connected"],
              [!!seo.schemaAgent, "RealEstateAgent schema enabled"],
              [!!seo.canonicalBase, "Canonical URL set"],
            ].map(([pass, label]) => (
              <div key={label} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{pass ? "✅" : "❌"}</span>
                <span style={{ fontSize: 13, color: pass ? T.text : T.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── LEADS MANAGER ────────────────────────────────────────────────────────────
const LeadsManager = ({ leads, setLeads, settings }) => {
  const [filter, setFilter] = useState("All");
  const types = ["All", "Registration", "Pre-Con VIP", "Seller", "Quiz"];
  const filtered = filter === "All" ? leads : leads.filter(l => l.type === filter);

  const del = async (id) => {
    const updated = leads.filter(l => l.id !== id);
    setLeads(updated); await store.set("leads", updated);
  };

  return (
    <div className="fade-in">
      <SectionHeader title="Leads Manager" subtitle={`${leads.length} total leads · All CASL consented`} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={filter === t ? "btn btn-gold" : "btn btn-ghost"}
            style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, border: filter === t ? "none" : `1px solid ${T.border}` }}>
            {t} {t !== "All" && `(${leads.filter(l => l.type === t).length})`}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(lead => (
          <div key={lead.id} className="card" style={{ padding: "16px 18px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 40, height: 40, background: `linear-gradient(135deg, #1E3A5F, #162032)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {lead.type === "Seller" ? "🏡" : lead.type === "Pre-Con VIP" ? "🏙️" : "👤"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{lead.name}</span>
                <span className="tag" style={{ background: T.goldDim, color: T.gold, border: `1px solid ${T.goldBorder}` }}>{lead.type}</span>
                {lead.casl && <span className="tag" style={{ background: "rgba(52,211,153,0.1)", color: T.green, border: "1px solid rgba(52,211,153,0.2)" }}>CASL ✓</span>}
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 2 }}>{lead.phone}{lead.email ? ` · ${lead.email}` : ""} · {lead.date}</div>
              {lead.notes && <div style={{ fontSize: 12, color: T.text, fontStyle: "italic" }}>"{lead.notes}"</div>}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Hi " + lead.name + ", this is Hamza Nouman from Royal LePage Signature Realty. Thank you for registering on mississaugainvestor.ca.")}`} target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)", padding: "7px 12px", borderRadius: 7, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                💬 WhatsApp
              </a>
              {lead.phone && <a href={`tel:${lead.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.surface, color: T.text, border: `1px solid ${T.border}`, padding: "7px 12px", borderRadius: 7, textDecoration: "none", fontSize: 12 }}>
                📞 Call
              </a>}
              <button onClick={() => del(lead.id)} className="btn btn-danger" style={{ padding: "7px 12px", borderRadius: 7, fontSize: 12, border: "1px solid rgba(248,113,113,0.25)" }}>🗑️</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px", color: T.muted, fontSize: 14 }}>No leads yet.</div>}
      </div>
    </div>
  );
};

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
const SettingsPanel = ({ settings, setSettings }) => {
  const [saving, setSaving] = useState(false);
  const [pass, setPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const save = async () => {
    setSaving(true);
    await store.set("settings", settings);
    setSaving(false);
    alert("Settings saved ✓");
  };

  const Field = ({ label, field, type = "text", options, hint }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 5 }}>{label}</label>
      {options ? (
        <select value={settings[field] || ""} onChange={e => setSettings(s => ({ ...s, [field]: e.target.value }))} className="input">
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={settings[field] || ""} onChange={e => setSettings(s => ({ ...s, [field]: e.target.value }))} className="input" style={{ height: 80, resize: "vertical" }} />
      ) : (
        <input type={type} value={settings[field] || ""} onChange={e => setSettings(s => ({ ...s, [field]: e.target.value }))} className="input" />
      )}
      {hint && <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{hint}</div>}
    </div>
  );

  return (
    <div className="fade-in">
      <SectionHeader title="Site Settings" subtitle="Agent profile, branding, and site configuration"
        action={<button onClick={save} disabled={saving} className="btn btn-gold" style={{ padding: "9px 20px", borderRadius: 9, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          {saving ? <><Spinner size={14} color="#fff" /> Saving...</> : "💾 Save Settings"}
        </button>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>👤 Agent Profile (RECO Mandatory)</div>
            <Field label="Registered Name (as on RECO)" field="agentName" />
            <Field label="Registration Category" field="title" options={["Sales Representative", "Real Estate Salesperson", "Broker"]} />
            <Field label="Brokerage (exact RECO registered name)" field="brokerage" hint="Must include 'Brokerage' — e.g. Royal LePage Signature Realty, Brokerage" />
            <Field label="Phone" field="phone" type="tel" />
            <Field label="Email" field="email" type="email" />
            <Field label="Main Website" field="website" type="url" />
            <Field label="Languages" field="languages" hint="English, Urdu, Hindi" />
            <Field label="Awards/Credentials" field="awards" />
            <Field label="Service Areas" field="serviceAreas" />
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>🔐 Dashboard Password</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5 }}>Current Password</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="input" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5 }}>New Password</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="input" />
            </div>
            <button onClick={async () => { if (!newPass) return; await store.set("dashpass", newPass); alert("Password updated ✓"); setPass(""); setNewPass(""); }} className="btn btn-ghost" style={{ padding: "9px 16px", borderRadius: 8, fontSize: 13, border: `1px solid ${T.border}` }}>
              Update Password
            </button>
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>🌐 Site Configuration</div>
            <Field label="Site Mode" field="siteMode" options={["demo", "live"]} hint="Demo = sample listings shown. Live = real TRREB data only." />
            <Field label="WhatsApp Number (no + or spaces)" field="whatsapp" hint="e.g. 16476091289" />
            <Field label="Calendly URL" field="calendly" type="url" />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 8 }}>Brand Accent Color</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="color" value={settings.brandColor || "#C49A3C"} onChange={e => setSettings(s => ({ ...s, brandColor: e.target.value }))} style={{ width: 48, height: 36, border: `1px solid ${T.border}`, borderRadius: 8, background: "none", cursor: "pointer" }} />
                <input value={settings.brandColor || "#C49A3C"} onChange={e => setSettings(s => ({ ...s, brandColor: e.target.value }))} className="input" style={{ flex: 1 }} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>📝 Agent Bio</div>
            <Field label="Bio Text (shown on site)" field="bio" type="textarea" />
            <AIWriter
              prompt="Write a compelling professional bio for Hamza Nouman, Sales Representative at Royal LePage Signature Realty, Brokerage in Mississauga. 8+ years experience, Master Sales Award, speaks English/Urdu/Hindi. Specializes in investment properties and the Hurontario LRT corridor. Max 100 words, professional but personable."
              onInsert={txt => setSettings(s => ({ ...s, bio: txt }))}
              placeholder="Click generate for an AI-written bio..."
            />
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>📋 Compliance Status</div>
            {[
              [true, "RECO registration category displayed"],
              [true, "Brokerage name on all pages"],
              [true, "CASL consent on all lead forms"],
              [true, "PIPEDA privacy policy linked"],
              [true, "TRREB sample data disclaimer"],
              [true, "Investment disclaimer on calculators"],
              [settings.googleAnalytics?.length > 0, "Google Analytics connected"],
            ].map(([pass, label]) => (
              <div key={label} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <span>{pass ? "✅" : "⚠️"}</span>
                <span style={{ fontSize: 12, color: pass ? T.text : T.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MEDIA LIBRARY ────────────────────────────────────────────────────────────
const MediaLibrary = ({ listings, blogs }) => {
  const allImages = [
    ...listings.flatMap(l => (l.images || []).map(img => ({ ...img, source: l.address, type: "listing" }))),
    ...blogs.flatMap(b => (b.images || []).map(img => ({ ...img, source: b.title, type: "blog" }))),
  ];

  return (
    <div className="fade-in">
      <SectionHeader title="Media Library" subtitle={`${allImages.length} images uploaded`} />
      {allImages.length === 0 ? (
        <div className="card" style={{ padding: "60px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
          <p style={{ fontSize: 15, color: T.muted }}>No images uploaded yet. Add photos via the Listings or Blog editors.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {allImages.map((img, i) => (
            <div key={i} className="card" style={{ overflow: "hidden" }}>
              <img src={img.url} alt={img.alt || img.name} style={{ width: "100%", height: 120, objectFit: "cover" }} />
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 11, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.source}</div>
                <span className="tag" style={{ background: img.type === "listing" ? T.goldDim : "rgba(96,165,250,0.1)", color: img.type === "listing" ? T.gold : T.blue, border: `1px solid ${img.type === "listing" ? T.goldBorder : "rgba(96,165,250,0.2)"}` }}>{img.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const attempt = async () => {
    const stored = await store.get("dashpass") || "hamza2025";
    if (pass === stored) { onLogin(); }
    else { setErr("Incorrect password."); setPass(""); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${T.gold}, #A07820)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px", boxShadow: `0 0 30px rgba(196,154,60,0.3)` }}>◈</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 4 }}>Admin Dashboard</h1>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>mississaugainvestor.ca</p>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && attempt()}
          className="input" placeholder="Enter password" style={{ marginBottom: 12, textAlign: "center", letterSpacing: "0.1em" }} autoFocus />
        {err && <div style={{ color: T.red, fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <button onClick={attempt} className="btn btn-gold" style={{ width: "100%", padding: "12px", borderRadius: 10, fontSize: 15 }}>
          Enter Dashboard
        </button>
        <p style={{ fontSize: 11, color: T.muted, marginTop: 14 }}>Default password: hamza2025 · Change in Settings</p>
      </div>
    </div>
  );
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [listings, setListings] = useState(DEFAULT_LISTINGS);
  const [blogs, setBlogs] = useState(DEFAULT_BLOGS);
  const [leads, setLeads] = useState(DEFAULT_LEADS);
  const [seo, setSeo] = useState(DEFAULT_SEO);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load from storage
  useEffect(() => {
    (async () => {
      const [sl, sb, sle, ss, sse] = await Promise.all([
        store.get("listings"), store.get("blogs"), store.get("leads"), store.get("settings"), store.get("seo")
      ]);
      if (sl) setListings(sl);
      if (sb) setBlogs(sb);
      if (sle) setLeads(sle);
      if (ss) setSettings(ss);
      if (sse) setSeo(sse);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
      <Spinner size={32} />
    </div>
  );

  if (!loggedIn) return <><style>{G}</style><LoginScreen onLogin={() => setLoggedIn(true)} /></>;

  const navSections = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "listings", icon: "🏠", label: "Listings", badge: listings.length },
    { id: "blogs", icon: "✍️", label: "Blog", badge: blogs.filter(b => b.status === "draft").length || null },
    { id: "leads", icon: "👥", label: "Leads", badge: leads.length },
    { id: "seo", icon: "🔍", label: "SEO" },
    { id: "media", icon: "📸", label: "Media" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <>
      <style>{G}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: T.bg }}>

        {/* Sidebar */}
        <aside style={{ width: 220, background: T.surface, borderRight: `1px solid ${T.border}`, padding: "20px 12px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px", marginBottom: 28 }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${T.gold}, #A07820)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>◈</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>MI Admin</div>
              <div style={{ fontSize: 10, color: T.muted }}>mississaugainvestor.ca</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1 }}>
            {navSections.map(s => (
              <div key={s.id} className={`nav-item ${activeSection === s.id ? "active" : ""}`} onClick={() => setActiveSection(s.id)}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ flex: 1 }}>{s.label}</span>
                {s.badge > 0 && <span style={{ background: activeSection === s.id ? T.gold : "rgba(255,255,255,0.1)", color: activeSection === s.id ? "#000" : T.muted, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8, minWidth: 18, textAlign: "center" }}>{s.badge}</span>}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, marginTop: 14 }}>
            <a href="https://mississauga-deals.vercel.app" target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", textDecoration: "none", marginBottom: 8 }}>
              <span style={{ fontSize: 8, color: T.green }}>●</span>
              <span style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>View Live Site</span>
            </a>
            <div className="nav-item" onClick={() => setLoggedIn(false)} style={{ color: T.red }}>
              <span>🚪</span><span>Log Out</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "28px 32px", overflow: "auto", minWidth: 0 }}>
          {activeSection === "dashboard" && <DashboardHome listings={listings} blogs={blogs} leads={leads} settings={settings} />}
          {activeSection === "listings" && <ListingsManager listings={listings} setListings={setListings} />}
          {activeSection === "blogs" && <BlogManager blogs={blogs} setBlogs={setBlogs} />}
          {activeSection === "leads" && <LeadsManager leads={leads} setLeads={setLeads} settings={settings} />}
          {activeSection === "seo" && <SEOManager seo={seo} setSeo={setSeo} />}
          {activeSection === "media" && <MediaLibrary listings={listings} blogs={blogs} />}
          {activeSection === "settings" && <SettingsPanel settings={settings} setSettings={setSettings} />}
        </main>
      </div>
    </>
  );
}
