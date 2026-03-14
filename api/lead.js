// api/lead.js — Lead capture endpoint
// Stores investor leads when they unlock deal analysis
// Optional: connect to Supabase, Airtable, or Mailchimp

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, listingId, listingAddress, listingPrice, source, timestamp } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const lead = { name, email, listingId, listingAddress, listingPrice, source, timestamp };

  // Option 1: Log to Vercel (free, visible in dashboard)
  console.log('NEW LEAD:', JSON.stringify(lead));

  // Option 2: Supabase (uncomment + add SUPABASE_URL, SUPABASE_ANON_KEY env vars)
  // const { createClient } = await import('@supabase/supabase-js');
  // const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  // await supabase.from('leads').insert([lead]);

  // Option 3: Airtable (uncomment + add AIRTABLE_API_KEY, AIRTABLE_BASE_ID env vars)
  // await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Leads`, {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ records: [{ fields: lead }] }),
  // });

  return res.status(200).json({ success: true });
}
