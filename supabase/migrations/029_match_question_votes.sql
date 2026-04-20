CREATE TABLE match_question_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES match_questions(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  answer     TEXT NOT NULL CHECK (answer IN ('a', 'b')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (question_id, user_id)
);

ALTER TABLE match_question_votes ENABLE ROW LEVEL SECURITY;

-- Room members can view all votes in their room
CREATE POLICY "room members can view question votes"
  ON match_question_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = match_question_votes.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );

-- Users can cast their own vote
CREATE POLICY "users can insert own question vote"
  ON match_question_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can change their own vote
CREATE POLICY "users can update own question vote"
  ON match_question_votes FOR UPDATE
  USING (user_id = auth.uid());
