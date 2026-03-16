'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tracked = useRef(new Set());

  useEffect(() => {
    // Dedupe: only track each path once per session
    if (tracked.current.has(pathname)) return;
    tracked.current.add(pathname);

    const utm_source = searchParams.get('utm_source') || null;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        utm_source,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
