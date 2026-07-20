import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processListings } from '@/lib/listings/process-listings';
import { applyFilters, DEFAULT_FILTERS } from '@/components/listings/filter-utils';
import { unsubscribeUrl } from '@/lib/unsubscribe-token';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// ── Auth ──
function isAuthorized(request) {
  const cronSecret = request.headers.get('authorization');
  if (cronSecret === `Bearer ${process.env.CRON_SECRET}`) return true;
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey && adminKey === process.env.ADMIN_SECRET) return true;
  return false;
}

// ── Supabase ──
function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// ── Fetch live market stats ──
async function fetchMarketStats() {
  try {
    const res = await fetch('https://www.mississaugainvestor.ca/api/market-stats', {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Format price ──
function fmtPrice(p) {
  if (!p) return 'N/A';
  if (p >= 1000000) return '$' + (p / 1000000).toFixed(2) + 'M';
  return '$' + Math.round(p / 1000) + 'K';
}

// ── Format percentage change with arrow ──
function fmtChange(val) {
  if (!val && val !== 0) return '';
  const num = parseFloat(val);
  const arrow = num >= 0 ? '&#9650;' : '&#9660;';
  const color = num >= 0 ? '#10b981' : '#ef4444';
  return `<span style="color:${color};font-weight:700;">${arrow} ${Math.abs(num).toFixed(1)}%</span>`;
}

// ── Build the email HTML (per-subscriber: greeting, matched deals, blog) ──
function buildEmailHTML(stats, date, extras = {}) {
  // Never fabricate or show "N/A" — a stat with no real data is simply omitted
  const s = stats || {};
  const activeCount = s.activeCount || null;
  const avgPrice = s.avgPrice ? fmtPrice(s.avgPrice) : null;
  const avgDOM = s.mississaugaAvgLDOM || s.avgDOM || null;
  const salesToList = s.mississaugaAvgSPLP
    ? s.mississaugaAvgSPLP + '%'
    : s.salesToListRatio
      ? (s.salesToListRatio * 100).toFixed(1) + '%'
      : null;
  const inventory = s.mississaugaMonthsOfInventory || null;

  // Price by type
  const prices = s.avgPrices || {};
  const priceTiles = [
    { label: 'Detached', value: prices.detached?.avg || prices.detached?.soldAvg },
    { label: 'Semi-Detached', value: prices.semiDetached?.avg || prices.semiDetached?.soldAvg },
    { label: 'Townhouse', value: prices.townhouse?.avg || prices.townhouse?.soldAvg },
    { label: 'Condo', value: prices.condo?.avg || prices.condo?.soldAvg },
  ].filter((t) => t.value > 0);

  // Mortgage rates
  const mortgage = s.mortgageRates || {};
  const variable = mortgage.variable || null;
  const fixed5 = mortgage.fixed5Year || mortgage.fixed5 || null;
  const bocRate = s.economicIndicators?.bocRate || mortgage.bocRate || null;

  const headerStats = [
    activeCount != null ? { label: 'Active Listings', value: typeof activeCount === 'number' ? activeCount.toLocaleString() : activeCount } : null,
    avgPrice ? { label: 'Avg. Price', value: avgPrice } : null,
    avgDOM != null ? { label: 'Avg. DOM', value: `${avgDOM}<span style="font-size:12px;color:rgba(255,255,255,0.4);"> days</span>` } : null,
    salesToList ? { label: 'Sale-to-List', value: salesToList } : null,
  ].filter(Boolean);

  const indicatorRows = [
    inventory != null ? { label: 'Months of Inventory', value: `${inventory} mo` } : null,
    bocRate != null ? { label: 'BoC Policy Rate', value: `${bocRate}%` } : null,
    variable != null ? { label: 'Variable Rate', value: `${variable}%` } : null,
    fixed5 != null ? { label: '5-Year Fixed', value: `${fixed5}%` } : null,
  ].filter(Boolean);

  // TRREB data
  const trreb = s.trrebData || {};
  const tSales = trreb.totalSales || '';
  const tAvg = trreb.avgPrice ? fmtPrice(trreb.avgPrice) : '';
  const tYoy = trreb.avgPriceYoY || '';

  // Hot hoods
  const hoods = s.hotNeighbourhoods || [];

  const formattedDate = date.toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- HEADER -->
<tr><td bgcolor="#0F2A4A" style="background:linear-gradient(135deg,#0F2A4A 0%,#1a3a5c 100%);padding:32px 32px 24px;border-radius:12px 12px 0 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">MississaugaInvestor</span><span style="font-size:22px;font-weight:800;color:#3b82f6;">.ca</span>
      </td>
    </tr>
    <tr>
      <td style="padding-top:8px;">
        <span style="display:inline-block;background:rgba(59,130,246,0.18);border:1px solid rgba(59,130,246,0.4);border-radius:20px;padding:4px 12px;font-size:10px;font-weight:700;color:#93c5fd;text-transform:uppercase;letter-spacing:1.2px;">GTA Investor Weekly</span>
      </td>
    </tr>
  </table>
  <div style="margin-top:20px;">
    <div style="font-size:26px;font-weight:800;color:#fff;line-height:1.2;">Mississauga Market Weekly</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:6px;">${formattedDate}</div>
  </div>
</td></tr>

<!-- MARKET PULSE STRIP -->
<tr><td style="background:#0a1f35;padding:16px 32px;">
  ${headerStats.length > 0 ? `<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      ${headerStats.map((c) => `<td width="${Math.floor(100 / headerStats.length)}%" align="center" style="padding:4px;">
        <div style="font-size:20px;font-weight:800;color:#fff;">${c.value}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.5px;">${c.label}</div>
      </td>`).join('')}
    </tr>
  </table>` : ''}
</td></tr>

<!-- BODY -->
<tr><td style="background:#ffffff;padding:32px;">

  ${extras.greetingName ? `<div style="font-size:14px;color:#334155;margin-bottom:20px;">Hi ${esc(extras.greetingName)} &mdash; here's your week in Mississauga real estate.</div>` : ''}
  ${extras.dealsHtml || ''}

  ${priceTiles.length > 0 ? `<!-- Price by Type -->
  ${sectionHeader('Mississauga averages', 'Price by Property Type', '')}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    ${Array.from({ length: Math.ceil(priceTiles.length / 2) }, (_, r) => priceTiles.slice(r * 2, r * 2 + 2)).map((row) => `<tr>
      ${row.map((t) => `<td width="50%" style="padding:8px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${t.label}</div>
          <div style="font-size:22px;font-weight:800;color:#0F2A4A;margin-top:2px;">${fmtPrice(t.value)}</div>
        </div>
      </td>`).join('')}
    </tr>`).join('')}
  </table>` : ''}

  ${indicatorRows.length > 0 ? `<!-- Key Indicators -->
  ${sectionHeader('The numbers that matter', 'Key Market Indicators', '')}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    ${indicatorRows.map((r, i) => `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'};">
      <td style="padding:12px 16px;font-size:13px;color:#64748b;${i < indicatorRows.length - 1 ? 'border-bottom:1px solid #e2e8f0;' : ''}">${r.label}</td>
      <td align="right" style="padding:12px 16px;font-size:14px;font-weight:700;color:#0F2A4A;${i < indicatorRows.length - 1 ? 'border-bottom:1px solid #e2e8f0;' : ''}">${r.value}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${hoods.length > 0 ? `
  <!-- Hot Neighbourhoods -->
  ${sectionHeader('Where prices are moving', 'Hot Neighbourhoods', '')}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <tr style="background:#0F2A4A;">
      <td style="padding:10px 16px;font-size:11px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:0.5px;">Neighbourhood</td>
      <td align="right" style="padding:10px 16px;font-size:11px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:0.5px;">Avg. Price</td>
    </tr>
    ${hoods.map((h, i) => `
    <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'};">
      <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0F2A4A;">${h.name || h.neighbourhood}</td>
      <td align="right" style="padding:12px 16px;font-size:14px;font-weight:700;color:#0F2A4A;">${fmtPrice(h.avgPrice || h.avg_price)}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${extras.blogHtml || ''}

  <!-- Signature — the human behind the data -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 4px;border-top:1px solid #e2e8f0;padding-top:8px;">
    <tr>
      <td width="72" style="padding:20px 16px 0 0;vertical-align:top;">
        <img src="https://www.mississaugainvestor.ca/images/hamza-headshot.jpg" alt="Hamza Nouman" width="64" height="64" style="border-radius:50%;display:block;object-fit:cover;" />
      </td>
      <td style="padding-top:20px;vertical-align:top;">
        <div style="font-size:15px;font-weight:800;color:#0F2A4A;">Hamza Nouman</div>
        <div style="font-size:12px;color:#64748b;margin-top:1px;">Sales Representative &middot; Cityscape Real Estate Ltd., Brokerage</div>
        <div style="font-size:12px;color:#334155;margin-top:8px;line-height:1.5;">Spotted a deal you want to run the numbers on? Just hit reply &mdash; I read every response &mdash; or grab a time below.</div>
        <div style="margin-top:10px;">
          <a href="https://www.mississaugainvestor.ca/book-call?utm_source=newsletter&utm_medium=email&utm_campaign=weekly" style="display:inline-block;background:#0F2A4A;color:#ffffff;font-size:12px;font-weight:700;padding:9px 18px;border-radius:8px;text-decoration:none;">Book a Free 15-min Call</a>
        </div>
      </td>
    </tr>
  </table>

  <!-- CTA -->
  <div style="text-align:center;margin:32px 0 16px;">
    <a href="https://www.mississaugainvestor.ca/listings?utm_source=newsletter&utm_medium=email&utm_campaign=weekly" style="display:inline-block;background:#3b82f6;color:#fff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;">Browse Top Investment Deals &#8594;</a>
  </div>
  <div style="text-align:center;margin-bottom:8px;">
    <a href="https://www.mississaugainvestor.ca/market-pulse?utm_source=newsletter&utm_medium=email&utm_campaign=weekly" style="font-size:13px;color:#3b82f6;text-decoration:none;">View Full Market Dashboard &#8594;</a>
  </div>

</td></tr>

<!-- FOOTER -->
<tr><td style="background:#0F2A4A;padding:28px 32px;border-radius:0 0 12px 12px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <div style="font-size:14px;font-weight:700;color:#fff;">Hamza Nouman</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:2px;">Sales Representative &middot; Cityscape Real Estate Ltd., Brokerage</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;">Licensed by RECO</div>
        <div style="margin-top:10px;">
          <a href="tel:+16476091289" style="font-size:12px;color:#3b82f6;text-decoration:none;margin-right:16px;">&#9742; 647-609-1289</a>
          <a href="mailto:hamza@nouman.ca" style="font-size:12px;color:#3b82f6;text-decoration:none;">&#9993; hamza@nouman.ca</a>
        </div>
      </td>
      <td align="right" valign="top">
        <a href="https://www.mississaugainvestor.ca/about?utm_source=newsletter&utm_medium=email&utm_campaign=weekly" style="display:inline-block;border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:12px;font-weight:600;padding:8px 16px;border-radius:6px;text-decoration:none;">About Hamza</a>
      </td>
    </tr>
  </table>
  <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);">
    <div style="font-size:10px;color:rgba(255,255,255,0.3);line-height:1.5;">
      Data sourced from TRREB MLS. Estimates are for informational purposes only and do not constitute financial advice.
      &copy; ${new Date().getFullYear()} MississaugaInvestor.ca &middot; 885 Plymouth Dr UNIT 2, Mississauga, ON L5V 0B5
    </div>
    <div style="margin-top:8px;">
      <a href="${extras.email ? unsubscribeUrl(extras.email) : 'https://www.mississaugainvestor.ca/api/alerts/unsubscribe'}" style="font-size:10px;color:rgba(255,255,255,0.55);text-decoration:underline;">Unsubscribe from weekly reports</a>
    </div>
  </div>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Escape user/listing text for safe HTML embedding ──
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Get subscriber profiles: email → name + saved-search filters ──
async function getSubscriberProfiles(supabase) {
  const profiles = new Map();

  // Alert subscribers carry name + filters — the personalization source
  const { data: searches } = await supabase
    .from('saved_searches')
    .select('email, name, filters')
    .eq('active', true);
  for (const s of searches || []) {
    if (!s.email) continue;
    const p = profiles.get(s.email) || { name: null, filtersList: [] };
    if (!p.name && s.name) p.name = s.name;
    if (s.filters && typeof s.filters === 'object' && Object.keys(s.filters).length > 0) {
      p.filtersList.push(s.filters);
    }
    profiles.set(s.email, p);
  }

  // Leads (registered users + imported contacts) — name only, no saved filters
  const optedOut = new Set();
  try {
    const { data: leads } = await supabase
      .from('leads')
      .select('email, name, status')
      .not('email', 'is', null);
    for (const l of leads || []) {
      if (!l.email) continue;
      if (l.status === 'unsubscribed') {
        optedOut.add(l.email);
        continue;
      }
      const p = profiles.get(l.email) || { name: null, filtersList: [] };
      if (!p.name && l.name) p.name = l.name;
      profiles.set(l.email, p);
    }
  } catch {
    // leads table may not exist
  }

  // An unsubscribed lead must not be re-added via their old saved searches
  for (const email of optedOut) profiles.delete(email);

  return profiles;
}

// ── Fetch scored listings once for the whole send ──
async function fetchScoredListings(request) {
  try {
    const url = new URL('/api/listings?limit=200&page=1', request.url);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    const raw = json.listings || (Array.isArray(json) ? json : []);
    return processListings(raw).sort((a, b) => b.hamzaScore - a.hamzaScore);
  } catch {
    return [];
  }
}

// ── Pick this subscriber's top deals: their saved filters, else overall top ──
function pickDealsFor(profile, allListings) {
  if (allListings.length === 0) return { deals: [], personalized: false };

  if (profile.filtersList.length > 0) {
    const matched = new Map();
    for (const f of profile.filtersList) {
      try {
        for (const l of applyFilters(allListings, { ...DEFAULT_FILTERS, ...f })) {
          if (!matched.has(l.id)) matched.set(l.id, l);
        }
      } catch {
        // A malformed saved filter shouldn't kill the send
      }
    }
    const deals = [...matched.values()].sort((a, b) => b.hamzaScore - a.hamzaScore).slice(0, 5);
    if (deals.length > 0) return { deals, personalized: true };
  }

  return { deals: allListings.slice(0, 5), personalized: false };
}

// ── Deal score badge colour (mirrors lib/deal-score.js scoreColorHex) ──
function scoreBadgeColor(score) {
  if (score >= 8) return '#10B981';
  if (score >= 6.5) return '#2563EB';
  if (score >= 5) return '#F59E0B';
  return '#EF4444';
}

// ── "Picked for you" deals table ──
function sectionHeader(eyebrow, title, sub) {
  return `
  <div style="font-size:10px;font-weight:800;color:#3b82f6;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">${eyebrow}</div>
  <div style="font-size:20px;font-weight:800;color:#0F2A4A;letter-spacing:-0.3px;margin-bottom:${sub ? '4px' : '16px'};">${title}</div>
  ${sub ? `<div style="font-size:12px;color:#64748b;margin-bottom:16px;">${sub}</div>` : ''}`;
}

function dealChips(d, size = 10) {
  const chips = [];
  if (d.capRate > 0) chips.push(`<span style="display:inline-block;background:#f1f5f9;border-radius:6px;padding:3px 9px;font-size:${size}px;color:#475569;font-weight:700;">CAP ${d.capRate}%</span>`);
  if (typeof d.cashFlow === 'number') chips.push(`<span style="display:inline-block;background:${d.cashFlow >= 0 ? '#ecfdf5' : '#f1f5f9'};border-radius:6px;padding:3px 9px;font-size:${size}px;font-weight:700;color:${d.cashFlow >= 0 ? '#059669' : '#64748b'};">${d.cashFlow >= 0 ? '+' : '&minus;'}$${Math.abs(Math.round(d.cashFlow)).toLocaleString()}/mo</span>`);
  if (d.beds) chips.push(`<span style="display:inline-block;background:#f1f5f9;border-radius:6px;padding:3px 9px;font-size:${size}px;color:#475569;font-weight:700;">${d.beds} BED</span>`);
  return chips.join('&nbsp;');
}

function dealPhoto(d) {
  const p = Array.isArray(d.photos) ? d.photos[0] : null;
  return typeof p === 'string' && p.startsWith('http') ? p : null;
}

function dealUrl(d) {
  return `https://www.mississaugainvestor.ca/listings/${encodeURIComponent(d.id)}?utm_source=newsletter&utm_medium=email&utm_campaign=weekly`;
}

function buildDealsHTML(deals, personalized) {
  if (!deals.length) return '';
  const [hero, ...rest] = deals;
  const heroPhoto = dealPhoto(hero);

  // Featured deal — full-width photo card, magazine style
  const heroHtml = `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    ${heroPhoto
      ? `<tr><td><a href="${dealUrl(hero)}"><img src="${heroPhoto}" alt="${esc(hero.address)}" width="536" style="width:100%;max-width:536px;height:auto;display:block;" /></a></td></tr>`
      : `<tr><td bgcolor="#0F2A4A" style="background:linear-gradient(135deg,#0F2A4A,#1a3a5c);padding:44px 24px;text-align:center;">
           <div style="font-size:22px;font-weight:800;color:#ffffff;">${esc(hero.address)}</div>
           <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:4px;">${esc(hero.neighbourhood || 'Mississauga')}</div>
         </td></tr>`}
    <tr><td style="background:#ffffff;padding:18px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <span style="display:inline-block;background:${scoreBadgeColor(hero.hamzaScore)};color:#fff;font-weight:800;font-size:11px;border-radius:12px;padding:3px 10px;">DEAL SCORE ${hero.hamzaScore}/10</span>
          <div style="margin-top:8px;"><a href="${dealUrl(hero)}" style="font-size:17px;font-weight:800;color:#0F2A4A;text-decoration:none;">${esc(hero.address)}</a></div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${esc(hero.neighbourhood || 'Mississauga')} &middot; ${esc(hero.type || 'Property')}</div>
        </td>
        <td align="right" valign="top" style="white-space:nowrap;">
          <div style="font-size:22px;font-weight:800;color:#0F2A4A;">${fmtPrice(hero.price)}</div>
        </td>
      </tr></table>
      <div style="margin-top:12px;">${dealChips(hero, 11)}</div>
      <div style="margin-top:14px;"><a href="${dealUrl(hero)}" style="display:inline-block;background:#3b82f6;color:#ffffff;font-size:12px;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;">View Full Analysis &#8594;</a></div>
    </td></tr>
  </table>`;

  // Remaining deals — photo-thumbnail rows
  const rows = rest.map((d) => {
    const p = dealPhoto(d);
    return `
    <tr>
      <td width="76" style="padding:10px 0 10px 12px;vertical-align:top;">
        <a href="${dealUrl(d)}">${p
          ? `<img src="${p}" alt="${esc(d.address)}" width="64" height="64" style="border-radius:8px;display:block;object-fit:cover;" />`
          : `<table cellpadding="0" cellspacing="0"><tr><td bgcolor="#0F2A4A" width="64" height="64" align="center" style="border-radius:8px;font-size:20px;font-weight:800;color:#3b82f6;">${esc((d.address || '?').charAt(0))}</td></tr></table>`}</a>
      </td>
      <td style="padding:10px 12px;vertical-align:top;border-bottom:1px solid #f1f5f9;">
        <a href="${dealUrl(d)}" style="font-size:13px;font-weight:700;color:#0F2A4A;text-decoration:none;">${esc(d.address)}</a>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">${esc(d.neighbourhood || 'Mississauga')} &middot; ${esc(d.type || 'Property')}</div>
        <div style="margin-top:6px;">${dealChips(d)}</div>
      </td>
      <td align="right" style="padding:10px 12px 10px 0;vertical-align:top;white-space:nowrap;border-bottom:1px solid #f1f5f9;">
        <div style="font-size:14px;font-weight:800;color:#0F2A4A;">${fmtPrice(d.price)}</div>
        <div style="font-size:11px;margin-top:3px;"><span style="display:inline-block;background:${scoreBadgeColor(d.hamzaScore)};color:#fff;font-weight:700;border-radius:10px;padding:1px 8px;">${d.hamzaScore}/10</span></div>
      </td>
    </tr>`;
  }).join('');

  return `
  ${sectionHeader(
    personalized ? 'Matched to your saved search' : 'Ranked by deal score',
    personalized ? 'Picked for You This Week' : "This Week's Top Deals",
    ''
  )}
  ${heroHtml}
  ${rest.length ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#ffffff;">${rows}</table>` : '<div style="margin-bottom:16px;"></div>'}`;
}

// ── Latest blog post block ──
function buildBlogHTML(post) {
  if (!post) return '';
  const url = `https://www.mississaugainvestor.ca/blog/${encodeURIComponent(post.slug)}?utm_source=newsletter&utm_medium=email&utm_campaign=weekly`;
  return `
  ${sectionHeader('From the blog', 'This Week\'s Read', '')}
  <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:28px;">
    <a href="${url}" style="font-size:15px;font-weight:700;color:#0F2A4A;text-decoration:none;">${esc(post.title)}</a>
    ${post.excerpt ? `<div style="font-size:13px;color:#64748b;margin-top:6px;line-height:1.5;">${esc(post.excerpt)}</div>` : ''}
    <div style="margin-top:10px;"><a href="${url}" style="font-size:13px;color:#3b82f6;text-decoration:none;font-weight:600;">Read the full post &#8594;</a></div>
  </div>`;
}

// ── Send email via Resend ──
async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'MississaugaInvestor <notifications@mississaugainvestor.ca>',
      to,
      subject,
      html,
      headers: {
        // Native one-click unsubscribe in Gmail/Outlook — deliverability signal
        'List-Unsubscribe': `<${unsubscribeUrl(to)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });
  return res.ok;
}

// ── Approval flow ──
// The Monday cron no longer mails subscribers directly. It sends ONE draft to
// the approver (Hamza) with an "Approve & Send" button. The button opens a
// confirmation page (GET ?approve=1&t=...), and the actual send happens only
// on the confirm POST — so email-client link prefetchers can never trigger it.
import { createHmac } from 'crypto';

const APPROVER =
  process.env.NEWSLETTER_APPROVER_EMAIL ||
  process.env.LEAD_NOTIFICATION_EMAIL ||
  'hamza@nouman.ca';

function weekKey(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.floor((date - start) / (7 * 24 * 3600 * 1000));
  return `${date.getUTCFullYear()}-w${String(week).padStart(2, '0')}`;
}

function approvalToken(wk) {
  if (!process.env.CRON_SECRET) return 'dev';
  return createHmac('sha256', process.env.CRON_SECRET).update(`weekly-approve-${wk}`).digest('hex').slice(0, 20);
}

// Shared data prep for draft and approved send
async function prepareSendData(request, supabase) {
  const [stats, allListings] = await Promise.all([
    fetchMarketStats(),
    fetchScoredListings(request),
  ]);

  let latestPost = null;
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('title, slug, excerpt')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(1);
    latestPost = posts?.[0] || null;
  } catch {
    // blog block is optional
  }

  const now = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return {
    stats,
    allListings,
    blogHtml: buildBlogHTML(latestPost),
    now,
    dateLabel: `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
  };
}

async function sendToAllSubscribers(supabase, data) {
  const { stats, allListings, blogHtml, now, dateLabel } = data;
  const profiles = await getSubscriberProfiles(supabase);
  if (profiles.size === 0) return { subscribers: 0, sent: 0, failed: 0, personalized: 0 };

  let sent = 0;
  let failed = 0;
  let personalizedCount = 0;
  const entries = [...profiles.entries()];

  for (let i = 0; i < entries.length; i += 10) {
    const batch = entries.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(([email, profile]) => {
        const { deals, personalized } = pickDealsFor(profile, allListings);
        if (personalized) personalizedCount++;
        const firstName = (profile.name || '').trim().split(/\s+/)[0] || '';
        const html = buildEmailHTML(stats, now, {
          greetingName: firstName,
          dealsHtml: buildDealsHTML(deals, personalized),
          blogHtml,
          email,
        });
        const subject = personalized
          ? `${deals.length} deal${deals.length === 1 ? '' : 's'} matched to your search — Mississauga Weekly, ${dateLabel}`
          : `Mississauga Market Weekly — ${dateLabel}`;
        return sendEmail(email, subject, html);
      })
    );
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value) sent++;
      else failed++;
    });
  }

  return {
    subscribers: profiles.size,
    sent,
    failed,
    personalized: personalizedCount,
    genericTopDeals: profiles.size - personalizedCount,
  };
}

