# Mississauga Deals — mississaugainvestor.ca

Next.js 14 (App Router, JS not TS) + Tailwind + Supabase real-estate deals site for Mississauga and the GTA. Listings come from the PropTx/AMPRE OData feed; expert analysis uses the Anthropic API.

## Mission (judge every change against this)

The site exists to **generate investor leads and convert them**. In priority order:

1. **Leads & conversions** — every page should move a visitor toward leaving their email or booking: alerts, newsletter, lead forms, viewing requests. Remove friction, never break a capture path.
2. **Great data & perfect calculations** — investors trust numbers. Cap rates, cash flow, mortgage/land-transfer/CMHC math, price history, comps, market stats must be correct, sourced, and clearly presented. A wrong number is the worst bug on this site.
3. **Great weekly emails & alerts** — the newsletter and deal alerts are the retention engine. They must render well in email clients, contain genuinely useful deals/data, and never spam.
4. **Great design** — clean, trustworthy, fast, mobile-first (~375px). Design serves conversion, not decoration.
5. **Investor value** — analysis, guides, and tools that make an investor smarter: that's what earns the email address.

## Layout

- `app/(public)/` — public pages: homepage, `gta`, listing detail, blog, market-pulse, mortgage-calculator, recent, profile
- `app/(auth)/` — login/signup (Google Sign-In; Supabase optional with localStorage fallback)
- `app/(admin)/admin/` — admin dashboard: leads, blog, precon, analytics
- `app/api/` — route handlers (listings, photos, alerts, newsletter, auto-blog, admin, tracking)
- `components/` — shared UI; `lib/` — data/api helpers; `supabase/` — SQL/migrations
- Brand: navy primary with accent palette defined in `tailwind.config.js`; keep it consistent

## Conventions

- Plain JavaScript, no TypeScript. Match existing file style.
- Server components by default; `'use client'` only where needed.
- Secrets come from env (see `.env.example`) — never hardcode keys, and code must degrade gracefully when env vars are absent (builds run without secrets).
- Mobile-first: the site gets most traffic at ~375px width. Check small screens for any UI change.
- SEO matters commercially: keep metadata, structured data, sitemap, and internal links correct on public pages.

## Market data (TRREB) — refresh process

The monthly sold/volume/YoY figures in `app/api/market-stats/route.js` are **transcribed by hand** from TRREB's Market Watch PDF. TRREB publishes no API or feed, so nothing refreshes them automatically — they once sat five months stale while the market pages, weekly newsletter and every auto-generated blog post quoted them as current.

- TRREB releases each month's report in the first few days of the following month (June 2026 → released 3 Jul 2026): https://trreb.ca/market-data/market-watch/
- To refresh: Hamza uploads the PDF, then run **`scripts/trreb-extract.py`** — it reads every Mississauga row and prints them already shaped like the literals in `market-stats/route.js`, so the only manual step is pasting.
  ```
  python3 -m venv .venv && ./.venv/bin/pip install pypdf
  ./.venv/bin/python scripts/trreb-extract.py ~/Downloads/mw2607.pdf
  ```
  It exits non-zero and refuses to print a paste block if anything fails to verify. **Do not transcribe past a refusal** — it means the PDF's layout moved and the numbers may be landing under the wrong property type.
- Doing it by hand instead: use `pypdf` with `extraction_mode='layout'` (the default scrambles columns). Mississauga rows are on page 3 (all types) and the per-type pages (7 detached, 9 semi, 11 Att/Row/Townhouse, 13 condo townhouse, 15 condo apartment); GTA summary and economic indicators are on page 1. **Those page numbers are a hint, not a contract** — page 5 is a year-to-date summary that also carries a Mississauga row, so counting Mississauga-bearing pages in order silently maps detached figures onto semis. The script identifies each page by matching its TRREB-wide sales total against the per-type totals on page 2 rather than trusting position; do the same if you work by hand.
- Update `tRREBMonth` **and** `tRREBAsOf` together, plus the `disclaimer` string.
- `tRREBFreshness()` (in **`lib/market/trreb-freshness.js`**, re-exported by the route so it stays unit-testable) derives `tRREBMonthsBehind` / `tRREBReportsBehind` / `tRREBIsStale` / `tRREBRefreshNote` from `tRREBAsOf`.
  - **Stale means a PUBLISHED report has not been ingested, not "N calendar months old."** Month M's report is treated as available only once day `PUBLICATION_GRACE_DAY` (8) of M+1 has passed. The old `monthsBehind >= 2` rule flipped to stale on the 1st of the month, days before the new report could exist - on 2026-08-05 it asked Hamza for a July PDF TRREB had not released. This flag is the only guard against the five-month drift below, and one that cries wolf every month-turn is one people stop reading.
  - `tRREBMonthsBehind` keeps its literal calendar-age meaning: `/api/broadcast/offer-picks` refuses to price offers above 3, and the admin banner displays it. Only the stale verdict changed.
  - The admin dashboard shows a "Need new market data" banner when stale, and a monthly Routine pings Hamza on the 5th - which now correctly stays silent when the new report is not out yet.
- **Never estimate, scrape or interpolate these numbers.** If a figure isn't in the report, omit it or leave it clearly labelled as approximate. Market Watch publishes no per-municipality YoY — the per-type `yoy` values are GTA-wide and must stay labelled as such.

## Verification

- `npm run build` must pass before any commit. There is no test suite; the build is the gate.
- For UI changes, sanity-check the affected page renders (`npm run dev` + fetch, or Playwright with `/opt/pw-browsers/chromium`).

## Continuous improvement protocol (scheduled agent runs)

Automated sessions run around the clock on branch `claude/website-agents-24-7-dklbcl`. Each run must:

1. `git fetch origin claude/website-agents-24-7-dklbcl && git checkout -B claude/website-agents-24-7-dklbcl origin/claude/website-agents-24-7-dklbcl` (fall back to branching from `origin/main` if the branch is gone).
2. Read `IMPROVEMENT_BACKLOG.md`, check `git log --oneline -15` to see what recent runs did, and pick ONE focused, high-impact item not recently touched.
3. Keep the change small and shippable (roughly ≤300 changed lines). Perfect one detail per run rather than half-finishing five.
4. Run `npm run build`; fix or revert until it passes.
5. Update `IMPROVEMENT_BACKLOG.md`: check off what you did, add anything new you noticed, and append one line to the Run Log.
6. Commit with a clear message and push with `git push -u origin claude/website-agents-24-7-dklbcl`.
7. Never wait for user input; if an item needs credentials or a product decision, note it under "Needs Hamza" in the backlog and pick a different item.
