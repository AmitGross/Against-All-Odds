-- Peek tokens: room owner grants N peeks per player per room
CREATE TABLE IF NOT EXISTS room_peek_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    uuid        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted    smallint    NOT NULL DEFAULT 0 CHECK (granted >= 0),
  used       smallint    NOT NULL DEFAULT 0 CHECK (used >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE room_peek_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read their own tokens in rooms they belong to
CREATE POLICY "users can read own peek tokens"
  ON room_peek_tokens FOR SELECT
  USING (user_id = auth.uid());

-- Room owners can read all tokens for their room
CREATE POLICY "room owners can read all peek tokens"
  ON room_peek_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = room_peek_tokens.room_id
        AND room_memberships.user_id = auth.uid()
        AND room_memberships.role = 'owner'
    )
  );

-- Room owners can insert tokens for members
CREATE POLICY "room owners can insert peek tokens"
  ON room_peek_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = room_peek_tokens.room_id
        AND room_memberships.user_id = auth.uid()
        AND room_memberships.role = 'owner'
    )
  );

-- Room owners can update (grant more/fewer) tokens
CREATE POLICY "room owners can update peek tokens"
  ON room_peek_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = room_peek_tokens.room_id
        AND room_memberships.user_id = auth.uid()
        AND room_memberships.role = 'owner'
    )
  );

-- Users can increment their own used count (when using a peek)
CREATE POLICY "users can update own used count"
  ON room_peek_tokens FOR UPDATE
  USING (user_id = auth.uid());

-- Peek reveals: tracks which matches a player has peeked at in a room
CREATE TABLE IF NOT EXISTS room_peek_reveals (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id            uuid        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id            uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id           uuid        REFERENCES matches(id) ON DELETE CASCADE,
  knockout_slot_id   uuid        REFERENCES knockout_slots(id) ON DELETE CASCADE,
  revealed_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT peek_target_set CHECK (match_id IS NOT NULL OR knockout_slot_id IS NOT NULL),
  UNIQUE NULLS NOT DISTINCT (room_id, user_id, match_id),
  UNIQUE NULLS NOT DISTINCT (room_id, user_id, knockout_slot_id)
);

ALTER TABLE room_peek_reveals ENABLE ROW LEVEL SECURITY;

-- Users can read their own reveals
CREATE POLICY "users can read own peek reveals"
  ON room_peek_reveals FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own reveals (when they use a peek)
CREATE POLICY "users can insert own peek reveals"
  ON room_peek_reveals FOR INSERT
  WITH CHECK (user_id = auth.uid());
