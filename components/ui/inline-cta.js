'use client';

import Link from 'next/link';

/**
 * Reusable inline CTA banner for content pages.
 * Variants: 'deals' (default), 'quiz', 'alerts'
 */
const VARIANTS = {
  deals: {
    icon: '📊',
    headline: 'See Today\'s Top Investment Deals',
    sub: 'Every Mississauga listing scored for cash flow, cap rate, and ROI — updated daily.',
    primary: { label: 'Browse Deals', href: '/listings' },
    secondary: { label: 'Take the Quiz', href: '/quiz' },
    gradient: 'from-navy via-navy to-accent/20',
  },
  quiz: {
    icon: '🎯',
    headline: 'Not Sure Where to Start?',
    sub: 'Take the 60-second Deal Quiz and get matched with properties that fit your investment strategy.',
    primary: { label: 'Find My Strategy', href: '/quiz' },
    secondary: { label: 'Browse Listings', href: '/listings' },
    gradient: 'from-accent/90 via-accent to-navy/80',
  },
  alerts: {
    icon: '🔔',
    headline: 'Get Daily Deal Alerts',
    sub: 'New listings scored and delivered to your inbox every morning — never miss a deal.',
    primary: { label: 'Sign Up Free', href: '/quiz' },
    secondary: { label: 'See Listings', href: '/listings' },
    gradient: 'from-navy to-accent/30',
  },
  newsletter: {
    icon: '🏆',
    headline: 'Get the Top 5 Deals Every Week',
    sub: 'Join 200+ Mississauga investors who get our free weekly deal breakdown — scored, analyzed, and ranked.',
    primary: { label: 'Sign Up Free', href: '/listings' },
    secondary: { label: 'See All Deals', href: '/listings' },
    gradient: 'from-navy via-accent/30 to-navy',
  },
};

export default function InlineCTA({ variant = 'deals', className = '' }) {
  const v = VARIANTS[variant] || VARIANTS.deals;

  return (
    <div className={`bg-gradient-to-br ${v.gradient} rounded-2xl p-8 text-center ${className}`}>
      <span className="text-3xl mb-3 block">{v.icon}</span>
      <h3 className="font-heading text-xl font-bold text-white mb-2">{v.headline}</h3>
      <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">{v.sub}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={v.primary.href}
          className="btn-primary !px-6 no-underline text-center"
        >
          {v.primary.label}
        </Link>
        <Link
          href={v.secondary.href}
          className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 no-underline text-center"
        >
          {v.secondary.label}
        </Link>
      </div>
    </div>
  );
}
