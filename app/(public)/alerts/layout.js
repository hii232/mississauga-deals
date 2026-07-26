import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata = {
  title: { absolute: 'Free Mississauga Deal Alerts — New Listings by Email' },
  description:
    'Free deal alerts: get emailed when a new Mississauga investment property matches your budget, strategy and neighbourhood. Unsubscribe in one click.',
  alternates: { canonical: '/alerts' },
  openGraph: {
    images: ['/opengraph-image'], // branded fallback OG (Next replaces, not merges, the parent openGraph)
    title: 'Deal Alerts — MississaugaInvestor.ca',
    description: 'Get notified when new Mississauga investment deals match your criteria.',
    url: 'https://www.mississaugainvestor.ca/alerts',
  },
};

export default function AlertsLayout({ children }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Deal Alerts', url: 'https://www.mississaugainvestor.ca/alerts' },
        ]}
      />
      {children}
    </>
  );
}
