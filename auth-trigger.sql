-- Automatically maintain profiles for new users
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, email)
  values (new.id, new.email)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_trigger on auth.users;
create trigger create_profile_trigger
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

