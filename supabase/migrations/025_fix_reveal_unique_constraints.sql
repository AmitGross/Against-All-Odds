-- Fix broken UNIQUE NULLS NOT DISTINCT constraints on reveal tables.
--
-- The NULLS NOT DISTINCT syntax treats NULL == NULL for uniqueness.
-- All group-stage peek reveals store  (match_id = UUID, knockout_slot_id = NULL).
-- All knockout  peek reveals store    (match_id = NULL, knockout_slot_id = UUID).
--
-- With NULLS NOT DISTINCT:
--   • The constraint on (room_id, user_id, knockout_slot_id) blocks the 2nd+
--     group match reveal because both rows have knockout_slot_id = NULL → conflict.
--   • The constraint on (room_id, user_id, match_id) blocks the 2nd+
--     KO reveal because both rows have match_id = NULL → conflict.
--
-- Fix: rebuild as standard UNIQUE (NULLS DISTINCT = default).
--   NULL != NULL under standard behaviour, so multiple group or KO reveals
--   for different matches are allowed; exact duplicates are still blocked.

-- ── room_peek_reveals ─────────────────────────────────────────────────────────
ALTER TABLE room_peek_reveals
  DROP CONSTRAINT IF EXISTS room_peek_reveals_room_id_user_id_match_id_key,
  DROP CONSTRAINT IF EXISTS room_peek_reveals_room_id_user_id_knockout_slot_id_key;

ALTER TABLE room_peek_reveals
  ADD CONSTRAINT room_peek_reveals_room_id_user_id_match_id_key
    UNIQUE (room_id, user_id, match_id),
  ADD CONSTRAINT room_peek_reveals_room_id_user_id_knockout_slot_id_key
    UNIQUE (room_id, user_id, knockout_slot_id);

-- ── room_snipe_reveals ────────────────────────────────────────────────────────
ALTER TABLE room_snipe_reveals
  DROP CONSTRAINT IF EXISTS room_snipe_reveals_room_id_user_id_target_user_id_match_id_key,
  DROP CONSTRAINT IF EXISTS room_snipe_reveals_room_id_user_id_target_user_id_knockout_slot_id_key;

ALTER TABLE room_snipe_reveals
  ADD CONSTRAINT room_snipe_reveals_room_id_user_id_target_user_id_match_id_key
    UNIQUE (room_id, user_id, target_user_id, match_id),
  ADD CONSTRAINT room_snipe_reveals_room_id_user_id_target_user_id_knockout_slot_id_key
    UNIQUE (room_id, user_id, target_user_id, knockout_slot_id);
