create extension if not exists pgcrypto;

create table if not exists quests (
  id bigint primary key,
  user_id uuid references auth.users(id),
  type text default 'user',
  name text,
  description text,
  quadrant text,
  resource_r int default 0,
  resource_x int default 0,
  rarity text default 'C',
  urgent boolean default false,
  accepted boolean default false,
  completed boolean default false
);

alter table quests
  add column if not exists resource_r int default 0,
  add column if not exists resource_x int default 0;

update quests
set resource_r = coalesce(resource_r, 0)
where resource_r is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'quests' and column_name = 'resource'
  ) then
    update quests
    set resource_r = coalesce(resource_r, resource, 0)
    where resource_r is null;
  end if;
end $$;

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  start bigint,
  "end" bigint,
  relapsed boolean,
  reason text,
  relapse_time text
);
