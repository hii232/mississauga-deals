-- Per-recipient email click attribution: outbound email links now carry an
-- `mi=<token>` param (HMAC of the recipient's email — no personal data in the
-- URL). The tracker stores it here so the admin can show WHO clicked, matched
-- back to `leads` by re-deriving each lead's token server-side.
-- The track route degrades gracefully (retries the insert without the column)
-- until this migration runs.
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS subscriber_token TEXT;

-- Fast lookup of attributed clicks only
CREATE INDEX IF NOT EXISTS idx_page_views_subscriber_token
  ON page_views (subscriber_token)
  WHERE subscriber_token IS NOT NULL;
