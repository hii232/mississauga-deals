// Fire a GA4 conversion event for a completed lead capture. Safe everywhere:
// no-ops when gtag isn't loaded (ad-blocker, consent, SSR) and never throws.
// Call ONLY in a capture's success branch so events can't double-fire —
// each submission runs its success path once.
export function trackConversion(event, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', event, params);
    }
  } catch {
    // analytics must never break a capture flow
  }
}
