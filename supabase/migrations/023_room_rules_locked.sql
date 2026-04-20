-- Add room_rules_locked flag to rooms.
-- When true, room admin settings (peek tokens etc.) are locked and cannot be changed.
-- This is set manually by the room owner, and is also permanently enforced once
-- the first group-stage match of the tournament has kicked off.
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_rules_locked boolean NOT NULL DEFAULT false;
