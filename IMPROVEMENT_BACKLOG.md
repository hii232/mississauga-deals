# Improvement Backlog

Shared work queue for the scheduled improvement agents. Pick ONE item per run, check it off, and log it. Add new findings as you audit. Keep this file honest — it is the coordination point between runs.

## How to pick

Priority order: (1) anything broken or misleading to users, (2) conversion/lead-gen friction, (3) SEO/performance, (4) polish. Skip items marked in-progress by a run from the last 3 hours.

## Correctness & UX

- [ ] Audit every public page at 375px and 768px for overflow, tap-target size, and layout breaks (homepage and listings were done ~Jul 19; do blog, market-pulse, mortgage-calculator, gta, precon, auth pages)
- [ ] Verify all internal links and CTAs resolve (no 404s, no dead anchors) across public pages
- [ ] Error/empty/loading states: every page that fetches data should show something sensible when the API returns nothing or fails
- [ ] Forms (lead, alerts subscribe, newsletter, signup/login): validate inputs, show clear success/error feedback, prevent double-submit
- [ ] Accessibility pass: alt text, form labels, focus states, contrast on navy/accent combos, keyboard nav on the mega-menu

## Conversion & trust

- [ ] Consistent CTA hierarchy on listing detail (book viewing / get analysis / save) — one primary action per screen
- [ ] Social proof: surface stats (listings tracked, alerts sent) where they build trust; no fabricated numbers
- [ ] Newsletter/alerts signup friction audit: how many taps from homepage to subscribed?
- [ ] Mortgage calculator: verify math (land transfer tax incl. Toronto municipal, CMHC insurance tiers, stress test rate) and add shareable results

## SEO & performance

- [ ] Metadata audit: unique title/description per public route, OG images render, canonical URLs correct
- [ ] Structured data: RealEstateListing/Article/BreadcrumbList JSON-LD where applicable; validate shapes
- [ ] Sitemap covers all public routes incl. blog posts and neighbourhood guides; robots sane
- [ ] Image optimization: next/image everywhere user-facing, correct `sizes`, lazy loading below the fold
- [ ] Bundle check: no client component importing heavy libs (leaflet, markdown) into routes that don't need them; dynamic-import maps
- [ ] Core Web Vitals pass on homepage and listing detail (LCP element, CLS from images/ads, font loading)

## Code health

- [ ] Dedupe repeated fetch/format helpers across `app/api/*` into `lib/`
- [ ] Consistent error handling + no leaked stack traces in API route responses; correct cache headers per route
- [ ] Admin routes: verify auth middleware actually protects every `app/api/admin/*` and `(admin)` page
- [ ] Remove dead code/unused deps; check `@types/leaflet` (TS types in a JS project)

## Needs Hamza

(Items blocked on credentials, accounts, or product decisions — agents: add here, don't guess.)

## Run Log

(append one line per run: date — what changed — commit)

- 2026-07-20 — Bootstrap: CLAUDE.md + backlog created, 24/7 routine scheduled — (this commit)
