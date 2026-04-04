"use client";

import { useState, useTransition } from "react";
import { toggleGlobalLock, setCorrectAnswer } from "./actions";

type Setting = {
  type: string;
  is_locked: boolean;
  correct_team_id: string | null;
  correct_player_id: string | null;
};

type Team = { id: string; name: string; flag_url: string | null };
type Player = { id: string; name: string };

const TYPE_META: Record<string, { label: string; icon: string; usesPlayer: boolean }> = {
  winner:        { label: "Tournament Winner", icon: "🏆", usesPlayer: false },
  top_scorer:    { label: "Top Scorer",        icon: "⚽", usesPlayer: true  },
  assist_leader: { label: "Assist Leader",     icon: "🎯", usesPlayer: true  },
};

function GlobalCard({
  setting,
  teams,
  players,
}: {
  setting: Setting;
  teams: Team[];
  players: Player[];
}) {
  const meta = TYPE_META[setting.type];
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string>(
    meta.usesPlayer
      ? (setting.correct_player_id ?? "")
      : (setting.correct_team_id ?? "")
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleLock() {
    startTransition(async () => {
      await toggleGlobalLock(setting.type, !setting.is_locked);
      setFeedback(setting.is_locked ? "Unlocked." : "Locked.");
      setTimeout(() => setFeedback(null), 2000);
    });
  }

  function handleSetAnswer() {
    if (!selectedId) return;
    startTransition(async () => {
      const teamId = meta.usesPlayer ? null : selectedId;
      const playerId = meta.usesPlayer ? selectedId : null;
      await setCorrectAnswer(setting.type, teamId, playerId);
      setFeedback("Correct answer saved & points awarded to matching picks.");
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  const options = meta.usesPlayer ? players : teams;
  const currentLabel = meta.usesPlayer
    ? players.find((p) => p.id === setting.correct_player_id)?.name
    : teams.find((t) => t.id === setting.correct_team_id)?.name;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{meta.icon}</span>
        <h3 className="font-semibold text-ink">{meta.label}</h3>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${setting.is_locked ? "bg-clay/10 text-clay" : "bg-field/10 text-field"}`}>
          {setting.is_locked ? "Locked" : "Open"}
        </span>
      </div>

      {/* Current correct answer */}
      <div className="text-sm">
        <span className="text-ink/50">Correct answer: </span>
        <span className="font-medium text-ink">{currentLabel ?? <em className="text-ink/30">Not set</em>}</span>
      </div>

      {/* Correct answer selector */}
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full rounded border border-ink/20 bg-sand px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-field/40"
        disabled={isPending}
      >
        <option value="">— Select {meta.usesPlayer ? "player" : "team"} —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {"name" in o ? o.name : (o as Team).name}
          </option>
        ))}
      </select>

      <button
        onClick={handleSetAnswer}
        disabled={!selectedId || isPending}
        className="rounded bg-field px-4 py-2 text-sm font-semibold text-white hover:bg-field/90 disabled:opacity-40 transition-colors"
      >
        {isPending ? "Saving…" : "Set Correct Answer & Award Points"}
      </button>

      {/* Lock toggle */}
      <button
        onClick={handleLock}
        disabled={isPending}
        className={`rounded border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
          setting.is_locked
            ? "border-field text-field hover:bg-field/10"
            : "border-clay text-clay hover:bg-clay/10"
        }`}
      >
        {isPending ? "…" : setting.is_locked ? "Unlock Predictions" : "Lock Predictions"}
      </button>

      {feedback && <p className="text-xs font-medium text-field">{feedback}</p>}
    </div>
  );
}

export default function AdminGlobalPredictionsClient({
  settings,
  teams,
  players,
}: {
  settings: Setting[];
  teams: Team[];
  players: Player[];
}) {
  const order = ["winner", "top_scorer", "assist_leader"];
  const sorted = order.map((t) => settings.find((s) => s.type === t)).filter(Boolean) as Setting[];

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {sorted.map((s) => (
        <GlobalCard key={s.type} setting={s} teams={teams} players={players} />
      ))}
    </div>
  );
}
