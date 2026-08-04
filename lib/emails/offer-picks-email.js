import { unsubscribeUrl } from '@/lib/unsubscribe-token';
import { LIMITS } from '@/lib/emails/offer-picks-data';

// ─────────────────────────────────────────────────────────────────────────────
//  "What I'd offer this week" - three real listings, three real numbers.
//
//  DELIBERATELY NOT THE HOUSE TEMPLATE. The two campaigns that already went out
//  (platform-launch, motivated-seller radar) share one skeleton:
//
//      navy gradient masthead + gold all-caps kicker
//        -> big-number hook
//        -> bordered stats table
//        -> navy "Book a free call" box
//        -> headshot signoff
//
//  A third email in that shape reads as the same email again no matter how
//  different the data is - which is exactly the complaint that prompted this
//  one. So this is a different artifact, not a reskin:
//
//    * no masthead banner, no gold kicker - a plain sender line and a personal
//      opening, so it reads like a note rather than a broadcast
//    * PHOTO-LED: the visual centre of each block is the property, not a stat
//    * the payload is three specific addresses with the price to open at, not
//      a city-wide aggregate
//    * one CTA, and the primary action is REPLYING, not clicking
//
//  Every number comes from lib/emails/offer-picks-data.js, which is unit-tested
//  (offer-picks-data.test.mjs). The offer is anchored to what that property type
//  actually sold for last month per TRREB, adjusted only by evidence the listing
//  itself carries. The email states the reasoning inline for each property so a
//  reader can check the logic rather than trust it - and says plainly that this
//  is an opening position, not an appraisal.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'https://www.mississaugainvestor.ca';

const INK = '#0F172A';
const NAVY = '#1B2A4A';
const MUTED = '#64748B';
const FAINT = '#94A3B8';
const ACCENT = '#2563EB';
const MONEY = '#047857';
const MONEYBG = '#ECFDF5';
const MONEYLINE = '#A7F3D0';
const CARD = '#FFFFFF';
const PAGEBG = '#F1F5F9';
const LINE = '#E2E8F0';
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function money(x) { return '$' + Math.round(Number(x) || 0).toLocaleString('en-CA'); }
function n(x) { return Number(x || 0).toLocaleString('en-CA'); }
function u(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${BASE}${path}${sep}utm_source=broadcast&utm_medium=email&utm_campaign=offer-picks`;
}

/**
 * The one-sentence justification under each offer, assembled ONLY from the
 * leverage that actually applied to that listing. `usedDom` / `usedCut` come
 * from the offer calculation itself, so the email can never claim a reason the
 * arithmetic didn't use.
 */
function reasoning(o, typeLabel) {
  const bits = [`${typeLabel} sold at ${n(o.marketRatio)}% of asking across Mississauga last month`];
  if (o.usedDom) {
    bits.push(`this one has been listed ${n(o.dom)} days against a ${n(o.typeLdom)}-day typical sale`);
  }
  if (o.usedCut) {
    bits.push(`the ask has already come down ${n(o.priceDrop)}%, so the seller has shown they'll move`);
  }
  return bits.join('; ') + '.';
}

const TYPE_LABEL = {
  detached: 'Detached homes',
  semiDetached: 'Semis',
  townhouse: 'Freehold townhouses',
  condoTown: 'Condo townhouses',
  condoApt: 'Condo apartments',
};

