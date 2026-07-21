import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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

// Minimal CSV parsing with quoted-field support — enough for ESP exports
function parseCsvLine(line) {
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
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function contactsFromCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const emailIdx = header.findIndex((h) => h.includes('email'));
  if (emailIdx === -1) return [];
  const nameIdx = header.findIndex((h) => h === 'name' || h.includes('first name') || h === 'first_name' || h === 'fields.name');
  const lastIdx = header.findIndex((h) => h.includes('last name') || h === 'last_name');

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const first = nameIdx >= 0 ? (cols[nameIdx] || '').trim() : '';
    const last = lastIdx >= 0 ? (cols[lastIdx] || '').trim() : '';
    return {
      email: (cols[emailIdx] || '').trim(),
      name: [first, last].filter(Boolean).join(' '),
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
      valid.push({ email, name: String(c.name || '').trim().slice(0, 120) });
    }

    // Skip emails already in leads (never overwrite an existing lead or
    // resurrect an unsubscribed one)
    const { data: existing } = await supabase
      .from('leads')
      .select('email')
      .in('email', valid.map((v) => v.email));
    const existingSet = new Set((existing || []).map((e) => e.email));
    const toInsert = valid.filter((v) => !existingSet.has(v.email));

    // Insert in chunks
    let imported = 0;
    for (let i = 0; i < toInsert.length; i += 200) {
      const chunk = toInsert.slice(i, i + 200).map((v) => ({
        email: v.email,
        name: v.name,
        phone: '',
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
    }

    return NextResponse.json({
      ok: true,
      imported,
      skippedExisting: existingSet.size,
      invalid,
      totalNowEligible: imported + existingSet.size,
    });
  } catch (err) {
    console.error('Newsletter import error:', err);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
