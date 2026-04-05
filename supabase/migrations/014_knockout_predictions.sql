-- User predictions for each knockout match winner
create table public.knockout_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slot_id uuid not null references public.knockout_slots(id) on delete cascade,
  predicted_team_id uuid references public.teams(id) on delete set null,
  points_awarded int not null default 0,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, slot_id)
);

alter table public.knockout_predictions enable row level security;

create policy "Users can view own ko predictions" on public.knockout_predictions
  for select using (auth.uid() = user_id);

create policy "Users can insert own ko predictions" on public.knockout_predictions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own ko predictions" on public.knockout_predictions
  for update using (auth.uid() = user_id);

create policy "Admins can update any ko prediction" on public.knockout_predictions
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
