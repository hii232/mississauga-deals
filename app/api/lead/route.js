import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// Simple in-memory rate limiter (per IP, 10 requests per minute)
const rateMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 10;
  const entry = rateMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  rateMap.set(ip, entry);
  // Cleanup old entries periodically
  if (rateMap.size > 1000) {
    for (const [key, val] of rateMap) {
      if (now > val.resetAt) rateMap.delete(key);
    }
  }
  return entry.count <= maxRequests;
}

export async function POST(request) {
  // Rate limit check
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, firstName, lastName, email, phone, listingId, listingAddress, listingPrice, source, notes, timestamp } = body;

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  // Phone is mandatory for registration signups
  if (source === 'registration') {
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    const digits = phone.replace(/\D/g, '');
    // Must be 10 digits or 11 starting with 1 (Canadian format)
    if (!(digits.length === 10 || (digits.length === 11 && digits.startsWith('1')))) {
      return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 });
    }
    // Block obvious fakes: all same digit, sequential, 555 numbers
    const area = digits.slice(digits.length - 10, digits.length - 7);
    const allSame = /^(\d)\1{9}$/.test(digits.slice(-10));
    const is555 = area === '555' || digits.slice(-7, -4) === '555';
    if (allSame || is555) {
      return NextResponse.json({ error: 'Please enter a real phone number' }, { status: 400 });
    }
  }

  // If Supabase is configured, check for duplicates and insert
  if (supabase) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .limit(1)
      .single();

    if (existing) {
      // Email already exists — still allow login, just don't create a duplicate lead
      // But still send notification email so Hamza knows about the return visit
      if (process.env.RESEND_API_KEY) {
        sendLeadNotification({ name, email, phone, source: source + ' (returning)', listingId, listingAddress, listingPrice, notes }).catch(() => {});
      }
      return NextResponse.json({ success: true, existing: true });
    }

    const { error: insertError } = await supabase.from('leads').insert({
      name: name || [firstName, lastName].filter(Boolean).join(' ') || null,
      email: email.toLowerCase().trim(),
      phone: phone || null,
      listing_id: listingId || null,
      listing_address: listingAddress || null,
      listing_price: listingPrice || null,
      source: source || 'unknown',
      notes: [firstName && lastName ? `Name: ${firstName} ${lastName}` : null, notes].filter(Boolean).join('. ') || null,
      created_at: timestamp || new Date().toISOString(),
    });

    if (insertError) {
      console.error('Lead insert error:', JSON.stringify(insertError));
      console.error('Lead insert data:', JSON.stringify({ name, email, phone, source }));
      // Still return success so the user can sign up
    } else {
      console.log('Lead saved:', email, source);
    }
  }

  // Send notification email to Hamza (non-blocking)
  if (process.env.RESEND_API_KEY) {
    sendLeadNotification({ name, email, phone, source, listingId, listingAddress, listingPrice, notes }).catch((err) =>
      console.error('Email notification failed:', err.message)
    );
  }

  return NextResponse.json({ success: true });
}

// ── Email notification via Resend ──
async function sendLeadNotification({ name, email, phone, source, listingId, listingAddress, listingPrice, notes }) {
  // Human-friendly source labels. Keep in sync with the sources sent across the
  // site (signup, quiz, Google, alerts, pre-con VIP, exit-intent, saved search,
  // bookings). A " (returning)" suffix is preserved for repeat leads.
  const sourceLabels = {
    registration: 'Sign Up',
    quiz: 'Quiz',
    'google-signin': 'Google',
    'deal-alert': 'Deal Alert',
    'precon-vip': 'Pre-Construction VIP',
    'exit-intent': 'Exit-Intent Popup',
    'saved-search': 'Saved Search',
    newsletter: 'Newsletter',
    booking: 'Booked Call',
    viewing: 'Viewing Request',
    'seller-valuation': 'Seller — Home Valuation',
  };
  const isReturning = typeof source === 'string' && source.endsWith(' (returning)');
  const baseSource = isReturning ? source.replace(/ \(returning\)$/, '') : source;
  const srcLabel = (sourceLabels[baseSource] || baseSource || 'Unknown') + (isReturning ? ' (returning)' : '');

  // One-line "what this lead is for", derived from the source + property so
  // Hamza can tell at a glance what the person did.
  const intentBySource = {
    registration: listingAddress ? 'Created a free account while viewing a property' : 'Created a free account',
    quiz: 'Completed the investor quiz',
    'google-signin': listingAddress ? 'Signed in with Google while viewing a property' : 'Signed in with Google',
    'deal-alert': 'Signed up for deal alerts',
    'precon-vip': 'Requested pre-construction VIP access',
    'exit-intent': 'Grabbed the exit-intent offer',
    'saved-search': 'Saved a search for alerts',
    newsletter: 'Subscribed to the newsletter',
    'seller-valuation': 'Requested a free home valuation (seller lead)',
  };
  const intentLine = intentBySource[baseSource] || 'New lead captured';

  const listingUrl = listingId ? `https://www.mississaugainvestor.ca/listings/${encodeURIComponent(listingId)}` : '';
  const priceLabel = listingPrice ? ` — $${Number(listingPrice).toLocaleString()}` : '';

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;">
      <div style="background:#0F2A4A;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:18px;">🔔 New Lead on MississaugaInvestor.ca</h2>
        <p style="color:#9db4d4;margin:6px 0 0;font-size:13px;">${intentLine}</p>
      </div>
      <div style="background:#f8f9fa;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        ${listingAddress ? `<div style="background:#eef4ff;border:1px solid #c7d7fb;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
          <p style="margin:0 0 2px;color:#2563EB;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;">Looking at this property</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#0F2A4A;">${listingAddress}${priceLabel}</p>
          ${listingUrl ? `<a href="${listingUrl}" style="display:inline-block;margin-top:6px;color:#2563EB;font-size:13px;font-weight:600;text-decoration:none;">View listing →</a>` : ''}
        </div>` : ''}
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Name</td><td style="padding:6px 0;font-weight:600;font-size:14px;">${name || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Email</td><td style="padding:6px 0;font-size:14px;"><a href="mailto:${email}">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Phone</td><td style="padding:6px 0;font-size:14px;"><a href="tel:${phone}">${phone}</a></td></tr>` : ''}
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Source</td><td style="padding:6px 0;font-size:14px;">${srcLabel}</td></tr>
          ${listingAddress ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Property</td><td style="padding:6px 0;font-size:14px;">${listingUrl ? `<a href="${listingUrl}" style="color:#2563EB;text-decoration:none;">${listingAddress}</a>` : listingAddress}${priceLabel}</td></tr>` : ''}
          ${notes ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Notes</td><td style="padding:6px 0;font-size:14px;font-style:italic;">${notes}</td></tr>` : ''}
        </table>
        <div style="margin-top:16px;">
          ${phone ? `<a href="https://wa.me/${phone.replace(/\\D/g, '')}?text=Hi%20${encodeURIComponent(name || '')}%2C%20thanks%20for%20reaching%20out%20on%20MississaugaInvestor.ca!" style="display:inline-block;background:#25D366;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;margin-right:8px;">WhatsApp</a>` : ''}
          <a href="mailto:${email}?subject=Re:%20MississaugaInvestor.ca" style="display:inline-block;background:#1A73E8;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">Reply by Email</a>
        </div>
      </div>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'MississaugaInvestor <notifications@mississaugainvestor.ca>',
      to: process.env.LEAD_NOTIFICATION_EMAIL || 'hamza@nouman.ca',
      subject: `New Lead: ${name || email} (${srcLabel})`,
      html,
    }),
  });
}
