/**
 * Live Google Business Profile rating + review count.
 *
 * The "5.0 on Google · 28 reviews" claim used to be hardcoded in eleven
 * separate files. Nothing verified it, and nothing updated it when the real
 * profile changed — the same failure mode that left the TRREB figures five
 * months stale, except this one is a public claim about our own reputation.
 *
 * Two ways to supply the numbers, in priority order:
 *   1. The Places API, if GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID are set.
 *      Self-updating, nothing to maintain.
 *   2. MANUAL_RATING below — figures read off the Business Profile by hand,
 *      stamped with the date they were checked.
 *
 * Rules this module enforces:
 *  - A figure is either sourced or it isn't shown. There is no anonymous
 *    hardcoded rating: the manual block carries a verified-on date, and
 *    googleRatingFreshness() reports when it's overdue so it can't quietly rot
 *    the way the old scattered "5.0 · 28 reviews" strings did.
 *  - With neither source available, every consumer gets `null` and hides the
 *    claim. Builds must still pass with no env vars — see CLAUDE.md.
 *  - An API error falls back to the dated manual figures, not to nothing.
 *
 * Env:
 *   GOOGLE_PLACES_API_KEY  — Places API (New) key, restricted to Places API
 *   GOOGLE_PLACE_ID        — the Business Profile place ID (starts "ChIJ...")
 */

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places';

// Google's own caching guidance allows storing these values short-term. Six
// hours keeps the site fresh without hammering a billed API on every render.
const REVALIDATE_SECONDS = 6 * 60 * 60;

// ── Manually verified figures ────────────────────────────
// Setting up a Places API key means a Google Cloud project and a billing
// account, which isn't worth it for two numbers. So these are transcribed by
// hand from the live Business Profile — the same deal as the TRREB data.
//
// The trade is that a hand-entered number CAN go stale, so it carries the date
// it was checked. `googleRatingFreshness()` reports when it's overdue and the
// admin dashboard surfaces it, exactly like the market data. Re-check the
// profile and update all three fields together.
//
// If GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID are ever set, the live API wins
// automatically and this block stops being used.
const MANUAL_RATING = {
  // These are Hamza's own previously-published figures — the claim that ran
  // across the site until 2026-07-25 and matches the transcribed reviews in
  // lib/constants.js. verifiedOn is deliberately null: nobody has re-checked
  // the live Business Profile against them, so googleRatingFreshness() flags
  // them immediately and the admin dashboard keeps asking for a re-check until
  // someone confirms the current numbers and stamps the date.
  rating: 5.0,
  reviewCount: 28,
  verifiedOn: null,   // 'YYYY-MM-DD' — the day the profile was actually checked
};

// Hand-entered figures are re-checked quarterly; past that the admin dashboard
// asks for a refresh. Reviews accumulate slowly, so this isn't monthly.
const MANUAL_MAX_AGE_DAYS = 90;

function isConfigured() {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACE_ID);
}

function manualRating() {
  const { rating, reviewCount } = MANUAL_RATING;
  if (!Number.isFinite(rating) || rating <= 0) return null;
  if (!Number.isFinite(reviewCount) || reviewCount <= 0) return null;
  return {
    rating: Math.round(rating * 10) / 10,
    reviewCount: Math.round(reviewCount),
    source: 'manual',
  };
}

/**
 * How old the hand-entered figures are, so staleness is visible rather than
 * assumed. Returns { configured, source, daysOld, isStale, refreshNote }.
 */
export function googleRatingFreshness(now = new Date()) {
  if (isConfigured()) {
    return { configured: true, source: 'api', daysOld: 0, isStale: false, refreshNote: null };
  }
  const manual = manualRating();
  if (!manual) {
    return {
      configured: false,
      source: 'none',
      daysOld: null,
      isStale: false,
      refreshNote: 'No Google rating is set — the rating is hidden site-wide until one is provided.',
    };
  }
  const verified = MANUAL_RATING.verifiedOn ? new Date(MANUAL_RATING.verifiedOn + 'T00:00:00Z') : null;
  if (!verified || isNaN(verified)) {
    return { configured: true, source: 'manual', daysOld: null, isStale: true, refreshNote: 'Google rating has no verified-on date — re-check the Business Profile.' };
  }
  const daysOld = Math.floor((now - verified) / 86400000);
  const isStale = daysOld > MANUAL_MAX_AGE_DAYS;
  return {
    configured: true,
    source: 'manual',
    daysOld,
    isStale,
    refreshNote: isStale
      ? `Google rating was last verified ${daysOld} days ago — check the Business Profile and update MANUAL_RATING in lib/google-rating.js.`
      : null,
  };
}

/**
 * Fetch { rating, reviewCount } from Google, or null if unavailable.
 * Never throws — callers render conditionally on the result.
 */
export async function fetchGoogleRating() {
  // No API configured → use the hand-verified figures if they're set, else
  // return null so every surface hides the claim.
  if (!isConfigured()) return manualRating();

  try {
    const res = await fetch(
      `${PLACES_ENDPOINT}/${encodeURIComponent(process.env.GOOGLE_PLACE_ID)}`,
      {
        headers: {
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
          // Field mask is required by Places API (New) and keeps the call in the
          // cheapest SKU — we only ever need these two numbers.
          'X-Goog-FieldMask': 'rating,userRatingCount',
        },
        next: { revalidate: REVALIDATE_SECONDS },
      }
    );

    // A failed call falls back to the hand-verified figures rather than
    // blanking the trust chip — those are dated and auditable.
    if (!res.ok) return manualRating();
    const data = await res.json();

    const rating = Number(data?.rating);
    const reviewCount = Number(data?.userRatingCount);

    // A profile with no reviews yet has nothing worth claiming. Treat it the
    // same as unavailable rather than rendering "0.0 on Google · 0 reviews".
    if (!Number.isFinite(rating) || rating <= 0) return manualRating();
    if (!Number.isFinite(reviewCount) || reviewCount <= 0) return manualRating();

    return {
      // One decimal is how Google itself presents it (4.9, 5.0).
      rating: Math.round(rating * 10) / 10,
      reviewCount: Math.round(reviewCount),
      source: 'api',
    };
  } catch {
    return manualRating();
  }
}

/**
 * "5.0 on Google · 28 reviews" — or null when we have nothing real to say.
 * Singular/plural handled so a profile with one review doesn't read wrong.
 */
export function googleRatingLabel(data) {
  if (!data) return null;
  const { rating, reviewCount } = data;
  return `${rating.toFixed(1)} on Google · ${reviewCount} review${reviewCount === 1 ? '' : 's'}`;
}

/** Compact form for tight spaces: "5.0 on Google". */
export function googleRatingShort(data) {
  if (!data) return null;
  return `${data.rating.toFixed(1)} on Google`;
}
