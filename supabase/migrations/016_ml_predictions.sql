-- ============================================
-- Migration 016: ML model predictions
-- Stores per-match predictions from the Render ML API
-- ============================================

create table public.ml_predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  slot_id uuid references public.knockout_slots(id) on delete cascade,
  home_team_id uuid not null references public.teams(id),
  away_team_id uuid not null references public.teams(id),
  predicted_home_goals numeric(4,2) not null,
  predicted_away_goals numeric(4,2) not null,
  prob_home_win numeric(5,4) not null,
  prob_draw numeric(5,4) not null,
  prob_away_win numeric(5,4) not null,
  model_version text not null,
  predicted_at timestamptz not null default now(),
  -- at most one active prediction per match/slot
  constraint ml_predictions_match_or_slot check (
    (match_id is not null and slot_id is null) or
    (match_id is null and slot_id is not null)
  )
);

-- Only one prediction row per match (latest wins via upsert in API)
create unique index ml_predictions_match_id_idx on public.ml_predictions (match_id) where match_id is not null;
create unique index ml_predictions_slot_id_idx on public.ml_predictions (slot_id) where slot_id is not null;

-- RLS: public read, service role writes (Render API uses service role key)
alter table public.ml_predictions enable row level security;

create policy "ml_predictions: public read"
  on public.ml_predictions for select
  using (true);

-- No insert/update policy needed for anon/authed users — only service role can write
