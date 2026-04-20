"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function leaveRoom(roomId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("room_memberships")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return { error: "You are not a member of this room." };
  if (membership.role === "owner")
    return { error: "You are the owner. Transfer ownership to a member before leaving." };

  const { error } = await supabase
    .from("room_memberships")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to leave room. Please try again." };

  redirect("/rooms");
}

export async function transferOwnershipAndLeave(roomId: string, newOwnerId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify caller is the current owner
  const { data: room } = await supabase
    .from("rooms")
    .select("created_by")
    .eq("id", roomId)
    .single();

  if (!room || room.created_by !== user.id)
    return { error: "Only the owner can transfer ownership." };

  if (newOwnerId === user.id)
    return { error: "You are already the owner." };

  // Set new owner role
  const { error: roleErr } = await supabase
    .from("room_memberships")
    .update({ role: "owner" })
    .eq("room_id", roomId)
    .eq("user_id", newOwnerId);

  if (roleErr) return { error: "Failed to transfer ownership." };

  // Downgrade old owner's role then remove them
  await supabase
    .from("room_memberships")
    .update({ role: "member" })
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  // Update rooms.created_by
  await supabase
    .from("rooms")
    .update({ created_by: newOwnerId })
    .eq("id", roomId);

  // Remove old owner from membership
  await supabase
    .from("room_memberships")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  redirect("/rooms");
}

export async function deleteRoom(roomId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: room } = await supabase
    .from("rooms")
    .select("created_by")
    .eq("id", roomId)
    .single();

  if (!room || room.created_by !== user.id)
    return { error: "Only the owner can close the room." };

  // Delete memberships first to avoid any constraint issues
  await supabase.from("room_memberships").delete().eq("room_id", roomId);

  const { error } = await supabase.from("rooms").delete().eq("id", roomId);

  if (error) return { error: `Failed to close room: ${error.message}` };

  redirect("/rooms");
}

export async function renameRoom(roomId: string, newName: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = newName.trim();
  if (!trimmed) return { error: "Room name cannot be empty." };
  if (trimmed.length > 50) return { error: "Room name must be 50 characters or fewer." };

  const { data: room } = await supabase
    .from("rooms")
    .select("created_by")
    .eq("id", roomId)
    .single();

  if (!room || room.created_by !== user.id)
    return { error: "Only the owner can rename the room." };

  const { error } = await supabase
    .from("rooms")
    .update({ name: trimmed })
    .eq("id", roomId);

  if (error) return { error: "Failed to rename room. Please try again." };

  revalidatePath(`/rooms/${roomId}`);
  return { success: true };
}

export async function saveWatchPartySlots(
  roomId: string,
  slots: { slot: number; matchId: string | null; knockoutSlotId: string | null; place: string }[]
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: membership } = await supabase
    .from("room_memberships")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .single();
  if (!membership) return { error: "Not a member of this room." };

  // Fetch currently locked slot numbers so we don't overwrite them
  const { data: lockedRows } = await supabase
    .from("room_watch_parties")
    .select("slot, is_locked")
    .eq("room_id", roomId);
  const lockedSlots = new Set(
    (lockedRows ?? []).filter((r: any) => r.is_locked).map((r: any) => r.slot as number)
  );

  // Only upsert non-locked slots
  const rows = slots
    .filter((s) => !lockedSlots.has(s.slot))
    .map((s) => ({
      room_id: roomId,
      slot: s.slot,
      match_id: s.matchId || null,
      knockout_slot_id: s.knockoutSlotId || null,
      place: s.place.trim().slice(0, 30),
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) return { error: "All slots are locked." };

  const { error } = await supabase
    .from("room_watch_parties")
    .upsert(rows, { onConflict: "room_id,slot" });
  if (error) return { error: error.message };

  revalidatePath(`/rooms/${roomId}`);
  return { success: true };
}

export async function toggleSlotLock(roomId: string, slot: number) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: room } = await supabase
    .from("rooms")
    .select("created_by")
    .eq("id", roomId)
    .single();
  if (!room || room.created_by !== user.id) return { error: "Only the owner can lock/unlock." };

  const { data: existing } = await supabase
    .from("room_watch_parties")
    .select("is_locked")
    .eq("room_id", roomId)
    .eq("slot", slot)
    .single();

  const newLocked = existing ? !existing.is_locked : true;

  if (existing) {
    const { error } = await supabase
      .from("room_watch_parties")
      .update({ is_locked: newLocked })
      .eq("room_id", roomId)
      .eq("slot", slot);
    if (error) return { error: error.message };
  } else {
    // Row doesn't exist yet — create it locked
    const { error } = await supabase
      .from("room_watch_parties")
      .insert({ room_id: roomId, slot, is_locked: true, place: "" });
    if (error) return { error: error.message };
  }

  revalidatePath(`/rooms/${roomId}`);
  return { success: true, locked: newLocked };
}

