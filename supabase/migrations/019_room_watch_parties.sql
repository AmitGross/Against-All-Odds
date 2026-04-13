-- Room Watch Party: up to 8 scheduled watch slots per room
CREATE TABLE IF NOT EXISTS room_watch_parties (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    uuid        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  slot       smallint    NOT NULL CHECK (slot BETWEEN 1 AND 8),
  match_id   uuid        REFERENCES matches(id) ON DELETE SET NULL,
  place      text        NOT NULL DEFAULT '',
  is_locked  boolean     NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, slot)
);

ALTER TABLE room_watch_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room members can read watch parties"
  ON room_watch_parties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = room_watch_parties.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "room members can insert watch parties"
  ON room_watch_parties FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = room_watch_parties.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "room members can update watch parties"
  ON room_watch_parties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = room_watch_parties.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );
