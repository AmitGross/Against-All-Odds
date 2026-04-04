-- Enforce case-insensitive username uniqueness at the database level
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));
