"use client";

import { useState, useTransition } from "react";
import { saveWatchPartySlots, toggleSlotLock } from "./actions";

const MAX_SLOTS = 8;

interface UpcomingMatch {
  id: string;
  type: "match" | "knockout";
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  label: string;
}

interface WatchSlot {
  slot: number;
  matchId: string | null;
  knockoutSlotId: string | null;
  place: string;
  isLocked: boolean;
}

interface Props {
  roomId: string;
  isOwner: boolean;
  matches: UpcomingMatch[];
  savedSlots: WatchSlot[];
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function WatchPartyScheduler({ roomId, isOwner, matches, savedSlots }: Props) {
  const [slots, setSlots] = useState<WatchSlot[]>(() =>
    Array.from({ length: MAX_SLOTS }, (_, i) => {
      const saved = savedSlots.find((s) => s.slot === i + 1);
      return saved ?? { slot: i + 1, matchId: null, knockoutSlotId: null, place: "", isLocked: false };
    })
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Encode picker value as "match:id" or "knockout:id"
  function encodeValue(m: UpcomingMatch) { return `${m.type}:${m.id}`; }
  function getSlotValue(slot: WatchSlot) {
    if (slot.matchId) return `match:${slot.matchId}`;
    if (slot.knockoutSlotId) return `knockout:${slot.knockoutSlotId}`;
    return "";
  }

  function updateSlot(index: number, field: "selection" | "place", value: string) {
    setSaved(false);
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        if (field === "place") return { ...s, place: value.slice(0, 30) };
        // parse selection
        if (!value) return { ...s, matchId: null, knockoutSlotId: null };
        const [type, id] = value.split(":");
        return {
          ...s,
          matchId: type === "match" ? id : null,
          knockoutSlotId: type === "knockout" ? id : null,
        };
      })
    );
  }

  function handleSave() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await saveWatchPartySlots(roomId, slots.map((s) => ({
        slot: s.slot,
        matchId: s.matchId,
        knockoutSlotId: s.knockoutSlotId,
        place: s.place,
      })));
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  }

  function handleSlotLockToggle(slotNum: number) {
    startTransition(async () => {
      const result = await toggleSlotLock(roomId, slotNum);
      if (result?.error) { setError(result.error); return; }
      setSlots((prev) =>
        prev.map((s) => s.slot === slotNum ? { ...s, isLocked: !s.isLocked } : s)
      );
    });
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Watch Party Schedule</h3>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink/10">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/5 text-left text-xs text-ink/50 uppercase">
              <th className="w-6 px-3 py-2">#</th>
              <th className="px-3 py-2">Match</th>
              <th className="px-3 py-2 w-24">Date</th>
              <th className="px-3 py-2 w-20">Time</th>
              <th className="px-3 py-2">Where to watch</th>
              {isOwner && <th className="px-3 py-2 w-16 text-center">Lock</th>}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, i) => {
              const picked = matches.find((m) =>
                slot.matchId ? m.type === "match" && m.id === slot.matchId
                : slot.knockoutSlotId ? m.type === "knockout" && m.id === slot.knockoutSlotId
                : false
              );
              const { date, time } = picked ? formatDateTime(picked.startsAt) : { date: "—", time: "—" };
              const rowLocked = slot.isLocked;
              const rowDisabled = rowLocked && !isOwner;
              return (
                <tr key={slot.slot} className={`border-b border-ink/5 last:border-0 ${rowLocked ? "bg-ink/3" : ""}`}>
                  <td className="px-3 py-1.5 text-ink/40 text-xs">
                    {rowLocked ? "🔒" : slot.slot}
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      value={getSlotValue(slot)}
                      onChange={(e) => updateSlot(i, "selection", e.target.value)}
                      disabled={rowDisabled || isPending}
                      className="w-full rounded border border-ink/20 px-2 py-1 text-xs focus:border-field focus:outline-none disabled:opacity-50 bg-white"
                    >
                      <option value="">— Select —</option>
                      {matches.map((m) => (
                        <option key={m.id} value={encodeValue(m)}>
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
                      disabled={rowDisabled || isPending}
                      placeholder="e.g. John's place"
                      maxLength={30}
                      className="w-full rounded border border-ink/20 px-2 py-1 text-xs focus:border-field focus:outline-none disabled:opacity-50"
                    />
                  </td>
                  {isOwner && (
                    <td className="px-3 py-1.5 text-center">
                      <button
                        onClick={() => handleSlotLockToggle(slot.slot)}
                        disabled={isPending}
                        title={rowLocked ? "Unlock this slot" : "Lock this slot"}
                        className="text-xs text-ink/40 hover:text-ink disabled:opacity-30"
                      >
                        {rowLocked ? "🔓" : "🔒"}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded bg-field px-4 py-1.5 text-sm font-medium text-white hover:bg-field/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {saved && <p className="text-xs text-green-600">Saved!</p>}
      </div>
    </div>
  );
}
