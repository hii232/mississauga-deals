import { fetchAllFeeds, getSources, getTopics } from '@/lib/news/fetch-feeds';
import { NewsClient } from './news-client';
import { PageHero } from '@/components/layout/page-hero';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

const TITLE = 'GTA Real Estate News & Market Intelligence for Investors';
const DESCRIPTION =
  'Stay updated with the latest Canadian real estate news, Bank of Canada rate decisions, market reports, and investment insights.';

export const metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/news' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://www.mississaugainvestor.ca/news',
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/opengraph-image'],
  },
};

// Cache the aggregated-feed render for 30 min (ISR). Without this the page was
// fully dynamic — re-fetching every external RSS feed on every request, which
// slows TTFB/LCP (a Core Web Vitals cost) and needlessly hammers the sources.
export const revalidate = 1800;

const BASE = 'https://www.mississaugainvestor.ca';

export default async function NewsPage() {
  const articles = await fetchAllFeeds();
  const sources = getSources();
  const topics = getTopics();

  return (
    <div className="min-h-screen bg-cloud">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: `${BASE}/` },
          { name: 'GTA Real Estate News', url: `${BASE}/news` },
        ]}
      />
      <PageHero
        compact
        eyebrow="Live market news"
        title="GTA Real Estate News & Market Intelligence"
        subtitle="The latest GTA real estate news, Bank of Canada rate decisions, and market reports — curated for investors and updated continuously."
      />
      <NewsClient articles={articles} sources={sources} topics={topics} />
    </div>
  );
}
