'use client';

import { useState, useCallback } from 'react';

/**
 * One rule for "the MLS photo did not load".
 *
 * WHY (measured 2026-08-06, Semrush site audit): 14 of 288 listing images were
 * dead at crawl time - roughly 5% - every one of them a 400 from
 * /_next/image wrapping a trreb-image.ampre.ca URL. MLS photo URLs carry a
 * cache-buster keyed to the listing's modification time, so when a listing is
 * updated the old URL dies while our cached HTML can still be serving it. That
 * is inherent to hot-linking board photos behind ISR, not a bug we can delete.
 *
 * What WAS a bug: none of the three cards that render those photos
 * (/listings, the homepage deals, the top-picks carousel) handled the failure,
 * so a visitor got a broken-image box on the site's highest-traffic pages.
 * Each card already has a decent no-photo state; this just routes failures
 * into it.
 *
 * Tracked BY URL, not with a boolean, so it self-heals. Photos arrive late on
 * these cards (a batch fetch fills them in after first paint), and a boolean
 * flag would keep a card permanently photo-less after one stale URL failed,
 * even once a good URL arrived.
 *
 * NOTE for anyone reading this next to the Semrush report: this does NOT clear
 * the "broken internal images" count. Semrush crawls with JS rendering
 * disabled, so onError never runs for it, and the underlying URL is still
 * whatever the upstream board served. This is a fix for real visitors.
 *
 * @param {string|null} photo current photo URL
 * @returns {[boolean, () => void]} [render the photo?, onError handler]
 */
export function usePhotoFallback(photo) {
  const [failed, setFailed] = useState(null);
  const onError = useCallback(() => setFailed(photo), [photo]);
  return [Boolean(photo) && failed !== photo, onError];
}
