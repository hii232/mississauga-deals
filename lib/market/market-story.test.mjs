/**
 * Guards the newsletter's written market story.
 *
 *   node lib/market/market-story.test.mjs
 *
 * This prose goes to ~480 subscribers under a licensed agent's name. The
 * failure mode is not a crash - it is a confident, quotable, wrong sentence.
 * So most of what is asserted here is about what the story REFUSES to say:
 * that it never calls an average move a price move, never asserts a direction
 * its inputs do not carry, and drops a paragraph entirely rather than guessing
 * at a missing figure.
 */
import { buildMarketStory } from './market-story.js';
import * as TRREB from './trreb.js';

let pass = 0;
const fails = [];
function ok(cond, label, detail = '') {
  if (cond) pass++;
  else fails.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

// A realistic payload shaped like /api/market-stats.
function payload(over = {}) {
  return {
    tRREBMonth: 'July 2026',
    tRREBAsOf: '2026-07-31',
    mississaugaMonthsOfInventory: 4.9,
    mississaugaAvgSPLP: 97,
    mississaugaAvgLDOM: 32,
    gtaSalesYoy: -0.9,
    gtaNewListingsYoy: -17.8,
    rates: { fixed5yr: 6.09, contractRateAssumption: 4.89, posted: true },
    economic: { bocRate: 2.3 },
    mississaugaMonthly: [
      { month: 'Jun 2026', sales: 567, avgPrice: 1014120, medianPrice: 880000, newListings: 1632, ldom: 29 },
      { month: 'Jul 2026', sales: 500, avgPrice: 899002, medianPrice: 860000, newListings: 1388, ldom: 32 },
    ],
    ...over,
  };
}

const all = (s) => [s.headline, ...s.paragraphs, s.footnote || ''].join(' ');

// ── Nothing in, nothing out ──────────────────────────────────────────────
ok(buildMarketStory(null) === null, 'null payload yields no story');
ok(buildMarketStory({}) === null, 'empty payload yields no story');
ok(
  buildMarketStory({ tRREBMonth: 'July 2026', mississaugaMonthly: [] }) === null,
  'a month name with no series yields no story — never prose without data'
);

// ── THE CASE THIS MODULE EXISTS FOR ──────────────────────────────────────
// July 2026: average -11.4%, median -2.3%. A five-fold gap. The story must
// correct the headline rather than repeat it.
{
  const s = buildMarketStory(payload());
  ok(!!s, 'the real July payload produces a story');
  ok(/not a price move/i.test(s.headline), 'headline flags that the average move is not a value move', s.headline);
  const t = all(s);
  ok(/median/i.test(t), 'the story names the median');
  ok(/Trust the median/i.test(t), 'the story tells the reader which figure to believe');
  ok(/11\.4%/.test(t) && /2\.3%/.test(t), 'both the average and median moves are stated, not just the scary one');
  ok(/\$899,002/.test(t) && /\$860,000/.test(t), 'levels are given alongside the changes');
  // The specific lie this prevents: stating the average's move as a fact about
  // what homes are worth. Naming the average move is fine — it happened — so
  // what is asserted is that the correction travels with it. The average change
  // must never appear in a paragraph that does not also carry the median.
  ok(
    s.paragraphs.every((p) => !/11\.4%/.test(p) || /median/i.test(p)),
    'the average move never appears in a paragraph without the median beside it'
  );
  ok(
    !/homes? (?:are|is) worth .*(?:less|more)|values? (?:fell|dropped|are down) 11/i.test(t),
    'never restates the average move as a change in what homes are worth',
    t.slice(0, 200)
  );
  ok(/headline/i.test(s.headline) === false && /not a price move/i.test(s.headline),
     'the correction is in the headline, where a skimmer will see it', s.headline);
}

// ── A genuine move must NOT be explained away as mix ─────────────────────
{
  const s = buildMarketStory(payload({
    mississaugaMonthly: [
      { month: 'Jun 2026', sales: 567, avgPrice: 1000000, medianPrice: 900000, newListings: 1632, ldom: 29 },
      { month: 'Jul 2026', sales: 500, avgPrice: 940000, medianPrice: 846000, newListings: 1388, ldom: 32 },
    ],
  }));
  const t = all(s);
  ok(/the two agree/i.test(t), 'when average and median move together it is called a real move', t.slice(0, 160));
  ok(!/Trust the median/i.test(t), 'does not tell the reader to discount the average when both agree');
  ok(/softening/i.test(t), 'names the direction when the direction is real');
}

// Small moves must not trip the mix rule on ratio alone: 0.4% vs 0.1% is 4x
// and means nothing.
{
  const s = buildMarketStory(payload({
    mississaugaMonthly: [
      { month: 'Jun 2026', sales: 567, avgPrice: 1000000, medianPrice: 900000, newListings: 1632, ldom: 29 },
      { month: 'Jul 2026', sales: 566, avgPrice: 1004000, medianPrice: 900900, newListings: 1630, ldom: 29 },
    ],
  }));
  ok(!/not a price move/i.test(all(s)), 'a 0.4%-vs-0.1% move is noise, not a declared mix shift');
}

// ── Rising markets get the same treatment, mirrored ──────────────────────
{
  const s = buildMarketStory(payload({
    mississaugaMonthly: [
      { month: 'Jun 2026', sales: 500, avgPrice: 900000, medianPrice: 860000, newListings: 1388, ldom: 32 },
      { month: 'Jul 2026', sales: 567, avgPrice: 1014000, medianPrice: 869000, newListings: 1632, ldom: 29 },
    ],
  }));
  const t = all(s);
  ok(/rose/i.test(t), 'an upward move is described as rising');
  ok(/high-end trades pulls the average up/i.test(t), 'mix logic works in the up direction too');
  ok(!/fell/i.test(s.headline), 'headline does not say "fell" on a rising month', s.headline);
}

// ── Supply vs demand ─────────────────────────────────────────────────────
{
  // July: sales -11.8%, new listings -15.0% → sellers pulled back harder.
  const t = all(buildMarketStory(payload()));
  ok(/Sellers pulled back harder/i.test(t), 'identifies which side withdrew faster');
  ok(/17\.8%/.test(t) && /0\.9%/.test(t), 'the GTA year-over-year contrast is included');
}
{
  // Buyers withdrawing faster is the opposite call and must read differently.
  const t = all(buildMarketStory(payload({
    mississaugaMonthly: [
      { month: 'Jun 2026', sales: 600, avgPrice: 1000000, medianPrice: 900000, newListings: 1400, ldom: 29 },
      { month: 'Jul 2026', sales: 480, avgPrice: 990000, medianPrice: 895000, newListings: 1420, ldom: 32 },
    ],
  })));
  ok(/Buyers stepped back harder/i.test(t), 'identifies buyer-side withdrawal');
  ok(!/Sellers pulled back harder/i.test(t), 'does not make both calls at once');
}

// ── Market posture must follow the inventory figure, not a house view ────
{
  const t = all(buildMarketStory(payload({ mississaugaMonthsOfInventory: 1.4 })));
  ok(/seller's market/i.test(t), "1.4 months reads as a seller's market");
  ok(!/buyer's market/i.test(t), 'does not also call it a buyers market');
}
{
  const t = all(buildMarketStory(payload({ mississaugaMonthsOfInventory: 3 })));
  ok(/balanced market/i.test(t), '3 months reads as balanced — not sold as either side');
}
{
  const t = all(buildMarketStory(payload()));
  ok(/buyer's market/i.test(t), "4.9 months reads as a buyer's market");
  ok(/not a rout/i.test(t), 'a high sale-to-list ratio tempers the buyers-market claim');
}

// ── Posted vs contract rate ──────────────────────────────────────────────
{
  const t = all(buildMarketStory(payload()));
  ok(/posted is not what anyone signs/i.test(t), 'posted rates are labelled as posted');
  ok(/6\.09%/.test(t) && /4\.89%/.test(t), 'both the posted and the contract rate appear');
  ok(/2\.3%/.test(t), 'the policy rate is included when present');
}
{
  const s = buildMarketStory(payload({ rates: {}, economic: {} }));
  ok(!/posted/i.test(all(s)), 'no rates in the payload means no rates paragraph — never invented');
}

// ── Missing inputs drop paragraphs rather than guessing ──────────────────
{
  const s = buildMarketStory(payload({
    mississaugaMonthsOfInventory: null,
    mississaugaAvgSPLP: null,
  }));
  const t = all(s);
  ok(!/months? of inventory|Inventory sits/i.test(t), 'no inventory figure means no inventory sentence');
  ok(s.paragraphs.length >= 2, 'the rest of the story survives one missing block', `${s.paragraphs.length}`);
}
{
  // First month ever loaded: a level, never a trend.
  const s = buildMarketStory(payload({
    mississaugaMonthly: [{ month: 'Jul 2026', sales: 500, avgPrice: 899002, medianPrice: 860000, newListings: 1388, ldom: 32 }],
  }));
  const t = all(s);
  ok(/a level, not a trend/i.test(t), 'with no prior month it claims no direction');
  ok(!/\bfell\b|\brose\b/.test(s.headline), 'headline claims no direction without a comparison', s.headline);
}

// ── The footnote must keep the board data honest ─────────────────────────
{
  const s = buildMarketStory(payload());
  ok(/monthly board report, not this week's tape/i.test(s.footnote || ''), 'footnote separates monthly sold data from live data');
  ok((s.footnote || '').includes('2026-07-31'), 'footnote carries the as-of date');
}

// ── Against the REAL loaded data, not just fixtures ──────────────────────
{
  const live = buildMarketStory({
    tRREBMonth: TRREB.tRREBMonth,
    tRREBAsOf: TRREB.tRREBAsOf,
    mississaugaMonthly: TRREB.mississaugaMonthly,
    rates: TRREB.rates,
    economic: TRREB.economic,
    ...TRREB.regional,
  });
  ok(!!live, 'a story builds from the currently loaded report');
  const t = all(live);
  ok(t.includes(TRREB.tRREBMonth), 'the live story names the loaded report month');
  ok(!/undefined|NaN|null|\$0\b/.test(t), 'no undefined, NaN, null or $0 reaches the prose', t.slice(0, 200));
  ok(live.paragraphs.every((p) => p.trim().length > 40), 'no stub paragraphs');
}

if (fails.length) {
  console.error(`\nFAILED - ${fails.length} check(s):`);
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`PASSED - ${pass} checks passed, 0 failed`);
