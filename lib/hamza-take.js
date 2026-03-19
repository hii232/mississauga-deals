/**
 * Generate Hamza's natural-language investment commentary for a listing
 */
export function generateHamzaTake(l) {
  const parts = [];
  const price = l.price || 0;
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
  } else if (dom < 14) {
    parts.push(
      `Fresh listing — this ${beds}-bed ${typeLabel} in ${hood} just hit the market ${dom} days ago. Move fast if you're interested.`
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
      `Legal basement suite detected — this is a dual-income property. The potential cash flow includes ~$${fmt(basementIncome)}/mo in basement rental income. Verify the current tenant situation and that the suite is still legally registered.`
    );
  } else if (basementTier === 'potential') {
    parts.push(
      `Separate entrance and finished basement suggest this could be converted to a legal suite. Check with the City of Mississauga for permits — if approved, you're looking at an extra ~$${fmt(basementIncome)}/mo in rental income, which changes the whole deal.`
    );
  } else if (basementTier === 'finished') {
    parts.push(
      `Finished basement noted but no separate entrance — not immediately rentable as a suite, but it's a value-add opportunity. Adding a separate entrance and legalizing it could unlock $1,550-2,100/mo in basement income.`
    );
  }

  // LRT corridor
  if (lrt) {
    parts.push(
      `Located along the Hurontario LRT corridor — when that line opens, expect upward pressure on both rents and values.`
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
