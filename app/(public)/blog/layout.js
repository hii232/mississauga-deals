export const metadata = {
  title: { absolute: 'Mississauga Real Estate Investment Blog & Insights' },
  description: 'Expert analysis, neighbourhood guides and investment strategies for Mississauga real estate investors — market updates and cash-flow insights, free.',
  alternates: { canonical: '/blog' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: 'Investment Insights — Mississauga Real Estate Blog by Hamza Nouman',
    description: 'Expert Mississauga real estate investment analysis and guides by Hamza Nouman.',
    url: 'https://www.mississaugainvestor.ca/blog',
  },
};
export default function Layout({ children }) { return children; }
