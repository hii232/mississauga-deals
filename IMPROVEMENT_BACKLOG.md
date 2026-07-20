# Improvement Backlog

Shared work queue for the scheduled improvement agents. Pick ONE item per run, check it off, and log it. Add new findings as you audit. Keep this file honest — it is the coordination point between runs.

**Mission: investor leads and conversions.** See CLAUDE.md. Every run should make the site better at (in order): capturing/converting leads, showing correct investor data and calculations, sending great weekly emails/alerts, looking clean and trustworthy, and delivering real value to investors.

## How to pick

Priority order: (1) anything broken or misleading — especially wrong numbers, (2) lead capture & conversion friction, (3) email/alert quality, (4) data & investor value, (5) design polish and SEO. Skip items marked in-progress by a run from the last 3 hours.

## 1 — Leads & conversion

- [x] Map every lead-capture path end to end (lead form, alerts subscribe, newsletter subscribe, booking): verified 2026-07-20 — /api/newsletter/subscribe and /api/lead both validate email (400 w/ message), succeed (200), degrade gracefully without env; alerts form has double-submit protection (disabled while loading). Fixed: alerts form now validates email format client-side and surfaces the server's error message instead of a generic failure. Booking path exercised 2026-07-20: validation order fixed (400s now precede DB check), no-DB fallback captures the booking via notification email instead of dropping it (503 only when no channel exists), email HTML now escapes user input
- [x] CTA hierarchy on listing detail 2026-07-20: page previously had NO booking/contact CTA at all. Added mobile sticky bottom bar (Book a Viewing primary + call icon, safe-area padded, under cookie-banner z-index) and a desktop Book a Viewing + Call pair beside the price, linking /book-call?listing={id}. NOTE: could not render with real listing data locally (AMPRE_TOKEN absent) — worth eyeballing on production after next release
- [ ] Exit-intent / scroll-depth email capture on high-traffic pages (homepage, listing detail, blog posts) — tasteful, once per session, no popup spam
- [ ] Newsletter/alerts signup friction: count taps from homepage to subscribed; get it to ≤2
- [ ] Lead magnets: gate the highest-value tools (cash-flow report download, sold comps, estimated value) behind email capture with clear value promise
- [ ] Every blog post and guide ends with a contextual CTA (alerts for that neighbourhood / calculator / contact)
- [ ] Admin leads dashboard: make sure every capture source is visible, deduped, and exportable so no lead is lost

## 2 — Data & calculations (must be PERFECT)

- [x] Mortgage calculator math audited 2026-07-20 — ALL VERIFIED against references: payment formula exact ($500K @ 5%/25yr = $2,908.02, semi-annual compounding), Ontario LTT brackets correct (marginal 0.5→2.5%), CMHC tiers correct (4.00/3.10/2.80% + 8% ON PST), stress test correct (max(rate+2%, 5.25%)), min down payment correct (5%/10%/20% tiers). FIXED: added warning when <20% down is paired with >25yr amortization (insured mortgages capped at 25yr except FTB/new builds). Plain-language explanations = the FAQ section added earlier today
- [ ] Audit every derived number on listing cards/detail (price per sqft, estimated cash flow, cap rate, deal score): verify formulas, guard divide-by-zero/missing data, never display NaN/undefined/absurd values — hide a stat rather than show a wrong one
- [ ] Rental comps and sold comps: sanity-check filtering logic (right property type, radius, recency) and label data freshness ("based on N sales in last 90 days")
- [ ] Market-pulse stats: verify aggregation math, show data-as-of dates, handle thin-data months gracefully
- [ ] Estimated-value API: validate methodology, show confidence/range not false precision
- [ ] Add investor metrics where missing: cash-on-cash return, break-even rent, monthly carrying cost breakdown on listing detail

## 3 — Weekly emails & alerts

