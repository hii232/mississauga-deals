import { Inter, DM_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'MississaugaInvestor.ca — Mississauga Real Estate Investment Deals',
    template: '%s | MississaugaInvestor.ca',
  },
  description:
    'Find the best real estate investment deals in Mississauga. Cash flow analysis, cap rates, deal scores, and expert insights on every property.',
  keywords: [
    'Mississauga real estate',
    'investment properties',
    'cash flow analysis',
    'cap rate calculator',
    'Mississauga homes for sale',
    'real estate investing',
    'BRRR strategy',
    'rental properties Mississauga',
  ],
  authors: [{ name: 'Hamza Nouman', url: 'https://www.hamzahomes.ca' }],
  creator: 'Hamza Nouman',
  publisher: 'Royal LePage Signature Realty',
  metadataBase: new URL('https://www.mississaugainvestor.ca'),
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://www.mississaugainvestor.ca',
    siteName: 'MississaugaInvestor.ca',
    title: 'MississaugaInvestor.ca — Mississauga Real Estate Investment Deals',
    description:
      'Find the best real estate investment deals in Mississauga. Cash flow analysis, cap rates, and expert insights.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'MississaugaInvestor.ca',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MississaugaInvestor.ca — Mississauga Investment Deals',
    description: 'Cash flow analysis, cap rates, and deal scores for Mississauga properties.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
