// These components only emit a <script type="application/ld+json"> tag — no
// hooks, no interactivity — so they render fine as server components. Dropping
// 'use client' keeps the JSON-LD in the SSR HTML (unchanged for SEO) while no
// longer shipping this module into the client bundle on every page.

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
      'Hamza Nouman is a licensed real estate Sales Representative with Cityscape Real Estate Ltd. in Mississauga, Ontario. He specializes in investment properties and data-driven real estate analysis. Creator of MississaugaInvestor.ca.',
    url: 'https://www.mississaugainvestor.ca/about',
    mainEntityOfPage: 'https://www.mississaugainvestor.ca/about',
    image: 'https://www.mississaugainvestor.ca/images/hamza-headshot.jpg',
    email: 'hamza@nouman.ca',
    telephone: '+1-647-609-1289',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '885 Plymouth Dr UNIT 2',
      addressLocality: 'Mississauga',
      addressRegion: 'ON',
      postalCode: 'L5V 0B5',
      addressCountry: 'CA',
    },
    worksFor: {
      '@type': 'RealEstateAgent',
      name: 'Cityscape Real Estate Ltd., Brokerage',
      url: 'https://www.cityscaperealestate.ca',
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
      'https://www.cityscaperealestate.ca',
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
    logo: 'https://www.mississaugainvestor.ca/opengraph-image',
    image: 'https://www.mississaugainvestor.ca/opengraph-image',
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
      streetAddress: '885 Plymouth Dr UNIT 2',
      addressLocality: 'Mississauga',
      addressRegion: 'ON',
      postalCode: 'L5V 0B5',
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
    // NOTE: no aggregateRating here. This LocalBusiness/RealEstateAgent schema
    // renders on every page via the global layout; injecting a self-serving
    // star rating on pages that don't display those reviews is exactly the
    // pattern Google's rich-results policy prohibits, and risks the whole
    // markup being discarded or a manual action. A rating belongs only on a
    // page that shows the underlying reviews.
    parentOrganization: {
      '@type': 'RealEstateAgent',
      name: 'Cityscape Real Estate Ltd., Brokerage',
      url: 'https://www.cityscaperealestate.ca',
    },
    sameAs: [
      'https://www.mississaugainvestor.ca',
      'https://www.hamzahomes.ca',
      'https://www.cityscaperealestate.ca',
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
// Map our listing type/subType to the closest schema.org Residence subtype so
// the property entity is described precisely for search engines.
function residenceType(listing) {
  const t = `${listing.type || ''} ${listing.subType || ''}`.toLowerCase();
  if (t.includes('condo') || t.includes('apart')) return 'Apartment';
  if (t.includes('town') || t.includes('row')) return 'House';
  return 'SingleFamilyResidence';
}

export function PropertyJsonLd({ listing }) {
  if (!listing) return null;

  const num = (v) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : null);

  // The property itself — nested under `about` so the RealEstateListing (the
  // page) and the residence (the property) are modelled correctly.
  const about = {
    '@type': residenceType(listing),
    name: listing.address,
  };
  const address = {
    '@type': 'PostalAddress',
    streetAddress: listing.address,
    addressLocality: listing.city || 'Mississauga',
    addressRegion: 'ON',
    addressCountry: 'CA',
    ...(listing.postalCode && { postalCode: listing.postalCode }),
  };
  about.address = address;
  if (num(listing.lat) !== null && num(listing.lng) !== null) {
    about.geo = { '@type': 'GeoCoordinates', latitude: listing.lat, longitude: listing.lng };
  }
  if (num(listing.beds) !== null) about.numberOfBedrooms = listing.beds;
  if (num(listing.baths) !== null) about.numberOfBathroomsTotal = listing.baths;
  if (num(listing.beds) !== null) about.numberOfRooms = listing.beds;
  if (num(listing.sqft) !== null) {
    about.floorSize = { '@type': 'QuantitativeValue', value: listing.sqft, unitCode: 'FTK' };
  }

  const images = Array.isArray(listing.photos) ? listing.photos.filter(Boolean).slice(0, 6) : [];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${listing.address} — ${listing.city || 'Mississauga'}`,
    url: `https://www.mississaugainvestor.ca/listings/${listing.id}`,
    description: `${listing.type || 'Property'} for sale at ${listing.address}, ${listing.city || 'Mississauga'}. ${listing.beds || 0} bed, ${listing.baths || 0} bath. Analyzed by Hamza Nouman at MississaugaInvestor.ca.`,
    datePosted: listing.listDate || undefined,
    ...(images.length && { image: images }),
    about,
  };

  if (num(listing.price) !== null) {
    schema.offers = {
      '@type': 'Offer',
      url: `https://www.mississaugainvestor.ca/listings/${listing.id}`,
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

  // Every post has an image: the stored cover or the generated branded one
  const coverImage =
    post.cover_image_url ||
    `https://www.mississaugainvestor.ca/api/blog-cover?title=${encodeURIComponent(post.title || '')}${post.category ? `&category=${encodeURIComponent(post.category)}` : ''}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || '',
    image: coverImage,
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
        // /images/og-image.jpg never existed (404) — use the generated brand image
        url: 'https://www.mississaugainvestor.ca/opengraph-image',
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
    name: 'Hamza Nouman — Mississauga Real Estate Investment Specialist',
    url: 'https://www.mississaugainvestor.ca/about',
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
