/**
 * RSS feed aggregator for real estate news.
 * Fetches multiple Canadian RE news feeds, parses XML, and returns merged articles.
 */

const RSS_FEEDS = [
  {
    url: 'https://www.bankofcanada.ca/content_type/press-releases/feed/',
    name: 'Bank of Canada',
    category: 'Rate Decisions',
    source: 'BOC',
  },
  {
    url: 'https://www.bnnbloomberg.ca/rss/category/real-estate',
    name: 'BNN Bloomberg',
    category: 'Market News',
    source: 'BNN',
  },
  {
    url: 'https://financialpost.com/category/real-estate/feed',
    name: 'Financial Post',
    category: 'Market News',
    source: 'Financial Post',
  },
  {
    url: 'https://betterdwelling.com/feed/',
    name: 'Better Dwelling',
    category: 'Housing Analysis',
    source: 'Better Dwelling',
  },
  {
    url: 'https://www.canadianmortgagetrends.com/feed/',
    name: 'Canadian Mortgage Trends',
    category: 'Mortgage & Rates',
    source: 'CMT',
  },
  {
    url: 'https://storeys.com/feed/',
    name: 'Storeys',
    category: 'Market News',
    source: 'STOREYS',
  },
  {
    url: 'https://remontario.com/feed/',
    name: 'REM',
    category: 'Market News',
    source: 'REM',
  },
  {
    url: 'https://www.cbc.ca/webfeed/rss/rss-business',
    name: 'CBC Business',
    category: 'Market News',
    source: 'CBC Business',
  },
];

/**
 * Extract text content between XML tags.
 */
function getTagContent(xml, tag) {
  // Handle CDATA sections
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();

  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(re);
  return match ? match[1].trim() : '';
}

/**
 * Get link from RSS item — handles both <link>url</link> and <link href="url"/>
 */
function getLink(itemXml) {
  // Try standard <link>url</link> first
  const standard = getTagContent(itemXml, 'link');
  if (standard && standard.startsWith('http')) return standard;

  // Try <link href="..."/> (Atom format)
  const hrefMatch = itemXml.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (hrefMatch) return hrefMatch[1];

  // Try <guid> as fallback
  const guid = getTagContent(itemXml, 'guid');
  if (guid && guid.startsWith('http')) return guid;

  return '';
}

/**
 * Strip HTML tags and decode common entities.
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract image URL from an RSS item.
 * Tries: media:content, media:thumbnail, enclosure, content:encoded img tag, description img tag
 */
function extractImage(itemXml) {
  // media:content or media:thumbnail
  const mediaMatch = itemXml.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch) return mediaMatch[1];

  // enclosure with image type
  const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image[^"']*/i);
  if (enclosureMatch) return enclosureMatch[1];
  // enclosure url first, type second
  const enclosure2 = itemXml.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp))[^"']*["']/i);
  if (enclosure2) return enclosure2[1];

  // og:image or image tag in content:encoded or description
  const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && !imgMatch[1].includes('gravatar') && !imgMatch[1].includes('pixel') && !imgMatch[1].includes('1x1')) {
    return imgMatch[1];
  }

  return null;
}

/**
 * Classify article into a topic tag based on title + snippet keywords.
 */
function classifyTopic(title, snippet) {
  const text = ((title || '') + ' ' + (snippet || '')).toLowerCase();

  if (/mississauga|peel|gta west|hurontario|lrt|port credit|square one/i.test(text)) return 'Mississauga';
  if (/bank of canada|boc rate|interest rate|rate cut|rate hike|rate hold|rate decision|overnight rate|policy rate/i.test(text)) return 'Interest Rates';
  if (/mortgage|fixed rate|variable rate|amortization|stress test|insured mortgage/i.test(text)) return 'Interest Rates';
  if (/market stat|market report|home sales|home prices|average price|benchmark|sales volume|listings data|trreb|crea/i.test(text)) return 'Market Stats';
  if (/invest|rental|landlord|cap rate|cash flow|roi|reit|airbnb|short.term rental/i.test(text)) return 'Investment';
  if (/policy|government|regulation|housing act|zoning|bylaw|tax|cmhc|budget|legislation|immigration/i.test(text)) return 'Policy & Govt';

  return 'Market Stats';
}

/**
 * Parse RSS/Atom XML into article objects.
 */
function parseFeed(xml, feedMeta) {
  const articles = [];

  // Split by <item> (RSS) or <entry> (Atom)
  const itemTag = xml.includes('<entry') ? 'entry' : 'item';
  const re = new RegExp(`<${itemTag}[\\s>][\\s\\S]*?</${itemTag}>`, 'gi');
  const items = xml.match(re) || [];

  for (const item of items.slice(0, 15)) {
    const title = stripHtml(getTagContent(item, 'title'));
    if (!title) continue;

    const link = getLink(item);
    if (!link) continue;

    const pubDate = getTagContent(item, 'pubDate') || getTagContent(item, 'published') || getTagContent(item, 'updated') || '';
    const description = stripHtml(
      getTagContent(item, 'description') || getTagContent(item, 'summary') || getTagContent(item, 'content')
    );

    // Truncate snippet
    const snippet = description.length > 200
      ? description.substring(0, 200).replace(/\s\S*$/, '') + '...'
      : description;

    const date = pubDate ? new Date(pubDate) : null;
    const image = extractImage(item);
    const topic = classifyTopic(title, snippet);

    articles.push({
      title,
      link,
      source: feedMeta.source || feedMeta.name,
      sourceFull: feedMeta.name,
      category: feedMeta.category,
      topic,
      date: date && !isNaN(date.getTime()) ? date.toISOString() : null,
      snippet,
      image,
    });
  }

  return articles;
}

/**
 * Fetch all RSS feeds in parallel, merge and sort by date.
 */
export async function fetchAllFeeds() {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch(feed.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'MississaugaInvestor/1.0 (News Aggregator)',
            Accept: 'application/rss+xml, application/xml, text/xml, */*',
          },
          next: { revalidate: 900 }, // 15 min cache
        });
        clearTimeout(timeout);

        if (!res.ok) return [];

        const xml = await res.text();
        return parseFeed(xml, feed);
      } catch {
        clearTimeout(timeout);
        return [];
      }
    })
  );

  const allArticles = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.length > 0) {
      allArticles.push(...r.value);
    }
  }

  // Sort by date descending, undated articles last
  allArticles.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  return allArticles.slice(0, 60);
}

/**
 * Get unique categories from feeds config.
 */
export function getCategories() {
  return [...new Set(RSS_FEEDS.map((f) => f.category))];
}

/**
 * Get unique source names for source filter.
 */
export function getSources() {
  return RSS_FEEDS.map((f) => f.source);
}

/**
 * Topic categories for topic filter tabs.
 */
export function getTopics() {
  return ['All News', 'Mississauga', 'Market Stats', 'Interest Rates', 'Investment', 'Policy & Govt'];
}
