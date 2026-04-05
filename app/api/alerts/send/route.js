import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processListings } from '@/lib/listings/process-listings';
import { applyFilters, DEFAULT_FILTERS } from '@/components/listings/filter-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/alerts/send
 * Called by Vercel Cron daily at 8 AM UTC
 * Sends email alerts for saved searches with new matching listings
 */
export async function POST(request) {
  // Verify cron secret (Vercel sends this automatically for cron jobs)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch all active saved searches
    const { data: searches, error: searchErr } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('active', true);

    if (searchErr) throw searchErr;
    if (!searches || searches.length === 0) {
      return NextResponse.json({ message: 'No active searches', sent: 0 });
    }

    // 2. Fetch current listings from our own API
    const listingsUrl = new URL('/api/listings', request.url);
    const listingsRes = await fetch(listingsUrl.toString());
    if (!listingsRes.ok) throw new Error('Failed to fetch listings');
    const rawListings = await listingsRes.json();
    const allListings = processListings(rawListings);

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

      // 5. Send email via Resend
      const emailHtml = buildAlertEmail(listings, userData.name || 'Investor', userData.searches);

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'MississaugaInvestor <notifications@mississaugainvestor.ca>',
          to: email,
          subject: `${listings.length} New Investment ${listings.length === 1 ? 'Deal' : 'Deals'} in Mississauga`,
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

/**
 * Build HTML email template for deal alerts
 */
function buildAlertEmail(listings, name, searches) {
  const listingRows = listings
    .map(
      (l) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #E2E8F0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <a href="https://www.mississaugainvestor.ca/listings/${l.id}" style="color: #1B2A4A; font-weight: 600; font-size: 15px; text-decoration: none;">
                  ${l.address}
                </a>
                <div style="color: #64748B; font-size: 13px; margin-top: 4px;">
                  ${l.beds} bed · ${l.baths} bath · ${l.type}${l.subType ? ' · ' + l.subType : ''}
                </div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <div style="font-weight: 700; color: #1B2A4A; font-size: 16px;">$${(l.price / 1000).toFixed(0)}K</div>
                <div style="display: inline-block; background: ${l.hamzaScore >= 8 ? '#10B981' : l.hamzaScore >= 6.5 ? '#2563EB' : '#F59E0B'}; color: white; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 12px; margin-top: 4px;">
                  ${l.hamzaScore.toFixed(1)}
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 8px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background: #F1F5F9; border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #475569; margin-right: 8px;">
                      CAP ${l.capRate}%
                    </td>
                    <td width="8"></td>
                    <td style="background: #F1F5F9; border-radius: 6px; padding: 4px 10px; font-size: 12px; color: ${l.cashFlow >= 0 ? '#10B981' : '#EF4444'}; font-weight: 600;">
                      PCF ${l.cashFlow >= 0 ? '+' : ''}$${l.cashFlow.toLocaleString()}/mo
                    </td>
                    <td width="8"></td>
                    <td style="background: #F1F5F9; border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #475569;">
                      ${l.dom} DOM
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
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
                Hi ${name},
              </div>
              <div style="color: #64748B; font-size: 14px; margin-bottom: 24px; line-height: 1.5;">
                ${listings.length} new investment ${listings.length === 1 ? 'property matches' : 'properties match'} your saved search criteria.
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${listingRows}
              </table>

              <div style="text-align: center; margin-top: 28px;">
                <a href="https://www.mississaugainvestor.ca/listings" style="display: inline-block; background: #2563EB; color: white; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 14px; text-decoration: none;">
                  View All ${listings.length > 5 ? '1,800+' : ''} Listings
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
