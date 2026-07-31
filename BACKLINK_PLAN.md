# Backlink Plan — mississaugainvestor.ca

**Why this file exists:** the 2026-07-30 Seobility audit scored the site 77% overall
with meta data 99% and page structure 100%, but **external factors at 3%** — the whole
domain has **2 backlinks from 1 referring domain**. On-page SEO is essentially
exhausted; this is where the remaining ranking upside is, and no code change can move it.

**Agents: do NOT act on this file.** No link-exchange sections, no directory
auto-submission, no purchased links, no comment-spam. Every item here is a human
action by Hamza. Agents may only keep the NAP block below in sync with the site.

---

## The exact NAP — copy this verbatim, every time

Search engines treat name/address/phone as an identity fingerprint. Inconsistent
variants (an abbreviated street, an old suite number, a different phone format) read
as *different businesses* and dilute the signal. Use this exact block everywhere:

```
Hamza Nouman, Sales Representative
Cityscape Real Estate Ltd., Brokerage
885 Plymouth Dr UNIT 2, Mississauga, ON L5V 0B5
647-609-1289
hamza@nouman.ca
https://www.mississaugainvestor.ca
```

> **Known inconsistency to fix first.** The realtor.ca profile currently declared in
> the site's own schema carries a *different* address — `201-30 Eglinton Ave West,
> Mississauga, L5R 3E7` — than the NAP above. One of the two is stale. Decide which is
> current, then make them match. This one is worth doing before any new submissions,
> because every new listing built on the wrong address multiplies the problem.

---

## Tier 1 — Profiles you already own (do these first, nothing blocks you)

`components/seo/json-ld.js` already tells Google these six properties are *you*
(`sameAs`). If they don't link back, that relationship is one-directional and mostly
wasted. Each of these is an edit to a profile you already control:

- [ ] **cityscaperealestate.ca** — your brokerage site. An agent bio page linking to
      mississaugainvestor.ca is the single highest-value link available: same industry,
      same city, genuinely related. Ask whoever runs the site.
- [ ] **hamzahomes.ca** — your other site. Link it here (and consider whether two sites
      competing for the same queries is what you want long-term — see "Watch out" below).
- [ ] **realtor.ca agent profile** — add the website field. Fix the address first.
- [ ] **LinkedIn** (`/in/homeswithhamza/`) — Website field in the intro section, plus a
      link in the About text. Both are `nofollow`, but they drive real referral traffic
      and Google uses them for entity confirmation.
- [ ] **Facebook** (`/Homeswithhamza/`) — Page → About → Website.
- [ ] **homefinder.ca** (`/agents/494937-hamza-nouman`) — website field.

- [ ] **Google Business Profile** — not in `sameAs` yet and the most important one on
      this page for local search. If you don't have one, create it; if you do, verify
      the website URL points at mississaugainvestor.ca and the NAP matches exactly.
      Add the site to the "Website" field *and* post occasionally with links.

---

## Tier 2 — Local Mississauga / Peel (relevance beats volume)

A link from a Mississauga organisation is worth far more for "Mississauga investment
property" queries than a generic national directory.

- [ ] **Mississauga Board of Trade** — member directory listing (membership required).
- [ ] **BIA directories** — Port Credit BIA, Streetsville BIA, Clarkson BIA, Malton BIA.
      Business listings are often free or low-cost to local businesses.
- [ ] **Mississauga.com / Insauga** — local news. Being *quoted* as a local
      investment-market source is the goal, not a paid ad. See Tier 4.
- [ ] **Chamber / community association** listings for the neighbourhoods you farm.

## Tier 3 — Industry & credential

- [ ] **RECO** — confirm the public register entry is accurate and carries your site if
      the field exists.
- [ ] **TRREB member profile** — website field.
- [ ] Real-estate directories that allow a genuine agent profile with a website field.

## Tier 4 — Earned (slowest, strongest)

These are the links that actually move a domain, because they're editorial:

- [ ] **Guest posts** on GTA investing / personal-finance sites. Your differentiator is
      real: you publish cash flow, cap rate and a transparent scoring methodology on
      every listing. Pitch the *method*, not the brokerage.
- [ ] **Be a source for local journalists** — Insauga, Mississauga News, and national
      outlets covering GTA affordability all quote agents. Sign up for a source-request
      service or pitch directly with a specific data point.
- [ ] **Volition / Durham REI appearances** (already in the backlog under Needs Hamza) —
      event and speaker pages almost always link out.
- [ ] **Podcast appearances** on Canadian real-estate investing shows — show notes link.

---

## What to link TO — stop sending everything to the homepage

A profile "website" field should point at the homepage. Everything else should deep-link
to the page that actually answers the query, which spreads authority across the site and
converts better:

| Context | Link to |
|---|---|
| Bio / profile website field | `/` |
| "I analyse cash flow" | `/score-methodology` |
| Anything about second suites | `/legal-second-unit-mississauga` |
| Rent-vs-buy discussion | `/rent-vs-buy-mississauga` |
| Neighbourhood-specific | `/neighbourhoods/<slug>` (24 pages) |
| Beyond Mississauga | `/gta/<city>` (28 pages) |
| Seller-side | `/sell` |

---

## Ready-to-paste copy

**Short (under 160 chars — directory fields):**
> Mississauga investment property analysis: every MLS listing scored for cash flow, cap
> rate and ROI. Hamza Nouman, Sales Representative, Cityscape Real Estate Ltd.

**Medium (~300 chars):**
> MississaugaInvestor.ca scores every active Mississauga and GTA listing for cash flow,
> cap rate and cash-on-cash return, with the assumptions behind every number published
> openly. Built by Hamza Nouman, Sales Representative with Cityscape Real Estate Ltd.,
> Brokerage, for investors who want the math before the showing.

**Long (bio / guest-post byline):**
> Hamza Nouman is a Sales Representative with Cityscape Real Estate Ltd., Brokerage in
> Mississauga. He built MississaugaInvestor.ca, which analyses every active MLS listing
> across Mississauga and the GTA for cash flow, cap rate and cash-on-cash return —
> costing each property with its own municipal tax rate and publishing the full scoring
> methodology rather than asking investors to trust a black box.

---

## Watch out

- **Never buy links, join link exchanges, or use a PBN.** Google's link-spam policies
  treat these as manipulation, and a manual action is far worse than 2 backlinks.
- **Don't mass-submit to low-quality directories.** Twenty junk directories are worth
  less than one Mississauga Board of Trade listing and can look like a link scheme.
- **hamzahomes.ca vs mississaugainvestor.ca** — if both target the same queries they
  compete with each other. Worth deciding which is the primary property and having the
  other link to it rather than duplicate it.
- **Realistic timeline:** links take weeks-to-months to affect rankings. Tier 1 could be
  done in an afternoon and is the fastest measurable change.

---

## Tracking

Re-run the Seobility check monthly and watch **referring domains**, not total backlinks —
50 links from 1 domain is one signal. Google Search Console → Links → External links is
the authoritative view. Baseline at 2026-07-30: **2 backlinks / 1 referring domain**.

| Date | Referring domains | Notes |
|---|---|---|
| 2026-07-30 | 1 | Seobility baseline |
