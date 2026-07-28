import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata = {
  title: { absolute: 'Find Your Investment Strategy — 60-Second Quiz' },
  description: 'A 60-second quiz to find your Mississauga investment strategy — get matched to properties that fit your goals: cash flow, appreciation, or BRRR.',
  openGraph: {
    url: 'https://www.mississaugainvestor.ca/quiz',
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Find Your Investment Strategy — 60-Second Deal Quiz' }],
    title: 'Find Your Investment Strategy — 60-Second Deal Quiz',
    description: 'Discover your ideal Mississauga investment strategy in 60 seconds.',
  },
  alternates: { canonical: '/quiz' },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Your Investment Strategy — 60-Second Deal Quiz',
    description: 'Discover your ideal Mississauga investment strategy in 60 seconds.',
    images: ['/opengraph-image'],
  },
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
