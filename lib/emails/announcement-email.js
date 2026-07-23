import { unsubscribeUrl } from '@/lib/unsubscribe-token';

// ─────────────────────────────────────────────────────────────────────────────
//  Platform-launch announcement email — "look at everything the site can do".
//
//  A one-off broadcast to Hamza's whole database announcing that the site is now
//  a full investor research desk covering the entire GTA. Distinct from the
//  weekly deals digest (that one is an editorial/magazine look); this one mirrors
//  the WEBSITE's brand — the navy "dusk" identity with accent-blue + gold.
//
//  Rules this file follows so it renders everywhere and stays honest:
//   • Table layout, inline styles, bgcolor fallbacks, 600px fluid width.
//   • Light-slate page background so the white cards read as cards (not blank
//     space) — and tight vertical rhythm, no dead gaps.
//   • One external image only — Hamza's real headshot in the sign-off (hosted at
//     the public domain, with alt text so it degrades to his name if a client
//     blocks images). Everything else is table/CSS, so the email still reads
//     cleanly with images off.
//   • Every number is one the live site already publishes (5.0 · 28 reviews,
//     24 neighbourhood guides). No fabricated stats, no unverified dollar figures
//     (e.g. the HST-rebate amount is described, never quoted).
//   • CASL: sender identification + physical address + working unsubscribe.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'https://www.mississaugainvestor.ca';

// Brand palette — matches tailwind.config.js (the site's "dusk" identity)
const NAVY = '#1B2A4A';
const NAVY_DEEP = '#16223D';
const NAVY_LITE = '#25355C';
const ACCENT = '#2563EB';
const GOLD = '#F59E0B';
const PAGEBG = '#E8ECF3'; // light slate — makes white cards separate cleanly
const CHIP = '#EEF2F8';
const INK = '#0F172A';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const WHITE = '#FFFFFF';
const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SHADOW = '0 1px 2px rgba(15,23,42,0.05)';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clip(s, n) {
  const t = String(s || '').trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
}

// UTM-tagged link so the campaign shows up in analytics
function u(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${BASE}${path}${sep}utm_source=announcement&utm_medium=email&utm_campaign=platform-launch`;
}

// Padded anchor "button" — reliable across clients (Outlook renders the cell bg)
function button(href, label, { bg = ACCENT, color = WHITE, border = bg } = {}) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
    <tr><td align="center" bgcolor="${bg}" style="border-radius:8px;background:${bg};">
      <a href="${href}" style="display:inline-block;font-family:${SANS};font-size:15px;font-weight:700;line-height:1;color:${color};text-decoration:none;padding:14px 28px;border:1px solid ${border};border-radius:8px;">${label}</a>
    </td></tr></table>`;
}

// Section kicker (small uppercase label)
function kicker(text, color = MUTED) {
  return `<div style="font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${color};">${text}</div>`;
}

// One of the three headline "pillar" cards
function pillar({ emoji, kickerText, title, body, cta, href }) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">
    <tr><td bgcolor="${WHITE}" style="background:${WHITE};border:1px solid ${LINE};border-radius:14px;padding:18px;box-shadow:${SHADOW};">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="50" valign="top" style="padding-right:13px;">
          <div style="width:42px;height:42px;line-height:42px;text-align:center;font-size:21px;background:${CHIP};border-radius:11px;">${emoji}</div>
        </td>
        <td valign="top">
          <div style="font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:${ACCENT};margin-bottom:4px;">${kickerText}</div>
          <div style="font-family:${SANS};font-size:18px;font-weight:800;color:${INK};line-height:1.25;">${title}</div>
          <div style="font-family:${SANS};font-size:14px;color:${MUTED};line-height:1.55;margin-top:6px;">${body}</div>
          <div style="margin-top:9px;"><a href="${href}" style="font-family:${SANS};font-size:14px;font-weight:700;color:${ACCENT};text-decoration:none;">${cta} &rarr;</a></div>
        </td>
      </tr></table>
    </td></tr>
  </table>`;
}

// A compact "everything else" tool cell (used two-up)
function tool({ emoji, title, body, href }) {
  return `<a href="${href}" style="text-decoration:none;display:block;">
    <table width="100%" cellpadding="0" cellspacing="0" style="height:100%;">
      <tr><td bgcolor="${WHITE}" valign="top" style="background:${WHITE};border:1px solid ${LINE};border-radius:12px;padding:14px;box-shadow:${SHADOW};">
        <div style="font-size:19px;line-height:1;">${emoji}</div>
        <div style="font-family:${SANS};font-size:15px;font-weight:800;color:${INK};margin-top:8px;">${title}</div>
        <div style="font-family:${SANS};font-size:12.5px;color:${MUTED};line-height:1.5;margin-top:3px;">${body}</div>
      </td></tr>
    </table></a>`;
}

// Two tools side by side (fluid: collapses to ~180px/cell at 375px)
function toolRow(a, b) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>
    <td width="50%" valign="top" style="padding-right:5px;">${tool(a)}</td>
    <td width="50%" valign="top" style="padding-left:5px;">${b ? tool(b) : ''}</td>
  </tr></table>`;
}

