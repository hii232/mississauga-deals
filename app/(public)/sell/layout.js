export const metadata = {
  title: { absolute: 'Sell Your Mississauga Home - Free Home Valuation' },
  description: 'Get a free market evaluation for your Mississauga property from Hamza Nouman, Sales Representative at Cityscape Real Estate Ltd.. Data-driven pricing, expert negotiation, and maximum value for your home.',
  alternates: { canonical: '/sell' },
  openGraph: {
    // Superseded by sell/page.js's own openGraph (Next uses the page over the
    // layout when both declare one) - fixed here too since it looked wrong and
    // dead code that looks broken invites someone to copy the mistake.
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Sell Your Mississauga Property - Free Market Evaluation by Hamza Nouman' }],
    title: 'Sell Your Mississauga Property - Free Market Evaluation by Hamza Nouman',
    description: 'Free market evaluation for your Mississauga property by Hamza Nouman, Cityscape Real Estate Ltd.',
    url: 'https://www.mississaugainvestor.ca/sell',
  },
};
export default function Layout({ children }) { return children; }
