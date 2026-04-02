-- Knockout bracket slots
-- Each row represents one slot in the bracket (e.g. R32 slot 1, QF slot 3, etc.)
-- home_team_id and away_team_id are filled in by admin once group stage is done
-- winner_team_id is filled in by admin (or automation later) after each match

create table public.knockout_slots (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round text not null,            -- 'r32', 'r16', 'qf', 'sf', 'final', 'bronze'
  side text not null,             -- 'left' or 'right'
  position int not null,          -- slot index within the round/side (0-based)
  slot_label text,                -- e.g. '1E', '3 ABCDF' (placeholder until team is known)
  home_team_id uuid references public.teams(id),
  away_team_id uuid references public.teams(id),
  home_score int,
  away_score int,
  winner_team_id uuid references public.teams(id),
  match_date timestamptz,
  created_at timestamptz not null default now(),
  unique (tournament_id, round, side, position)
);

-- RLS: public read, admin write
alter table public.knockout_slots enable row level security;

create policy "knockout_slots: public read"
  on public.knockout_slots for select
  using (true);

create policy "knockout_slots: admin insert"
  on public.knockout_slots for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "knockout_slots: admin update"
  on public.knockout_slots for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
