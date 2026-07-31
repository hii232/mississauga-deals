import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { fetchAllFeeds } from '@/lib/news/fetch-feeds';
import { HOOD_DATA } from '@/lib/constants';
import { SEED_POSTS } from '@/lib/blog/seed-posts';
import { sanitizeBlogText, postNeedsSanitizing } from '@/lib/blog/sanitize-content';
import { isCronAuthorized, isAdminAuthorized } from '@/lib/api-auth';

export const maxDuration = 120; // Allow up to 2 minutes for AI generation
export const dynamic = 'force-dynamic';

// ── Auth: only Vercel cron or admin key ──
// Delegated to lib/api-auth so this fails CLOSED. The previous version compared
// the header against `Bearer ${process.env.CRON_SECRET}` directly, so with
// CRON_SECRET unset the expected value rendered as the literal string
// "Bearer undefined" — sending exactly that header authenticated you.
function isAuthorized(request) {
  return isCronAuthorized(request) || isAdminAuthorized(request);
}

// ── Supabase client ──
function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// ── Slug generator ──
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

// ── Topic categories for rotation ──
const TOPIC_TEMPLATES = [
  {
    category: 'Market Analysis',
    angles: [
      'monthly market update with price trends and inventory levels',
      'comparison of condo vs detached home investment returns',
      'impact of interest rate changes on Mississauga property values',
      'analysis of sale-to-list ratios and what they mean for investors',
      'rental yield trends across different property types',
      'new construction impact on resale market values',
      'seasonal buying patterns and best times to invest',
    ],
  },
  {
    category: 'Neighbourhood Guide',
    angles: [
      'deep dive investment guide for Port Credit',
      'deep dive investment guide for Cooksville',
      'deep dive investment guide for Churchill Meadows',
      'deep dive investment guide for Erin Mills',
      'deep dive investment guide for City Centre / Square One',
      'deep dive investment guide for Streetsville',
      'deep dive investment guide for Meadowvale',
      'deep dive investment guide for Clarkson and Lorne Park',
      'deep dive investment guide for Malton',
      'deep dive investment guide for Hurontario Corridor',
      'comparing top 5 neighbourhoods for rental income',
      'emerging neighbourhoods near the Hurontario LRT',
    ],
  },
  {
    category: 'Strategy',
    angles: [
      'BRRR strategy guide specifically for Mississauga properties',
      'how to analyze a rental property deal in under 5 minutes',
      'house hacking strategies for Mississauga first-time investors',
      'pre-construction vs resale: which is better for investors right now',
      'building a real estate portfolio starting with $100K in Mississauga',
      'tax strategies for Ontario real estate investors',
      'when to sell vs hold an investment property',
      'how to evaluate cap rates in the current Mississauga market',
      'multi-unit conversion opportunities in Mississauga',
      'leveraging home equity for your next investment property',
    ],
  },
  {
    category: 'Guide',
    angles: [
      'complete guide to buying your first investment property in Mississauga',
      // 'understanding cash flow analysis for Mississauga rentals' removed —
      // it and Strategy's "how to analyze a rental property deal in under 5
      // minutes" are the same topic in different words. The dedup check below
      // compares a candidate angle against PUBLISHED TITLES, and the two ended
      // up published as different enough phrasing ("...Cash Flow Analysis...
      // Investor Guide" vs "The 5-Minute...Rental Property Analysis System")
      // that the check missed it — both posts are real, live, and splitting
      // the same search intent (GSC: pos 5.90/82 impr and pos 5.81/62 impr).
      // Removing the redundant angle from the source closes this for good,
      // since no title-similarity heuristic can be trusted to catch every
      // rewording the generator produces.
      'mortgage options for investment properties in Ontario',
      'landlord-tenant rules every Mississauga investor must know',
      'how to screen tenants effectively in Ontario',
      'property management tips for hands-off investing',
      'insurance considerations for Mississauga rental properties',
      'due diligence checklist before buying an investment property',
      'understanding property taxes for Mississauga investors',
      'how to use deal scores to find undervalued properties',
    ],
  },
  {
    category: 'Beginner Guide',
    angles: [
      'real estate investing 101 for Mississauga beginners',
      'common mistakes first-time Mississauga investors make',
      'how much money you really need to start investing in Mississauga',
      'renting vs buying in Mississauga: an investor perspective',
      'understanding cap rate, cash flow, and ROI explained simply',
      'why Mississauga is one of the best cities to invest in Canada',
    ],
  },
];

