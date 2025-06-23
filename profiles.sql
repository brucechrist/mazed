create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  email text not null,
  username text unique not null,
  avatar_url text,
  resources int default 0,
  streaks int default 0,
  stats jsonb default '[5,5,5,5]'
);
