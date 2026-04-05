"use client";

import { useState, useTransition } from "react";
import { scoreKnockoutPredictions } from "./actions";

export default function ScoreKnockoutsButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; scored?: number } | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const r = await scoreKnockoutPredictions();
      setResult(r);
    });
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-ink/10 bg-white p-4">
      <div>
        <p className="font-semibold text-sm">Score Knockout Predictions</p>
        <p className="text-xs text-ink/50">
          Awards points to all users who correctly predicted match winners. Run after setting each round&apos;s winners.
        </p>
      </div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="shrink-0 rounded-lg bg-field px-4 py-2 text-sm font-semibold text-white hover:bg-field/80 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Scoring…" : "Score Now"}
      </button>
      {result && !result.error && (
        <span className="text-sm text-field font-medium">
          ✓ {result.scored} correct picks awarded
        </span>
      )}
      {result?.error && (
        <span className="text-sm text-clay">{result.error}</span>
      )}
    </div>
  );
}
