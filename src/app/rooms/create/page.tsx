"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CreateRoomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;

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

    // Create room
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({ name: name.trim(), created_by: user.id })
      .select("id")
      .single();

    if (roomError) {
      setError(roomError.message);
      setLoading(false);
      return;
    }

    // Add creator as owner member
    const { error: memberError } = await supabase
      .from("room_memberships")
      .insert({ room_id: room.id, user_id: user.id, role: "owner" });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    router.push(`/rooms/${room.id}`);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h2 className="text-2xl font-bold">Create a Room</h2>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Room Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Legends"
            required
            maxLength={50}
            className="mt-1 w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-field focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded bg-field py-2 text-sm font-medium text-white hover:bg-field/90 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Room"}
        </button>
      </form>
    </div>
  );
}
