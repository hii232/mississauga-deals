import { NextResponse } from 'next/server';
import { DEFAULT_ASSUMPTIONS } from '@/lib/cash-flow-engine';
import { createClient } from '@supabase/supabase-js';
import { processListings } from '@/lib/listings/process-listings';
import { applyFilters, DEFAULT_FILTERS } from '@/components/listings/filter-utils';
import { unsubscribeUrl } from '@/lib/unsubscribe-token';
import { tagRecipient } from '@/lib/emails/recipient-token';
import { sanitizePost } from '@/lib/blog/sanitize-content';
import { fetchAllListings } from '@/lib/listings/fetch-all-listings';
import { isCronAuthorized, isAdminAuthorized } from '@/lib/api-auth';
import { esc, fmtPrice } from '@/lib/emails/email-utils';
import { probeSendLock, acquireSendLock } from '@/lib/emails/broadcast-guard';
import { buildMarketStory } from '@/lib/market/market-story';

// 300 (Pro Fluid limit headroom): the no-store pool walk is batched 6 pages
// at a time with 15s per-page timeouts (lib/listings/fetch-all-listings.js)
// - worst case ~75s before a single email sends. The old budget could kill
// the route mid-walk on a slow upstream, so the send silently never happened.
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// ── Auth ──
// Fails CLOSED via lib/api-auth. The previous version compared against
// `Bearer ${process.env.CRON_SECRET}`, so an unset secret made the literal
// header "Bearer undefined" a valid credential.
function isAuthorized(request) {
  return isCronAuthorized(request) || isAdminAuthorized(request);
}

// ── Supabase ──
function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Public site URL - never build the internal fetch from request.url: on the
// weekly cron that resolves to the *.vercel.app deployment host, which sits
// behind Vercel deployment protection and serves an HTML auth wall (200), so a
// fetch would silently return nothing and the newsletter would ship without the
// thing it is for. In production this IS the public domain, so the behaviour is
// unchanged; in development it points at localhost so `?preview=1` can render a
// real email offline instead of silently dropping every stat.
const SITE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://www.mississaugainvestor.ca';

