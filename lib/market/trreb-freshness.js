/**
 * How stale are the hand-transcribed TRREB Market Watch figures?
 *
 * The monthly TRREB numbers in app/api/market-stats/route.js are typed in by
 * hand from the Market Watch PDF (TRREB publishes no API or feed), so they only
 * change when someone updates them. They once sat FIVE MONTHS stale while every
 * page, the weekly newsletter and every auto-generated blog post quoted them as
 * current. This makes the age explicit and machine-readable so that can never
 * happen silently: the admin dashboard shows a banner and any consumer can check
 * `tRREBIsStale` before presenting a figure as current.
 *
 * WHY THIS LIVES IN lib/ RATHER THAN THE ROUTE
 * --------------------------------------------
 * It used to sit in the route, which imports `next/server` and therefore cannot
 * be imported by a plain `node` test. A date-boundary heuristic is exactly the
 * thing that needs tests, so it moved here; the route re-exports it and its
 * behaviour is otherwise unchanged.
 *
 * THE BUG THIS FIXES (2026-08-05, Hamza reported it)
 * --------------------------------------------------
 * Staleness used to be `calendarMonthsBehind >= 2`. With June data, that flips
 * to "stale" on 1 AUGUST - days before July's report can possibly exist, since
 * TRREB publishes month M in the first few days of M+1. Hamza was asked to
 * upload a PDF that TRREB had not released yet.
 *
 * That matters more than a few wasted days of banner. This flag is the ONLY
 * guard against the five-month drift above, and a guard that cries wolf every
 * month-turn is a guard people learn to dismiss. So staleness now asks the
 * question that actually matters:
 *
 *     is there a PUBLISHED report we have not ingested?
 *
 * We cannot know what TRREB has published (no feed), so the proxy is the
 * publication window: month M's report counts as available only once the grace
 * day of M+1 has passed.
 *
 * `tRREBMonthsBehind` KEEPS its old meaning - literal calendar months since the
 * data month - because two consumers read it as raw data age
 * (/api/broadcast/offer-picks refuses to price offers when it exceeds 3, and the
 * admin banner displays it). Only the stale VERDICT changed.
 */

/**
 * Day of the following month by which a Market Watch report is assumed out.
 *
 * TRREB targets the first few days (June 2026 landed 3 July 2026), but it slips:
 * on 5 August 2026 the July report still was not out. 8 gives roughly a working
 * week of slack past the usual date. Raising it only delays the warning by days
 * - the drift this exists to catch is measured in months - while lowering it
 * back toward 1 reintroduces the false alarm.
 */
export const PUBLICATION_GRACE_DAY = 8;

/**
 * @param {string} asOf  ISO date of the last day of the data month, e.g. '2026-06-30'
 * @param {Date}   now   injectable for tests
 * @returns {{tRREBMonthsBehind: number|null, tRREBReportsBehind: number|null,
 *            tRREBIsStale: boolean, tRREBRefreshNote: string|null}}
 */
export function tRREBFreshness(asOf, now = new Date()) {
  const asOfDate = new Date(asOf + 'T00:00:00Z');
  if (isNaN(asOfDate)) {
    return {
      tRREBMonthsBehind: null,
      tRREBReportsBehind: null,
      tRREBIsStale: false,
      tRREBRefreshNote: null,
    };
  }

  // Literal calendar age of the figures. Unchanged semantics - see the header.
  const monthsBehind =
    (now.getUTCFullYear() - asOfDate.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - asOfDate.getUTCMonth());

  // The newest report month that should EXIST by `now`. Last month's report is
  // only counted once the grace day has passed; before that, the newest one out
  // is the month before it.
  const lastMonthIsPublished = now.getUTCDate() >= PUBLICATION_GRACE_DAY;
  const reportsBehind = Math.max(0, monthsBehind - (lastMonthIsPublished ? 1 : 2));

  const isStale = reportsBehind >= 1;
  return {
    tRREBMonthsBehind: monthsBehind,
    tRREBReportsBehind: reportsBehind,
    tRREBIsStale: isStale,
    tRREBRefreshNote: isStale
      ? `Need new market data - ${reportsBehind} newer TRREB Market Watch report${reportsBehind === 1 ? ' has' : 's have'} been published since these figures (${monthsBehind} months behind). Upload the latest Market Watch PDF to refresh them.`
      : null,
  };
}
