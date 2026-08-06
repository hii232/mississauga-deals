/**
 * The written market story for the weekly newsletter.
 *
 * WHY THIS EXISTS
 * ---------------
 * The email shipped tables: average price, days on market, months of inventory.
 * A table cannot tell you when its own headline number is lying, and in July
 * 2026 it was: Mississauga's average sale price fell 11.4% month over month
 * while the median fell 2.3%. That five-fold gap is a MIX shift - fewer
 * expensive detached trades in the month - not eleven percent off the value of
 * a house. A subscriber reading this month's average printed under last
 * month's, with no sentence between them, reads a crash that did not happen.
 *
 * So this module writes the sentence. Every claim is derived from the payload
 * and gated on the data that supports it; nothing is templated prose with a
 * number dropped in.
 *
 * JSX-free and dependency-free ON PURPOSE, same as market-sentences.js: these
 * paragraphs assert figures to ~480 subscribers, so they need tests runnable by
 * plain `node` against a real /api/market-stats payload.
 *
 * THE RULES IT ENCODES
 * --------------------
 *  1. Never call an average move a price move. Compare it against the median
 *     first; when they disagree, say which one to trust and why.
 *  2. Never assert a direction the data does not carry. Every paragraph is
 *     omitted entirely if its inputs are missing - an absent paragraph is
 *     honest, an invented one is not.
 *  3. Sold figures are a monthly board report, not this week's tape. Every
 *     paragraph that uses them names the report month.
 *  4. Posted mortgage rates are not contract rates. If rates are mentioned,
 *     both appear, labelled.
 */

const money = (n) => '$' + Math.round(n).toLocaleString('en-CA');
const num = (n) => Math.round(n).toLocaleString('en-CA');
const pct = (n, dp = 1) => `${Math.abs(n).toFixed(dp)}%`;

/**
 * Strict numeric coercion: null / undefined / '' are MISSING, not zero.
 *
 * `Number(null)` is 0 and `Number.isFinite(0)` is true, so the obvious
 * `Number.isFinite(Number(x))` guard treats an absent figure as a real zero -
 * which is how a missing inventory reading becomes the sentence "Inventory
 * sits at 0 months with homes selling at 0% of asking". A missing figure must
 * drop its paragraph, never furnish one.
 */
