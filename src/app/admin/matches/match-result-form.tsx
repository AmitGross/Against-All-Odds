"use client";

import { useState } from "react";
import { finalizeMatch, unfinalizeMatch, toggleLock } from "./actions";

interface Props {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  currentHomeScore: number | null;
  currentAwayScore: number | null;
  status: string;
  isLocked: boolean;
}

export default function MatchResultForm({
  matchId,
  homeTeam,
  awayTeam,
  currentHomeScore,
  currentAwayScore,
  status,
  isLocked: initialLocked,
}: Props) {
  const isFinished = status === "finished";
  const [locked, setLocked] = useState(initialLocked);
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
          onClick={async () => {
            setSubmitting(true);
            setError("");
            const result = await unfinalizeMatch(matchId);
            if (result.error) {
              setError(result.error);
            } else {
              setDone(false);
              setHomeScore("");
              setAwayScore("");
            }
            setSubmitting(false);
          }}
          disabled={submitting}
          className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        >
          Undo
        </button>
      )}
      <button
        type="button"
        onClick={async () => {
          setSubmitting(true);
          setError("");
          const result = await toggleLock(matchId, !locked);
          if (result.error) {
            setError(result.error);
          } else {
            setLocked(!locked);
          }
          setSubmitting(false);
        }}
        disabled={submitting}
        className={`rounded px-2 py-1 text-xs font-medium ${
          locked
            ? "bg-red-100 text-red-600 hover:bg-red-200"
            : "bg-ink/5 text-ink/50 hover:bg-ink/10"
        } disabled:opacity-50`}
        title={locked ? "Predictions locked — click to unlock" : "Click to lock predictions"}
      >
        {locked ? "🔒" : "🔓"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
