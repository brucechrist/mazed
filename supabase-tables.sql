create extension if not exists pgcrypto;

create table if not exists quests (
  id bigint primary key,
  user_id uuid references auth.users(id),
  type text default 'user',
  name text,
  description text,
  quadrant text,
  resource int default 0,
  rarity text default 'C',
  urgent boolean default false,
  accepted boolean default false,
  completed boolean default false
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  start bigint,
  "end" bigint,
  relapsed boolean,
  reason text
);
