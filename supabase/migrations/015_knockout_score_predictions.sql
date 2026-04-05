-- Switch knockout predictions from team-picker to score-based (like group stage)
alter table public.knockout_predictions
  add column if not exists predicted_home_score int,
  add column if not exists predicted_away_score int;
