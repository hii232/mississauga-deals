-- First-seen tracker: when each listing first appeared in our feed.
-- Powers the honest "N+ days on market" floor (the feed withholds DaysOnMarket
-- on active listings). first_seen_at is written once and never updated.
create table if not exists listing_first_seen (
  listing_id text primary key,
  first_seen_at timestamptz not null default now()
);
create index if not exists idx_listing_first_seen_at on listing_first_seen (first_seen_at);
-- Service-role only (RLS on, no public policies).
alter table listing_first_seen enable row level security;