// ── Fetch live market stats ──
async function fetchMarketStats() {
  try {
    const res = await fetch(`${SITE_URL}/api/market-stats`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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
// Editorial design system - "straight out of a magazine":
const PAPER = '#F5F2EC';
const INK = '#0F2A4A';
const GOLD = '#A9853B';
const HAIR = '#DCD5C6';
const MUTED = '#6F6A5D';
const SERIF = "Georgia,'Times New Roman',serif";

function kicker(text) {
  return `<div style="font-family:${SERIF};font-size:11px;font-weight:700;color:${GOLD};text-transform:uppercase;letter-spacing:3px;margin-bottom:10px;">${text}</div>`;
}

function hairline(m = '28px') {
  return `<div style="border-top:1px solid ${HAIR};margin:${m} 0;"></div>`;
}

// ── "The Brief" - the written market story ──
// The email used to ship tables and nothing else. A table cannot tell you when
// its own headline number is lying, and in July 2026 it was: the average sale
// price moved 11.4% while the median moved 2.3%, so an average printed under
// last month's average reads as a crash that did not happen. lib/market/
// market-story.js writes the sentence that fixes that, gated on the data, and
// is unit-tested because these paragraphs go out under a licensed agent's name.
// Renders nothing at all when there is nothing honest to say.
function buildStoryHTML(stats) {
  const story = buildMarketStory(stats);
  if (!story) return '';
  return `${hairline()}
  ${kicker('The Brief')}
  <div style="font-family:${SERIF};font-size:22px;font-weight:700;color:${INK};line-height:1.3;margin-bottom:14px;">${esc(story.headline)}</div>
  ${story.paragraphs.map((p) => `<p style="font-family:${SERIF};font-size:14px;color:${INK};line-height:1.7;margin:0 0 13px;">${esc(p)}</p>`).join('')}
  ${story.footnote ? `<p style="font-family:${SERIF};font-size:11px;font-style:italic;color:${MUTED};line-height:1.6;margin:12px 0 0;">${esc(story.footnote)}</p>` : ''}`;
}

function buildEmailHTML(stats, date, extras = {}) {
  // Never fabricate or show "N/A" - a stat with no real data is simply omitted
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

  // The by-type sold prices come from TRREB's monthly Market Watch, not this
  // week's live feed. Surface the report month so the email never passes a
  // months-old board figure off as a live weekly number.
  const trrebMonth = s.tRREBMonth || null;
  const prices = s.avgPrices || {};
  const priceTiles = [
    { label: 'Detached', value: prices.detached?.avg || prices.detached?.soldAvg },
    { label: 'Semi-Detached', value: prices.semiDetached?.avg || prices.semiDetached?.soldAvg },
    { label: 'Townhouse', value: prices.townhouse?.avg || prices.townhouse?.soldAvg },
    { label: 'Condo', value: prices.condo?.avg || prices.condo?.soldAvg },
  ].filter((t) => t.value > 0);

  // Match the ACTUAL /api/market-stats shape: `rates` and `economic`
  // (older `mortgageRates`/`economicIndicators` kept as fallbacks just in case)
  const rates = s.rates || s.mortgageRates || {};
  const variable = rates.variable ?? null;
  const fixed5 = rates.fixed5yr ?? rates.fixed5Year ?? rates.fixed5 ?? null;
  const bocRate = s.economic?.bocRate ?? s.economicIndicators?.bocRate ?? rates.bocRate ?? null;

  const headerStats = [
    avgPrice ? { label: 'Average Price', value: avgPrice } : null,
    avgDOM != null ? { label: 'Days on Market', value: `${avgDOM}` } : null,
    salesToList ? { label: 'Sale-to-List', value: salesToList } : null,
    activeCount != null ? { label: 'Active Listings', value: typeof activeCount === 'number' ? activeCount.toLocaleString() : activeCount } : null,
  ].filter(Boolean).slice(0, 3);

  const indicatorRows = [
    inventory != null ? { label: 'Months of Inventory', value: `${inventory} mo` } : null,
    bocRate != null ? { label: 'Bank of Canada Policy Rate', value: `${bocRate}%` } : null,
    variable != null ? { label: 'Variable Rate', value: `${variable}%` } : null,
    fixed5 != null ? { label: '5-Year Fixed', value: `${fixed5}%` } : null,
  ].filter(Boolean);

  const hoods = (s.hotNeighbourhoods || []).filter((h) => (h.avgPrice || h.avg_price) > 0);

  const issueDate = date.toLocaleDateString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${PAPER};">
<!-- Preheader: the inbox preview snippet shown next to the subject. Hidden in
     the body but prime open-rate real estate that was previously wasted. -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${PAPER};opacity:0;">
  ${extras.preheader ? esc(extras.preheader) : "This week’s top cash-flowing Mississauga deals, scored - plus live market stats inside."}
</div>
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="${PAPER}" style="background:${PAPER};padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- MASTHEAD -->
<tr><td style="padding:0 40px;">
  <div style="border-top:3px solid ${INK};border-bottom:1px solid ${INK};height:2px;margin-bottom:22px;"></div>
  <div style="text-align:center;">
    <div style="font-family:${SERIF};font-size:32px;font-weight:700;color:${INK};letter-spacing:5px;line-height:1.1;">MISSISSAUGA<br/>INVESTOR</div>
    <div style="font-family:${SERIF};font-size:10px;color:${GOLD};text-transform:uppercase;letter-spacing:3.5px;margin-top:10px;">GTA Real Estate Intelligence</div>
  </div>
  <div style="border-top:1px solid ${HAIR};margin-top:22px;"></div>
  <div style="text-align:center;font-family:${SERIF};font-size:10px;color:${MUTED};letter-spacing:2.5px;padding:10px 0;">${issueDate} &nbsp;&middot;&nbsp; THE WEEKLY BRIEFING</div>
  <div style="border-top:1px solid ${HAIR};"></div>
</td></tr>

${headerStats.length > 0 ? `<!-- BY THE NUMBERS STRIP -->
<tr><td style="padding:22px 40px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    ${headerStats.map((c) => `<td width="${Math.floor(100 / headerStats.length)}%" align="center" style="padding:4px;">
      <div style="font-family:${SERIF};font-size:27px;color:${INK};">${c.value}</div>
      <div style="font-family:${SERIF};font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:2px;margin-top:4px;">${c.label}</div>
    </td>`).join('')}
  </tr></table>
  <div style="border-top:1px solid ${HAIR};margin-top:22px;"></div>
</td></tr>` : ''}

<!-- BODY -->
<tr><td style="padding:30px 40px 8px;">
  ${extras.greetingName ? `<div style="font-family:${SERIF};font-style:italic;font-size:16px;color:${INK};margin-bottom:26px;">Dear ${esc(extras.greetingName)}, here is your week in Mississauga real estate.</div>` : ''}
  ${extras.dealsHtml || ''}

  ${buildStoryHTML(s)}

  ${priceTiles.length > 0 ? `${hairline()}
  ${kicker('Average Prices &middot; By Property Type')}
  ${trrebMonth ? `<div style="font-family:${SERIF};font-size:11px;color:${MUTED};margin:-8px 0 10px;letter-spacing:0.3px;">Sold prices &middot; TRREB Market Watch, ${esc(trrebMonth)} (latest monthly board data)</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0">
    ${priceTiles.map((t, i) => `<tr>
      <td style="font-family:${SERIF};font-size:13px;color:${MUTED};padding:9px 0;letter-spacing:0.5px;${i < priceTiles.length - 1 ? `border-bottom:1px solid ${HAIR};` : ''}">${t.label}</td>
      <td align="right" style="font-family:${SERIF};font-size:17px;color:${INK};padding:9px 0;${i < priceTiles.length - 1 ? `border-bottom:1px solid ${HAIR};` : ''}">${fmtPrice(t.value)}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${indicatorRows.length > 0 ? `${hairline()}
  ${kicker('By the Numbers')}
  <table width="100%" cellpadding="0" cellspacing="0">
    ${indicatorRows.map((r, i) => `<tr>
      <td style="font-family:${SERIF};font-size:13px;color:${MUTED};padding:9px 0;letter-spacing:0.5px;${i < indicatorRows.length - 1 ? `border-bottom:1px solid ${HAIR};` : ''}">${r.label}</td>
      <td align="right" style="font-family:${SERIF};font-size:17px;color:${INK};padding:9px 0;${i < indicatorRows.length - 1 ? `border-bottom:1px solid ${HAIR};` : ''}">${r.value}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${hoods.length > 0 ? `${hairline()}
  ${kicker('Where Prices Are Moving')}
  <table width="100%" cellpadding="0" cellspacing="0">
    ${hoods.map((h, i) => `<tr>
      <td style="font-family:${SERIF};font-size:14px;color:${INK};padding:9px 0;${i < hoods.length - 1 ? `border-bottom:1px solid ${HAIR};` : ''}">${esc(h.name || h.neighbourhood)}</td>
      <td align="right" style="font-family:${SERIF};font-size:15px;color:${INK};padding:9px 0;${i < hoods.length - 1 ? `border-bottom:1px solid ${HAIR};` : ''}">${fmtPrice(h.avgPrice || h.avg_price)}</td>
    </tr>`).join('')}
  </table>
  ${s.hotNeighbourhoodsAsOf ? `<p style="font-family:${SERIF};font-size:11px;color:${MUTED};margin:8px 0 0;line-height:1.5;">
    Neighbourhood averages from our ${esc(s.hotNeighbourhoodsAsOf)} outlook - the same figures the neighbourhood guides on the site use.
  </p>` : ''}` : ''}

  ${extras.blogHtml || ''}

  ${hairline()}
  ${kicker('A Note from Hamza')}
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td width="76" style="padding:4px 18px 0 0;vertical-align:top;">
        <img src="https://www.mississaugainvestor.ca/images/hamza-headshot.jpg" alt="Hamza Nouman" width="64" height="64" style="border-radius:50%;display:block;" />
      </td>
      <td style="vertical-align:top;">
        <div style="font-family:${SERIF};font-style:italic;font-size:14px;color:${INK};line-height:1.65;">&ldquo;Spotted a deal you want to run the numbers on? Just hit reply - I read every response.&rdquo;</div>
        <div style="font-family:${SERIF};font-size:14px;font-weight:700;color:${INK};margin-top:10px;">Hamza Nouman</div>
        <div style="font-family:${SERIF};font-size:11px;color:${MUTED};letter-spacing:0.5px;">Sales Representative &middot; Cityscape Real Estate Ltd., Brokerage</div>
        <div style="margin-top:14px;">
          <a href="https://www.mississaugainvestor.ca/book-call?utm_source=newsletter&utm_medium=email&utm_campaign=weekly" style="display:inline-block;background:${INK};color:${PAPER};font-family:${SERIF};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;padding:11px 22px;text-decoration:none;">Book a Private Call</a>
        </div>
      </td>
    </tr>
  </table>

  <div style="text-align:center;margin:38px 0 6px;">
    <a href="https://www.mississaugainvestor.ca/listings?utm_source=newsletter&utm_medium=email&utm_campaign=weekly" style="display:inline-block;background:${INK};color:${PAPER};font-family:${SERIF};font-size:12px;letter-spacing:3px;text-transform:uppercase;padding:14px 34px;text-decoration:none;">View All Listings</a>
  </div>
  <div style="text-align:center;margin-bottom:8px;">
    <a href="https://www.mississaugainvestor.ca/market-pulse?utm_source=newsletter&utm_medium=email&utm_campaign=weekly" style="font-family:${SERIF};font-style:italic;font-size:13px;color:${MUTED};text-decoration:underline;">or study the full market dashboard</a>
  </div>
</td></tr>

<!-- COLOPHON -->
<tr><td style="padding:8px 40px 0;">
  <div style="border-top:1px solid ${INK};border-bottom:3px solid ${INK};height:2px;margin-bottom:20px;"></div>
  <div style="text-align:center;">
    <div style="font-family:${SERIF};font-size:13px;font-weight:700;color:${INK};letter-spacing:1px;">HAMZA NOUMAN</div>
    <div style="font-family:${SERIF};font-size:10px;color:${MUTED};letter-spacing:1.5px;margin-top:3px;text-transform:uppercase;">Sales Representative &middot; Cityscape Real Estate Ltd., Brokerage &middot; Licensed by RECO</div>
    <div style="margin-top:8px;">
      <a href="tel:+16476091289" style="font-family:${SERIF};font-size:11px;color:${INK};text-decoration:none;">647&middot;609&middot;1289</a>
      <span style="color:${HAIR};">&nbsp;|&nbsp;</span>
      <a href="mailto:hamza@nouman.ca" style="font-family:${SERIF};font-size:11px;color:${INK};text-decoration:none;">hamza@nouman.ca</a>
      <span style="color:${HAIR};">&nbsp;|&nbsp;</span>
      <a href="https://www.mississaugainvestor.ca/about?utm_source=newsletter&utm_medium=email&utm_campaign=weekly" style="font-family:${SERIF};font-size:11px;color:${INK};text-decoration:none;">About</a>
    </div>
    <div style="font-family:${SERIF};font-size:9px;color:${MUTED};line-height:1.6;margin-top:14px;">
      Data sourced from TRREB MLS. Estimates are for informational purposes only and do not constitute financial advice.<br/>
      &copy; ${date.getFullYear()} MississaugaInvestor.ca &middot; 885 Plymouth Dr UNIT 2, Mississauga, ON L5V 0B5
    </div>
    <div style="margin:10px 0 6px;">
      <a href="${extras.email ? unsubscribeUrl(extras.email) : 'https://www.mississaugainvestor.ca/api/alerts/unsubscribe'}" style="font-family:${SERIF};font-size:9px;color:${MUTED};text-decoration:underline;">Unsubscribe from the weekly briefing</a>
    </div>
  </div>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Get subscriber profiles: email → name + saved-search filters ──
async function getSubscriberProfiles(supabase) {
  const profiles = new Map();

  // Alert subscribers carry name + filters - the personalization source
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

  // Leads (registered users + imported contacts) - name only, no saved filters
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
// Uses the same SITE_URL as the stats fetch above - defined once near the top
// of this file. It used to be declared here with market-stats fetching a
// separately hardcoded copy of the same host, which is how the two could drift.
// ALL pages, not page 1. The "top 10 cash-flow deals" used to be selected from
// the first 200 rows of ~2,500 actives - the top of an 8% sample, so the
// market's actual best deals mostly never reached subscribers.
async function fetchScoredListings() {
  try {
    const { listings } = await fetchAllListings(SITE_URL, '/api/listings');
    return processListings(listings).sort((a, b) => b.hamzaScore - a.hamzaScore);
  } catch (err) {
    console.error('Newsletter: listings fetch error', err);
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

// ── "Picked for you" deals - editorial layout ──
function statLine(d, size = 11) {
  const parts = [];
  if (Number.isFinite(d.capRate) && d.capRate > 0) parts.push(`CAP&nbsp;${d.capRate}%`);
  if (Number.isFinite(d.cashFlow)) parts.push(`<span style="color:${d.cashFlow >= 0 ? '#3E7C4F' : '#9C5A44'};">${d.cashFlow >= 0 ? '+' : '&minus;'}$${Math.abs(Math.round(d.cashFlow)).toLocaleString()}/MO</span>`);
  if (d.beds) parts.push(`${d.beds}&nbsp;BED`);
  return `<div style="font-family:${SERIF};font-size:${size}px;color:${MUTED};letter-spacing:2px;text-transform:uppercase;">${parts.join(' &nbsp;&middot;&nbsp; ')}</div>`;
}

// The rent every cash-flow figure above assumes. The site's listing cards state
// this on every card - an investor's critique was that a cash-flow number with
// an unstated rent assumption isn't credible - but the newsletter shipped the
// figures bare, so the retention channel was the last place the assumption
// stayed hidden. Reads the SAME fields the card component reads so the two can
// never disagree, and renders nothing when rent is unknown rather than guessing.
function rentAssumption(d, size = 11) {
  const rent = Number(d.estimatedRent);
  if (!Number.isFinite(rent) || rent <= 0) return '';
  const money = (n) => '$' + Math.round(n).toLocaleString();
  const basement = Number(d.basementIncome) || 0;
  const base = Number(d.baseRent) || 0;
  const units = Array.isArray(d.unitBreakdown) ? d.unitBreakdown : null;
  let extra = '';
  if (units && units.length > 1) extra = ` across ${units.length} units`;
  else if (basement > 0 && base > 0) {
    extra = ` - ${money(base)} main + ${money(basement)} ${d.basementTier === 'legal' ? 'legal ' : ''}suite`;
  }
  // The feed never supplies a real condo fee (see IMPROVEMENT_BACKLOG) - CAP
  // and cash flow for every condo/apt listing are computed on a bedroom/sqft
  // estimate, and the site labels that figure "Condo Fee (est.)" everywhere
  // it's shown. The newsletter rendered the same estimate-derived numbers
  // with no such disclosure.
  const condoNote = d.condoFeeEstimated ? ' &middot; condo fee is estimated' : '';
  return `<div style="font-family:${SERIF};font-size:${size}px;font-style:italic;color:${MUTED};margin-top:5px;">Assumes ${money(rent)}/mo rent${extra}${condoNote}</div>`;
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

  const heroHtml = `
  ${kicker(personalized ? 'The Featured Deal &middot; Matched to Your Search' : 'The Featured Deal')}
  ${heroPhoto ? `<a href="${dealUrl(hero)}"><img src="${heroPhoto}" alt="${esc(hero.address)}" width="520" style="width:100%;max-width:520px;height:auto;display:block;" /></a>` : ''}
  <div style="font-family:${SERIF};font-size:10px;color:${GOLD};letter-spacing:2.5px;text-transform:uppercase;margin-top:16px;">Rated ${Number.isFinite(hero.hamzaScore) ? hero.hamzaScore : '-'} / 10 &nbsp;&middot;&nbsp; ${esc(hero.neighbourhood || 'Mississauga')}</div>
  <div style="margin-top:6px;"><a href="${dealUrl(hero)}" style="font-family:${SERIF};font-size:26px;font-weight:700;color:${INK};text-decoration:none;line-height:1.2;">${esc(hero.address)}</a></div>
  <div style="font-family:${SERIF};font-size:21px;color:${INK};margin-top:8px;">${fmtPrice(hero.price)} <span style="font-size:13px;color:${MUTED};font-style:italic;">&middot; ${esc(hero.type || 'Property')}</span></div>
  <div style="margin-top:12px;">${statLine(hero)}</div>
  ${rentAssumption(hero)}
  <div style="margin-top:14px;"><a href="${dealUrl(hero)}" style="font-family:${SERIF};font-style:italic;font-size:14px;color:${INK};text-decoration:underline;">Read the full analysis &#8594;</a></div>`;

  const rows = rest.map((d, i) => {
    const p = dealPhoto(d);
    return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;"><tr>
      ${p ? `<td width="100" style="padding-right:16px;vertical-align:top;"><a href="${dealUrl(d)}"><img src="${p}" alt="${esc(d.address)}" width="84" height="84" style="display:block;" /></a></td>` : ''}
      <td style="vertical-align:top;">
        <a href="${dealUrl(d)}" style="font-family:${SERIF};font-size:17px;font-weight:700;color:${INK};text-decoration:none;">${esc(d.address)}</a>
        <div style="font-family:${SERIF};font-size:12px;font-style:italic;color:${MUTED};margin-top:2px;">${esc(d.neighbourhood || 'Mississauga')} &middot; ${esc(d.type || 'Property')} &middot; Rated ${Number.isFinite(d.hamzaScore) ? d.hamzaScore : '-'}/10</div>
        <div style="margin-top:7px;">${statLine(d, 10)}</div>
        ${rentAssumption(d, 10)}
      </td>
      <td align="right" style="vertical-align:top;white-space:nowrap;padding-left:10px;">
        <div style="font-family:${SERIF};font-size:17px;color:${INK};">${fmtPrice(d.price)}</div>
      </td>
    </tr></table>
    ${i < rest.length - 1 ? `<div style="border-top:1px solid ${HAIR};margin-top:18px;"></div>` : ''}`;
  }).join('');

  // The financing basis behind every CAP/cash-flow figure above. The site
  // discloses it on /score-methodology; without it here a subscriber cannot
  // tell whether "+$312/mo" assumes 20% down or 35%. Built from
  // DEFAULT_ASSUMPTIONS so it can never drift from the engine.
  const basis = `<div style="font-family:${SERIF};font-size:10px;font-style:italic;color:${MUTED};margin-top:16px;line-height:1.6;">Figures assume ${DEFAULT_ASSUMPTIONS.downPaymentPercent}% down at ${DEFAULT_ASSUMPTIONS.annualInterestRate}% over ${DEFAULT_ASSUMPTIONS.amortizationYears} years, plus property tax, insurance, maintenance and vacancy. <a href="https://www.mississaugainvestor.ca/score-methodology?utm_source=newsletter&utm_medium=email&utm_campaign=weekly" style="color:${INK};">Full methodology &#8594;</a></div>`;

  return `${heroHtml}
  ${rest.length ? `${hairline()}${kicker('Also on the Market')}${rows}` : ''}
  ${basis}`;
}

// ── Latest blog post block ──
function buildBlogHTML(post) {
  if (!post) return '';
  const url = `https://www.mississaugainvestor.ca/blog/${encodeURIComponent(post.slug)}?utm_source=newsletter&utm_medium=email&utm_campaign=weekly`;
  return `
  ${hairline()}
  ${kicker('The Read')}
  <div><a href="${url}" style="font-family:${SERIF};font-size:21px;font-weight:700;color:${INK};text-decoration:none;line-height:1.25;">${esc(post.title)}</a></div>
  ${post.excerpt ? `<div style="font-family:${SERIF};font-size:14px;color:${MUTED};margin-top:8px;line-height:1.65;">${esc(post.excerpt)}</div>` : ''}
  <div style="margin-top:10px;"><a href="${url}" style="font-family:${SERIF};font-style:italic;font-size:14px;color:${INK};text-decoration:underline;">Continue reading &#8594;</a></div>`;
}

// ── Send email via Resend ──
/**
 * Plain-text part - a written digest, not a tag-strip (a stripped table-layout
 * email reads like garbage). The Brief's prose (buildMarketStory) IS the
 * story, so the text edition leads with it, then the deals, then the links.
 * HTML-only bulk mail is a long-standing spam signal; this and the daily
 * alert are the domain's recurring senders, so they set its reputation.
 */
function buildEmailText(stats, { greetingName = '', deals = [], personalized = false, email = '' } = {}) {
  const money = (v) => '$' + Math.round(Number(v) || 0).toLocaleString('en-CA');
  const story = buildMarketStory(stats);
  const lines = [
    greetingName ? `Hi ${greetingName},` : 'Hi,',
    '',
  ];
  if (story) {
    if (story.headline) lines.push(story.headline.toUpperCase(), '');
    for (const para of story.paragraphs || []) lines.push(para, '');
    if (story.footnote) lines.push(story.footnote, '');
  }
  if (deals.length) {
    lines.push(personalized ? 'Matches for your saved search this week:' : "This week's top-scoring deals:", '');
    for (const d of deals) {
      lines.push(`${d.address || 'Address on request'} (${d.neighbourhood || 'Mississauga'})`);
      const facts = [];
      if (Number(d.price) > 0) facts.push(money(d.price));
      if (Number.isFinite(d.hamzaScore)) facts.push(`score ${d.hamzaScore}/10`);
      if (Number.isFinite(d.capRate) && d.capRate > 0) facts.push(`${d.capRate}% cap`);
      if (Number.isFinite(d.cashFlow)) facts.push(`${d.cashFlow >= 0 ? '+' : '-'}${money(Math.abs(d.cashFlow))}/mo`);
      if (facts.length) lines.push('  ' + facts.join(' | '));
      lines.push(`  https://www.mississaugainvestor.ca/listings/${encodeURIComponent(d.id)}?utm_source=newsletter&utm_medium=email&utm_campaign=weekly`);
      lines.push('');
    }
  }
  lines.push(
    'Full dashboard: https://www.mississaugainvestor.ca/market-pulse?utm_source=newsletter&utm_medium=email&utm_campaign=weekly',
    'Book a free 30-min call: https://www.mississaugainvestor.ca/book-call?utm_source=newsletter&utm_medium=email&utm_campaign=weekly',
    '',
    'Every figure is an estimate from live MLS and TRREB data - confirm rent and',
    'costs for the specific property. Not financial advice.',
    '',
    '- Hamza Nouman, Sales Representative, Cityscape Real Estate Ltd., Brokerage',
    'Cityscape Real Estate Ltd., Brokerage, 885 Plymouth Dr, Unit 2, Mississauga, ON L5V 0B5',
    '',
    `Unsubscribe: ${unsubscribeUrl(email)}`
  );
  return lines.join('\n');
}

async function sendEmail(to, subject, html, text) {
  // Per-recipient click identity for the admin "Who Clicked" list
  html = tagRecipient(html, to);
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
      // multipart/alternative - HTML-only is a spam signal on a weekly list send.
      ...(text ? { text } : {}),
      headers: {
        // Native one-click unsubscribe in Gmail/Outlook - deliverability signal
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
// on the confirm POST - so email-client link prefetchers can never trigger it.
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
  // Returns null - NOT a guessable constant - when there is no secret to sign
  // with. This used to return the literal 'dev', so on any deployment missing
  // CRON_SECRET, `?approve=1&t=dev` mailed the whole subscriber list. Callers
  // treat null as "approval is unavailable"; a null can never equal a
  // submitted token, so the compare below denies rather than admits.
  if (!process.env.CRON_SECRET) return null;
  return createHmac('sha256', process.env.CRON_SECRET).update(`weekly-approve-${wk}`).digest('hex').slice(0, 20);
}

// Shared data prep for draft and approved send
async function prepareSendData(request, supabase) {
  const [stats, allListings] = await Promise.all([
    fetchMarketStats(),
    fetchScoredListings(),
  ]);

  let latestPost = null;
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('title, slug, excerpt')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(1);
    latestPost = posts?.[0] ? sanitizePost(posts[0]) : null;
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
          preheader: buildPreheader(deals, personalized),
        });
        const subject = buildSubject(personalized, deals, dateLabel);
        const text = buildEmailText(stats, { greetingName: firstName, deals, personalized, email });
        return sendEmail(email, subject, html, text);
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

// Build a specific, honest subject line. Personalized subscribers get their
// match count; generic subscribers lead with the top deal's real hook (cash
// flow, else cap rate) to lift open rates. Every value is guarded so the subject
// can never render "N/A", "$NaN", or "undefined".
function buildSubject(personalized, deals, dateLabel) {
  if (personalized) {
    return `${deals.length} deal${deals.length === 1 ? '' : 's'} matched to your search - Mississauga Weekly, ${dateLabel}`;
  }
  const top = deals && deals[0];
  if (top) {
    const hood = (top.neighbourhood || top.city || '').toString().trim() || 'Mississauga';
    if (typeof top.cashFlow === 'number' && isFinite(top.cashFlow) && top.cashFlow > 0) {
      return `Top deal this week: +$${Math.round(top.cashFlow).toLocaleString()}/mo cash flow in ${hood}`;
    }
    if (typeof top.capRate === 'number' && isFinite(top.capRate) && top.capRate > 0) {
      return `${deals.length} new Mississauga ${deals.length === 1 ? 'deal' : 'deals'} - top pick ${top.capRate.toFixed(1)}% cap rate in ${hood}`;
    }
    return `${deals.length} new Mississauga investment ${deals.length === 1 ? 'deal' : 'deals'} - ${dateLabel}`;
  }
  return `Mississauga Market Weekly - ${dateLabel}`;
}

// Build the inbox preview text (shown next to the subject in Gmail / Outlook /
// Apple Mail). The subject is already dynamic - this makes the preview slot
// echo the same hook instead of repeating a static line. The two slots appear
// together in the inbox thumbnail, so a cash-flow number in both reinforces
// the signal rather than wasting one of them on boilerplate.
//
// Mirror the exact fallback logic from buildSubject so the two are always
// consistent - both lead with cashFlow, then capRate, then a generic count.
function buildPreheader(deals, personalized) {
  const n = deals ? deals.length : 0;
  const top = deals && deals[0];
  if (!top || n === 0) {
    return "This week's Mississauga market summary - live stats and investor analysis inside.";
  }
  const hood = (top.neighbourhood || top.city || '').toString().trim();
  const where = hood ? ` in ${hood}` : '';
  const more = n > 1 ? ` + ${n - 1} more inside` : '';
  if (personalized) {
    if (typeof top.cashFlow === 'number' && isFinite(top.cashFlow) && top.cashFlow > 0) {
      return `Your top match: +$${Math.round(top.cashFlow).toLocaleString()}/mo cash flow${where}${more}.`;
    }
    if (typeof top.capRate === 'number' && isFinite(top.capRate) && top.capRate > 0) {
      return `Your top match: ${top.capRate.toFixed(1)}% cap rate${where}${more}.`;
    }
    return `${n} new investment ${n === 1 ? 'property' : 'properties'} matched to your search${more}.`;
  }
  if (typeof top.cashFlow === 'number' && isFinite(top.cashFlow) && top.cashFlow > 0) {
    return `Top deal this week: +$${Math.round(top.cashFlow).toLocaleString()}/mo cash flow${where}${more}.`;
  }
  if (typeof top.capRate === 'number' && isFinite(top.capRate) && top.capRate > 0) {
    return `Top pick: ${top.capRate.toFixed(1)}% cap rate${where} - ${n} ${n === 1 ? 'property' : 'properties'} scored this week.`;
  }
  return `${n} new Mississauga ${n === 1 ? 'deal' : 'deals'} scored this week - cash flow, cap rate and ROI on each.`;
}

function approvalBanner(wk, subscriberCount) {
  const url = `https://www.mississaugainvestor.ca/api/newsletter/weekly?approve=1&t=${approvalToken(wk)}`;
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
  <tr><td bgcolor="#FEF3C7" style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:20px 24px;text-align:center;">
    <div style="font-size:14px;font-weight:800;color:#92400E;margin-bottom:4px;">&#9998; DRAFT - waiting for your approval</div>
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
        { id: 'SAMPLE1', address: '1234 Lakeshore Rd E', price: 899000, hamzaScore: 8.4, capRate: 5.2, cashFlow: 312, beds: 3, estimatedRent: 4300, baseRent: 3100, basementIncome: 1200, basementTier: 'legal', neighbourhood: 'Lakeview', type: 'Detached', photos: ['https://www.mississaugainvestor.ca/images/sample-house-1.jpg'] },
        { id: 'SAMPLE2', address: '55 Village Centre Blvd', price: 649000, hamzaScore: 7.9, capRate: 4.8, cashFlow: 145, beds: 2, estimatedRent: 2700, condoFeeEstimated: true, neighbourhood: 'City Centre', type: 'Condo Apt', photos: ['https://www.mississaugainvestor.ca/images/sample-house-2.jpg'] },
        { id: 'SAMPLE3', address: '890 Clarkson Rd S', price: 1050000, hamzaScore: 7.6, capRate: 4.5, cashFlow: -85, beds: 4, estimatedRent: 3800, neighbourhood: 'Clarkson', type: 'Detached', photos: ['https://www.mississaugainvestor.ca/images/sample-house-3.jpg'] },
      ];
      // Preview uses the REAL live stats, not a hardcoded sample. A preview
      // built on frozen numbers is worthless for checking the thing that
      // actually matters - that the figures subscribers receive are current.
      const previewStats = await fetchMarketStats();
      const html = buildEmailHTML(
        previewStats || {},
        new Date(),
        {
          greetingName: 'Sam',
          dealsHtml: buildDealsHTML(sampleDeals, true),
          blogHtml: buildBlogHTML({ title: 'Sample: Where Cash Flow Still Pencils in 2026', slug: 'sample-post', excerpt: 'A look at the neighbourhoods where the numbers still work.' }),
          email: 'preview@example.com',
          preheader: buildPreheader(sampleDeals, true),
        }
      );
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // ?approve=1&t=... - approval confirmation page (from the draft email's
    // button). Token-authed; renders a confirm form, sends NOTHING itself.
    if (searchParams.get('approve') === '1') {
      const wk = weekKey(new Date());
      // `tok` is null when CRON_SECRET is absent, and an absent ?t is also null
      // - comparing them alone would pass. Require a real token explicitly.
      const tok = approvalToken(wk);
      if (!tok || searchParams.get('t') !== tok) {
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
             <button type="submit">Yes - Send to ${profiles.size} Subscribers</button>
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

    // SELF-HEALING: the Monday 14:00 UTC cron silently did not fire on
    // 2026-07-20 or 2026-07-27 - zero invocations in the logs, so the weekly
    // channel to ~480 contacts was dead for three weeks with nothing anywhere
    // to notice. A second, DAILY cron now also hits this route (vercel.json,
    // 15:30 UTC), and this dedupe makes that safe: the first successful draft
    // each ISO week takes a `newsletter-draft-<wk>` row in broadcast_sends,
    // and every later invocation that week skips. If Monday's cron fires, the
    // daily one is a no-op; if it doesn't, Monday 15:30 (or the next day)
    // catches it. Probe-then-record rather than fail-closed lock-first: this
    // path emails ONE person (the approver), so the worst failure is a
    // duplicate draft to Hamza - while lock-first would burn the week's key on
    // a draft that then failed to build, recreating the missed-week bug this
    // exists to fix.
    const draftWk = weekKey(new Date());
    const draftKey = `newsletter-draft-${draftWk}`;
    const probe = await probeSendLock(supabase, draftKey);
    if (probe.alreadySent) {
      return NextResponse.json({
        success: true,
        mode: 'draft-for-approval',
        skipped: `Draft for ${draftWk} already sent - the retry cron found nothing to do.`,
      });
    }
    if (!probe.guardReady && new Date().getUTCDay() !== 1) {
      // Guard table unreachable AND it's not Monday: without dedupe the daily
      // retry would draft every single day. Keep the retry silent off-Monday
      // and let the legacy Monday behaviour stand alone.
      console.error(`Newsletter: draft dedupe unavailable (${probe.detail || 'no detail'}) - daily retry skipped, Monday cron only.`);
      return NextResponse.json({
        success: false,
        skipped: 'Draft dedupe guard unavailable - retry runs only on Mondays until broadcast_sends is reachable.',
      });
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
        preheader: buildPreheader(deals, false),
      });

    const ok = await sendEmail(
      APPROVER,
      `[APPROVE] Mississauga Market Weekly - ${data.dateLabel} (${profiles.size} subscribers waiting)`,
      draftHtml
    );

    // Record the week's draft ONLY after the email actually went out, so a
    // failed draft leaves the key free for tomorrow's retry.
    if (ok) {
      console.log(`Newsletter: draft for ${draftWk} sent to ${APPROVER} (${profiles.size} subscribers waiting)`);
      const lock = await acquireSendLock(supabase, draftKey, 'cron-draft');
      if (lock.outcome !== 'acquired' && lock.outcome !== 'duplicate') {
        console.error('Newsletter: could not record draft dedupe row:', lock.detail || lock.outcome);
      }
    }

    return NextResponse.json({
      success: ok,
      mode: 'draft-for-approval',
      draftSentTo: APPROVER,
      subscribers: profiles.size,
      approveBy: 'Click the button in the draft email',
    });
  } catch (err) {
    console.error('Newsletter error:', err);
    return NextResponse.json({ error: 'Newsletter send failed - see server logs' }, { status: 500 });
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
    const tok = approvalToken(wk);
    if (!tok || searchParams.get('t') !== tok) {
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
      // table missing - skip the guard
    }

    const data = await prepareSendData(request, supabase);
    const result = await sendToAllSubscribers(supabase, data);

    return new Response(
      htmlPage(
        'Sent',
        `<h1>&#127881; Sent to ${result.sent} subscribers</h1>
         <p>${result.personalized} personalized to saved searches, ${result.genericTopDeals} got the top-deals edition${result.failed ? ` - ${result.failed} failed (will appear in Resend logs)` : ''}.</p>
         <a class="btn" href="https://www.mississaugainvestor.ca/admin">Open Admin</a>`
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err) {
    console.error('Approved send error:', err);
    return NextResponse.json({ error: 'Newsletter send failed - see server logs' }, { status: 500 });
  }
}
