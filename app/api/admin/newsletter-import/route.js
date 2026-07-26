import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
// A real list is hundreds of rows: a chunked existence lookup, batched
// backfill updates and chunked inserts. The default window is too tight.
export const maxDuration = 60;

// Bulk-import newsletter subscribers (e.g. a MailerLite export) into `leads`,
// which is the weekly-newsletter recipient list. Admin-gated.
//
// POST /api/admin/newsletter-import   (header: x-admin-key: <ADMIN_SECRET>)
// Body — either:
//   { "contacts": [{ "email": "a@b.com", "name": "Ann" }, ...] }
// or raw CSV text (Content-Type: text/csv) with an email column, e.g. a
// MailerLite export — the header row is used to find email/name columns.

function isAuthorized(request) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey && process.env.ADMIN_SECRET && adminKey === process.env.ADMIN_SECRET) return true;
  const auth = request.headers.get('authorization');
  if (auth && process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ESP exports are not reliably comma-separated — MailerLite's subscriber export
// is TAB-separated. Splitting on commas alone turned every row into a single
// field, so the email column was never found and a real 477-row export imported
// exactly zero contacts while reporting "No contacts found in payload".
// Detect the delimiter from the header row instead of assuming.
function detectDelimiter(headerLine) {
  const counts = [
    ['\t', (headerLine.match(/\t/g) || []).length],
    [',', (headerLine.match(/,/g) || []).length],
    [';', (headerLine.match(/;/g) || []).length],
  ].sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

// Minimal delimited parsing with quoted-field support — enough for ESP exports
function parseCsvLine(line, delim = ',') {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === delim) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

// Normalize a phone to (XXX) XXX-XXXX, or null when it isn't a real NA number.
// Exports carry all sorts: "416-555-0123", "(416) 555-0123", "4165550123",
// "14165550123", "p:+14165550123". Same fake-number rules as /api/lead so an
// import can't seed the database with contacts that can never be called.
function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  if (d.length !== 10) return null;
  if (/^(\d)\1{9}$/.test(d)) return null;             // all the same digit
  if (d.slice(0, 3) === '555' || d.slice(3, 6) === '555') return null;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function contactsFromCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const delim = detectDelimiter(lines[0]);
  const header = parseCsvLine(lines[0], delim).map((h) => h.toLowerCase().trim());
  // Find the email column by name (email / e-mail / email address / subscriber /
  // contact), then fall back to whichever column actually holds an email in the
  // first data row — so exports that label it "Subscriber" (MailerLite) or
  // anything unexpected still import correctly.
  let emailIdx = header.findIndex(
    (h) => h.includes('email') || h.includes('e-mail') || h === 'subscriber' || h === 'contact'
  );
  if (emailIdx === -1) {
    const firstRow = parseCsvLine(lines[1], delim);
    emailIdx = firstRow.findIndex((v) => EMAIL_RE.test((v || '').trim()));
  }
  if (emailIdx === -1) return [];
  const nameIdx = header.findIndex((h) => h === 'name' || h.includes('first name') || h === 'first_name' || h === 'fields.name');
  const lastIdx = header.findIndex((h) => h.includes('last name') || h === 'last_name');

  // Every column that could hold a phone, in preference order: the primary
  // "phone" first, then extras like "other phone #" / "work phone #" / "mobile".
  // Exports routinely leave the main column blank but fill a secondary one, so
  // taking only the first would throw away real numbers.
  const phoneIdxs = header
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => h.includes('phone') || h.includes('mobile') || h.includes('cell'))
    .sort((a, b) => {
      const rank = (h) => (h === 'phone' ? 0 : h.includes('mobile') || h.includes('cell') ? 1 : 2);
      return rank(a.h) - rank(b.h);
    })
    .map(({ i }) => i);

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line, delim);
    const first = nameIdx >= 0 ? (cols[nameIdx] || '').trim() : '';
    const last = lastIdx >= 0 ? (cols[lastIdx] || '').trim() : '';
    let phone = null;
    for (const i of phoneIdxs) {
      phone = normalizePhone(cols[i]);
      if (phone) break;
    }
    return {
      email: (cols[emailIdx] || '').trim(),
      name: [first, last].filter(Boolean).join(' '),
      phone,
    };
  });
}

