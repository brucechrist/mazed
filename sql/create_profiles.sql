CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  stats jsonb NOT NULL DEFAULT '[5,5,5,5]',
  resources integer NOT NULL DEFAULT 0,
  streaks integer NOT NULL DEFAULT 0
);
