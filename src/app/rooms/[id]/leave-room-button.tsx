"use client";

import { useState, useTransition } from "react";
import { leaveRoom, transferOwnershipAndLeave } from "./actions";

interface Member {
  userId: string;
  displayName: string | null;
  username: string;
}

interface Props {
  roomId: string;
  isOwner: boolean;
  otherMembers: Member[];
}

export default function LeaveRoomButton({ roomId, isOwner, otherMembers }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState(otherMembers[0]?.userId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLeave() {
    setError(null);
    startTransition(async () => {
      const result = isOwner
        ? await transferOwnershipAndLeave(roomId, newOwnerId)
        : await leaveRoom(roomId);
      if (result?.error) setError(result.error);
    });
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded border border-clay/40 px-3 py-1.5 text-sm text-clay hover:bg-clay/10 transition-colors shrink-0"
      >
        Leave Room
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {isOwner ? (
        <>
          {otherMembers.length === 0 ? (
            <p className="text-sm text-ink/70">You are the only member. You cannot leave.</p>
          ) : (
            <>
              <p className="text-sm text-ink/70">
                Choose a new owner before you leave:
              </p>
              <select
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                className="rounded border border-ink/20 px-2 py-1.5 text-sm focus:border-field focus:outline-none"
              >
                {otherMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.displayName || m.username}
                  </option>
                ))}
              </select>
            </>
          )}
        </>
      ) : (
        <p className="text-sm text-ink/70">Are you sure? You can rejoin later with the invite code.</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => { setConfirming(false); setError(null); }}
          disabled={isPending}
          className="rounded border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5 disabled:opacity-50"
        >
          Cancel
        </button>
        {(!isOwner || otherMembers.length > 0) && (
          <button
            onClick={handleLeave}
            disabled={isPending || (isOwner && !newOwnerId)}
            className="rounded bg-clay px-3 py-1.5 text-sm font-semibold text-white hover:bg-clay/90 disabled:opacity-50"
          >
            {isPending ? "Leaving…" : isOwner ? "Transfer & Leave" : "Yes, Leave"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-clay">{error}</p>}
    </div>
  );
}

