import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

function checkAuth(request) {
  const key = request.headers.get('x-admin-key');
  return key && key === process.env.ADMIN_SECRET;
}

// ── GET: Fetch all leads + their activities ──────────────
export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  // Fetch leads
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch all activities
  const { data: activities } = await supabase
    .from('lead_activities')
    .select('*')
    .order('created_at', { ascending: false });

  // Group activities by lead_id
  const activityMap = {};
  (activities || []).forEach((a) => {
    if (!activityMap[a.lead_id]) activityMap[a.lead_id] = [];
    activityMap[a.lead_id].push(a);
  });

  // Attach activities to each lead
  const leadsWithActivities = (leads || []).map((l) => ({
    ...l,
    activities: activityMap[l.id] || [],
  }));

  // Compute stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const bySource = {};
  let newThisWeek = 0;
  let needsFollowUp = 0;
  let overdue = 0;

  leadsWithActivities.forEach((l) => {
    const src = l.source || 'unknown';
    bySource[src] = (bySource[src] || 0) + 1;

    const created = new Date(l.created_at);
    if (created >= weekAgo) newThisWeek++;

    const callCount = l.call_count || 0;
    const lastContact = l.last_called_at ? new Date(l.last_called_at) : created;

    // Needs follow-up: no contact yet and lead is > 3 days old
    if (callCount === 0 && created < threeDaysAgo) needsFollowUp++;

    // Overdue: next_follow_up is past, or > 15 days since last contact
    if (l.next_follow_up && new Date(l.next_follow_up) < now) {
      overdue++;
    } else if (lastContact < new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) && callCount < 4) {
      overdue++;
    }
  });

  const stats = {
    total: leadsWithActivities.length,
    newThisWeek,
    needsFollowUp,
    overdue,
    bySource,
  };

  return NextResponse.json({ leads: leadsWithActivities, stats });
}

// ── PATCH: Log an activity (call, whatsapp, email, note) ─
export async function PATCH(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  // Parse body (may be empty for backward compat)
  let body = {};
  try {
    body = await request.json();
  } catch {
    // No body = simple log call (backward compat)
  }

  const activityType = body.type || 'call';
  const outcome = body.outcome || 'no-answer';
  const notes = body.notes || null;

  // Fetch current lead
  const { data: lead, error: fetchError } = await supabase
    .from('leads')
    .select('call_count, status')
    .eq('id', id)
    .single();

  if (fetchError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Insert the activity record
  const { error: actError } = await supabase
    .from('lead_activities')
    .insert({
      lead_id: id,
      type: activityType,
      outcome,
      notes,
    });

  if (actError) {
    return NextResponse.json({ error: actError.message }, { status: 500 });
  }

  const newCount = (lead.call_count || 0) + 1;
  const now = new Date().toISOString();

  // Calculate next follow-up: 15 days from now
  const nextFollowUp = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  // Determine new status based on outcome
  let newStatus = lead.status || 'new';
  if (outcome === 'connected') newStatus = 'contacted';
  else if (outcome === 'callback') newStatus = 'callback';
  else if (outcome === 'not-interested') newStatus = 'not-interested';
  else if (outcome === 'no-answer' || outcome === 'ghosted' || outcome === 'voicemail') {
    newStatus = newCount >= 4 ? 'ghosted' : 'following-up';
  }

  // Count ghosted attempts (no-answer, ghosted, voicemail)
  const { data: ghostedActivities } = await supabase
    .from('lead_activities')
    .select('id')
    .eq('lead_id', id)
    .in('outcome', ['no-answer', 'ghosted', 'voicemail']);

  const ghostedCount = (ghostedActivities || []).length;

  // Auto-archive ONLY after 4 ghosted/no-answer attempts
  if (ghostedCount >= 4 && ['no-answer', 'ghosted', 'voicemail'].includes(outcome)) {
    // Mark as archived instead of deleting (preserve history)
    await supabase
      .from('leads')
      .update({
        status: 'archived',
        call_count: newCount,
        last_called_at: now,
        next_follow_up: null,
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      archived: true,
      message: 'Lead auto-archived after 4 unanswered attempts',
      call_count: newCount,
    });
  }

  // Update lead tracking
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      last_called_at: now,
      call_count: newCount,
      next_follow_up: nextFollowUp,
      status: newStatus,
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    archived: false,
    call_count: newCount,
    last_called_at: now,
    next_follow_up: nextFollowUp,
    status: newStatus,
  });
}

// ── DELETE: Archive a lead ───────────────────────────────
export async function DELETE(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  // Soft-archive: set status to 'archived' instead of hard delete
  const { error } = await supabase
    .from('leads')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
