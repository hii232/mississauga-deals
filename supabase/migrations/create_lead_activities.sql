-- ============================================
-- Lead Activities / Interaction History
-- ============================================
-- Tracks every call, message, email, and note
-- with timestamps and outcomes for smart CRM

CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'call',        -- call, whatsapp, email, note
  outcome TEXT DEFAULT 'no-answer',          -- connected, no-answer, voicemail, callback, not-interested, ghosted
  notes TEXT,                                -- free-form notes about the interaction
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by lead
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- Add next_follow_up column to leads table for scheduling
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMPTZ;
-- Add status column for manual status override
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- RLS policies
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- No policies on purpose: all app access uses the service role, which
-- bypasses RLS. A true/true policy here (the old pattern) had no TO clause
-- and granted the browser-shipped ANON key full access. See
-- enable_rls_lockdown.sql.