// "Fresh from the blog" — up to 3 latest posts inside one white card
function blogSection(posts) {
  const list = (posts || []).filter((p) => p && p.title && p.slug).slice(0, 3);
  if (!list.length) return '';
  const rows = list
    .map((p, i) => {
      const url = u(`/blog/${encodeURIComponent(p.slug)}`);
      return `<a href="${url}" style="text-decoration:none;display:block;padding:${i === 0 ? '0' : '13px'} 0 13px;${i > 0 ? `border-top:1px solid ${LINE};` : ''}">
        <div style="font-family:${SANS};font-size:15px;font-weight:800;color:${INK};line-height:1.35;">${esc(p.title)}</div>
        ${p.excerpt ? `<div style="font-family:${SANS};font-size:13px;color:${MUTED};line-height:1.55;margin-top:4px;">${esc(clip(p.excerpt, 120))}</div>` : ''}
        <div style="font-family:${SANS};font-size:13px;font-weight:700;color:${ACCENT};margin-top:6px;">Read the article &rarr;</div>
      </a>`;
    })
    .join('');
  return `<tr><td style="padding:14px 8px 2px;">
    ${kicker('Fresh from the blog')}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
      <tr><td bgcolor="${WHITE}" style="background:${WHITE};border:1px solid ${LINE};border-radius:14px;padding:6px 18px 8px;box-shadow:${SHADOW};">
        ${rows}
      </td></tr>
    </table>
    <div style="margin-top:12px;"><a href="${u('/blog')}" style="font-family:${SANS};font-size:13px;font-weight:700;color:${ACCENT};text-decoration:none;">See all articles &rarr;</a></div>
  </td></tr>`;
}

/**
 * Build the announcement email.
 * @param {{ email?: string, name?: string, posts?: Array<{title:string,slug:string,excerpt?:string}> }} opts
 * @returns {{ subject: string, html: string }}
 */
