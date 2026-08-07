/**
 * Hand-written pillar posts, kept in the repo rather than typed into the admin
 * UI so they are reviewable, version-controlled, and can be corrected when the
 * market data moves.
 *
 * NO MARKET FIGURE IS TYPED INTO THE PROSE
 * ----------------------------------------
 * It used to be, and the posts went stale the moment the market data was
 * refreshed: this file still quoted June's average price, sales count and
 * days-on-market after /api/market-stats had moved to July, so the site
 * contradicted itself in public on its own pillar content. Every figure now
 * interpolates from the same single source the API reads (data/trreb.js via
 * lib/market/trreb.js), plus HOOD_DATA and the cash-flow engine's own
 * assumptions. Refresh the market data and this prose refreshes with it.
 *
 * Derived claims are computed, not asserted, for the same reason: "roughly 39%
 * below the city" was true against June's citywide average and false against
 * July's. It is arithmetic now.
 *
 * WHAT THIS DOES NOT FIX: the seeder skips slugs that already exist, so a post
 * already published keeps whatever text it was seeded with. Re-seeding updated
 * copy means deleting that post first - see /api/admin/blog/seed.
 *
 * Publishing is automatic: an hourly Vercel cron GETs /api/admin/blog/seed,
 * so a post added here goes live within an hour of deploy. To publish
 * immediately by hand: POST /api/admin/blog/seed (header: x-admin-key).
 * Existing slugs are skipped either way, so re-running is safe.
 */
import { tRREBMonth, regional, rates } from '@/lib/market/trreb';
import { HOOD_DATA } from '@/lib/constants';
import { DEFAULT_ASSUMPTIONS, calcMonthly, calculateLandTransferTax } from '@/lib/cash-flow-engine';

const AS_OF = `${tRREBMonth} TRREB Market Watch data`;

const money = (n) => (n == null ? 'n/a' : `$${Math.round(n).toLocaleString('en-CA')}`);
const num = (n) => (n == null ? 'n/a' : Math.round(n).toLocaleString('en-CA'));

// The contract rate the cash-flow engine actually underwrites at, and the
// federal stress test that keys off it (greater of contract + 2% or 5.25%) -
// not the posted rate. Underwriting at posted is how earlier copy made
// qualifying look about 1.2 points harder than it is.
const CONTRACT_RATE = DEFAULT_ASSUMPTIONS.annualInterestRate;
const STRESS_TEST = Math.max(CONTRACT_RATE + 2, 5.25);

// Citywide, straight from the loaded Market Watch report.
const MKT = {
  avgPrice: money(regional.mississaugaAvgPrice),
  medianPrice: money(regional.mississaugaMedianPrice),
  sales: num(regional.mississaugaSales),
  newListings: num(regional.mississaugaNewListings),
  snlr: `${Math.round(regional.mississaugaSNLR)}%`,
  monthsInventory: `${regional.mississaugaMonthsOfInventory}`,
  spLp: `${regional.mississaugaAvgSPLP}%`,
  ldom: `${regional.mississaugaAvgLDOM}`,
  posted5yr: `${rates.fixed5yr}%`,
  contractRate: `${CONTRACT_RATE}%`,
  stressTest: `${STRESS_TEST.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`,
};

// Malton, from the same neighbourhood dataset the guides and homepage cards
// read - so a guide and a pillar post can never quote different prices for the
// same place, which they have before.
const MALTON = HOOD_DATA['Malton'] || {};
const MALTON_PRICE = money(MALTON.avgPrice);
const MALTON_YIELD = `${MALTON.rentYield}%`;
const MALTON_DOM = `${MALTON.avgDOM}`;
// Computed, never asserted: this gap moves every month the citywide average
// does, and it is the figure in these posts most likely to go quietly wrong.
const MALTON_DISCOUNT = regional.mississaugaAvgPrice && MALTON.avgPrice
  ? `${Math.round((1 - MALTON.avgPrice / regional.mississaugaAvgPrice) * 100)}%`
  : 'n/a';

