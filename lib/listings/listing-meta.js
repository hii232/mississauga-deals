/**
 * The <title> and meta description for a listing detail page.
 *
 * WHY THIS EXISTS (2026-08-06, from the Semrush site audit)
 * --------------------------------------------------------
 * Listing detail pages are 5,382 of the 5,582 URLs in the sitemap - 96% of the
 * site. Their titles were built by concatenation and then had the root layout's
 * ` | MississaugaInvestor.ca` template appended, which put a live page at:
 *
 *   3650 Baird Court, Erin Mills, Mississauga - Detached for Sale $1,524,900 | MississaugaInvestor.ca
 *   ^-- 97 characters. Google renders about 60.
 *
 * So what a searcher actually saw was "…Erin Mills, Mississauga - Detached for
 * Sa" and the PRICE - the single strongest click driver in a real-estate result
 * - never reached them. The brand suffix that pushed it over never rendered
 * either: it cost 24 characters and bought nothing. Every other page on this
 * site already sets `title: { absolute: ... }` for exactly this reason; the
 * listing route was the one that didn't.
 *
 * THE RULE HERE: a title is a CHARACTER BUDGET, not a string. Build the richest
 * version that fits in 60 and drop detail from the least valuable end when it
 * doesn't. Priority, highest first:
 *
 *   1. address  - this is the query. Street-address searches are what these
 *                 pages win, and it is never dropped.
 *   2. price    - the hook. Kept ahead of city, type and "for Sale".
 *   3. neighbourhood - targets the street+community query and is what makes
 *                 ~5,400 titles genuinely distinct from one another.
 *   4. type / city / the words "for Sale" - dropped first.
 *
 * NOTHING IS TRUNCATED MID-WORD and nothing is invented. A field that is
 * missing drops its whole clause rather than rendering "0 bed" or an empty
 * "$" - the same omit-never-fake rule the rest of the site runs on. A "5 bed, 0
 * bath" listing is a feed gap, not a bathless house, and saying so in a meta
 * description would be a wrong number in front of a buyer.
 */

/** Google renders roughly this much of a title and description. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/**
 * First candidate that fits the budget, else the shortest one built.
 * Candidates are supplied longest-first; a candidate containing a blank
 * required part is skipped rather than rendered with a hole in it.
 */
function firstFitting(candidates, max) {
  const built = candidates.filter(Boolean).map((s) => s.replace(/\s+/g, ' ').trim());
  return built.find((s) => s.length <= max) || built[built.length - 1] || '';
}

/**
 * @param {{address?:string, city?:string, neighbourhood?:string, type?:string,
 *          price?:number}} listing
 * @returns {string} a title of at most 60 characters unless the address alone
 *   is longer, in which case the address wins - it is the query.
 */
export function buildListingTitle({ address, city, neighbourhood, type, price } = {}) {
  const addr = (address || '').trim();
  if (!addr) return '';
  const town = (city || '').trim();
  // Only when it adds information: the upstream fallback sets neighbourhood =
  // city, and "Mississauga, Mississauga" reads as a bug in the SERP.
  const hood = neighbourhood && neighbourhood.trim() !== town ? neighbourhood.trim() : '';
  const kind = (type || '').trim();
  const cost = Number.isFinite(price) && price > 0 ? `$${price.toLocaleString('en-CA')}` : '';

  const where = hood && town ? `${hood}, ${town}` : hood || town;

  return firstFitting(
    [
      // Everything, in the order a listing reads.
      where && kind && cost && `${addr}, ${where} - ${kind} for Sale ${cost}`,
      // "for Sale" is implied by a price on a listing page.
      where && kind && cost && `${addr}, ${where} - ${kind} ${cost}`,
      // Drop the city, keep the community - it is the more specific query.
      hood && kind && cost && `${addr}, ${hood} - ${kind} ${cost}`,
      town && kind && cost && `${addr}, ${town} - ${kind} ${cost}`,
      // Type goes before price does.
      hood && cost && `${addr}, ${hood} - ${cost}`,
      town && cost && `${addr}, ${town} - ${cost}`,
      cost && `${addr} - ${cost}`,
      // No price in the feed at all: keep the place instead.
      where && kind && `${addr}, ${where} - ${kind}`,
      where && `${addr}, ${where}`,
      town && `${addr}, ${town}`,
      addr,
    ],
    TITLE_MAX
  );
}

/**
 * @returns {string} a description of at most 155 characters. Beds/baths are
 *   omitted entirely when the feed reports zero for them.
 */
export function buildListingDescription({ address, city, neighbourhood, type, price, beds, baths } = {}) {
  const addr = (address || '').trim();
  if (!addr) return '';
  const town = (city || '').trim();
  const hood = neighbourhood && neighbourhood.trim() !== town ? neighbourhood.trim() : '';
  const kind = (type || '').trim() || 'Property';
  const cost = Number.isFinite(price) && price > 0 ? `$${price.toLocaleString('en-CA')}` : '';
  const where = hood && town ? `${hood}, ${town}` : hood || town;

  // A zero here means the feed did not carry the field. Printing "0 bath" in a
  // search result would be a wrong number about a real property.
  const rooms = [
    Number(beds) > 0 ? `${beds} bed` : '',
    Number(baths) > 0 ? `${baths} bath` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const at = where ? `${addr}, ${where}` : addr;
  const facts = [rooms, cost].filter(Boolean).join(', ');
  const lead = `${kind} for sale at ${at}.`;
  const shortLead = `${kind} at ${at}.`;

  return firstFitting(
    [
      facts && `${lead} ${facts}. Cash flow, cap rate and deal score from live MLS data.`,
      facts && `${lead} ${facts}. Cash flow, cap rate and deal score.`,
      facts && `${shortLead} ${facts}. Cash flow and cap rate analysis.`,
      cost && `${shortLead} ${cost}. Cash flow and cap rate analysis.`,
      facts && `${shortLead} ${facts}.`,
      `${shortLead} Cash flow and cap rate analysis.`,
      shortLead,
    ],
    DESCRIPTION_MAX
  );
}