// ── Duplicate-topic detection ──
//
// A real GSC export showed this generator publishing near-duplicate posts on
// the same topic under different wording — e.g. three separate "rent vs buy"
// posts and three separate "cap rate / cash flow / ROI" posts, none breaking
// out of the bottom half of page one because they split the same search
// intent three ways. Root cause: the old check split on whitespace only (a
// trailing comma or colon stuck to the keyword, e.g. "rate," or "mississauga:",
// broke every substring match), filtered to words over 4 chars (discarding
// exactly the short, topic-defining words this domain uses most — "cap",
// "rent", "buy", "roi"), and compared raw words with no stemming, so
// "renting"/"rent", "buying"/"buy" and "rates"/"rate" were treated as
// unrelated. Fixed below with punctuation stripping, a stopword list for
// terms that appear in nearly every title on this site (so the comparison is
// driven by what actually distinguishes a topic), and light stemming.
const TOPIC_STOPWORDS = new Set([
  'a', 'an', 'the', 'for', 'in', 'of', 'to', 'and', 'or', 'vs', 'is', 'are',
  'with', 'on', 'at', 'by', 'your', 'you', 'how', 'what', 'why', 'when',
  'this', 'that', 'it', 'as', 'be', 'do', 'does', 'can', 'will', 'right',
  'now', 'really', 'need', 'best', 'top', 'every', 'from',
  'mississauga', 'investment', 'investing', 'invest', 'investor', 'investors',
  'guide', 'guides', 'property', 'properties', 'real', 'estate', 'ontario',
  'analysis', 'complete', 'deep', 'dive', 'update', 'market', 'understanding',
  'explained', 'perspective', 'strategy', 'strategies', 'canada', 'canadian',
  // Generic enough to falsely link unrelated angles: "impact"/"values" pair up
  // an interest-rate post with a new-construction post (different economic
  // drivers, not the same topic); "first"/"time" is an AUDIENCE descriptor
  // ("first-time investors") shared by many otherwise-unrelated posts, not a
  // topic signal.
  'impact', 'values', 'first', 'time',
]);

// Not a real stemmer — just enough to fold the specific variants this
// generator actually produces ("renting"/"rent", "buying"/"buy", "rates"/
// "rate") onto a shared root. The plural strip runs first and only removes a
// lone trailing 's' (never the whole "es"), so "rates" -> "rate", not "rat".
function stemWord(word) {
  let w = word;
  if (w.length >= 4 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  if (w.length >= 6 && w.endsWith('ing')) w = w.slice(0, -3);
  if (w.length >= 7 && w.endsWith('ment')) w = w.slice(0, -4);
  if (w.length >= 7 && w.endsWith('tion')) w = w.slice(0, -4);
  if (w.length >= 6 && w.endsWith('ive')) w = w.slice(0, -3);
  if (w.length >= 5 && w.endsWith('ed')) w = w.slice(0, -2);
  return w;
}

function topicStems(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/) // strips punctuation the old whitespace-only split kept stuck to words
    .filter((w) => w.length >= 3 && !TOPIC_STOPWORDS.has(w))
    .map(stemWord)
    .filter((w) => !TOPIC_STOPWORDS.has(w) && w.length >= 2);
}

function sharesTopicWith(angle, otherText, minMatches = 2) {
  const angleStems = topicStems(angle);
  const otherStems = new Set(topicStems(otherText));
  let overlap = 0;
  for (const s of angleStems) if (otherStems.has(s)) overlap++;
  return overlap >= minMatches;
}

