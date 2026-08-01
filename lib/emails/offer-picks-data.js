/**
 * "What I'd offer" campaign — picking the listings and computing the numbers.
 *
 * Dependency-free on purpose so it is unit-testable without booting Next
 * (see offer-picks-data.test.mjs). This module decides what a subscriber is
 * told to offer on a real, named property — the highest-stakes number this
 * codebase produces. It must be defensible line by line.
 *
 * WHAT THE OPENING OFFER IS ANCHORED TO
 * -------------------------------------
 * Not a model, not a guess: the sale-to-list ratio that property type ACTUALLY
 * achieved in Mississauga last month, from the TRREB Market Watch report
 * (market-stats' salesByType). Detached sold at 96% of ask, condo apartments
 * 97%, freehold townhouses 101%. That ratio is the starting point, and the only
 * adjustments are two pieces of evidence carried by the listing itself:
 *
 *   1. It has sat longer than that type typically takes to sell.
 *   2. The seller has already cut the price once — proof they will move.
 *
 * Both adjustments are capped, hard. An opening offer is a negotiating
 * position, not a fantasy: past a few points below what the market is actually
 * paying, you don't get a discount, you get ignored, and the email loses the
 * credibility that makes anyone reply to it.
 *
 * WHAT IT IS NOT
 * --------------
 * Not an appraisal, not a valuation, not a statement about what the property is
 * worth. It is where a buyer might reasonably open, given comparable sales and
 * how long this one has been waiting. The email says so in those words.
 */

// TRREB category -> the listing `type` values that map onto it. Duplex,
// Triplex, Fourplex and Multiplex have NO TRREB category in this report, so
// they are excluded from picks entirely rather than anchored to a ratio that
// does not describe them.
const TYPE_MAP = {
  Detached: 'detached',
  'Semi-Detached': 'semiDetached',
  Condo: 'condoApt',
  // Townhouse is resolved at runtime — see resolveTypeKey.
};

// An opening offer never goes further below the market ratio than this, no
// matter how long a place has sat. Beyond it you are not negotiating.
const MAX_POINTS_BELOW_RATIO = 4;

// Absolute floor as a % of ask, whatever the arithmetic says.
const ABSOLUTE_FLOOR_PCT = 88;

// You do not OPEN above the asking price, even where the type sells over ask.
const MAX_OPEN_PCT = 100;

// Points of leverage granted for sitting unusually long, and for having
// already cut. Deliberately small.
const MAX_DOM_POINTS = 3;
const CUT_POINTS = 1;

/**
 * Which TRREB category a listing belongs to.
 *
 * `mapType` collapses freehold and condo townhouses into one "Townhouse", but
 * they behaved very differently last month (freehold sold at 101% of ask,
 * condo townhouses at 98%) so the anchor genuinely matters. A condo fee is the
 * available signal: condo townhouses carry one, freehold generally does not.
 *
 * When there is no fee to go on, fall back to the FREEHOLD ratio — that is the
 * higher of the two, which produces a HIGHER offer and therefore understates
 * the buyer's leverage. Guessing wrong in that direction costs a few thousand
 * dollars of negotiating room; guessing wrong the other way tells someone to
 * lowball a property that sells over ask, and loses them the deal.
 */
export function resolveTypeKey(listing) {
  if (listing?.type === 'Townhouse') {
    return Number(listing.condoFee) > 0 ? 'condoTown' : 'townhouse';
  }
  return TYPE_MAP[listing?.type] || null;
}

/**
 * Compute the opening offer for one listing.
 * Returns null when it cannot be computed honestly — the caller drops the
 * listing rather than showing a number with a hole in it.
 */
export function openingOffer(listing, salesByType) {
  const key = resolveTypeKey(listing);
  const stats = key && salesByType ? salesByType[key] : null;
  const ask = Number(listing?.price) || 0;
  if (!stats || !(stats.spLp > 0) || !(stats.ldom > 0) || ask <= 0) return null;

  const dom = Number(listing.dom) || 0;
  const cut = Number(listing.priceDrop) || 0;

  // Leverage 1 — sat longer than the type typically takes.
  // Zero when days-on-market is unknown (0): no evidence, no claim.
  const overrun = dom > stats.ldom ? (dom - stats.ldom) / stats.ldom : 0;
  const domPoints = Math.min(MAX_DOM_POINTS, overrun * MAX_DOM_POINTS);

  // Leverage 2 — already cut, so the seller has shown they will move.
  const cutPoints = cut >= 1 ? CUT_POINTS : 0;

  let pct = stats.spLp - domPoints - cutPoints;
  pct = Math.max(pct, stats.spLp - MAX_POINTS_BELOW_RATIO);
  pct = Math.max(pct, ABSOLUTE_FLOOR_PCT);
  pct = Math.min(pct, MAX_OPEN_PCT);

  const offer = Math.round((ask * pct) / 100 / 1000) * 1000;

  return {
    typeKey: key,
    offer,
    pctOfAsk: Math.round(pct * 10) / 10,
    marketRatio: stats.spLp,
    typeLdom: stats.ldom,
    dom,
    priceDrop: cut,
    // Whether each piece of leverage actually applied — the email states only
    // the reasons that are real for this listing.
    usedDom: domPoints > 0.05,
    usedCut: cutPoints > 0,
    belowAsk: ask - offer,
  };
}

