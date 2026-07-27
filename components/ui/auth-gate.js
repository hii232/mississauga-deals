'use client';

import { InlineEmailCapture } from '@/components/ui/inline-email-capture';
import { ProofRow } from '@/components/ui/proof-row';

// Shared email gate for VOW-restricted or otherwise premium data. When
// `isAuthenticated` is false the children are not rendered at all — the
// caller must also skip the data fetch itself while gated, not just hide the
// markup, so gated content never reaches the DOM or the network for an
// anonymous visitor. Extracted from the listing-detail page's own AuthGate
// (byte-identical UI) so /recent-sales, /neighbourhoods and /market-pulse can
// gate their individual sold-comp records the same way instead of each
// re-implementing the capture UI.
export function AuthGate({ children, isAuthenticated, title, valueLine, source, listing = null, onUnlock }) {
  if (isAuthenticated) return children;
  return (
    <div className="mx-auto max-w-md py-6 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10">
        <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
      <p className="mb-1 text-base font-bold text-navy">{title}</p>
      <p className="mx-auto mb-4 max-w-xs text-xs text-muted">{valueLine}</p>
      <div className="text-left">
        <InlineEmailCapture
          id={`gate-email-${source}`}
          source={source}
          tone="light"
          listing={listing}
          buttonLabel="Unlock — Free"
          note="Free forever. No credit card. Unsubscribe anytime."
          onCaptured={onUnlock}
        />
      </div>
      <ProofRow className="mt-5 border-t border-slate-100 pt-4" />
    </div>
  );
}
