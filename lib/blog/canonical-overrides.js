// Single source of truth for blog URLs whose canonical is NOT themselves.
//
// Two mechanisms point blog URLs elsewhere, and both must agree with the
// sitemap — a sitemap entry is a canonical claim, so submitting a URL that
// 308-redirects or whose rel=canonical points at another page sends Google
// contradictory signals ("index this" vs "this isn't the real URL"):
//
//   1. BLOG_REDIRECTS — hard 308s consumed by next.config.js redirects().
//   2. CANONICAL_OVERRIDES — posts that stay live but declare a dedicated
//      investor-guide page as their canonical (app/(public)/blog/[slug]/page.js).
//
// app/sitemap.js imports both lists to EXCLUDE matching slugs, so the sitemap
// can never drift from what the pages/redirects actually declare.
//
// CommonJS on purpose: next.config.js is CJS and cannot import an ES module;
// the app-router files import it fine through the bundler's CJS interop.

// When a blog post covers the same topic as a dedicated investor-guide page,
// point its canonical at the dedicated page so Google consolidates search
// authority there rather than splitting it between the two URLs.
// Measured problem (2026-07-26 GSC): the dedicated /rental-property-insurance-
// mississauga page sat at position 55 while a blog post on the same topic held
// position 12 — the purpose-built, conversion-optimised page was losing to the
// site's own auto-generated post.
// `slugContains` is a substring that appears in the blog slug; `canonicalUrl`
// is the absolute canonical URL of the dedicated page.
const CANONICAL_OVERRIDES = [
  {
    slugContains: 'rental-property-insurance',
    canonicalUrl: 'https://www.mississaugainvestor.ca/rental-property-insurance-mississauga',
    path: '/rental-property-insurance-mississauga',
    label: 'Rental Property Insurance in Mississauga',
    note: 'Our dedicated guide covers building, liability, and loss-of-rent coverage — plus where to get a quote from an Ontario broker.',
  },
  {
    slugContains: 'investment-property-mortgage',
    canonicalUrl: 'https://www.mississaugainvestor.ca/mortgage-calculator',
    path: '/mortgage-calculator',
    label: 'Income Property Mortgage Calculator',
    note: 'Run live payment, CMHC, and stress-test calculations with our interactive tool.',
  },
  {
    slugContains: 'rent-vs-buy',
    canonicalUrl: 'https://www.mississaugainvestor.ca/rent-vs-buy-mississauga',
    path: '/rent-vs-buy-mississauga',
    label: 'Rent vs Buy in Mississauga — Interactive Calculator',
    note: 'Find your real break-even point with our calculator using Canadian semi-annual compounding and Ontario land-transfer tax.',
  },
];

/** Returns the override object if this slug matches a known duplicate topic,
 *  or null if the blog post is the sole coverage of its topic. */
function getCanonicalOverride(slug) {
  return CANONICAL_OVERRIDES.find(({ slugContains }) => slug.includes(slugContains)) ?? null;
}

// Blog 308 redirects, consumed verbatim by next.config.js redirects().
// See the long rationale comment in next.config.js — only clusters with an
// unambiguous, already-decided winner belong here.
const BLOG_REDIRECTS = [
  {
    source: '/blog/mississauga-rental-property-insurance-2026-complete-guide',
    destination: '/rental-property-insurance-mississauga',
    permanent: true,
  },
  {
    source: '/blog/investment-property-mortgages-in-mississauga-2026-complete-guide',
    destination: '/mortgage-calculator',
    permanent: true,
  },
  // Two literally identical-title posts under different auto-generated
  // slugs — the clearest duplicate of the five evidenced clusters.
  // Redirected into the canonical (unsuffixed) slug, which is the older
  // and already-indexed of the three.
  {
    source: '/blog/cap-rate-vs-cash-flow-vs-roi-mississauga-investment-guide-2026-mp850elg',
    destination: '/blog/cap-rate-vs-cash-flow-vs-roi-mississauga-investment-guide-2026',
    permanent: true,
  },
  {
    source: '/blog/cap-rate-vs-cash-flow-vs-roi-mississauga-investment-guide-2026-mq5050pt',
    destination: '/blog/cap-rate-vs-cash-flow-vs-roi-mississauga-investment-guide-2026',
    permanent: true,
  },
];

// Bare slugs (no /blog/ prefix) of redirected posts, for sitemap exclusion.
const REDIRECTED_BLOG_SLUGS = BLOG_REDIRECTS.map(({ source }) =>
  source.replace(/^\/blog\//, '')
);

/** True when /blog/{slug} should NOT be submitted in the sitemap: either it
 *  308-redirects away, or its rel=canonical points at a dedicated page. */
function isNonCanonicalBlogSlug(slug) {
  return (
    REDIRECTED_BLOG_SLUGS.includes(slug) || getCanonicalOverride(slug) !== null
  );
}

module.exports = {
  CANONICAL_OVERRIDES,
  getCanonicalOverride,
  BLOG_REDIRECTS,
  REDIRECTED_BLOG_SLUGS,
  isNonCanonicalBlogSlug,
};
