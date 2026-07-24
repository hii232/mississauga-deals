import { unsubscribeToken } from '@/lib/unsubscribe-token';

// ─────────────────────────────────────────────────────────────────────────────
//  Per-recipient click identity for outbound emails.
//
//  Every link in our emails already carries utm_campaign=<campaign>. This
//  helper post-processes a fully-built email HTML string and appends
//  `&mi=<token>` to each of those links, where the token is the same HMAC the
//  unsubscribe links use (16 hex chars derived from the recipient's email +
//  CRON_SECRET — no personal data in the URL, and the server can re-derive the
//  email→token mapping to attribute clicks).
//
//  PageTracker forwards `mi` to /api/track, which stores it as
//  page_views.subscriber_token; the admin analytics route then matches tokens
//  back to leads so Hamza sees WHO clicked (name/email/phone), not just counts.
//
//  Standard first-party ESP-style click attribution of our own subscribers.
//  In dev (no CRON_SECRET) the token is '' and the HTML is returned unchanged.
// ─────────────────────────────────────────────────────────────────────────────

const CAMPAIGN_RE = /(utm_campaign=[a-z0-9-]+)/g;

export function tagRecipient(html, email) {
  if (!html || !email) return html;
  const token = unsubscribeToken(email);
  if (!token) return html;
  return html.replace(CAMPAIGN_RE, `$1&mi=${token}`);
}
