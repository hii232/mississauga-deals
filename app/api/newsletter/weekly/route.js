import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processListings } from '@/lib/listings/process-listings';
import { applyFilters, DEFAULT_FILTERS } from '@/components/listings/filter-utils';

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
  const s = stats || {};
  const activeCount = s.activeCount || '2,500+';
  const avgPrice = fmtPrice(s.avgPrice);
  const avgDOM = s.mississaugaAvgLDOM || s.avgDOM || 28;
  const salesToList = s.mississaugaAvgSPLP
    ? s.mississaugaAvgSPLP + '%'
    : s.salesToListRatio
      ? (s.salesToListRatio * 100).toFixed(1) + '%'
      : '97.2%';
  const inventory = s.mississaugaMonthsOfInventory || 'N/A';

  // Price by type
  const prices = s.avgPrices || {};
  const detached = fmtPrice(prices.detached?.avg || prices.detached?.soldAvg);
  const semi = fmtPrice(prices.semiDetached?.avg || prices.semiDetached?.soldAvg);
  const town = fmtPrice(prices.townhouse?.avg || prices.townhouse?.soldAvg);
  const condo = fmtPrice(prices.condo?.avg || prices.condo?.soldAvg);

  // Mortgage rates
  const mortgage = s.mortgageRates || {};
  const variable = mortgage.variable || 'N/A';
  const fixed5 = mortgage.fixed5Year || mortgage.fixed5 || 'N/A';
  const bocRate = s.economicIndicators?.bocRate || mortgage.bocRate || 'N/A';

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
<tr><td style="background:linear-gradient(135deg,#0F2A4A 0%,#1a3a5c 100%);padding:32px 32px 24px;border-radius:12px 12px 0 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">MississaugaInvestor</span><span style="font-size:22px;font-weight:800;color:#3b82f6;">.ca</span>
      </td>
      <td align="right">
        <span style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">Weekly Market Report</span>
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
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td width="25%" align="center" style="padding:4px;">
        <div style="font-size:20px;font-weight:800;color:#fff;">${typeof activeCount === 'number' ? activeCount.toLocaleString() : activeCount}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.5px;">Active Listings</div>
      </td>
      <td width="25%" align="center" style="padding:4px;">
        <div style="font-size:20px;font-weight:800;color:#fff;">${avgPrice}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.5px;">Avg. Price</div>
      </td>
      <td width="25%" align="center" style="padding:4px;">
        <div style="font-size:20px;font-weight:800;color:#fff;">${avgDOM}<span style="font-size:12px;color:rgba(255,255,255,0.4);"> days</span></div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.5px;">Avg. DOM</div>
      </td>
      <td width="25%" align="center" style="padding:4px;">
        <div style="font-size:20px;font-weight:800;color:#fff;">${salesToList}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.5px;">Sale-to-List</div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- BODY -->