export async function POST(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
        ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
        : null;
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const contentType = request.headers.get('content-type') || '';
    let contacts = [];
    if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      contacts = contactsFromCsv(await request.text());
    } else {
      const body = await request.json().catch(() => ({}));
      contacts = Array.isArray(body.contacts) ? body.contacts : [];
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts found in payload' }, { status: 400 });
    }
    if (contacts.length > 5000) {
      return NextResponse.json({ error: 'Max 5000 contacts per import' }, { status: 400 });
    }

    // Normalize, validate, dedupe within the payload
    const seen = new Set();
    const valid = [];
    let invalid = 0;
    for (const c of contacts) {
      const email = String(c.email || '').toLowerCase().trim();
      if (!EMAIL_RE.test(email)) { invalid++; continue; }
      if (seen.has(email)) continue;
      seen.add(email);
      valid.push({
        email,
        name: String(c.name || '').trim().slice(0, 120),
        phone: normalizePhone(c.phone),
      });
    }

    // Existing leads are never overwritten and an unsubscribe is never
    // resurrected — but a blank phone is a GAP, not a decision, so a re-upload
    // that carries numbers fills it in. This is the whole point of re-importing
    // an export after the ESP has collected phone numbers: the contacts are
    // already here, only their phones are missing.
    // Look the existing rows up in CHUNKS. PostgREST takes `in` filters as a
    // query string, and one `.in()` carrying every address of a real list (477
    // emails is ~12KB) runs past the server's URL limit — the lookup fails, the
    // whole list looks new, and the insert then collides with rows that were
    // already there. Chunked, the query is always small.
    const existingRows = [];
    const emails = valid.map((v) => v.email);
    for (let i = 0; i < emails.length; i += 100) {
      const { data, error } = await supabase
        .from('leads')
        .select('id, email, name, phone')
        .in('email', emails.slice(i, i + 100));
      if (error) {
        return NextResponse.json(
          { error: `Could not read existing contacts: ${error.message}` },
          { status: 500 }
        );
      }
      existingRows.push(...(data || []));
    }
    const existingSet = new Set(existingRows.map((e) => e.email));
    const toInsert = valid.filter((v) => !existingSet.has(v.email));

    const byEmail = new Map(valid.map((v) => [v.email, v]));
    let phonesBackfilled = 0;
    let namesBackfilled = 0;

    // Only the rows that actually need a change, so a re-upload of an already
    // complete list costs zero writes.
    const patches = [];
    for (const row of existingRows) {
      const incoming = byEmail.get(row.email);
      if (!incoming) continue;
      const patch = {};
      if (incoming.phone && !row.phone) patch.phone = incoming.phone;
      if (incoming.name && !row.name) patch.name = incoming.name;
      if (Object.keys(patch).length) patches.push({ id: row.id, patch });
    }

    // Batched rather than one-at-a-time: 258 sequential round trips would run
    // past the function timeout on a list this size and leave the import
    // half-applied.
    for (let i = 0; i < patches.length; i += 25) {
      const batch = patches.slice(i, i + 25);
      const results = await Promise.all(
        batch.map(({ id, patch }) =>
          supabase.from('leads').update(patch).eq('id', id).then(({ error }) => ({ error, patch }))
        )
      );
      for (const { error, patch } of results) {
        if (error) {
          console.error('Newsletter import: backfill failed for a row:', error.message);
          continue;
        }
        if (patch.phone) phonesBackfilled++;
        if (patch.name) namesBackfilled++;
      }
    }

    // Insert in chunks
    let imported = 0;
    let phonesImported = 0;
    for (let i = 0; i < toInsert.length; i += 200) {
      const slice = toInsert.slice(i, i + 200);
      const chunk = slice.map((v) => ({
        email: v.email,
        name: v.name,
        // Was hardcoded to '' — every phone number in every export uploaded
        // through this route was silently discarded.
        phone: v.phone || '',
        source: 'mailerlite-import',
        notes: 'Imported from MailerLite list',
      }));
      const { error } = await supabase.from('leads').insert(chunk);
      if (error) {
        return NextResponse.json(
          { error: `Insert failed after ${imported} rows: ${error.message}`, imported, skippedExisting: existingSet.size, invalid },
          { status: 500 }
        );
      }
      imported += chunk.length;
      phonesImported += slice.filter((v) => v.phone).length;
    }

    return NextResponse.json({
      ok: true,
      imported,
      phonesImported,
      phonesBackfilled,
      namesBackfilled,
      withPhone: valid.filter((v) => v.phone).length,
      skippedExisting: existingSet.size,
      invalid,
      totalNowEligible: imported + existingSet.size,
    });
  } catch (err) {
    console.error('Newsletter import error:', err);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
