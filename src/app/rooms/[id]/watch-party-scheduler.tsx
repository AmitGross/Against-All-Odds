"use client";

import { useState, useTransition } from "react";
import { saveWatchPartySlots, toggleWatchPartyLock } from "./actions";

const MAX_SLOTS = 8;

interface UpcomingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  label: string;
}

interface WatchSlot {
  slot: number;
  matchId: string | null;
  place: string;
}

interface Props {
  roomId: string;
  isOwner: boolean;
  matches: UpcomingMatch[];
  savedSlots: WatchSlot[];
  isLocked: boolean;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function WatchPartyScheduler({ roomId, isOwner, matches, savedSlots, isLocked }: Props) {
  const [slots, setSlots] = useState<WatchSlot[]>(() =>
    Array.from({ length: MAX_SLOTS }, (_, i) => {
      const saved = savedSlots.find((s) => s.slot === i + 1);
      return saved ?? { slot: i + 1, matchId: null, place: "" };
    })
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const disabled = isLocked && !isOwner;

  function updateSlot(index: number, field: "matchId" | "place", value: string) {
    setSaved(false);
    setSlots((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, [field]: field === "matchId" ? value || null : value.slice(0, 30) } : s
      )
    );
  }

  function handleSave() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await saveWatchPartySlots(roomId, slots);
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  }

  function handleLockToggle() {
    startTransition(async () => {
      const result = await toggleWatchPartyLock(roomId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Watch Party Schedule</h3>
        <div className="flex items-center gap-3">
          {isLocked && (
            <span className="text-xs font-medium text-clay bg-clay/10 px-2 py-0.5 rounded">
              🔒 Locked
            </span>
          )}
          {isOwner && (
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

      <div className="overflow-x-auto rounded-lg border border-ink/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/5 text-left text-xs text-ink/50 uppercase">
              <th className="w-6 px-3 py-2">#</th>
              <th className="px-3 py-2">Match</th>
              <th className="px-3 py-2 w-24">Date</th>
              <th className="px-3 py-2 w-20">Time</th>
              <th className="px-3 py-2">Where to watch</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, i) => {
              const match = matches.find((m) => m.id === slot.matchId);
              const { date, time } = match ? formatDateTime(match.startsAt) : { date: "—", time: "—" };
              return (
                <tr key={slot.slot} className="border-b border-ink/5 last:border-0">
                  <td className="px-3 py-1.5 text-ink/40 text-xs">{slot.slot}</td>
                  <td className="px-3 py-1.5">
                    <select
                      value={slot.matchId ?? ""}
                      onChange={(e) => updateSlot(i, "matchId", e.target.value)}
                      disabled={disabled || isPending}
                      className="w-full rounded border border-ink/20 px-2 py-1 text-xs focus:border-field focus:outline-none disabled:opacity-50 bg-white"
                    >
                      <option value="">— Select —</option>
                      {matches.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5 text-xs text-ink/60 whitespace-nowrap">{date}</td>
                  <td className="px-3 py-1.5 text-xs text-ink/60 whitespace-nowrap">{time}</td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={slot.place}
                      onChange={(e) => updateSlot(i, "place", e.target.value)}
                      disabled={disabled || isPending}
                      placeholder="e.g. John's place"
                      maxLength={30}
                      className="w-full rounded border border-ink/20 px-2 py-1 text-xs focus:border-field focus:outline-none disabled:opacity-50"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        {!disabled && (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded bg-field px-4 py-1.5 text-sm font-medium text-white hover:bg-field/90 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
        {saved && <p className="text-xs text-green-600">Saved!</p>}
      </div>
    </div>
  );
}
