import { unsubscribeUrl } from '@/lib/unsubscribe-token';

// ─────────────────────────────────────────────────────────────────────────────
//  "The Mississauga Monthly" - the TRREB report-day briefing.
//
//  DELIBERATELY NOT the house masthead template and not the offer-picks
//  personal-note style either - a fourth email in either skin reads as a
//  rerun. This one is a LEDGER: a dated report card of the month's numbers,
//  built to be skimmed in fifteen seconds and kept for reference. Plain
//  header, one honest headline, two ruled tables, one short "what changed"
//  paragraph, one CTA. The design says "statement from your data source",
//  which is the exact brand position the AI-visibility work stakes out.
//
//  EDITORIAL RULES (enforced by what buildMarketReportData exposes):
//    * The MEDIAN leads. The average is shown with it, and when the two
//      diverge (report.mixDivergence) the email says WHY in one sentence -
//      the mix of homes sold shifted - instead of headlining a scary average
//      swing the median contradicts. Numbers investors can trust > drama.
//    * Month-over-month deltas are computed from two published TRREB rows and
//      labelled "vs <prev month>". Nothing is projected or interpolated.
//    * A null delta renders as nothing, never as 0.0%.
//    * The live strip renders only when the builder supplied it (feed healthy
//      at compose time) and is labelled as live-today, separate from TRREB.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'https://www.mississaugainvestor.ca';

const INK = '#0F172A';
const NAVY = '#1B2A4A';
const MUTED = '#64748B';
const FAINT = '#94A3B8';
const ACCENT = '#2563EB';
const GOOD = '#047857';
const BAD = '#B91C1C';
const PAGEBG = '#F1F5F9';
const LINE = '#E2E8F0';
const RULE = '#CBD5E1';
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (x) => '$' + Math.round(Number(x) || 0).toLocaleString('en-CA');
const n = (x) => Number(x || 0).toLocaleString('en-CA');
const u = (path) => {
  const sep = path.includes('?') ? '&' : '?';
  return `${BASE}${path}${sep}utm_source=broadcast&utm_medium=email&utm_campaign=market-report`;
};

// Signed delta chip. null -> empty string (a missing figure renders nothing).
function delta(v, { suffix = '%', goodWhenUp = true } = {}) {
  if (!Number.isFinite(v)) return '';
  const up = v > 0;
  const color = v === 0 ? MUTED : (up === goodWhenUp ? GOOD : BAD);
  const sign = up ? '+' : '';
  return `<span style="color:${color};font-weight:700;white-space:nowrap;">${sign}${v}${suffix}</span>`;
}

function ledgerRow(label, nowVal, prevVal, deltaHtml, last = false) {
  return `<tr>
    <td style="padding:10px 0;font-family:${SANS};font-size:13px;color:${MUTED};border-bottom:${last ? '0' : `1px solid ${LINE}`};">${label}</td>
    <td align="right" style="padding:10px 0 10px 8px;font-family:${SANS};font-size:13px;color:${FAINT};border-bottom:${last ? '0' : `1px solid ${LINE}`};white-space:nowrap;">${prevVal}</td>
    <td align="right" style="padding:10px 0 10px 14px;font-family:${SANS};font-size:14px;font-weight:700;color:${INK};border-bottom:${last ? '0' : `1px solid ${LINE}`};white-space:nowrap;">${nowVal}</td>
    <td align="right" style="padding:10px 0 10px 12px;font-family:${SANS};font-size:12px;border-bottom:${last ? '0' : `1px solid ${LINE}`};">${deltaHtml}</td>
  </tr>`;
}

/**
 * @param {{ email: string, name?: string, report: object }} args
 * @returns {{ subject: string, html: string, text: string }}
 */
