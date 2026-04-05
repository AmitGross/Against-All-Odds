"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { KNOCKOUT_POINTS } from "@/config/scoring";

export async function scoreKnockoutPredictions(): Promise<{ error?: string; scored?: number }> {
  const supabase = createAdminClient();

  // Get all anchor slots that have a declared winner and scores
  const { data: slots, error: slotsError } = await supabase
    .from("knockout_slots")
    .select("id, round, home_team_id, home_score, away_score, winner_team_id")
    .not("winner_team_id", "is", null);

  if (slotsError) return { error: slotsError.message };
  if (!slots || slots.length === 0) return { scored: 0 };

  let totalScored = 0;

  for (const slot of slots) {
    const { exact: exactPts, outcome: outcomePts } = KNOCKOUT_POINTS[slot.round] ?? { exact: 3, outcome: 1 };

    // Fetch all predictions for this slot
    const { data: preds, error: predsError } = await supabase
      .from("knockout_predictions")
      .select("id, predicted_home_score, predicted_away_score")
      .eq("slot_id", slot.id);

    if (predsError) return { error: predsError.message };
    if (!preds || preds.length === 0) continue;

    // Did the home team (slotA team) actually win?
    const actualHomeWins = slot.winner_team_id === slot.home_team_id;

    for (const pred of preds) {
      if (pred.predicted_home_score == null || pred.predicted_away_score == null) continue;

      let pts = 0;

      if (
        slot.home_score != null &&
        slot.away_score != null &&
        pred.predicted_home_score === slot.home_score &&
        pred.predicted_away_score === slot.away_score
      ) {
        pts = exactPts;
      } else {
        const predHomeWins = pred.predicted_home_score > pred.predicted_away_score;
        const predAwayWins = pred.predicted_away_score > pred.predicted_home_score;
        if ((actualHomeWins && predHomeWins) || (!actualHomeWins && predAwayWins)) {
          pts = outcomePts;
        }
      }

      await supabase
        .from("knockout_predictions")
        .update({ points_awarded: pts })
        .eq("id", pred.id);

      if (pts > 0) totalScored++;
    }
  }

  revalidatePath("/admin/knockouts");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");

  return { scored: totalScored };
}
