export const metadata = {
  title: { absolute: 'Best Neighbourhoods to Invest in Mississauga (2026)' },
  description:
    'All 24 Mississauga neighbourhoods ranked for investors by rent yield, price trend and days on market — Clarkson, Cooksville, Malton, Port Credit and more.',
  alternates: { canonical: '/neighbourhoods' },
  openGraph: {
    // 1200x630 = /opengraph-image's real size (verified in app/opengraph-image.js)
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Best Neighbourhoods to Invest in Mississauga (2026)' }],
    title: 'Best Neighbourhoods to Invest in Mississauga (2026)',
    description:
      'Mississauga neighbourhoods ranked for real estate investment — rent yields, average prices, cap rates, and market temperature.',
    url: 'https://www.mississaugainvestor.ca/neighbourhoods',
  },
};

// Metadata only. This layout wraps [slug] as well, so anything rendered
// here publishes on all 24 hood pages too — that is exactly how the
// city-wide FAQ, the directory ItemList and a generic breadcrumb ended up
// duplicated across 25 URLs, giving every detail page two FAQPage blocks
// and two BreadcrumbLists. Index-only schema now lives in page.js.
export default function Layout({ children }) { return children; }
