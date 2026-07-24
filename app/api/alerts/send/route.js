import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processListings } from '@/lib/listings/process-listings';
import { applyFilters, DEFAULT_FILTERS } from '@/components/listings/filter-utils';
import { tagRecipient } from '@/lib/emails/recipient-token';

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
  // Verify cron secret (Vercel sends this automatically for cron jobs)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Alerts are temporarily unavailable' }, { status: 503 });
    }
    // 1. Fetch all active saved searches
    const { data: searches, error: searchErr } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('active', true);

    if (searchErr) throw searchErr;
    if (!searches || searches.length === 0) {
      return NextResponse.json({ message: 'No active searches', sent: 0 });
    }

    // 2. Fetch current listings from our own API (absolute public URL — see SITE_URL note)
    const listingsRes = await fetch(`${SITE_URL}/api/listings`);
    if (!listingsRes.ok) throw new Error(`Failed to fetch listings (HTTP ${listingsRes.status})`);
    // Guard against a non-JSON body (e.g. an HTML auth/redirect page) so a bad
    // upstream response gives a clear error instead of a cryptic JSON.parse crash.
    const ctype = listingsRes.headers.get('content-type') || '';
    if (!ctype.includes('application/json')) {
      throw new Error(`Listings API returned non-JSON (content-type: ${ctype || 'none'})`);
    }
    const rawListings = await listingsRes.json();
    // /api/listings returns { listings, page, ... } — processListings needs the array
    const allListings = processListings(rawListings.listings || rawListings);

    // 3. Group searches by email (one email per user)
    const byEmail = {};
    for (const search of searches) {
      if (!byEmail[search.email]) {
        byEmail[search.email] = { name: search.name, searches: [] };
      }
      byEmail[search.email].searches.push(search);
    }

    let sentCount = 0;

    // 4. For each email, find matching listings across all their saved searches
    for (const [email, userData] of Object.entries(byEmail)) {
      const allMatches = new Map(); // dedup by listing ID

      for (const search of userData.searches) {
        // Merge saved filters with defaults
        const filters = { ...DEFAULT_FILTERS, ...search.filters };

        // Apply filters to get matching listings
        const matched = applyFilters(allListings, filters);

        // Only include "new" listings (DOM <= 3 or first alert)
        const isFirstAlert = !search.last_sent_at;
        const fresh = isFirstAlert
          ? matched.slice(0, 10) // First alert: top 10 matches
          : matched.filter((l) => l.dom <= 3).slice(0, 10); // Daily: only new (DOM 0-3)

        for (const listing of fresh) {
          if (!allMatches.has(listing.id)) {
            allMatches.set(listing.id, listing);
          }
        }
      }

      // Skip if no new matches
      if (allMatches.size === 0) continue;

      const listings = Array.from(allMatches.values())
        .sort((a, b) => b.hamzaScore - a.hamzaScore)
        .slice(0, 15); // Cap at 15 listings per email

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
      }
    }

    return NextResponse.json({ message: `Sent ${sentCount} alert emails`, sent: sentCount });
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

const UTM = 'utm_source=alerts&utm_medium=email&utm_campaign=daily-alert';

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
        const scoreBg = score == null ? '#94A3B8' : score >= 8 ? '#10B981' : score >= 6.5 ? '#2563EB' : '#F59E0B';
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
              </td>
              <td style="text-align: right; vertical-align: top;">
                <div style="font-weight: 700; color: #1B2A4A; font-size: 16px;">$${(price / 1000).toFixed(0)}K</div>
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
                      CAP ${cap == null ? '—' : cap + '%'}
                    </td>
                    <td width="8"></td>
                    <td style="background: #F1F5F9; border-radius: 6px; padding: 4px 10px; font-size: 12px; color: ${cf == null ? '#475569' : cf >= 0 ? '#10B981' : '#EF4444'}; font-weight: 600;">
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
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F8FAFC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: #1B2A4A; border-radius: 16px 16px 0 0; padding: 32px 32px 24px; text-align: center;">
              <div style="font-size: 22px; font-weight: 700; color: white; margin-bottom: 8px;">
                MississaugaInvestor<span style="color: #2563EB;">.ca</span>
              </div>
              <div style="color: #94A3B8; font-size: 14px;">Daily Deal Alerts</div>
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
