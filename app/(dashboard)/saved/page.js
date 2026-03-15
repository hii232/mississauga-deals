'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { processListings } from '@/lib/listings/process-listings';
import { fmtK, fmtNum } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';

export default function SavedPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const savedIds = JSON.parse(localStorage.getItem('saved_deals') || '[]');
        if (savedIds.length === 0) {
          setListings([]);
          setLoading(false);
          return;
        }

        // Fetch all pages to find the saved listings
        let all = [];
        let page = 1;
        let totalPages = 1;
        while (page <= totalPages) {
          const res = await fetch('/api/listings?limit=200&page=' + page);
          const data = await res.json();
          const batch = data.listings || data || [];
          all.push(...batch);
          totalPages = data.pages || 1;
          page++;
        }
        const processed = processListings(all);
        const saved = processed.filter((l) => savedIds.includes(l.id));
        setListings(saved);
      } catch (err) {
        console.error('Failed to load saved deals:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleRemove(id) {
    const savedIds = JSON.parse(localStorage.getItem('saved_deals') || '[]');
    const updated = savedIds.filter((sid) => sid !== id);
    localStorage.setItem('saved_deals', JSON.stringify(updated));
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="section-title mb-2">Saved Deals</h1>
        <p className="section-subtitle">
          {listings.length > 0
            ? `You have ${listings.length} saved propert${listings.length === 1 ? 'y' : 'ies'}`
            : 'Properties you save will appear here'}
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="font-heading font-semibold text-xl text-navy mb-2">
            No saved deals yet
          </h2>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            Browse listings and click the heart icon to save properties you are interested in. They will appear here for easy comparison.
          </p>
          <Link href="/listings" className="btn-primary !px-8 !py-3 no-underline">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const scoreHex = scoreColorHex(listing.hamzaScore);
            return (
              <div
                key={listing.id}
                className="card overflow-hidden group"
              >
                {/* Photo */}
                <div className="relative h-44 overflow-hidden">
                  {listing.photos?.[0] ? (
                    <img
                      src={listing.photos[0]}
                      alt={listing.address}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                      </svg>
                    </div>
                  )}
                  <div
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
                    style={{ backgroundColor: scoreHex }}
                  >
                    {listing.hamzaScore}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="text-sm font-semibold text-navy hover:text-accent transition-colors line-clamp-1"
                  >
                    {listing.address}
                  </Link>
                  <p className="text-lg font-bold text-navy mb-2">{fmtK(listing.price)}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span>{listing.beds} bed</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>{listing.baths} bath</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="capitalize">{listing.type}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-cloud p-2.5 text-center mb-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase text-slate-400">Score</p>
                      <p className="text-sm font-bold" style={{ color: scoreHex }}>{listing.hamzaScore}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase text-slate-400">Cap</p>
                      <p className="text-sm font-bold text-navy">{listing.capRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase text-slate-400">CF</p>
                      <p className={`text-sm font-bold ${listing.cashFlow >= 0 ? 'text-success' : 'text-red-500'}`}>
                        {fmtNum(listing.cashFlow)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="text-xs font-medium text-accent hover:text-accent-dark no-underline"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleRemove(listing.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
