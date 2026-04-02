"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreGroupPrediction } from "@/domain/scoring/base-scoring";
import { evaluateOutlierBonus } from "@/domain/scoring/outlier";
import { getOutcomeFromScore } from "@/domain/scoring/outcome";
import type { Prediction, MatchResult } from "@/types/domain";
import { revalidatePath } from "next/cache";

function toPrediction(row: Record<string, unknown>): Prediction {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    matchId: row.match_id as string,
    predictedHomeScore90: row.predicted_home_score_90 as number,
    predictedAwayScore90: row.predicted_away_score_90 as number,
    predictedHomeScore120: (row.predicted_home_score_120 as number) ?? null,
    predictedAwayScore120: (row.predicted_away_score_120 as number) ?? null,
    predictedPenaltyWinnerTeamId:
      (row.predicted_penalty_winner_team_id as string) ?? null,
    submittedAt: row.submitted_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function finalizeMatch(
  formData: FormData
): Promise<{ error?: string }> {
  // 1. Verify caller is an admin
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return { error: "Not authorized" };

  // 2. Parse input
  const matchId = formData.get("matchId") as string;
  const homeScore = parseInt(formData.get("homeScore") as string, 10);
  const awayScore = parseInt(formData.get("awayScore") as string, 10);

  if (
    !matchId ||
    isNaN(homeScore) ||
    isNaN(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    return { error: "Invalid scores" };
  }

  // 3. Use service-role client for full DB access
  const admin = createAdminClient();

  // 4. Update match result
  const { error: updateErr } = await admin
    .from("matches")
    .update({
      home_score_90: homeScore,
      away_score_90: awayScore,
      status: "finished",
      is_locked: true,
    })
    .eq("id", matchId);

  if (updateErr) return { error: updateErr.message };

  // 5. Fetch all predictions for this match
  const { data: predRows } = await admin
    .from("predictions")
    .select("*")
    .eq("match_id", matchId);

  if (!predRows || predRows.length === 0) {
    revalidatePath("/admin/matches");
    revalidatePath("/matches");
    return {};
  }

  // 6. Build result object
  const result: MatchResult = {
    matchId,
    outcome: getOutcomeFromScore(homeScore, awayScore),
    homeScore90: homeScore,
    awayScore90: awayScore,
    homeScore120: null,
    awayScore120: null,
    penaltyWinnerTeamId: null,
  };

  // 7. Score each prediction
  const scoreRows: {
    prediction_id: string;
    user_id: string;
    match_id: string;
    base_points: number;
    global_points: number;
    rule_version: string;
  }[] = [];
  const basePointsMap = new Map<string, number>();

  for (const row of predRows) {
    const pred = toPrediction(row);
    const scored = scoreGroupPrediction(pred, result);
    basePointsMap.set(row.id, scored.basePoints);
    scoreRows.push({
      prediction_id: row.id,
      user_id: row.user_id,
      match_id: matchId,
      base_points: scored.basePoints,
      global_points: scored.globalPoints,
      rule_version: scored.ruleVersion,
    });
  }

  if (scoreRows.length > 0) {
    const { error: scoreErr } = await admin
      .from("prediction_scores")
      .upsert(scoreRows, { onConflict: "prediction_id" });
    if (scoreErr) return { error: scoreErr.message };
  }

  // 8. Compute outlier bonuses per room
  const { data: rooms } = await admin
    .from("rooms")
    .select("id")
    .eq("is_active", true);

  if (rooms && rooms.length > 0) {
    const bonusRows: {
      room_id: string;
      prediction_id: string;
      user_id: string;
      match_id: string;
      bonus_type: string;
      bonus_points: number;
    }[] = [];

    for (const room of rooms) {
      const { data: members } = await admin
        .from("room_memberships")
        .select("user_id")
        .eq("room_id", room.id);

      if (!members || members.length < 2) continue;

      const memberIds = new Set(members.map((m) => m.user_id));
      const roomPreds = predRows
        .filter((r) => memberIds.has(r.user_id))
        .map((r) => ({
          prediction: toPrediction(r),
          basePoints: basePointsMap.get(r.id) ?? 0,
        }));

      if (roomPreds.length < 2) continue;

      const bonus = evaluateOutlierBonus(room.id, roomPreds, result);
      if (bonus && bonus.applied) {
        bonusRows.push({
          room_id: room.id,
          prediction_id: bonus.predictionId,
          user_id: bonus.userId,
          match_id: matchId,
          bonus_type: "outlier",
          bonus_points: bonus.bonusPoints,
        });
      }
    }

    if (bonusRows.length > 0) {
      await admin
        .from("room_prediction_bonuses")
        .upsert(bonusRows, {
          onConflict: "room_id,prediction_id,bonus_type",
        });
    }
  }

  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  revalidatePath("/leaderboard");
  return {};
}

export async function unfinalizeMatch(
  matchId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return { error: "Not authorized" };

  const admin = createAdminClient();

  // Delete bonuses for this match
  await admin
    .from("room_prediction_bonuses")
    .delete()
    .eq("match_id", matchId);

  // Delete scores for this match
  await admin
    .from("prediction_scores")
    .delete()
    .eq("match_id", matchId);

  // Reset match to scheduled
  const { error: updateErr } = await admin
    .from("matches")
    .update({
      home_score_90: null,
      away_score_90: null,
      status: "scheduled",
      is_locked: false,
    })
    .eq("id", matchId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  revalidatePath("/leaderboard");
  return {};
}
