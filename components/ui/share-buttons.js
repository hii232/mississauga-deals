// Always the production origin, never the NODE_ENV-aware SITE_URL other
// modules build: a shared link has to work for the recipient, and a localhost
// or preview-deployment URL is dead the moment it leaves this machine.
const PUBLIC_ORIGIN = 'https://www.mississaugainvestor.ca';

// Social share row. The Seobility audit flagged the site as offering few
// sharing options - every share is a potential referring domain, which is also
// the site's weakest external-factors metric.
//
// Deliberately a SERVER component: these are plain prefilled share URLs, so
// they need no client JS, no third-party SDK, and no tracking pixel. Official
// share widgets (the Facebook SDK in particular) load ~100kB and set cookies
// before the visitor has clicked anything - a real Core Web Vitals and privacy
// cost for a button most visitors never press.
export default function ShareButtons({ url, title, className = '' }) {
  // Absolute URL required - share endpoints reject relative paths.
  const abs = url.startsWith('http') ? url : `${PUBLIC_ORIGIN}${url}`;
  const u = encodeURIComponent(abs);
  const t = encodeURIComponent(title);

  const targets = [
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
    },
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${t}%20${u}`,
      path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488',
    },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">Share</span>
      {targets.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          // noopener/noreferrer: these open a cross-origin tab, which without
          // noopener can reach back through window.opener. nofollow because a
          // share endpoint is not an endorsement worth passing equity to.
          rel="noopener noreferrer nofollow"
          aria-label={`Share on ${s.name}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-navy no-underline transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d={s.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
