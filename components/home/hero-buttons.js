'use client';

import Link from 'next/link';

export function HeroButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Link
        href="/ask-hamza"
        className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-bold rounded-lg px-7 py-3.5 text-base no-underline text-center shadow-lg shadow-accent/25 transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
        Get Hamza&rsquo;s Take on a Deal
      </Link>
      <Link
        href="/book-call"
        className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg px-7 py-3.5 text-base no-underline text-center hover:bg-white/20 transition-colors border border-white/20"
      >
        Book a Free Call
      </Link>
    </div>
  );
}
