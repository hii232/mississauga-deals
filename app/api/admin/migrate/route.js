import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export async function POST(request) {
  const key = request.headers.get('x-admin-key');
  if (!key || key !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Add access_revoked column if it doesn't exist
  // We do this by trying to select it first, then using a default update
  const { error: testErr } = await supabase
    .from('leads')
    .select('access_revoked')
    .limit(1);

  if (testErr && testErr.message.includes('access_revoked')) {
    // Column doesn't exist — we can't add it via REST API
    // Return instructions
    return NextResponse.json({
      error: 'Column access_revoked does not exist. Run this SQL in Supabase dashboard:',
      sql: 'ALTER TABLE leads ADD COLUMN IF NOT EXISTS access_revoked BOOLEAN DEFAULT false;'
    }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: 'access_revoked column exists' });
}