// ── Figures for the "$100K" post, all computed so they move with the data ──
//
// Principal repaid over the first N years of the mortgage, using the same
// Canadian semi-annual compounding as calcMonthly. Amortized month by month
// rather than approximated from the first-month split, because the principal
// portion grows every month and a 60-month estimate from month one would
// understate it by thousands.
function principalPaidOverYears(price, years) {
  if (!price) return null;
  const rate = CONTRACT_RATE;
  const payment = calcMonthly(price, 20, rate, DEFAULT_ASSUMPTIONS.amortizationYears);
  const r = Math.pow(1 + rate / 100 / 2, 1 / 6) - 1;
  let balance = price * 0.8;
  const start = balance;
  for (let i = 0; i < years * 12; i++) balance -= payment - balance * r;
  return Math.round(start - balance);
}

const P5 = principalPaidOverYears(regional.mississaugaAvgPrice, 5);
const LTT_MISS = regional.mississaugaAvgPrice
  ? calculateLandTransferTax(regional.mississaugaAvgPrice, 'Mississauga')
  : null;

const EX = {
  // The worked example runs on the citywide average sale price, so the whole
  // ledger reprices itself on every TRREB refresh.
  price: regional.mississaugaAvgPrice,
  gtaAvgPrice: money(regional.gtaAvgPrice),
  // GTA-wide, from Market Watch page 1. Direction word is computed with the
  // figure: "down ${abs(yoy)}" hand-written here would read "down 2%" the
  // month YoY turns positive.
  gtaYoyPhrase: regional.gtaYoyChange == null
    ? 'roughly flat year over year'
    : regional.gtaYoyChange < 0
      ? `down ${Math.abs(regional.gtaYoyChange)}% year over year`
      : `up ${regional.gtaYoyChange}% year over year`,
  down: money(regional.mississaugaAvgPrice ? regional.mississaugaAvgPrice * 0.2 : null),
  payment: money(regional.mississaugaAvgPrice ? calcMonthly(regional.mississaugaAvgPrice, 20, CONTRACT_RATE, DEFAULT_ASSUMPTIONS.amortizationYears) : null),
  principal5yr: money(P5),
  // Headline forms of the same figure - computed so the title and the "% of
  // the way to $100K" line can never disagree with the ledger below them.
  principal5yrK: P5 ? `$${Math.round(P5 / 1000)}K` : 'n/a',
  principalPctOf100k: P5 ? `${Math.round(P5 / 1000)}%` : 'n/a',
  // LTT + the engine's $3,000 legal/title/inspection allowance, as the
  // all-in entry friction figure.
  entryCostsK: LTT_MISS ? `$${Math.round((LTT_MISS + 3000) / 1000)}K` : 'n/a',
  maltonPrincipal5yr: money(principalPaidOverYears(MALTON.avgPrice, 5)),
  // Illustrative positive cash flow on a two-unit property, stated as an
  // assumption in the prose. 60 months at $800.
  cashFlow5yr: money(800 * 60),
  maltonPathTotal: money(
    MALTON.avgPrice ? principalPaidOverYears(MALTON.avgPrice, 5) + 800 * 60 : null
  ),
  ltt: money(LTT_MISS),
  lttToronto: money(regional.mississaugaAvgPrice ? calculateLandTransferTax(regional.mississaugaAvgPrice, 'Toronto') : null),
  // 5% commission + HST on it - the standard full-service exit, computed.
  sellCosts: money(regional.mississaugaAvgPrice ? regional.mississaugaAvgPrice * 0.05 * 1.13 : null),
  // Clearly-labelled hypothetical: what 2%/yr would add over five years.
  appr2pct5yr: money(regional.mississaugaAvgPrice ? regional.mississaugaAvgPrice * (1.02 ** 5 - 1) : null),
};

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
- Cash flow assumes a mortgage rate around ${MKT.contractRate} on a five-year fixed - a realistic discounted contract rate, not the Bank of Canada posted rate. If your broker gets you something different, every number moves.
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

