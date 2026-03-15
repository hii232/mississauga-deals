import { RecentSalesClient } from './recent-sales-client';

export const metadata = {
  title: 'Recent Sales — MississaugaInvestor.ca',
  description:
    'Browse recently sold properties in Mississauga. See sold prices, days on market, and negotiation gaps to understand the real market.',
};

export default function RecentSalesPage() {
  return <RecentSalesClient />;
}
