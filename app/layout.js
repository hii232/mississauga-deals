import Script from 'next/script';
import { Inter, DM_Sans } from 'next/font/google';
import './globals.css';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/json-ld';
import { Suspense } from 'react';
import PageTracker from '@/components/PageTracker';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-RNQHJGY0TV';

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
  authors: [{ name: 'Hamza Nouman', url: 'https://www.mississaugainvestor.ca' }],
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
  verification: {
    google: 'HMswsCSfiZJiN5IP8HeMHoOarI5MJlZmmLZr1_WOnu4',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#0F2A4A" />
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{page_path:window.location.pathname});`}
        </Script>
      </head>
      <body className="font-sans">
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <Suspense fallback={null}>
          <PageTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