function fin(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Percent change from a to b, or null if that cannot be computed. */
function change(a, b) {
  const from = fin(a);
  const to = fin(b);
  if (from == null || to == null || from === 0) return null;
  return ((to - from) / from) * 100;
}

const rose = (n) => (n >= 0 ? 'rose' : 'fell');

/**
 * A month is a MIX shift rather than a value move when the average moves much
 * harder than the median. 2.5x with at least 4 points of daylight: the ratio
 * alone fires on noise (a 0.4% vs 0.1% move is 4x and means nothing), and the
 * gap alone fires when both genuinely moved a lot in the same direction.
 */
const MIX_RATIO = 2.5;
const MIX_MIN_GAP = 4;

function isMixShift(avgCh, medCh) {
  if (avgCh == null || medCh == null) return false;
  if (Math.abs(medCh) < 0.01) return Math.abs(avgCh) >= MIX_MIN_GAP;
  return (
    Math.abs(avgCh) >= Math.abs(medCh) * MIX_RATIO &&
    Math.abs(avgCh) - Math.abs(medCh) >= MIX_MIN_GAP
  );
}

/**
 * Build the story.
 *
 * @param {object} stats a /api/market-stats payload
 * @returns {{headline: string, paragraphs: string[], footnote: string|null}|null}
 *   null when there is nothing honest to say.
 */
export function buildMarketStory(stats) {
  if (!stats) return null;

  const series = Array.isArray(stats.mississaugaMonthly) ? stats.mississaugaMonthly : [];
  const cur = series[series.length - 1] || null;
  const prev = series[series.length - 2] || null;
  const month = stats.tRREBMonth || cur?.month || null;
  if (!cur || !month) return null;

  const paragraphs = [];

  // ── 1. What the headline number did, and whether to believe it ──────────
  const avgCh = prev ? change(prev.avgPrice, cur.avgPrice) : null;
  const medCh = prev ? change(prev.medianPrice, cur.medianPrice) : null;
  let headline = `The ${month} board figures are in.`;

  if (fin(cur.avgPrice) > 0 && avgCh != null && medCh != null) {
    if (isMixShift(avgCh, medCh)) {
      // THE CASE THIS MODULE EXISTS FOR. Lead with the correction, not the
      // scary number, because the scary number is the one that gets quoted.
      headline =
        `Mississauga's average sale price ${rose(avgCh)} ${pct(avgCh)} last month. ` +
        `Most of that is not a price move.`;
      paragraphs.push(
        `The average came in at ${money(cur.avgPrice)} for ${month}, ${pct(avgCh)} ${avgCh >= 0 ? 'above' : 'below'} ` +
        `${prev.month}. The median - the price of the middle house that actually sold - moved only ${pct(medCh)}, ` +
        `to ${money(cur.medianPrice)}. When those two disagree by that much, the average is describing ` +
        `WHICH homes traded, not what homes are worth. ` +
        `${avgCh < 0
          ? 'Fewer sales at the expensive end pulls the average down while leaving the typical house roughly where it was.'
          : 'A handful of high-end trades pulls the average up while leaving the typical house roughly where it was.'} ` +
        `Trust the median this month.`
      );
    } else {
      headline =
        `Mississauga's average sale price ${rose(avgCh)} ${pct(avgCh)} last month, to ${money(cur.avgPrice)}.`;
      paragraphs.push(
        `The ${month} average was ${money(cur.avgPrice)}, ${pct(avgCh)} ${avgCh >= 0 ? 'above' : 'below'} ${prev.month}. ` +
        `The median moved ${pct(medCh)} to ${money(cur.medianPrice)} - the two agree, so this reads as a genuine ` +
        `${avgCh >= 0 ? 'firming' : 'softening'} rather than a change in what happened to be selling.`
      );
    }
  } else if (fin(cur.avgPrice) > 0 && fin(cur.medianPrice) > 0) {
    // No prior month to compare against - state the levels, claim no direction.
    headline = `Mississauga's ${month} board figures are in.`;
    paragraphs.push(
      `The ${month} average sale price was ${money(cur.avgPrice)} against a median of ${money(cur.medianPrice)}. ` +
      `There is no prior month loaded to compare against, so this is a level, not a trend.`
    );
  }

  // ── 2. Supply vs demand: who is actually withdrawing ────────────────────
  // The most useful thing in a Market Watch is rarely the price. It is whether
  // listings are leaving faster than buyers are.
  const salesCh = prev ? change(prev.sales, cur.sales) : null;
  const listCh = prev ? change(prev.newListings, cur.newListings) : null;
  const gtaListYoy = fin(stats.gtaNewListingsYoy);
  const gtaSalesYoy = fin(stats.gtaSalesYoy);

  if (salesCh != null && listCh != null) {
    const supplyLeavingFaster = listCh < salesCh - 1;
    let p =
      `${num(cur.sales)} homes sold in Mississauga in ${month}, ${pct(salesCh)} ${salesCh >= 0 ? 'more' : 'fewer'} ` +
      `than ${prev.month}, against ${num(cur.newListings)} new listings (${pct(listCh)} ${listCh >= 0 ? 'more' : 'fewer'}). `;
    if (supplyLeavingFaster) {
      p +=
        `Sellers pulled back harder than buyers did. That is what keeps a soft market from turning into a falling one: ` +
        `fewer listings competing means the ones that stay do not have to cut as deep.`;
    } else if (salesCh < listCh - 1) {
      p +=
        `Buyers stepped back harder than sellers did, which is the combination that widens negotiating room ` +
        `from here rather than closing it.`;
    } else {
      p += `Both moved together, so the balance of the market is roughly where it was.`;
    }
    if (gtaListYoy != null && gtaSalesYoy != null) {
      p +=
        ` Across the GTA the same year-over-year pattern is clearer still: sales ${rose(gtaSalesYoy)} ${pct(gtaSalesYoy)} ` +
        `while new listings ${rose(gtaListYoy)} ${pct(gtaListYoy)}.`;
    }
    paragraphs.push(p);
  }

  // ── 3. What it means at the negotiating table ───────────────────────────
  const mos = fin(stats.mississaugaMonthsOfInventory);
  const splp = fin(stats.mississaugaAvgSPLP);
  const ldom = fin(stats.mississaugaAvgLDOM);
  const domCh = prev && fin(prev.ldom) != null && fin(cur.ldom) != null ? fin(cur.ldom) - fin(prev.ldom) : null;

  if (mos != null && splp != null) {
    // 4+ months of inventory is the conventional buyer's-market line; under 2
    // is a seller's market. Between them is genuinely balanced and should not
    // be sold as either.
    const posture =
      mos >= 4 ? "a buyer's market" : mos <= 2 ? "a seller's market" : 'a balanced market';
    let p =
      `Inventory sits at ${mos} months with homes selling at ${splp}% of asking` +
      (ldom != null ? `, after an average ${ldom} days on market` : '') +
      `. That is ${posture} on the conventional reading`;
    p +=
      splp >= 96 && mos >= 4
        ? `, though a ${splp}% sale-to-list ratio says sellers are holding closer to their price than the inventory figure alone suggests. The room to negotiate is real but it is a few percent, not a rout.`
        : '.';
    if (domCh != null && domCh !== 0) {
      p +=
        ` Homes took ${Math.abs(domCh)} day${Math.abs(domCh) === 1 ? '' : 's'} ${domCh > 0 ? 'longer' : 'less'} to sell than in ${prev.month}` +
        `${domCh > 0 ? ' - patience is shifting toward the buyer' : ' - the market is moving slightly faster'}.`;
    }
    paragraphs.push(p);
  }

  // ── 4. The financing reality behind all of it ──────────────────────────
  const rates = stats.rates || {};
  const posted5 = fin(rates.fixed5yr);
  const contract = fin(rates.contractRateAssumption);
  const boc = fin(stats.economic?.bocRate);
  if (posted5 != null && contract != null) {
    let p =
      `None of this moves without financing. The posted five-year fixed is ${posted5}%, but posted is not what anyone signs - ` +
      // "in this email", not "below": this paragraph must not assume where the
      // story was placed relative to the deals, or moving one block silently
      // makes the other one lie.
      `a realistic discounted contract rate is nearer ${contract}%, and that is the number every cash-flow figure in ` +
      `this email is underwritten at.`;
    if (boc != null) {
      p += ` The Bank of Canada policy rate is ${boc}%.`;
    }
    p += ` Get your actual rate from a broker before you shop: it decides which neighbourhoods are even on your list.`;
    paragraphs.push(p);
  }

  if (paragraphs.length === 0) return null;

  // Sold figures are a monthly board report. Say so once, at the bottom, so no
  // paragraph above has to keep apologising for it.
  const footnote = stats.tRREBAsOf
    ? `Sold figures are TRREB Market Watch for ${month} (as of ${stats.tRREBAsOf}) - a monthly board report, not this week's tape. Active-listing counts and scores above are live.`
    : null;

  return { headline, paragraphs, footnote };
}
