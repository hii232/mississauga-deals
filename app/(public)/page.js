import Link from 'next/link';
import { GOOGLE_REVIEWS, HOOD_DATA } from '@/lib/constants';
import { headers } from 'next/headers';
import { processListings } from '@/lib/listings/process-listings';
import { fmtK } from '@/lib/utils/format';
import { HeroSearch } from '@/components/home/hero-search';
import { HeroButtons } from '@/components/home/hero-buttons';
import { EmailCapture } from '@/components/home/email-capture';
import { HomeDealCards } from '@/components/home/home-deal-cards';


export const metadata = {
  title: 'MississaugaInvestor.ca — Mississauga Real Estate Investment Deals by Hamza Nouman',
  description: 'Find the best real estate investment deals in Mississauga with Hamza Nouman, Cityscape Real Estate Ltd.. Cash flow analysis, cap rates, deal scores, and expert insights on every property. 2,000+ properties analyzed across 24 neighbourhoods.',
  alternates: {
    canonical: '/',
  },
};


// ─────────────────────────────────────────────
//   LIVE STATS FETCH (from unified market-stats API)
// ─────────────────────────────────────────────
async function fetchLiveStats() {
  try {
    const h = await headers();
    const host = h.get('host') || 'www.mississaugainvestor.ca';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${proto}://${host}`;


    const res = await fetch(`${baseUrl}/api/market-stats`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();


    const count = data.activeCount || 0;
    const avgDom = data.mississaugaAvgLDOM || data.avgDOM || 28;
