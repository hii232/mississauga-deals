/**
 * One place that decides whether an internal link should be followed.
 *
 * THE RULE (established by the 2026-07-30 Seobility audit, which scored links
 * at 25%): a link to a URL carrying a query string is a link to a FILTERED
 * VIEW, not to a page. Every such URL renders a subset of a page that already
 * exists at a clean path, so following them spends crawl budget re-crawling
 * /listings under dozens of parameter combinations and splits its signals
 * across near-duplicate URLs.
 *
 * The audit's fix had two halves: point a link at the STATIC equivalent where
 * one exists (the /gta?city= and homepage ?hood= chips became /gta/[city] and
 * /neighbourhoods/[hood]), and mark the genuine filters rel="nofollow". The
 * second half was applied by hand, so it drifted - a 2026-08-03 sweep of the
 * built HTML found seven followed parameterized links that postdated or were
 * missed by it (three on /cash-flow-positive-properties-ontario, two on
 * /market-pulse, one on /hurontario-lrt-real-estate, and the project links on
 * /pre-construction/projects).
 *
 * Stating the rule once, as code, is what stops the next one appearing.
 *
 * NOT a judgement about whether the link is useful to a HUMAN - these are good
 * links and should stay. nofollow only tells a crawler not to treat a filtered
 * view as a destination worth indexing in its own right.
 */

/**
 * @param {string} href
 * @returns {'nofollow'|undefined} pass straight into a <Link rel={...}> - React
 *   omits the attribute entirely when this is undefined.
 */
export function relForInternalHref(href) {
  const h = String(href || '');
  // External links have their own rel handling; only internal paths here.
  // `//host/path` is protocol-relative and therefore EXTERNAL despite the
  // leading slash - a naive startsWith('/') would nofollow another site's URL.
  if (!h.startsWith('/') || h.startsWith('//')) return undefined;
  // A fragment is a jump within the same document, not a filtered view.
  return h.includes('?') ? 'nofollow' : undefined;
}
