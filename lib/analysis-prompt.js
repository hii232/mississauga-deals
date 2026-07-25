/**
 * Claude analysis prompt for Mississauga investment properties.
 * Token-efficient: targets ~250 words per response.
 *
 * The market context used to be a hardcoded block. Every month it silently
 * drifted from what the site actually published, and because the cache key was
 * derived from it, stale analyses could outlive several data refreshes. It is
 * now BUILT FROM LIVE /api/market-stats at request time — the same single
 * source the market pages, the weekly email and the blog generator read.
 *
 * Rules:
 *  - No market figure is hardcoded here. If live stats are unavailable the
 *    context block is omitted entirely and the model is told to avoid quoting
 *    market-wide numbers, rather than reciting figures of unknown vintage.
 *  - The prompt hash is computed from the ACTUAL prompt text, so a data refresh
 *    invalidates every cached analysis automatically.
 */

const money = (n) => (Number.isFinite(n) && n > 0 ? '$' + Math.round(n).toLocaleString() : null);
const pct = (n) => (Number.isFinite(n) ? `${n}%` : null);

/**
 * Build the live market-context block. Returns '' when we have no real data —
 * silence beats a number nobody can vouch for.
 */
function buildMarketContext(s) {
  if (!s) {
    return `MARKET CONTEXT: unavailable right now.
Do NOT quote market-wide averages, rates, or benchmarks you can't see. Analyze this property on the figures supplied in the listing itself.`;
  }

  const L = [];
  const asOf = s.tRREBMonth ? ` (TRREB Market Watch, ${s.tRREBMonth})` : '';

  const avg = money(s.mississaugaAvgPrice);
  const med = money(s.mississaugaMedianPrice);
  if (avg) L.push(`- Avg sale price: ${avg}${med ? `, median ${med}` : ''}${asOf}`);
  if (Number.isFinite(s.mississaugaSNLR)) L.push(`- SNLR: ${s.mississaugaSNLR}% (below 40% = buyer's market)`);
  if (Number.isFinite(s.mississaugaMonthsOfInventory)) L.push(`- Months of inventory: ${s.mississaugaMonthsOfInventory}`);
  if (Number.isFinite(s.mississaugaAvgSPLP)) L.push(`- Sale-to-list: ${s.mississaugaAvgSPLP}%`);
  if (Number.isFinite(s.mississaugaAvgLDOM)) L.push(`- Avg days on market: ${s.mississaugaAvgLDOM}`);
  if (s.marketType) L.push(`- Market condition: ${s.marketType}`);

  // Direction of travel, straight from the sourced monthly history.
  const hist = Array.isArray(s.mississaugaMonthly) ? s.mississaugaMonthly : [];
  if (hist.length >= 2) {
    const a = hist[0];
    const b = hist[hist.length - 1];
    L.push(
      `- Trend ${a.month} → ${b.month}: avg price ${money(a.avgPrice)} → ${money(b.avgPrice)}, ` +
      `DOM ${a.ldom} → ${b.ldom}, inventory ${a.monthsInventory} → ${b.monthsInventory} months`
    );
  }

  const r = s.rates || {};
  const e = s.economic || {};
  const rateLines = [];
  if (Number.isFinite(e.bocRate)) rateLines.push(`BoC overnight ${pct(e.bocRate)}`);
  if (Number.isFinite(e.primeRate)) rateLines.push(`prime ${pct(e.primeRate)}`);
  if (rateLines.length) L.push(`- ${rateLines.join(', ')}`);

  if (Number.isFinite(r.fixed5yr)) {
    L.push(`- POSTED rates (Bank of Canada, via TRREB): 5yr fixed ${pct(r.fixed5yr)}${Number.isFinite(r.fixed1yr) ? `, 1yr ${pct(r.fixed1yr)}` : ''} — POSTED, not what a borrower is quoted`);
  }
  if (Number.isFinite(r.contractRateAssumption)) {
    L.push(`- Realistic CONTRACT rate: ~${pct(r.contractRateAssumption)} 5yr fixed${Number.isFinite(r.variable) ? `, ~${pct(r.variable)} variable` : ''} — what our cash-flow figures assume`);
  }
  if (Number.isFinite(r.stressTest)) {
    L.push(`- Stress test: ${pct(r.stressTest)} (greater of contract rate + 2% or 5.25%)`);
  }

  // Sold price benchmarks by type, live from the same feed.
  const p = s.avgPrices || {};
  const typeLines = ['detached', 'semiDetached', 'townhouse', 'condo']
    .map((k) => {
      const t = p[k];
      if (!t || !money(t.soldAvg)) return null;
      const yoy = Number.isFinite(t.yoyChange) ? ` (${t.yoyChange > 0 ? '+' : ''}${t.yoyChange}% YoY, GTA-wide)` : '';
      return `  · ${t.label || k}: ${money(t.soldAvg)}${yoy}`;
    })
    .filter(Boolean);

  const rent = s.rental || {};
  const rentLine = [
    Number.isFinite(rent.avg1Bed) ? `1-bed ${money(rent.avg1Bed)}` : null,
    Number.isFinite(rent.avg2Bed) ? `2-bed ${money(rent.avg2Bed)}` : null,
    Number.isFinite(rent.avg3Bed) ? `3-bed ${money(rent.avg3Bed)}` : null,
  ].filter(Boolean).join(', ');

  return [
    `MISSISSAUGA MARKET CONTEXT${asOf ? ` — ${s.tRREBMonth}` : ''} (live from the site's own data):`,
    ...L,
    typeLines.length ? `\nSOLD PRICE BENCHMARKS BY TYPE:\n${typeLines.join('\n')}` : '',
    rentLine ? `\nAVERAGE ASKING RENTS: ${rentLine}` : '',
    `\nNever quote a posted rate as the investor's actual borrowing cost, and never state a figure that contradicts the numbers above.`,
  ].filter(Boolean).join('\n');
}

