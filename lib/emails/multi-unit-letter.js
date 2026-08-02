import { unsubscribeUrl } from '@/lib/unsubscribe-token';

// ─────────────────────────────────────────────────────────────────────────────
//  The multi-unit letter — duplexes, triplexes, and why there are so few.
//
//  THIRD DISTINCT STYLE, on purpose. The house campaigns so far:
//    1. announcement / radar — navy masthead, gold kicker, stats tables
//    2. this week's picks    — photo-led cards, green offer boxes
//  This one is a TYPED LETTER: white background, dark text, system font, no
//  masthead, no images, no cards, no buttons — one underlined link and a
//  reply ask. It should look like Hamza wrote it in Gmail on a Tuesday night,
//  because for a solo agent that's the format that gets replies.
//
//  WHAT IT CLAIMS AND WHAT IT REFUSES TO CLAIM
//  Every figure (counts, price range, median DOM, cuts) is computed from live
//  MLS rows by lib/emails/multi-unit-data.js — tested, never typed. Two things
//  are deliberately ABSENT:
//    - offer numbers: TRREB publishes no multi-unit category, so there is no
//      sale-to-list anchor. The letter says so out loud — the honesty IS the
//      pitch, and it explains why this email has no green boxes.
//    - rent figures: the site's rent model is calibrated on houses/condos;
//      quoting it for a 3-unit building would be fabrication. The rent
//      conversation is exactly what the reply CTA is for.
//  The down-payment percentages are CMHC's long-standing insured-mortgage
//  rules (5% first tier owner-occupied 1–2 units, 10% owner-occupied 3–4
//  units, 20% non-owner-occupied) — regulatory facts, stated as such, with
//  the "talk to your broker" hedge where lender policy varies.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'https://www.mississaugainvestor.ca';
const INK = '#1A1A1A';
const MUTED = '#6B7280';
const LINKBLUE = '#1D4ED8';
const SERIFISH = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function n(x) { return Number(x || 0).toLocaleString('en-CA'); }
function money(x) { return '$' + Math.round(Number(x) || 0).toLocaleString('en-CA'); }
function u(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${BASE}${path}${sep}utm_source=broadcast&utm_medium=email&utm_campaign=multi-unit`;
}

// One paragraph style used everywhere — a letter, not a layout.
const P = `margin:0 0 18px;font-family:${SERIFISH};font-size:16px;line-height:1.75;color:${INK};`;

export function buildMultiUnitLetter({ email, name, data } = {}) {
  const first = (name || '').trim().split(/\s+/)[0] || '';
  const greeting = first ? `Hi ${esc(first)},` : 'Hi,';
  const unsub = email ? unsubscribeUrl(email) : `${BASE}/api/alerts/unsubscribe`;

  const { count, breakdown, priceMin, priceMax, medianDOM, cutCount, totalActive } = data;

  const subject = `Only ${n(count)} of these exist on the Mississauga market right now`;
  const preheader = `${breakdown} — out of ${n(totalActive)} active listings. A short note on the one property type almost nobody emails you about.`;

  const cutsLine = cutCount > 0
    ? ` ${cutCount === 1 ? 'One' : n(cutCount)} of them ${cutCount === 1 ? 'has' : 'have'} already cut the asking price.`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#FFFFFF;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;text-align:left;">
<tr><td>

  <p style="${P}">${greeting}</p>

  <p style="${P}">Quick note — different from what I usually send, and shorter.</p>

  <p style="${P}">People ask me about duplexes and triplexes constantly, and I realized I've never
  actually written to you about them. Here's the thing that surprises everyone: right now there are
  exactly <strong>${n(count)}</strong> on the market in all of Mississauga &mdash; ${esc(breakdown)}.
  Out of ${n(totalActive)} active listings. That's the entire supply of homes here that pay you rent
  while you live in them.</p>

  <p style="${P}">They're asking between ${money(priceMin)} and ${money(priceMax)}${medianDOM ? `,
  and the typical one has been sitting <strong>${n(medianDOM)} days</strong>` : ''}.${cutsLine}
  Multi-unit moves slowly here &mdash; the buyer pool is small, which is precisely what makes it
  interesting if you're in that pool.</p>

  <p style="${P}">Three things most people don't know about buying one:</p>

  <p style="${P}">1. <strong>If you live in one unit, it's financed like a house, not an investment.</strong>
  Under CMHC's rules an owner-occupied duplex can be bought with as little as 5% down on the first
  $500K; an owner-occupied triplex or fourplex needs 10%. Only a building you won't live in demands
  the full 20%.</p>

  <p style="${P}">2. <strong>The other unit's rent helps you qualify.</strong> Most lenders count a
  large share of it toward your income when sizing the mortgage &mdash; how much varies by lender,
  which is a broker conversation, but it routinely turns a "we can't afford that" into an approval.</p>

  <p style="${P}">3. <strong>Nobody can honestly tell you what they're "worth" from a report.</strong>
  TRREB doesn't publish a multi-unit category &mdash; no average price, no sale-to-list benchmark.
  Every one of these buildings trades on its actual rents, its actual expenses, and how the units
  are laid out. That's why this email has no big green numbers in it: for these, the numbers have
  to be run on the specific building.</p>

  <p style="${P}">Which I'm happy to do. <strong>Reply with the word &ldquo;multi&rdquo;</strong> and
  I'll send you all ${n(count)} with real numbers run on each &mdash; what the units could actually
  rent for, what carries at today's rates, which ones are priced like the seller knows something.
  Takes me an evening, costs you nothing.</p>

  <p style="${P}">Or browse them yourself on the site:
  <a href="${u('/listings')}" style="color:${LINKBLUE};text-decoration:underline;">mississaugainvestor.ca/listings</a>
  &mdash; search &ldquo;duplex&rdquo; or &ldquo;triplex&rdquo;.</p>

  <p style="${P}">&mdash; Hamza</p>

  <p style="margin:0 0 6px;font-family:${SERIFISH};font-size:13px;line-height:1.6;color:${MUTED};">
    Hamza Nouman &middot; Sales Representative<br>
    Cityscape Real Estate Ltd., Brokerage &middot; 647-609-1289
  </p>

  <div style="border-top:1px solid #E5E7EB;margin-top:26px;padding-top:14px;">
    <p style="margin:0 0 10px;font-family:${SERIFISH};font-size:11px;line-height:1.65;color:#9CA3AF;">
      You're receiving this because you subscribed to deal alerts or connected with Hamza at
      MississaugaInvestor.ca. Cityscape Real Estate Ltd., Brokerage &middot; 885 Plymouth Dr, Unit 2,
      Mississauga, ON L5V 0B5. Listing counts, asking prices and days-on-market are drawn from live
      MLS data at the time of sending and change daily. Down-payment minimums describe CMHC's
      standard insured-mortgage rules; qualification and rental-income treatment vary by lender.
      For information only &mdash; not mortgage, appraisal or investment advice. Listing data
      &copy; TRREB, deemed reliable but not guaranteed.
    </p>
    <p style="margin:0;font-family:${SERIFISH};font-size:11px;color:#9CA3AF;">
      <a href="${unsub}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>
      &nbsp;&middot;&nbsp;
      <a href="${u('/privacy')}" style="color:${MUTED};text-decoration:underline;">Privacy</a>
    </p>
  </div>

</td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { subject, html };
}

/** Plain-text part — for a letter this is nearly the letter itself. */
export function buildMultiUnitText({ email, name, data } = {}) {
  const first = (name || '').trim().split(/\s+/)[0] || '';
  const unsub = email ? unsubscribeUrl(email) : `${BASE}/api/alerts/unsubscribe`;
  const { count, breakdown, priceMin, priceMax, medianDOM, cutCount, totalActive } = data;

  return [
    first ? `Hi ${first},` : 'Hi,',
    '',
    'Quick note — different from what I usually send, and shorter.',
    '',
    "People ask me about duplexes and triplexes constantly, and I realized I've",
    "never actually written to you about them. Here's the thing that surprises",
    `everyone: right now there are exactly ${n(count)} on the market in all of`,
    `Mississauga — ${breakdown}. Out of ${n(totalActive)} active listings. That's`,
    'the entire supply of homes here that pay you rent while you live in them.',
    '',
    `They're asking between ${money(priceMin)} and ${money(priceMax)}` +
      (medianDOM ? `, and the typical one has been sitting ${n(medianDOM)} days.` : '.') +
      (cutCount > 0 ? ` ${cutCount === 1 ? 'One has' : `${n(cutCount)} have`} already cut the asking price.` : ''),
    'Multi-unit moves slowly here — the buyer pool is small, which is precisely',
    "what makes it interesting if you're in that pool.",
    '',
    "Three things most people don't know about buying one:",
    '',
    "1. If you live in one unit, it's financed like a house, not an investment.",
    "   Under CMHC's rules an owner-occupied duplex can be bought with as little",
    '   as 5% down on the first $500K; an owner-occupied triplex or fourplex',
    "   needs 10%. Only a building you won't live in demands the full 20%.",
    '',
    "2. The other unit's rent helps you qualify. Most lenders count a large",
    '   share of it toward your income when sizing the mortgage — how much',
    '   varies by lender, but it routinely turns a "we can\'t afford that" into',
    '   an approval.',
    '',
    '3. Nobody can honestly tell you what they\'re "worth" from a report. TRREB',
    "   doesn't publish a multi-unit category — no average price, no",
    '   sale-to-list benchmark. Every one of these buildings trades on its',
    '   actual rents, its actual expenses, and how the units are laid out.',
    '',
    `Which I'm happy to work through. Reply with the word "multi" and I'll send`,
    `you all ${n(count)} with real numbers run on each — what the units could`,
    "actually rent for, what carries at today's rates, which ones are priced",
    'like the seller knows something. Takes me an evening, costs you nothing.',
    '',
    `Or browse them yourself: ${u('/listings')} — search "duplex" or "triplex".`,
    '',
    '— Hamza',
    'Hamza Nouman · Sales Representative',
    'Cityscape Real Estate Ltd., Brokerage · 647-609-1289',
    '',
    '-'.repeat(60),
    "You're receiving this because you subscribed to deal alerts or connected",
    'with Hamza at MississaugaInvestor.ca. Cityscape Real Estate Ltd., Brokerage,',
    '885 Plymouth Dr, Unit 2, Mississauga, ON L5V 0B5. Listing counts, asking',
    'prices and days-on-market are drawn from live MLS data at the time of',
    "sending and change daily. Down-payment minimums describe CMHC's standard",
    'insured-mortgage rules; qualification and rental-income treatment vary by',
    'lender. For information only — not mortgage, appraisal or investment',
    'advice. Listing data (c) TRREB, deemed reliable but not guaranteed.',
    '',
    `Unsubscribe: ${unsub}`,
  ].join('\n');
}