export function buildMarketReportEmail({ email, name = '', report }) {
  const r = report;
  const first = (name || '').trim().split(/\s+/)[0];
  const unsub = email ? unsubscribeUrl(email) : `${BASE}/api/alerts/unsubscribe`;

  // Subject stays under ~70 chars so Gmail doesn't cut the hook ("out today").
  // $860K is display-rounding of the real median, same as the site's fmtK.
  const kMedian = '$' + Math.round(r.now.medianPrice / 1000) + 'K';
  const subject = `Mississauga ${r.monthLabel}: median ${kMedian}, ${n(r.now.sales)} sales - TRREB out today`;

  // The one editorial sentence, chosen by data. Divergence month: explain the
  // gap. Aligned month: report the direction plainly.
  const medianWord = r.mom.median === null ? '' : (r.mom.median < 0 ? 'down' : r.mom.median > 0 ? 'up' : 'flat');
  const headlineNote = r.mixDivergence
    ? `The average moved ${delta(r.mom.avg)} against ${delta(r.mom.median)} for the median. When those two split this far, it means the <em>mix</em> of homes that sold changed - more of the month's sales came from the lower-priced end - not that every home repriced. The median is the number that resists that distortion, which is why we lead with it.`
    : `Average and median moved together this month${r.mom.median !== null ? ` (median ${medianWord} ${Math.abs(r.mom.median)}%)` : ''}, which usually means a genuine price move rather than a shift in which homes sold.`;

  // Conditional tightening line - only rendered when the data actually says it.
  const tightening = (r.mom.snlrPts !== null && r.mom.snlrPts > 0 && r.gta?.newListingsYoy < 0)
    ? `<p style="margin:0 0 18px;font-family:${SANS};font-size:14px;line-height:1.65;color:${INK};">One thing to watch: sales are absorbing a rising share of listings (SNLR ${r.now.snlr}%, up ${r.mom.snlrPts} pts), and GTA-wide new listings are down ${Math.abs(r.gta.newListingsYoy)}% year-over-year. Fewer fresh listings against steadier demand is how negotiating room disappears - if that holds, today's leverage doesn't last.</p>`
    : '';

  const typeRows = r.types.map((t, i) => `<tr>
      <td style="padding:9px 0;font-family:${SANS};font-size:13px;color:${INK};border-bottom:${i === r.types.length - 1 ? '0' : `1px solid ${LINE}`};">${esc(t.label)}</td>
      <td align="right" style="padding:9px 0 9px 8px;font-family:${SANS};font-size:13px;color:${MUTED};border-bottom:${i === r.types.length - 1 ? '0' : `1px solid ${LINE}`};">${n(t.sales)}</td>
      <td align="right" style="padding:9px 0 9px 12px;font-family:${SANS};font-size:13px;font-weight:700;color:${INK};border-bottom:${i === r.types.length - 1 ? '0' : `1px solid ${LINE}`};white-space:nowrap;">${money(t.avgPrice)}</td>
      <td align="right" style="padding:9px 0 9px 12px;font-family:${SANS};font-size:13px;color:${MUTED};border-bottom:${i === r.types.length - 1 ? '0' : `1px solid ${LINE}`};">${t.spLp !== null ? t.spLp + '%' : '&mdash;'}</td>
      <td align="right" style="padding:9px 0 9px 12px;font-family:${SANS};font-size:13px;color:${MUTED};border-bottom:${i === r.types.length - 1 ? '0' : `1px solid ${LINE}`};">${t.ldom !== null ? t.ldom : '&mdash;'}</td>
    </tr>`).join('');

  const liveStrip = r.live ? `
  <tr><td style="padding:0 28px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td bgcolor="#EFF6FF" style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:16px 18px;">
      <div style="font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${ACCENT};margin-bottom:8px;">Live on the site today &middot; not part of the TRREB report</div>
      <div style="font-family:${SANS};font-size:13px;line-height:1.7;color:${INK};">
        ${n(r.live.activeCount)} active Mississauga listings${r.live.medianDOM !== null ? ` &middot; median ${r.live.medianDOM} days on market` : ''}${r.live.priceDropCount !== null ? ` &middot; ${n(r.live.priceDropCount)} carrying a price cut` : ''}.<br>
        Of the ${n(r.live.scoredCount)} we score for cash flow${r.live.cfPlusCount !== null ? `, <strong>${r.live.cfPlusCount} are cash-flow positive</strong> at 20% down` : ''}${r.live.bestCap !== null ? `; the best cap rate on the market is ${r.live.bestCap}%` : ''}.
      </div>
    </td></tr></table>
  </td></tr>` : '';

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${PAGEBG};">
<div style="display:none;max-height:0;overflow:hidden;">TRREB released ${esc(r.monthLabel)}'s numbers this morning. Median ${money(r.now.medianPrice)}, ${n(r.now.sales)} sales - here's what actually changed.</div>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" bgcolor="${PAGEBG}" style="background:${PAGEBG};"><tr><td align="center" style="padding:28px 12px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">

  <!-- Dated report header -->
  <tr><td style="padding:26px 28px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td style="font-family:${SANS};font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${NAVY};">The Mississauga Monthly</td>
      <td align="right" style="font-family:${SANS};font-size:12px;color:${FAINT};">TRREB Market Watch &middot; ${esc(r.monthLabel)}</td>
    </tr></table>
    <div style="border-bottom:2px solid ${NAVY};margin-top:10px;"></div>
  </td></tr>

  <tr><td style="padding:22px 28px 0;">
    <p style="margin:0 0 16px;font-family:${SANS};font-size:14px;line-height:1.65;color:${INK};">${first ? esc(first) + ' - ' : ''}TRREB released ${esc(r.monthLabel)}'s Market Watch this morning. We read the full report so you don't have to - here is Mississauga, same-day.</p>
  </td></tr>

  <!-- Headline: the median leads -->
  <tr><td style="padding:0 28px 6px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td width="50%" style="padding:0 8px 0 0;">
        <div style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${MUTED};">Median sold price</div>
        <div style="font-family:${SANS};font-size:32px;font-weight:800;color:${NAVY};line-height:1.15;">${money(r.now.medianPrice)}</div>
        <div style="font-family:${SANS};font-size:12px;color:${MUTED};">${delta(r.mom.median)}${r.mom.median !== null ? ` vs ${esc(r.prev.month)}` : ''}</div>
      </td>
      <td width="50%" style="padding:0 0 0 8px;border-left:1px solid ${LINE};">
        <div style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${MUTED};padding-left:14px;">Average sold price</div>
        <div style="font-family:${SANS};font-size:24px;font-weight:700;color:${INK};line-height:1.3;padding-left:14px;">${money(r.now.avgPrice)}</div>
        <div style="font-family:${SANS};font-size:12px;color:${MUTED};padding-left:14px;">${delta(r.mom.avg)}${r.mom.avg !== null ? ` vs ${esc(r.prev.month)}` : ''}</div>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:14px 28px 20px;">
    <p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.65;color:${MUTED};">${headlineNote}</p>
  </td></tr>

  <!-- Month-over-month ledger -->
  <tr><td style="padding:0 28px 22px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:0 0 6px;font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${NAVY};border-bottom:2px solid ${RULE};">The month in six lines</td>
        <td align="right" style="padding:0 0 6px 8px;font-family:${SANS};font-size:11px;color:${FAINT};border-bottom:2px solid ${RULE};">${esc(r.prev.month)}</td>
        <td align="right" style="padding:0 0 6px 14px;font-family:${SANS};font-size:11px;font-weight:700;color:${NAVY};border-bottom:2px solid ${RULE};">${esc(r.now.month)}</td>
        <td align="right" style="padding:0 0 6px 12px;font-family:${SANS};font-size:11px;color:${FAINT};border-bottom:2px solid ${RULE};">MoM</td>
      </tr>
      ${ledgerRow('Homes sold', n(r.now.sales), r.prev.sales !== null ? n(r.prev.sales) : '&mdash;', delta(r.mom.sales))}
      ${ledgerRow('Median price', money(r.now.medianPrice), r.prev.medianPrice !== null ? money(r.prev.medianPrice) : '&mdash;', delta(r.mom.median))}
      ${ledgerRow('Average price', money(r.now.avgPrice), r.prev.avgPrice !== null ? money(r.prev.avgPrice) : '&mdash;', delta(r.mom.avg))}
      ${ledgerRow('Active listings', n(r.now.activeListings), r.prev.activeListings !== null ? n(r.prev.activeListings) : '&mdash;', delta(r.mom.active, { goodWhenUp: false }))}
      ${ledgerRow('Sales-to-new-listings', r.now.snlr + '%', r.prev.snlr !== null ? r.prev.snlr + '%' : '&mdash;', delta(r.mom.snlrPts, { suffix: ' pts' }))}
      ${ledgerRow('Days on market (avg)', r.now.ldom !== null ? String(r.now.ldom) : '&mdash;', r.prev.ldom !== null ? String(r.prev.ldom) : '&mdash;', '', true)}
    </table>
  </td></tr>

  ${tightening ? `<tr><td style="padding:0 28px 0;">${tightening}</td></tr>` : ''}

  <!-- Per-type table -->
  <tr><td style="padding:0 28px 22px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:0 0 6px;font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${NAVY};border-bottom:2px solid ${RULE};">By home type</td>
        <td align="right" style="padding:0 0 6px 8px;font-family:${SANS};font-size:11px;color:${FAINT};border-bottom:2px solid ${RULE};">Sold</td>
        <td align="right" style="padding:0 0 6px 12px;font-family:${SANS};font-size:11px;color:${FAINT};border-bottom:2px solid ${RULE};">Avg price</td>
        <td align="right" style="padding:0 0 6px 12px;font-family:${SANS};font-size:11px;color:${FAINT};border-bottom:2px solid ${RULE};">SP/LP</td>
        <td align="right" style="padding:0 0 6px 12px;font-family:${SANS};font-size:11px;color:${FAINT};border-bottom:2px solid ${RULE};">Days</td>
      </tr>
      ${typeRows}
    </table>
    ${r.gta ? `<div style="margin-top:10px;font-family:${SANS};font-size:11px;line-height:1.6;color:${FAINT};">GTA-wide for context: average ${money(r.gta.avgPrice)}${r.gta.yoy !== null ? ` (${r.gta.yoy > 0 ? '+' : ''}${r.gta.yoy}% year-over-year)` : ''} on ${r.gta.sales !== null ? n(r.gta.sales) : ''} sales. Year-over-year figures are GTA-wide; TRREB publishes no per-city YoY.</div>` : ''}
  </td></tr>

  ${liveStrip}

  <!-- CTA -->
  <tr><td style="padding:0 28px 26px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td bgcolor="${NAVY}" style="background:${NAVY};border-radius:10px;padding:20px 22px;" align="center">
      <div style="font-family:${SANS};font-size:14px;font-weight:700;color:#ffffff;margin-bottom:4px;">Want these numbers on a specific property?</div>
      <div style="font-family:${SANS};font-size:12px;color:#C7D2E4;margin-bottom:14px;">The full dashboard updates through the day, or just reply to this email - it comes straight to Hamza.</div>
      <a href="${u('/market-pulse')}" style="display:inline-block;background:#ffffff;color:${NAVY};font-family:${SANS};font-size:13px;font-weight:700;padding:11px 20px;border-radius:8px;text-decoration:none;margin:0 4px 6px;">See the live dashboard</a>
      <a href="${u('/book-call')}" style="display:inline-block;background:${ACCENT};color:#ffffff;font-family:${SANS};font-size:13px;font-weight:700;padding:11px 20px;border-radius:8px;text-decoration:none;margin:0 4px 6px;">Book a free 30-min call</a>
    </td></tr></table>
  </td></tr>

  <!-- Signoff + CASL footer -->
  <tr><td style="padding:0 28px 26px;">
    <div style="font-family:${SANS};font-size:13px;line-height:1.6;color:${INK};">- Hamza Nouman<br>
      <span style="color:${MUTED};">Sales Representative &middot; Cityscape Real Estate Ltd., Brokerage &middot; 647-609-1289</span></div>
    <div style="border-top:1px solid ${LINE};margin-top:18px;padding-top:14px;font-family:${SANS};font-size:11px;line-height:1.7;color:${FAINT};">
      You're receiving this because you subscribed to deal alerts or connected with Hamza at MississaugaInvestor.ca.
      To make sure next month's report reaches your inbox, add notifications@mississaugainvestor.ca to your contacts.<br>
      Cityscape Real Estate Ltd., Brokerage &middot; 885 Plymouth Dr, Unit 2, Mississauga, ON L5V 0B5<br>
      Sold statistics from TRREB Market Watch ${esc(r.monthLabel)} (${esc(r.code)}); month-over-month figures computed from the published monthly reports. Live-listing figures are computed from MLS data at send time and change daily. &copy; TRREB - deemed reliable but not guaranteed. Not financial advice.<br>
      <a href="${unsub}" style="color:${FAINT};">Unsubscribe</a>
    </div>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  const text = [
    `THE MISSISSAUGA MONTHLY - TRREB Market Watch ${r.monthLabel}`,
    '',
    `TRREB released ${r.monthLabel}'s Market Watch this morning. Here is Mississauga, same-day.`,
    '',
    `Median sold price: ${money(r.now.medianPrice)}${r.mom.median !== null ? ` (${r.mom.median > 0 ? '+' : ''}${r.mom.median}% vs ${r.prev.month})` : ''}`,
    `Average sold price: ${money(r.now.avgPrice)}${r.mom.avg !== null ? ` (${r.mom.avg > 0 ? '+' : ''}${r.mom.avg}% vs ${r.prev.month})` : ''}`,
    `Homes sold: ${n(r.now.sales)} | Active: ${n(r.now.activeListings)} | SNLR: ${r.now.snlr}%${r.now.ldom !== null ? ` | Avg days: ${r.now.ldom}` : ''}`,
    '',
    r.mixDivergence
      ? 'Note: the average moved much more than the median this month. That gap means the mix of homes sold shifted - not that every home repriced. Trust the median.'
      : 'Average and median moved together this month - a genuine price move rather than a mix shift.',
    '',
    'By home type (sold / avg price):',
    ...r.types.map((t) => `  ${t.label}: ${n(t.sales)} / ${money(t.avgPrice)}`),
    '',
    `Live dashboard: ${u('/market-pulse')}`,
    `Book a free call: ${u('/book-call')}`,
    '',
    '- Hamza Nouman, Sales Representative, Cityscape Real Estate Ltd., Brokerage',
    '',
    "You're receiving this because you subscribed to deal alerts or connected with Hamza at MississaugaInvestor.ca.",
    'To make sure next month\'s report reaches your inbox, add notifications@mississaugainvestor.ca to your contacts.',
    'Cityscape Real Estate Ltd., Brokerage, 885 Plymouth Dr, Unit 2, Mississauga, ON L5V 0B5',
    `Sold statistics from TRREB Market Watch ${r.monthLabel} (${r.code}). (c) TRREB - deemed reliable but not guaranteed. Not financial advice.`,
    '',
    `Unsubscribe: ${unsub}`,
  ].join('\n');

  return { subject, html, text };
}
