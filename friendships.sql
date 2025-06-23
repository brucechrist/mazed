create table if not exists friendships (
  user_id uuid references auth.users(id),
  friend_id uuid references auth.users(id),
  status text check (status in ('pending','accepted')) default 'pending',
  primary key (user_id, friend_id)
);
