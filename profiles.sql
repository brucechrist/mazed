create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  username text unique not null,
  resources int default 0,
  streaks int default 0,
  stats jsonb default '[5,5,5,5]'
);
