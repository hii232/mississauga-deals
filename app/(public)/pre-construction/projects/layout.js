import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata = {
  title: 'GTA Pre-Construction Projects — Condos & Townhomes Across the GTA | Hamza Nouman',
  description:
    'Browse 80+ pre-construction condos and townhomes across the GTA — Mississauga, Toronto, Brampton, Vaughan, Oakville, Markham, Hamilton & more. Get VIP pricing, floor plans, and first access through Hamza Nouman.',
  alternates: { canonical: '/pre-construction/projects' },
  openGraph: {
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'GTA Pre-Construction Projects — Condos & Townhomes' }],
    title: 'GTA Pre-Construction Projects — Condos & Townhomes',
    description:
      'Browse the latest pre-construction projects across the Greater Toronto Area. VIP pricing and first access available.',
    url: 'https://www.mississaugainvestor.ca/pre-construction/projects',
  },
  // Next.js REPLACES (not merges) the root layout twitter object when a
  // layout segment defines its own openGraph — without this the projects
  // page shares text-only on X/Twitter/Slack/iMessage.
  twitter: {
    card: 'summary_large_image',
    title: 'GTA Pre-Construction Projects — Condos & Townhomes',
    description:
      'Browse the latest pre-construction projects across the Greater Toronto Area. VIP pricing and first access available.',
    images: ['/opengraph-image'],
  },
};

export default function Layout({ children }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Pre-Construction', url: 'https://www.mississaugainvestor.ca/pre-construction' },
          { name: 'Projects', url: 'https://www.mississaugainvestor.ca/pre-construction/projects' },
        ]}
      />
      {children}
    </>
  );
}
