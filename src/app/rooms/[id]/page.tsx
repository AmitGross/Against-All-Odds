import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import CopyInviteButton from "./copy-invite-button";
import LeaveRoomButton from "./leave-room-button";
import RenameRoomForm from "./rename-room-form";
import WatchPartyScheduler from "./watch-party-scheduler";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch room
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, name, invite_code, created_by, created_at")
    .eq("id", id)
    .single();

  if (roomError || !room) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Room not found</h2>
        <p className="text-sm text-ink/60">
          This room doesn&apos;t exist or you don&apos;t have access.
        </p>
      </div>
    );
  }

  // Fetch members with profile info
  const { data: members } = await supabase
    .from("room_memberships")
    .select("user_id, role, joined_at, profiles(username, display_name)")
    .eq("room_id", id)
    .order("joined_at", { ascending: true });

  const isOwner = room.created_by === user.id;

  const otherMembers = (members ?? [])
    .filter((m: any) => m.user_id !== user.id)
    .map((m: any) => ({
      userId: m.user_id as string,
      displayName: m.profiles?.display_name ?? null,
      username: m.profiles?.username ?? "Unknown",
    }));

  // Fetch prediction scores with joined prediction + match data for stats
  const memberIds = (members ?? []).map((m: any) => m.user_id as string);
  const { data: scores } =
    memberIds.length > 0
      ? await supabase
          .from("prediction_scores")
          .select(`
            user_id, base_points,
            predictions!inner(predicted_home_score_90, predicted_away_score_90),
            matches!inner(home_score_90, away_score_90)
          `)
          .in("user_id", memberIds)
      : { data: [] };

  // Fetch outlier bonuses for this room
  const { data: bonuses } = await supabase
    .from("room_prediction_bonuses")
    .select("user_id, bonus_points")
    .eq("room_id", id);

  // Fetch global + knockout prediction points for members
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminClient = createAdminClient();
  const [{ data: globalPreds }, { data: knockoutPreds }] = memberIds.length > 0
    ? await Promise.all([
        adminClient.from("global_predictions").select("user_id, points_awarded").in("user_id", memberIds),
        adminClient
          .from("knockout_predictions")
          .select("user_id, points_awarded, predicted_home_score, predicted_away_score, knockout_slots!inner(home_score, away_score, winner_team_id, home_team_id)")
          .in("user_id", memberIds),
      ])
    : [{ data: [] }, { data: [] }];

  // Aggregate standings with per-user stats
  const standings = new Map<string, {
    exact: number;
    direction: number;
    wrong: number;
    pts: number;
    globalBonus: number;
    roomBonus: number;
  }>();
  for (const uid of memberIds) {
    standings.set(uid, { exact: 0, direction: 0, wrong: 0, pts: 0, globalBonus: 0, roomBonus: 0 });
  }
  for (const s of scores ?? []) {
    const entry = standings.get(s.user_id);
    if (!entry) continue;
    const pred = s.predictions as unknown as { predicted_home_score_90: number; predicted_away_score_90: number };
    const match = s.matches as unknown as { home_score_90: number | null; away_score_90: number | null };
    if (match.home_score_90 !== null && match.away_score_90 !== null) {
      const isExact =
        pred.predicted_home_score_90 === match.home_score_90 &&
        pred.predicted_away_score_90 === match.away_score_90;
      if (isExact) {
        entry.exact += 1;
      } else if (s.base_points > 0) {
        entry.direction += 1;
      } else {
        entry.wrong += 1;
      }
    }
    entry.pts += s.base_points;
  }
  for (const b of bonuses ?? []) {
    const entry = standings.get(b.user_id);
    if (entry) entry.roomBonus += b.bonus_points;
  }
  for (const g of globalPreds ?? []) {
    const entry = standings.get(g.user_id);
    if (entry) entry.globalBonus += g.points_awarded;
  }
  for (const k of knockoutPreds ?? []) {
    const entry = standings.get(k.user_id);
    if (!entry) continue;
    const slot = k.knockout_slots as unknown as {
      home_score: number | null;
      away_score: number | null;
      winner_team_id: string | null;
      home_team_id: string | null;
    };
    if (slot.home_score !== null && slot.away_score !== null && k.predicted_home_score != null && k.predicted_away_score != null) {
      const isExact = k.predicted_home_score === slot.home_score && k.predicted_away_score === slot.away_score;
      if (isExact) {
        entry.exact += 1;
      } else if (k.points_awarded > 0) {
        entry.direction += 1;
      } else {
        entry.wrong += 1;
      }
    }
    entry.pts += k.points_awarded;
  }

  const profileMap = new Map(
    (members ?? []).map((m: any) => [
      m.user_id,
      {
        username: m.profiles?.username ?? "Unknown",
        displayName: m.profiles?.display_name,
        role: m.role,
      },
    ])
  );

  const sortedStandings = [...standings.entries()]
    .map(([userId, s]) => ({
      userId,
      ...profileMap.get(userId)!,
      exact: s.exact,
      direction: s.direction,
      wrong: s.wrong,
      pts: s.pts,
      globalBonus: s.globalBonus,
      roomBonus: s.roomBonus,
      total: s.pts + s.globalBonus + s.roomBonus,
    }))
    .sort((a, b) => b.total - a.total);

  // Fetch upcoming (non-finished) matches for watch party selector
  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select(`
      id, starts_at, stage, group_name,
      home_team:teams!matches_home_team_id_fkey(name),
      away_team:teams!matches_away_team_id_fkey(name)
    `)
    .neq("status", "finished")
    .order("starts_at", { ascending: true });

  const stageLabel: Record<string, string> = {
    group: "Group",
    round_of_16: "Round of 16",
    quarter_final: "Quarter-Final",
    semi_final: "Semi-Final",
    third_place: "3rd Place",
    final: "Final",
  };

  const matchesForPicker = (upcomingMatches ?? []).map((m: any) => {
    const home = m.home_team?.name ?? null;
    const away = m.away_team?.name ?? null;
    const stage = stageLabel[m.stage] ?? m.stage;
    const prefix = m.group_name ? `Group ${m.group_name}` : stage;
    const label = home && away ? `${home} vs ${away} · ${prefix}` : `${prefix} · TBD vs TBD`;
    return {
      id: m.id as string,
      homeTeam: home ?? "TBD",
      awayTeam: away ?? "TBD",
      startsAt: m.starts_at as string,
      label,
    };
  });

  // Fetch existing watch party slots for this room
  const { data: watchPartyRows } = await supabase
    .from("room_watch_parties")
    .select("slot, match_id, knockout_slot_id, place, is_locked")
    .eq("room_id", id)
    .order("slot", { ascending: true });

  const savedSlots = (watchPartyRows ?? []).map((r: any) => ({
    slot: r.slot as number,
    matchId: r.match_id as string | null,
    knockoutSlotId: r.knockout_slot_id as string | null,
    place: r.place as string,
  }));
  const watchPartyLocked = (watchPartyRows ?? []).some((r: any) => r.is_locked);

  return (
    <div className="space-y-6">
      {/* Section A — full-width header */}
      <div className="rounded-lg border border-ink/10 bg-white p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{room.name}</h2>
            <p className="text-sm text-ink/40">
              {(members ?? []).length} member{(members ?? []).length !== 1 ? "s" : ""}
            </p>
            {isOwner && <RenameRoomForm roomId={room.id} currentName={room.name} />}
          </div>
          <LeaveRoomButton roomId={room.id} isOwner={isOwner} otherMembers={otherMembers} />
        </div>

        {/* Invite Code */}
        <div className="rounded-lg border border-ink/10 bg-ink/5 p-4">
          <p className="mb-1 text-xs font-medium text-ink/50">Invite Code</p>
          <div className="flex items-center gap-2">
            <code className="rounded bg-sand px-3 py-1 text-sm font-mono">
              {room.invite_code}
            </code>
            <CopyInviteButton code={room.invite_code} />
          </div>
          <p className="mt-2 text-xs text-ink/40">
            Share this code so friends can join your room.
          </p>
        </div>
      </div>

      {/* Sections B + C — two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">

        {/* Section B — Standings */}
        <div className="rounded-lg border border-ink/10 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">Standings</h3>
          <div className="h-[400px] overflow-y-auto overflow-x-auto rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-ink/10 bg-ink/5 text-left text-xs text-ink/50 uppercase">
                  <th className="w-8 px-3 py-2">#</th>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2 text-center" title="Exact score predictions">🎯</th>
                  <th className="px-3 py-2 text-center" title="Correct direction">✓</th>
                  <th className="px-3 py-2 text-center" title="Wrong direction">✗</th>
                  <th className="px-3 py-2 text-right">Pts</th>
                  <th className="px-3 py-2 text-right">Global Bonus</th>
                  <th className="px-3 py-2 text-right">Room Bonus</th>
                  <th className="px-3 py-2 text-right font-bold text-ink">Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedStandings.map((s, i) => (
                  <tr
                    key={s.userId}
                    className={`border-b border-ink/5 ${
                      i < 3 ? "bg-field/5 font-medium" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-ink/50">{i + 1}</td>
                    <td className="px-3 py-2">
                      {s.displayName || s.username}
                      {s.role === "owner" && (
                        <span className="ml-1 text-xs">👑</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-field font-medium">{s.exact}</td>
                    <td className="px-3 py-2 text-center text-green-600">{s.direction}</td>
                    <td className="px-3 py-2 text-center text-red-400">{s.wrong}</td>
                    <td className="px-3 py-2 text-right">{s.pts}</td>
                    <td className="px-3 py-2 text-right text-field">
                      {s.globalBonus > 0 ? `+${s.globalBonus}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-clay">
                      {s.roomBonus > 0 ? `+${s.roomBonus}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {s.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section C — placeholder */}
        <div className="rounded-lg border border-ink/10 bg-white p-4" />

      </div>

      {/* Section D — Watch Party Scheduler */}
      <WatchPartyScheduler
        roomId={id}
        isOwner={isOwner}
        matches={allPickerItems}
        savedSlots={savedSlots}
        isLocked={watchPartyLocked}
      />
    </div>
  );
}
