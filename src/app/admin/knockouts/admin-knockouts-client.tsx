"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ROUNDS = ["r32", "r16", "qf", "sf", "final", "bronze"] as const;
const ROUND_LABELS: Record<string, string> = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter Finals",
  sf: "Semi Finals",
  final: "Final",
  bronze: "Bronze Match",
};

interface Team {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
}

interface Slot {
  id: string;
  round: string;
  side: string;
  position: number;
  slot_label: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: string | null;
  match_date: string | null;
}

export default function AdminKnockoutsClient({
  tournamentId,
  initialSlots,
  teams,
}: {
  tournamentId: string;
  initialSlots: Slot[];
  teams: Team[];
}) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function handleSave(slot: Slot) {
    setSaving(slot.id);
    setMessage("");
    const { error } = await supabase
      .from("knockout_slots")
      .upsert(
        {
          id: slot.id,
          tournament_id: tournamentId,
          round: slot.round,
          side: slot.side,
          position: slot.position,
          slot_label: slot.slot_label,
          home_team_id: slot.home_team_id || null,
          away_team_id: slot.away_team_id || null,
          home_score: slot.home_score ?? null,
          away_score: slot.away_score ?? null,
          winner_team_id: slot.winner_team_id || null,
          match_date: slot.match_date || null,
        },
        { onConflict: "id" }
      );
    setSaving(null);
    setMessage(error ? `Error: ${error.message}` : "Saved!");
    setTimeout(() => setMessage(""), 2000);
  }

  function updateSlot(id: string, field: keyof Slot, value: string | number | null) {
    setSlots((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }

  const grouped = ROUNDS.reduce((acc, round) => {
    acc[round] = slots.filter((s) => s.round === round);
    return acc;
  }, {} as Record<string, Slot[]>);

  return (
    <div className="space-y-10">
      {message && (
        <div className="p-2 bg-field/20 text-field rounded text-sm">{message}</div>
      )}
      {ROUNDS.map((round) => {
        const roundSlots = grouped[round] ?? [];
        if (roundSlots.length === 0) return null;
        return (
          <section key={round}>
            <h3 className="text-lg font-bold mb-4 text-field">{ROUND_LABELS[round]}</h3>
            <div className="space-y-4">
              {roundSlots.map((slot) => (
                <div key={slot.id} className="border border-ink/10 rounded-lg p-4 bg-white space-y-3">
                  <div className="flex items-center gap-2 text-sm text-ink/60">
                    <span className="font-medium">{slot.side === "left" ? "Left" : "Right"} — Slot {slot.position + 1}</span>
                    <span className="ml-auto text-xs bg-sand px-2 py-0.5 rounded">{slot.slot_label || "—"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Home team */}
                    <div>
                      <label className="text-xs text-ink/50 mb-1 block">Home Team</label>
                      <select
                        className="w-full rounded border border-ink/20 px-2 py-1 text-sm"
                        value={slot.home_team_id ?? ""}
                        onChange={(e) => updateSlot(slot.id, "home_team_id", e.target.value || null)}
                      >
                        <option value="">— Select team —</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* Away team */}
                    <div>
                      <label className="text-xs text-ink/50 mb-1 block">Away Team</label>
                      <select
                        className="w-full rounded border border-ink/20 px-2 py-1 text-sm"
                        value={slot.away_team_id ?? ""}
                        onChange={(e) => updateSlot(slot.id, "away_team_id", e.target.value || null)}
                      >
                        <option value="">— Select team —</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* Scores */}
                    <div>
                      <label className="text-xs text-ink/50 mb-1 block">Home Score</label>
                      <input
                        type="number" min={0} max={99}
                        className="w-full rounded border border-ink/20 px-2 py-1 text-sm"
                        value={slot.home_score ?? ""}
                        onChange={(e) => updateSlot(slot.id, "home_score", e.target.value === "" ? null : parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-ink/50 mb-1 block">Away Score</label>
                      <input
                        type="number" min={0} max={99}
                        className="w-full rounded border border-ink/20 px-2 py-1 text-sm"
                        value={slot.away_score ?? ""}
                        onChange={(e) => updateSlot(slot.id, "away_score", e.target.value === "" ? null : parseInt(e.target.value))}
                      />
                    </div>
                    {/* Winner */}
                    <div className="col-span-2">
                      <label className="text-xs text-ink/50 mb-1 block">Winner (advances)</label>
                      <select
                        className="w-full rounded border border-ink/20 px-2 py-1 text-sm"
                        value={slot.winner_team_id ?? ""}
                        onChange={(e) => updateSlot(slot.id, "winner_team_id", e.target.value || null)}
                      >
                        <option value="">— Not decided —</option>
                        {[slot.home_team_id, slot.away_team_id]
                          .filter(Boolean)
                          .map((tid) => {
                            const t = teams.find((x) => x.id === tid);
                            return t ? <option key={t.id} value={t.id}>{t.name}</option> : null;
                          })}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSave(slot)}
                    disabled={saving === slot.id}
                    className="mt-1 rounded bg-field px-3 py-1 text-xs font-medium text-white hover:bg-field/90 disabled:opacity-50"
                  >
                    {saving === slot.id ? "Saving…" : "Save"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
