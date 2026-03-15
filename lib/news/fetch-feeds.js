/**
 * RSS feed aggregator for real estate news.
 * Fetches multiple Canadian RE news feeds, parses XML, and returns merged articles.
 */

const RSS_FEEDS = [
  {
    url: 'https://www.bankofcanada.ca/content_type/press-releases/feed/',
    name: 'Bank of Canada',
    category: 'Rate Decisions',
  },
  {
    url: 'https://www.bnnbloomberg.ca/rss/category/real-estate',
    name: 'BNN Bloomberg',
    category: 'Market News',
  },
  {
    url: 'https://financialpost.com/category/real-estate/feed',
    name: 'Financial Post',
    category: 'Market News',
  },
  {
    url: 'https://betterdwelling.com/feed/',
    name: 'Better Dwelling',
    category: 'Housing Analysis',
  },
  {
    url: 'https://www.canadianmortgagetrends.com/feed/',
    name: 'Canadian Mortgage Trends',
    category: 'Mortgage & Rates',
  },
  {
    url: 'https://storeys.com/feed/',
    name: 'Storeys',
    category: 'Market News',
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

    articles.push({
      title,
      link,
      source: feedMeta.name,
      category: feedMeta.category,
      date: date && !isNaN(date.getTime()) ? date.toISOString() : null,
      snippet,
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

  return allArticles.slice(0, 50);
}

/**
 * Get unique categories from feeds config.
 */
export function getCategories() {
  return [...new Set(RSS_FEEDS.map((f) => f.category))];
}