// ── Room Admin settings ───────────────────────────────────────────────────────

/** Helper: returns true if the first group-stage match has already kicked off. */
async function isTournamentStarted(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data } = await supabase
    .from("matches")
    .select("starts_at")
    .eq("stage", "group")
    .order("starts_at", { ascending: true })
    .limit(1)
    .single();
  if (!data) return false;
  return new Date(data.starts_at) <= new Date();
}

/** Room owner toggles the room_rules_locked flag.
 *  Not allowed once the tournament has started (permanently locked). */
export async function toggleRulesLock(roomId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: room } = await supabase
    .from("rooms")
    .select("created_by, room_rules_locked")
    .eq("id", roomId)
    .single();
  if (!room || room.created_by !== user.id) return { error: "Only the room owner can change this." };

  if (await isTournamentStarted(supabase)) {
    return { error: "The tournament has already started — rules are permanently locked." };
  }

  const newLocked = !room.room_rules_locked;
  const { error } = await supabase
    .from("rooms")
    .update({ room_rules_locked: newLocked })
    .eq("id", roomId);
  if (error) return { error: error.message };

  revalidatePath(`/rooms/${roomId}`);
  return { success: true, locked: newLocked };
}

/** Room owner sets peek token grants for all members at once.
 *  Blocked when rules are locked or tournament has started. */
export async function setAllPeekTokens(
  roomId: string,
  grants: { userId: string; granted: number }[]
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: room } = await supabase
    .from("rooms")
    .select("created_by, room_rules_locked")
    .eq("id", roomId)
    .single();
  if (!room || room.created_by !== user.id) return { error: "Only the room owner can change this." };

  if (room.room_rules_locked || await isTournamentStarted(supabase)) {
    return { error: "Room rules are locked." };
  }

  if (grants.some((g) => g.granted < 0)) return { error: "Token count cannot be negative." };

  const rows = grants.map((g) => ({
    room_id: roomId,
    user_id: g.userId,
    granted: g.granted,
  }));

  const { error } = await supabase
    .from("room_peek_tokens")
    .upsert(rows, { onConflict: "room_id,user_id" });
  if (error) return { error: error.message };

  revalidatePath(`/rooms/${roomId}`);
  return { success: true };
}

// ── Peek tokens (player-facing) ───────────────────────────────────────────────

/** Room owner sets how many peek tokens a member has (upsert). */
export async function grantPeekTokens(roomId: string, targetUserId: string, granted: number) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Verify caller is the room owner
  const { data: membership } = await supabase
    .from("room_memberships")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .single();
  if (!membership || membership.role !== "owner") return { error: "Only the room owner can grant peek tokens." };

  if (granted < 0) return { error: "Cannot grant negative tokens." };

  const { error } = await supabase
    .from("room_peek_tokens")
    .upsert({ room_id: roomId, user_id: targetUserId, granted }, { onConflict: "room_id,user_id" });
  if (error) return { error: error.message };

  revalidatePath(`/rooms/${roomId}`);
  return { success: true };
}

/** Player uses one peek token to reveal a match in the telepathy viewer. */
export async function usePeekToken(
  roomId: string,
  target: { matchId: string } | { knockoutSlotId: string }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const matchId = "matchId" in target ? target.matchId : null;
  const slotId = "knockoutSlotId" in target ? target.knockoutSlotId : null;

  // Fetch membership, token grant, and reveal count all in parallel
  const [{ data: membership }, { data: tokenRow }, { count: usedCount }] = await Promise.all([
    admin.from("room_memberships").select("role").eq("room_id", roomId).eq("user_id", user.id).single(),
    admin.from("room_peek_tokens").select("granted").eq("room_id", roomId).eq("user_id", user.id).single(),
    admin.from("room_peek_reveals").select("*", { count: "exact", head: true }).eq("room_id", roomId).eq("user_id", user.id),
  ]);

  if (!membership) return { error: "Not a member of this room." };

  const granted = tokenRow?.granted ?? 0;
  const used = usedCount ?? 0;
  if (granted === 0) return { error: "You have no peek tokens." };

  // Check if already revealed for this match — idempotent, no charge
  const { data: existing } = await (matchId
    ? admin.from("room_peek_reveals").select("id").eq("room_id", roomId).eq("user_id", user.id).eq("match_id", matchId).maybeSingle()
    : admin.from("room_peek_reveals").select("id").eq("room_id", roomId).eq("user_id", user.id).eq("knockout_slot_id", slotId!).maybeSingle());
  if (existing) return { success: true };

  if (used >= granted) return { error: "No peek tokens remaining." };

  // Insert reveal
  const { error: revealErr } = await admin
    .from("room_peek_reveals")
    .insert({
      room_id: roomId,
      user_id: user.id,
      ...(matchId ? { match_id: matchId } : { knockout_slot_id: slotId }),
    });
  if (revealErr) {
    if (revealErr.code === "23505") return { success: true };
    return { error: revealErr.message };
  }

  revalidatePath(`/rooms/${roomId}`);
  return { success: true };
}

