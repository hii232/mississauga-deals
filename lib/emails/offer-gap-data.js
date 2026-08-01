/**
 * Offer Gap campaign — the data contract and its plausibility guard.
 *
 * Deliberately its OWN module with zero imports. The guard is the only thing
 * standing between a bad /api/market-stats payload and a wrong number in every
 * subscriber's inbox, and a broadcast cannot be hotfixed after it sends — so it
 * has to be unit-testable without booting Next or resolving the `@/` alias.
 *
 * Everything here is about the TRREB Market Watch per-type figures, which are
 * transcribed BY HAND from the PDF (see CLAUDE.md). Hand transcription is
 * exactly the kind of process that produces a transposed digit, so the checks
 * below are aimed at transcription slips first and outages second.
 */

// Display order = biggest negotiating room first, which is also the order the
// email's argument runs in. `label` matches how TRREB names the category so a
// reader checking the report finds the same row; `prose` is the plural form the
// sentences use, because "negotiate hardest on detached and condo apartment"
// is what you get when a table label is dropped into running text.
export const TYPE_ORDER = [
  ['detached', 'Detached', 'detached homes'],
  ['condoApt', 'Condo apartment', 'condo apartments'],
  ['condoTown', 'Condo townhouse', 'condo townhouses'],
  ['semiDetached', 'Semi-detached', 'semis'],
  ['townhouse', 'Freehold town/row', 'freehold townhouses'],
];

// Sales below this get an inline "thin sample" flag. 30 is the conventional
// small-sample threshold and it is the honest place to draw the line here:
// freehold townhouses (18 sales in June 2026) carry the table's most
// eye-catching number and the reader must be told it rests on the least data.
export const THIN_SAMPLE = 30;

// A sale-to-list ratio outside this band is a transcription slip, not a market
// condition — Mississauga has never printed anything near either end.
const RATIO_MIN = 80;
const RATIO_MAX = 120;

// One or two months behind is TRREB's normal publishing lag. Beyond that,
// refuse: a page can be re-read once the data refreshes, but an email is a
// permanent artifact in someone's inbox quoting a month that has moved on.
const MAX_MONTHS_BEHIND = 3;

/**
 * Approximate dollars between the average list price and the average sold
 * price. Derived, NOT reported: TRREB publishes an average sold price and an
 * average sale-to-list ratio, and dividing one by the other reconstructs an
 * average list price only approximately (the published ratio is the mean of
 * per-sale ratios, not the ratio of the means). Rounded to the nearest $500 so
 * it never reads as a precise figure, and always rendered with a "roughly".
 *
 * Returns a NEGATIVE number when the type sold above asking — the caller
 * renders that case as "over asking" rather than as negotiating room.
 */
export function approxGapDollars(soldAvg, spLp) {
  if (!(soldAvg > 0) || !(spLp > 0)) return null;
  const listAvg = soldAvg / (spLp / 100);
  return Math.round((listAvg - soldAvg) / 500) * 500;
}

/**
 * Validate a /api/market-stats payload for this campaign.
 * Returns { gap, reason }: `gap` is null and `reason` explains why whenever
 * ANY check fails. The caller must treat a null gap as "do not send".
 */
export function validateGap(stats) {
  const gap = {
    salesByType: stats?.salesByType ?? {},
    month: stats?.tRREBMonth ?? null,
    monthsBehind: Number(stats?.tRREBMonthsBehind ?? 0),
    activeCount: Number(stats?.activeCount ?? 0),
  };

  const rows = TYPE_ORDER.map(([key, label, prose]) => ({
    key, label, prose, ...(gap.salesByType[key] || {}),
  }));
  const present = rows.filter((r) => r.spLp > 0 && r.sales > 0 && r.avgPrice > 0);
  const ratios = present.map((r) => r.spLp);

  const checks = [
    [!!gap.month, 'tRREBMonth missing — cannot state which month the figures describe'],
    [Number.isFinite(gap.monthsBehind) && gap.monthsBehind <= MAX_MONTHS_BEHIND,
      `TRREB data is ${gap.monthsBehind} months behind — too stale to broadcast`],
    [present.length === TYPE_ORDER.length,
      `only ${present.length}/${TYPE_ORDER.length} property types have complete figures`],
    [ratios.every((r) => r >= RATIO_MIN && r <= RATIO_MAX),
      `sale-to-list ratio outside ${RATIO_MIN}-${RATIO_MAX}: ${ratios.join(', ')}`],
    // The email's entire argument is that the ratio VARIES by type. If every
    // type prints the same number there is no story, and a flat table is a
    // likelier sign of a copy-paste error than of a real market.
    [ratios.length > 0 && Math.max(...ratios) - Math.min(...ratios) >= 2,
      `ratios are flat (${ratios.length ? `${Math.min(...ratios)}-${Math.max(...ratios)}` : 'none'}) — no gap to write about`],
    [present.every((r) => r.ldom > 0 && r.ldom < 365),
      `implausible days-on-market: ${present.map((r) => r.ldom).join(', ')}`],
    [present.every((r) => r.avgPrice >= 100000 && r.avgPrice <= 10000000),
      `implausible average price: ${present.map((r) => r.avgPrice).join(', ')}`],
  ];

  const failed = checks.filter(([ok]) => !ok).map(([, why]) => why);
  if (failed.length) return { gap: null, reason: failed.join('; ') };
  return { gap, reason: null };
}
