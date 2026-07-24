import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata = {
  title: 'Find Your Investment Strategy — 60-Second Deal Quiz',
  description: 'Take a 60-second quiz to discover your ideal Mississauga real estate investment strategy. Get matched with properties that fit your goals: cash flow, appreciation, or BRRR.',
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: 'Find Your Investment Strategy — 60-Second Deal Quiz',
    description: 'Discover your ideal Mississauga investment strategy in 60 seconds.',
  },
  alternates: { canonical: '/quiz' },
};
export default function Layout({ children }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Deal Quiz', url: 'https://www.mississaugainvestor.ca/quiz' },
        ]}
      />
      {children}
    </>
  );
}
