-- Per-recipient record of which listings each daily-alert email already
-- contained. The DOM<=3 "new listing" window means a listing stays eligible
-- for up to 4 consecutive daily sends — without this table the same property
-- headlines a subscriber's alert four days running, which reads as spam and
-- erodes the alert's "new deals" promise.
-- The send route degrades gracefully while this table is absent (it just
-- skips the repeat-send guard), so running this migration turns the guard on.
CREATE TABLE IF NOT EXISTS alert_sent_listings (
  email TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (email, listing_id)
);

-- The send route's lookback query filters on sent_at
CREATE INDEX IF NOT EXISTS idx_alert_sent_listings_sent_at
  ON alert_sent_listings (sent_at);

ALTER TABLE alert_sent_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on alert_sent_listings"
  ON alert_sent_listings FOR ALL USING (true) WITH CHECK (true);
