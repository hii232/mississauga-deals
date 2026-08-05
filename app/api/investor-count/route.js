import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

/**
 * GET /api/investor-count
 *
 * The one number behind the seller pitch: how many registered investors this
 * site can put a listing in front of. Backs the "Selling an income property?"
 * band on /sell and the homepage.
 *
 * Rules, matching the house no-fabricated-counts policy (the "388" and
 * "thousands of investors" bugs both died for violating it):
 *   - The count is a real COUNT(*) over the leads table, never a constant.
 *   - Rounded DOWN to the nearest 10 and published as a floor ("480+"), so the
 *     claim stays true even as the exact number moves between cache refreshes.
 *   - Below MIN_PUBLISHABLE the endpoint returns null and the band shows no
 *     number at all - "12+ investors" would hurt more than help, and a null
 *     must render as silence, never a made-up fallback.
 *   - No env vars (builds, previews) -> null, same silence.
 */
const MIN_PUBLISHABLE = 100;

export async function GET() {
  let count = null;
  if (supabase) {
    try {
      const { count: n, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
      if (!error && typeof n === 'number' && n >= MIN_PUBLISHABLE) {
        count = Math.floor(n / 10) * 10;
      }
    } catch {
      // count stays null; the band renders without a number
    }
  }

  return NextResponse.json(
    { count },
    // A day fresh is plenty for a floor that only climbs, and the long SWR
    // keeps the band's server render instant (same split as the feeds).
    { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=86400' } }
  );
}