function buildSystemPrompt(marketStats) {
  return `You are a concise, data-driven real estate investment analyst specializing in Mississauga, Ontario. You advise investors (NOT homebuyers) on rental properties, cash flow, and wealth building.

${buildMarketContext(marketStats)}

LRT CORRIDOR ZONES (price premium expected):
Cooksville, Hurontario, City Centre, Port Credit

SCORING CONTEXT:
- Deal Score 8+: Strong investment (top 5%)
- Deal Score 6.5-7.9: Solid fundamentals
- Deal Score 5-6.4: Average
- Below 5: Tough numbers

RESPONSE FORMAT (use exactly these headers):
## Verdict
One sentence: buy, pass, or conditional.

## Strengths
- 3 bullet points max

## Risks
- 3 bullet points max

## Strategy
Best approach for this property (buy & hold, BRRR, flip, etc.) in 2-3 sentences.

## Offer Price
Suggested offer range based on DOM, SP/LP ratio, and market conditions.

RULES:
- Max 250 words total
- Use bullet points, not paragraphs
- Compare to the market benchmarks above
- Be honest — if it's a bad deal, say so
- Never recommend buying without noting risks
- Reference specific numbers from the listing
- Never invent a statistic. If you don't have a figure, write around it.`;
}

/**
 * @param {object} listing
 * @param {object|null} marketStats  Live /api/market-stats payload, or null.
 */
export function buildAnalysisPrompt(listing, marketStats = null) {
  const system = buildSystemPrompt(marketStats);

  const userPrompt = `Analyze this Mississauga investment property:

Address: ${listing.address}
Price: $${listing.price?.toLocaleString()}
Type: ${listing.type}${listing.subType ? ` (${listing.subType})` : ''}
Beds/Baths: ${listing.beds}/${listing.baths}
Est. Rent: $${listing.estimatedRent?.toLocaleString()}/mo
Cap Rate: ${listing.capRate?.toFixed(2)}%
Cash Flow: $${listing.cashFlow?.toLocaleString()}/mo
Cash-on-Cash: ${listing.cashOnCash?.toFixed(1)}%
DOM: ${listing.dom} days
Neighbourhood: ${listing.neighbourhood || 'Mississauga'}
Deal Score: ${listing.hamzaScore}/10
Basement: ${listing.basementTier || 'none'}
Price Drop: ${listing.priceDrop ? listing.priceDrop + '%' : 'none'}
${listing.remarks ? `Remarks: ${listing.remarks.substring(0, 300)}` : ''}`;

  return { system, user: userPrompt };
}

/**
 * Hash of the ACTUAL system prompt in use, so a market-data refresh
 * invalidates every cached analysis. Previously this hashed a fixed string —
 * first 100 chars of a static prompt — so cached analyses quoting months-old
 * prices would have served forever.
 */
export function getPromptHash(systemPrompt) {
  const str = typeof systemPrompt === 'string' && systemPrompt.length
    ? systemPrompt
    : buildSystemPrompt(null);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // 32-bit
  }
  return String(Math.abs(hash));
}
