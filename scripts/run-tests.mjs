#!/usr/bin/env node
/**
 * Runs every `*.test.mjs` in the repo and fails on the first red one.
 *
 * These tests existed before this runner did — sixteen files, ~575 checks —
 * but nothing ran them together and nothing ran them automatically, so CLAUDE.md
 * accurately said "there is no test suite; the build is the gate." Which meant
 * the guards on the market data, the email sends and the SEO rules were only
 * consulted when someone remembered the filename.
 *
 * `npm run build` runs this first now. A guard nobody runs is not a guard.
 *
 * Each test file is its own process on purpose: they are plain scripts that
 * print a summary and exit non-zero, with no shared harness to trip over, and
 * one file crashing cannot take the rest down with it.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'out', 'dist', '.vercel']);

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full);
    else if (entry.endsWith('.test.mjs')) files.push(relative(ROOT, full));
  }
})(ROOT);

if (files.length === 0) {
  console.error('No *.test.mjs files found — that is almost certainly a bug in this runner.');
  process.exit(1);
}

let checks = 0;
const failed = [];

for (const f of files) {
  // MODULE_TYPELESS_PACKAGE_JSON fires for every lib/*.js the tests import
  // (the package has no "type": "module"); it is noise, not a finding.
  const res = spawnSync(process.execPath, [f], {
    encoding: 'utf8',
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  const out = `${res.stdout || ''}${res.stderr || ''}`.trim();
  const summary = out.split('\n').find((l) => /^(PASSED|FAILED)/.test(l)) || '';
  const n = summary.match(/(\d+) checks? passed/);
  if (n) checks += Number(n[1]);

  if (res.status === 0) {
    console.log(`  ok   ${f.padEnd(46)} ${summary}`);
  } else {
    failed.push(f);
    console.error(`  FAIL ${f}`);
    console.error(out.split('\n').map((l) => `       ${l}`).join('\n'));
  }
}

if (failed.length) {
  console.error(`\n${failed.length} of ${files.length} test file(s) failed:`);
  for (const f of failed) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`\nAll ${files.length} test files passed (${checks} checks).`);
