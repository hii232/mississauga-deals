export const metadata = {
  title: { absolute: 'Income Property Mortgage Calculator (Ontario)' },
  description: 'Free calculator for Ontario income properties: mortgage payment, rental cash flow, cap rate, CMHC insurance, land transfer tax and the stress test.',
  alternates: { canonical: '/mortgage-calculator' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: 'Income Property Mortgage Calculator — Mississauga Cash Flow & Payments',
    description: 'Free income property mortgage & cash-flow calculator for Mississauga real estate investors by Hamza Nouman.',
    url: 'https://www.mississaugainvestor.ca/mortgage-calculator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Income Property Mortgage Calculator — Mississauga Cash Flow & Payments',
    description: 'Free income property mortgage & cash-flow calculator for Mississauga real estate investors by Hamza Nouman.',
    images: ['/opengraph-image'],
  },
};
export default function Layout({ children }) { return children; }
