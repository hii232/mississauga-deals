import Link from 'next/link';
import { relForInternalHref } from '@/lib/seo/internal-link';

// Sticky mobile-only primary CTA bar — the pattern proven on listing detail and
// the neighbourhood guides. Long content pages (search visitors may never reach
// the mid-page CTA) keep ONE clear action reachable while scrolling.
//
// - z-[150]: below the cookie banner (z-[200]) and exit-intent (z-[300]), so it
//   never covers a capture surface.
// - Safe-area padded for phones with home indicators.
// - Includes its own in-flow spacer (mobile-only) so page content never hides
//   behind the fixed bar — drop it in before the closing tag, no wrapper edits.
// - lg:hidden: desktop keeps the page's in-flow CTAs.
export function StickyMobileCTA({ href, label }) {
  return (
    <>
      <div className="h-24 lg:hidden" aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-[150] border-t border-slate-200 bg-white/95 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {/* rel is DERIVED, not passed: two of this component's callers point
            at filtered views (/listings?lrt=1, /listings?cf=1&sort=cashflow) and
            both were followed. Deriving it here means a future caller with a
            query string cannot reintroduce the problem. */}
        <Link href={href} rel={relForInternalHref(href)} className="btn-primary flex w-full items-center justify-center !py-3 no-underline">
          {label} &rarr;
        </Link>
      </div>
    </>
  );
}
