-- Anonymous creators own only their own games; no shared host password.
ALTER TABLE games ADD COLUMN IF NOT EXISTS owner_hash text;
CREATE INDEX IF NOT EXISTS games_owner ON games(owner_hash,created_at DESC);
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);