export function buildAnnouncementEmail({ email, name, posts, assetBase = BASE } = {}) {
  const first = (name || '').trim().split(/\s+/)[0] || '';
  const greeting = first ? `Hi ${esc(first)},` : 'Hi there,';
  const unsub = email ? unsubscribeUrl(email) : `${BASE}/api/alerts/unsubscribe`;
  // Hamza's real headshot. assetBase lets the preview swap in a local/inlined
  // source; real sends use the public domain so recipients' clients can load it.
  const headshotSrc = `${assetBase}/images/hamza-headshot.jpg`;

  const subject = 'Every GTA listing, now scored for cash flow';
  const preheader =
    'Cap rate, cash flow & a deal score on every active listing — plus free tools to find, analyze, and buy your next property.';

  const pillars =
    pillar({
      emoji: '📊',
      kickerText: 'The core idea',
      title: 'Cash flow, cap rate & a deal score on every listing',
      body:
        'Open any active listing and the monthly cash flow, cap rate, and a 1–10 deal score are already calculated for you — from live MLS data and realistic area rents. No spreadsheet required.',
      cta: 'See scored listings',
      href: u('/listings'),
    }) +
    pillar({
      emoji: '🌆',
      kickerText: "What's new",
      title: 'Now across the whole GTA',
      body:
        'It started in Mississauga. Today the same investor analysis runs on listings in Toronto, Brampton, Vaughan, Oakville, Hamilton and 25+ more GTA cities — all in one place.',
      cta: 'Explore the GTA',
      href: u('/gta'),
    }) +
    pillar({
      emoji: '🧮',
      kickerText: 'Run your own numbers',
      title: 'A free income-property calculator',
      body:
        'Model any purchase in seconds — mortgage, land transfer tax, CMHC insurance and monthly cash flow — before you ever write an offer.',
      cta: 'Open the calculator',
      href: u('/mortgage-calculator'),
    });

  const tools =
    toolRow(
      { emoji: '🏠', title: 'Sell for top dollar', body: 'Free, no-obligation home valuation.', href: u('/sell') },
      { emoji: '🏗️', title: 'Pre-construction VIP', body: 'Platinum access + a new-build HST rebate guide.', href: u('/pre-construction') }
    ) +
    toolRow(
      { emoji: '📈', title: 'Market Pulse', body: 'Live GTA prices, days-on-market & trends.', href: u('/market-pulse') },
      { emoji: '🧭', title: '24 neighbourhood guides', body: 'Yields, prices & the local read on every pocket.', href: u('/neighbourhoods') }
    ) +
    toolRow(
      { emoji: '🔔', title: 'Deal alerts', body: 'Save a search — get the best cash-flowing deals weekly.', href: u('/alerts') },
      { emoji: '⚡', title: '60-second deal quiz', body: 'Get matched to your ideal strategy & properties.', href: u('/quiz') }
    ) +
    toolRow(
      { emoji: '🏷️', title: 'Recent sales', body: "What's actually selling, and for how much.", href: u('/recent-sales') },
      { emoji: '📚', title: 'Investor guides', body: 'Rent-vs-buy, cash flow, the LRT & more — with live data.', href: u('/guides') }
    );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGEBG};-webkit-text-size-adjust:100%;">
<!-- preheader (hidden preview text) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${PAGEBG};font-size:1px;line-height:1px;">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

