// ─────────────────────────────────────────────────────────────────────────────
//  Data for "The Mississauga Monthly" - the TRREB report-day briefing.
//
//  The campaign's whole premise is SPEED ON REAL NUMBERS: TRREB releases
//  Market Watch in the first days of each month, Hamza transcribes it via the
//  verified extractor the same day, and this email puts the numbers in front
//  of subscribers before anyone else's newsletter has them. That premise makes
//  the guards here stricter than the other broadcasts, in one specific way:
//
//    THIS EMAIL MUST NEVER SEND ON A STALE REPORT. A "motivated sellers" blast
//    on week-old live data is merely less fresh; a "here are this month's new
//    TRREB numbers" email built on LAST month's report is a false statement
//    about what is new. So compose refuses unless the stats payload
//    self-reports tRREBIsStale === false AND tRREBReportsBehind === 0.
//
//  Everything else follows the house rules: every figure verbatim from
//  /api/market-stats (which carries the hand-verified transcription), derived
//  values are plain arithmetic on two published rows and labelled as
//  month-over-month, a missing optional block is OMITTED rather than zeroed,
//  and an implausible required figure refuses the whole compose - a wrong
//  number in an email cannot be hotfixed.
//
//  The one piece of editorial logic lives here, unit-tested, rather than in
//  the template: the AVERAGE-vs-MEDIAN divergence. A month where the average
//  swings hard while the median barely moves is a change in WHICH homes sold
//  (mix / luxury-end volatility), not a change in what a typical home is
//  worth - July 2026 is exactly that month (avg -11.4% MoM, median -2.3%).
//  Leading an email with the raw average swing would be technically-true
//  fearmongering; the builder computes both and flags divergence so the
//  template can say the honest thing.
// ─────────────────────────────────────────────────────────────────────────────

/** Average and median disagree "materially" past this many percentage points. */
export const MIX_DIVERGENCE_PP = 4;

const fin = (x) => Number.isFinite(Number(x)) ? Number(x) : null;
const pct = (now, prev) => (fin(now) !== null && fin(prev) > 0)
  ? +(((now - prev) / prev) * 100).toFixed(1)
  : null;

/**
 * @param {object} stats verbatim /api/market-stats JSON
 * @returns {{ report: object|null, reason: string|null }}
 */
