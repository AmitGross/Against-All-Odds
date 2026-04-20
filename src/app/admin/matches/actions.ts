"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreGroupPrediction } from "@/domain/scoring/base-scoring";
import { evaluateOutlierBonus } from "@/domain/scoring/outlier";
import { getOutcomeFromScore } from "@/domain/scoring/outcome";
import type { Prediction, MatchResult } from "@/types/domain";
import { revalidatePath } from "next/cache";

/**
 * Incremental streak update — called after a single match is finalized.
 *
 * For each user who predicted that match:
 *   - direction correct (base_points > 0) → direction_streak + 1, else reset to 0
 *   - exact correct (predicted scores == actual scores) → exact_streak + 1, else reset to 0
 * Then derive is_fortune_teller / is_prophet from the new streak values.
 *
 * Uses a raw SQL RPC-style UPDATE per user so we read the current stored streak
 * and simply add 1 or reset — no need to scan history.
 */
async function incrementBadgeStreaks(
  admin: ReturnType<typeof createAdminClient>,
  scoreRows: { user_id: string; base_points: number }[],
  predByUserId: Map<string, { predHome: number; predAway: number }>,
  actualHome: number,
  actualAway: number,
) {
  for (const row of scoreRows) {
    const directionCorrect = row.base_points > 0;
    const pred = predByUserId.get(row.user_id);
    const exactCorrect = pred
      ? pred.predHome === actualHome && pred.predAway === actualAway
      : false;

    // Fetch current streak values for this user
    const { data: profile } = await admin
      .from("profiles")
      .select("direction_streak, exact_streak")
      .eq("id", row.user_id)
      .single();

    const newDir = directionCorrect ? ((profile?.direction_streak ?? 0) + 1) : 0;
    const newEx  = exactCorrect     ? ((profile?.exact_streak     ?? 0) + 1) : 0;

    await admin
      .from("profiles")
      .update({
        direction_streak:  newDir,
        is_fortune_teller: newDir >= 3,
        exact_streak:      newEx,
        is_prophet:        newEx >= 3,
      })
      .eq("id", row.user_id);
  }
}

/**
 * Full recompute — used when a match is unfinalized or all matches are reset.
 * Replays every finished match in order and rebuilds each user's current streak
 * from scratch, then writes it back to profiles.
 */
async function recomputeBadgeStreaks(admin: ReturnType<typeof createAdminClient>) {
  // Fetch all finished match results ordered chronologically
  const { data: finishedMatches } = await admin
    .from("matches")
    .select("id, starts_at, home_score_90, away_score_90")
    .eq("status", "finished")
    .order("starts_at", { ascending: true });

  // Reset everyone first
  await admin
    .from("profiles")
    .update({ direction_streak: 0, is_fortune_teller: false, exact_streak: 0, is_prophet: false })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (!finishedMatches || finishedMatches.length === 0) return;

  const finishedMatchIds = finishedMatches.map((m: any) => m.id as string);
  const matchById = new Map(finishedMatches.map((m: any) => [m.id as string, m]));

  // Fetch all prediction scores + predicted scores for finished matches
  const { data: scoreRows } = await admin
    .from("prediction_scores")
    .select("user_id, match_id, base_points, predictions!inner(predicted_home_score_90, predicted_away_score_90)")
    .in("match_id", finishedMatchIds);

  if (!scoreRows || scoreRows.length === 0) return;

  // Group by user, preserving chronological order
  const byUser = new Map<string, { matchId: string; startsAt: string; basePoints: number; predHome: number; predAway: number }[]>();
  for (const row of scoreRows as any[]) {
    const pred = row.predictions as { predicted_home_score_90: number; predicted_away_score_90: number };
    const match = matchById.get(row.match_id as string);
    if (!match) continue;
    if (!byUser.has(row.user_id)) byUser.set(row.user_id, []);
    byUser.get(row.user_id)!.push({
      matchId: row.match_id,
      startsAt: match.starts_at,
      basePoints: row.base_points,
      predHome: pred.predicted_home_score_90,
      predAway: pred.predicted_away_score_90,
    });
  }

  const updates: { id: string; direction_streak: number; is_fortune_teller: boolean; exact_streak: number; is_prophet: boolean }[] = [];

  for (const [userId, entries] of byUser) {
    entries.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    let dirStreak = 0;
    let exStreak = 0;

    for (const e of entries) {
      const match = matchById.get(e.matchId) as any;
      dirStreak = e.basePoints > 0 ? dirStreak + 1 : 0;
      exStreak  = (e.predHome === (match.home_score_90 as number) && e.predAway === (match.away_score_90 as number))
        ? exStreak + 1 : 0;
    }

    updates.push({
      id: userId,
      direction_streak: dirStreak,
      is_fortune_teller: dirStreak >= 3,
      exact_streak: exStreak,
      is_prophet: exStreak >= 3,
    });
  }

  if (updates.length > 0) {
    await admin.from("profiles").upsert(updates, { onConflict: "id" });
  }
}

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

  // 9. Increment badge streaks for each user who predicted this match
  const predByUserId = new Map(
    predRows.map((r) => ({
      userId: r.user_id as string,
      predHome: r.predicted_home_score_90 as number,
      predAway: r.predicted_away_score_90 as number,
    }))
    .map((r) => [r.userId, { predHome: r.predHome, predAway: r.predAway }])
  );
  await incrementBadgeStreaks(
    admin,
    scoreRows.map((s) => ({ user_id: s.user_id, base_points: s.base_points })),
    predByUserId,
    homeScore,
    awayScore,
  );

  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  revalidatePath("/leaderboard");
  return {};
}

export async function toggleLock(
  matchId: string,
  lock: boolean
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
  const { error: err } = await admin
    .from("matches")
    .update({ is_locked: lock })
    .eq("id", matchId);

  if (err) return { error: err.message };

  revalidatePath("/admin/matches");
  revalidatePath("/matches");
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

  // Full recompute: streaks for remaining finished matches may have changed
  await recomputeBadgeStreaks(admin);

  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  revalidatePath("/leaderboard");
  return {};
}

export async function resetMatches(): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return { error: "Not authorized" };

  const admin = createAdminClient();

  // Reset all group-stage match results back to scheduled
  const { error: matchErr } = await admin
    .from("matches")
    .update({ status: "scheduled", is_locked: false, home_score_90: null, away_score_90: null })
    .eq("stage", "group");

  if (matchErr) return { error: matchErr.message };

  // Clear all prediction scores
  const { error: scoresErr } = await admin
    .from("prediction_scores")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (scoresErr) return { error: scoresErr.message };

  // Clear room outlier bonuses
  const { error: bonusErr } = await admin
    .from("room_prediction_bonuses")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (bonusErr) return { error: bonusErr.message };

  // All scores cleared — reset all streaks to zero
  await recomputeBadgeStreaks(admin);

  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");

  return {};
}