- [x] Weekly newsletter template audited 2026-07-20: table layout + inline styles + 600px max all correct, UTM params and unsubscribe link present, user fields escaped. Added ?preview=1 test-render mode (dev-open, auth-gated in prod). FIXED: template fabricated stats when data was missing ("2,500+" active listings, avgDOM 28, sale-to-list 97.2%) and rendered "N/A" tiles — stat blocks now show only real data and hide themselves otherwise. Dark-mode-safe pass still open
- [ ] Newsletter content quality: leads with the best deals + one useful market stat; subject lines specific not clickbait; correct unsubscribe link in every send
- [ ] Deal alerts: verify matching logic against saved filters (no misses, no floods), cap per-email volume, dedupe listings already sent. AUDITED 2026-07-20: per-email dedupe + 15-listing cap + DOM≤3 freshness gate all correct, BUT the DOM≤3 window can resend the same listing up to 4 consecutive days — proper fix needs a sent-listings table (Supabase migration; product call on schema)
- [x] Alert/newsletter emails UTM attribution — complete 2026-07-20: newsletter already had UTM everywhere; daily alert email now tags listing links + CTA with utm_source=alerts&utm_medium=email&utm_campaign=daily-alert. Also escaped name/address interpolation in alert HTML
- [ ] Double-opt-in or at least confirmation email with expectation-setting ("what you'll get, how often")

## 4 — Design & trust

- [x] Audit every public page at 375px for overflow, tap targets, layout breaks — COMPLETE 2026-07-20: homepage, listings, mortgage-calculator, market-pulse, gta, blog, precon, auth all clean (no horizontal overflow). Issues found & fixed along the way: cookie banner size, market-pulse zero-stat, deal-screener zero-dashboard. (768px pass still open if wanted)
- [x] Trust signals near every capture form — verified/complete 2026-07-20: homepage EmailCapture ("no spam, unsubscribe anytime"), exit-intent popup ("free forever" + social proof), and /alerts form (added expectation-setting block: match-only emails, free, one-click unsubscribe, email never shared). Brand identity consistent
- [ ] Error/empty/loading states everywhere data is fetched — no blank screens, no raw error text
- [ ] Accessibility: labels, focus states, contrast on navy/accent, keyboard nav on mega-menu
- [ ] Performance: next/image everywhere, dynamic-import leaflet/markdown, LCP/CLS on homepage and listing detail

## 5 — Investor value & SEO

- [ ] Neighbourhood guides: each has real investor data (avg price, rent, cap rate trend) not filler; interlink with listings and alerts CTA
- [ ] Blog/auto-blog: content answers real investor questions (financing, pre-con vs resale, tax); every post has metadata, structured data, internal links
- [x] Metadata audit COMPLETE 2026-07-20: crawled all 21 public routes — every title unique; fixed 4 pages with doubled '| MississaugaInvestor.ca' brand suffix (news, score-methodology, privacy, terms) and gave /news a query-targeting title. OG/canonicals/JSON-LD/sitemap verified in earlier runs
- [ ] Market data pages target searchable queries ("Mississauga condo prices 2026") with fresh data

## Code health (background priority)

- [ ] Dedupe repeated fetch/format helpers across `app/api/*` into `lib/`
- [ ] API routes: consistent error handling, no leaked stack traces, correct cache headers
- [ ] Verify auth actually protects every `app/api/admin/*` and `(admin)` page
- [ ] Remove dead code/unused deps

## Needs Hamza

