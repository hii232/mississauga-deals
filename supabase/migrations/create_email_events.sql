-- Raw Resend webhook events, one row per delivery Svix makes to
-- /api/webhooks/resend. Powers the campaign report in the admin dashboard
-- (delivered / opened / clicked / bounced, and WHO — the follow-up list).
--
-- event_id is the svix-id header and is UNIQUE on purpose: Svix retries any
-- delivery we don't 2xx, so without this a retried "opened" would inflate the
-- numbers Hamza makes follow-up calls from. The webhook inserts and treats a
-- duplicate-key error as success.
--
-- campaign comes from the `campaign` tag set at send time, not from the
-- subject line — subjects are generated from live listing data and change
-- between editions, so they are not a stable key.
CREATE TABLE IF NOT EXISTS email_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  email_id TEXT,
  campaign TEXT,
  recipient TEXT,
  subject TEXT,
  link TEXT,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_events_campaign_idx ON email_events (campaign);
CREATE INDEX IF NOT EXISTS email_events_recipient_idx ON email_events (recipient);
CREATE INDEX IF NOT EXISTS email_events_type_idx ON email_events (type);
CREATE INDEX IF NOT EXISTS email_events_occurred_idx ON email_events (occurred_at DESC);

-- RLS from day one - this table was born without it and got flagged by the
-- Supabase security advisor (2026-08-04). No policies: service-role only.
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
