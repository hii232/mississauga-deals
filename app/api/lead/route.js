import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { name, email, listingId, listingAddress, listingPrice, source, timestamp } = body;

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const lead = { name, email, listingId, listingAddress, listingPrice, source, timestamp };
  console.log('NEW LEAD:', JSON.stringify(lead));

  // TODO: Write to Supabase leads table when configured
  return NextResponse.json({ success: true });
}
