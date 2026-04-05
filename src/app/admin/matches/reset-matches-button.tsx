"use client";

import { useState, useTransition } from "react";
import { resetMatches } from "./actions";

export default function ResetMatchesButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; done?: boolean } | null>(null);

  function handleClick() {
    if (!confirm("Reset ALL group-stage match results? This will clear all scores, unlock all matches, and delete all prediction scores and room bonuses. This cannot be undone.")) return;
    setResult(null);
    startTransition(async () => {
      const r = await resetMatches();
      setResult(r.error ? { error: r.error } : { done: true });
    });
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-clay/30 bg-clay/5 p-4">
      <div>
        <p className="font-semibold text-sm text-clay">Reset Match Results</p>
        <p className="text-xs text-ink/50">Clears all scores, resets to scheduled, deletes prediction scores and room bonuses. Use for testing only.</p>
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
