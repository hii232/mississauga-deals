/**
 * Repo-side SEO title/description overrides for individual blog posts.
 *
 * WHY THIS EXISTS
 * ---------------
 * Blog titles and excerpts live in Supabase (`blog_posts`), written by the
 * auto-blog generator. There is no way to correct one from the repo — and the
 * 2026-08-03 Search Console export showed that every top-performing post was
 * losing clicks to SERP truncation:
 *
 *   page                       impressions   CTR    pos   title  description
 *   condo-vs-townhouse             1,915    0.47%   8.4    76 ✗     189 ✗
 *   families-school-quality          679    0.88%   7.7    71 ✗     170 ✗
 *   is-erin-mills                    512    0.98%   7.2    81 ✗     237 ✗
 *   churchill-meadows                144    0.00%   4.9    61 ✗     151
 *
 * Google shows roughly 60 characters of a title and 155 of a description. At
 * 76 characters the condo-vs-townhouse title was cut at "…Which Is Better for
 * Ca", so the entire value proposition — cash flow, 2026 — never reached the
 * searcher. That page alone draws 1,915 impressions a quarter at position 8.4
 * and converts 0.47% of them, roughly a fifth of what that position normally
 * earns.
 *
 * The generator's own spec was the cause (it asked for "50-70 characters" and
 * "Max 180 characters"), and that is fixed for FUTURE posts in
 * app/api/auto-blog/route.js. This file repairs the ones already published.
 *
 * RULES FOR ANYTHING ADDED HERE
 *   - title ≤ 60 chars, description ≤ 155 — enforced by seo-overrides.test.mjs,
 *     which fails the suite rather than letting a truncating entry ship.
 *   - Front-load the query terms the page actually ranks for; the tail is what
 *     gets cut.
 *   - NO figures. A cap rate or yield in a description goes stale the moment
 *     the market moves, and Google can keep serving it for months — the same
 *     discipline that keeps hardcoded stats out of the FAQ schema.
 */

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

export const BLOG_SEO_OVERRIDES = {
  'condo-vs-townhouse-in-mississauga-which-is-better-for-cash-flow-in-2026': {
    title: 'Condo vs Townhouse Mississauga: Which Cash Flows Better',
    description:
      "We ran TRREB sold data and real rent estimates across every Mississauga neighbourhood. One type cash flows better — here's which, and why.",
  },
  'best-mississauga-neighbourhoods-families-school-quality-2026': {
    title: 'Best Mississauga Neighbourhoods for Families in 2026',
    description:
      'School quality, home prices and commute times compared across every Mississauga neighbourhood — ranked for families buying in 2026.',
  },
  'is-erin-mills-good-investment-neighbourhood-2026': {
    title: 'Is Erin Mills a Good Investment in 2026?',
    description:
      'Erin Mills cap rates, rents and price trends from live MLS data — what the numbers actually say about buying there as an investor.',
  },
  'churchill-meadows-mississauga-investment-guide-2026-analysis': {
    title: 'Churchill Meadows Investment Guide 2026',
    description:
      'Churchill Meadows rental yields, cap rates and price trends — a full investor breakdown built from live MLS and TRREB data.',
  },
};

/**
 * @returns {{title:string,description:string}|null} null when the post has no
 *   override, so the caller falls back to the stored title/excerpt.
 */
export function getBlogSeoOverride(slug) {
  return BLOG_SEO_OVERRIDES[slug] || null;
}
