export const metadata = {
  title: { absolute: 'Mississauga Real Estate Investment Blog & Insights' },
  description: 'Expert analysis, neighbourhood guides and investment strategies for Mississauga real estate investors — market updates and cash-flow insights, free.',
  alternates: { canonical: '/blog' },
  openGraph: {
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Investment Insights — Mississauga Real Estate Blog by Hamza Nouman' }],
    title: 'Investment Insights — Mississauga Real Estate Blog by Hamza Nouman',
    description: 'Expert Mississauga real estate investment analysis and guides by Hamza Nouman.',
    url: 'https://www.mississaugainvestor.ca/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Investment Insights — Mississauga Real Estate Blog by Hamza Nouman',
    description: 'Expert Mississauga real estate investment analysis and guides by Hamza Nouman.',
    images: ['/opengraph-image'],
  },
};
export default function Layout({ children }) { return children; }
