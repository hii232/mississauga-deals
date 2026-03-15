'use client';

// Organization Schema — rendered on every page via root layout
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Hamza Nouman — MississaugaInvestor.ca',
    url: 'https://www.mississaugainvestor.ca',
    logo: 'https://www.mississaugainvestor.ca/images/og-image.jpg',
    description:
      'Mississauga real estate investment specialist. Cash flow analysis, deal scores, and expert insights on every property.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mississauga',
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
    areaServed: {
      '@type': 'City',
      name: 'Mississauga',
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: 'Ontario',
      },
    },
    parentOrganization: {
      '@type': 'RealEstateAgent',
      name: 'Royal LePage Signature Realty, Brokerage',
    },
    sameAs: ['https://www.hamzahomes.ca'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      availableLanguage: ['English'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Property Listing Schema — for individual listing detail pages
export function PropertyJsonLd({ listing }) {
  if (!listing) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${listing.address} — ${listing.city || 'Mississauga'}`,
    url: `https://www.mississaugainvestor.ca/listings/${listing.id}`,
    description: `${listing.type || 'Property'} for sale at ${listing.address}, ${listing.city || 'Mississauga'}. ${listing.beds || 0} bed, ${listing.baths || 0} bath.`,
    datePosted: listing.listDate || undefined,
    ...(listing.photos?.[0] && { image: listing.photos[0] }),
  };

  // Add price if available
  if (listing.price) {
    schema.offers = {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'CAD',
      availability: 'https://schema.org/InStock',
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// WebSite Search Schema — for sitelinks search box in Google
export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MississaugaInvestor.ca',
    url: 'https://www.mississaugainvestor.ca',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.mississaugainvestor.ca/listings?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// FAQ Schema — for pages with FAQ-like content
export function FAQJsonLd({ items }) {
  if (!items?.length) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
