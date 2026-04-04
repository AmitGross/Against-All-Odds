-- Add username_set flag so we know if user has chosen a real username yet
-- (existing rows have username = email, so we treat those as "not set")
alter table public.profiles
  add column if not exists username_set boolean not null default false;
