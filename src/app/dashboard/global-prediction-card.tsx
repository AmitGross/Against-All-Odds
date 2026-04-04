"use client";

import { useState, useTransition } from "react";
import { saveGlobalPrediction } from "./actions";

type Team = { id: string; name: string; flag_url: string | null };
type Player = { id: string; name: string };

const META: Record<string, { label: string; icon: string; description: string }> = {
  winner:        { label: "Tournament Winner", icon: "🏆", description: "Which nation lifts the trophy?" },
  top_scorer:    { label: "Top Scorer",        icon: "⚽", description: "Who scores the most goals?" },
  assist_leader: { label: "Assist Leader",     icon: "🎯", description: "Who provides the most assists?" },
};

export default function GlobalPredictionCard({
  type,
  isLocked,
  teams,
  players,
  currentPick,
  pointsAwarded,
}: {
  type: string;
  isLocked: boolean;
  teams: Team[];
  players: Player[];
  currentPick: { teamId?: string | null; playerId?: string | null } | null;
  pointsAwarded: number;
}) {
  const meta = META[type];
  const usesPlayer = type !== "winner";
  const options = usesPlayer ? players : teams;

  const initialId = usesPlayer
    ? (currentPick?.playerId ?? "")
    : (currentPick?.teamId ?? "");

  const [selectedId, setSelectedId] = useState(initialId);
  const [saved, setSaved] = useState(!!initialId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    startTransition(async () => {
      const result = await saveGlobalPrediction({
        type,
        teamId: usesPlayer ? null : selectedId,
        playerId: usesPlayer ? selectedId : null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setError(null);
      }
    });
  }

  const currentLabel = usesPlayer
    ? players.find((p) => p.id === (currentPick?.playerId ?? selectedId))?.name
    : teams.find((t) => t.id === (currentPick?.teamId ?? selectedId))?.name;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink/10 p-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">{meta.icon}</span>
        <span className="text-sm font-semibold">{meta.label}</span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
            isLocked ? "bg-clay/10 text-clay" : "bg-field/10 text-field"
          }`}
        >
          {isLocked ? "Locked" : "Open"}
        </span>
      </div>

      <p className="text-xs text-ink/40">{meta.description}</p>

      {isLocked ? (
        /* Locked state — show pick + points */
        <div className="mt-auto">
          <p className="text-xs text-ink/50">
            Your pick:{" "}
            <span className="font-medium text-ink">
              {currentLabel ?? <em className="italic text-ink/30">None</em>}
            </span>
          </p>
          {pointsAwarded > 0 && (
            <p className="mt-1 text-xs font-semibold text-field">
              +{pointsAwarded} pts earned ✅
            </p>
          )}
        </div>
      ) : (
        /* Open state — pick form */
        <form onSubmit={handleSubmit} className="mt-auto flex flex-col gap-2">
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setSaved(false); }}
            className="w-full rounded border border-ink/20 bg-sand px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-field/40"
            disabled={isPending}
          >
            <option value="">— Pick {usesPlayer ? "player" : "team"} —</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!selectedId || isPending}
            className="rounded bg-field px-3 py-1.5 text-sm font-semibold text-white hover:bg-field/90 disabled:opacity-40 transition-colors"
          >
            {isPending ? "Saving…" : saved ? "Update Pick" : "Save Pick"}
          </button>

          {saved && !error && (
            <p className="text-xs font-medium text-field">Pick saved ✓</p>
          )}
          {error && <p className="text-xs text-clay">{error}</p>}
        </form>
      )}
    </div>
  );
}
