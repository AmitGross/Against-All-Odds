"use client";

import { useState, useTransition } from "react";
import { leaveRoom } from "./actions";

export default function LeaveRoomButton({ roomId }: { roomId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLeave() {
    setError(null);
    startTransition(async () => {
      const result = await leaveRoom(roomId);
      if (result?.error) setError(result.error);
    });
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded border border-clay/40 px-3 py-1.5 text-sm text-clay hover:bg-clay/10 transition-colors"
      >
        Leave Room
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-sm text-ink/70">Are you sure? You can rejoin later with the invite code.</p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="rounded border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleLeave}
          disabled={isPending}
          className="rounded bg-clay px-3 py-1.5 text-sm font-semibold text-white hover:bg-clay/90 disabled:opacity-50"
        >
          {isPending ? "Leaving…" : "Yes, Leave"}
        </button>
      </div>
      {error && <p className="text-xs text-clay">{error}</p>}
    </div>
  );
}
