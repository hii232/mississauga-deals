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
