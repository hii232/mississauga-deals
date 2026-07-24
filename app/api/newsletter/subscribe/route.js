import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unsubscribeUrl } from '@/lib/unsubscribe-token';
import { tagRecipient } from '@/lib/emails/recipient-token';

// Instant expectation-setting welcome — fire-and-forget, never blocks signup
async function sendWelcomeEmail(email) {
  if (!process.env.RESEND_API_KEY) return;
  const SERIF = "Georgia,'Times New Roman',serif";
  const html = `
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F2EC" style="background:#F5F2EC;padding:32px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;"><tr><td style="padding:0 40px;">
  <div style="border-top:3px solid #0F2A4A;border-bottom:1px solid #0F2A4A;height:2px;margin-bottom:22px;"></div>
  <div style="text-align:center;font-family:${SERIF};font-size:26px;font-weight:700;color:#0F2A4A;letter-spacing:4px;">MISSISSAUGA INVESTOR</div>
  <div style="text-align:center;font-family:${SERIF};font-size:10px;color:#A9853B;text-transform:uppercase;letter-spacing:3px;margin-top:8px;">Welcome to the Weekly Briefing</div>
  <div style="border-top:1px solid #DCD5C6;margin:22px 0;"></div>
  <div style="font-family:${SERIF};font-size:15px;color:#0F2A4A;line-height:1.7;">
    You're in. Here's exactly what to expect:
  </div>
  <div style="font-family:${SERIF};font-size:14px;color:#3d3a33;line-height:1.8;margin-top:14px;">
    <strong>What:</strong> the Mississauga Market Weekly &mdash; the week's top-scored investment deals with cap rates and cash flow, live market numbers, and one worthwhile read.<br/>
    <strong>When:</strong> Monday mornings. One email a week, nothing else.<br/>
    <strong>From:</strong> Hamza Nouman, licensed Sales Representative, Cityscape Real Estate Ltd.
  </div>
  <div style="margin-top:22px;text-align:center;">
    <a href="https://www.mississaugainvestor.ca/listings?utm_source=welcome&utm_medium=email&utm_campaign=onboarding" style="display:inline-block;background:#0F2A4A;color:#F5F2EC;font-family:${SERIF};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;padding:12px 26px;text-decoration:none;">Browse This Week's Deals</a>
  </div>
  <div style="border-top:1px solid #DCD5C6;margin:26px 0 14px;"></div>
  <div style="text-align:center;font-family:${SERIF};font-size:9px;color:#6F6A5D;line-height:1.6;">
    &copy; MississaugaInvestor.ca &middot; 885 Plymouth Dr UNIT 2, Mississauga, ON L5V 0B5<br/>
    <a href="${unsubscribeUrl(email)}" style="color:#6F6A5D;text-decoration:underline;">Unsubscribe anytime</a>
  </div>
  <div style="border-top:1px solid #0F2A4A;border-bottom:3px solid #0F2A4A;height:2px;margin-top:16px;"></div>
</td></tr></table>
</td></tr></table>`;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'MississaugaInvestor <notifications@mississaugainvestor.ca>',
        to: email,
        subject: "You're in — the Mississauga Market Weekly arrives Monday",
        html: tagRecipient(html, email),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl(email)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    });
  } catch (err) {
    console.error('Welcome email failed:', err.message);
  }
}

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export async function POST(request) {
  try {
    const { email, source, utm_source, utm_medium, utm_campaign } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!supabase) {
      return NextResponse.json({ ok: true, message: "You're in. First email arrives Monday." });
    }

    // Check if already in leads table (existing user/subscriber)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('email, source')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingLead) {
      // Check source to determine message
      if (existingLead.source === 'homepage_weekly_deals' || existingLead.source === 'newsletter') {
        return NextResponse.json({
          ok: true,
          message: "You're already subscribed. Check your inbox Monday.",
          existing: true,
        });
      }
      return NextResponse.json({
        ok: true,
        message: "You're already subscribed. Log in to customize your deal alerts.",
        existing: true,
      });
    }

    // Insert as new lead with newsletter source
    await supabase.from('leads').insert({
      email: normalizedEmail,
      source: source || 'homepage_weekly_deals',
      name: '',
      phone: '',
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
    });

    // Fire-and-forget — the signup response never waits on the welcome email
    sendWelcomeEmail(normalizedEmail);

    return NextResponse.json({
      ok: true,
      message: "You're in. First email arrives Monday.",
    });
  } catch (err) {
    console.error('Newsletter subscribe error:', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
