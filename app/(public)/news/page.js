import Link from 'next/link';
import { fetchAllFeeds, getSources, getTopics } from '@/lib/news/fetch-feeds';
import { NewsClient } from './news-client';

const TITLE = 'GTA Real Estate News & Market Intelligence for Investors';
const DESCRIPTION =
  'Stay updated with the latest Canadian real estate news, Bank of Canada rate decisions, market reports, and investment insights.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/news' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://www.mississaugainvestor.ca/news',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Cache the aggregated-feed render for 30 min (ISR). Without this the page was
// fully dynamic — re-fetching every external RSS feed on every request, which
// slows TTFB/LCP (a Core Web Vitals cost) and needlessly hammers the sources.
export const revalidate = 1800;

export default async function NewsPage() {
  const articles = await fetchAllFeeds();
  const sources = getSources();
  const topics = getTopics();

  return <NewsClient articles={articles} sources={sources} topics={topics} />;
}
