import { unsubscribeUrl } from '@/lib/unsubscribe-token';
import { TYPE_ORDER, THIN_SAMPLE, approxGapDollars } from '@/lib/emails/offer-gap-data';

// Re-exported so the route and any future caller have one import site for the
// campaign, while the guard itself stays in the dependency-free data module.
export { TYPE_ORDER, THIN_SAMPLE, approxGapDollars, validateGap } from '@/lib/emails/offer-gap-data';

// ─────────────────────────────────────────────────────────────────────────────
//  "The Offer Gap" broadcast — what Mississauga sellers ACTUALLY accepted,
//  broken out by property type.
//
//  Deliberately a different mental model from the Motivated Seller Radar that
//  already went out. The radar answered "who is desperate?" from live MLS
//  days-on-market. This answers "where is my negotiating room, and where do I
//  have none?" from TRREB's own sold data — and the answer is counterintuitive
//  enough to be worth an email: detached sellers took less than asking while
//  freehold townhouse sellers got MORE than asking, in the same city, in the
//  same month.
//
//  EVERY figure arrives via the `gap` argument, read from /api/market-stats'
//  `salesByType` (transcribed by hand from the TRREB Market Watch per-type
//  pages — see CLAUDE.md). Nothing here is hardcoded and nothing is inferred
//  from live listings, so the email cannot drift from the report it cites.
//
//  TWO honesty rules are baked into the layout rather than left to the writer:
//    1. The report month is stated in the body, not just the footer. This data
//       is a monthly snapshot that runs a month or two behind by nature, and an
//       investor reading "sellers are accepting 96%" needs to know WHICH month.
//    2. Any property type with a thin sample is flagged inline. Freehold
//       townhouses carry the most surprising number in the whole table (over
//       asking) off the fewest sales, and presenting that beside 227 detached
//       sales without a word would be quietly misleading.
//
//  The one derived figure — the approximate dollar gap — is computed from the
//  average sold price and the average sale-to-list ratio, which is NOT a number
//  TRREB publishes. It is labelled "≈" and explained in the footnote, per the
//  project rule: never present a derived figure as a reported one.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'https://www.mississaugainvestor.ca';

