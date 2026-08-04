-- One row per approved weekly newsletter send. The unique week_key makes the
-- approve action idempotent: clicking "Send" twice can never mail twice.
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  week_key TEXT NOT NULL UNIQUE,
  approved_by TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS from day one - this table was born without it and got flagged by the
-- Supabase security advisor (2026-08-04). No policies: service-role only.
ALTER TABLE newsletter_sends ENABLE ROW LEVEL SECURITY;