function approvalBanner(wk, subscriberCount) {
  const url = `https://www.mississaugainvestor.ca/api/newsletter/weekly?approve=1&t=${approvalToken(wk)}`;
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
  <tr><td bgcolor="#FEF3C7" style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:20px 24px;text-align:center;">
    <div style="font-size:14px;font-weight:800;color:#92400E;margin-bottom:4px;">&#9998; DRAFT — waiting for your approval</div>
    <div style="font-size:12px;color:#92400E;margin-bottom:14px;">This is exactly what your ${subscriberCount} subscribers will receive. Nothing sends until you approve.</div>
    <a href="${url}" style="display:inline-block;background:#0F2A4A;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">Review &amp; Approve Send &#8594;</a>
  </td></tr>
</table>`;
}

function htmlPage(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;background:#F8FAFC;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;}
.card{background:#fff;border-radius:16px;padding:40px;max-width:440px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
h1{color:#1B2A4A;font-size:22px;margin:0 0 12px;}p{color:#64748B;font-size:15px;line-height:1.6;margin:0 0 20px;}
button,a.btn{display:inline-block;background:#2563EB;color:#fff;border:none;cursor:pointer;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;}</style>
</head><body><div class="card">${body}</div></body></html>`;
}

// ── Main handler ──
export async function GET(request) {
  try {
    // ?preview=1 renders the template with sample data and sends NOTHING.
    // Allowed in dev without auth so the HTML can be test-rendered; in
    // production it still requires the cron/admin secret.
    const { searchParams } = new URL(request.url);
    if (searchParams.get('preview') === '1') {
      if (process.env.NODE_ENV !== 'development' && !isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const sampleDeals = [
        { id: 'SAMPLE1', address: '1234 Lakeshore Rd E', price: 899000, hamzaScore: 8.4, capRate: 5.2, cashFlow: 312, beds: 3, neighbourhood: 'Lakeview', type: 'Detached', photos: ['https://www.mississaugainvestor.ca/images/sample-house-1.jpg'] },
        { id: 'SAMPLE2', address: '55 Village Centre Blvd', price: 649000, hamzaScore: 7.9, capRate: 4.8, cashFlow: 145, beds: 2, neighbourhood: 'City Centre', type: 'Condo Apt', photos: ['https://www.mississaugainvestor.ca/images/sample-house-2.jpg'] },
        { id: 'SAMPLE3', address: '890 Clarkson Rd S', price: 1050000, hamzaScore: 7.6, capRate: 4.5, cashFlow: -85, beds: 4, neighbourhood: 'Clarkson', type: 'Detached', photos: ['https://www.mississaugainvestor.ca/images/sample-house-3.jpg'] },
      ];
      const html = buildEmailHTML(
        { avgPrice: 985000, avgDOM: 31, salesToListRatio: 0.96, mississaugaMonthsOfInventory: 5.2 },
        new Date(),
        {
          greetingName: 'Sam',
          dealsHtml: buildDealsHTML(sampleDeals, true),
          blogHtml: buildBlogHTML({ title: 'Sample: Where Cash Flow Still Pencils in 2026', slug: 'sample-post', excerpt: 'A look at the neighbourhoods where the numbers still work.' }),
          email: 'preview@example.com',
        }
      );
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // ?approve=1&t=... — approval confirmation page (from the draft email's
    // button). Token-authed; renders a confirm form, sends NOTHING itself.
    if (searchParams.get('approve') === '1') {
      const wk = weekKey(new Date());
      if (searchParams.get('t') !== approvalToken(wk)) {
        return new Response(
          htmlPage('Link expired', '<h1>This approval link has expired</h1><p>Approval links are valid for the week of the draft. Wait for the next Monday draft, or trigger one from the admin.</p>'),
          { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
      const supabase = getSupabase();
      const profiles = supabase ? await getSubscriberProfiles(supabase) : new Map();
      return new Response(
        htmlPage(
          'Approve weekly send',
          `<h1>Send this week's report?</h1>
           <p>The email you just reviewed will go to <strong>${profiles.size} subscribers</strong>. This cannot be undone.</p>
           <form method="POST" action="/api/newsletter/weekly?approve=1&t=${approvalToken(wk)}">
             <button type="submit">Yes — Send to ${profiles.size} Subscribers</button>
           </form>`
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // ── Default (Monday cron): send the DRAFT to the approver only ──
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 });
    }

    const data = await prepareSendData(request, supabase);
    const profiles = await getSubscriberProfiles(supabase);
    if (profiles.size === 0) {
      return NextResponse.json({ success: true, message: 'No subscribers found', sent: 0 });
    }

    // Draft = the generic (non-personalized) edition with the approval banner
    const wk = weekKey(data.now);
    const { deals } = pickDealsFor({ filtersList: [] }, data.allListings);
    const draftHtml =
      approvalBanner(wk, profiles.size) +
      buildEmailHTML(data.stats, data.now, {
        greetingName: 'Hamza',
        dealsHtml: buildDealsHTML(deals, false),
        blogHtml: data.blogHtml,
        email: APPROVER,
      });

    const ok = await sendEmail(
      APPROVER,
      `[APPROVE] Mississauga Market Weekly — ${data.dateLabel} (${profiles.size} subscribers waiting)`,
      draftHtml
    );

    return NextResponse.json({
      success: ok,
      mode: 'draft-for-approval',
      draftSentTo: APPROVER,
      subscribers: profiles.size,
      approveBy: 'Click the button in the draft email',
    });
  } catch (err) {
    console.error('Newsletter error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Approved send: POST from the confirmation page ──
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('approve') !== '1') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const wk = weekKey(new Date());
    if (searchParams.get('t') !== approvalToken(wk)) {
      return new Response(htmlPage('Link expired', '<h1>This approval link has expired</h1><p>Wait for the next Monday draft.</p>'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const supabase = getSupabase();
    if (!supabase || !process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email infrastructure not configured' }, { status: 500 });
    }

    // Idempotency: one send per week. Uses newsletter_sends (unique week_key)
    // when the table exists; proceeds without the guard if it doesn't.
    try {
      const { error: guardErr } = await supabase.from('newsletter_sends').insert({ week_key: wk, approved_by: APPROVER });
      if (guardErr && (guardErr.code === '23505' || /duplicate/i.test(guardErr.message || ''))) {
        return new Response(
          htmlPage('Already sent', '<h1>This week\'s report was already sent</h1><p>No duplicate emails went out. See you next Monday.</p>'),
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    } catch {
      // table missing — skip the guard
    }

    const data = await prepareSendData(request, supabase);
    const result = await sendToAllSubscribers(supabase, data);

    return new Response(
      htmlPage(
        'Sent',
        `<h1>&#127881; Sent to ${result.sent} subscribers</h1>
         <p>${result.personalized} personalized to saved searches, ${result.genericTopDeals} got the top-deals edition${result.failed ? ` — ${result.failed} failed (will appear in Resend logs)` : ''}.</p>
         <a class="btn" href="https://www.mississaugainvestor.ca/admin">Open Admin</a>`
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err) {
    console.error('Approved send error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