<tr><td style="background:#ffffff;padding:32px;">

  ${extras.greetingName ? `<div style="font-size:14px;color:#334155;margin-bottom:20px;">Hi ${esc(extras.greetingName)} &mdash; here's your week in Mississauga real estate.</div>` : ''}
  ${extras.dealsHtml || ''}

  <!-- Price by Type -->
  <div style="font-size:16px;font-weight:700;color:#0F2A4A;margin-bottom:16px;">&#128200; Price by Property Type</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td width="50%" style="padding:8px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Detached</div>
          <div style="font-size:22px;font-weight:800;color:#0F2A4A;margin-top:2px;">${detached}</div>
        </div>
      </td>
      <td width="50%" style="padding:8px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Semi-Detached</div>
          <div style="font-size:22px;font-weight:800;color:#0F2A4A;margin-top:2px;">${semi}</div>
        </div>
      </td>
    </tr>
    <tr>
      <td width="50%" style="padding:8px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Townhouse</div>
          <div style="font-size:22px;font-weight:800;color:#0F2A4A;margin-top:2px;">${town}</div>
        </div>
      </td>
      <td width="50%" style="padding:8px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Condo</div>
          <div style="font-size:22px;font-weight:800;color:#0F2A4A;margin-top:2px;">${condo}</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Key Indicators -->
  <div style="font-size:16px;font-weight:700;color:#0F2A4A;margin-bottom:16px;">&#128202; Key Market Indicators</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <tr style="background:#f8fafc;">
      <td style="padding:12px 16px;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Months of Inventory</td>
      <td align="right" style="padding:12px 16px;font-size:14px;font-weight:700;color:#0F2A4A;border-bottom:1px solid #e2e8f0;">${inventory} mo</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">BoC Policy Rate</td>
      <td align="right" style="padding:12px 16px;font-size:14px;font-weight:700;color:#0F2A4A;border-bottom:1px solid #e2e8f0;">${bocRate}%</td>
    </tr>
    <tr style="background:#f8fafc;">
      <td style="padding:12px 16px;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Variable Rate</td>
      <td align="right" style="padding:12px 16px;font-size:14px;font-weight:700;color:#0F2A4A;border-bottom:1px solid #e2e8f0;">${variable}%</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;font-size:13px;color:#64748b;">5-Year Fixed</td>
      <td align="right" style="padding:12px 16px;font-size:14px;font-weight:700;color:#0F2A4A;">${fixed5}%</td>
    </tr>
  </table>

  ${hoods.length > 0 ? `
  <!-- Hot Neighbourhoods -->
  <div style="font-size:16px;font-weight:700;color:#0F2A4A;margin-bottom:16px;">&#128293; Hot Neighbourhoods This Week</div>
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
      <a href="https://www.mississaugainvestor.ca/api/alerts/unsubscribe?email=${encodeURIComponent(extras.email || '')}" style="font-size:10px;color:rgba(255,255,255,0.4);text-decoration:underline;">Unsubscribe from weekly reports</a>
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

  // Leads (registered users) — name only, no saved filters
  try {
    const { data: leads } = await supabase
      .from('leads')
      .select('email, name')
      .not('email', 'is', null);
    for (const l of leads || []) {
      if (!l.email) continue;
      const p = profiles.get(l.email) || { name: null, filtersList: [] };
      if (!p.name && l.name) p.name = l.name;
      profiles.set(l.email, p);
    }
  } catch {
    // leads table may not exist
  }

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
function buildDealsHTML(deals, personalized) {
  if (!deals.length) return '';
  const rows = deals.map((d, i) => `
    <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'};">
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">
        <a href="https://www.mississaugainvestor.ca/listings/${encodeURIComponent(d.id)}?utm_source=newsletter&utm_medium=email&utm_campaign=weekly" style="font-size:13px;font-weight:700;color:#0F2A4A;text-decoration:none;">${esc(d.address)}</a>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">${esc(d.neighbourhood || 'Mississauga')} &middot; ${esc(d.type || 'Property')} &middot; ${d.beds || 0} bed</div>
      </td>
      <td align="right" style="padding:12px 16px;border-bottom:1px solid #e2e8f0;white-space:nowrap;">
        <div style="font-size:14px;font-weight:800;color:#0F2A4A;">${fmtPrice(d.price)}</div>
        <div style="font-size:11px;margin-top:2px;"><span style="display:inline-block;background:${scoreBadgeColor(d.hamzaScore)};color:#fff;font-weight:700;border-radius:10px;padding:1px 8px;">${d.hamzaScore}/10</span></div>
      </td>
    </tr>`).join('');

  return `
  <div style="font-size:16px;font-weight:700;color:#0F2A4A;margin-bottom:6px;">${personalized ? '&#127919; Picked for You This Week' : '&#11088; Top-Scored Deals This Week'}</div>
  <div style="font-size:12px;color:#64748b;margin-bottom:14px;">${personalized ? 'Matched to your saved search, ranked by deal score.' : 'The highest-scored investment listings on the market right now.'}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">${rows}</table>`;
}

// ── Latest blog post block ──
function buildBlogHTML(post) {
  if (!post) return '';
  const url = `https://www.mississaugainvestor.ca/blog/${encodeURIComponent(post.slug)}?utm_source=newsletter&utm_medium=email&utm_campaign=weekly`;
  return `
  <div style="font-size:16px;font-weight:700;color:#0F2A4A;margin-bottom:12px;">&#128240; This Week on the Blog</div>
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
    }),
  });
  return res.ok;
}

// ── Main handler ──
export async function GET(request) {
  try {
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

    // Fetch shared data once: market stats, scored listings, latest blog post
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
    const blogHtml = buildBlogHTML(latestPost);

    const now = new Date();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dateLabel = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    // Subscriber profiles: name + saved-search filters per email
    const profiles = await getSubscriberProfiles(supabase);

    if (profiles.size === 0) {
      return NextResponse.json({ success: true, message: 'No subscribers found', sent: 0 });
    }

    // Build and send each subscriber's own email
    let sent = 0;
    let failed = 0;
    let personalizedCount = 0;
    const entries = [...profiles.entries()];

    // Send in batches of 10 to avoid rate limits
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

    return NextResponse.json({
      success: true,
      subscribers: profiles.size,
      sent,
      failed,
      personalized: personalizedCount,
      genericTopDeals: profiles.size - personalizedCount,
    });
  } catch (err) {
    console.error('Newsletter error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