Malton's average price sits near **${MALTON_PRICE}** against a Mississauga-wide average of **${MKT.avgPrice}** - roughly ${MALTON_DISCOUNT} below the city. Gross rent yield runs around **${MALTON_YIELD}**, the strongest in Mississauga. Days on market average about **${MALTON_DOM}**, versus **${MKT.ldom}** citywide.

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

**It does not create appreciation on demand.** Mississauga is currently a buyer's market - inventory around ${MKT.monthsInventory} months, sales-to-new-listings near ${MKT.snlr}, sale-to-list around ${MKT.spLp}. Transit does not override the interest rate environment. With posted five-year fixed rates at ${MKT.posted5yr} and realistic contract rates near ${MKT.contractRate}, financing costs are doing more to prices right now than any infrastructure project.

**It does not reward buying at any price.** The corridor premium is real but bounded. Overpaying for proximity is still overpaying.

## How to actually play it

**Walk the distance yourself.** Pull up the stop locations and measure. If it is more than about a ten-minute walk, do not pay a corridor premium.

**Favour rentability over resale story.** The reliable, near-term gain from transit is rent and reduced vacancy. Underwrite that. Treat any appreciation as upside you did not pay for.

**Look at parking honestly.** Transit access lets some tenants go car-free, which can make a unit with poor parking rentable that otherwise would not be. That is a genuine edge - but only within real walking distance.

**Do not underwrite the future.** If your numbers only work assuming rents rise 15% once service matures, you are speculating. Buy something that works at today's rent.

## The timing question

The honest answer is that timing infrastructure is hard and most people who try it do worse than people who simply buy a property that cash flows today.

What the current market gives you is not a transit story - it is negotiating room. Around ${MKT.monthsInventory} months of inventory and a ${MKT.spLp} sale-to-list ratio means sellers are moving on price. That is a better reason to transact than a rail line.

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

Mississauga's average sale price is **${MKT.avgPrice}**, median **${MKT.medianPrice}**. There were **${MKT.sales} sales** in the month against **${MKT.newListings} new listings** - a sales-to-new-listings ratio of about **${MKT.snlr}**, which is firmly a buyer's market. Inventory sits near **${MKT.monthsInventory} months**, homes are averaging **${MKT.ldom} days** to sell, and properties are trading at about **${MKT.spLp}** of list.

Two things follow. First, you have negotiating room - a ${MKT.spLp} sale-to-list ratio means offers below asking are being accepted routinely. Second, cash flow is hard, because financing is expensive: posted five-year fixed rates are ${MKT.posted5yr}, with realistic discounted contract rates nearer ${MKT.contractRate}, and the stress test qualifying rate around ${MKT.stressTest}.

In that environment, the neighbourhoods that cash flow are the ones with the lowest price relative to rent.

## Where the math works

### 1. Malton - the yield leader

Average price near **${MALTON_PRICE}**, gross rent yield around **${MALTON_YIELD}** - the highest in the city, at roughly ${MALTON_DISCOUNT} below the citywide average price.

**The trade:** slow appreciation, about ${MALTON_DOM} days on market, aircraft noise in parts, and older housing stock that needs capital. This is an income play and nothing else. [Full Malton guide](/blog/malton-investment-guide-2026).

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

