"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

// Parse "1A" -> ["A"],  "3 ABCDF" -> ["A","B","C","D","F"]
function groupsFromLabel(label: string | null): string[] | null {
  if (!label) return null;
  const single = label.match(/^\d([A-Z])$/);
  if (single) return [single[1]];
  const multi = label.match(/^3 ([A-Z]+)$/);
  if (multi) return multi[1].split("");
  return null;
}

function teamsForLabel(
  label: string | null,
  teams: Team[],
  teamGroups: Record<string, string>
): Team[] {
  const groups = groupsFromLabel(label);
  if (!groups) return teams;
  return teams.filter((t) => {
    const g = teamGroups[t.id];
    return g && groups.includes(g);
  });
}

type MatchSection = {
  key: string;
  label: string;
  pairs: [Slot, Slot][];
};

export default function AdminKnockoutsClient({
  tournamentId,
  initialSlots,
  teams,
  teamGroups,
}: {
  tournamentId: string;
  initialSlots: Slot[];
  teams: Team[];
  teamGroups: Record<string, string>;
}) {
  const [slotMap, setSlotMap] = useState<Record<string, Slot>>(
    Object.fromEntries(initialSlots.map((s) => [s.id, s]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const sections = useMemo<MatchSection[]>(() => {
    const result: MatchSection[] = [];

    const pairableRounds = ["r32", "r16", "qf", "sf"] as const;
    for (const round of pairableRounds) {
      for (const side of ["left", "right"] as const) {
        const sideSlots = initialSlots
          .filter((s) => s.round === round && s.side === side)
          .sort((a, b) => a.position - b.position);
        const pairs: [Slot, Slot][] = [];
        for (let i = 0; i + 1 < sideSlots.length; i += 2) {
          pairs.push([sideSlots[i], sideSlots[i + 1]]);
        }
        if (pairs.length > 0) {
          result.push({
            key: `${round}-${side}`,
            label: `${ROUND_LABELS[round]} -- ${side === "left" ? "Left" : "Right"} bracket`,
            pairs,
          });
        }
      }
    }

    const finalLeft = initialSlots.find(
      (s) => s.round === "final" && s.side === "left" && s.position === 0
    );
    const finalRight = initialSlots.find(
      (s) => s.round === "final" && s.side === "right" && s.position === 0
    );
    if (finalLeft && finalRight) {
      result.push({ key: "final", label: "Final", pairs: [[finalLeft, finalRight]] });
    }

    const bronzeSlots = initialSlots
      .filter((s) => s.round === "bronze")
      .sort((a, b) => a.position - b.position);
    const bronzePairs: [Slot, Slot][] = [];
    for (let i = 0; i + 1 < bronzeSlots.length; i += 2) {
      bronzePairs.push([bronzeSlots[i], bronzeSlots[i + 1]]);
    }
    if (bronzePairs.length > 0) {
      result.push({ key: "bronze", label: "Bronze Match", pairs: bronzePairs });
    }

    return result;
  }, [initialSlots]);

  function updateSlot(id: string, field: keyof Slot, value: string | number | null) {
    setSlotMap((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleSavePair(slotAId: string, slotBId: string) {
    const pairKey = `${slotAId}-${slotBId}`;
    setSaving(pairKey);
    setMessage("");
    const slotA = slotMap[slotAId];
    const slotB = slotMap[slotBId];

    const [resA, resB] = await Promise.all([
      supabase.from("knockout_slots").upsert(
        {
          id: slotA.id,
          tournament_id: tournamentId,
          round: slotA.round,
          side: slotA.side,
          position: slotA.position,
          slot_label: slotA.slot_label,
          home_team_id: slotA.home_team_id || null,
          away_team_id: null,
          home_score: slotA.home_score ?? null,
          away_score: slotA.away_score ?? null,
          winner_team_id: slotA.winner_team_id || null,
        },
        { onConflict: "id" }
      ),
      supabase.from("knockout_slots").upsert(
        {
          id: slotB.id,
          tournament_id: tournamentId,
          round: slotB.round,
          side: slotB.side,
          position: slotB.position,
          slot_label: slotB.slot_label,
          home_team_id: slotB.home_team_id || null,
          away_team_id: null,
        },
        { onConflict: "id" }
      ),
    ]);

    setSaving(null);
    const err = resA.error || resB.error;
    setMessage(err ? `Error: ${err.message}` : "Saved!");
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <div className="space-y-10">
      {message && (
        <div className="p-2 bg-field/20 text-field rounded text-sm">{message}</div>
      )}

      {sections.map((section) => (
        <section key={section.key}>
          <h3 className="text-lg font-bold mb-4 text-field">{section.label}</h3>
          <div className="space-y-4">
            {section.pairs.map(([rawA, rawB]) => {
              const slotA = slotMap[rawA.id];
              const slotB = slotMap[rawB.id];
              if (!slotA || !slotB) return null;

              const pairKey = `${slotA.id}-${slotB.id}`;
              const labelA = slotA.slot_label || `Slot ${slotA.position + 1}`;
              const labelB = slotB.slot_label || `Slot ${slotB.position + 1}`;
              const teamAOptions = teamsForLabel(slotA.slot_label, teams, teamGroups);
              const teamBOptions = teamsForLabel(slotB.slot_label, teams, teamGroups);
              const teamA = teams.find((t) => t.id === slotA.home_team_id);
              const teamB = teams.find((t) => t.id === slotB.home_team_id);
              const winnerOptions = [teamA, teamB].filter(Boolean) as Team[];

              return (
                <div
                  key={pairKey}
                  className="border border-ink/10 rounded-lg p-4 bg-white space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="bg-sand px-2 py-0.5 rounded text-xs">{labelA}</span>
                    <span className="text-ink/40 text-xs">vs</span>
                    <span className="bg-sand px-2 py-0.5 rounded text-xs">{labelB}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-ink/50 mb-1 block">Team ({labelA})</label>
                      <select
                        className="w-full rounded border border-ink/20 px-2 py-1 text-sm"
                        value={slotA.home_team_id ?? ""}
                        onChange={(e) => updateSlot(slotA.id, "home_team_id", e.target.value || null)}
                      >
                        <option value="">-- Select --</option>
                        {teamAOptions.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-ink/50 mb-1 block">Team ({labelB})</label>
                      <select
                        className="w-full rounded border border-ink/20 px-2 py-1 text-sm"
                        value={slotB.home_team_id ?? ""}
                        onChange={(e) => updateSlot(slotB.id, "home_team_id", e.target.value || null)}
                      >
                        <option value="">-- Select --</option>
                        {teamBOptions.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-ink/50 mb-1 block">Score ({labelA})</label>
                      <input
                        type="number" min={0} max={99}
                        className="w-full rounded border border-ink/20 px-2 py-1 text-sm"
                        value={slotA.home_score ?? ""}
                        onChange={(e) => updateSlot(slotA.id, "home_score", e.target.value === "" ? null : parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-ink/50 mb-1 block">Score ({labelB})</label>
                      <input
                        type="number" min={0} max={99}
                        className="w-full rounded border border-ink/20 px-2 py-1 text-sm"
                        value={slotA.away_score ?? ""}
                        onChange={(e) => updateSlot(slotA.id, "away_score", e.target.value === "" ? null : parseInt(e.target.value))}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs text-ink/50 mb-1 block">Winner (advances)</label>
                      <select
                        className="w-full rounded border border-ink/20 px-2 py-1 text-sm"
                        value={slotA.winner_team_id ?? ""}
                        onChange={(e) => updateSlot(slotA.id, "winner_team_id", e.target.value || null)}
                      >
                        <option value="">-- Not decided --</option>
                        {winnerOptions.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSavePair(slotA.id, slotB.id)}
                    disabled={saving === pairKey}
                    className="mt-1 rounded bg-field px-3 py-1 text-xs font-medium text-white hover:bg-field/90 disabled:opacity-50"
                  >
                    {saving === pairKey ? "Saving..." : "Save"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
