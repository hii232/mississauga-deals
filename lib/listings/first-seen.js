import { createClient } from '@supabase/supabase-js';
import { computeDomFloor } from './market-timing';

// Tracks when each listing FIRST appeared in our feed. Unlike
// ModificationTimestamp (which resets on every price change), first_seen only
// ever gets older - so the honest "N+ days on market" floor keeps tightening
// daily even for listings that keep changing. Runs inside the (15-min cached)
// listing APIs: one ignore-duplicates upsert + one select per cache miss.
// Without Supabase env (local builds) or before the migration runs, it
// silently no-ops and the floor falls back to modification recency alone.
const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// Returns a STATUS STRING, surfaced by both feed APIs as `firstSeenTracker`
// so the tracker's state is diagnosable from production in one request (the
// same pattern as fieldTier): "on", "off - no Supabase env", "off - table
// missing (...)", or "error: …". Errors never block the response - the floor
// is always pre-set from what we already know before Supabase is touched.
export async function applyFirstSeenFloor(listings) {
  // Always set the floor from what we already know…
  for (const l of listings) l.domFloor = computeDomFloor(l.dom, l.daysSinceUpdate, 0);
  if (!supabase) return 'off - no Supabase env';
  if (!listings.length) return 'on';
  try {
    const ids = listings.map((l) => String(l.id)).filter(Boolean);
    // Record newcomers (never updates an existing first_seen).
    const { error: upsertErr } = await supabase
      .from('listing_first_seen')
      .upsert(ids.map((id) => ({ listing_id: id })), { onConflict: 'listing_id', ignoreDuplicates: true });
    if (upsertErr) {
      // PostgREST reports a missing table as "relation … does not exist" or
      // PGRST205 "Could not find the table … in the schema cache".
      return /does not exist|schema cache|42P01|PGRST205/i.test(upsertErr.message || upsertErr.code || '')
        ? 'off - table missing: run supabase/migrations/create_listing_first_seen.sql in the Supabase SQL editor'
        : 'error: ' + String(upsertErr.message || upsertErr.code || 'unknown').slice(0, 140);
    }
    const { data, error: selErr } = await supabase
      .from('listing_first_seen')
      .select('listing_id, first_seen_at')
      .in('listing_id', ids);
    if (selErr) return 'error: ' + String(selErr.message || 'unknown').slice(0, 140);
    if (data) {
      const now = Date.now();
      const seen = new Map(data.map((r) => [r.listing_id, r.first_seen_at]));
      for (const l of listings) {
        const fs = seen.get(String(l.id));
        if (fs) {
          const d = Math.floor((now - new Date(fs).getTime()) / 86400000);
          if (d > 0 && d < 1000) l.domFloor = computeDomFloor(l.dom, l.daysSinceUpdate, d);
        }
      }
    }
    return 'on';
  } catch (e) {
    return 'error: ' + String(e?.message || e).slice(0, 140); // floor already set from known data
  }
}
