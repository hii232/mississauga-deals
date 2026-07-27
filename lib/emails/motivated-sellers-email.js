import { unsubscribeUrl } from '@/lib/unsubscribe-token';

// ─────────────────────────────────────────────────────────────────────────────
//  "Motivated sellers" broadcast — the radar campaign.
//
//  One-off broadcast built on the same rules as announcement-email.js (table
//  layout, inline styles, one external image, CASL footer). EVERY number in it
//  arrives via the `radar` argument, fetched from /api/market-stats at
//  compose time — nothing is hardcoded, so whichever day this sends, the
//  claims are the live feed's own counts. The route refuses to send at all if
//  the radar numbers are missing or implausible.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'https://www.mississaugainvestor.ca';

const NAVY = '#1B2A4A';
const NAVY_LITE = '#25355C';
const ACCENT = '#2563EB';
const GOLD = '#F59E0B';
const PAGEBG = '#E8ECF3';
const INK = '#0F172A';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const WHITE = '#FFFFFF';
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function n(x) { return Number(x || 0).toLocaleString('en-CA'); }
function u(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${BASE}${path}${sep}utm_source=broadcast&utm_medium=email&utm_campaign=motivated-sellers`;
}
function button(href, label, { bg = ACCENT, color = WHITE, border = bg } = {}) {
  return `<a href="${href}" style="display:inline-block;background:${bg};border:1px solid ${border};color:${color};font-family:${SANS};font-size:15px;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none;">${label}</a>`;
}

export function buildMotivatedSellersEmail({ email, name, radar, assetBase = BASE } = {}) {
  const first = (name || '').trim().split(/\s+/)[0] || '';
  const greeting = first ? `Hi ${esc(first)},` : 'Hi there,';
  const unsub = email ? unsubscribeUrl(email) : `${BASE}/api/alerts/unsubscribe`;
  const headshotSrc = `${assetBase}/images/hamza-headshot.jpg`;

  const { staleCount, staleWithPriceCut, activeCount, medianDOM, staleByNeighbourhood = {} } = radar;
  const topHoods = Object.entries(staleByNeighbourhood).slice(0, 5);

  const subject = `${n(staleWithPriceCut)} Mississauga sellers have already cut their price — and they're still waiting`;
  const preheader = `${n(staleCount)} of ${n(activeCount)} active Mississauga listings have been sitting 60+ days. Here's where they are, and what that means for your next offer.`;

  const hoodRows = topHoods.map(([hood, count], i) => `
    <tr>
      <td style="padding:10px 14px;border-top:${i === 0 ? 'none' : `1px solid ${LINE}`};font-family:${SANS};font-size:14px;color:${INK};font-weight:600;">${esc(hood)}</td>
      <td align="right" style="padding:10px 14px;border-top:${i === 0 ? 'none' : `1px solid ${LINE}`};font-family:${SANS};font-size:14px;color:${ACCENT};font-weight:800;">${n(count)} listings</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${PAGEBG};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="${PAGEBG}" style="background:${PAGEBG};"><tr><td align="center" style="padding:18px 12px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- MASTHEAD -->
  <tr><td bgcolor="${NAVY}" style="background:${NAVY};background:linear-gradient(135deg,#16223D 0%,${NAVY} 55%,${NAVY_LITE} 100%);border-radius:16px 16px 0 0;padding:22px 24px;">
    <div style="font-family:${SANS};font-size:17px;font-weight:800;color:${WHITE};">MississaugaInvestor<span style="color:#8AB6FF;">.ca</span></div>
    <div style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2px;color:${GOLD};margin-top:6px;">MOTIVATED SELLER RADAR</div>
  </td></tr>

  <!-- HOOK -->
  <tr><td bgcolor="${WHITE}" style="background:${WHITE};padding:26px 24px 8px;">
    <div style="font-family:${SANS};font-size:15px;color:${INK};line-height:1.6;">${greeting}</div>
    <div style="font-family:${SANS};font-size:23px;font-weight:800;color:${INK};line-height:1.3;margin-top:12px;">
      Right now, ${n(staleCount)} Mississauga listings have been sitting on the market for 60+ days.
    </div>
    <div style="font-family:${SANS};font-size:15px;color:${MUTED};line-height:1.65;margin-top:12px;">
      ${n(staleWithPriceCut)} of them have <strong style="color:${INK};">already cut their asking price</strong> — and they're still waiting for a buyer.
      That's the strongest negotiating position a buyer gets in this market, and it's sitting in plain sight: these numbers come
      straight from live MLS data on the site, out of ${n(activeCount)} active listings${medianDOM ? ` (median time on market: ${n(medianDOM)} days)` : ''}.
    </div>
  </td></tr>

  <!-- HOOD TABLE -->
  <tr><td bgcolor="${WHITE}" style="background:${WHITE};padding:18px 24px 6px;">
    <div style="font-family:${SANS};font-size:12px;font-weight:800;letter-spacing:1.5px;color:${MUTED};">WHERE THEY'RE SITTING — TOP 5</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border:1px solid ${LINE};border-radius:12px;">
      ${hoodRows}
    </table>
    <div style="font-family:${SANS};font-size:12px;color:${MUTED};line-height:1.6;margin-top:10px;">
      "60+ days" is measured from each listing's own MLS listing date. A price cut means the ask is below the original list price.
    </div>
  </td></tr>

  <!-- WHY IT MATTERS + CTA -->
  <tr><td bgcolor="${WHITE}" style="background:${WHITE};padding:16px 24px 24px;">
    <div style="font-family:${SANS};font-size:15px;color:${INK};line-height:1.65;">
      A seller two months in who has already moved once on price is far more likely to move again — on price, on closing,
      on conditions. Every listing on the site now shows its real days on market, so you can sort the whole city by who's
      been waiting longest and open with leverage.
    </div>
    <div style="margin-top:18px;" align="center">${button(u('/listings?sort=dom'), 'See the longest-sitting listings')}</div>
  </td></tr>

  <!-- CLOSING CTA -->
  <tr><td bgcolor="${WHITE}" style="background:${WHITE};padding:0 24px 24px;border-radius:0 0 16px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td bgcolor="${NAVY}" style="background:${NAVY};background:linear-gradient(135deg,${NAVY} 0%,${NAVY_LITE} 100%);border-radius:16px;padding:24px;" align="center">
        <div style="font-family:${SANS};font-size:19px;font-weight:800;color:${WHITE};line-height:1.35;">Want the short list for your budget?</div>
        <div style="font-family:${SANS};font-size:14px;color:#C7D2E6;line-height:1.55;margin-top:8px;">Tell me your range and I'll pull the motivated sellers worth an offer — free, 15 minutes.</div>
        <div style="margin-top:16px;" align="center">${button(u('/book-call'), 'Book a free call', { bg: GOLD, color: NAVY, border: GOLD })}</div>
        <div style="font-family:${SANS};font-size:13px;color:#AFC0DE;margin-top:12px;">…or just reply to this email — it comes straight to me.</div>
      </td>
    </tr></table>

    <!-- SIGN-OFF -->
    <table cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr>
      <td width="64" valign="top" style="padding-right:14px;">
        <img src="${headshotSrc}" alt="Hamza Nouman" width="56" height="56" style="width:56px;height:56px;border-radius:50%;display:block;object-fit:cover;border:2px solid ${NAVY};" />
      </td>
      <td valign="middle">
        <div style="font-family:${SANS};font-size:16px;font-weight:800;color:${INK};">Hamza Nouman</div>
        <div style="font-family:${SANS};font-size:13px;color:${MUTED};line-height:1.5;">Sales Representative &middot; Cityscape Real Estate Ltd., Brokerage</div>
        <div style="font-family:${SANS};font-size:13px;margin-top:3px;">
          <a href="tel:+16476091289" style="color:${ACCENT};text-decoration:none;font-weight:600;">647-609-1289</a>
          <span style="color:${LINE};">&nbsp;&middot;&nbsp;</span>
          <a href="mailto:hamza@nouman.ca" style="color:${ACCENT};text-decoration:none;font-weight:600;">hamza@nouman.ca</a>
        </div>
      </td>
    </tr></table>

    <!-- FOOTER / CASL -->
    <div style="border-top:1px solid #CBD5E1;padding-top:14px;margin-top:16px;">
      <div style="font-family:${SANS};font-size:11px;line-height:1.65;color:#7A879B;">
        You're receiving this because you subscribed to deal alerts or connected with Hamza at MississaugaInvestor.ca.<br>
        <strong style="color:${MUTED};">Cityscape Real Estate Ltd., Brokerage</strong> &middot; 885 Plymouth Dr, Unit 2, Mississauga, ON L5V 0B5<br>
        Days-on-market counts and price-change figures are drawn from live MLS data at the time of sending and change daily. For information only — not an appraisal or investment advice. Listing data &copy; TRREB, deemed reliable but not guaranteed.
      </div>
      <div style="margin-top:10px;font-family:${SANS};font-size:11px;color:#7A879B;">
        <a href="${unsub}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>
        <span style="color:${LINE};">&nbsp;&middot;&nbsp;</span>
        <a href="${u('/privacy')}" style="color:${MUTED};text-decoration:underline;">Privacy</a>
        <span style="color:${LINE};">&nbsp;&middot;&nbsp;</span>
        <a href="${BASE}" style="color:${MUTED};text-decoration:underline;">mississaugainvestor.ca</a>
      </div>
    </div>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return { subject, html };
}
