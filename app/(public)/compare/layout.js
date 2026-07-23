export const metadata = {
  title: 'Compare Investment Properties Side by Side',
  description:
    'Compare Mississauga investment properties side by side — price, deal score, cash flow, cap rate, cash-on-cash return, suite potential, and more on MississaugaInvestor.ca.',
  alternates: { canonical: '/compare' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: 'Compare Investment Properties — MississaugaInvestor.ca',
    description: 'Side-by-side investment comparison: cash flow, cap rate, deal score, and more.',
    url: 'https://www.mississaugainvestor.ca/compare',
  },
};

export default function CompareLayout({ children }) {
  return children;
}
