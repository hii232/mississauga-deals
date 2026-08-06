/**
 * Sentence assembly for the /market-pulse quotable summary.
 *
 * JSX-free and dependency-free ON PURPOSE: the component that renders this
 * imports next/link, which a plain `node` test cannot load. Same split as
 * lib/market/trreb-freshness.js, and for the same reason - these sentences
 * assert live figures to the public and to any model quoting the page, so
 * they need tests against a real payload.
 */

const fmtMoney = (n) => '$' + Math.round(n).toLocaleString('en-CA');
const fmt = (n) => Number(n).toLocaleString('en-CA');

/**
 * Pure sentence assembly, exported so it can be unit-tested against a real
 * /api/market-stats payload. The component below only renders what this
 * returns - which is why the numbers in the prose cannot drift from the API.
 *
 * @returns {{live: string[], leverage: string[], trreb: string[]}|null}
 *   null when there is nothing honest to say (no stats, or no active count).
 */
export function buildMarketSentences(stats, asOfLabel) {
  if (!stats) return null;

  const s = stats.screener || {};
  const active = Number(stats.activeCount) || 0;
  // Nothing to say without the anchor figure.
  if (!active) return null;

  // ── Live sentences, each gated on its own field ──
  const live = [];
  live.push(
    `As of ${asOfLabel}, MississaugaInvestor.ca is tracking ${fmt(active)} active residential listings in Mississauga and scoring each one for investment return.`
  );
  if (Number(s.total) > 0 && s.cfPlusCount != null) {
    live.push(
      `Of the ${fmt(s.total)} listings scored, ${fmt(s.cfPlusCount)} are cash-flow positive at 20% down and a 4.89% contract rate.`
    );
  }
  if (Number(s.bestCap) > 0) {
    live.push(`The highest cap rate on the active market is ${s.bestCap}%.`);
  }
  if (Number(s.suites) > 0) {
    live.push(`${fmt(s.suites)} listings show second-suite potential, which is what most cash-flowing properties in this market rely on.`);
  }

  // ── Buyer-leverage sentences ──
  const leverage = [];
  if (Number(stats.staleCount) > 0 && stats.stalePct != null) {
    leverage.push(
      `${fmt(stats.staleCount)} listings (${stats.stalePct}% of the active market) have sat 60 days or longer.`
    );
  }
  if (Number(stats.staleWithPriceCut) > 0) {
    leverage.push(`${fmt(stats.staleWithPriceCut)} of those have already cut their price.`);
  }
  if (Number(s.priceDropCount) > 0) {
    leverage.push(`${fmt(s.priceDropCount)} active listings have taken at least one price reduction.`);
  }
  if (Number(stats.medianDOM) > 0) {
    leverage.push(`Median days on market is ${stats.medianDOM}.`);
  }

  // ── TRREB paragraph, separately dated ──
  const trreb = [];
  if (stats.tRREBMonth) {
    const bits = [];
    if (Number(stats.mississaugaAvgPrice) > 0) bits.push(`an average sale price of ${fmtMoney(stats.mississaugaAvgPrice)}`);
    if (Number(stats.mississaugaSales) > 0) bits.push(`${fmt(stats.mississaugaSales)} sales`);
    if (Number(stats.mississaugaAvgSPLP) > 0) bits.push(`sales at ${stats.mississaugaAvgSPLP}% of asking`);
    if (Number(stats.mississaugaMonthsOfInventory) > 0) bits.push(`${stats.mississaugaMonthsOfInventory} months of inventory`);
    if (bits.length) {
      trreb.push(
        `TRREB's most recent Market Watch report for Mississauga (${stats.tRREBMonth}) reports ${bits.join(', ')}.`
      );
    }
  }

  return { live, leverage, trreb };
}