export function buildOfferPicksEmail({ email, name, data, assetBase = BASE } = {}) {
  const first = (name || '').trim().split(/\s+/)[0] || '';
  const greeting = first ? `Hi ${esc(first)},` : 'Hi there,';
  const unsub = email ? unsubscribeUrl(email) : `${BASE}/api/alerts/unsubscribe`;
  const { picks, month } = data;

  const top = picks[0];
  const totalBelow = picks.reduce((s, p) => s + p.offer.belowAsk, 0);

  const subject = `${esc(top.listing.address)} - I'd open at ${money(top.offer.offer)}, not ${money(top.listing.price)}`;
  const preheader = `Three Mississauga listings where the seller has a reason to negotiate, and the number I'd actually open at on each. ${money(totalBelow)} below asking across the three.`;

  const cards = picks.map((p, i) => {
    const l = p.listing;
    const o = p.offer;
    const photo = (l.photos || l.images || [])[0] || '';
    const href = u(`/listing/${encodeURIComponent(l.id)}`);
    const facts = [
      l.beds ? `${n(l.beds)} bed` : null,
      l.baths ? `${n(l.baths)} bath` : null,
      l.type || null,
    ].filter(Boolean).join(' &nbsp;·&nbsp; ');

    return `
  <tr><td style="padding:0 0 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${CARD}" style="background:${CARD};border:1px solid ${LINE};border-radius:14px;">

      ${photo ? `<tr><td style="padding:0;">
        <a href="${href}" style="text-decoration:none;display:block;">
          <img src="${esc(photo)}" alt="${esc(l.address)}" width="600" style="width:100%;max-width:600px;height:auto;display:block;border-radius:13px 13px 0 0;border:0;" />
        </a>
      </td></tr>` : ''}

      <tr><td style="padding:16px 18px 0;">
        <div style="font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:1.2px;color:${FAINT};">
          ${i + 1} OF ${picks.length} &nbsp;·&nbsp; ${esc(String(l.neighbourhood || l.city || 'Mississauga').toUpperCase())}
        </div>
        <div style="font-family:${SANS};font-size:19px;font-weight:800;color:${INK};line-height:1.3;margin-top:6px;">
          <a href="${href}" style="color:${INK};text-decoration:none;">${esc(l.address)}</a>
        </div>
        <div style="font-family:${SANS};font-size:14px;color:${MUTED};margin-top:6px;">
          Asking <strong style="color:${INK};">${money(l.price)}</strong>${facts ? ` &nbsp;·&nbsp; ${facts}` : ''}
        </div>
        <div style="font-family:${SANS};font-size:13px;color:${MUTED};margin-top:4px;">
          ${n(o.dom)} days on market${o.priceDrop >= 1 ? ` &nbsp;·&nbsp; <span style="color:${MONEY};font-weight:700;">already cut ${n(o.priceDrop)}%</span>` : ''}
        </div>
      </td></tr>

      <tr><td style="padding:14px 18px 18px;">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="${MONEYBG}" style="background:${MONEYBG};border:1px solid ${MONEYLINE};border-radius:10px;">
          <tr><td style="padding:14px 16px;">
            <div style="font-family:${SANS};font-size:12px;font-weight:800;letter-spacing:0.6px;color:${MONEY};">WHERE I'D OPEN</div>
            <div style="font-family:${SANS};font-size:26px;font-weight:800;color:${INK};line-height:1.2;margin-top:4px;">
              ${money(o.offer)}
            </div>
            <div style="font-family:${SANS};font-size:13px;color:${MUTED};margin-top:3px;">
              ${o.pctOfAsk}% of ask &nbsp;·&nbsp; ${money(o.belowAsk)} below
            </div>
            <div style="font-family:${SANS};font-size:13px;color:${MUTED};line-height:1.6;margin-top:9px;border-top:1px solid ${MONEYLINE};padding-top:9px;">
              ${esc(reasoning(o, TYPE_LABEL[o.typeKey] || 'Homes of this type'))}
            </div>
          </td></tr>
        </table>
        <div style="margin-top:12px;">
          <a href="${href}" style="font-family:${SANS};font-size:14px;font-weight:700;color:${ACCENT};text-decoration:none;">See the full listing &rarr;</a>
        </div>
      </td></tr>

    </table>
  </td></tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${PAGEBG};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="${PAGEBG}" style="background:${PAGEBG};"><tr><td align="center" style="padding:20px 12px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- PLAIN SENDER LINE - no banner, no kicker -->
  <tr><td style="padding:0 2px 16px;">
    <div style="font-family:${SANS};font-size:13px;font-weight:700;color:${MUTED};">
      Hamza Nouman &nbsp;·&nbsp; <a href="${u('/')}" style="color:${MUTED};text-decoration:none;">MississaugaInvestor.ca</a>
    </div>
  </td></tr>

  <!-- PERSONAL OPENING -->
  <tr><td style="padding:0 2px 18px;">
    <div style="font-family:${SANS};font-size:16px;color:${INK};line-height:1.65;">${greeting}</div>
    <div style="font-family:${SANS};font-size:16px;color:${INK};line-height:1.65;margin-top:12px;">
      I went through the Mississauga listings this week and pulled three where the seller
      has an actual reason to negotiate - they&rsquo;ve been sitting, or the price has
      already come down once.
    </div>
    <div style="font-family:${SANS};font-size:16px;color:${INK};line-height:1.65;margin-top:12px;">
      For each one, here&rsquo;s the number I&rsquo;d open at and how I got to it.
    </div>
  </td></tr>

  ${cards}

  <!-- METHOD -->
  <tr><td style="padding:4px 2px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px dashed ${LINE};border-radius:12px;">
      <tr><td style="padding:16px 18px;">
        <div style="font-family:${SANS};font-size:12px;font-weight:800;letter-spacing:1px;color:${FAINT};">HOW I GOT THESE NUMBERS</div>
        <div style="font-family:${SANS};font-size:14px;color:${MUTED};line-height:1.7;margin-top:8px;">
          I start from what that property type actually sold for in Mississauga last month
          - the sale-to-list ratio in the TRREB Market Watch report for ${esc(month)} -
          then adjust for how long this particular listing has sat and whether the ask has
          already been cut. Nothing goes more than ${LIMITS.MAX_POINTS_BELOW_RATIO} points below what
          the market is really paying: past that you don&rsquo;t get a discount, you get ignored.
        </div>
        <div style="font-family:${SANS};font-size:14px;color:${MUTED};line-height:1.7;margin-top:10px;">
          These are <strong style="color:${INK};">opening positions, not appraisals</strong>. What a
          property is worth to you depends on the inspection, the condo status certificate, the
          rent it can actually carry, and how badly you want it. Ask me and I&rsquo;ll go through
          any of those on a specific address.
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA - the ask is a REPLY -->
  <tr><td style="padding:22px 2px 0;">
    <div style="font-family:${SANS};font-size:16px;color:${INK};line-height:1.7;">
      If you want this for your budget instead of mine - <strong>just reply with a price range
      and the type you&rsquo;re after</strong>, and I&rsquo;ll send back the three I&rsquo;d chase this week,
      with the same numbers. It comes straight to me.
    </div>
    <div style="margin-top:16px;">
      <a href="${u('/book-call')}" style="display:inline-block;background:${NAVY};color:#ffffff;font-family:${SANS};font-size:15px;font-weight:700;padding:13px 26px;border-radius:10px;text-decoration:none;">Or book 15 minutes &rarr;</a>
    </div>
  </td></tr>

  <!-- SIGNOFF -->
  <tr><td style="padding:24px 2px 0;">
    <div style="font-family:${SANS};font-size:16px;color:${INK};line-height:1.6;">- Hamza</div>
    <div style="font-family:${SANS};font-size:13px;color:${MUTED};line-height:1.55;margin-top:6px;">
      Sales Representative &middot; Cityscape Real Estate Ltd., Brokerage<br>
      <a href="tel:+16476091289" style="color:${ACCENT};text-decoration:none;font-weight:600;">647-609-1289</a>
      <span style="color:${LINE};">&nbsp;&middot;&nbsp;</span>
      <a href="mailto:hamza@nouman.ca" style="color:${ACCENT};text-decoration:none;font-weight:600;">hamza@nouman.ca</a>
    </div>
  </td></tr>

  <!-- FOOTER / CASL -->
  <tr><td style="padding:18px 2px 8px;">
    <div style="border-top:1px solid #CBD5E1;padding-top:14px;">
      <div style="font-family:${SANS};font-size:11px;line-height:1.65;color:#7A879B;">
        You're receiving this because you subscribed to deal alerts or connected with Hamza at MississaugaInvestor.ca.<br>
        <strong style="color:${MUTED};">Cityscape Real Estate Ltd., Brokerage</strong> &middot; 885 Plymouth Dr, Unit 2, Mississauga, ON L5V 0B5<br>
        Listing details, asking prices and days-on-market are drawn from live MLS data at the time of sending and change daily - a property may be sold or withdrawn by the time you read this. Suggested opening offers are one agent&rsquo;s opinion of a negotiating position based on TRREB sale-to-list data for ${esc(month)}; they are not appraisals, valuations, or a representation of market value, and they are not investment advice. Listing data &copy; TRREB, deemed reliable but not guaranteed.
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

/**
 * Plain-text alternative.
 *
 * Sent as the `text` part alongside the HTML so the message goes out as
 * multipart/alternative. An HTML-only body is a long-standing spam signal -
 * filters expect a text part, and some clients (and most accessibility
 * tooling) prefer it. Written out properly rather than tag-stripped, because a
 * stripped version of a table-layout email reads like garbage.
 */
export function buildOfferPicksText({ email, name, data } = {}) {
  const first = (name || '').trim().split(/\s+/)[0] || '';
  const greeting = first ? `Hi ${first},` : 'Hi there,';
  const unsub = email ? unsubscribeUrl(email) : `${BASE}/api/alerts/unsubscribe`;
  const { picks, month } = data;

  const blocks = picks.map((p, i) => {
    const l = p.listing;
    const o = p.offer;
    const facts = [l.beds ? `${n(l.beds)} bed` : null, l.baths ? `${n(l.baths)} bath` : null, l.type]
      .filter(Boolean).join(', ');
    return [
      `${i + 1} OF ${picks.length} - ${String(l.neighbourhood || l.city || 'Mississauga').toUpperCase()}`,
      l.address,
      `Asking ${money(l.price)}${facts ? ` | ${facts}` : ''}`,
      `${n(o.dom)} days on market${o.priceDrop >= 1 ? ` | already cut ${n(o.priceDrop)}%` : ''}`,
      '',
      `WHERE I'D OPEN: ${money(o.offer)}  (${o.pctOfAsk}% of ask, ${money(o.belowAsk)} below)`,
      reasoning(o, TYPE_LABEL[o.typeKey] || 'Homes of this type'),
      '',
      `See the full listing: ${u(`/listing/${encodeURIComponent(l.id)}`)}`,
    ].join('\n');
  }).join('\n\n' + '-'.repeat(60) + '\n\n');

  return [
    greeting,
    '',
    "I went through the Mississauga listings this week and pulled three where the",
    "seller has an actual reason to negotiate - they've been sitting, or the price",
    'has already come down once.',
    '',
    "For each one, here's the number I'd open at and how I got to it.",
    '',
    '-'.repeat(60),
    '',
    blocks,
    '',
    '-'.repeat(60),
    '',
    'HOW I GOT THESE NUMBERS',
    '',
    'I start from what that property type actually sold for in Mississauga last',
    `month - the sale-to-list ratio in the TRREB Market Watch report for ${month} -`,
    'then adjust for how long this particular listing has sat and whether the ask',
    `has already been cut. Nothing goes more than ${LIMITS.MAX_POINTS_BELOW_RATIO} points below what the market`,
    "is really paying: past that you don't get a discount, you get ignored.",
    '',
    'These are opening positions, not appraisals. What a property is worth to you',
    'depends on the inspection, the condo status certificate, the rent it can',
    "actually carry, and how badly you want it. Ask me and I'll go through any of",
    'those on a specific address.',
    '',
    '-'.repeat(60),
    '',
    'If you want this for your budget instead of mine - just reply with a price',
    "range and the type you're after, and I'll send back the three I'd chase this",
    'week, with the same numbers. It comes straight to me.',
    '',
    `Or book 15 minutes: ${u('/book-call')}`,
    '',
    '- Hamza',
    'Sales Representative, Cityscape Real Estate Ltd., Brokerage',
    '647-609-1289 | hamza@nouman.ca',
    '',
    '-'.repeat(60),
    '',
    "You're receiving this because you subscribed to deal alerts or connected with",
    'Hamza at MississaugaInvestor.ca.',
    'Cityscape Real Estate Ltd., Brokerage, 885 Plymouth Dr, Unit 2, Mississauga, ON L5V 0B5',
    '',
    'Listing details, asking prices and days-on-market are drawn from live MLS data',
    'at the time of sending and change daily. Suggested opening offers are one',
    "agent's opinion of a negotiating position based on TRREB sale-to-list data for",
    `${month}; they are not appraisals, valuations, or a representation of market`,
    'value, and they are not investment advice. Listing data (c) TRREB, deemed',
    'reliable but not guaranteed.',
    '',
    `Unsubscribe: ${unsub}`,
  ].join('\n');
}
