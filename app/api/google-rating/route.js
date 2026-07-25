import { NextResponse } from 'next/server';
import { fetchGoogleRating } from '@/lib/google-rating';

// Client components (the signup gate, the header trust bar) can't call the
// Places API directly — the key must never reach the browser. This route is the
// one server-side hop they go through, and it returns exactly the two numbers.
export const revalidate = 21600; // 6h, matching lib/google-rating.js

export async function GET() {
  const data = await fetchGoogleRating();

  // `configured: false` lets the client distinguish "no rating to show" from a
  // network blip, and hide the claim either way.
  return NextResponse.json(
    data
      ? { configured: true, ...data }
      : { configured: false, rating: null, reviewCount: null },
    { headers: { 'Cache-Control': 's-maxage=21600, stale-while-revalidate=3600' } }
  );
}
