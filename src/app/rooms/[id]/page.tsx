import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import CopyInviteButton from "./copy-invite-button";
import LeaveRoomButton from "./leave-room-button";
import RenameRoomForm from "./rename-room-form";

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

  // Fetch prediction scores for room members
  const memberIds = (members ?? []).map((m: any) => m.user_id as string);
  const { data: scores } =
    memberIds.length > 0
      ? await supabase
          .from("prediction_scores")
          .select("user_id, base_points")
          .in("user_id", memberIds)
      : { data: [] };

  // Fetch outlier bonuses for this room
  const { data: bonuses } = await supabase
    .from("room_prediction_bonuses")
    .select("user_id, bonus_points")
    .eq("room_id", id);

  // Fetch global prediction points for members
  const { data: globalPreds } = memberIds.length > 0
    ? await supabase.from("global_predictions").select("user_id, points_awarded").in("user_id", memberIds)
    : { data: [] };

  // Aggregate standings
  const standings = new Map<string, { base: number; bonus: number; global: number }>();
  for (const uid of memberIds) {
    standings.set(uid, { base: 0, bonus: 0, global: 0 });
  }
  for (const s of scores ?? []) {
    const entry = standings.get(s.user_id);
    if (entry) entry.base += s.base_points;
  }
  for (const b of bonuses ?? []) {
    const entry = standings.get(b.user_id);
    if (entry) entry.bonus += b.bonus_points;
  }
  for (const g of globalPreds ?? []) {
    const entry = standings.get(g.user_id);
    if (entry) entry.global += g.points_awarded;
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
    .map(([userId, pts]) => ({
      userId,
      ...profileMap.get(userId)!,
      base: pts.base,
      bonus: pts.bonus,
      total: pts.base + pts.bonus + pts.global,
    }))
    .sort((a, b) => b.total - a.total);

  const hasScores = sortedStandings.some((s) => s.total > 0);

  return (
    <div className="space-y-6">
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
      <div className="rounded-lg border border-ink/10 bg-white p-4">
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

      {/* Standings */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Standings</h3>
        {hasScores ? (
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
                    <td className="px-3 py-2 text-right">{s.base}</td>
                    <td className="px-3 py-2 text-right text-clay">
                      {s.bonus > 0 ? `+${s.bonus}` : "0"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {s.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink/60">
            No scores yet. Standings update after matches are finalized.
          </p>
        )}
      </div>

      {/* Members List */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Members</h3>
        <div className="space-y-2">
          {(members ?? []).map((m: any) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between rounded-lg border border-ink/10 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {m.profiles?.display_name || m.profiles?.username || "Unknown"}
                </p>
                <p className="text-xs text-ink/40">{m.profiles?.username}</p>
              </div>
              <span className="text-xs text-ink/40">
                {m.role === "owner" ? "👑 Owner" : "Member"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
