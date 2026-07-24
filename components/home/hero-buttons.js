'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// `count` is the real live listing count (string like "388" or "2,000+", or
// null when the feed returned nothing) passed from the server homepage — never
// a hardcoded number, so the #1 CTA can't show a stale/wrong figure.
export function HeroButtons({ count }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('user_registered'));
  }, []);

  const unlockLabel = count
    ? `Unlock ${count} Investment Deals — Free`
    : 'Unlock Investment Deals — Free';

  // ONE dominant action in the hero: the accent capture CTA. "Browse Deals"
  // duplicated the search bar's destination (/listings) as a near-equal-weight
  // button — demoted to a light text link so it keeps the path without
  // competing with the primary lead-capture button.
  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
      {isLoggedIn ? (
        <Link href="/quiz" className="btn-primary !text-base !px-8 !py-3.5 no-underline text-center w-full sm:w-auto">
          Find My Deal
        </Link>
      ) : (
        <Link href="/signup" className="btn-primary !text-base !px-8 !py-3.5 no-underline text-center w-full sm:w-auto">
          {unlockLabel}
        </Link>
      )}
      <Link
        href="/listings"
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/70 no-underline hover:text-white transition-colors"
      >
        Browse all deals
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
    </div>
  );
}
