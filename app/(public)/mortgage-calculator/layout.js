export const metadata = {
  title: 'Income Property Mortgage Calculator — Mississauga Cash Flow, Payments & Cap Rate',
  description: 'Free income property mortgage calculator for Mississauga & GTA investors. Calculate mortgage payments, rental cash flow, cap rate, CMHC insurance, land transfer tax and the federal stress test with current Canadian rates. Built by Hamza Nouman.',
  alternates: { canonical: '/mortgage-calculator' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: 'Income Property Mortgage Calculator — Mississauga Cash Flow & Payments',
    description: 'Free income property mortgage & cash-flow calculator for Mississauga real estate investors by Hamza Nouman.',
    url: 'https://www.mississaugainvestor.ca/mortgage-calculator',
  },
};
export default function Layout({ children }) { return children; }