export async function setAllSnipeTokens(
  roomId: string,
  grants: { userId: string; granted: number }[]
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: room } = await supabase
    .from("rooms")
    .select("created_by, room_rules_locked")
    .eq("id", roomId)
    .single();
  if (!room || room.created_by !== user.id) return { error: "Only the room owner can change this." };

  if (room.room_rules_locked || await isTournamentStarted(supabase)) {
    return { error: "Room rules are locked." };
  }

  if (grants.some((g) => g.granted < 0)) return { error: "Token count cannot be negative." };

  const rows = grants.map((g) => ({
    room_id: roomId,
    user_id: g.userId,
    granted: g.granted,
  }));

  const { error } = await supabase
    .from("room_snipe_tokens")
    .upsert(rows, { onConflict: "room_id,user_id" });
  if (error) return { error: error.message };

  revalidatePath(`/rooms/${roomId}`);
  return { success: true };
}

/** Player uses one snipe token to reveal a specific player's prediction for one match. */
export async function useSnipeToken(
  roomId: string,
  targetUserId: string,
  target: { matchId: string } | { knockoutSlotId: string }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  if (targetUserId === user.id) return { error: "You can't snipe yourself." };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const matchId = "matchId" in target ? target.matchId : null;
  const slotId = "knockoutSlotId" in target ? target.knockoutSlotId : null;

  // Fetch membership, token grant, and reveal count all in parallel
  const [{ data: membership }, { data: tokenRow }, { count: usedCount }] = await Promise.all([
    admin.from("room_memberships").select("role").eq("room_id", roomId).eq("user_id", user.id).single(),
    admin.from("room_snipe_tokens").select("granted").eq("room_id", roomId).eq("user_id", user.id).single(),
    admin.from("room_snipe_reveals").select("*", { count: "exact", head: true }).eq("room_id", roomId).eq("user_id", user.id),
  ]);

  if (!membership) return { error: "Not a member of this room." };

  const granted = tokenRow?.granted ?? 0;
  const used = usedCount ?? 0;
  if (granted === 0) return { error: "You have no snipe tokens." };

  // Check if already revealed for this (match, target) combo — idempotent, no charge
  const { data: existing } = await (matchId
    ? admin.from("room_snipe_reveals").select("id").eq("room_id", roomId).eq("user_id", user.id).eq("target_user_id", targetUserId).eq("match_id", matchId).maybeSingle()
    : admin.from("room_snipe_reveals").select("id").eq("room_id", roomId).eq("user_id", user.id).eq("target_user_id", targetUserId).eq("knockout_slot_id", slotId!).maybeSingle());
  if (existing) return { success: true };

  if (used >= granted) return { error: "No snipe tokens remaining." };

  // Insert reveal
  const { error: revealErr } = await admin
    .from("room_snipe_reveals")
    .insert({
      room_id: roomId,
      user_id: user.id,
      target_user_id: targetUserId,
      ...(matchId ? { match_id: matchId } : { knockout_slot_id: slotId }),
    });
  if (revealErr) {
    if (revealErr.code === "23505") return { success: true };
    return { error: revealErr.message };
  }

  revalidatePath(`/rooms/${roomId}`);
  return { success: true };
}

/** Room owner resets all peek + snipe used counts to 0 for every member. */
export async function resetAllTokenUsed(roomId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: room } = await supabase
    .from("rooms")
    .select("created_by")
    .eq("id", roomId)
    .single();
  if (!room || room.created_by !== user.id) return { error: "Only the room owner can do this." };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  // Delete all reveal rows (source of truth) and reset cached used counters
  const [{ error: e1 }, { error: e2 }, { error: e3 }, { error: e4 }] = await Promise.all([
    admin.from("room_peek_reveals").delete().eq("room_id", roomId),
    admin.from("room_snipe_reveals").delete().eq("room_id", roomId),
    admin.from("room_peek_tokens").update({ used: 0 }).eq("room_id", roomId),
    admin.from("room_snipe_tokens").update({ used: 0 }).eq("room_id", roomId),
  ]);

  if (e1 || e2 || e3 || e4) return { error: e1?.message ?? e2?.message ?? e3?.message ?? e4?.message ?? "Reset failed." };

  revalidatePath(`/rooms/${roomId}`);
  return { success: true };
}

export async function saveCanvas(roomId: string, data: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: membership } = await supabase
    .from("room_memberships")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .single();
  if (!membership) return { error: "Not a member of this room." };

  // Limit canvas data size to 2MB
  if (data.length > 2_000_000) return { error: "Canvas too large." };

  const { error } = await supabase
    .from("room_canvas")
    .upsert({ room_id: roomId, data, updated_at: new Date().toISOString() }, { onConflict: "room_id" });
  if (error) return { error: error.message };

  return { success: true };
}