(Items blocked on credentials, accounts, or product decisions — agents: add here, don't guess.)

- Email sending is **Resend** (Supabase only stores subscribers/searches). Hamza: confirm in Vercel that `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set and the mississaugainvestor.ca domain is verified in the Resend dashboard, and that Vercel Cron is configured to hit `/api/alerts/send` (daily) and `/api/newsletter/weekly` with `CRON_SECRET`. Agents: templates/logic can be perfected without these, but real delivery can't be verified.

## Run Log

(append one line per run: date — what changed — commit)

- 2026-07-20 — Bootstrap: CLAUDE.md + backlog created, 24/7 routine scheduled; fixed env-less build in alerts routes — 47b196f
- 2026-07-20 — Refocused mission on investor leads/conversions; restructured backlog around 5 goal areas — 3854e8b
- 2026-07-20 — CRITICAL FIX: daily alert emails + SEO ping crons never ran (Vercel Cron uses GET, routes only exported POST); added GET handlers. Documented all real env vars in .env.example (email = Resend, not Supabase) — 04175b7
- 2026-07-20 — [seo agent] Added app/robots.js: robots.txt with sitemap pointer, disallow /api/ + /admin/, noindex pages left crawlable so the directive stays visible. NOTE: routines now fire into the persistent agent session (fresh-session routine runs were silently failing; rebuilt as persistent_session_id triggers) — c59cd4e
- 2026-07-20 — [design agent] 375px audit of mortgage-calculator (clean — no overflow, good hierarchy); compacted site-wide cookie banner from ~185px to 100px tall on mobile (one-line copy, inline buttons, same consent options + PIPEDA note) so it stops covering a quarter of every page — d9df3d4
- 2026-07-20 — [seo agent] BreadcrumbList JSON-LD added to listing detail + blog post pages (highest-traffic page types; only neighbourhoods/about had it — blog even showed a visible breadcrumb with no schema) — 52b0a32
- 2026-07-20 — [improvement agent] Fixed dead-end "Sign Up Free" CTAs in InlineCTA: alerts variant pointed to /quiz and newsletter variant to /listings — neither has a signup form; both now go to /alerts (real name+email capture). Verified cap-rate/CoC/LTT engine guards divide-by-zero and Ontario LTT brackets are correct — 9b6cbdd
- 2026-07-20 — [design agent] 375px audit of market-pulse (no overflow, chart fine); hid the Active Listings tile when the stats API returns no count — it rendered "0 on market", which reads as broken data. NEW FINDING for improvement agent: market-pulse fallbacks are hardcoded TRREB Feb 2026 numbers (sales 345, new listings 940, mortgage rates) — need a data-freshness pass or "as of" labels — 82032dc
- 2026-07-20 — [seo agent] Listing-detail gallery CWV/image-SEO: hero img (LCP) now fetchPriority=high + decoding=async, thumbnails lazy-loaded, alt text upgraded from "Property photo"/"Thumbnail N" to address-based. Verified canonicals complete (only noindex pages lack them, correct) and OG images covered site-wide — 396a051
- 2026-07-20 — [improvement agent] Market-pulse data transparency: subtitle no longer claims "updated regularly"; now states sources honestly (live MLS + TRREB Market Watch) and shows the TRREB data month from the API (tRREBMonth). Rates card already carried a verify-with-broker caveat. Remaining: refresh the hardcoded TRREB Feb 2026 numbers when March+ Market Watch data is added to /api/market-stats — 3901b14
- 2026-07-20 — [design agent] 375px audit of gta + blog (no overflow on either; blog empty state fine). Deal Screener no longer renders an all-zero dashboard ("0 deals, 0.0% best cap, +$0/mo") before data loads or when filters match nothing: skeleton tiles while loading, plain guidance message when empty, header count chips hidden until real — 3140b7f
- 2026-07-20 — [seo agent] HST-rebate landing page (high search volume: "HST rebate new homes Ontario"): added FAQPage JSON-LD (5 Q&As mirroring on-page content — savings tiers, eligibility, dates, resale exclusion, property types) + BreadcrumbList. Page previously had zero structured data — decaa4c
- 2026-07-20 — [improvement agent] Lead-capture path verification: exercised /api/newsletter/subscribe + /api/lead with valid/invalid/missing email (all correct: 200/400 with messages, graceful without env). Fixed /alerts form: client-side email format validation + surface server error text instead of generic "Something went wrong" — de57817
- 2026-07-20 — [design agent] 375px audit finished (precon + login clean → item checked off). Mega-menu keyboard a11y: Escape now closes from anywhere inside the menu and returns focus to the trigger; menu closes when keyboard focus leaves it (was stranding keyboard users with a stuck-open menu). Verified with Playwright keyboard simulation — 06e68b0
- 2026-07-20 — [seo agent] Mortgage calculator: added visible "How This Calculator Works" FAQ section (5 Q&As matching the implemented math: semi-annual compounding, CMHC tiers, stress test, min down payment, Ontario LTT) + FAQPage & BreadcrumbList JSON-LD. Targets "CMHC calculator"/"stress test"/"Ontario land transfer tax" queries; verified at 375px — ef8cfeb
- 2026-07-20 — [improvement agent] Bookings API hardening: validation now precedes the DB check (bad input gets a 400, not "Database not configured" 500); if the DB is down the booking falls back to the notification email so the hottest lead type is never silently lost (503 only when no capture channel exists); user-supplied fields escaped in notification email HTML. All verified with live requests — b86d5ce
- 2026-07-20 — [design agent] /alerts (main "Sign Up Free" CTA destination): added trust/expectation block beside the submit button — match-only emails, scored and analyzed, free forever, one-click unsubscribe, email never shared. Trust-signals backlog item now checked off across all capture forms; verified at 375px — (this commit)
- 2026-07-20 — [release] Shipped 7-commit daily release to production via PR #2 (merged 9b56023); release routine re-pointed to the shipping session using the PR+merge path, so the "blocked on main push" issue is resolved — no action needed from Hamza
- 2026-07-20 — [seo agent] Internal linking: listing detail pages now link the neighbourhood name to its /neighbourhoods/{slug} investor guide (when a guide exists) — funnels link equity from the highest-traffic pages into guide pages and gives buyers one-tap investor context — 15aa277
- 2026-07-20 — [improvement agent] Weekly newsletter: added ?preview=1 test-render mode and used it to catch + fix fabricated stats (hardcoded "2,500+" listings, avgDOM 28, 97.2% sale-to-list mailed as if live) and "N/A" tiles — every stat block now renders only real data and hides itself when data is missing — 3f8b835
- 2026-07-20 — [design agent] Listing detail had NO lead CTA: added mobile sticky "Book a Viewing" bar (+ tap-to-call) and desktop CTA pair beside the price → /book-call?listing={id}. Needs a production eyeball once shipped (no listing data available locally) — a5c30a1
- 2026-07-20 — [seo agent] Recent-sales page now targets "Mississauga sold prices {year}" queries: query-matching title/description with build-time year, added missing OG block, H1 upgraded from generic "Recent Sales". Verified rendered title locally — (this commit)
- 2026-07-20 — [improvement agent] Daily alert email: added UTM attribution to listing links + CTA (was fully untracked), escaped name/address in HTML. Audited matching: dedupe/cap/freshness correct; flagged DOM≤3 repeat-send gap (needs sent-listings table) — (this commit)
- 2026-07-20 — [design agent] Performance: MarkdownRenderer converted to a server component (react-markdown no longer ships to browsers on blog posts — /blog/[slug] page JS now 3.25 kB) + lazy/async in-article images. Verified leaflet map already dynamic-imported; blog routes render correctly — (this commit)
- 2026-07-20 — [hamza request] MailerLite replacement: FIXED broken weekly-email unsubscribe (?email= was rejected as "Missing search ID" — CASL blocker); unsubscribe links now HMAC-signed + RFC 8058 one-click List-Unsubscribe headers; weekly send excludes status=unsubscribed leads; new admin bulk-import endpoint /api/admin/newsletter-import (CSV or JSON, dedupes, never resurrects unsubscribes); premium template redesign (branded masthead, CAP/cash-flow chips on deals, Hamza signature block w/ book-a-call CTA, Outlook bgcolor fallbacks); verified at 375px via preview — (this commit)
- 2026-07-20 — [hamza request] Weekly newsletter now requires Hamza's approval before sending: Monday cron sends ONE draft to hamza@nouman.ca with an amber "DRAFT — waiting for your approval" banner + Review & Approve button; button opens a token-authed confirm page; only the confirm POST sends to subscribers (prefetch-safe); newsletter_sends migration makes approval idempotent (no double sends). Preview mode unchanged — (this commit)
- 2026-07-20 — [hamza request] New professional headshot deployed site-wide (public/images/hamza-headshot.jpg): square face-crop from Hamza's uploaded photo, optimized 4.5MB→26KB (big homepage LCP win). Used by homepage bio, about page, newsletter signature, and Person JSON-LD — (this commit)
- 2026-07-20 — [seo agent] Metadata audit finished: crawled all 21 public routes, all titles unique; de-duplicated brand suffix on 4 pages and upgraded /news title to target GTA real-estate-news queries — (this commit)
- 2026-07-20 — [improvement agent] Mortgage calculator math audit: every formula hand-verified against known references (payment $2,908.02 reference exact, LTT/CMHC/stress/min-down all correct); added insured-amortization-cap warning for <20% down + >25yr combos — (this commit)
