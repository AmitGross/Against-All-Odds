"use client";

import { useState } from "react";

interface Prediction {
  userId: string;
  username: string;
  displayName: string | null;
  home: number;
  away: number;
}

interface TelepathyMatch {
  matchId: string;
  label: string;
  startsAt: string;
  homeScore: number | null;
  awayScore: number | null;
  predictions: Prediction[];
}

interface Props {
  matches: TelepathyMatch[];
}

export default function TelepathyViewer({ matches }: Props) {
  const [index, setIndex] = useState(0);

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-4 flex flex-col items-center justify-center h-full min-h-[200px]">
        <p className="text-sm text-ink/40 text-center">No locked or finished matches yet.</p>
      </div>
    );
  }

  const match = matches[index];

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="text-ink/40 hover:text-ink disabled:opacity-20 text-lg px-1"
        >
          ◄
        </button>
        <div className="text-center flex-1">
          <p className="text-sm font-semibold leading-tight">{match.label}</p>
          {match.homeScore !== null && match.awayScore !== null && (
            <p className="text-xs text-ink/40 mt-0.5">
              Result: {match.homeScore} – {match.awayScore}
            </p>
          )}
        </div>
        <button
          onClick={() => setIndex((i) => Math.min(matches.length - 1, i + 1))}
          disabled={index === matches.length - 1}
          className="text-ink/40 hover:text-ink disabled:opacity-20 text-lg px-1"
        >
          ►
        </button>
      </div>
      <p className="text-center text-xs text-ink/30">{index + 1} / {matches.length}</p>

      {/* Predictions table */}
      <div className="overflow-y-auto max-h-[300px] rounded-lg border border-ink/10">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-ink/10 bg-ink/5 text-xs text-ink/50 uppercase">
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-center">Pred.</th>
            </tr>
          </thead>
          <tbody>
            {match.predictions.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-4 text-center text-xs text-ink/40">
                  No predictions submitted.
                </td>
              </tr>
            ) : (
              match.predictions.map((p) => (
                <tr key={p.userId} className="border-b border-ink/5 last:border-0">
                  <td className="px-3 py-2 text-sm">{p.displayName || p.username}</td>
                  <td className="px-3 py-2 text-center font-mono font-medium">
                    {p.home} – {p.away}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
