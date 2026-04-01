import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function RoomsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get rooms the user is a member of
  const { data: memberships } = await supabase
    .from("room_memberships")
    .select("room_id, role, rooms(id, name, invite_code, created_at)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const rooms = (memberships ?? []).map((m: any) => ({
    id: m.rooms.id,
    name: m.rooms.name,
    inviteCode: m.rooms.invite_code,
    role: m.role,
    createdAt: m.rooms.created_at,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Rooms</h2>
        <div className="flex gap-2">
          <Link
            href="/rooms/join"
            className="rounded bg-sand px-4 py-2 text-sm font-medium text-ink hover:bg-sand/80"
          >
            Join Room
          </Link>
          <Link
            href="/rooms/create"
            className="rounded bg-field px-4 py-2 text-sm font-medium text-white hover:bg-field/90"
          >
            Create Room
          </Link>
        </div>
      </div>

      {rooms.length === 0 ? (
        <p className="text-sm text-ink/60">
          You haven&apos;t joined any rooms yet. Create one or join with an
          invite code.
        </p>
      ) : (
        <div className="space-y-2">
          {rooms.map((room: any) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="flex items-center justify-between rounded-lg border border-ink/10 bg-white px-5 py-4 hover:border-field/30"
            >
              <div>
                <h3 className="font-semibold">{room.name}</h3>
                <p className="text-xs text-ink/40">
                  {room.role === "owner" ? "Owner" : "Member"}
                </p>
              </div>
              <span className="text-sm text-ink/40">&rarr;</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
