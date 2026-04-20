"use client";

import { useRef, useState, useTransition } from "react";
import { grantPeekTokens } from "./actions";

interface Props {
  roomId: string;
  userId: string;
  displayName: string;
  granted: number;
  used: number;
}

export default function PeekGrantForm({ roomId, userId, displayName, granted, used }: Props) {
  const [value, setValue] = useState(granted);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    startTransition(async () => {
      const result = await grantPeekTokens(roomId, userId, value);
      if (!result.error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex-1 truncate text-ink/80">{displayName}</span>
      <span className="text-xs text-ink/40 shrink-0">{used} used</span>
      <input
        ref={inputRef}
        type="number"
        min={0}
        max={99}
        value={value}
        onChange={(e) => setValue(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-14 rounded border border-ink/20 px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ink/30"
      />
      <button
        onClick={handleSave}
        disabled={pending || value === granted}
        className="shrink-0 rounded bg-ink px-2 py-1 text-xs text-white disabled:opacity-40 hover:bg-ink/80 transition-colors"
      >
        {pending ? "…" : saved ? "✓" : "Set"}
      </button>
    </div>
  );
}
