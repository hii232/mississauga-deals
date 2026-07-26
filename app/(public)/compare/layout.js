export const metadata = {
  title: { absolute: 'Compare Investment Properties Side by Side' },
  description:
    'Compare Mississauga investment properties side by side — price, deal score, cash flow, cap rate, cash-on-cash return and suite potential.',
  alternates: { canonical: '/compare' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: 'Compare Investment Properties — MississaugaInvestor.ca',
    description: 'Side-by-side investment comparison: cash flow, cap rate, deal score, and more.',
    url: 'https://www.mississaugainvestor.ca/compare',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Investment Properties — MississaugaInvestor.ca',
    description: 'Side-by-side investment comparison: cash flow, cap rate, deal score, and more.',
    images: ['/opengraph-image'],
  },
};

export default function CompareLayout({ children }) {
  return children;
}
