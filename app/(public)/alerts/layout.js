export const metadata = {
  title: 'Deal Alerts — Get Notified of New Mississauga Investment Deals',
  description:
    'Set up free deal alerts and get notified when new Mississauga investment properties match your budget, strategy, and neighbourhood. Cash flow, BRRR, and pre-construction alerts by Hamza Nouman.',
  alternates: { canonical: '/alerts' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: 'Deal Alerts — MississaugaInvestor.ca',
    description: 'Get notified when new Mississauga investment deals match your criteria.',
    url: 'https://www.mississaugainvestor.ca/alerts',
  },
};

export default function AlertsLayout({ children }) {
  return children;
}
