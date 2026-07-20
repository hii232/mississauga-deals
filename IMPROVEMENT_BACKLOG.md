# Improvement Backlog

Shared work queue for the scheduled improvement agents. Pick ONE item per run, check it off, and log it. Add new findings as you audit. Keep this file honest — it is the coordination point between runs.

**Mission: investor leads and conversions.** See CLAUDE.md. Every run should make the site better at (in order): capturing/converting leads, showing correct investor data and calculations, sending great weekly emails/alerts, looking clean and trustworthy, and delivering real value to investors.

## How to pick

Priority order: (1) anything broken or misleading — especially wrong numbers, (2) lead capture & conversion friction, (3) email/alert quality, (4) data & investor value, (5) design polish and SEO. Skip items marked in-progress by a run from the last 3 hours.

## 1 — Leads & conversion

- [ ] Map every lead-capture path end to end (lead form, alerts subscribe, newsletter subscribe, booking): submit each one locally and verify validation, success/error feedback, double-submit protection, and that the lead actually lands in the right table
- [ ] Consistent CTA hierarchy on listing detail — one primary action per screen (book viewing / get analysis / save search); make the primary CTA sticky on mobile
- [ ] Exit-intent / scroll-depth email capture on high-traffic pages (homepage, listing detail, blog posts) — tasteful, once per session, no popup spam
- [ ] Newsletter/alerts signup friction: count taps from homepage to subscribed; get it to ≤2
- [ ] Lead magnets: gate the highest-value tools (cash-flow report download, sold comps, estimated value) behind email capture with clear value promise
- [ ] Every blog post and guide ends with a contextual CTA (alerts for that neighbourhood / calculator / contact)
- [ ] Admin leads dashboard: make sure every capture source is visible, deduped, and exportable so no lead is lost

## 2 — Data & calculations (must be PERFECT)

- [ ] Audit mortgage calculator math: payment formula, land transfer tax (Ontario + Toronto municipal where applicable), CMHC insurance tiers and 25yr max amortization rule, stress-test qualifying rate; add plain-language explanation of each number
- [ ] Audit every derived number on listing cards/detail (price per sqft, estimated cash flow, cap rate, deal score): verify formulas, guard divide-by-zero/missing data, never display NaN/undefined/absurd values — hide a stat rather than show a wrong one
- [ ] Rental comps and sold comps: sanity-check filtering logic (right property type, radius, recency) and label data freshness ("based on N sales in last 90 days")
- [ ] Market-pulse stats: verify aggregation math, show data-as-of dates, handle thin-data months gracefully
- [ ] Estimated-value API: validate methodology, show confidence/range not false precision
- [ ] Add investor metrics where missing: cash-on-cash return, break-even rent, monthly carrying cost breakdown on listing detail

## 3 — Weekly emails & alerts

- [ ] Weekly newsletter template: audit HTML for email-client compatibility (table layout, inline styles, dark-mode safe, <600px wide), test-render the generated HTML
- [ ] Newsletter content quality: leads with the best deals + one useful market stat; subject lines specific not clickbait; correct unsubscribe link in every send
- [ ] Deal alerts: verify matching logic against saved filters (no misses, no floods), cap per-email volume, dedupe listings already sent
- [ ] Alert/newsletter emails: every listing links back with UTM params so conversions are attributable
- [ ] Double-opt-in or at least confirmation email with expectation-setting ("what you'll get, how often")

## 4 — Design & trust

- [ ] Audit every public page at 375px and 768px for overflow, tap targets, layout breaks (homepage/listings done ~Jul 19; do blog, market-pulse, mortgage-calculator, gta, precon, auth)
- [ ] Trust signals near every capture form: what happens with the email, frequency, easy unsubscribe; realtor/brand identity consistent site-wide
- [ ] Error/empty/loading states everywhere data is fetched — no blank screens, no raw error text
- [ ] Accessibility: labels, focus states, contrast on navy/accent, keyboard nav on mega-menu
- [ ] Performance: next/image everywhere, dynamic-import leaflet/markdown, LCP/CLS on homepage and listing detail

## 5 — Investor value & SEO

- [ ] Neighbourhood guides: each has real investor data (avg price, rent, cap rate trend) not filler; interlink with listings and alerts CTA
- [ ] Blog/auto-blog: content answers real investor questions (financing, pre-con vs resale, tax); every post has metadata, structured data, internal links
- [ ] Metadata audit: unique title/description per route, OG images, canonicals; RealEstateListing/Article/BreadcrumbList JSON-LD; sitemap covers all public routes
- [ ] Market data pages target searchable queries ("Mississauga condo prices 2026") with fresh data

## Code health (background priority)

- [ ] Dedupe repeated fetch/format helpers across `app/api/*` into `lib/`
- [ ] API routes: consistent error handling, no leaked stack traces, correct cache headers
- [ ] Verify auth actually protects every `app/api/admin/*` and `(admin)` page
- [ ] Remove dead code/unused deps

## Needs Hamza

(Items blocked on credentials, accounts, or product decisions — agents: add here, don't guess.)

- Email sending provider/credentials for newsletter+alerts (verify what's configured in production — RESEND/SMTP key?); agents can perfect templates and logic but can't verify real delivery without it

## Run Log

(append one line per run: date — what changed — commit)

- 2026-07-20 — Bootstrap: CLAUDE.md + backlog created, 24/7 routine scheduled; fixed env-less build in alerts routes — 47b196f
- 2026-07-20 — Refocused mission on investor leads/conversions; restructured backlog around 5 goal areas — (this commit)
