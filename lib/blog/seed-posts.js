/**
 * Hand-written pillar posts, kept in the repo rather than typed into the admin
 * UI so they are reviewable, version-controlled, and can be corrected when the
 * market data moves.
 *
 * Every figure below is one the site itself publishes (TRREB Market Watch June
 * 2026 via /api/market-stats, HOOD_RENTS/HOOD_DATA in lib/constants.js, and the
 * rent model in lib/listings/process-listings.js). If you refresh the market
 * data, re-read the "As of" lines here - they name their month deliberately so
 * a reader can tell how current the analysis is.
 *
 * Publish with: POST /api/admin/blog/seed  (header: x-admin-key)
 * Existing slugs are skipped, so it is safe to re-run.
 */

const AS_OF = 'June 2026 TRREB Market Watch data';

export const SEED_POSTS = [
  // ─────────────────────────────────────────────────────────
  {
    slug: 'seven-bedroom-rooming-house-math-mississauga',
    title: 'The 7-Bedroom Cash Flow Math: Real or Fantasy?',
    category: 'Strategy',
    excerpt:
      'A $769K seven-bedroom detached showing +$869/mo makes experienced investors suspicious - and they are right to be. Here is exactly where that rent number comes from.',
    image_keywords: 'mississauga detached house, basement apartment, canadian suburb',
    content: `Every so often an investor emails me a screenshot of one of my own deal scores with a single line: *"there's no way."*

Usually it's a big-bedroom detached in Malton. Seven bedrooms, three baths, high six figures, and a cash flow number that looks impossible. Their instinct is that the model is renting bedrooms individually like a rooming house and calling it income.

That instinct is healthy. It's also, in this case, wrong - and the reason it's wrong is worth more to you than the deal itself.

## Where the number actually comes from

Take a real example shape: a seven-bedroom detached in Malton around $769,000, scoring about 6.9% on cap rate.

The model does **not** price seven bedrooms at seven rents. It does this instead:

| Component | Assumption | Monthly |
|---|---|---|
| Main unit (4 bed) | Malton 4-bed rent + detached premium | ~$3,900 |
| Legal basement (3 bed) | 3-bed self-contained suite | ~$2,000 |
| **Total** | | **~$5,900** |

Two units. Not seven rooms. A four-bedroom main floor and a three-bedroom basement apartment - which, if you have spent any time in Malton, Malton Woods, or the pockets around Goreway and Morning Star, you know is not exotic. It is close to the default configuration.

The bedroom count on the listing is the *sum of both units*. That is what makes it look alarming at a glance. A seven-bedroom house sounds like a boarding operation. A 4+3 duplex-style detached sounds like half the street.

## Why the distinction matters enormously

Rooming-house math and two-unit math are not the same business, and they don't carry the same risk:

**Rooming houses** need per-room leases, licensing in most municipalities, far more intense management, and they collapse to a fraction of projected income the moment occupancy dips. Seven rooms at $800 sounds like $5,600 until three rooms sit empty in February.

**A legal two-unit property** is two leases. Vacancy risk is chunky but rare. Financing treats it normally. Insurance treats it normally. The City treats it normally - *if the second unit is legal*.

That last clause is the entire deal.

## The question that actually decides it

Not "is the rent realistic?" - you can verify that in an afternoon on Facebook Marketplace and rentals.ca. The question is:

**Is the basement unit legal, or is it "potential"?**

The model distinguishes these. A registered second unit gets full credit. A basement that *could* become one gets discounted to about 85% of the same figure, because you are underwriting a renovation and an approval you do not yet have.

For a property to have a legal second unit in Mississauga it generally needs to satisfy the Second Unit registration requirements - separate entrance, fire separation, egress windows, ceiling height, parking. Retrofitting a non-conforming basement to that standard is routinely $40,000 to $80,000, and sometimes the ceiling height alone makes it impossible at any price.

So when a listing says "in-law suite" or "separate entrance," what you are reading might be:

- a registered second unit (income is real today),
- a functional-but-unregistered apartment (income is real but uninsurable and unfinanceable as income, and the City can order it closed), or
- a rec room with a side door (income is a renovation project).

Three completely different investments wearing the same listing description.

## How to check in about twenty minutes

1. **Ask the listing agent directly, in writing:** "Is the second unit registered with the City of Mississauga as a Second Unit?" A yes should come with paperwork.
2. **Look at the photos properly.** A legal suite has a real kitchen, a separate entrance that doesn't route through the main living space, and full-size egress windows in the bedrooms. Low ceilings and tiny windows are a hard stop.
3. **Price the retrofit before you offer**, not after. If the answer is "potential," the number you should be underwriting is 85% of that suite income *minus* the cost and time to get there.
4. **Verify the main-unit rent independently.** Search current Malton listings for a comparable 4-bedroom main floor. If they are asking $3,600 and my model says $3,900, adjust it down - the model is a starting point, not a comp.

## The honest limitations

I would rather you know these than discover them:

- Rent estimates are **neighbourhood-level, not property-level**. They cannot see that a kitchen is from 1988 or that the yard backs onto Highway 427.
- The suite income assumes the suite is *rentable now*. For "potential" it is discounted, but discounting is not the same as pricing your specific renovation.
- Cash flow assumes a mortgage rate around 4.9% on a five-year fixed - a realistic discounted contract rate, not the Bank of Canada posted rate. If your broker gets you something different, every number moves.
- Property tax is estimated from the purchase price. The actual bill can differ.

## So - real or fantasy?

Real, with conditions attached. The rent is two units, not seven rooms. The math holds if the second unit is legal and the main-floor rent survives contact with actual comps.

What makes a deal score useful is not that it is right. It is that it tells you **which single question to go answer**. For big-bedroom Malton detached, that question is always the same: *is the basement registered?*

Everything else is arithmetic.

## What this means for investors

- A high bedroom count is a signal to check the unit structure, not a red flag by itself.
- Legal beats potential by more than the price difference usually reflects.
- Underwrite "potential" suites at the discounted income **and** subtract your retrofit estimate - do not do only one.
- Verify the main-unit rent against live comps before you write an offer; that single number moves cap rate more than anything else on the page.

Every listing on MississaugaInvestor.ca now shows the assumed rent and its breakdown directly on the card, so you can audit the assumption before you trust the score. Browse the [current listings](/listings) or run your own numbers in the [mortgage calculator](/mortgage-calculator).

*Based on ${AS_OF}. Educational commentary from a licensed sales representative - not financial advice. Verify unit legality with the City of Mississauga and your own professionals before purchasing.*`,
  },

  // ─────────────────────────────────────────────────────────
  {
    slug: 'malton-investment-guide-2026',
    title: 'Malton Investment Guide 2026: Mississauga\'s Cash Flow Corner',
    category: 'Neighbourhood Guide',
    excerpt:
      'Malton has the highest rent yields in Mississauga and the slowest appreciation. That trade is the whole thesis - here are the numbers behind it.',
    image_keywords: 'malton mississauga, suburban homes canada, airport neighbourhood',
    content: `Malton is the part of Mississauga most investors skip and most cash-flow investors end up buying.

It sits in the northeast corner, wrapped around Pearson, cut off from the rest of the city by the 427 and the airport lands. It has the lowest entry prices in Mississauga and the highest gross rent yields. It also has the slowest price growth in the city. Every one of those facts is the same fact viewed from a different angle.

## The numbers

Malton's average price sits near **$618,000** against a Mississauga-wide average of **$1,014,120** - roughly 39% below the city. Gross rent yield runs around **5.1%**, the strongest in Mississauga. Days on market average about **62**, versus **29** citywide.

That last figure is the one people underweight. Homes in Malton take roughly twice as long to sell as the Mississauga average. On the way in, that is leverage - you can negotiate. On the way out, it is illiquidity.

## What rents look like

| Bedrooms | Typical monthly rent |
|---|---|
| 1 bed | ~$1,950 |
| 2 bed | ~$2,500 |
| 3 bed | ~$3,050 |
| 4 bed | ~$3,650 |
| 5 bed | ~$4,250 |

Detached homes carry a premium of roughly $250 over these figures; condo apartments sit about $150 below.

The reason Malton yields work is straightforward arithmetic: rents are only modestly below the Mississauga average while purchase prices are dramatically below it. Tenants in Malton are paying for proximity to employment - the airport, the logistics and warehousing belt along Airport Road, and the industrial corridor. That employment base does not care that the neighbourhood appreciates slowly.

## Who actually rents here

This matters more than the yield table. Malton's tenant base is heavily airport-adjacent: ground handling, cargo, hospitality, warehousing, trades, plus a large multi-generational immigrant community. It is also a genuine transit neighbourhood - Malton GO puts you into Union in roughly 35 minutes, and the bus network is dense by suburban standards.

Practically, that means:

- **Demand is steady and non-seasonal.** Airport employment does not follow the school calendar.
- **Multi-generational households are common**, which is why 4+ bedroom homes and second units rent well rather than sitting empty.
- **Tenants tend to stay.** Turnover costs are a real line item, and lower turnover is worth more than most spreadsheets credit.

## The second-unit question

Malton's investment case leans heavily on two-unit properties: a main floor plus a basement apartment. A 4-bed main at ~$3,900 with a 3-bed legal basement at ~$2,000 is roughly $5,900/month against a purchase price in the $700Ks. That is what produces the cap rates that make experienced investors squint.

It is legitimate - *if the suite is registered*. An unregistered basement is not income you can finance against or insure properly, and the City can order it closed. I wrote a full breakdown of how to verify this in [The 7-Bedroom Cash Flow Math](/blog/seven-bedroom-rooming-house-math-mississauga), and it is the single highest-value twenty minutes of diligence you can do on a Malton purchase.

## The honest downside

I would rather lose a deal than have you buy this blind:

**Appreciation is slow.** Malton's price growth trails the city. If your return model depends on the property being worth substantially more in five years, Malton is the wrong neighbourhood. This is an income play, and it should be underwritten as one.

**Aircraft noise is real and permanent.** Parts of Malton sit under approach paths. It is priced into the market already, but it also narrows your future buyer pool.

**Liquidity is thinner.** Sixty-two days on market average means exit takes planning. Do not buy here with a two-year horizon.

**The housing stock is older.** Much of it is 1960s–1980s. Budget for roofs, furnaces, windows, and electrical. A cap rate that ignores capital expenditure is a fiction.

## Who Malton is right for

An investor who wants monthly income, has a long horizon, is comfortable managing a two-unit property, and is honest with themselves that they are buying cash flow rather than appreciation.

It is a poor fit for anyone who needs the property to be liquid, or whose returns depend on price growth.

## What this means for investors

- Malton is the strongest yield in Mississauga at roughly 5.1%, at about 39% below the citywide average price.
- The yield depends materially on a **legal** second unit - verify registration before you underwrite the income.
- Budget for capital expenditure on 1960s–1980s stock; a cap rate without a capex line is not a real number.
- Plan a long hold. Sixty-two average days on market is fine going in and inconvenient going out.

See what's currently available and how each property scores on the [listings page](/listings), compare Malton against other areas in the [neighbourhood guides](/neighbourhoods/malton), or get new Malton deals emailed to you with [deal alerts](/alerts).

*Based on ${AS_OF} and MississaugaInvestor.ca's own neighbourhood dataset. Educational commentary from a licensed sales representative - not financial advice.*`,
  },

  // ─────────────────────────────────────────────────────────
  {
    slug: 'cooksville-hurontario-lrt-corridor-investing',
    title: 'Cooksville and the Hurontario LRT: What Transit Actually Changes',
    category: 'Neighbourhood Guide',
    excerpt:
      'The Hazel McCallion Line is the biggest structural change to Mississauga real estate in a generation. Here is what it realistically does to rents, values, and timing.',
    image_keywords: 'light rail transit toronto, mississauga city centre, urban transit',
    content: `Transit projects attract two kinds of bad analysis. One says a new line will transform everything and prices will run. The other says it is already priced in and there is nothing left. Both are lazy.

The Hurontario LRT - the Hazel McCallion Line - runs 18 kilometres up Hurontario from Port Credit GO to Steeles in Brampton, with 19 stops. Cooksville sits in the middle of it, at the intersection of the LRT and Cooksville GO.

Here is what I think it actually does, and what it does not.

## What transit reliably changes

The research on rapid transit and property values is reasonably consistent on a few points:

**Rents respond faster than prices.** A tenant makes a housing decision on a one-year horizon and will pay a premium for a shorter commute almost immediately once service is running. Owners take longer to reprice.

**The effect is sharply distance-limited.** The premium concentrates within roughly 500–800 metres of a station and decays quickly past that. A property "on the LRT corridor" that is a 20-minute walk from a stop is not on the corridor in any way a tenant cares about.

**Construction suppresses before service lifts.** Years of torn-up arterial road is a genuine drag on a neighbourhood. The recovery comes after service begins, not when the line is announced.

**It changes who rents, not just how much.** Reliable rapid transit widens the tenant pool to car-free households - a demographic that barely exists in most of suburban Mississauga.

## Why Cooksville specifically

Cooksville is the most interesting node on the line for an income investor, for reasons that have little to do with the LRT itself:

It is the **most affordable** part of central Mississauga. It has the **densest existing rental stock** in the city. It is where the LRT meets **Cooksville GO**, meaning a tenant gets both a local spine up Hurontario and a direct rail line into Union. And it already has the walkable, mixed-use, slightly scruffy character that transit-oriented neighbourhoods develop - it does not have to be invented.

Compare that to City Centre, which is also on the line and gets more attention. City Centre is condo-dominated, higher-priced, and its yields are compressed by high condo fees. Cooksville gives you more yield and more property-type options.

## What it does not do

**It does not make a bad property good.** A poorly configured unit near a station is still a poorly configured unit.

**It does not create appreciation on demand.** Mississauga is currently a buyer's market - inventory around 4.9 months, sales-to-new-listings near 35%, sale-to-list around 97%. Transit does not override the interest rate environment. With posted five-year fixed rates at 6.09% and realistic contract rates near 4.9%, financing costs are doing more to prices right now than any infrastructure project.

**It does not reward buying at any price.** The corridor premium is real but bounded. Overpaying for proximity is still overpaying.

## How to actually play it

**Walk the distance yourself.** Pull up the stop locations and measure. If it is more than about a ten-minute walk, do not pay a corridor premium.

**Favour rentability over resale story.** The reliable, near-term gain from transit is rent and reduced vacancy. Underwrite that. Treat any appreciation as upside you did not pay for.

**Look at parking honestly.** Transit access lets some tenants go car-free, which can make a unit with poor parking rentable that otherwise would not be. That is a genuine edge - but only within real walking distance.

**Do not underwrite the future.** If your numbers only work assuming rents rise 15% once service matures, you are speculating. Buy something that works at today's rent.

## The timing question

The honest answer is that timing infrastructure is hard and most people who try it do worse than people who simply buy a property that cash flows today.

What the current market gives you is not a transit story - it is negotiating room. Around 4.9 months of inventory and a 97% sale-to-list ratio means sellers are moving on price. That is a better reason to transact than a rail line.

## What this means for investors

- Rents move before prices; underwrite the rent, treat appreciation as unpaid-for upside.
- The premium is real within roughly 500–800m of a stop and fades fast - measure the actual walk.
- Cooksville offers better yield and more property types than City Centre for corridor exposure.
- Today's buyer's market gives you more negotiating leverage than the LRT gives you upside. Use it.

Browse current [Cooksville listings and scores](/listings), read the full [Hurontario LRT analysis](/hurontario-lrt-real-estate), or check where the market stands right now on [market data](/market-pulse).

*Based on ${AS_OF}. Educational commentary from a licensed sales representative - not financial advice.*`,
  },

  // ─────────────────────────────────────────────────────────
  {
    slug: 'best-cash-flow-neighbourhoods-mississauga-2026',
    title: 'Best Cash Flow Neighbourhoods in Mississauga (2026)',
    category: 'Market Analysis',
    excerpt:
      'Where the rent-to-price math actually works right now, why it works there, and the trade you are making in each area.',
    image_keywords: 'mississauga neighbourhood aerial, canadian suburb homes, real estate map',
    content: `Cash flow in Mississauga is not a matter of finding a secret neighbourhood. It is a matter of accepting a trade. Every area where the rent-to-price ratio works is an area giving something up - appreciation, liquidity, condition, or noise.

Here is where the math works as of ${AS_OF}, and what each one costs you.

## The market backdrop

Mississauga's average sale price is **$1,014,120**, median **$880,000**. There were **567 sales** in the month against **1,632 new listings** - a sales-to-new-listings ratio of about **35%**, which is firmly a buyer's market. Inventory sits near **4.9 months**, homes are averaging **29 days** to sell, and properties are trading at about **97%** of list.

Two things follow. First, you have negotiating room - a 97% sale-to-list ratio means offers below asking are being accepted routinely. Second, cash flow is hard, because financing is expensive: posted five-year fixed rates are 6.09%, with realistic discounted contract rates nearer 4.9%, and the stress test qualifying rate around 6.9%.

In that environment, the neighbourhoods that cash flow are the ones with the lowest price relative to rent.

## Where the math works

### 1. Malton - the yield leader

Average price near **$618,000**, gross rent yield around **5.1%** - the highest in the city, at roughly 39% below the citywide average price.

**The trade:** slow appreciation, about 62 days on market, aircraft noise in parts, and older housing stock that needs capital. This is an income play and nothing else. [Full Malton guide](/blog/malton-investment-guide-2026).

### 2. Cooksville - affordability plus transit

The most affordable part of central Mississauga, with the densest rental stock and both the Hurontario LRT and Cooksville GO.

**The trade:** you are buying into an area mid-transition. Condition varies enormously street to street, and the corridor premium only applies within genuine walking distance of a stop. [Full corridor analysis](/blog/cooksville-hurontario-lrt-corridor-investing).

### 3. Two-unit detached, almost anywhere

This is a *structure*, not a neighbourhood, and it is where most real Mississauga cash flow actually comes from. A main unit plus a legal basement suite roughly doubles the rent against a single purchase price.

A three-bedroom basement suite adds about **$2,000/month** if legal, or roughly 85% of that if it is a "potential" conversion you still have to execute.

**The trade:** two tenancies to manage, a higher capital budget, and complete dependence on the suite being registered. Verify before you underwrite.

### 4. Condo apartments - the honest counterpoint

Condo apartments are the most liquid and lowest-maintenance entry, with the June average sold price around **$525,000**.

**The trade:** condo fees. They are the reason condo cap rates compress. A $600/month fee is $7,200 a year straight off your net operating income, and fees rise. Condos can work, but they rarely lead on yield.

## What does not work right now

**Detached in the premium west end.** Detached homes averaged **$1,482,130** in June. At those prices, against rents that do not scale proportionally, cash flow is essentially unavailable without a substantial down payment. These are appreciation and lifestyle assets.

**Anything underwritten on the posted rate.** If you model at 6.09%, almost nothing in Mississauga cash flows. If you model at a realistic 4.9% contract rate, a reasonable amount does. Getting your actual rate from a broker before you shop is not administrative - it decides which neighbourhoods are even on your list.

## How to compare properly

Cap rate alone will mislead you, because it ignores the trades above. Look at least at:

- **Cap rate** - return independent of financing
- **Cash-on-cash** - what your actual invested capital earns
- **Days on market** in the neighbourhood - your future liquidity
- **Capital expenditure reserve** - 1960s stock is not the same asset as 2015 stock
- **Whether the rent assumption is credible** - every listing on this site shows the assumed rent and its breakdown on the card so you can check it

## What this means for investors

- Malton leads on yield; you pay for it in appreciation and liquidity.
- The reliable Mississauga cash flow structure is main unit + **legal** second suite, not a particular postal code.
- Condo fees, not price, are what kill most condo cap rates - model them explicitly.
- Get your real contract rate first. It determines which neighbourhoods can work at all.
- A 97% sale-to-list ratio and 4.9 months of inventory mean you can negotiate. Use it.

Compare every active listing by cap rate, cash flow, and deal score on the [listings page](/listings), see the full [neighbourhood rankings](/neighbourhoods), or check [current market data](/market-pulse).

*Based on ${AS_OF}. Educational commentary from a licensed sales representative - not financial advice.*`,
  },

  // ─────────────────────────────────────────────────────────
  {
    slug: 'hst-rebate-for-investors-explained-ontario',
    title: 'The HST Rebate on New Homes: What Investors Need to Know',
    category: 'Guide',
    excerpt:
      'The 2026 rebate is dramatically larger than the old one - but the rules on who qualifies are strict, and investors are where most people get it wrong.',
    image_keywords: 'new construction condo toronto, pre-construction building, canadian city',
    content: `The HST rebate on new housing changed substantially in 2026, and the change is large enough that it materially affects pre-construction math.

It is also the area where I see investors make the most expensive assumptions. So let me be precise about what the rebate is, and then very precise about who actually gets it.

## What the rebate is now

For a qualifying new home with an Agreement of Purchase and Sale signed between **April 1, 2026 and March 31, 2027**:

| Purchase price | Rebate |
|---|---|
| Up to $1,000,000 | Full 13% HST rebated - the 8% provincial portion plus the 5% federal portion, up to a combined **$130,000** |
| $1,000,000 – $1,500,000 | Flat **$130,000** |
| $1,500,000 – $1,850,000 | Declines from $130,000 down to $24,000 |
| Above $1,850,000 | The existing **$24,000** provincial rebate |

On an $850,000 new home, that works out to roughly $68,000 of provincial HST plus $42,500 federal - about **$110,500** back.

This is a far larger benefit than the pre-2026 regime, where the federal portion was capped low enough to be almost irrelevant on GTA pricing.

## The part that catches investors

Here is the rule that matters most, and it is not subtle:

**The full new-housing rebate is for buyers who intend to occupy the home as their primary residence** - themselves or an immediate family member.

If you are buying to rent it out, you do **not** claim the new housing rebate. You may instead be eligible for the **New Residential Rental Property Rebate (NRRPR)**, which is a different program with different mechanics:

- You typically **pay the full HST at closing** and apply for the rebate afterwards, rather than having the builder credit it against your purchase price.
- You generally must have a **signed one-year lease** with a tenant.
- You file within a defined window after closing.

The cash flow implication is significant. An end-user often sees the rebate applied by the builder at closing and never funds it. An investor frequently has to bring the full HST to closing and wait for the refund. On an $850,000 purchase, that is a six-figure timing difference in your capital requirement.

Plan for it. I have watched people discover this three weeks before closing.

## Where it goes badly wrong

**Claiming the wrong rebate.** If you sign the builder's rebate assignment declaring you will occupy the property, and you then rent it out, the CRA can reassess. They audit this. Interest and penalties follow, and the amounts are large because the rebate is large.

**Assuming assignment purchases work the same way.** Assignments have their own HST treatment and are a common trap.

**Forgetting HST is on top.** For a resale home, HST does not apply to the purchase price. For a new build, it does. If you compared a $900,000 new build to a $900,000 resale and treated them as equivalent, you mispriced the new build.

**Missing the filing window.** The rental rebate is not automatic. Nobody chases you for it.

## What this means for your numbers

For pre-construction underwriting:

1. Decide **honestly** at the outset whether this is an end-user purchase or a rental. That single answer determines which program applies and when you get the money.
2. If it is a rental, model the **full HST as a closing cost** and treat the rebate as a later refund, not a discount.
3. Confirm the **date on your Agreement of Purchase and Sale** - the enhanced rebate is tied to that window.
4. Get the treatment confirmed **in writing** by a real estate lawyer and your accountant before you firm up. Not by me, and not by the sales office.

## What this means for investors

- The 2026 rebate is genuinely large - worth over $100,000 on a typical GTA new build.
- The headline rebate is for **primary residences**. Investors use the separate rental property rebate.
- Investors usually fund the full HST at closing and recover it later - a major capital timing difference.
- The rebate window is tied to your APS signing date; confirm yours.
- Get written confirmation from a lawyer and accountant before firming up. This is the most expensive thing on this page to get wrong.

Read the detailed breakdown with current tiers on the [HST rebate page](/pre-construction/hst-rebate), see [pre-construction opportunities](/pre-construction), or run purchase numbers in the [mortgage calculator](/mortgage-calculator).

*Rebate figures reflect the program as announced for agreements signed between April 1, 2026 and March 31, 2027. This is educational commentary from a licensed real estate sales representative, not tax or legal advice - confirm your specific situation with a real estate lawyer and accountant.*`,
  },
];

export default SEED_POSTS;
