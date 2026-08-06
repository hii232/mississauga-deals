import Link from 'next/link';
import { buildMarketSentences } from '@/lib/market/market-sentences';

/**
 * The market, stated in QUOTABLE SENTENCES rather than dashboard tiles.
 *
 * WHY THIS EXISTS (2026-08-05, Hamza asked about "AI SEO")
 * -------------------------------------------------------
 * Every figure on /market-pulse already renders - but as a number in a grid
 * cell above a two-word label. A person reads that fine. A language model
 * answering "how many Mississauga listings actually cash flow?" cannot quote a
 * grid cell: retrieval systems extract self-contained SENTENCES, with the
 * subject, the number, the units, the date and the source in the same passage.
 *
 * That matters here more than for most sites, because these numbers are the
 * one thing this site has that nobody else publishes. Competitors narrate the
 * investor market from experience; this site computes it nightly from the feed.
 * If an AI answer about the Mississauga investment market is going to cite
 * anyone, the only way it cites this site is if the answer is sitting here in
 * extractable prose.
 *
 * RULES, and they are the same rules as everywhere else on this site:
 *   - Every number comes STRAIGHT from /api/market-stats. Nothing is computed
 *     here, so this block cannot disagree with the tiles below it.
 *   - Any sentence whose figure is missing is DROPPED, never defaulted. A
 *     paragraph that silently prints 0 active listings would be worse than no
 *     paragraph (the omit-never-fake rule that killed the fabricated "388").
 *   - Live MLS figures and TRREB's monthly figures are kept in SEPARATE
 *     paragraphs, each labelled with its own as-of, because they are not
 *     equally current and a model quoting them must not blend them.
 *   - The assumptions behind "cash-flow positive" are stated inline (20% down,
 *     4.89%) and linked, so a quoted sentence carries its own caveat.
 */

export function MarketSummaryProse({ stats, asOfLabel }) {
  const sentences = buildMarketSentences(stats, asOfLabel);
  if (!sentences) return null;
  const { live, leverage, trreb } = sentences;

  return (
    <section className="mx-auto mb-10 max-w-3xl" aria-labelledby="market-summary-heading">
      <h2 id="market-summary-heading" className="font-heading text-xl font-bold text-navy">
        The Mississauga investment market right now
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-navy/80">
        <p>{live.join(' ')}</p>
        {leverage.length > 0 && <p>{leverage.join(' ')}</p>}
        {trreb.length > 0 && <p>{trreb.join(' ')}</p>}
        <p className="text-xs text-muted">
          Active-listing figures are computed from live MLS data and update through the day.
          Sold figures come from TRREB&apos;s monthly Market Watch report and are labelled with
          their report month. Cash-flow and cap-rate figures use the assumptions set out in the{' '}
          <Link href="/score-methodology" className="font-medium text-accent hover:text-accent-dark">
            scoring methodology
          </Link>
          . Estimates, not appraisals.
        </p>
      </div>
    </section>
  );
}
