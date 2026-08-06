#!/usr/bin/env node
/**
 * Compliance guard — runs as part of `npm run build` and FAILS the build.
 *
 * RECO requires advertising to name the brokerage the salesperson is
 * registered with. Hamza is with Cityscape Real Estate Ltd., Brokerage; the
 * former brokerage name must never appear again in anything we publish.
 * It once resurfaced in stored blog-post author bios and was live long enough
 * for Google to index it, so render-time sanitizing alone is not enough —
 * this stops a re-introduction reaching production at all.
 *
 * It also guards the U+FFFD mojibake that mangled em-dashes in stored posts.
 *
 * And it guards SINGLE-SOURCING of the TRREB market figures — see the
 * 'trreb-copy' rule below.
 *
 * Scope: source we author. node_modules, .next, and the sanitizer//this file
 * (which must contain the banned strings to detect them) are excluded.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import TRREB from '../data/trreb.js';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'out', 'dist', '.vercel']);
// Files whose job is to detect/remove these strings, plus the internal
// engineering notes that document the incident itself. Neither is published:
// the backlog and CLAUDE.md are repo docs, never routes or rendered content.
// Everything that can actually reach a visitor — app/, components/, lib/
// (including lib/blog/seed-posts.js), public/ — stays in scope.
const ALLOWLIST = new Set([
  'lib/blog/sanitize-content.js',
  'scripts/compliance-check.mjs',
  'IMPROVEMENT_BACKLOG.md',
  'CLAUDE.md',
  // The single source itself, and the module whose whole job is to read it.
  'data/trreb.js',
  // Reads the PDF and writes data/trreb.js; it necessarily handles the figures.
  'scripts/trreb-extract.py',
]);
const EXTS = /\.(js|jsx|ts|tsx|mjs|cjs|md|json|html)$/;
// Unit tests need literal fixtures to assert against — that is the point of a
// fixture. They render nothing to a visitor, so a stale one is a failing test,
// not a public contradiction.
const IS_TEST = /\.test\.(mjs|js|jsx|ts|tsx)$/;

/**
 * Every price-scale figure in every TRREB report we hold, in both the raw form
 * (899002) and the comma-formatted form a human types into prose ($899,002).
 *
 * WHY: /api/market-stats was carefully single-sourced, and lib/blog/seed-posts.js
 * still had its own hand-typed copies of the previous month's figures in the
 * prose — so after a refresh the site published "$1,014,120 average, 567 sales"
 * on a pillar post while the API served July's numbers. The reader sees both.
 *
 * WHAT IS GUARDED, AND WHAT IS NOT. Only figures >= 100,000 that are NOT round
 * to the nearest $10k. Two deliberate exclusions:
 *
 *   - Small numbers. Sales counts, days-on-market and percentages are values
 *     like 500, 32 and 97 that appear legitimately all over the codebase.
 *   - Round prices. $850,000 and $900,000 are calculator defaults and worked
 *     examples throughout the site (the HST rebate page, the rent-vs-buy tool),
 *     and TRREB medians land on round numbers often. Banning them would fire
 *     constantly on innocent code, and a guard people switch off guards
 *     nothing. So MEDIAN prices are largely unguarded here; the AVERAGE prices
 *     are the class that actually went stale in public prose, and they carry
 *     distinctive digits ($899,002, $1,014,120) that nothing else would type
 *     by coincidence.
 *
 * OLD months are banned too, deliberately: after a refresh the thing you want
 * to catch is the copy still quoting LAST month.
 */
const TRREB_FIGURES = (() => {
  const out = new Set();
  const walk = (v) => {
    if (v == null) return;
    if (typeof v === 'number') {
      const n = Math.abs(v);
      if (Number.isInteger(n) && n >= 100000 && n % 10000 !== 0) out.add(n);
      return;
    }
    if (typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(TRREB.reports);
  return [...out].sort((a, b) => a - b);
})();

const TRREB_RE = TRREB_FIGURES.length
  ? new RegExp(
      TRREB_FIGURES.map((n) => `\\b${n}\\b|\\$?\\b${n.toLocaleString('en-CA')}\\b`).join('|')
    )
  : null;

const BANNED = [
  {
    id: 'former-brokerage',
    // Matches the old brokerage name in any spacing/casing, with or without
    // the "Signature Realty" half, so a partial reintroduction is caught too.
    re: /royal\s*lepage|signature\s+realty/i,
    why: 'RECO: only "Cityscape Real Estate Ltd., Brokerage" may be named as the brokerage.',
  },
  {
    id: 'mojibake',
    re: /�/,
    why: 'U+FFFD replacement character — an encoding defect that renders as "?" in posts and emails.',
  },
  ...(TRREB_RE ? [{
    id: 'trreb-copy',
    re: TRREB_RE,
    why: 'A TRREB Market Watch figure hardcoded outside data/trreb.js. Import it from '
       + 'lib/market/trreb.js instead — a second copy goes stale on the next refresh and '
       + 'the site then contradicts itself in public.',
  }] : []),
];

const hits = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) { walk(full); continue; }
    if (!EXTS.test(entry) || ALLOWLIST.has(rel)) continue;
    let text;
    try { text = readFileSync(full, 'utf8'); } catch { continue; }
    for (const rule of BANNED) {
      // Fixtures are literals on purpose; a stale one fails its own test.
      if (rule.id === 'trreb-copy' && IS_TEST.test(entry)) continue;
      const lines = text.split('\n');
      lines.forEach((line, i) => {
        if (rule.re.test(line)) {
          hits.push({ file: rel, line: i + 1, id: rule.id, why: rule.why, text: line.trim().slice(0, 120) });
        }
      });
    }
  }
})(ROOT);

if (hits.length) {
  console.error('\n[31mCOMPLIANCE CHECK FAILED[0m — build stopped.\n');
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line}  [${h.id}]`);
    console.error(`    ${h.text}`);
    console.error(`    ${h.why}\n`);
  }
  console.error('Fix the source above. Stored blog posts in Supabase are handled separately by');
  console.error('lib/blog/sanitize-content.js (render-time) and the auto-blog cron (permanent rewrite).\n');
  process.exit(1);
}

console.log(
  `Compliance check passed — no banned brokerage name, no mojibake, ` +
  `no TRREB figure copied outside data/trreb.js (${TRREB_FIGURES.length} guarded).`
);
