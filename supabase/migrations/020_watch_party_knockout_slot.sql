-- Add knockout_slot_id to watch parties so users can schedule knockout matches
ALTER TABLE room_watch_parties
  ADD COLUMN knockout_slot_id uuid REFERENCES knockout_slots(id) ON DELETE SET NULL;

-- Ensure exactly one of match_id or knockout_slot_id is set (or neither for empty slots)
ALTER TABLE room_watch_parties
  ADD CONSTRAINT watch_party_one_match_type
    CHECK (
      (match_id IS NULL OR knockout_slot_id IS NULL)
    );
