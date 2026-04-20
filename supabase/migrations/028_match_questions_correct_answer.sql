-- Add correct_answer to match_questions.
-- The question submitter marks which option (a or b) is correct when submitting.
-- Locked together with the match (enforced in the application layer).

ALTER TABLE match_questions
  ADD COLUMN correct_answer TEXT CHECK (correct_answer IN ('a', 'b'));
