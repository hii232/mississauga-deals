/**
 * Days-on-market, computed honestly — or not at all.
 *
 * WHY THIS EXISTS (measured against production on 2026-07-27, not assumed):
 * both listing feeds used to fall back to `ModificationTimestamp` when no real
 * market-timing field was present. That stamp is the feed's sync/modify time,
 * so the "days on market" it produced tracked WHEN WE LAST SYNCED THE ROW, not
 * how long the property had been for sale. The failure is inverted, which is
 * what made it dangerous rather than merely imprecise:
 *
 *   - a listing that has sat for 200 days but had a price change this morning
 *     reported dom 0, and rendered the "New" badge
 *   - a listing nobody had touched in 45 days reported dom 45, and rendered
 *     the "Motivated Seller" badge — purely because it was quiet in the feed
 *
 * Proof it was the sync date: every listing on page 1 of /api/listings (synced
 * that morning) returned dom 0, and every listing on page 300 (synced 12 days
 * earlier) returned dom 11. The number moved with the sync, in lockstep, across
 * the whole page.
 *
 * WHAT THE FEED ACTUALLY GIVES US TODAY: nothing usable for active listings.
 *
 * `OnMarketDate`, `ListingContractDate` and `OriginalEntryTimestamp` cannot even
 * be REQUESTED — naming any of them in a $select makes AMPRE reject the entire
 * query (see the toxic-group note in app/api/listings/route.js). They are read
 * below anyway, harmlessly, so that the day the feed starts serving them this
 * function picks them up with no other change.
 *
 * `DaysOnMarket` is a valid field that simply comes back null on ACTIVE
 * listings. Verified through /api/listing-single, which reads it directly with
 * NO fallback and still returned 0 for W13238264 — a listing that had already
 * taken a 2% price cut, so it demonstrably was not listed that day. The same
 * feed DOES supply real DaysOnMarket on Closed/Leased records, which is why
 * /api/rental-comps shows genuine values. That asymmetry is the classic
 * IDX-vs-VOW suppression signature, so this may ultimately be a token/licensing
 * fix rather than a code one — see IMPROVEMENT_BACKLOG.md "Needs Hamza".
 *
 * So: dom is 0 when unknown, and 0 already means "no data" to every consumer in
 * this codebase (the New badge requires >= 1, Motivated requires >= 45, the
 * deal score adds no bonus at 0). Nothing fabricates. The moment the feed does
 * start supplying a real field, this function picks it up with no other change.
 */
export function computeDaysOnMarket(l) {
  // A listing's own market-timing fields. Each is stamped once, for that
  // listing, when it came to market — so unlike ModificationTimestamp they
  // cannot all move together across a page when a sync runs.
  const listDate = l.OnMarketDate || l.ListingContractDate || l.OriginalEntryTimestamp;
  if (listDate) {
    const diff = Math.floor((Date.now() - new Date(listDate).getTime()) / 86400000);
    // A listing entered TODAY computes diff 0, which would collide with the
    // 0-means-unknown sentinel — the newest listings on the site (the ones the
    // New badge exists for) would render "—" and never earn the badge. Clamp
    // same-day to 1: "day one on market", the same convention the badge's
    // dom >= 1 check was written against.
    if (diff >= 0 && diff < 1000) return Math.max(diff, 1);
  }
  // The feed's own count, when it supplies one. Guarded to a positive number so
  // a null/0/NaN can never be mistaken for a real "listed today".
  const feedDom = Number(l.DaysOnMarket);
  if (Number.isFinite(feedDom) && feedDom > 0 && feedDom < 1000) return feedDom;
  return 0; // unknown
}

/**
 * The honest thing ModificationTimestamp CAN tell us: how long since this
 * listing's record last changed. Exposed under its true name so the UI can use
 * it without implying it is time-on-market. null when unknown — never 0, since
 * 0 legitimately means "updated today".
 */
export function computeDaysSinceUpdate(l) {
  if (!l.ModificationTimestamp) return null;
  const d = Math.floor((Date.now() - new Date(l.ModificationTimestamp).getTime()) / 86400000);
  return d >= 0 && d < 1000 ? d : null;
}

/**
 * TRUE lower bound on days-on-market — never a fabrication, and never a number
 * that is the same for every listing on the page.
 *
 * `daysSinceUpdate` USED TO FEED THIS AND MUST NOT. It derives from
 * ModificationTimestamp, and both feeds query `$orderby=ModificationTimestamp
 * desc` — so every listing on a given page shares essentially the same stamp.
 * The floor was therefore identical across the whole page ("3+ days on market"
 * on all ~100 cards), which is the ORIGINAL sync-stamp bug this module was
 * created to kill, wearing a plus sign. It was a true lower bound and still
 * carried zero per-listing information, which is worse than showing nothing:
 * a uniform number reads as real data and is not.
 *
 * Only genuinely per-listing signals count:
 *   - the feed's own DaysOnMarket (stamped per listing)
 *   - days since WE first saw this listing (per listing, from the tracker)
 * 0 = nothing known, and every consumer renders that as an em dash.
 */
export function computeDomFloor(dom, _daysSinceUpdateIgnored, daysSinceFirstSeen) {
  return Math.max(
    Number(dom) > 0 ? Number(dom) : 0,
    Number.isFinite(daysSinceFirstSeen) ? daysSinceFirstSeen : 0,
  );
}

/**
 * TREB serves square footage as a banded RANGE string ("700-799", "1500-2000"),
 * not a number — which is why the numeric LivingArea/BuildingAreaTotal fields
 * come back unusable and $/sqft has been blank site-wide.
 *
 * Returns the midpoint of the band, or 0 when nothing parseable is present.
 * The midpoint (not the lower bound) because this value feeds the $/sqft
 * display and the sqft-based condo-fee estimate, and systematically biasing
 * either low or high would skew both. It is an approximation of a band, so any
 * surface showing it should label it as approximate.
 */
export function parseLivingAreaRange(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return Math.round(raw);
  if (typeof raw !== 'string') return 0;
  const nums = raw.match(/\d[\d,]*/g);
  if (!nums || nums.length === 0) return 0;
  // Keep a ZERO lower bound: TREB's smallest band is literally "0-499", and
  // discarding the 0 turned it into the single value 499 — the top of the band
  // reported as the unit's size, on exactly the smallest units where a ~2x
  // overstatement does the most damage to $/sqft.
  const vals = nums.map((n) => Number(n.replace(/,/g, ''))).filter((n) => Number.isFinite(n) && n >= 0);
  if (vals.length === 0) return 0;
  const mid = vals.length >= 2 ? (vals[0] + vals[1]) / 2 : vals[0];
  return mid > 0 && mid < 100000 ? Math.round(mid) : 0;
}
