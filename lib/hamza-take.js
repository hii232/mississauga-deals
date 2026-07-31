/**
 * Generate Hamza's natural-language investment commentary for a listing
 */
export function generateHamzaTake(l) {
  const parts = [];
  const price = l.price || 0;
  // 0 = UNKNOWN age, never "listed today" (lib/listings/market-timing.js).
  // Every branch below that makes an age claim must test `dom >= 1` first.
  const dom = l.dom || 0;
  const drop = l.priceDrop || 0;
  const cf = l.cashFlow;
  const cap = l.capRate;
  const score = l.hamzaScore;
  const beds = l.beds || 0;
  const type = l.type || '';
  const hood = l.neighbourhood || 'Mississauga';
  const basementTier = l.basementTier;
  const basementIncome = l.basementIncome || 0;
  const hasSuite = l.hasSuite;
  const lrt = l.lrtAccess;
  const fmt = (n) => '$' + Math.abs(n).toLocaleString();

  // Opening — property identity + standout trait
  const typeLabel = type.toLowerCase().includes('condo')
    ? 'condo'
    : type.toLowerCase().includes('semi')
      ? 'semi'
      : type.toLowerCase().includes('town') || type.toLowerCase().includes('row')
        ? 'townhouse'
        : 'detached';

  if (dom > 90 && drop > 3) {
    parts.push(
      `This ${beds}-bed ${typeLabel} in ${hood} has been sitting for ${dom} days with a ${drop}% price drop — that's motivated seller territory.`
    );
  } else if (dom > 90) {
    parts.push(
      `${dom} days on market for this ${beds}-bed ${typeLabel} in ${hood} — it's been lingering, which means there's room to negotiate.`
    );
  } else if (drop > 5) {
    parts.push(
      `A ${drop}% price cut on this ${beds}-bed ${typeLabel} in ${hood} signals the seller is ready to talk. Worth exploring.`
    );
  } else if (dom >= 1 && dom <= 7) {
    // `dom >= 1` IS THE WHOLE POINT OF THIS BRANCH'S GUARD. dom 0 means the
    // feed gave us no age (lib/listings/market-timing.js), and the old test
    // was a bare `dom < 14` — so every listing of UNKNOWN age produced
    // "Fresh listing — … just hit the market 0 days ago. Move fast if you're
    // interested." That sentence renders under Hamza's name and headshot in
    // the "Hamza's Take" tab: a fabricated fact, in a named human's voice,
    // urging the reader to act on it. Worst-case surface for the sentinel.
    // Unknown age now falls through to the neutral opener below.
    // 1–7 days matches the site's own "New" badge (listing-card.js), so the
    // prose and the badge make the same claim; 8–13 no longer reads as
    // "just hit the market" when it plainly didn't.
    parts.push(
      `Fresh listing — this ${beds}-bed ${typeLabel} in ${hood} hit the market ${dom} day${dom === 1 ? '' : 's'} ago. Move fast if you're interested.`
    );
  } else {
    parts.push(
      `A ${beds}-bed ${typeLabel} in ${hood} listed at ${fmt(price)} — let's break down the investment potential.`
    );
  }

  // Cash flow analysis
  if (cf >= 200) {
    parts.push(
      `Cash flow estimate of +${fmt(cf)}/mo is strong for Mississauga — positive cash flow is rare here, and this one delivers.`
    );
  } else if (cf >= 0) {
    parts.push(
      `Roughly breaking even on cash flow at ${cf >= 0 ? '+' : ''}${fmt(cf)}/mo — in Mississauga, break-even IS the win. Most properties here run negative.`
    );
  } else if (cf >= -500) {
    parts.push(
      `Negative cash flow of -${fmt(Math.abs(cf))}/mo is typical for Mississauga. You're betting on appreciation here, which the GTA has delivered historically.`
    );
  } else {
    parts.push(
      `Cash flow is deep negative at -${fmt(Math.abs(cf))}/mo. Unless you have a specific value-add play (suite conversion, reno), the carrying cost is heavy.`
    );
  }

  // Cap rate
  if (cap >= 5) {
    parts.push(`Cap rate of ${cap}% is above average for the area — solid yield.`);
  } else if (cap >= 3.5) {
    parts.push(`${cap}% cap rate is in line with Mississauga norms.`);
  } else if (cap > 0) {
    parts.push(`Cap rate of ${cap}% is on the lower side — you're paying a premium here.`);
  }

  // Basement tier analysis
  if (basementTier === 'legal') {
    parts.push(
      `Legal basement suite detected — this is a dual-income property. The potential cash flow includes ~${fmt(basementIncome)}/mo in basement rental income. Verify the current tenant situation and that the suite is still legally registered.`
    );
  } else if (basementTier === 'potential') {
    parts.push(
      `Separate entrance and finished basement suggest this could be converted to a legal suite. Check with the City of Mississauga for permits — if approved, you're looking at an extra ~${fmt(basementIncome)}/mo in rental income, which changes the whole deal.`
    );
  } else if (basementTier === 'finished') {
    parts.push(
      `Finished basement noted but no separate entrance — not immediately rentable as a suite, but it's a value-add opportunity. Adding a separate entrance and legalizing it could unlock $1,400-2,000/mo in basement income.`
    );
  }

  // LRT corridor
  if (lrt) {
    parts.push(
      `Located along the Hurontario LRT corridor — when that line opens, expect upward pressure on both rents and values.`
    );
  }

  // Transit score
  if ((l.transitScore || 0) >= 8) {
    parts.push(
      `Transit score of ${l.transitScore}/10 — excellent connectivity with GO, LRT, and major bus routes. Transit-rich properties command higher rents and appreciate faster.`
    );
  } else if ((l.transitScore || 0) >= 6 && !lrt) {
    parts.push(
      `Decent transit access (${l.transitScore}/10) — MiWay routes and reasonable highway access.`
    );
  }

  // School score
  if ((l.schoolScore || 0) >= 8) {
    parts.push(
      `Top-rated school district (${l.schoolScore}/10) — strong family rental demand and stable long-term values.`
    );
  } else if ((l.schoolScore || 0) >= 6) {
    parts.push(
      `Good schools nearby (${l.schoolScore}/10) — attracts family tenants, which means lower turnover.`
    );
  }

  // Price drop opportunity
  if (drop > 0 && dom > 60) {
    parts.push(
      `With ${dom} DOM and a ${drop}% reduction already, I'd offer ${drop > 5 ? '10-12' : '5-8'}% below asking and see what happens.`
    );
  }

  // Score verdict
  if (score >= 8) {
    parts.push(
      `Overall score: ${score}/10. This is one of the stronger deals in the current Mississauga market. Worth a showing.`
    );
  } else if (score >= 6.5) {
    parts.push(
      `Overall score: ${score}/10. Solid fundamentals — not a home run, but a reliable play if the numbers check out on your inspection.`
    );
  } else if (score >= 5) {
    parts.push(
      `Overall score: ${score}/10. Middle of the pack. Could work with the right negotiation or value-add strategy.`
    );
  } else {
    parts.push(
      `Overall score: ${score}/10. The numbers are tough on this one. I'd only pursue it if you're getting a significant discount off asking.`
    );
  }

  return parts.join(' ');
}
