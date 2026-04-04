"use client";

import { useState, useTransition } from "react";
import { renameRoom } from "./actions";

export default function RenameRoomForm({
  roomId,
  currentName,
}: {
  roomId: string;
  currentName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await renameRoom(roomId, name);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-ink/40 hover:text-field underline underline-offset-2 transition-colors"
      >
        Rename
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") { setEditing(false); setName(currentName); }
          }}
          className="rounded border border-ink/20 px-2 py-1 text-sm focus:border-field focus:outline-none w-48"
        />
        <button
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          className="rounded bg-field px-3 py-1 text-sm font-semibold text-white hover:bg-field/90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => { setEditing(false); setName(currentName); }}
          disabled={isPending}
          className="rounded border border-ink/20 px-3 py-1 text-sm hover:bg-ink/5 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-clay">{error}</p>}
    </div>
  );
}
