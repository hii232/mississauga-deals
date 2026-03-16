/**
 * GA4 event tracking utility.
 * Safely fires gtag events — no-ops if gtag isn't loaded.
 */

function gtag(...args) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

/** Generic event */
export function trackEvent(eventName, params = {}) {
  gtag('event', eventName, params);
}

/** CTA click — button_text, location (page/component), destination URL */
export function trackCTA(buttonText, location, href) {
  trackEvent('cta_click', {
    button_text: buttonText,
    location,
    destination: href,
  });
}

/** Lead form submission */
export function trackLead(source, email) {
  trackEvent('generate_lead', {
    source,
    method: email ? 'email' : 'unknown',
  });
}

/** Listing view */
export function trackListingView(listingId, address, price) {
  trackEvent('view_item', {
    item_id: listingId,
    item_name: address,
    value: price,
    currency: 'CAD',
  });
}

/** Filter usage */
export function trackFilter(filterName, filterValue) {
  trackEvent('filter_use', {
    filter_name: filterName,
    filter_value: String(filterValue),
  });
}

/** Quiz completion */
export function trackQuizComplete(strategy) {
  trackEvent('quiz_complete', {
    strategy,
  });
}

/** Save search */
export function trackSaveSearch(filters) {
  trackEvent('save_search', {
    filters: JSON.stringify(filters).slice(0, 100),
  });
}

/** Exit intent popup shown / converted */
export function trackExitIntent(action) {
  trackEvent('exit_intent', { action }); // 'shown', 'converted', 'dismissed'
}
