-- Migration 017: add most-likely predicted score and outcome to ml_predictions
-- predicted_home_goals / predicted_away_goals remain as lambda (Poisson mean)
-- predicted_home_score / predicted_away_score are the most-likely integer scoreline
-- predicted_outcome is the resulting label: 'home_win' | 'draw' | 'away_win'

ALTER TABLE ml_predictions
  ADD COLUMN IF NOT EXISTS predicted_home_score integer,
  ADD COLUMN IF NOT EXISTS predicted_away_score integer,
  ADD COLUMN IF NOT EXISTS predicted_outcome     text;
