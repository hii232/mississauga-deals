import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

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

// ── Generate blog post with Claude ──
async function generateBlogPost(topic, existingTitles) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are Hamza Nouman, a licensed Sales Representative with Royal LePage Signature Realty in Mississauga, Ontario. You run MississaugaInvestor.ca — a data-driven investment property platform.

Write a blog post about: ${topic.angle}
Category: ${topic.category}

EXISTING POSTS (DO NOT repeat these topics):
${existingTitles.map((t) => `- ${t}`).join('\n')}

REQUIREMENTS:
1. Title: 50-70 characters, must include "Mississauga", SEO-optimized
2. Excerpt: 1-2 sentences, max 180 characters, compelling hook
3. Content: 800-1200 words in Markdown format
4. Naturally mention "Hamza Nouman" once (e.g., "As I often tell my clients at MississaugaInvestor.ca...")
5. Reference MississaugaInvestor.ca once naturally
6. Include at least 2 specific Mississauga neighbourhoods with specific data points
7. Use H2 (##) and H3 (###) headings with keywords
8. Include specific numbers: prices, percentages, rates, timelines
9. End with a "Bottom Line" or "What This Means for Investors" section
10. End with a soft CTA about using MississaugaInvestor.ca deal scores
11. Write in first person, confident but approachable tone
12. DO NOT use generic filler — every paragraph must teach something specific
13. DO NOT start with "As a real estate agent" or similar cliche openings

Respond in this exact JSON format (no markdown code blocks, just raw JSON):
{
  "title": "Your SEO Title Here",
  "excerpt": "Your compelling excerpt here",
  "content": "Your full markdown content here"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content.find((c) => c.type === 'text')?.text;
  if (!text) throw new Error('No text in Claude response');

  // Parse JSON from response
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {
    // Try extracting JSON from markdown code block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Could not parse blog post JSON from Claude response');
  }
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

    // Pick a fresh topic
    const topic = pickTopic(existingTitles);

    // Generate the blog post
    const post = await generateBlogPost(topic, existingTitles);

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

    // Publish to Supabase
    const { data: newPost, error } = await supabase
      .from('blog_posts')
      .insert({
        title: post.title,
        slug,
        excerpt: post.excerpt || '',
        content: post.content,
        category: topic.category,
        published: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to publish: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      post: {
        title: newPost.title,
        slug: newPost.slug,
        category: newPost.category,
        url: `https://www.mississaugainvestor.ca/blog/${newPost.slug}`,
      },
    });
  } catch (err) {
    console.error('Auto-blog error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
