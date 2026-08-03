/**
 * Default alert audience — the ~480 leads who gave an email but never built a
 * saved search.
 *
 * WHY THIS EXISTS (Hamza, 2026-08-03: "point the daily alert at leads").
 * The daily alert route read only `saved_searches`, and almost nobody builds
 * one: yesterday's run reached exactly ONE person — Hamza's own test account —
 * while 483 captured contacts received nothing. The signup surfaces promise
 * "deal alerts" in exchange for the email, so the leads table IS the alert
 * audience; the saved-search table is the minority who narrowed it.
 *
 * WHY THE BAR IS HIGHER FOR THEM. A saved search is a request — its owner gets
 * everything that matches, daily. A bare email address is consent, not a
 * request, and the fastest way to burn 483 addresses (and the sending domain)
 * is to email them every day. So the default audience gets:
 *   - only listings scoring >= MIN_SCORE (8+, the tier the site badges green),
 *   - at most MAX_DEALS per email,
 *   - at most one email per RECIPIENT_COOLDOWN_DAYS (dedupe rows double as a
 *     send diary, so this needs no new table),
 *   - nothing at all on a day with no qualifying fresh listing.
 *
 * Dependency-free so every rule is unit-testable (default-audience.test.mjs).
 */

export const MIN_SCORE = 8;
export const MAX_DEALS = 6;
export const RECIPIENT_COOLDOWN_DAYS = 3;
/** Bound on sequential Resend calls per run — the rest roll to later runs. */
export const MAX_SENDS_PER_RUN = 120;

/**
 * Freshness — the IDENTICAL rule the saved-search path applies: real DOM 1–3
 * when the feed supplies it, else "record changed in the last 3 days". Never
 * fabricated; a listing with no signal is not "new".
 */
export function isFreshListing(l) {
  if (!l) return false;
  if (l.dom >= 1 && l.dom <= 3) return true;
  return !(l.dom >= 1) && Number.isFinite(l.daysSinceUpdate) && l.daysSinceUpdate <= 3;
}

/**
 * The deals a default-audience email may contain. One shared set for the whole
 * audience (everyone gets the same top deals) — per-recipient dedupe is applied
 * by the caller against alert_sent_listings.
 */
export function pickDefaultDeals(listings) {
  return (listings || [])
    .filter((l) => l && Number.isFinite(l.hamzaScore) && l.hamzaScore >= MIN_SCORE)
    .filter(isFreshListing)
    .sort((a, b) => b.hamzaScore - a.hamzaScore)
    .slice(0, MAX_DEALS);
}

/**
 * Which recipients this run may email.
 *
 * @param {Array<{email:string,name:string}>} recipients — broadcast audience
 *   (already unsubscribe-filtered by getBroadcastRecipients)
 * @param {Set<string>} savedSearchEmails — excluded: their own alert covers them
 * @param {Map<string,number>} lastSentAt — email -> most recent sent_at (ms)
 * @param {number} now — ms
 * @returns {{ eligible: Array, cooling: number, capped: number }}
 */
export function selectDefaultRecipients(recipients, savedSearchEmails, lastSentAt, now) {
  const cooldownMs = RECIPIENT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const pool = [];
  let cooling = 0;
  for (const r of recipients || []) {
    const email = String(r.email || '').toLowerCase().trim();
    if (!email || savedSearchEmails.has(email)) continue;
    const last = lastSentAt.get(email);
    if (Number.isFinite(last) && now - last < cooldownMs) { cooling++; continue; }
    pool.push({ ...r, email });
  }
  const eligible = pool.slice(0, MAX_SENDS_PER_RUN);
  return { eligible, cooling, capped: pool.length - eligible.length };
}
