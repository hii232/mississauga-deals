const BASE = 'https://www.mississaugainvestor.ca';

// Note: pages that carry `robots: { index: false }` metadata (profile, saved,
// recent, login, signup) are intentionally NOT disallowed here — crawlers must
// be able to fetch them to see the noindex directive, otherwise the bare URLs
// can still end up indexed.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
