/**
 * Live Google Business Profile rating + review count.
 *
 * The "5.0 on Google · 28 reviews" claim used to be hardcoded in eleven
 * separate files. Nothing verified it, and nothing updated it when the real
 * profile changed — the same failure mode that left the TRREB figures five
 * months stale, except this one is a public claim about our own reputation.
 *
 * Rules this module enforces:
 *  - The numbers come from Google or they don't get shown. There is no
 *    hardcoded fallback rating anywhere, deliberately.
 *  - If the API key or place ID is missing (local dev, CI, a build without
 *    secrets), every consumer gets `null` and hides the claim. Builds must
 *    still pass with no env vars — see CLAUDE.md.
 *  - A failed or malformed response is treated exactly like "not configured".
 *    Showing yesterday's rating is not worth the risk of showing a wrong one.
 *
 * Env:
 *   GOOGLE_PLACES_API_KEY  — Places API (New) key, restricted to Places API
 *   GOOGLE_PLACE_ID        — the Business Profile place ID (starts "ChIJ...")
 */

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places';

// Google's own caching guidance allows storing these values short-term. Six
// hours keeps the site fresh without hammering a billed API on every render.
const REVALIDATE_SECONDS = 6 * 60 * 60;

function isConfigured() {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACE_ID);
}

/**
 * Fetch { rating, reviewCount } from Google, or null if unavailable.
 * Never throws — callers render conditionally on the result.
 */
export async function fetchGoogleRating() {
  if (!isConfigured()) return null;

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

    if (!res.ok) return null;
    const data = await res.json();

    const rating = Number(data?.rating);
    const reviewCount = Number(data?.userRatingCount);

    // A profile with no reviews yet has nothing worth claiming. Treat it the
    // same as unavailable rather than rendering "0.0 on Google · 0 reviews".
    if (!Number.isFinite(rating) || rating <= 0) return null;
    if (!Number.isFinite(reviewCount) || reviewCount <= 0) return null;

    return {
      // One decimal is how Google itself presents it (4.9, 5.0).
      rating: Math.round(rating * 10) / 10,
      reviewCount: Math.round(reviewCount),
    };
  } catch {
    return null;
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
