-- One row per approved weekly newsletter send. The unique week_key makes the
-- approve action idempotent: clicking "Send" twice can never mail twice.
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  week_key TEXT NOT NULL UNIQUE,
  approved_by TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
