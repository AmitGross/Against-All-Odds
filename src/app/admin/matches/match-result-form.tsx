"use client";

import { useState } from "react";
import { finalizeMatch } from "./actions";

interface Props {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  currentHomeScore: number | null;
  currentAwayScore: number | null;
  status: string;
}

export default function MatchResultForm({
  matchId,
  homeTeam,
  awayTeam,
  currentHomeScore,
  currentAwayScore,
  status,
}: Props) {
  const isFinished = status === "finished";
  const [homeScore, setHomeScore] = useState(
    currentHomeScore?.toString() ?? ""
  );
  const [awayScore, setAwayScore] = useState(
    currentAwayScore?.toString() ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(isFinished);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const fd = new FormData();
    fd.set("matchId", matchId);
    fd.set("homeScore", homeScore);
    fd.set("awayScore", awayScore);

    const result = await finalizeMatch(fd);
    if (result.error) {
      setError(result.error);
    } else {
      setDone(true);
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <span className="w-32 text-right text-sm font-medium">{homeTeam}</span>
      <input
        type="number"
        min={0}
        max={99}
        value={homeScore}
        onChange={(e) => {
          setHomeScore(e.target.value);
          setDone(false);
        }}
        className="w-12 rounded border border-ink/20 px-1 py-0.5 text-center text-sm"
        disabled={submitting}
        aria-label={`${homeTeam} score`}
      />
      <span className="text-xs text-ink/40">–</span>
      <input
        type="number"
        min={0}
        max={99}
        value={awayScore}
        onChange={(e) => {
          setAwayScore(e.target.value);
          setDone(false);
        }}
        className="w-12 rounded border border-ink/20 px-1 py-0.5 text-center text-sm"
        disabled={submitting}
        aria-label={`${awayTeam} score`}
      />
      <span className="w-32 text-sm font-medium">{awayTeam}</span>
      <button
        type="submit"
        disabled={submitting || done}
        className={`rounded px-3 py-1 text-xs font-medium ${
          done
            ? "bg-field/20 text-field"
            : "bg-clay text-white hover:bg-clay/90"
        } disabled:opacity-50`}
      >
        {submitting ? "…" : done ? "Scored ✓" : "Finalize"}
      </button>
      {done && (
        <button
          type="button"
          onClick={() => setDone(false)}
          className="rounded px-2 py-1 text-xs font-medium text-ink/40 hover:bg-ink/5 hover:text-ink/70"
        >
          Reset
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
