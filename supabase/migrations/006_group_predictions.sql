-- Group predictions: each user picks 1st and 2nd place for each group
-- group_locks: admin can lock a group to prevent further predictions

create table public.group_locks (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  group_name text not null,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tournament_id, group_name)
);

create table public.group_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  group_name text not null,
  first_place_team_id uuid not null references public.teams(id),
  second_place_team_id uuid not null references public.teams(id),
  submitted_at timestamptz not null default now(),
  unique (user_id, tournament_id, group_name)
);

-- RLS
alter table public.group_locks enable row level security;
alter table public.group_predictions enable row level security;

-- group_locks: public read, admin write
create policy "group_locks: public read"
  on public.group_locks for select using (true);

create policy "group_locks: admin insert"
  on public.group_locks for insert
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

create policy "group_locks: admin update"
  on public.group_locks for update
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- group_predictions: users manage their own, admins can read all
create policy "group_predictions: users read own"
  on public.group_predictions for select
  using (auth.uid() = user_id);

create policy "group_predictions: users insert own"
  on public.group_predictions for insert
  with check (auth.uid() = user_id);

create policy "group_predictions: users update own"
  on public.group_predictions for update
  using (auth.uid() = user_id);

create policy "group_predictions: admins read all"
  on public.group_predictions for select
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));
