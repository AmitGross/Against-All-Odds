import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AdminKnockoutsClient from "./admin-knockouts-client";
import ScoreKnockoutsButton from "./score-knockouts-button";

// The bracket structure from the image
const LEFT_SLOTS = [
  { round: "r32", side: "left", position: 0, slot_label: "1E" },
  { round: "r32", side: "left", position: 1, slot_label: "3 ABCDF" },
  { round: "r32", side: "left", position: 2, slot_label: "1I" },
  { round: "r32", side: "left", position: 3, slot_label: "3 CDFGH" },
  { round: "r32", side: "left", position: 4, slot_label: "2A" },
  { round: "r32", side: "left", position: 5, slot_label: "2B" },
  { round: "r32", side: "left", position: 6, slot_label: "1F" },
  { round: "r32", side: "left", position: 7, slot_label: "2C" },
  { round: "r32", side: "left", position: 8, slot_label: "2K" },
  { round: "r32", side: "left", position: 9, slot_label: "2L" },
  { round: "r32", side: "left", position: 10, slot_label: "1H" },
  { round: "r32", side: "left", position: 11, slot_label: "2J" },
  { round: "r32", side: "left", position: 12, slot_label: "1D" },
  { round: "r32", side: "left", position: 13, slot_label: "3 BEFIJ" },
  { round: "r32", side: "left", position: 14, slot_label: "1G" },
  { round: "r32", side: "left", position: 15, slot_label: "3 AEHIJ" },
  { round: "r16", side: "left", position: 0, slot_label: "" },
  { round: "r16", side: "left", position: 1, slot_label: "" },
  { round: "r16", side: "left", position: 2, slot_label: "" },
  { round: "r16", side: "left", position: 3, slot_label: "" },
  { round: "r16", side: "left", position: 4, slot_label: "" },
  { round: "r16", side: "left", position: 5, slot_label: "" },
  { round: "r16", side: "left", position: 6, slot_label: "" },
  { round: "r16", side: "left", position: 7, slot_label: "" },
  { round: "qf", side: "left", position: 0, slot_label: "" },
  { round: "qf", side: "left", position: 1, slot_label: "" },
  { round: "qf", side: "left", position: 2, slot_label: "" },
  { round: "qf", side: "left", position: 3, slot_label: "" },
  { round: "sf", side: "left", position: 0, slot_label: "" },
  { round: "sf", side: "left", position: 1, slot_label: "" },
  { round: "final", side: "left", position: 0, slot_label: "" },
];

const RIGHT_SLOTS = [
  { round: "r32", side: "right", position: 0, slot_label: "1C" },
  { round: "r32", side: "right", position: 1, slot_label: "2F" },
  { round: "r32", side: "right", position: 2, slot_label: "2E" },
  { round: "r32", side: "right", position: 3, slot_label: "2I" },
  { round: "r32", side: "right", position: 4, slot_label: "1A" },
  { round: "r32", side: "right", position: 5, slot_label: "3 CEFHI" },
  { round: "r32", side: "right", position: 6, slot_label: "1L" },
  { round: "r32", side: "right", position: 7, slot_label: "3 EHIJK" },
  { round: "r32", side: "right", position: 8, slot_label: "1J" },
  { round: "r32", side: "right", position: 9, slot_label: "2H" },
  { round: "r32", side: "right", position: 10, slot_label: "2D" },
  { round: "r32", side: "right", position: 11, slot_label: "2G" },
  { round: "r32", side: "right", position: 12, slot_label: "1B" },
  { round: "r32", side: "right", position: 13, slot_label: "3 EFGIJ" },
  { round: "r32", side: "right", position: 14, slot_label: "1K" },
  { round: "r32", side: "right", position: 15, slot_label: "3 DEIJL" },
  { round: "r16", side: "right", position: 0, slot_label: "" },
  { round: "r16", side: "right", position: 1, slot_label: "" },
  { round: "r16", side: "right", position: 2, slot_label: "" },
  { round: "r16", side: "right", position: 3, slot_label: "" },
  { round: "r16", side: "right", position: 4, slot_label: "" },
  { round: "r16", side: "right", position: 5, slot_label: "" },
  { round: "r16", side: "right", position: 6, slot_label: "" },
  { round: "r16", side: "right", position: 7, slot_label: "" },
  { round: "qf", side: "right", position: 0, slot_label: "" },
  { round: "qf", side: "right", position: 1, slot_label: "" },
  { round: "qf", side: "right", position: 2, slot_label: "" },
  { round: "qf", side: "right", position: 3, slot_label: "" },
  { round: "sf", side: "right", position: 0, slot_label: "" },
  { round: "sf", side: "right", position: 1, slot_label: "" },
  { round: "final", side: "right", position: 0, slot_label: "" },
  { round: "bronze", side: "left", position: 0, slot_label: "" },
  { round: "bronze", side: "left", position: 1, slot_label: "" },
];

export default async function AdminKnockoutsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return <p className="text-red-600">Access denied.</p>;

  // Get active tournament
  const { data: tournament } = await supabase
    .from("tournaments").select("id").eq("is_active", true).single();
  if (!tournament) return <p className="text-red-600">No active tournament found.</p>;

  // Seed slots if not yet created
  const { data: existing } = await supabase
    .from("knockout_slots")
    .select("id")
    .eq("tournament_id", tournament.id)
    .limit(1);

  if (!existing || existing.length === 0) {
    const allSlots = [...LEFT_SLOTS, ...RIGHT_SLOTS].map((s) => ({
      ...s,
      tournament_id: tournament.id,
    }));
    await supabase.from("knockout_slots").insert(allSlots);
  } else {
    // Backfill bronze slot 1 in case it was seeded before this was added
    await supabase.from("knockout_slots").upsert(
      { tournament_id: tournament.id, round: "bronze", side: "left", position: 1, slot_label: "" },
      { onConflict: "tournament_id,round,side,position", ignoreDuplicates: true }
    );
  }

  // Fetch all slots
  const { data: slots } = await supabase
    .from("knockout_slots")
    .select("*")
    .eq("tournament_id", tournament.id)
    .order("round").order("side").order("position");

  // Fetch all teams
  const { data: teams } = await supabase
    .from("teams").select("id, name, code, flag_url").order("name");

  // Build team → group map from group-stage matches
  const { data: groupMatches } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id, group_name")
    .eq("tournament_id", tournament.id)
    .not("group_name", "is", null);

  const teamGroups: Record<string, string> = {};
  for (const m of groupMatches ?? []) {
    if (m.group_name) {
      if (m.home_team_id) teamGroups[m.home_team_id] = m.group_name;
      if (m.away_team_id) teamGroups[m.away_team_id] = m.group_name;
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin — Knockout Bracket</h2>
      <p className="text-sm text-ink/60">
        Fill in teams, scores, and winners for each knockout slot. The bracket will update automatically.
      </p>
      <ScoreKnockoutsButton />
      <AdminKnockoutsClient
        tournamentId={tournament.id}
        initialSlots={(slots ?? []) as Parameters<typeof AdminKnockoutsClient>[0]["initialSlots"]}
        teams={(teams ?? []) as Parameters<typeof AdminKnockoutsClient>[0]["teams"]}
        teamGroups={teamGroups}
      />
    </div>
  );
}
