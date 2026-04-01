import Link from 'next/link';
import { fetchAllFeeds, getSources, getTopics } from '@/lib/news/fetch-feeds';
import { NewsClient } from './news-client';

export const metadata = {
  title: 'Real Estate Intelligence — MississaugaInvestor.ca',
  description:
    'Stay updated with the latest Canadian real estate news, Bank of Canada rate decisions, market reports, and investment insights.',
  alternates: { canonical: '/news' },
};

export default async function NewsPage() {
  const articles = await fetchAllFeeds();
  const sources = getSources();
  const topics = getTopics();

  return <NewsClient articles={articles} sources={sources} topics={topics} />;
}
