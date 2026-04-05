"use client";

import { useState, useTransition } from "react";
import { resetGroupLocks } from "./actions";

export default function ResetGroupLocksButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; done?: boolean } | null>(null);

  function handleClick() {
    if (!confirm("Unlock all groups? Users will be able to edit their group-stage predictions again.")) return;
    setResult(null);
    startTransition(async () => {
      const r = await resetGroupLocks();
      setResult(r.error ? { error: r.error } : { done: true });
    });
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-clay/30 bg-clay/5 p-4">
      <div>
        <p className="font-semibold text-sm text-clay">Unlock All Groups</p>
        <p className="text-xs text-ink/50">Removes all group prediction locks so users can edit their picks again.</p>
      </div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="shrink-0 rounded-lg bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-clay/80 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Unlocking…" : "Unlock All"}
      </button>
      {result?.done && <span className="text-sm text-field font-medium">✓ All groups unlocked</span>}
      {result?.error && <span className="text-sm text-clay">{result.error}</span>}
    </div>
  );
}
