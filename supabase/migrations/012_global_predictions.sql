-- ============================================
-- Migration 012: Global predictions infrastructure
-- (tournament winner, top scorer, assist leader)
-- ============================================

-- Players table (for top scorer / assist leader picks)
create table public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Seed pseudo players (real players added when full DB is built)
insert into public.players (name) values
  ('Cristiano Ronaldo'),
  ('Lionel Messi'),
  ('Kylian Mbappé'),
  ('Erling Haaland'),
  ('Neymar Jr'),
  ('Vinicius Jr'),
  ('Mohamed Salah'),
  ('Robert Lewandowski'),
  ('Lamine Yamal'),
  ('Jude Bellingham');

-- Global prediction settings (one row per type, seeded below)
create table public.global_prediction_settings (
  type text primary key,          -- 'winner' | 'top_scorer' | 'assist_leader'
  is_locked boolean not null default false,
  correct_team_id uuid references public.teams(id) on delete set null,
  correct_player_id uuid references public.players(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.global_prediction_settings (type) values
  ('winner'),
  ('top_scorer'),
  ('assist_leader');

-- Global predictions by users
create table public.global_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  team_id uuid references public.teams(id) on delete set null,
  player_id uuid references public.players(id) on delete set null,
  points_awarded int not null default 0,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, type)
);

-- RLS
alter table public.players enable row level security;
create policy "Players are viewable by everyone" on public.players for select using (true);

alter table public.global_prediction_settings enable row level security;
create policy "Settings viewable by everyone" on public.global_prediction_settings for select using (true);
create policy "Only admins can update settings" on public.global_prediction_settings for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

alter table public.global_predictions enable row level security;
create policy "Users can view own global predictions" on public.global_predictions for select using (auth.uid() = user_id);
create policy "Users can insert own global predictions" on public.global_predictions for insert with check (auth.uid() = user_id);
create policy "Users can update own global predictions" on public.global_predictions for update using (auth.uid() = user_id);
