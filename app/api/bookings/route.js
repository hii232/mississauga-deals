import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// Rate limiter
const rateMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60_000; }
  entry.count++;
  rateMap.set(ip, entry);
  if (rateMap.size > 1000) {
    for (const [key, val] of rateMap) { if (now > val.resetAt) rateMap.delete(key); }
  }
  return entry.count <= 10;
}

// Valid 30-min slots: 9:00 AM to 6:30 PM ET (last slot ends at 7 PM)
const VALID_SLOTS = [];
for (let h = 9; h <= 18; h++) {
  VALID_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 19) VALID_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

function getETDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));
}

/**
 * GET — Return booked slots for a given date
 * ?date=2026-04-15
 */
export async function GET(request) {
  if (!supabase) return NextResponse.json({ slots: [] });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date) return NextResponse.json({ slots: [] });

  // Ensure bookings table exists
  const { data, error } = await supabase
    .from('bookings')
    .select('booking_time')
    .eq('booking_date', date)
    .eq('status', 'confirmed');

  if (error) {
    // Table might not exist yet
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json({ slots: [], needsSetup: true });
    }
    return NextResponse.json({ slots: [] });
  }

  return NextResponse.json({
    slots: (data || []).map((r) => r.booking_time),
  });
}

/**
 * POST — Create a booking
 */
export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, email, phone, notes, date, time } = body;

  // Validation
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }
  if (!date || !time) {
    return NextResponse.json({ error: 'Date and time are required' }, { status: 400 });
  }
  if (!VALID_SLOTS.includes(time)) {
    return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });
  }

  // Check date is Mon-Sat and not in the past
  const bookingDate = new Date(date + 'T12:00:00');
  const dayOfWeek = bookingDate.getDay(); // 0=Sun
  if (dayOfWeek === 0) {
    return NextResponse.json({ error: 'Sunday bookings are not available' }, { status: 400 });
  }

  const etNow = getETDate();
  const today = new Date(etNow.getFullYear(), etNow.getMonth(), etNow.getDate());
  const bookDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
  if (bookDay < today) {
    return NextResponse.json({ error: 'Cannot book in the past' }, { status: 400 });
  }

  // Check for conflicts
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('booking_date', date)
    .eq('booking_time', time)
    .eq('status', 'confirmed')
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'This time slot is already booked. Please choose another.' }, { status: 409 });
  }

  // Insert booking
  const { error: insertErr } = await supabase.from('bookings').insert({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone || null,
    notes: notes || null,
    booking_date: date,
    booking_time: time,
    status: 'confirmed',
  });

  if (insertErr) {
    console.error('Booking insert error:', insertErr);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }

  // Also save as a lead
  await supabase.from('leads').insert({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone || null,
    source: 'booking',
    notes: `Booked call: ${date} at ${formatTime(time)} ET${notes ? '. ' + notes : ''}`,
    created_at: new Date().toISOString(),
  }).catch(() => {});

  // Send notification email
  if (process.env.RESEND_API_KEY) {
    sendBookingNotification({ name, email, phone, date, time, notes }).catch((err) =>
      console.error('Booking email failed:', err.message)
    );
  }

  return NextResponse.json({ success: true });
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

async function sendBookingNotification({ name, email, phone, date, time, notes }) {
  const displayTime = formatTime(time);
  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;">
      <div style="background:#0F2A4A;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:18px;">📅 New Booking on MississaugaInvestor.ca</h2>
      </div>
      <div style="background:#f8f9fa;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <div style="background:#fff;border:2px solid #2563EB;border-radius:8px;padding:16px;margin-bottom:16px;text-align:center;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;">Scheduled Call</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#0F2A4A;">${displayDate}</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:#2563EB;">${displayTime} ET</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Name</td><td style="padding:6px 0;font-weight:600;font-size:14px;">${name}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Email</td><td style="padding:6px 0;font-size:14px;"><a href="mailto:${email}">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Phone</td><td style="padding:6px 0;font-size:14px;"><a href="tel:${phone}">${phone}</a></td></tr>` : ''}
          ${notes ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Notes</td><td style="padding:6px 0;font-size:14px;font-style:italic;">${notes}</td></tr>` : ''}
        </table>
        <div style="margin-top:16px;">
          ${phone ? `<a href="https://wa.me/${phone.replace(/\\D/g, '')}?text=Hi%20${encodeURIComponent(name)}%2C%20confirming%20our%20call%20on%20${encodeURIComponent(displayDate)}%20at%20${encodeURIComponent(displayTime)}%20ET.%20Talk%20soon!" style="display:inline-block;background:#25D366;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;margin-right:8px;">WhatsApp</a>` : ''}
          <a href="mailto:${email}?subject=Call%20Confirmed%20-%20${encodeURIComponent(displayDate)}" style="display:inline-block;background:#1A73E8;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">Reply by Email</a>
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
      subject: `📅 New Booking: ${name} — ${displayDate} at ${displayTime} ET`,
      html,
    }),
  });
}
