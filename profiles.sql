create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  email text not null,
  username text unique not null,
  avatar_url text,
  resources int default 0,
  streaks int default 0,
  stats jsonb default '[5,5,5,5]'
);

alter table profiles
  add column if not exists mbti text,
  add column if not exists enneagram text,
  add column if not exists instinct text;

-- Upgrade existing installations
alter table profiles
  add column if not exists email text;

update profiles
set email = auth.users.email
from auth.users
where profiles.email is null
  and profiles.id = auth.users.id;

alter table profiles
  alter column email set not null;