const NAVY = '#1B2A4A';
const NAVY_LITE = '#25355C';
const ACCENT = '#2563EB';
const GOLD = '#F59E0B';
const GREEN = '#047857';
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
function money(x) { return '$' + Number(x || 0).toLocaleString('en-CA'); }
function u(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${BASE}${path}${sep}utm_source=broadcast&utm_medium=email&utm_campaign=offer-gap`;
}
function button(href, label, { bg = ACCENT, color = WHITE, border = bg } = {}) {
  return `<a href="${href}" style="display:inline-block;background:${bg};border:1px solid ${border};color:${color};font-family:${SANS};font-size:15px;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none;">${label}</a>`;
}

export function buildOfferGapEmail({ email, name, gap, assetBase = BASE } = {}) {
  const first = (name || '').trim().split(/\s+/)[0] || '';
  const greeting = first ? `Hi ${esc(first)},` : 'Hi there,';
  const unsub = email ? unsubscribeUrl(email) : `${BASE}/api/alerts/unsubscribe`;
  const headshotSrc = `${assetBase}/images/hamza-headshot.jpg`;

  const { salesByType, month, activeCount } = gap;

  const rows = TYPE_ORDER
    .map(([key, label, prose]) => ({ key, label, prose, ...(salesByType[key] || {}) }))
    .filter((r) => r.spLp > 0);

  // Every headline figure is DERIVED FROM THE ROWS, never written by hand. An
  // earlier draft of this file said the buyer's market was "only true for two
  // of the five property types" — a sentence typed from memory while the data
  // said three (96, 97 and 98 are all under asking). It read perfectly and it
  // was false, which is the exact failure mode a broadcast cannot recover from.
  // If a claim can't be computed from `rows`, it doesn't go in the email.
  const byRatio = rows.slice().sort((a, b) => a.spLp - b.spLp);
  const lowest = byRatio[0];
  const highest = byRatio[byRatio.length - 1];
  const under = rows.filter((r) => r.spLp < 100);
  const over = rows.filter((r) => r.spLp > 100).sort((a, b) => b.spLp - a.spLp)[0];
  const lowestGap = lowest ? approxGapDollars(lowest.avgPrice, lowest.spLp) : null;
  const slowest = rows.slice().sort((a, b) => (b.ldom || 0) - (a.ldom || 0))[0];
  const fastest = rows.slice().sort((a, b) => (a.ldom || 0) - (b.ldom || 0))[0];
  // The two types where the discount is actually being handed over: cheapest
  // ratio, plus the slowest seller if that is a different category.
  const leverage = [lowest, slowest && slowest.key !== lowest.key ? slowest : null].filter(Boolean);

  const subject = lowest && highest && lowest.key !== highest.key
    ? `Mississauga ${lowest.prose} sold at ${lowest.spLp}% of asking. ${highest.prose[0].toUpperCase()}${highest.prose.slice(1)} sold at ${highest.spLp}%.`
    : `What Mississauga sellers actually accepted last month, by property type`;

  const preheader = lowestGap > 0
    ? `Your negotiating room is real — but it is not spread evenly. On the average ${month} ${lowest.prose.replace(/s$/, '')} sale it was roughly ${money(lowestGap)}. On other types it was nothing at all.`
    : `Sale-to-list ratios and days-to-sell for every Mississauga property type, straight from the TRREB report.`;

  const typeRows = rows.map((r, i) => {
    const thin = (r.sales || 0) < THIN_SAMPLE;
    const isOver = r.spLp > 100;
    const border = i === 0 ? 'none' : `1px solid ${LINE}`;
    return `
    <tr>
      <td style="padding:11px 12px;border-top:${border};font-family:${SANS};font-size:14px;color:${INK};font-weight:600;">
        ${esc(r.label)}${thin ? `<span style="display:block;font-size:11px;font-weight:600;color:${GOLD};margin-top:2px;">only ${n(r.sales)} sales — thin sample</span>` : ''}
      </td>
      <td align="right" style="padding:11px 12px;border-top:${border};font-family:${SANS};font-size:15px;font-weight:800;color:${isOver ? GREEN : ACCENT};white-space:nowrap;">
        ${n(r.spLp)}%
      </td>
      <td align="right" style="padding:11px 12px;border-top:${border};font-family:${SANS};font-size:14px;color:${MUTED};white-space:nowrap;">
        ${n(r.ldom)} days
      </td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${PAGEBG};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="${PAGEBG}" style="background:${PAGEBG};"><tr><td align="center" style="padding:18px 12px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- MASTHEAD -->
  <tr><td bgcolor="${NAVY}" style="background:${NAVY};background:linear-gradient(135deg,#16223D 0%,${NAVY} 55%,${NAVY_LITE} 100%);border-radius:16px 16px 0 0;padding:22px 24px;">
    <div style="font-family:${SANS};font-size:17px;font-weight:800;color:${WHITE};">MississaugaInvestor<span style="color:#8AB6FF;">.ca</span></div>
    <div style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2px;color:${GOLD};margin-top:6px;">THE OFFER GAP</div>
  </td></tr>

  <!-- HOOK -->
  <tr><td bgcolor="${WHITE}" style="background:${WHITE};padding:26px 24px 8px;">
    <div style="font-family:${SANS};font-size:15px;color:${INK};line-height:1.6;">${greeting}</div>
    <div style="font-family:${SANS};font-size:23px;font-weight:800;color:${INK};line-height:1.3;margin-top:12px;">
      &ldquo;Buyer&rsquo;s market&rdquo; isn&rsquo;t one thing. Last month in Mississauga it ran from ${n(lowest.spLp)}% of asking to ${n(highest.spLp)}% &mdash; depending entirely on what was being sold.
    </div>
    <div style="font-family:${SANS};font-size:15px;color:${MUTED};line-height:1.65;margin-top:12px;">
      In ${esc(month)}, Mississauga ${esc(lowest.prose)} sold for <strong style="color:${INK};">${n(lowest.spLp)}% of the asking price</strong>${lowestGap > 0 ? ` &mdash; roughly <strong style="color:${INK};">${money(lowestGap)}</strong> off the average sale` : ''}.
      ${over ? `In the same city, in the same month, <strong style="color:${INK};">${esc(over.prose)}</strong> went for <strong style="color:${GREEN};">${n(over.spLp)}%</strong> &mdash; <em>more</em> than the ask.` : ''}
    </div>
    <div style="font-family:${SANS};font-size:15px;color:${MUTED};line-height:1.65;margin-top:10px;">
      ${under.length ? `${under.length} of the ${rows.length} categories sold below asking and ${rows.length - under.length} did not.` : ''}
      Walking into all of them with the same offer strategy is how buyers either overpay or lose the property outright.
    </div>
  </td></tr>

  <!-- TABLE -->
  <tr><td bgcolor="${WHITE}" style="background:${WHITE};padding:18px 24px 6px;">
    <div style="font-family:${SANS};font-size:12px;font-weight:800;letter-spacing:1.5px;color:${MUTED};">MISSISSAUGA, ${esc(String(month).toUpperCase())}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border:1px solid ${LINE};border-radius:12px;">
      <tr>
        <td style="padding:9px 12px;font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:0.5px;color:${MUTED};">PROPERTY TYPE</td>
        <td align="right" style="padding:9px 12px;font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:0.5px;color:${MUTED};white-space:nowrap;">% OF ASKING</td>
        <td align="right" style="padding:9px 12px;font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:0.5px;color:${MUTED};white-space:nowrap;">TO SELL</td>
      </tr>
      ${typeRows}
    </table>
    <div style="font-family:${SANS};font-size:12px;color:${MUTED};line-height:1.6;margin-top:10px;">
      Sale-to-list ratio and days-on-market for every Mississauga sale in ${esc(month)}, from the TRREB Market Watch report.
      Anything under 100% means sellers took less than they asked; over 100% means competing offers.
      ${lowestGap > 0 ? `The ${money(lowestGap)} figure is <strong>approximate</strong> &mdash; it is worked back from the average sold price and the average ratio, which is not a dollar amount TRREB publishes.` : ''}
    </div>
  </td></tr>

  <!-- WHAT TO DO WITH IT -->
  <tr><td bgcolor="${WHITE}" style="background:${WHITE};padding:16px 24px 6px;">
    <div style="font-family:${SANS};font-size:12px;font-weight:800;letter-spacing:1.5px;color:${MUTED};">WHAT I&rsquo;D ACTUALLY DO WITH THIS</div>
    <div style="font-family:${SANS};font-size:15px;color:${INK};line-height:1.7;margin-top:10px;">
      <strong>Push hardest on ${esc(leverage.map((r) => r.prose).join(' and '))}.</strong>
      <span style="color:${MUTED};">That&rsquo;s where the discount is actually being handed over &mdash; ${esc(lowest.prose)} at ${n(lowest.spLp)}% of ask${slowest && slowest.key !== lowest.key ? `, and ${esc(slowest.prose)} sat longest at ${n(slowest.ldom)} days before selling. Time on market is leverage` : ''}.</span>
    </div>
    <div style="font-family:${SANS};font-size:15px;color:${INK};line-height:1.7;margin-top:12px;">
      <strong>Don&rsquo;t lowball the tight ones.</strong>
      <span style="color:${MUTED};">${fastest ? `${esc(fastest.prose[0].toUpperCase() + fastest.prose.slice(1))} moved in ${n(fastest.ldom)} days` : 'The fastest categories move in under three weeks'} &mdash; there, a cheeky opening offer doesn&rsquo;t win a discount, it just loses the property to someone who read the market.</span>
    </div>
    <div style="font-family:${SANS};font-size:15px;color:${INK};line-height:1.7;margin-top:12px;">
      <strong>Check the gap on the actual listing before you offer.</strong>
      <span style="color:${MUTED};">Every listing on the site shows its own days on market and whether the ask has already been cut${activeCount ? `, across all ${n(activeCount)} active Mississauga listings` : ''}. The city-wide averages tell you where to look; the individual listing tells you what to write.</span>
    </div>
    <div style="margin-top:20px;" align="center">${button(u('/listings?sort=dom'), 'See where the leverage is right now')}</div>
  </td></tr>

  <!-- CLOSING CTA -->
  <tr><td bgcolor="${WHITE}" style="background:${WHITE};padding:18px 24px 24px;border-radius:0 0 16px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td bgcolor="${NAVY}" style="background:${NAVY};background:linear-gradient(135deg,${NAVY} 0%,${NAVY_LITE} 100%);border-radius:16px;padding:24px;" align="center">
        <div style="font-family:${SANS};font-size:19px;font-weight:800;color:${WHITE};line-height:1.35;">Got a specific property in mind?</div>
        <div style="font-family:${SANS};font-size:14px;color:#C7D2E6;line-height:1.55;margin-top:8px;">Send me the address and I&rsquo;ll tell you what comparable ones actually sold for &mdash; and what I&rsquo;d open at. Free, 15 minutes.</div>
        <div style="margin-top:16px;" align="center">${button(u('/book-call'), 'Book a free call', { bg: GOLD, color: NAVY, border: GOLD })}</div>
        <div style="font-family:${SANS};font-size:13px;color:#AFC0DE;margin-top:12px;">&hellip;or just reply to this email — it comes straight to me.</div>
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
        Sale-to-list ratios, sales counts and days-on-market are Mississauga figures from the TRREB Market Watch report for ${esc(month)}, the most recent published at the time of sending; they describe closed sales in that month and are not a forecast. Categories with few sales are flagged in the table. For information only &mdash; not an appraisal or investment advice. Listing data &copy; TRREB, deemed reliable but not guaranteed.
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
