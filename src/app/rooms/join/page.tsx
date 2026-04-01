"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinRoomPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!inviteCode.trim()) return;

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    // Find room by invite code
    const { data: room, error: findError } = await supabase
      .from("rooms")
      .select("id, name")
      .eq("invite_code", inviteCode.trim())
      .eq("is_active", true)
      .single();

    if (findError || !room) {
      setError("Room not found. Check the invite code and try again.");
      setLoading(false);
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("room_memberships")
      .select("id")
      .eq("room_id", room.id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Already a member — just go there
      router.push(`/rooms/${room.id}`);
      return;
    }

    // Join the room
    const { error: joinError } = await supabase
      .from("room_memberships")
      .insert({ room_id: room.id, user_id: user.id, role: "member" });

    if (joinError) {
      setError(joinError.message);
      setLoading(false);
      return;
    }

    router.push(`/rooms/${room.id}`);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h2 className="text-2xl font-bold">Join a Room</h2>

      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium">
            Invite Code
          </label>
          <input
            id="code"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Paste the invite code here"
            required
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-field focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !inviteCode.trim()}
          className="w-full rounded bg-field py-2 text-sm font-medium text-white hover:bg-field/90 disabled:opacity-50"
        >
          {loading ? "Joining..." : "Join Room"}
        </button>
      </form>
    </div>
  );
}
