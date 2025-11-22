-- Ensure new resource columns exist and copy prior resource values
alter table profiles
  add column if not exists resource_r int default 0,
  add column if not exists resource_x int default 0;

update profiles
set resource_r = resources
where resources is not null;
