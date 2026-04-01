-- ============================================
-- RLS Policy Fixes
-- Run after 001_initial_schema.sql
-- ============================================

-- 1. Helper function to avoid infinite recursion in room_memberships policies
-- The original SELECT policy on room_memberships queried room_memberships itself,
-- causing infinite recursion. This SECURITY DEFINER function bypasses RLS.
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_memberships
    WHERE room_id = p_room_id AND user_id = p_user_id
  );
$$;

-- 2. Fix room_memberships SELECT policy (was self-referencing → infinite recursion)
DROP POLICY IF EXISTS "Memberships viewable by room members" ON public.room_memberships;
CREATE POLICY "Memberships viewable by room members" ON public.room_memberships
  FOR SELECT USING (
    public.is_room_member(room_id, auth.uid())
  );

-- 3. Fix rooms SELECT policy
-- Changed from members-only to any authenticated user, because:
--   a) The join-by-invite flow needs to look up rooms by invite_code
--   b) The insert+select pattern on room creation needs the creator to read back the row
DROP POLICY IF EXISTS "Rooms are viewable by members" ON public.rooms;
CREATE POLICY "Rooms are viewable by authenticated users" ON public.rooms
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 4. Fix room_prediction_bonuses SELECT policy (same recursion issue via room_memberships)
DROP POLICY IF EXISTS "Bonuses viewable by room members" ON public.room_prediction_bonuses;
CREATE POLICY "Bonuses viewable by room members" ON public.room_prediction_bonuses
  FOR SELECT USING (
    public.is_room_member(room_id, auth.uid())
  );

-- 5. Backfill any missing profiles for existing auth users
-- The on_auth_user_created trigger should handle this, but some users
-- were created before the trigger existed or it failed silently.
INSERT INTO public.profiles (id, username)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