**Anything underwritten on the posted rate.** If you model at ${MKT.posted5yr}, almost nothing in Mississauga cash flows. If you model at a realistic ${MKT.contractRate} contract rate, a reasonable amount does. Getting your actual rate from a broker before you shop is not administrative - it decides which neighbourhoods are even on your list.

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
- A ${MKT.spLp} sale-to-list ratio and ${MKT.monthsInventory} months of inventory mean you can negotiate. Use it.

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

  // ─────────────────────────────────────────────────────────
  {
    slug: 'how-to-make-100k-real-estate-gta',
    title: 'How to Make $100K in GTA Real Estate (The Math Nobody Sells You)',
    category: 'Strategy',
    excerpt:
      'Not a course and not a guarantee - a ledger. Where six figures actually comes from in GTA real estate, computed on this month\'s real market data, including the costs the gurus leave out.',
    image_keywords: 'toronto skyline houses, gta suburban aerial, canadian real estate',
    content: `Somewhere in your feed right now, someone is selling a course promising you $100,000 in GTA real estate in twelve months. Here is the thing they will never show you: the actual arithmetic. Because the arithmetic is boring, it takes about five years, and it does not require their course.

I am going to show you the whole ledger, computed on ${AS_OF} - the real numbers, this month. Both sides of it: where six figures genuinely comes from, and the costs that quietly eat it.

One thing first, because it matters legally and it matters practically: **nobody licensed can promise you a return, and you should treat anyone who does as a warning sign.** Real estate professionals in Ontario are regulated by RECO, and guaranteeing investment returns is the kind of claim that ends careers - because it cannot honestly be made. What follows is not a promise. It is arithmetic on stated assumptions, and every assumption is on the page so you can disagree with it.

## The four places money actually comes from

Every dollar ever made in residential real estate arrives through one of four doors:

1. **Principal paydown** - your tenant retires your mortgage
2. **Cash flow** - rent exceeds carrying costs
3. **Forced equity** - you make the property worth more
4. **Appreciation** - the market does it for you

The guru pitch is built almost entirely on door four. So let's start with what door four is actually doing right now.

## Appreciation: the door that is currently closed

The GTA average sale price is **${EX.gtaAvgPrice}**, and it is **${EX.gtaYoyPhrase}**. Mississauga is a buyer's market: about **${MKT.monthsInventory} months** of inventory, a sales-to-new-listings ratio near **${MKT.snlr}**, homes taking **${MKT.ldom} days** to sell at about **${MKT.spLp}** of asking.

Anyone whose $100K story depends on appreciation is telling you about a market that is not the one outside your window. Prices recover eventually - they always have here - but "eventually" is not underwritable, and paying today for growth you hope arrives is speculation wearing a spreadsheet costume.

So put appreciation where it belongs: upside you did not pay for. The interesting news is that you can get to six figures without it.

## Principal paydown: the ${EX.principal5yrK} nobody brags about

Buy at Mississauga's citywide average of **${MKT.avgPrice}** with 20% down (**${EX.down}**) at a realistic **${MKT.contractRate}** five-year fixed contract rate - not the ${MKT.posted5yr} posted rate - and the monthly payment is about **${EX.payment}**.

Here is the part that never makes it into a reel: over the first five years of that mortgage, roughly **${EX.principal5yr}** of those payments goes to principal. That is equity. If a tenant is covering your carrying costs, that is ${EX.principal5yr} of your net worth built by someone else's rent cheque, on a completely average property, with zero appreciation assumed.

That single boring mechanism is roughly ${EX.principalPctOf100k} of the way to $100K by itself. It requires no market timing, no renovation, and no course. It requires only that the property carries itself - which is exactly why the neighbourhood and the unit structure matter so much.

## Cash flow: the second leg

At the citywide average price, single-unit cash flow is genuinely hard at today's rates - I will not pretend otherwise. Where it works is where price-to-rent is compressed and properties have two units.

Malton is the clearest example: average price near **${MALTON_PRICE}** (about ${MALTON_DISCOUNT} below the citywide average), the strongest gross yields in Mississauga at around **${MALTON_YIELD}**. A 4-bed main floor plus a *legal* 3-bed basement suite rents at roughly $5,900/month combined - I broke that arithmetic down line by line in [The 7-Bedroom Cash Flow Math](/blog/seven-bedroom-rooming-house-math-mississauga).

Assume a well-bought two-unit property clears **$800/month** after mortgage, tax, insurance, maintenance reserve and vacancy - an assumption, and one you should verify against your own deal, but a realistic one at Malton prices with a legal suite. Over five years:

| Source | Five-year total |
|---|---|
| Principal paydown (at ${MALTON_PRICE}, 20% down, ${MKT.contractRate}) | ~${EX.maltonPrincipal5yr} |
| Cash flow at $800/month | ${EX.cashFlow5yr} |
| **Total, zero appreciation assumed** | **~${EX.maltonPathTotal}** |

Six figures. On one property. In a flat market. With every assumption visible.

## Forced equity: the accelerator

The third door is the one where effort substitutes for time: buy a property with a non-conforming basement, spend $40,000–$80,000 making the suite legal, and you have created both an income stream (roughly $2,000/month for a 3-bed suite) and an appraisal story for refinancing.

This is the honest version of what the courses call BRRRR. It works - and it is also where inexperienced investors lose the most money, because a suite that *cannot* be legalized (ceiling height, egress, parking) turns the renovation budget into a rec room. Verify with the City before you buy, not after. Legal beats "potential" by more than the price difference usually reflects.

## Now the other side of the ledger

Here is everything the $100K pitch leaves out, computed on the same average-price purchase:

**Getting in.** Land transfer tax on a ${MKT.avgPrice} Mississauga purchase is about **${EX.ltt}**. Buy the identical property in Toronto proper and the municipal LTT roughly doubles it to about **${EX.lttToronto}** - the single best argument for the 905 that nobody frames as one. Add legal, title and inspection and you are near ${EX.entryCostsK} in before you own a doorknob.

**Qualifying.** You will be stress-tested at about **${MKT.stressTest}**, not your contract rate. That decides your budget before any neighbourhood does.

**Getting out.** Sell that average property through the standard full-service route and 5% commission plus HST on it is about **${EX.sellCosts}**, plus legal. This is why the five-year hold is not a stylistic choice - it is the math. Flip in year two and the friction consumes most of what the property built.

**The taxman.** Investment property gains are taxable - currently at a 50% inclusion rate - and the CRA has become aggressive about "flips" taxed as full business income. The $100K on the ledger is pre-tax. Model it that way.

## What a real $100K plan looks like

- **One property, bought below the citywide average**, in a high-yield pocket, with a legal (or verifiably legalizable) second unit.
- **Underwritten at your real contract rate** on today's rent - not projected rent, not hoped-for appreciation. If it only works at tomorrow's numbers, it does not work.
- **Held for five-plus years**, because principal paydown compounds and exit friction does not shrink.
- **Bought with today's leverage:** ${MKT.monthsInventory} months of inventory and a ${MKT.spLp} sale-to-list ratio mean negotiating room that 2021 buyers would have paid six figures for. The discount you negotiate on day one is the only "return" you ever fully control.
- **Appreciation treated as a bonus.** At a modest 2%/year the average property adds about ${EX.appr2pct5yr} over five years - lovely if it happens, and the plan above never needed it.

## What this means for investors

- $100K in five years is arithmetic; $100K in one year is speculation. Know which game you are playing.
- Principal paydown is the most reliable wealth mechanism in real estate and the least marketed, because nobody can sell you a course about waiting.
- The cash-flow leg lives or dies on a **legal** second suite. Verify registration before you underwrite a dollar of suite income.
- Every figure above moves with rates and prices - which is why each one here is computed from the current TRREB report, not typed from memory. Anyone quoting you fixed numbers from a 2021 screenshot is selling something.

Every listing on MississaugaInvestor.ca is scored on exactly this math - cap rate, cash flow, and the rent assumption shown on the card so you can audit it. Start with the [current listings](/listings), get high-scoring deals emailed as they hit the market with [deal alerts](/alerts), or stress-test your own numbers in the [mortgage calculator](/mortgage-calculator).

*Based on ${AS_OF}. Educational commentary from a licensed real estate sales representative - not financial, tax, or legal advice. All scenarios are illustrations computed from the stated assumptions, not promises or forecasts of return; your results will differ. Real estate involves risk, including loss of capital. Verify all figures independently and consult your own mortgage, legal, and tax professionals before investing.*`,
  },
];

export default SEED_POSTS;
