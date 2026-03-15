'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fmtK } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';

function timeAgo(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
    // Sort by timestamp, most recent first
    const sorted = raw.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    setItems(sorted);
  }, []);

  function handleClear() {
    localStorage.removeItem('recently_viewed');
    setItems([]);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title mb-2">Recently Viewed</h1>
          <p className="section-subtitle">
            {items.length > 0
              ? `${items.length} propert${items.length === 1 ? 'y' : 'ies'} viewed recently`
              : 'Properties you view will appear here'}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-muted hover:text-red-500 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">👀</div>
          <h2 className="font-heading font-semibold text-xl text-navy mb-2">
            No recently viewed properties
          </h2>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            Start browsing listings and your viewing history will be tracked here for easy reference.
          </p>
          <Link href="/listings" className="btn-primary !px-8 !py-3 no-underline">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const scoreHex = scoreColorHex(item.score || 5);
            return (
              <Link
                key={item.id + '-' + idx}
                href={`/listings/${item.id}`}
                className="card flex items-center gap-4 p-4 hover:shadow-md transition-shadow no-underline group"
              >
                {/* Score circle */}
                <div
                  className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: scoreHex }}
                >
                  {item.score || '--'}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy group-hover:text-accent transition-colors truncate">
                    {item.address || 'Address on Request'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                    <span className="font-medium text-navy">{fmtK(item.price || 0)}</span>
                    {item.cashFlow != null && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className={item.cashFlow >= 0 ? 'text-success' : 'text-red-500'}>
                          {item.cashFlow >= 0 ? '+' : '-'}${Math.abs(item.cashFlow).toLocaleString()}/mo
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Time ago */}
                <div className="flex-shrink-0 text-xs text-muted">
                  {item.ts ? timeAgo(item.ts) : ''}
                </div>

                {/* Arrow */}
                <svg className="flex-shrink-0 h-4 w-4 text-slate-300 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