<table width="100%" cellpadding="0" cellspacing="0" bgcolor="${PAGEBG}" style="background:${PAGEBG};padding:16px 10px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- MASTHEAD -->
  <tr><td style="padding:2px 8px 12px;" align="center">
    <span style="font-family:${SANS};font-size:18px;font-weight:800;color:${NAVY};letter-spacing:-0.3px;">MississaugaInvestor<span style="color:${ACCENT};">.ca</span></span>
  </td></tr>

  <!-- HERO -->
  <tr><td bgcolor="${NAVY}" style="background:${NAVY};background:linear-gradient(135deg,${NAVY_DEEP} 0%,${NAVY} 55%,${NAVY_LITE} 100%);border-radius:16px;padding:30px 26px;">
    <div style="font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">New &middot; Now across the whole GTA</div>
    <div style="font-family:${SANS};font-size:32px;line-height:1.12;font-weight:800;color:${WHITE};margin-top:12px;letter-spacing:-0.6px;">Every GTA listing,<br>scored for cash flow<span style="color:${GOLD};">.</span></div>
    <div style="font-family:${SANS};font-size:15.5px;line-height:1.55;color:#C7D2E6;margin-top:13px;">I rebuilt MississaugaInvestor.ca into a full investor research desk. Cap rate, cash flow, and a 1–10 deal score are now calculated on <strong style="color:${WHITE};">every active listing</strong> — with free tools to find, analyze, and buy your next property.</div>
    <div style="margin-top:20px;">${button(u('/listings'), 'Browse scored listings', { bg: WHITE, color: NAVY, border: WHITE })}</div>
    <div style="margin-top:12px;"><a href="${u('/gta')}" style="font-family:${SANS};font-size:14px;font-weight:600;color:#AFC0DE;text-decoration:none;">or explore the whole GTA &rarr;</a></div>
  </td></tr>

  <!-- PERSONAL INTRO -->
  <tr><td style="padding:20px 8px 2px;">
    <div style="font-family:${SANS};font-size:16px;font-weight:700;color:${INK};">${greeting}</div>
    <div style="font-family:${SANS};font-size:15px;line-height:1.6;color:#334155;margin-top:6px;">I've spent the last few months turning the site into the tool I always wished existed for investors. Instead of guessing which listing actually cash-flows, you can now see the numbers on <em>every</em> one — instantly. Here's what's live today.</div>
  </td></tr>

  <!-- PILLARS -->
  <tr><td style="padding:14px 0 2px;">${pillars}</td></tr>

  <!-- EVERYTHING ELSE -->
  <tr><td style="padding:12px 8px 4px;">${kicker('Everything else you can do')}</td></tr>
  <tr><td style="padding:0;">${tools}</td></tr>

  <!-- FRESH FROM THE BLOG -->
  ${blogSection(posts)}

  <!-- TRUST BAR -->
  <tr><td style="padding:12px 0 2px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td bgcolor="${WHITE}" style="background:${WHITE};border:1px solid ${LINE};border-radius:12px;padding:14px 18px;box-shadow:${SHADOW};" align="center">
        <span style="font-family:${SANS};font-size:13px;font-weight:700;color:${INK};white-space:nowrap;"><span style="color:${GOLD};">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google &middot; 28 reviews</span>
        <span style="color:${LINE};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
        <span style="font-family:${SANS};font-size:13px;font-weight:700;color:${INK};white-space:nowrap;">Licensed by RECO</span>
        <span style="color:${LINE};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
        <span style="font-family:${SANS};font-size:13px;font-weight:700;color:${INK};white-space:nowrap;">Live MLS &middot; PropTx data</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- CLOSING CTA -->
  <tr><td style="padding:14px 0 2px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td bgcolor="${NAVY}" style="background:${NAVY};background:linear-gradient(135deg,${NAVY} 0%,${NAVY_LITE} 100%);border-radius:16px;padding:26px 24px;" align="center">
        <div style="font-family:${SANS};font-size:21px;font-weight:800;color:${WHITE};line-height:1.3;">Have a property in mind?<br>Let's run the numbers together.</div>
        <div style="font-family:${SANS};font-size:14px;color:#C7D2E6;line-height:1.55;margin-top:8px;">Free 15-minute call — no pressure, just a straight read on the deal.</div>
        <div style="margin-top:18px;" align="center">${button(u('/book-call'), 'Book a free call', { bg: GOLD, color: NAVY, border: GOLD })}</div>
        <div style="font-family:${SANS};font-size:13px;color:#AFC0DE;margin-top:14px;">…or just reply to this email — it comes straight to me.</div>
      </td>
    </tr></table>
  </td></tr>

  <!-- SIGN-OFF -->
  <tr><td style="padding:18px 8px 4px;">
    <table cellpadding="0" cellspacing="0"><tr>
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
  </td></tr>

  <!-- FOOTER / CASL -->
  <tr><td style="padding:16px 8px 8px;">
    <div style="border-top:1px solid #CBD5E1;padding-top:14px;">
      <div style="font-family:${SANS};font-size:11px;line-height:1.65;color:#7A879B;">
        You're receiving this because you subscribed to deal alerts or connected with Hamza at MississaugaInvestor.ca.<br>
        <strong style="color:${MUTED};">Cityscape Real Estate Ltd., Brokerage</strong> &middot; 885 Plymouth Dr, Unit 2, Mississauga, ON L5V 0B5<br>
        Investment scores, cap rates and cash-flow figures are calculated estimates for information only — not appraisals or guaranteed returns. Listing data &copy; TRREB, deemed reliable but not guaranteed.
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
</td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}
