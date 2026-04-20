-- Add fortune teller and prophet badge streak columns to profiles.
--
-- direction_streak : consecutive finished matches where the user predicted the
--                    correct outcome (win/draw/loss) — resets to 0 on a miss.
-- is_fortune_teller: true when direction_streak >= 3.
--
-- exact_streak     : consecutive finished matches where the user predicted the
--                    exact 90-minute score — resets to 0 on a miss.
-- is_prophet       : true when exact_streak >= 3.
--
-- Both values are recomputed server-side whenever a match is finalised or
-- unfinalized via the admin finalizeMatch / unfinalizeMatch actions.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS direction_streak  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_fortune_teller boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exact_streak      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_prophet        boolean NOT NULL DEFAULT false;
