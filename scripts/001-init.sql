CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z2-9]{6}$'),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','playing','finished')),
  active_round_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rounds (
  id uuid PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  position integer NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct integer NOT NULL,
  explanation text NOT NULL DEFAULT '',
  duration integer NOT NULL DEFAULT 45 CHECK (duration BETWEEN 15 AND 300),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','locked','revealed')),
  closes_at timestamptz,
  UNIQUE(game_id,position)
);
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar text NOT NULL DEFAULT 'fox',
  token_hash text NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 1000 CHECK (balance >= 0),
  bailout_used boolean NOT NULL DEFAULT false,
  UNIQUE(game_id,name)
);
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY,
  round_id uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  option_index integer NOT NULL,
  stake integer NOT NULL CHECK (stake > 0),
  all_in boolean NOT NULL,
  payout integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(round_id,player_id)
);
CREATE TABLE IF NOT EXISTS auth_attempts (
  key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS players_game ON players(game_id);
CREATE INDEX IF NOT EXISTS rounds_game ON rounds(game_id);
