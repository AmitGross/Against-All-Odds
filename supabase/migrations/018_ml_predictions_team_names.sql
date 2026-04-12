-- Migration 018: add home/away team names to ml_predictions for easy verification
ALTER TABLE ml_predictions
  ADD COLUMN IF NOT EXISTS home_team_name text,
  ADD COLUMN IF NOT EXISTS away_team_name text;
