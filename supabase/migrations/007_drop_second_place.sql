-- Remove second_place_team_id from group_predictions (only 1st place is needed)
alter table public.group_predictions
  drop column if exists second_place_team_id;
