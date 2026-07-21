import { RecentSalesClient } from './recent-sales-client';

const YEAR = new Date().getFullYear();

export const metadata = {
  title: `Mississauga Sold Prices ${YEAR} — Recent Home Sales & Sold Data`,
  description:
    `See what homes actually sold for in Mississauga in ${YEAR}: real sold prices, days on market, and list-vs-sold negotiation gaps, updated from MLS data. Know the real market before you offer.`,
  alternates: { canonical: '/recent-sales' },
  openGraph: {
    title: `Mississauga Sold Prices ${YEAR} — Recent Home Sales`,
    description:
      'Real sold prices, days on market, and negotiation gaps for Mississauga homes, updated from MLS data.',
    url: 'https://www.mississaugainvestor.ca/recent-sales',
  },
};

export default function RecentSalesPage() {
  return <RecentSalesClient />;
}
