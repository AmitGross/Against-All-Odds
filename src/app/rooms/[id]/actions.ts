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

  const { error } = await supabase
    .from("rooms")
    .delete()
    .eq("id", roomId);

  if (error) return { error: "Failed to close room. Please try again." };

  redirect("/rooms");
}

export async function renameRoom(roomId: string, newName: string) {
  const supabase = await createServerSupabaseClient();
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