/**
 * Rank listings by how much genuine negotiating leverage they carry, and
 * return the top `count` — at most one per neighbourhood so the email doesn't
 * show three units in the same building.
 */
export function pickDeals(listings, salesByType, count = 3) {
  const scored = (listings || [])
    .filter((l) => {
      if (!l || !l.address || !(Number(l.price) > 0)) return false;
      // The premise of the email is "this one has been sitting". Without a real
      // days-on-market there is no premise — and DOM of 0 means unknown here,
      // not new (see lib/listings/market-timing.js).
      if (!(Number(l.dom) > 0)) return false;
      // A named property with no photo reads as a placeholder.
      if (!(l.photos?.length || l.images?.length)) return false;
      // Sanity band: obvious feed junk shouldn't reach a subscriber.
      if (l.price < 300000 || l.price > 3000000) return false;
      return !!resolveTypeKey(l);
    })
    .map((l) => {
      const o = openingOffer(l, salesByType);
      if (!o) return null;
      // Leverage score: how far past its type's usual selling time it has sat,
      // plus a real weight for having already cut.
      const overrun = o.typeLdom > 0 ? (o.dom - o.typeLdom) / o.typeLdom : 0;
      const score = Math.max(0, overrun) + (o.priceDrop >= 1 ? 1.5 : 0);
      return { listing: l, offer: o, score };
    })
    .filter(Boolean)
    .filter((x) => x.score > 0) // no leverage, no story
    // A type that sells at or over ask can compute an offer equal to the ask
    // once the caps apply (freehold towns sold at 101% last month). That is a
    // correct answer — "don't lowball this one" — but it is not a pick. Drop
    // it here so it never reaches validatePicks as a contradiction.
    .filter((x) => x.offer.offer < Number(x.listing.price))
    .sort((a, b) => b.score - a.score);

  const picked = [];
  const seenHood = new Set();
  for (const cand of scored) {
    const hood = cand.listing.neighbourhood || cand.listing.city || '';
    if (seenHood.has(hood)) continue;
    seenHood.add(hood);
    picked.push(cand);
    if (picked.length === count) break;
  }
  // If neighbourhood diversity couldn't fill the slots, top up by score.
  if (picked.length < count) {
    for (const cand of scored) {
      if (picked.includes(cand)) continue;
      picked.push(cand);
      if (picked.length === count) break;
    }
  }
  return picked;
}

/**
 * Validate everything before a single email is composed.
 * Returns { data, reason }; a null `data` means DO NOT SEND.
 */
export function validatePicks(picks, salesByType, month) {
  const checks = [
    [!!month, 'no TRREB month — cannot say what the offer ratios are based on'],
    [!!salesByType && Object.keys(salesByType).length >= 5,
      'salesByType incomplete — offer anchors unavailable'],
    [picks.length === 3, `only ${picks.length} listing(s) qualified — need 3`],
    [picks.every((p) => p.offer && p.offer.offer > 0), 'a pick has no computable offer'],
    [picks.every((p) => p.offer.offer < p.listing.price),
      'an offer is not below its asking price'],
    [picks.every((p) => p.offer.pctOfAsk >= ABSOLUTE_FLOOR_PCT),
      'an offer fell below the credibility floor'],
    [picks.every((p) => p.listing.address && p.listing.address.length > 5),
      'a pick has no usable address'],
    [new Set(picks.map((p) => p.listing.id)).size === picks.length,
      'the same listing was picked twice'],
  ];
  const failed = checks.filter(([ok]) => !ok).map(([, why]) => why);
  if (failed.length) return { data: null, reason: failed.join('; ') };
  return { data: { picks, month }, reason: null };
}

export const LIMITS = {
  MAX_POINTS_BELOW_RATIO, ABSOLUTE_FLOOR_PCT, MAX_OPEN_PCT, MAX_DOM_POINTS, CUT_POINTS,
};
