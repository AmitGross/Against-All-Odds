"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function leaveRoom(roomId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Prevent the owner from leaving (they should delete the room instead)
  const { data: membership } = await supabase
    .from("room_memberships")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return { error: "You are not a member of this room." };
  if (membership.role === "owner") return { error: "Owners cannot leave their own room." };

  const { error } = await supabase
    .from("room_memberships")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to leave room. Please try again." };

  redirect("/rooms");
}
