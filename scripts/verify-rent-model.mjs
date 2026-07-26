#!/usr/bin/env node
/**
 * Rent-model calibration check.
 *
 * HOOD_RENTS drives estimatedRent, which drives cash flow, cap rate, CoC and
 * the deal score — so if the table drifts from the market, EVERY number on the
 * site is wrong in the same direction. It was last calibrated for 2025-2026
 * and there is no automatic feedback loop telling us when it goes stale.
 *
 * This compares the table against real recently-leased MLS comps via the
 * site's own /api/rental-comps endpoint (12-month window, same source the
 * listing pages use), and prints the gap per neighbourhood and bedroom count.
 *
 * It does NOT change anything — recalibrating rents is a judgement call about
 * real market data, not something to automate off one query.
 *
 * Usage (needs the AMPRE token, so run against production or a env-configured
 * local server):
 *   node scripts/verify-rent-model.mjs                     # prod
 *   node scripts/verify-rent-model.mjs http://localhost:3000
 *
 * Reads flagged rows as: model materially above market = cap rates and cash
 * flow across that neighbourhood are overstated.
 */
import { HOOD_RENTS, HOOD_DATA } from '../lib/constants.js';

const BASE = process.argv[2] || 'https://www.mississaugainvestor.ca';
const BEDS = [2, 3, 4];
const TOLERANCE = 0.10; // flag when the model is >10% away from the comp median

const rows = [];
for (const [hood, table] of Object.entries(HOOD_RENTS)) {
  const geo = HOOD_DATA[hood];
  for (const beds of BEDS) {
    const modelled = table[beds];
    if (!modelled) continue;
    const url = `${BASE}/api/rental-comps?city=Mississauga&beds=${beds}` +
      (geo ? `&lat=${geo.lat}&lng=${geo.lng}` : '');
    let median = 0, n = 0, source = 'error';
    try {
      const res = await fetch(url);
      const data = await res.json();
      median = Number(data.median) || 0;
      n = Array.isArray(data.comps) ? data.comps.length : 0;
      source = data.source || 'unknown';
    } catch (err) {
      source = `fetch failed: ${err.message}`;
    }
    if (!median) { rows.push({ hood, beds, modelled, median: null, n, source }); continue; }
    const gap = (modelled - median) / median;
    rows.push({ hood, beds, modelled, median, n, source, gap });
  }
}

const flagged = rows.filter((r) => r.gap != null && Math.abs(r.gap) > TOLERANCE);
const noData = rows.filter((r) => r.gap == null);

console.log(`\nRent model vs leased comps  (base: ${BASE}, tolerance ±${TOLERANCE * 100}%)\n`);
console.log('hood                  beds   model    comp median   gap    comps');
for (const r of rows.filter((x) => x.gap != null).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))) {
  const flag = Math.abs(r.gap) > TOLERANCE ? (r.gap > 0 ? '  <-- MODEL HIGH' : '  <-- model low') : '';
  console.log(
    `${r.hood.padEnd(22)}${String(r.beds).padEnd(6)} $${String(r.modelled).padEnd(7)} $${String(r.median).padEnd(12)} ` +
    `${(r.gap * 100).toFixed(1).padStart(6)}%  ${String(r.n).padStart(3)}${flag}`
  );
}

console.log(`\n${flagged.length} of ${rows.length - noData.length} checked rows are outside ±${TOLERANCE * 100}%.`);
if (noData.length) {
  console.log(`${noData.length} rows had no comp data (source: ${[...new Set(noData.map((r) => r.source))].join(', ')}).`);
  console.log('If source is "unavailable" the AMPRE token is missing — run this against production.');
}
console.log('\nA MODEL HIGH row means cash flow, cap rate and deal score are OVERSTATED for that');
console.log('neighbourhood and bedroom count. Fix by editing HOOD_RENTS in lib/constants.js.\n');
