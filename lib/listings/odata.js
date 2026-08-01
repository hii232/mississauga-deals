/**
 * Escaping for values that reach the AMPRE OData feed.
 *
 * Every one of our feed queries is built by string concatenation, so any
 * request parameter that lands inside a `$filter` decides how that filter
 * PARSES, not just what it matches. `/api/listings-gta?city=` shipped that way
 * (fixed in the "eight /gta city pages showed zero listings" run): a caller
 * could close our string literal with a quote and append their own OData —
 * dropping `StandardStatus eq 'Active'`, the price floor, or the commercial
 * exclusions, and reading rows through our VOW token that the site never
 * intends to publish. This module is the one place that stops it, so a second,
 * subtly different escaper cannot drift into existence.
 *
 * Numeric parameters coerced with `parseInt`/`Number`/`parseFloat` need
 * nothing further — a number has no quote to escape — and are deliberately
 * left alone throughout the API routes.
 */

/**
 * A value going inside an OData string literal, e.g. `City eq '<value>'`.
 * OData escapes a single quote by doubling it. Use this whenever the finished
 * filter is passed through `encodeURIComponent`.
 */
export const odataStr = (s) => String(s).replace(/'/g, "''");

/**
 * A value going into a URL *outside* an encoded `$filter` — an entity key in
 * the path (`/Property('<key>')`) or a hand-assembled query string. Doubles
 * the quote for OData, then percent-encodes so `&`, `?`, `#` and `/` cannot
 * add, split or terminate query parameters. `encodeURIComponent` leaves `'`
 * untouched, so the doubling survives the encoding.
 */
export const odataKey = (s) => encodeURIComponent(odataStr(s));
