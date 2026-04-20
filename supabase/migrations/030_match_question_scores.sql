-- Stores points awarded to users who answered a match question correctly
CREATE TABLE match_question_scores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES match_questions(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_awarded INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_id, question_id, user_id)
);

ALTER TABLE match_question_scores ENABLE ROW LEVEL SECURITY;

-- Room members can see scores within their room
CREATE POLICY "room members can view question scores"
  ON match_question_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = match_question_scores.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );
