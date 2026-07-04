import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { fetchAllFeeds } from '@/lib/news/fetch-feeds';
import { HOOD_DATA } from '@/lib/constants';

export const maxDuration = 120; // Allow up to 2 minutes for AI generation
export const dynamic = 'force-dynamic';

// ── Auth: only Vercel cron or admin key ──
function isAuthorized(request) {
  // Vercel cron sends this header automatically
  const cronSecret = request.headers.get('authorization');
  if (cronSecret === `Bearer ${process.env.CRON_SECRET}`) return true;

  // Manual trigger with admin key
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey && adminKey === process.env.ADMIN_SECRET) return true;

  return false;
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
      'understanding cash flow analysis for Mississauga rentals',
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

// ── Pick a topic that hasn't been covered ──
function pickTopic(existingTitles) {
  const existingLower = existingTitles.map((t) => t.toLowerCase());

  // Flatten all angles with their categories
  const allTopics = TOPIC_TEMPLATES.flatMap((cat) =>
    cat.angles.map((angle) => ({ category: cat.category, angle }))
  );

  // Filter out topics that seem already covered
  const available = allTopics.filter((topic) => {
    const keywords = topic.angle.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    // Check if any existing title shares too many keywords
    return !existingLower.some((existing) => {
      const matches = keywords.filter((kw) => existing.includes(kw));
      return matches.length >= 3;
    });
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
    content: { type: 'string', description: 'The full blog post in Markdown, 900-1300 words' },
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
async function generateBlogPost({ headlines, topic, existingTitles }) {
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
Recent posts already on the blog — pick a different angle than all of them:
${existingTitles.slice(0, 30).map((t) => `- ${t}`).join('\n')}

## Real platform data you may cite
Current neighbourhood figures from MississaugaInvestor.ca's own dataset:
${buildDataBlock()}
Other anchors: Mississauga average sale price is roughly $970K; 5-year fixed mortgages are around 4.5–5%; 1-bed rents run about $2,000–2,500 depending on the area.

## Voice
Write like Hamza actually talks to a client over coffee: direct, plain words, short paragraphs, contractions, a little opinionated. Take a position and defend it with numbers. One concrete, personal observation (something I tell clients, something I noticed at showings this month) is worth more than three statistics. It should read like a person who walks these streets every week — not a content mill.

Avoid AI-writing tells: no "in today's fast-paced market", "navigating the landscape", "it's important to note", "game-changer", "delve". Don't open with a throat-clearing summary of what the post will cover — start inside the story. Vary sentence length. Prose first; use a list only when a list is genuinely the clearest form.

## Requirements
- Title: 50–70 characters, includes "Mississauga", include ${currentYear} if it fits naturally.
- Content: 900–1300 words of Markdown with ## and ### headings. Ground the story in Mississauga specifics — at least two neighbourhoods with concrete numbers from the data above. Where you don't have a real figure, use clearly framed approximations ("roughly", "around") rather than inventing precise statistics. Mention MississaugaInvestor.ca once, naturally. End with a short "What this means for investors" section and a soft pointer to the deal scores on MississaugaInvestor.ca.
- This is educational commentary from a licensed sales representative, not financial advice — keep claims honest and verifiable.`;

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

    // Trending-first: pull real headlines from the site's own RSS aggregator
    const headlines = await fetchTrendingHeadlines();

    // Fall back to the evergreen topic rotation only if the feeds are down
    const topic = headlines.length > 0 ? null : pickTopic(existingTitles);

    // Generate the blog post
    const post = await generateBlogPost({ headlines, topic, existingTitles });

    // Validate
    if (!post.title || !post.content) {
      return NextResponse.json({ error: 'Generated post missing title or content' }, { status: 500 });
    }

    // Generate slug and check uniqueness
    let slug = generateSlug(post.title);
    const existingSlugs = (existingPosts || []).map((p) => p.slug);
    if (existingSlugs.includes(slug)) {
      slug = slug + '-' + Date.now().toString(36);
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
