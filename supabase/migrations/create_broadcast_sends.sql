-- One row per approved one-off broadcast (e.g. the platform-launch announcement).
-- The unique campaign_key makes the approve action idempotent: clicking "Send"
-- twice — or a double form submit — can never mail the whole database twice.
-- The broadcast route degrades gracefully if this table is absent (it just skips
-- the guard), so running this migration is what actually turns the guard on.
CREATE TABLE IF NOT EXISTS broadcast_sends (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campaign_key TEXT NOT NULL UNIQUE,
  approved_by TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
