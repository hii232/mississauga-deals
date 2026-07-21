import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata = {
  title: 'GTA Pre-Construction Projects — Condos & Townhomes Across the GTA | Hamza Nouman',
  description:
    'Browse 80+ pre-construction condos and townhomes across the GTA — Mississauga, Toronto, Brampton, Vaughan, Oakville, Markham, Hamilton & more. Get VIP pricing, floor plans, and first access through Hamza Nouman.',
  alternates: { canonical: '/pre-construction/projects' },
  openGraph: {
    title: 'GTA Pre-Construction Projects — Condos & Townhomes',
    description:
      'Browse the latest pre-construction projects across the Greater Toronto Area. VIP pricing and first access available.',
    url: 'https://www.mississaugainvestor.ca/pre-construction/projects',
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
