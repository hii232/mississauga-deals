'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function HeroButtons() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('user_registered'));
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {isLoggedIn ? (
        <Link href="/quiz" className="btn-primary !text-base !px-8 !py-3.5 no-underline text-center">
          Find My Deal
        </Link>
      ) : (
        <Link href="/signup" className="btn-primary !text-base !px-8 !py-3.5 no-underline text-center">
          Unlock 388 Premium Deals — Free
        </Link>
      )}
      <Link href="/listings" className="bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg px-8 py-3.5 text-base no-underline text-center hover:bg-white/20 transition-colors border border-white/20">
        Browse Deals
      </Link>
    </div>
  );
}