export function buildMarketReportData(stats) {
  if (!stats || typeof stats !== 'object') return { report: null, reason: 'no stats payload' };

  // The campaign-defining guard: only ever send the CURRENT published report.
  if (stats.tRREBIsStale !== false) {
    return { report: null, reason: `tRREBIsStale is ${JSON.stringify(stats.tRREBIsStale)} - refusing to mail an out-of-date report as news` };
  }
  if (stats.tRREBReportsBehind !== 0) {
    return { report: null, reason: `tRREBReportsBehind is ${stats.tRREBReportsBehind} - a newer report exists` };
  }

  const monthly = Array.isArray(stats.mississaugaMonthly) ? stats.mississaugaMonthly : [];
  if (monthly.length < 2) return { report: null, reason: `need 2 monthly rows for month-over-month, have ${monthly.length}` };
  const now = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 2];

  // Plausibility on the required row - generous ranges, they exist to catch a
  // transcription slip (an extra digit, a swapped column), not to police the
  // market. Mississauga has never seen a month outside these.
  const checks = [
    [fin(now.sales) > 100 && now.sales < 2000, `sales ${now.sales} outside 100-2000`],
    [fin(now.avgPrice) > 500000 && now.avgPrice < 2500000, `avgPrice ${now.avgPrice} outside 500k-2.5M`],
    [fin(now.medianPrice) > 400000 && now.medianPrice < 2000000, `medianPrice ${now.medianPrice} outside 400k-2M`],
    [fin(now.snlr) > 10 && now.snlr < 90, `snlr ${now.snlr} outside 10-90`],
    [fin(now.activeListings) > 500, `activeListings ${now.activeListings} <= 500`],
    [!!now.month && !!now.report, 'monthly row missing month/report label'],
    [String(stats.tRREBMonth || '').length > 0, 'no tRREBMonth'],
  ];
  const failed = checks.filter(([ok]) => !ok).map(([, why]) => why);
  if (failed.length) return { report: null, reason: failed.join('; ') };

  const avgMoM = pct(now.avgPrice, prev.avgPrice);
  const medianMoM = pct(now.medianPrice, prev.medianPrice);

  // The honesty flag. Divergence = the average moved materially more than the
  // median, in either direction - the signature of a mix/luxury swing.
  const mixDivergence =
    avgMoM !== null && medianMoM !== null &&
    Math.abs(avgMoM - medianMoM) >= MIX_DIVERGENCE_PP;

  // Per-type table - required in full. A partial table silently drops a home
  // type someone owns; refuse instead so the compose error names the gap.
  const t = stats.salesByType || {};
  const TYPES = [
    ['detached', 'Detached'],
    ['semiDetached', 'Semi-Detached'],
    ['townhouse', 'Townhouse'],
    ['condoTown', 'Condo Townhouse'],
    ['condoApt', 'Condo Apartment'],
  ];
  const types = [];
  for (const [key, label] of TYPES) {
    const row = t[key];
    if (!row || !fin(row.sales) || !(fin(row.avgPrice) > 0)) {
      return { report: null, reason: `salesByType.${key} missing or implausible` };
    }
    types.push({ label, sales: row.sales, avgPrice: row.avgPrice, spLp: fin(row.spLp), ldom: fin(row.ldom) });
  }

  // Optional live strip - the site's own computed edge, from the live feed.
  // OMITTED entirely when the screener block is absent/partial (feed outage);
  // the TRREB report stands on its own. Never zero-filled.
  let live = null;
  const s = stats.screener;
  if (s && fin(s.total) > 1000 && fin(stats.activeCount) > 1000) {
    live = {
      activeCount: stats.activeCount,
      scoredCount: s.total,
      cfPlusCount: fin(s.cfPlusCount),
      bestCap: fin(s.bestCap),
      medianDOM: fin(stats.medianDOM),
      priceDropCount: fin(s.priceDropCount),
    };
  }

  return {
    report: {
      // e.g. "July 2026" / "MW2607" - the campaign key derives from `code` so
      // every new report month is automatically a NEW campaign.
      monthLabel: stats.tRREBMonth,
      code: String(now.report),
      now: {
        month: now.month, sales: now.sales, avgPrice: now.avgPrice,
        medianPrice: now.medianPrice, newListings: fin(now.newListings),
        activeListings: now.activeListings, snlr: now.snlr,
        monthsInventory: fin(now.monthsInventory), spLp: fin(now.spLp), ldom: fin(now.ldom),
      },
      prev: {
        month: prev.month, sales: fin(prev.sales), avgPrice: fin(prev.avgPrice),
        medianPrice: fin(prev.medianPrice), activeListings: fin(prev.activeListings),
        snlr: fin(prev.snlr), ldom: fin(prev.ldom),
      },
      mom: {
        avg: avgMoM,
        median: medianMoM,
        sales: pct(now.sales, prev.sales),
        active: pct(now.activeListings, prev.activeListings),
        snlrPts: (fin(now.snlr) !== null && fin(prev.snlr) !== null)
          ? +(now.snlr - prev.snlr).toFixed(1) : null,
      },
      mixDivergence,
      types,
      // GTA context, already labelled GTA-wide in the stats route. Optional.
      gta: fin(stats.gtaAvgPrice) ? {
        avgPrice: stats.gtaAvgPrice,
        yoy: fin(stats.gtaYoyChange),
        newListingsYoy: fin(stats.gtaNewListingsYoy),
        sales: fin(stats.gtaSales),
      } : null,
      live,
    },
    reason: null,
  };
}
