export const metadata = {
  title: { absolute: 'Income Property Mortgage Calculator (Ontario)' },
  description: 'Free calculator for Ontario income properties: mortgage payment, rental cash flow, cap rate, CMHC insurance, land transfer tax and the stress test.',
  alternates: { canonical: '/mortgage-calculator' },
  openGraph: {
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Income Property Mortgage Calculator - Mississauga Cash Flow & Payments' }],
    title: 'Income Property Mortgage Calculator - Mississauga Cash Flow & Payments',
    description: 'Free income property mortgage & cash-flow calculator for Mississauga real estate investors by Hamza Nouman.',
    url: 'https://www.mississaugainvestor.ca/mortgage-calculator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Income Property Mortgage Calculator - Mississauga Cash Flow & Payments',
    description: 'Free income property mortgage & cash-flow calculator for Mississauga real estate investors by Hamza Nouman.',
    images: ['/opengraph-image'],
  },
};
export default function Layout({ children }) { return children; }
