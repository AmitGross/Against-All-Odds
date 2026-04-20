-- Match questions: players submit A/B questions for upcoming matches,
-- admin approves them later. One question per player per match per room.

CREATE TABLE match_questions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID        NOT NULL REFERENCES rooms(id)        ON DELETE CASCADE,
  match_id      UUID        NOT NULL REFERENCES matches(id)      ON DELETE CASCADE,
  submitted_by  UUID        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  question_text TEXT        NOT NULL,
  option_a      TEXT        NOT NULL,
  option_b      TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
  points        INT         NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- one question per user per match per room
  UNIQUE (room_id, match_id, submitted_by)
);

ALTER TABLE match_questions ENABLE ROW LEVEL SECURITY;

-- Room members can view all questions submitted in their room
CREATE POLICY "room members can view match questions"
  ON match_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = match_questions.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );

-- Players can insert their own questions (max 1 per match enforced by UNIQUE;
-- max 10 pending per user across the room is enforced in the application layer)
CREATE POLICY "room members can submit questions"
  ON match_questions FOR INSERT
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = match_questions.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );

-- Players can delete their own pending questions (withdraw)
CREATE POLICY "submitter can delete own pending questions"
  ON match_questions FOR DELETE
  USING (
    submitted_by = auth.uid()
    AND status = 'pending'
  );
