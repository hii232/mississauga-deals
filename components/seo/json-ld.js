'use client';

// ── Person Schema — Hamza Nouman identity for Google Knowledge Panel ──
export function PersonJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': 'https://www.mississaugainvestor.ca/about#hamza-nouman',
    name: 'Hamza Nouman',
    givenName: 'Hamza',
    familyName: 'Nouman',
    jobTitle: 'Sales Representative',
    description:
      'Hamza Nouman is a licensed real estate Sales Representative with Royal LePage Signature Realty in Mississauga, Ontario. He specializes in investment properties and data-driven real estate analysis. Creator of MississaugaInvestor.ca.',
    url: 'https://www.mississaugainvestor.ca/about',
    image: 'https://www.mississaugainvestor.ca/images/hamza-headshot.jpg',
    email: 'hamza@nouman.ca',
    telephone: '+1-647-609-1289',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '30 Eglinton Ave W, Suite 201',
      addressLocality: 'Mississauga',
      addressRegion: 'ON',
      postalCode: 'L5R 3E7',
      addressCountry: 'CA',
    },
    worksFor: {
      '@type': 'RealEstateAgent',
      name: 'Royal LePage Signature Realty, Brokerage',
      url: 'https://www.royallepage.ca',
    },
    alumniOf: [
      {
        '@type': 'EducationalOrganization',
        name: 'Sheridan College',
      },
    ],
    knowsAbout: [
      'Real estate investing',
      'Cash flow analysis',
      'Mississauga real estate',
      'BRRR strategy',
      'Pre-construction investing',
      'Rental property analysis',
      'Cap rate calculation',
      'Investment property scoring',
    ],
    sameAs: [
      'https://www.mississaugainvestor.ca',
      'https://www.hamzahomes.ca',
      'https://www.royallepage.ca/en/agent/ontario/mississauga/hamza-nouman/73794/',
      'https://www.realtor.ca/agent/2100010/hamza-nouman-201-30-eglinton-ave-west-mississauga-ontario-l5r3e7',
      'https://www.linkedin.com/in/homeswithhamza/',
      'https://www.facebook.com/Homeswithhamza/',
      'https://www.homefinder.ca/agents/494937-hamza-nouman',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── Organization + LocalBusiness Schema — rendered on every page via root layout ──
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['RealEstateAgent', 'LocalBusiness'],
    '@id': 'https://www.mississaugainvestor.ca/#organization',
    name: 'Hamza Nouman — MississaugaInvestor.ca',
    alternateName: 'MississaugaInvestor.ca',
    url: 'https://www.mississaugainvestor.ca',
    logo: 'https://www.mississaugainvestor.ca/images/og-image.jpg',
    image: 'https://www.mississaugainvestor.ca/images/og-image.jpg',
    description:
      'Mississauga real estate investment platform by Hamza Nouman. Data-driven cash flow analysis, deal scores, cap rates, and expert insights on every investment property.',
    telephone: '+1-647-609-1289',
    email: 'hamza@nouman.ca',
    founder: {
      '@type': 'Person',
      '@id': 'https://www.mississaugainvestor.ca/about#hamza-nouman',
      name: 'Hamza Nouman',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '30 Eglinton Ave W, Suite 201',
      addressLocality: 'Mississauga',
      addressRegion: 'ON',
      postalCode: 'L5R 3E7',
      addressCountry: 'CA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 43.5890,
      longitude: -79.6441,
    },
    areaServed: [
      { '@type': 'City', name: 'Mississauga', containedInPlace: { '@type': 'AdministrativeArea', name: 'Ontario' } },
      { '@type': 'City', name: 'Oakville' },
      { '@type': 'City', name: 'Burlington' },
      { '@type': 'City', name: 'Brampton' },
      { '@type': 'City', name: 'Milton' },
      { '@type': 'City', name: 'Toronto' },
    ],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '21:00',
    },
    priceRange: '$$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      reviewCount: '28',
      bestRating: '5',
      worstRating: '1',
    },
    parentOrganization: {
      '@type': 'RealEstateAgent',
      name: 'Royal LePage Signature Realty, Brokerage',
      url: 'https://www.royallepage.ca',
    },
    sameAs: [
      'https://www.mississaugainvestor.ca',
      'https://www.hamzahomes.ca',
      'https://www.royallepage.ca/en/agent/ontario/mississauga/hamza-nouman/73794/',
      'https://www.realtor.ca/agent/2100010/hamza-nouman-201-30-eglinton-ave-west-mississauga-ontario-l5r3e7',
      'https://www.linkedin.com/in/homeswithhamza/',
      'https://www.facebook.com/Homeswithhamza/',
      'https://www.homefinder.ca/agents/494937-hamza-nouman',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-647-609-1289',
      contactType: 'sales',
      availableLanguage: ['English', 'Urdu', 'Hindi'],
      areaServed: 'CA',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Real Estate Services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Buyer Representation' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Investment Property Analysis' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Cash Flow & Cap Rate Analysis' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Pre-Construction VIP Access' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Seller Representation' } },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── WebSite Search Schema — for sitelinks search box in Google ──
export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://www.mississaugainvestor.ca/#website',
    name: 'MississaugaInvestor.ca',
    alternateName: 'Mississauga Investor',
    url: 'https://www.mississaugainvestor.ca',
    description: 'Mississauga real estate investment platform with data-driven deal scores, cash flow analysis, and expert insights by Hamza Nouman.',
    publisher: {
      '@type': 'Person',
      '@id': 'https://www.mississaugainvestor.ca/about#hamza-nouman',
      name: 'Hamza Nouman',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.mississaugainvestor.ca/listings?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-CA',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── BreadcrumbList Schema — for rich snippets in SERP ──
export function BreadcrumbJsonLd({ items }) {
  if (!items?.length) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── Property Listing Schema — for individual listing detail pages ──
export function PropertyJsonLd({ listing }) {
  if (!listing) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${listing.address} — ${listing.city || 'Mississauga'}`,
    url: `https://www.mississaugainvestor.ca/listings/${listing.id}`,
    description: `${listing.type || 'Property'} for sale at ${listing.address}, ${listing.city || 'Mississauga'}. ${listing.beds || 0} bed, ${listing.baths || 0} bath. Analyzed by Hamza Nouman at MississaugaInvestor.ca.`,
    datePosted: listing.listDate || undefined,
    ...(listing.photos?.[0] && { image: listing.photos[0] }),
  };

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

// ── Article Schema — for blog posts ──
export function ArticleJsonLd({ post }) {
  if (!post) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || '',
    ...(post.cover_image_url && { image: post.cover_image_url }),
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': 'Person',
      '@id': 'https://www.mississaugainvestor.ca/about#hamza-nouman',
      name: 'Hamza Nouman',
      url: 'https://www.mississaugainvestor.ca/about',
      image: 'https://www.mississaugainvestor.ca/images/hamza-headshot.jpg',
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://www.mississaugainvestor.ca/#organization',
      name: 'MississaugaInvestor.ca',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.mississaugainvestor.ca/images/og-image.jpg',
      },
    },
    mainEntityOfPage: `https://www.mississaugainvestor.ca/blog/${post.slug}`,
    isAccessibleForFree: true,
    inLanguage: 'en-CA',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── FAQ Schema — for pages with FAQ-like content ──
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

// ── ProfilePage Schema — for the about page (Google Knowledge Panel) ──
export function ProfilePageJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    dateCreated: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    mainEntity: {
      '@type': 'Person',
      '@id': 'https://www.mississaugainvestor.ca/about#hamza-nouman',
      name: 'Hamza Nouman',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