// Dedicated, hand-built pages already targeting these exact queries (see
// IMPROVEMENT_BACKLOG.md section 5a). The evergreen rotation had no awareness
// of them and picked "insurance considerations for Mississauga rental
// properties" and "mortgage options for investment properties in Ontario" —
// producing blog posts that directly compete with /rental-property-insurance
// -mississauga and /mortgage-calculator for the query each page was built to
// win (GSC showed the dedicated insurance page at position 55 while a blog
// post on the same topic sat at position 12 — the page built to win the
// query was losing to the site's own blog). Each entry's terms are hand-
// picked to be specific enough that only a genuine collision matches — single
// generic words like "cash flow" are deliberately left out; they recur across
// too many unrelated angles to safely gate on alone.
const RESERVED_PAGE_TOPICS = [
  { page: '/rental-property-insurance-mississauga', terms: ['insurance'], minMatches: 1 },
  { page: '/mortgage-calculator', terms: ['mortgage'], minMatches: 1 },
  { page: '/rent-vs-buy-mississauga', terms: ['rent', 'buy'], minMatches: 2 },
];

function coversReservedPage(angle) {
  const angleStems = new Set(topicStems(angle));
  return RESERVED_PAGE_TOPICS.find((r) => {
    const matches = r.terms.filter((t) => angleStems.has(stemWord(t))).length;
    return matches >= r.minMatches;
  });
}

// ── Pick a topic that hasn't been covered ──
function pickTopic(existingTitles) {
  // Flatten all angles with their categories
  const allTopics = TOPIC_TEMPLATES.flatMap((cat) =>
    cat.angles.map((angle) => ({ category: cat.category, angle }))
  );

  // Filter out topics that seem already covered, either by a past blog post
  // or by a dedicated static page built specifically for that query.
  const available = allTopics.filter((topic) => {
    if (coversReservedPage(topic.angle)) return false;
    return !existingTitles.some((existing) => sharesTopicWith(topic.angle, existing));
  });

  if (available.length === 0) {
    // All topics covered — pick a market analysis with current month
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const now = new Date();
    return {
      category: 'Market Analysis',
      angle: `${months[now.getMonth()]} ${now.getFullYear()} Mississauga real estate market update with latest price data and investor outlook`,
    };
  }

  // Random pick from available topics
  return available[Math.floor(Math.random() * available.length)];
}

