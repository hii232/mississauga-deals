import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processListings } from '@/lib/listings/process-listings';
import { fetchAllListings } from '@/lib/listings/fetch-all-listings';
import { applyFilters, DEFAULT_FILTERS } from '@/components/listings/filter-utils';
import { poolForSearch } from '@/lib/alerts/sanitize-filters';
import { unsubscribeUrl } from '@/lib/unsubscribe-token';
import { tagRecipient } from '@/lib/emails/recipient-token';
import { DEFAULT_ASSUMPTIONS } from '@/lib/cash-flow-engine';
import { requireCronOrAdmin } from '@/lib/api-auth';

const plural = (n, singular, pluralForm = `${singular}s`) => `${n} ${n === 1 ? singular : pluralForm}`;

// The full-pool fetch (13 upstream page requests) plus per-subscriber matching
// and SEQUENTIAL Resend sends will not reliably fit Vercel's default function
// window. The old page-1-only version squeaked under it; the fixed pool must
// not die at the timeout wall and silently send to only the first subscribers.
// Newsletter uses 60s for one batch send; alerts do N sends, so give headroom.
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// Public site URL — never build the internal fetch from request.url / VERCEL_URL:
// on a cron invocation that resolves to the *.vercel.app deployment host, which is
// behind Vercel deployment protection and serves an HTML auth wall (200), so the
// self-fetch never reaches /api/listings and JSON.parse chokes on "<!DOCTYPE ...".
const SITE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://www.mississaugainvestor.ca';

/**
 * GET|POST /api/alerts/send
 * Called by Vercel Cron daily (cron invokes with GET)
 * Sends email alerts for saved searches with new matching listings
 */
export async function GET(request) {
  return POST(request);
}

