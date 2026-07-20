import { createHmac } from 'crypto';

// Signed unsubscribe links: token = HMAC(email, CRON_SECRET), truncated.
// Prevents third parties from unsubscribing arbitrary addresses. If
// CRON_SECRET is not set (dev), links are unsigned and accepted as-is so the
// flow still works locally.
export function unsubscribeToken(email) {
  if (!process.env.CRON_SECRET) return '';
  return createHmac('sha256', process.env.CRON_SECRET)
    .update(String(email).toLowerCase().trim())
    .digest('hex')
    .slice(0, 16);
}

export function unsubscribeTokenValid(email, token) {
  if (!process.env.CRON_SECRET) return true;
  return token === unsubscribeToken(email);
}

export function unsubscribeUrl(email) {
  const base = 'https://www.mississaugainvestor.ca/api/alerts/unsubscribe';
  const t = unsubscribeToken(email);
  return `${base}?email=${encodeURIComponent(String(email).toLowerCase().trim())}${t ? `&t=${t}` : ''}`;
}
