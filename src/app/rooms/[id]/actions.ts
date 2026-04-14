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
