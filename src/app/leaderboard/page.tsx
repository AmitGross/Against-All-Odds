import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

interface ScoreRow {
  user_id: string;
  global_points: number;
}

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Global leaderboard ──
  const admin = createAdminClient();
  const [{ data: scores }, { data: globalPredScores }] = await Promise.all([
    supabase.from("prediction_scores").select("user_id, global_points"),
    admin.from("global_predictions").select("user_id, points_awarded"),
  ]);

  const userPoints = new Map<string, number>();
  for (const s of (scores ?? []) as ScoreRow[]) {
    userPoints.set(
      s.user_id,
      (userPoints.get(s.user_id) ?? 0) + s.global_points
    );
  }
  for (const g of (globalPredScores ?? []) as { user_id: string; points_awarded: number }[]) {
    userPoints.set(
      g.user_id,
      (userPoints.get(g.user_id) ?? 0) + g.points_awarded
    );
  }

  const allUserIds = [...userPoints.keys()];
  const { data: allProfiles } =
    allUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", allUserIds)
      : { data: [] };

  const profileMap = new Map(
    (allProfiles ?? []).map((p) => [
      p.id,
      {
        username: p.username as string,
        display_name: p.display_name as string | null,
      },
    ])
  );

  const leaderboard = [...userPoints.entries()]
    .map(([userId, points]) => ({
      userId,
      username: profileMap.get(userId)?.username ?? "Unknown",
      displayName: profileMap.get(userId)?.display_name,
      totalPoints: points,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // ── Per-room leaderboards (rooms user belongs to) ──
  interface RoomStanding {
    roomId: string;
    roomName: string;
    entries: {
      userId: string;
      name: string;
      base: number;
      bonus: number;
      total: number;
    }[];
  }

  const roomStandings: RoomStanding[] = [];

  if (user) {
    const { data: memberships } = await supabase
      .from("room_memberships")
      .select("room_id, rooms(id, name)")
      .eq("user_id", user.id);

    for (const mem of memberships ?? []) {
      const room = mem.rooms as unknown as { id: string; name: string };
      if (!room) continue;

      // Get all members of this room
      const { data: roomMembers } = await supabase
        .from("room_memberships")
        .select("user_id, profiles(username, display_name)")
        .eq("room_id", room.id);

      const memberIds = (roomMembers ?? []).map((m: any) => m.user_id as string);
      if (memberIds.length === 0) continue;

      // Base scores for members
      const { data: memberScores } = await supabase
        .from("prediction_scores")
        .select("user_id, base_points")
        .in("user_id", memberIds);

      // Bonuses for this room
      const { data: bonuses } = await supabase
        .from("room_prediction_bonuses")
        .select("user_id, bonus_points")
        .eq("room_id", room.id);

      // Global prediction points for members
      const { data: memberGlobalPreds } = await admin
        .from("global_predictions")
        .select("user_id, points_awarded")
        .in("user_id", memberIds);

      const pts = new Map<string, { base: number; bonus: number; global: number }>();
      for (const uid of memberIds) pts.set(uid, { base: 0, bonus: 0, global: 0 });
      for (const s of memberScores ?? []) {
        const e = pts.get(s.user_id);
        if (e) e.base += s.base_points;
      }
      for (const b of bonuses ?? []) {
        const e = pts.get(b.user_id);
        if (e) e.bonus += b.bonus_points;
      }
      for (const g of memberGlobalPreds ?? []) {
        const e = pts.get(g.user_id);
        if (e) e.global += g.points_awarded;
      }

      const memberProfileMap = new Map(
        (roomMembers ?? []).map((m: any) => [
          m.user_id,
          (m.profiles?.display_name || m.profiles?.username || "Unknown") as string,
        ])
      );

      const entries = [...pts.entries()]
        .map(([userId, p]) => ({
          userId,
          name: memberProfileMap.get(userId) ?? "Unknown",
          base: p.base,
          bonus: p.bonus,
          total: p.base + p.bonus + p.global,
        }))
        .sort((a, b) => b.total - a.total);

      roomStandings.push({ roomId: room.id, roomName: room.name, entries });
    }
  }

  return (
    <div className="space-y-10">
      {/* Global */}
      <section>
        <h2 className="text-2xl font-bold">Global Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">
            No scores yet. Scores appear after matches are finalized.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10 bg-ink/5 text-left">
                  <th className="w-12 px-4 py-2">#</th>
                  <th className="px-4 py-2">Player</th>
                  <th className="px-4 py-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => (
                  <tr
                    key={entry.userId}
                    className={`border-b border-ink/5 ${
                      i < 3 ? "bg-field/5 font-medium" : ""
                    }`}
                  >
                    <td className="px-4 py-2 text-ink/50">{i + 1}</td>
                    <td className="px-4 py-2">
                      {entry.displayName || entry.username}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {entry.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Per-room standings */}
      {roomStandings.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Room Standings</h2>
          {roomStandings.map((room) => (
            <div key={room.roomId}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{room.roomName}</h3>
                <Link
                  href={`/rooms/${room.roomId}`}
                  className="text-xs text-field hover:underline"
                >
                  View room →
                </Link>
              </div>
              {room.entries.some((e) => e.total > 0) ? (
                <div className="overflow-hidden rounded-lg border border-ink/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink/10 bg-ink/5 text-left">
                        <th className="w-10 px-3 py-2">#</th>
                        <th className="px-3 py-2">Player</th>
                        <th className="px-3 py-2 text-right">Base</th>
                        <th className="px-3 py-2 text-right">Bonus</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.entries.map((e, i) => (
                        <tr
                          key={e.userId}
                          className={`border-b border-ink/5 ${
                            i < 3 ? "bg-field/5 font-medium" : ""
                          }`}
                        >
                          <td className="px-3 py-2 text-ink/50">{i + 1}</td>
                          <td className="px-3 py-2">{e.name}</td>
                          <td className="px-3 py-2 text-right">{e.base}</td>
                          <td className="px-3 py-2 text-right text-clay">
                            {e.bonus > 0 ? `+${e.bonus}` : "0"}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {e.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-ink/60">No scores yet.</p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
