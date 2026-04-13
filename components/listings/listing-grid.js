'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ListingCard } from './listing-card';
import SignupGateModal from '@/components/ui/signup-gate-modal';

const PAGE_SIZE = 30;
const FREE_CARD_CLICKS = 3; // After this many card clicks, show signup modal

// All listings are gated for non-registered users
function isGatedDeal() {
  return true;
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="h-48 animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 animate-shimmer rounded" />
        <div className="h-5 w-1/3 animate-shimmer rounded" />
        <div className="h-3 w-1/2 animate-shimmer rounded" />
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="h-10 animate-shimmer rounded" />
          <div className="h-10 animate-shimmer rounded" />
          <div className="h-10 animate-shimmer rounded" />
          <div className="h-10 animate-shimmer rounded" />
        </div>
        <div className="flex justify-between mt-2">
          <div className="h-3 w-1/3 animate-shimmer rounded" />
          <div className="h-3 w-1/3 animate-shimmer rounded" />
        </div>
      </div>
    </div>
  );
}

export function ListingGrid({ listings, isRegistered, compareIds, onToggleCompare, photoMap, isLoading, initialPage }) {
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [accessVerified, setAccessVerified] = useState(isRegistered);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [cardClicks, setCardClicks] = useState(0);
  const [signupTrigger, setSignupTrigger] = useState('gate');

  // Verify access server-side (catches revoked users)
  useEffect(() => {
    if (!isRegistered) { setAccessVerified(false); return; }
    const email = typeof window !== 'undefined' ? localStorage.getItem('user_email') : null;
    if (!email) { setAccessVerified(true); return; }
    fetch('/api/check-access?email=' + encodeURIComponent(email))
      .then(r => r.json())
      .then(d => {
        if (d.access === false) {
          localStorage.removeItem('user_registered');
          localStorage.removeItem('user_name');
          localStorage.removeItem('user_email');
          setAccessVerified(false);
        } else {
          setAccessVerified(true);
        }
      })
      .catch(() => setAccessVerified(true));
  }, [isRegistered]);

  // Track card clicks for view-limit gate
  const handleCardClick = useCallback(() => {
    if (accessVerified) return; // registered users — no limit
    const newCount = cardClicks + 1;
    setCardClicks(newCount);
    if (newCount >= FREE_CARD_CLICKS) {
      setSignupTrigger('view-limit');
      setShowSignupModal(true);
    }
  }, [cardClicks, accessVerified]);

  // Reset to page 1 when listings change (except first render with initialPage)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setCurrentPage(1);
  }, [listings]);

  function handleSignupSuccess() {
    setAccessVerified(true);
    setShowSignupModal(false);
    // Force re-render with registration
    window.location.reload();
  }

  // Show skeletons while loading
  if (isLoading && listings.length === 0) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-center gap-3 rounded-xl bg-accent/5 border border-accent/10 px-4 py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm font-medium text-accent">
            Analyzing investment properties — scoring deals in real time...
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="mt-2 text-sm text-slate-500">No properties match your filters</p>
          <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(listings.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageListings = listings.slice(startIndex, startIndex + PAGE_SIZE);

  function handlePageChange(page) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getPageNumbers() {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pageListings.map((listing, index) => {
          const isGated = !accessVerified;
          return (
            <div key={listing.id} onClick={handleCardClick}>
              <ListingCard
                listing={listing}
                isGated={isGated}
                isCompared={compareIds.includes(listing.id)}
                onToggleCompare={onToggleCompare}
                batchPhoto={photoMap?.[listing.id]}
                onSignupClick={() => { setSignupTrigger('gate'); setShowSignupModal(true); }}
              />
            </div>
          );
        })}
      </div>

      {/* Mid-page signup nudge for non-registered users */}
      {!accessVerified && currentPage === 1 && pageListings.length > 9 && (
        <div className="my-8 rounded-2xl bg-gradient-to-r from-navy to-accent/80 px-8 py-8 text-center">
          <h3 className="text-lg font-bold text-white mb-2">You&apos;re browsing blind.</h3>
          <p className="text-sm text-white/60 mb-4 max-w-md mx-auto">
            The best deals have cash flow, cap rate, and deal scores hidden. Unlock them in 10 seconds.
          </p>
          <button
            onClick={() => { setSignupTrigger('gate'); setShowSignupModal(true); }}
            className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-navy transition hover:bg-white/90"
          >
            Unlock All Deals — Free
          </button>
          <p className="mt-2 text-[11px] text-white/40">No credit card. No spam. 10 seconds.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
          >
            &larr; Prev
          </button>

          {getPageNumbers().map((page, i) =>
            page === '...' ? (
              <span key={`dot-${i}`} className="px-2 text-sm text-slate-400">...</span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`min-w-[36px] rounded-lg px-3 py-2 text-sm font-medium transition ${
                  page === currentPage
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next &rarr;
          </button>
        </nav>
      )}

      <p className="py-4 text-center text-xs text-slate-400">
        Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, listings.length)} of {listings.length} properties
      </p>

      {/* Two-step signup modal */}
      <SignupGateModal
        open={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleSignupSuccess}
        trigger={signupTrigger}
      />
    </div>
  );
}
