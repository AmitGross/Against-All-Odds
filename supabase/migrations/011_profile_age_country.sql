-- Add age and country to profiles (both optional)
alter table public.profiles
  add column if not exists age int check (age >= 8 and age <= 120),
  add column if not exists country text;
