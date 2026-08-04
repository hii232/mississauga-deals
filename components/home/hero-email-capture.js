'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InlineEmailCapture } from '@/components/ui/inline-email-capture';

/**
 * Email capture in the homepage hero.
 *
 * Replaces the old hero button that navigated to /signup. Time-to-capture on
 * the site's #1 page was: click CTA → full page load → then type an email. Now
 * the field is the first thing in reach, and InlineEmailCapture persists the
 * email server-side the moment it is submitted - so a visitor who abandons the
 * profile step is still a real lead rather than a lost one.
 *
 * `count` is the real live listing count from the server homepage (string like
 * "388", or null when the feed returned nothing) - never a hardcoded number.
 */
export function HeroEmailCapture({ count }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('user_registered'));
  }, []);

  const browseLink = (
    <Link
      href="/listings"
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/70 no-underline hover:text-white transition-colors"
    >
      Browse all deals
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  );

  // Signed-in visitors already gave the email - send them to the next step.
  if (isLoggedIn) {
    return (
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
        <Link href="/quiz" className="btn-primary !text-base !px-8 !py-3.5 no-underline text-center w-full sm:w-auto">
          Find My Deal
        </Link>
        {browseLink}
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <InlineEmailCapture
        id="hero-email"
        source="Homepage Hero (email only)"
        buttonLabel={count ? `Unlock ${count} Deals - Free` : 'Unlock the Deals - Free'}
        onCaptured={() => setIsLoggedIn(true)}
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-xs text-white/70">Free forever. No credit card. Unsubscribe anytime.</p>
        {browseLink}
      </div>
    </div>
  );
}
