-- ============================================
-- World Cup Predictor — Phase 4: Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Profiles (linked to Supabase Auth users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Tournaments
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year int not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  flag_url text
);

-- 4. Matches
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  stage text not null,
  group_name text,
  home_team_id uuid not null references public.teams(id),
  away_team_id uuid not null references public.teams(id),
  starts_at timestamptz not null,
  status text not null default 'scheduled',
  home_score_90 int,
  away_score_90 int,
  home_score_120 int,
  away_score_120 int,
  penalty_winner_team_id uuid references public.teams(id),
  winning_team_id uuid references public.teams(id),
  is_locked boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. Rooms
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  join_type text not null default 'invite_link',
  password_hash text,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 6. Room memberships
create table public.room_memberships (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique(room_id, user_id)
);

-- 7. Predictions
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  predicted_home_score_90 int not null,
  predicted_away_score_90 int not null,
  predicted_home_score_120 int,
  predicted_away_score_120 int,
  predicted_penalty_winner_team_id uuid references public.teams(id),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, match_id)
);

-- 8. Prediction scores (computed after match finishes)
create table public.prediction_scores (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null unique references public.predictions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  base_points int not null default 0,
  global_points int not null default 0,
  rule_version text not null default 'v1',
  scored_at timestamptz not null default now()
);

-- 9. Room prediction bonuses (Outlier bonus per room)
create table public.room_prediction_bonuses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  bonus_type text not null default 'outlier',
  bonus_points int not null default 0,
  created_at timestamptz not null default now(),
  unique(room_id, prediction_id, bonus_type)
);

-- ============================================
-- Indexes
-- ============================================
create index idx_room_memberships_room on public.room_memberships(room_id);
create index idx_room_memberships_user on public.room_memberships(user_id);
create index idx_predictions_match on public.predictions(match_id);
create index idx_predictions_user_match on public.predictions(user_id, match_id);
create index idx_prediction_scores_user on public.prediction_scores(user_id);
create index idx_prediction_scores_match on public.prediction_scores(match_id);
create index idx_room_bonuses_room_user on public.room_prediction_bonuses(room_id, user_id);
create index idx_matches_starts_at on public.matches(starts_at, status);

-- ============================================
-- Helper function (needed by RLS policies below)
-- ============================================
create or replace function public.is_room_member(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.room_memberships
    where room_id = p_room_id and user_id = p_user_id
  );
$$;

-- ============================================
-- Row Level Security
-- ============================================

-- Profiles: users can read all, update only their own
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Tournaments: readable by all, writable by admins only
alter table public.tournaments enable row level security;
create policy "Tournaments are viewable by everyone" on public.tournaments for select using (true);
create policy "Admins can manage tournaments" on public.tournaments for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Teams: readable by all, writable by admins only
alter table public.teams enable row level security;
create policy "Teams are viewable by everyone" on public.teams for select using (true);
create policy "Admins can manage teams" on public.teams for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Matches: readable by all, writable by admins only
alter table public.matches enable row level security;
create policy "Matches are viewable by everyone" on public.matches for select using (true);
create policy "Admins can manage matches" on public.matches for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Rooms: readable by any authenticated user (needed for join-by-invite lookup)
alter table public.rooms enable row level security;
create policy "Rooms are viewable by authenticated users" on public.rooms for select using (
  auth.uid() is not null
);
create policy "Any user can create a room" on public.rooms for insert with check (auth.uid() = created_by);
create policy "Room owner can update" on public.rooms for update using (auth.uid() = created_by);

-- Room memberships: viewable by room members (via helper fn to avoid recursion)
alter table public.room_memberships enable row level security;
create policy "Memberships viewable by room members" on public.room_memberships for select using (
  public.is_room_member(room_id, auth.uid())
);
create policy "Users can join rooms" on public.room_memberships for insert with check (auth.uid() = user_id);
create policy "Users can leave rooms" on public.room_memberships for delete using (auth.uid() = user_id);

-- Predictions: users can see own, insert/update own (if match not locked)
alter table public.predictions enable row level security;
create policy "Users can view own predictions" on public.predictions for select using (auth.uid() = user_id);
create policy "Users can insert predictions" on public.predictions for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.matches where id = match_id and is_locked = false)
);
create policy "Users can update own predictions" on public.predictions for update using (
  auth.uid() = user_id
  and exists (select 1 from public.matches where id = match_id and is_locked = false)
);

-- Prediction scores: viewable by everyone (for leaderboards)
alter table public.prediction_scores enable row level security;
create policy "Scores are viewable by everyone" on public.prediction_scores for select using (true);
create policy "Only system can insert scores" on public.prediction_scores for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Room bonuses: viewable by room members
alter table public.room_prediction_bonuses enable row level security;
create policy "Bonuses viewable by room members" on public.room_prediction_bonuses for select using (
  public.is_room_member(room_id, auth.uid())
);
create policy "Only system can insert bonuses" on public.room_prediction_bonuses for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
