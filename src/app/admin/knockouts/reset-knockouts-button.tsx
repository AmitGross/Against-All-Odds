"use client";

import { useState, useTransition } from "react";
import { resetKnockouts } from "./actions";

export default function ResetKnockoutsButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; done?: boolean } | null>(null);

  function handleClick() {
    if (!confirm("Reset ALL knockout slots? This will clear all teams, scores, and winners from the bracket and zero out all knockout prediction points. This cannot be undone.")) return;
    setResult(null);
    startTransition(async () => {
      const r = await resetKnockouts();
      setResult(r.error ? { error: r.error } : { done: true });
    });
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-clay/30 bg-clay/5 p-4">
      <div>
        <p className="font-semibold text-sm text-clay">Reset Bracket</p>
        <p className="text-xs text-ink/50">Clears all teams, scores, winners and prediction points. Use for testing only.</p>
      </div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="shrink-0 rounded-lg bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-clay/80 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Resetting…" : "Reset"}
      </button>
      {result?.done && <span className="text-sm text-field font-medium">✓ Reset done</span>}
      {result?.error && <span className="text-sm text-clay">{result.error}</span>}
    </div>
  );
}
