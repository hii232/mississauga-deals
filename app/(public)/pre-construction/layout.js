export const metadata = {
  title: { absolute: 'Pre-Construction Condos Mississauga - VIP Access' },
  description: 'VIP early access to Mississauga pre-construction condos, plus up to $130,000 off with the Ontario HST rebate. Floor plans, pricing and investment analysis.',
  alternates: { canonical: '/pre-construction' },
  openGraph: {
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Pre-Construction Condos Mississauga - VIP Access + Save $130K HST' }],
    title: 'Pre-Construction Condos Mississauga - VIP Access + Save $130K HST',
    description: 'VIP access to pre-construction projects in Mississauga. Save up to $130,000 with the Ontario HST rebate on new homes.',
    url: 'https://www.mississaugainvestor.ca/pre-construction',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pre-Construction Condos Mississauga - VIP Access + Save $130K HST',
    description: 'VIP access to pre-construction projects in Mississauga. Save up to $130,000 with the Ontario HST rebate on new homes.',
    images: ['/opengraph-image'],
  },
};

export default function Layout({ children }) { return children; }
