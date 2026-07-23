import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
//  "The whole database" — the single definition of who a broadcast reaches.
//
//  Mirrors the audience the weekly newsletter builds: every contact in `leads`
//  plus every email behind an active `saved_searches` row, MINUS anyone whose
//  lead row is marked unsubscribed (an opt-out wins even if they still have a
//  saved search). Emails are lower-cased + trimmed and de-duplicated.
//
//  Degrades to an empty list if a table is missing so a broadcast can never
//  crash on a schema difference.
// ─────────────────────────────────────────────────────────────────────────────

export function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * @returns {Promise<Array<{ email: string, name: string }>>} de-duplicated recipients
 */
export async function getBroadcastRecipients(supabase) {
  if (!supabase) return [];
  const byEmail = new Map(); // email -> name
  const optedOut = new Set();

  // Saved searches carry a name — a good personalization source
  try {
    const { data: searches } = await supabase
      .from('saved_searches')
      .select('email, name')
      .eq('active', true);
    for (const s of searches || []) {
      const email = normalize(s.email);
      if (!email) continue;
      if (!byEmail.get(email) && s.name) byEmail.set(email, s.name);
      else if (!byEmail.has(email)) byEmail.set(email, '');
    }
  } catch {
    // saved_searches table may not exist
  }

  // Leads = registered users + imported contacts + newsletter signups
  try {
    const { data: leads } = await supabase
      .from('leads')
      .select('email, name, status')
      .not('email', 'is', null);
    for (const l of leads || []) {
      const email = normalize(l.email);
      if (!email) continue;
      if (l.status === 'unsubscribed') {
        optedOut.add(email);
        continue;
      }
      if (!byEmail.get(email) && l.name) byEmail.set(email, l.name);
      else if (!byEmail.has(email)) byEmail.set(email, '');
    }
  } catch {
    // leads table may not exist
  }

  // An opt-out anywhere removes the address entirely
  for (const email of optedOut) byEmail.delete(email);

  return [...byEmail.entries()].map(([email, name]) => ({ email, name: name || '' }));
}

function normalize(email) {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
}