// ── Trending headlines from the site's own RSS aggregator ──
// Self-hosted feed pipeline (lib/news/fetch-feeds.js) — no external AI service.
async function fetchTrendingHeadlines() {
  try {
    const articles = await fetchAllFeeds();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Prefer stories that actually move the local housing market
    const priority = { 'Mississauga': 0, 'Interest Rates': 1, 'Policy & Govt': 2, 'Market Stats': 3, 'Investment': 4 };

    const fresh = articles
      .filter((a) => a.date && new Date(a.date).getTime() >= sevenDaysAgo)
      .sort((a, b) => {
        const pa = priority[a.topic] ?? 9;
        const pb = priority[b.topic] ?? 9;
        if (pa !== pb) return pa - pb;
        return new Date(b.date) - new Date(a.date);
      });

    // Dedupe near-identical titles, cap at 18 headlines
    const seen = new Set();
    const picked = [];
    for (const a of fresh) {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().substring(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(a);
      if (picked.length >= 18) break;
    }
    return picked;
  } catch {
    return [];
  }
}

// ── Live market data, straight from the site's own /api/market-stats ──
// The prompt used to hardcode anchors ("5-year fixed around 4.5–5%") that had
// drifted badly from what the site itself publishes (6.09%), so every post
// shipped a wrong rate. Pulling the real endpoint means a post can never
// contradict the numbers a reader sees elsewhere on the site.
async function fetchMarketData() {
  try {
    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://www.mississaugainvestor.ca';
    const res = await fetch(`${baseUrl}/api/market-stats`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Format the live figures for the prompt. Every field is guarded — a missing
// value is simply omitted rather than printed as "undefined", and if the whole
// fetch failed we say nothing about rates at all instead of asserting a stale
// number. Silence beats a wrong figure.
function buildMarketBlock(s) {
  if (!s) return '';
  const money = (n) => (n > 0 ? '$' + Math.round(n).toLocaleString() : null);
  const pct = (n) => (typeof n === 'number' && isFinite(n) ? n + '%' : null);
  const lines = [];

  const board = s.tRREBMonth ? ` (TRREB Market Watch, ${s.tRREBMonth} — the latest monthly board data, NOT today's live figure)` : '';
  const avg = money(s.mississaugaAvgPrice);
  const med = money(s.mississaugaMedianPrice);
  if (avg) lines.push(`- Mississauga average sale price: ${avg}${med ? `, median ${med}` : ''}${board}`);
  if (s.mississaugaAvgLDOM) lines.push(`- Average days on market: ${s.mississaugaAvgLDOM}`);
  if (s.mississaugaAvgSPLP) lines.push(`- Sale-to-list ratio: ${s.mississaugaAvgSPLP}%`);
  if (s.mississaugaMonthsOfInventory) lines.push(`- Months of inventory: ${s.mississaugaMonthsOfInventory}${s.marketType ? ` (${s.marketType})` : ''}`);

  const r = s.rates || {};
  // Posted vs contract matters: the Bank of Canada figures TRREB reprints are
  // POSTED rates, well above what a borrower is actually quoted. A post that
  // tells an investor they'll pay the posted rate is simply wrong.
  const postedBits = [
    r.fixed5yr ? `5-year fixed ${pct(r.fixed5yr)}` : null,
    r.fixed3yr ? `3-year fixed ${pct(r.fixed3yr)}` : null,
    r.fixed1yr ? `1-year fixed ${pct(r.fixed1yr)}` : null,
  ].filter(Boolean);
  if (postedBits.length) {
    lines.push(`- POSTED mortgage rates (Bank of Canada, via TRREB — NOT the rate a borrower is quoted): ${postedBits.join(', ')}`);
  }
  const contractBits = [
    r.contractRateAssumption ? `~${pct(r.contractRateAssumption)} 5-year fixed` : null,
    r.variable ? `~${pct(r.variable)} variable` : null,
  ].filter(Boolean);
  if (contractBits.length) {
    lines.push(`- Realistic CONTRACT rates (what our cash-flow numbers assume): ${contractBits.join(', ')}`);
  }
  if (r.stressTest) {
    lines.push(`- Stress-test qualifying rate: ${pct(r.stressTest)} (greater of contract rate + 2% or 5.25%)`);
  }

  const e = s.economic || {};
  const econBits = [
    e.bocRate ? `Bank of Canada policy rate ${pct(e.bocRate)}` : null,
    e.primeRate ? `prime ${pct(e.primeRate)}` : null,
    e.inflation ? `inflation ${pct(e.inflation)}` : null,
  ].filter(Boolean);
  if (econBits.length) lines.push(`- ${econBits.join(', ')}`);

  const rent = s.rental || {};
  const rentBits = [
    rent.avg1Bed ? `1-bed ${money(rent.avg1Bed)}` : null,
    rent.avg2Bed ? `2-bed ${money(rent.avg2Bed)}` : null,
    rent.avg3Bed ? `3-bed ${money(rent.avg3Bed)}` : null,
  ].filter(Boolean);
  if (rentBits.length) lines.push(`- Average asking rents: ${rentBits.join(', ')}`);

  // Month-by-month history beats a single snapshot: it lets the post describe
  // where the market is actually heading instead of just where it stands.
  const hist = Array.isArray(s.mississaugaMonthly) ? s.mississaugaMonthly : [];
  const trend = hist.length >= 2
    ? `\n### Mississauga month by month (TRREB Market Watch, each row a published report)\n` +
      hist.map((m) =>
        `- ${m.month}: ${m.sales} sales, avg ${money(m.avgPrice)}, median ${money(m.medianPrice)}, ${m.activeListings} active, ${m.monthsInventory} months inventory, ${m.ldom} days on market`
      ).join('\n') +
      `\nUse this to describe the actual direction of travel — cite the specific months you're comparing. Don't extrapolate past the last row or invent months that aren't listed.\n`
    : '';

  return lines.length
    ? `\n## Current market figures (the site's own published data — use these)\n${lines.join('\n')}\n${trend}`
    : '';
}

// ── Real platform data the model can cite (from lib/constants.js) ──
function buildDataBlock() {
  const rows = Object.entries(HOOD_DATA)
    .slice(0, 12)
    .map(([name, d]) =>
      `- ${name}: avg price $${Math.round(d.avgPrice / 1000)}K, ${d.priceYoY >= 0 ? '+' : ''}${d.priceYoY}% YoY, ${d.avgDOM} days on market, ${d.rentYield}% rent yield`
    );
  return rows.join('\n');
}

// ── Structured output schema — guarantees valid JSON, no regex parsing ──
const BLOG_POST_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: '50-70 characters, includes "Mississauga", written for search and curiosity' },
    excerpt: { type: 'string', description: 'Max 180 characters. A hook, not a summary.' },
    content: { type: 'string', description: 'The full blog post in Markdown, 1300-1800 words' },
    category: {
      type: 'string',
      enum: ['Market News', 'Market Analysis', 'Neighbourhood Guide', 'Strategy', 'Guide', 'Beginner Guide'],
      description: 'Best-fit category for this post',
    },
    image_keywords: { type: 'string', description: '2-3 comma-separated stock photo search keywords' },
  },
  required: ['title', 'excerpt', 'content', 'category', 'image_keywords'],
  additionalProperties: false,
};

// ── Generate blog post with Claude Fable 5 ──
async function generateBlogPost({ headlines, topic, existingTitles, marketStats }) {
  // timeout under the 120s function cap so failures surface cleanly; 1 retry max
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 100_000,
    maxRetries: 1,
  });

  const now = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentMonth = months[now.getMonth()];
  const currentYear = now.getFullYear();

  const topicBlock = headlines.length > 0
    ? `## What's trending right now
These are real headlines from Canadian real estate and business news feeds over the past week:

${headlines.map((h) => `- [${h.source}${h.date ? ', ' + new Date(h.date).toISOString().split('T')[0] : ''}] ${h.title}${h.snippet ? ' — ' + h.snippet : ''}`).join('\n')}

Pick the ONE story (or tightly connected cluster) that matters most for Mississauga and GTA housing — rate decisions, housing policy, local development, and market data beat generic national business stories. Write the post about what that story actually means for someone buying an investment property in Mississauga right now. Name the story plainly; don't assume the reader saw the news.`
    : `## Topic
Write about: ${topic.angle}`;

  const prompt = `You are ghostwriting a blog post for Hamza Nouman — a licensed real estate Sales Representative with Cityscape Real Estate Ltd. in Mississauga, Ontario, who runs MississaugaInvestor.ca, a data-driven investment property platform. The post is published under his name, in his voice, in first person.

Today is ${currentMonth} ${now.getDate()}, ${currentYear}. Everything must read as current as of this date.

${topicBlock}

## Don't repeat these
Recent posts already on the blog:
${existingTitles.slice(0, 30).map((t) => `- ${t}`).join('\n')}

Hard rule: if a news story was already covered by ANY recent post above — even from a different angle, even if your take would be better — do not write about that story again. A story counts as covered when the post is about the same underlying event (same rate decision, same policy announcement, same report). Pick the next-most-consequential uncovered story instead. If nothing in the headlines is both consequential and uncovered, ignore the headlines and write a fresh evergreen piece grounded in the neighbourhood data below.

The site also has dedicated pages already built and ranking for these exact queries — writing a blog post that covers the same core question just competes with the site's own page for the same search result, so avoid these as your main topic (a passing mention or internal link to one is fine):
${RESERVED_PAGE_TOPICS.map((r) => `- ${r.page} — covers: ${r.terms.join(' / ')}`).join('\n')}

## Real platform data you may cite
Current neighbourhood figures from MississaugaInvestor.ca's own dataset:
${buildDataBlock()}
${buildMarketBlock(marketStats)}
Accuracy rules — these matter more than style:
- The figures above are what the site itself publishes. Never state a number that contradicts them (especially mortgage rates — quote the rate given, not a remembered one).
- Monthly board figures are labelled with their report month. If you cite one, say which month it's from; never present it as today's number.
- If you don't have a real figure for something, write around it or use an openly framed approximation ("roughly", "in the low $X00Ks"). Never invent a precise statistic, a percentage, or a source.

## Voice
Write like Hamza actually talks to a client over coffee: direct, plain words, short paragraphs, contractions, a little opinionated. Take a position and defend it with numbers. One concrete, personal observation (something I tell clients, something I noticed at showings this month) is worth more than three statistics. It should read like a person who walks these streets every week — not a content mill.

Avoid AI-writing tells: no "in today's fast-paced market", "navigating the landscape", "it's important to note", "game-changer", "delve". Don't open with a throat-clearing summary of what the post will cover — start inside the story. Vary sentence length. Prose first; use a list only when a list is genuinely the clearest form.

## Requirements
- Title: 50–70 characters, includes "Mississauga", include ${currentYear} if it fits naturally.
- Content: 1300–1800 words of Markdown with ## and ### headings. Go deep enough to actually answer the question a reader searched for — a thin post that restates the headline is worse than no post. Ground the story in Mississauga specifics: at least three neighbourhoods with concrete numbers from the data above, and at least one worked example an investor can follow (a real purchase price, the rent it supports, and what that leaves per month).
- Use ONE Markdown table where a genuine side-by-side comparison helps (neighbourhoods, property types, rate scenarios) — GitHub-flavoured pipe tables render properly on the site. Keep it to 3–5 rows and 3–4 columns so it stays readable on a phone. Don't force a table into a post that doesn't need one.
- Mention MississaugaInvestor.ca once, naturally. End with a short "What this means for investors" section — three or four specific, actionable takeaways, not a summary — and a soft pointer to the deal scores on MississaugaInvestor.ca.
- Internal links: weave in 2–3 Markdown links where they genuinely help the reader, using ONLY these exact relative paths — [current listings](/listings), [mortgage calculator](/mortgage-calculator), [market data](/market-pulse), [recent sold prices](/recent-sales), [deal alerts](/alerts), or a neighbourhood guide as /neighbourhoods/<name-in-lowercase-with-hyphens> for a neighbourhood you discuss. Never invent any other URL, and never use absolute URLs for internal links.
- This is educational commentary from a licensed sales representative, not financial advice — keep claims honest and verifiable.
- Brokerage: Hamza is with Cityscape Real Estate Ltd., Brokerage. NEVER name any other brokerage, past or present — misattributing a registrant's brokerage is a RECO compliance violation.`;

  const response = await anthropic.beta.messages.create({
    model: 'claude-fable-5',
    max_tokens: 16000,
    // Server-side fallback: a rare safety-classifier false positive gets
    // transparently re-served by Opus 4.8 instead of failing the daily cron
    betas: ['server-side-fallback-2026-06-01'],
    fallbacks: [{ model: 'claude-opus-4-8' }],
    output_config: {
      effort: 'high',
      format: { type: 'json_schema', schema: BLOG_POST_SCHEMA },
    },
    messages: [{ role: 'user', content: prompt }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('Model declined to generate this post (refusal on primary and fallback)');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('Blog generation hit the token limit before finishing');
  }

  const text = response.content.find((c) => c.type === 'text')?.text;
  if (!text) throw new Error('No text in Claude response');

  // json_schema output guarantees valid JSON in the text block
  return JSON.parse(text);
}

// ── Fetch a relevant cover image from Unsplash (free, no key needed) ──
async function fetchCoverImage(keywords) {
  try {
    const searchTerms = keywords || 'mississauga real estate';
    // Use Unsplash source URL — free, no API key, returns a random matching photo
    // We'll use the search API via the public endpoint
    const queries = [
      searchTerms,
      'mississauga skyline',
      'real estate investment property',
      'modern condo building',
      'house neighbourhood canada',
    ];

    // Try each query until we get a working image
    for (const query of [searchTerms, ...queries.slice(1)]) {
      const encoded = encodeURIComponent(query);
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encoded}&per_page=5&orientation=landscape`,
        {
          headers: {
            Authorization: 'Client-ID 1WxD0s5G_uBZFIaGpXNqmKMmSS0LfuNFGBVQYh1JXOQ',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          // Pick a random one from top 5 for variety
          const pick = data.results[Math.floor(Math.random() * Math.min(data.results.length, 5))];
          // Use the regular size (1080px wide) — good for blog covers
          return pick.urls?.regular || pick.urls?.small || null;
        }
      }
    }

    return null;
  } catch (err) {
    console.error('Failed to fetch cover image:', err);
    return null;
  }
}

// ── Ping search engines to index the new post immediately ──
// Overlap of significant title words (0..1, against the smaller title). Two
// posts about the same story share its distinctive nouns even when phrased
// differently — e.g. "tiny condo glut" appears across all three 2026-07-20 dupes.
function titleSimilarity(a, b) {
  const STOP = new Set(['the','and','for','what','why','how','your','you','with','now','here','heres','means','should','could','will','just','this','that','are','its','not','buy','play','2025','2026','2027','mississauga','gta','real','estate','investors','investor','buyers','buyer','market','property','properties','home','homes']);
  const toks = (t) =>
    new Set(
      String(t)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP.has(w))
    );
  const A = toks(a);
  const B = toks(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / Math.min(A.size, B.size);
}

async function pingSearchEngines(slug) {
  const blogUrl = `https://www.mississaugainvestor.ca/blog/${slug}`;
  const siteHost = 'www.mississaugainvestor.ca';
  const indexNowKey = process.env.INDEXNOW_KEY;

  const results = [];

  // IndexNow — pings Bing, Yandex, Seznam, Naver simultaneously
  if (indexNowKey) {
    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: siteHost,
          key: indexNowKey,
          keyLocation: `https://${siteHost}/${indexNowKey}.txt`,
          urlList: [
            blogUrl,
            `https://${siteHost}/blog`, // Also re-index the blog listing page
          ],
        }),
      });
      results.push({ engine: 'IndexNow', status: res.status });
    } catch (err) {
      results.push({ engine: 'IndexNow', error: err.message });
    }
  }

  // Google Ping — sitemap ping (still works as of 2026)
  try {
    const res = await fetch(
      `https://www.google.com/ping?sitemap=https://${siteHost}/sitemap.xml`
    );
    results.push({ engine: 'Google Ping', status: res.status });
  } catch (err) {
    results.push({ engine: 'Google Ping', error: err.message });
  }

  // Bing direct ping
  try {
    const res = await fetch(
      `https://www.bing.com/ping?sitemap=https://${siteHost}/sitemap.xml`
    );
    results.push({ engine: 'Bing Ping', status: res.status });
  } catch (err) {
    results.push({ engine: 'Bing Ping', error: err.message });
  }

  return results;
}

