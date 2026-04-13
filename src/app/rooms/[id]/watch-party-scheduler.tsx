"use client";

import { useState, useTransition } from "react";
import { saveWatchParty, toggleWatchPartyLock } from "./actions";

interface UpcomingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
}

interface Props {
  roomId: string;
  isOwner: boolean;
  matches: UpcomingMatch[];
  watchParty: { matchId: string; place: string; isLocked: boolean } | null;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

export default function WatchPartyScheduler({ roomId, isOwner, matches, watchParty }: Props) {
  const [selectedMatchId, setSelectedMatchId] = useState(watchParty?.matchId ?? "");
  const [place, setPlace] = useState(watchParty?.place ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);
  const isLocked = watchParty?.isLocked ?? false;
  const disabled = isLocked && !isOwner;

  function handleSave() {
    if (!selectedMatchId) { setError("Please select a match."); return; }
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await saveWatchParty(roomId, selectedMatchId, place);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  function handleLockToggle() {
    startTransition(async () => {
      const result = await toggleWatchPartyLock(roomId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Watch Party</h3>
        <div className="flex items-center gap-2">
          {isLocked && (
            <span className="text-xs font-medium text-clay bg-clay/10 px-2 py-0.5 rounded">
              🔒 Locked
            </span>
          )}
          {isOwner && watchParty && (
            <button
              onClick={handleLockToggle}
              disabled={isPending}
              className="text-xs text-ink/50 hover:text-ink underline disabled:opacity-50"
            >
              {isLocked ? "Unlock" : "Lock"}
            </button>
          )}
        </div>
      </div>

      {/* Match selector */}
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">Match</label>
        <select
          value={selectedMatchId}
          onChange={(e) => { setSelectedMatchId(e.target.value); setSaved(false); }}
          disabled={disabled || isPending}
          className="w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-field focus:outline-none disabled:opacity-50 bg-white"
        >
          <option value="">— Select a match —</option>
          {matches.map((m) => {
            const { date } = formatDateTime(m.startsAt);
            return (
              <option key={m.id} value={m.id}>
                {m.homeTeam} vs {m.awayTeam} · {date}
              </option>
            );
          })}
        </select>
      </div>

      {/* Auto-populated date/time */}
      {selectedMatch && (
        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-xs font-medium text-ink/50 mb-1">Date</p>
            <p className="text-sm font-medium">{formatDateTime(selectedMatch.startsAt).date}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-ink/50 mb-1">Kick-off</p>
            <p className="text-sm font-medium">{formatDateTime(selectedMatch.startsAt).time}</p>
          </div>
        </div>
      )}

      {/* Place input */}
      <div>
        <label className="block text-xs font-medium text-ink/50 mb-1">
          Where to watch <span className="text-ink/30">({30 - place.length} left)</span>
        </label>
        <input
          type="text"
          value={place}
          onChange={(e) => { setPlace(e.target.value.slice(0, 30)); setSaved(false); }}
          disabled={disabled || isPending}
          placeholder="e.g. John's place, The Crown pub"
          maxLength={30}
          className="w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-field focus:outline-none disabled:opacity-50"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {saved && <p className="text-xs text-green-600">Saved!</p>}

      {!disabled && (
        <button
          onClick={handleSave}
          disabled={isPending || !selectedMatchId}
          className="w-full rounded bg-field py-2 text-sm font-medium text-white hover:bg-field/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      )}
    </div>
  );
}