export async function POST(request) {
  // Cron-or-admin, failing CLOSED. The old guard was skipped entirely when
  // CRON_SECRET was unset, which left the highest-consequence endpoint on the
  // site — a mass send to every subscriber — open to anyone who knew the URL.
  const denied = requireCronOrAdmin(request);
  if (denied) return denied;

  // Dry run: runs the IDENTICAL matching logic (same feed, same filters, same
  // repeat-send guard) so the report is a faithful predictor of a real send,
  // but never calls Resend and never writes to saved_searches or
  // alert_sent_listings. This exists so "does the alert pipeline actually
  // work" can be answered from the admin dashboard without risking a real
  // email reaching a real subscriber — Vercel Cron never sets this (it always
  // GETs with no query string), so the daily schedule is untouched.
  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';

  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Alerts are temporarily unavailable' }, { status: 503 });
    }
    // Fail loudly if the sender isn't configured at all. Without this the run
    // would look "successful" (sent: 0) while every send was doomed. Skipped
    // in dry-run mode — the whole point is answering "does matching work" even
    // when Resend itself isn't configured yet.
    if (!dryRun && !process.env.RESEND_API_KEY) {
      console.error('Alerts: RESEND_API_KEY is not set — no alert email can be sent.');
      return NextResponse.json(
        { error: 'Email sending is not configured (RESEND_API_KEY missing)', sent: 0 },
        { status: 503 }
      );
    }
    // 1. Fetch all active saved searches
    const { data: searches, error: searchErr } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('active', true);

    if (searchErr) throw searchErr;
    if (!searches || searches.length === 0) {
      return NextResponse.json(
        dryRun
          ? { dryRun: true, message: 'No active saved searches — a real run would send 0 emails.', recipients: 0, wouldSend: 0, preview: [] }
          : { message: 'No active searches', sent: 0 }
      );
    }

    // 2. Fetch current listings — ALL pages. This route used to fetch page 1
    // only (200 rows), so every saved search was matched against ~8% of the
    // active inventory and alerts silently under-delivered. fetchAllListings
    // keeps the same loud-failure and non-JSON guards.
    const rawListings = await fetchAllListings(SITE_URL, '/api/listings');
    const allListings = processListings(rawListings.listings);
    // Surfaced in every response, success or "sent 0", because "0 emails went
    // out" is ambiguous on its own — it's the normal, healthy result on a day
    // with nothing new, and it's ALSO what a dead AMPRE token looks like (feed
    // returns nothing, every search matches nothing, indistinguishable from
    // "quiet day" without this number sitting next to it).
    let feedListingCount = allListings.length;

    // 2b. GTA pool — only fetched when some saved search is scoped outside
    // Mississauga (filters.city set by the save-search flow on /gta pages).
    // A GTA feed failure must not kill Mississauga alerts: those searches just
    // match nothing this run, and the error is logged for diagnosis.
    let gtaListings = [];
    const needsGta = searches.some(
      (s) => s.filters && s.filters.city && s.filters.city !== 'Mississauga'
    );
    if (needsGta) {
      try {
        // Full GTA pool too — same page-1-only bug applied here.
        const rawGta = await fetchAllListings(SITE_URL, '/api/listings-gta');
        gtaListings = processListings(rawGta.listings);
      } catch (err) {
        console.error('Alerts: GTA listings fetch error', err);
      }
      feedListingCount += gtaListings.length;
    }

    // 3. Group searches by email (one email per user)
    const byEmail = {};
    for (const search of searches) {
      if (!byEmail[search.email]) {
        byEmail[search.email] = { name: search.name, searches: [] };
      }
      byEmail[search.email].searches.push(search);
    }

    // 3b. Repeat-send guard: the DOM<=3 freshness window keeps a listing
    // eligible for up to 4 consecutive daily sends, so without this a
    // subscriber sees the same "new" property four days running. Load what
    // each recipient was already sent in the last 7 days (ample — nothing
    // stays DOM<=3 longer than 4). If the table doesn't exist yet (migration
    // not run) or the query fails, the set stays empty and behavior is
    // exactly the pre-guard behavior — never block the send over dedupe.
    const alreadySent = new Map(); // email -> Set(listing_id)
    try {
      const lookback = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: sentRows, error: sentErr } = await supabase
        .from('alert_sent_listings')
        .select('email, listing_id')
        .in('email', Object.keys(byEmail))
        .gte('sent_at', lookback);
      if (sentErr) throw sentErr;
      for (const row of sentRows || []) {
        if (!alreadySent.has(row.email)) alreadySent.set(row.email, new Set());
        alreadySent.get(row.email).add(row.listing_id);
      }
    } catch (err) {
      console.error(
        'Alerts: repeat-send guard unavailable (run supabase/migrations/create_alert_sent_listings.sql?) — sending without dedupe:',
        err?.message || err
      );
    }

    let sentCount = 0;
    const failures = [];
    const preview = []; // dry-run only: what WOULD have gone out, and to whom
    // Populated in BOTH modes. "Sent 0" / "would send 0" is ambiguous on its
    // own — it's the normal, healthy result on a day with nothing new, and
    // it's ALSO what a dead feed or an over-narrow saved search looks like.
    // `matched` (before the freshness/dedupe rule) vs `fresh` (after it) tells
    // them apart: matched>0 & fresh=0 means "nothing NEW today" (fine);
    // matched=0 means this search's filters currently match nothing at all
    // (worth a look, more so if feedListingCount is also suspiciously low).
    const matchSummary = [];

    // 4. For each email, find matching listings across all their saved searches
    for (const [email, userData] of Object.entries(byEmail)) {
      const allMatches = new Map(); // dedup by listing ID — FRESH (what would send)
      const allMatchedPreFreshness = new Map(); // dedup by listing ID — matched filters, before freshness
      const sentToUser = alreadySent.get(email) || new Set();

      for (const search of userData.searches) {
        // Merge saved filters with defaults
        const filters = { ...DEFAULT_FILTERS, ...search.filters };

        // Match against the search's own region: Mississauga feed by default
        // (incl. legacy rows with no city), GTA feed for GTA-scoped searches
        // (whole-GTA sentinel or filtered to the saved city).
        const pool = poolForSearch(search.filters, allListings, gtaListings);

        // Apply filters to get matching listings
        const matched = applyFilters(pool, filters);
        for (const l of matched) {
          if (!allMatchedPreFreshness.has(l.id)) allMatchedPreFreshness.set(l.id, l);
        }

        // Only include "new" listings (DOM <= 3 or first alert), and never a
        // listing this recipient already received in the last 7 days — the
        // first-alert path is filtered too, so a second saved search doesn't
        // re-deliver properties an earlier alert already showed.
        const isFirstAlert = !search.last_sent_at;
        const unseen = matched.filter((l) => !sentToUser.has(String(l.id)));
        const fresh = isFirstAlert
          ? unseen.slice(0, 10) // First alert: top 10 matches
          // Freshness without fabrication: real DOM 1-3 when the feed supplies
          // it; otherwise fall back to "record changed in the last 3 days"
          // (daysSinceUpdate) — an honest proxy for newly listed/changed, and
          // the only market-timing signal the feed serves on active listings.
          // The old `l.dom <= 3` matched EVERY listing once DOM became an
          // honest 0-when-unknown, which would have made the daily email an
          // arbitrary 10 rather than a "new deals" email.
          : unseen.filter((l) =>
              (l.dom >= 1 && l.dom <= 3) ||
              (!(l.dom >= 1) && Number.isFinite(l.daysSinceUpdate) && l.daysSinceUpdate <= 3)
            ).slice(0, 10);

        for (const listing of fresh) {
          if (!allMatches.has(listing.id)) {
            allMatches.set(listing.id, listing);
          }
        }
      }

      const matchedCount = allMatchedPreFreshness.size;
      matchSummary.push({ email, matched: matchedCount, fresh: allMatches.size });

      // Skip if no new matches
      if (allMatches.size === 0) {
        if (dryRun) {
          preview.push({ email, wouldSend: 0, matched: matchedCount, subject: null, listings: [] });
        }
        continue;
      }

      const listings = Array.from(allMatches.values())
        .sort((a, b) => b.hamzaScore - a.hamzaScore)
        .slice(0, 15); // Cap at 15 listings per email

      // Dry run stops HERE — after the exact same matching pipeline a real
      // send would use, before anything is sent or recorded. No Resend call,
      // no saved_searches update, no alert_sent_listings write: this branch
      // cannot email anyone or change what tomorrow's real run considers "new".
      if (dryRun) {
        preview.push({
          email,
          wouldSend: listings.length,
          matched: matchedCount,
          subject: alertSubject(listings),
          listings: listings.slice(0, 5).map((l) => ({
            id: l.id,
            address: l.address,
            price: l.price,
            score: l.hamzaScore,
          })),
        });
        continue;
      }

      // 5. Send email via Resend (tagRecipient adds per-recipient click
      // identity so the admin "Who Clicked" list can attribute visits)
      const emailHtml = tagRecipient(
        buildAlertEmail(listings, userData.name || 'Investor', userData.searches),
        email
      );

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'MississaugaInvestor <notifications@mississaugainvestor.ca>',
          to: email,
          subject: alertSubject(listings),
          html: emailHtml,
          // RFC 8058 one-click unsubscribe — required by Gmail/Yahoo bulk-sender
          // rules for a daily list send. Missing it depresses inbox placement.
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl(email)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      });

      if (resendRes.ok) {
        sentCount++;
        // Update last_sent_at for all of this user's searches
        const ids = userData.searches.map((s) => s.id);
        await supabase
          .from('saved_searches')
          .update({ last_sent_at: new Date().toISOString() })
          .in('id', ids);
        // Record what this email contained so tomorrow's run won't repeat it.
        // Recorded ONLY after Resend accepts — a rejected send stays eligible.
        // upsert (not insert) so a listing re-alerted after the 7-day window
        // refreshes its sent_at instead of failing the primary key.
        try {
          const { error: recordErr } = await supabase.from('alert_sent_listings').upsert(
            listings.map((l) => ({
              email,
              listing_id: String(l.id),
              sent_at: new Date().toISOString(),
            })),
            { onConflict: 'email,listing_id' }
          );
          if (recordErr) throw recordErr;
        } catch (err) {
          console.error(`Alerts: could not record sent listings for ${email}:`, err?.message || err);
        }
      } else {
        // A rejected send used to be swallowed silently — the run just reported
        // "sent: 0" with no reason, so a misconfigured sender (unverified domain
        // -> 403, bad key -> 401, bad from-address -> 422) looked identical to
        // "nobody matched today". Capture Resend's own message so one look at
        // the cron response or the logs says exactly what is wrong.
        const detail = await resendRes.text().catch(() => '');
        const reason = `HTTP ${resendRes.status}${detail ? ` — ${detail.slice(0, 300)}` : ''}`;
        failures.push({ email, reason });
        console.error(`Alerts: Resend REJECTED the send to ${email}: ${reason}`);
      }
    }

    if (failures.length) {
      console.error(
        `Alerts: ${failures.length} of ${failures.length + sentCount} sends were rejected by Resend. ` +
          'A 401 means RESEND_API_KEY is wrong; 403 usually means the sending domain is not verified in Resend; ' +
          '422 usually means RESEND_FROM_EMAIL is not a valid verified sender.'
      );
    }

    if (dryRun) {
      // No housekeeping either — a dry run touches nothing but reads.
      const totalWouldSend = preview.reduce((n, p) => n + p.wouldSend, 0);
      const totalMatched = matchSummary.reduce((n, m) => n + m.matched, 0);
      let message;
      if (totalWouldSend > 0) {
        message = `Would send ${totalWouldSend} listing${totalWouldSend === 1 ? '' : 's'} across ${preview.filter((p) => p.wouldSend > 0).length} email${preview.filter((p) => p.wouldSend > 0).length === 1 ? '' : 's'} — nothing was actually sent.`;
      } else if (feedListingCount === 0) {
        message = `The feed returned 0 active listings — nothing can match. Check the AMPRE token before assuming subscriber filters are the problem.`;
      } else if (totalMatched === 0) {
        message = `The feed has ${plural(feedListingCount, 'active listing')}, but 0 currently match any saved search's filters (see each recipient's "matched" count below).`;
      } else {
        message = `${plural(feedListingCount, 'active listing')}, ${totalMatched} match a saved search — but none are NEW since the last alert. That's expected on a quiet day, not a failure.`;
      }
      return NextResponse.json({
        dryRun: true,
        message,
        recipients: preview.length,
        wouldSend: totalWouldSend,
        feedListingCount,
        matchSummary,
        preview,
      });
    }

    // Housekeeping: guard rows older than double the lookback window are dead
    // weight — clear them so the table stays a few thousand rows, not months
    // of history. Best-effort; a failure (incl. missing table) changes nothing.
    try {
      await supabase
        .from('alert_sent_listings')
        .delete()
        .lt('sent_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
    } catch {}

    // "Sent 0 alert emails" alone reads as a failure but is the normal, daily
    // result whenever nobody has a new match — this is exactly what confused
    // the "is delivery broken?" question the first time this ran for real.
    // Same disambiguation as the dry-run message, built from the same counts.
    const totalMatchedReal = matchSummary.reduce((n, m) => n + m.matched, 0);
    let sentZeroReason = '';
    if (sentCount === 0 && failures.length === 0) {
      sentZeroReason = feedListingCount === 0
        ? ' The feed returned 0 active listings — nothing could match. Check the AMPRE token.'
        : totalMatchedReal === 0
          ? ` The feed has ${plural(feedListingCount, 'active listing')}, but 0 match any saved search's filters right now.`
          : ` ${plural(feedListingCount, 'active listing')}, ${totalMatchedReal} match a saved search — just none are new since the last alert. Normal on a quiet day.`;
    }

    return NextResponse.json({
      message: `Sent ${sentCount} alert emails${failures.length ? `, ${failures.length} rejected` : ''}.${sentZeroReason}`,
      sent: sentCount,
      failed: failures.length,
      feedListingCount,
      matchSummary,
      // Surfaced so the daily run is self-diagnosing without dashboard access.
      failures: failures.slice(0, 5),
    });
  } catch (err) {
    console.error('Alert send error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Daily-alert subject: lead with the top new match's real hook (cash flow, else
// cap rate) to lift open rates, falling back to a plain count. `listings` is
// sorted by score, so listings[0] is the best match. Every value is guarded so
// the subject can never render N/A, $NaN, or undefined.
function alertSubject(listings) {
  const n = listings.length;
  const top = listings[0];
  if (top) {
    const hood = (top.neighbourhood || top.city || '').toString().trim();
    const where = hood ? ` in ${hood}` : '';
    if (typeof top.cashFlow === 'number' && isFinite(top.cashFlow) && top.cashFlow > 0) {
      const more = n > 1 ? ` + ${n - 1} more` : '';
      return `New deal: +$${Math.round(top.cashFlow).toLocaleString()}/mo cash flow${where}${more}`;
    }
    if (typeof top.capRate === 'number' && isFinite(top.capRate) && top.capRate > 0) {
      return `${n} new Mississauga ${n === 1 ? 'deal' : 'deals'} — top ${top.capRate.toFixed(1)}% cap rate${where}`;
    }
  }
  return `${n} New Investment ${n === 1 ? 'Deal' : 'Deals'} in Mississauga`;
}

// Escape user/MLS-supplied strings interpolated into email HTML
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Price for the email row: $1M+ as "$X.XXM" (was "$1050K"), and empty when the
// price is missing (was "$0K" because price is guarded to 0 upstream).
function fmtPrice(p) {
  if (!Number.isFinite(p) || p <= 0) return '';
  if (p >= 1000000) return '$' + (p / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  return '$' + Math.round(p / 1000) + 'K';
}

const UTM = 'utm_source=alerts&utm_medium=email&utm_campaign=daily-alert';

// The rent every cash-flow figure in the email assumes. The site's listing
// cards state this on every card (an investor's critique: a cash-flow number
// with an unstated rent assumption is not credible), but the emails shipped
// the figures bare — so the channel that reaches subscribers directly was the
// one place the assumption stayed hidden. Reads the SAME fields the card's
// RentAssumption component reads, so the two can never disagree; returns ''
// when rent is missing rather than inventing one.
function rentAssumptionLine(l) {
  const rent = Number(l.estimatedRent);
  if (!Number.isFinite(rent) || rent <= 0) return '';
  const money = (n) => '$' + Math.round(n).toLocaleString();
  const basement = Number(l.basementIncome) || 0;
  const base = Number(l.baseRent) || 0;
  const units = Array.isArray(l.unitBreakdown) ? l.unitBreakdown : null;
  let breakdown = '';
  if (units && units.length > 1) {
    breakdown = ` · across ${units.length} units`;
  } else if (basement > 0 && base > 0) {
    breakdown = ` · ${money(base)} main + ${money(basement)} ${l.basementTier === 'legal' ? 'legal ' : ''}suite`;
  }
  return `Assumes ${money(rent)}/mo rent${breakdown}`;
}

/**
 * Build HTML email template for deal alerts
 */
function buildAlertEmail(listings, name, searches) {
  const listingRows = listings
    .map(
      (l) => {
        // Guard every rendered number: a single malformed listing (undefined /
        // NaN capRate, cashFlow or score — the same case the listings grid had
        // to defend against) must never throw and abort the whole email, which
        // would leave this subscriber with NO alert. Fall back to safe values.
        const score = Number.isFinite(l.hamzaScore) ? l.hamzaScore : null;
        const cap = Number.isFinite(l.capRate) ? l.capRate : null;
        const cf = Number.isFinite(l.cashFlow) ? l.cashFlow : null;
        const price = Number.isFinite(l.price) ? l.price : 0;
        const dom = Number.isFinite(l.dom) ? l.dom : null;
        const rentAssumption = rentAssumptionLine(l);
        // #047857 (not #10B981) and #B45309 (not #F59E0B): the badge prints
        // white on this colour, and the brighter tokens leave it at ~2.4:1.
        const scoreBg = score == null ? '#64748B' : score >= 8 ? '#047857' : score >= 6.5 ? '#2563EB' : '#B45309';
        return `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #E2E8F0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <a href="https://www.mississaugainvestor.ca/listings/${encodeURIComponent(l.id)}?${UTM}" style="color: #1B2A4A; font-weight: 600; font-size: 15px; text-decoration: none;">
                  ${esc(l.address)}
                </a>
                <div style="color: #64748B; font-size: 13px; margin-top: 4px;">
                  ${l.beds || 0} bed · ${l.baths || 0} bath · ${esc(l.type || 'Residential')}${l.subType ? ' · ' + esc(l.subType) : ''}
                </div>
                ${rentAssumption ? `<div style="color: #475569; font-size: 12px; margin-top: 4px;">${esc(rentAssumption)}</div>` : ''}
              </td>
              <td style="text-align: right; vertical-align: top;">
                <div style="font-weight: 700; color: #1B2A4A; font-size: 16px;">${fmtPrice(price)}</div>
                <div style="display: inline-block; background: ${scoreBg}; color: white; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 12px; margin-top: 4px;">
                  ${score == null ? '—' : score.toFixed(1)}
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 8px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background: #F1F5F9; border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #475569; margin-right: 8px;">
                      CAP ${cap == null ? '—' : cap.toFixed(1) + '%'}
                    </td>
                    <td width="8"></td>
                    <td style="background: #F1F5F9; border-radius: 6px; padding: 4px 10px; font-size: 12px; color: ${cf == null ? '#475569' : cf >= 0 ? '#047857' : '#DC2626'}; font-weight: 600;">
                      PCF ${cf == null ? '—' : cf >= 0 ? `+$${cf.toLocaleString()}/mo` : `−$${Math.abs(cf).toLocaleString()}/mo`}
                    </td>
                    <td width="8"></td>
                    <td style="background: #F1F5F9; border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #475569;">
                      ${dom == null ? '—' : dom + ' DOM'}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
      }
    )
    .join('');

  const unsubLinks = searches
    .map(
      (s) =>
        `<a href="https://www.mississaugainvestor.ca/api/alerts/unsubscribe?id=${s.id}" style="color: #94A3B8; font-size: 12px;">Unsubscribe</a>`
    )
    .join(' · ');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <!-- Preheader: the inbox preview snippet. Hidden in the body but shown by the
       client next to the subject — prime open-rate real estate. -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#F8FAFC;opacity:0;">
    ${listings.length} new ${listings.length === 1 ? 'match' : 'matches'} for your saved search — cash flow, cap rate &amp; deal score on each.
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F8FAFC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <!-- Masthead on the site's "dusk" identity. bgcolor + a background
                 shorthand carry the solid navy for Outlook and anything that
                 ignores gradients, so the fallback is the exact previous look
                 rather than a white box. The ".ca" was accent #2563EB on navy
                 = 2.75:1 (the same on-navy failure fixed in the site footer);
                 #8AB6FF is the established on-navy blue at 6.9:1. -->
            <td bgcolor="#1B2A4A" style="background: #1B2A4A; background: linear-gradient(135deg, #16223D 0%, #1B2A4A 55%, #25355C 100%); border-radius: 16px 16px 0 0; padding: 32px 32px 24px; text-align: center;">
              <div style="font-size: 22px; font-weight: 700; color: #FFFFFF; margin-bottom: 8px;">
                MississaugaInvestor<span style="color: #8AB6FF;">.ca</span>
              </div>
              <div style="color: #F59E0B; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Daily Deal Alerts</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background: white; padding: 32px;">
              <div style="font-size: 18px; font-weight: 600; color: #1B2A4A; margin-bottom: 4px;">
                Hi ${esc(name)},
              </div>
              <div style="color: #64748B; font-size: 14px; margin-bottom: 24px; line-height: 1.5;">
                ${listings.length} new investment ${listings.length === 1 ? 'property matches' : 'properties match'} your saved search criteria.
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${listingRows}
              </table>

              <!-- Metric legend — explains the CAP vs PCF question every investor asks -->
              <div style="margin-top: 18px; padding: 12px 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; color: #64748B; font-size: 12px; line-height: 1.55;">
                <strong style="color: #475569;">CAP</strong> is the yield before financing (all-cash). <strong style="color: #475569;">PCF</strong> is your monthly cash flow after the mortgage. A positive CAP with a small negative PCF is normal at today&rsquo;s rates &mdash; most of that gap is principal you keep as equity.
                <br /><br />
                Every figure assumes ${DEFAULT_ASSUMPTIONS.downPaymentPercent}% down at ${DEFAULT_ASSUMPTIONS.annualInterestRate}% over ${DEFAULT_ASSUMPTIONS.amortizationYears} years, plus property tax, insurance, maintenance and vacancy. <a href="https://www.mississaugainvestor.ca/score-methodology?${UTM}" style="color: #2563EB;">See the full methodology</a> or change any assumption on a listing page.
              </div>

              <div style="text-align: center; margin-top: 28px;">
                <a href="https://www.mississaugainvestor.ca/listings?${UTM}" style="display: inline-block; background: #2563EB; color: white; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 14px; text-decoration: none;">
                  Browse All Listings
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F8FAFC; border-radius: 0 0 16px 16px; padding: 24px 32px; border-top: 1px solid #E2E8F0; text-align: center;">
              <div style="color: #64748B; font-size: 12px; line-height: 1.6;">
                Hamza Nouman, Sales Representative<br>
                Cityscape Real Estate Ltd., Brokerage<br>
                885 Plymouth Dr, Unit 2, Mississauga, ON L5V 0B5<br>
                647-609-1289 · hamza@nouman.ca
              </div>
              <div style="margin-top: 16px;">
                ${unsubLinks}
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
