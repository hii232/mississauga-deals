'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/listings?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/listings');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 max-w-xl">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by address, neighbourhood, postal code..."
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pl-12 pr-28 py-3.5 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-accent/50 focus:bg-white/15 transition-colors"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-lg px-5 py-2 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
