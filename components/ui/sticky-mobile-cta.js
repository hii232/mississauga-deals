'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('user_registered') === 'true') { setDismissed(true); return; }
    const ts = localStorage.getItem('mobile_cta_dismissed_at');
    if (ts && Date.now() - parseInt(ts, 10) < 24 * 60 * 60 * 1000) { setDismissed(true); return; }
    const onScroll = () => { if (window.scrollY > 400) setVisible(true); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('mobile_cta_dismissed_at', String(Date.now()));
    setDismissed(true);
  };

  if (dismissed || !visible) return null;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-[200] bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-3 py-2.5 flex items-center gap-2">
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <a
        href="tel:+16476091289"
        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy text-white text-sm font-semibold py-2.5 no-underline active:scale-[.98] transition"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
        Call Hamza
      </a>
      <Link
        href="/book-call"
        className="flex-1 inline-flex items-center justify-center rounded-lg bg-accent text-white text-sm font-semibold py-2.5 no-underline active:scale-[.98] transition"
      >
        Book a Call
      </Link>
    </div>
  );
}