// ── Main handler ──
export async function GET(request) {
  try {
    // Auth check
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    // Get existing posts to avoid duplicates
    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('title, slug')
      .order('created_at', { ascending: false });

    const existingTitles = (existingPosts || []).map((p) => p.title);

    // ── Permanent cleanup of stored content defects ──
    // Render-time sanitizing already hides these, but the DATA should be clean:
    // older posts name Hamza's previous brokerage in their author bios (a RECO
    // compliance problem on indexed pages) and some carry U+FFFD em-dashes.
    // Rewrite any dirty row in place. Idempotent — clean rows never match.
    try {
      const { data: fullPosts } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, content');
      const dirty = (fullPosts || []).filter(postNeedsSanitizing);
      for (const p of dirty) {
        await supabase
          .from('blog_posts')
          .update({
            title: sanitizeBlogText(p.title),
            excerpt: sanitizeBlogText(p.excerpt),
            content: sanitizeBlogText(p.content),
          })
          .eq('id', p.id);
      }
      if (dirty.length) console.log(`Sanitized ${dirty.length} stored posts:`, dirty.map((p) => p.slug).join(', '));
    } catch (e) {
      console.error('Stored-post sanitize pass failed:', e.message);
    }

    // ── Self-publish the hand-written pillar posts ──
    // The cron is the one caller that always runs with real credentials, so the
    // seed posts publish themselves on the next daily run instead of waiting on
    // someone to hit the admin route. Idempotent: existing slugs are skipped,
    // so after the first run this block is a no-op forever.
    const existingSlugSet = new Set((existingPosts || []).map((p) => p.slug));
    const missingSeeds = SEED_POSTS.filter((p) => !existingSlugSet.has(p.slug));
    if (missingSeeds.length > 0) {
      const { data: seeded, error: seedErr } = await supabase
        .from('blog_posts')
        .insert(missingSeeds.map((p) => ({
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          content: p.content,
          category: p.category,
          cover_image_url: null, // branded generated cover
          published: true,
        })))
        .select('slug');

      if (!seedErr && seeded?.length) {
        // Ping for the batch, then stop for today — five pillar posts landing
        // at once IS the day's publishing. The AI post resumes tomorrow, which
        // also avoids generating a near-duplicate of a topic just seeded.
        const indexResults = await pingSearchEngines(seeded[0].slug);
        return NextResponse.json({
          success: true,
          seeded: seeded.map((s) => s.slug),
          skippedGeneration: 'Seed posts published this run; AI generation resumes next run.',
          indexing: indexResults,
        });
      }
      // Seed insert failed — log and continue to normal generation rather than
      // losing the day's post over it.
      if (seedErr) console.error('Seed publish failed:', seedErr.message);
    }

    // Trending-first: pull real headlines from the site's own RSS aggregator,
    // plus the live market figures so the post can't contradict the site.
    const [headlines, marketStats] = await Promise.all([
      fetchTrendingHeadlines(),
      fetchMarketData(),
    ]);

    // Fall back to the evergreen topic rotation only if the feeds are down
    const topic = headlines.length > 0 ? null : pickTopic(existingTitles);

    // Generate the blog post
    const post = await generateBlogPost({ headlines, topic, existingTitles, marketStats });

    // Validate
    if (!post.title || !post.content) {
      return NextResponse.json({ error: 'Generated post missing title or content' }, { status: 500 });
    }

    // HARD duplicate guard — the prompt-level "don't re-cover a story" rule is
    // not reliable on its own (2026-07-20: three near-identical BoC posts).
    // Better to publish nothing today than a duplicate.
    const recentTitles = existingTitles.slice(0, 20);
    const dupe = recentTitles.find((t) => titleSimilarity(post.title, t) >= 0.5);
    if (dupe) {
      return NextResponse.json({
        skipped: true,
        reason: 'Generated title too similar to a recent post',
        generatedTitle: post.title,
        similarTo: dupe,
      });
    }

    // Slug collision = same title = duplicate; skip rather than suffix-publish
    const slug = generateSlug(post.title);
    const existingSlugs = (existingPosts || []).map((p) => p.slug);
    if (existingSlugs.includes(slug)) {
      return NextResponse.json({ skipped: true, reason: 'Slug already exists', slug });
    }

    // Fetch a relevant cover image
    const coverImage = await fetchCoverImage(post.image_keywords);

    // Publish to Supabase
    const { data: newPost, error } = await supabase
      .from('blog_posts')
      .insert({
        title: post.title,
        slug,
        excerpt: post.excerpt || '',
        content: post.content,
        category: post.category || topic?.category || 'Market News',
        cover_image_url: coverImage,
        published: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to publish: ' + error.message }, { status: 500 });
    }

    // Ping search engines to index immediately
    const indexResults = await pingSearchEngines(newPost.slug);

    return NextResponse.json({
      success: true,
      post: {
        title: newPost.title,
        slug: newPost.slug,
        category: newPost.category,
        url: `https://www.mississaugainvestor.ca/blog/${newPost.slug}`,
      },
      indexing: indexResults,
    });
  } catch (err) {
    console.error('Auto-blog error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
