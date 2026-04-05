"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { KNOCKOUT_POINTS } from "@/config/scoring";

export async function scoreKnockoutPredictions(): Promise<{ error?: string; scored?: number }> {
  const supabase = createAdminClient();

  // Get all "anchor" slots (even position within round+side) that have a declared winner
  const { data: slots, error: slotsError } = await supabase
    .from("knockout_slots")
    .select("id, round, winner_team_id")
    .not("winner_team_id", "is", null);

  if (slotsError) return { error: slotsError.message };
  if (!slots || slots.length === 0) return { scored: 0 };

  let totalScored = 0;

  for (const slot of slots) {
    const pts = KNOCKOUT_POINTS[slot.round]?.outcome ?? 1;

    // Award pts to predictions that got it right
    const { error: correctError } = await supabase
      .from("knockout_predictions")
      .update({ points_awarded: pts })
      .eq("slot_id", slot.id)
      .eq("predicted_team_id", slot.winner_team_id);

    if (correctError) return { error: correctError.message };

    // Zero out wrong predictions for this slot
    const { error: wrongError } = await supabase
      .from("knockout_predictions")
      .update({ points_awarded: 0 })
      .eq("slot_id", slot.id)
      .neq("predicted_team_id", slot.winner_team_id);

    if (wrongError) return { error: wrongError.message };

    totalScored += 1;
  }

  revalidatePath("/admin/knockouts");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");

  return { scored: totalScored };
}
