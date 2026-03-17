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

-- Service role can do everything
CREATE POLICY "Service role full access on lead_activities"
  ON lead_activities
  FOR ALL
  USING (true)
  WITH CHECK (true);
