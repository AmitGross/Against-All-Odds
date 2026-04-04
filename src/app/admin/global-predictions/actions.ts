"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) throw new Error("Unauthorized");
  return supabase;
}

export async function toggleGlobalLock(type: string, lock: boolean) {
  const supabase = await assertAdmin();
  await supabase.from("global_prediction_settings").update({ is_locked: lock, updated_at: new Date().toISOString() }).eq("type", type);
  revalidatePath("/admin/global-predictions");
  revalidatePath("/dashboard");
}

export async function setCorrectAnswer(type: string, teamId: string | null, playerId: string | null) {
  const supabase = await assertAdmin();

  await supabase.from("global_prediction_settings").update({
    correct_team_id: teamId,
    correct_player_id: playerId,
    updated_at: new Date().toISOString(),
  }).eq("type", type);

  // Award 10 points to all users who picked correctly
  if (type === "winner" && teamId) {
    await supabase.from("global_predictions")
      .update({ points_awarded: 10 })
      .eq("type", type)
      .eq("team_id", teamId);
    // Zero out wrong picks
    await supabase.from("global_predictions")
      .update({ points_awarded: 0 })
      .eq("type", type)
      .neq("team_id", teamId);
  } else if ((type === "top_scorer" || type === "assist_leader") && playerId) {
    await supabase.from("global_predictions")
      .update({ points_awarded: 10 })
      .eq("type", type)
      .eq("player_id", playerId);
    await supabase.from("global_predictions")
      .update({ points_awarded: 0 })
      .eq("type", type)
      .neq("player_id", playerId);
  }

  revalidatePath("/admin/global-predictions");
  revalidatePath("/dashboard");
}
