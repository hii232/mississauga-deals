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

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {isLoggedIn ? (
        <Link href="/quiz" className="btn-primary !text-base !px-8 !py-3.5 no-underline text-center">
          Find My Deal
        </Link>
      ) : (
        <Link href="/signup" className="btn-primary !text-base !px-8 !py-3.5 no-underline text-center">
          {unlockLabel}
        </Link>
      )}
      <Link href="/listings" className="bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg px-8 py-3.5 text-base no-underline text-center hover:bg-white/20 transition-colors border border-white/20">
        Browse Deals
      </Link>
    </div>
  );
}
