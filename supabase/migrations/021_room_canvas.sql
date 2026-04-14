-- Room shared drawing canvas (one canvas snapshot per room)
CREATE TABLE IF NOT EXISTS room_canvas (
  room_id    uuid        PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  data       text        NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE room_canvas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room members can read canvas"
  ON room_canvas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = room_canvas.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "room members can insert canvas"
  ON room_canvas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = room_canvas.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "room members can update canvas"
  ON room_canvas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = room_canvas.room_id
        AND room_memberships.user_id = auth.uid()
    )
  );
