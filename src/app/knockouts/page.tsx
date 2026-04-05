import React from "react";
import KnockoutPredictionsClient, { KnockoutMatch } from "./knockout-predictions-client";

const H = 800;
const CW = 90;
const CH = 28;
const GAP = 16;

type Side = "left" | "right";

function Column({ items }: { items: string[] }) {
  const slotH = H / items.length;
  return (
    <div style={{ width: CW, height: H, flexShrink: 0 }} className="flex flex-col">
      {items.map((label, i) => (
        <div key={i} style={{ height: slotH }} className="flex items-center justify-center">
          <div
            style={{ width: CW, height: CH }}
            className="bg-gray-900 border-2 border-lime-400 rounded flex items-center justify-center text-lime-300 font-bold text-[10px] px-1 text-center"
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function Connector({ fromCount, side }: { fromCount: number; side: Side }) {
  const w = GAP + 8;
  const slotH = H / fromCount;
  const pairs = fromCount / 2;

  return (
    <svg width={w} height={H} style={{ flexShrink: 0, overflow: "visible" }}>
      {Array.from({ length: pairs }).map((_, i) => {
        const y1 = i * 2 * slotH + slotH / 2;
        const y2 = (i * 2 + 1) * slotH + slotH / 2;
        const yMid = (y1 + y2) / 2;
        const x0 = side === "left" ? 0 : w;
        const x1 = side === "left" ? w : 0;
        return (
          <g key={i} stroke="#a3e635" strokeWidth={2} fill="none">
            <line x1={x0} y1={y1} x2={x1} y2={y1} />
            <line x1={x1} y1={y1} x2={x1} y2={y2} />
            <line x1={x0} y1={y2} x2={x1} y2={y2} />
          </g>
        );
      })}
    </svg>
  );
}

import { createServerSupabaseClient } from "@/lib/supabase/server";

const ROUND_ORDER = ["r32", "r16", "qf", "sf", "final"];

interface KnockoutSlot {
  id: string;
  round: string;
  side: string;
  position: number;
  slot_label: string | null;
  home_team_id: string | null;
  winner_team_id: string | null;
  home_team: { name: string; flag_url: string | null } | null;
  away_team: { name: string; flag_url: string | null } | null;
  winner_team: { name: string } | null;
  home_score: number | null;
  away_score: number | null;
}

function buildRounds(slots: KnockoutSlot[], side: "left" | "right"): string[][] {
  return ROUND_ORDER.map((round) => {
    const roundSlots = slots
      .filter((s) => s.round === round && s.side === side)
      .sort((a, b) => a.position - b.position);
    return roundSlots.map((s) => {
      if (s.winner_team) return s.winner_team.name;
      if (s.home_team) return s.home_team.name;
      return s.slot_label || "";
    });
  });
}

export default async function KnockoutsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tournament } = await supabase
    .from("tournaments").select("id").eq("is_active", true).single();

  let leftRounds: string[][] = [];
  let rightRounds: string[][] = [];
  let matches: KnockoutMatch[] = [];
  let userPredictions: Record<string, { teamId: string; pointsAwarded: number }> = {};

  if (tournament) {
    const { data: slotsRaw } = await supabase
      .from("knockout_slots")
      .select(`
        id, round, side, position, slot_label, home_score, away_score,
        home_team_id, winner_team_id,
        home_team:teams!knockout_slots_home_team_id_fkey(name, flag_url),
        away_team:teams!knockout_slots_away_team_id_fkey(name, flag_url),
        winner_team:teams!knockout_slots_winner_team_id_fkey(name)
      `)
      .eq("tournament_id", tournament.id);

    const slots = (slotsRaw ?? []) as unknown as KnockoutSlot[];

    if (slots.length > 0) {
      leftRounds = buildRounds(slots, "left");
      rightRounds = buildRounds(slots, "right");

      // Build match pairs for predictions UI
      const PAIRABLE = ["r32", "r16", "qf", "sf"];
      for (const round of PAIRABLE) {
        for (const side of ["left", "right"]) {
          const roundSlots = slots
            .filter((s) => s.round === round && s.side === side)
            .sort((a, b) => a.position - b.position);
          for (let i = 0; i + 1 < roundSlots.length; i += 2) {
            const slotA = roundSlots[i];
            const slotB = roundSlots[i + 1];
            matches.push({
              slotAId: slotA.id,
              round,
              side,
              pairIndex: i / 2,
              teamA: slotA.home_team ? { id: slotA.home_team_id!, ...slotA.home_team } : null,
              teamALabel: slotA.slot_label ?? `Slot ${slotA.position + 1}`,
              teamB: slotB.home_team ? { id: slotB.home_team_id!, ...slotB.home_team } : null,
              teamBLabel: slotB.slot_label ?? `Slot ${slotB.position + 1}`,
              winnerTeamId: slotA.winner_team_id,
            });
          }
        }
      }

      // Final: left pos 0 vs right pos 0
      const leftFinal = slots.find((s) => s.round === "final" && s.side === "left" && s.position === 0);
      const rightFinal = slots.find((s) => s.round === "final" && s.side === "right" && s.position === 0);
      if (leftFinal && rightFinal) {
        matches.push({
          slotAId: leftFinal.id,
          round: "final",
          side: "center",
          pairIndex: 0,
          teamA: leftFinal.home_team ? { id: leftFinal.home_team_id!, ...leftFinal.home_team } : null,
          teamALabel: leftFinal.slot_label ?? "Left finalist",
          teamB: rightFinal.home_team ? { id: rightFinal.home_team_id!, ...rightFinal.home_team } : null,
          teamBLabel: rightFinal.slot_label ?? "Right finalist",
          winnerTeamId: leftFinal.winner_team_id,
        });
      }

      // Bronze: position 0 vs position 1
      const bronzeSlots = slots
        .filter((s) => s.round === "bronze")
        .sort((a, b) => a.position - b.position);
      if (bronzeSlots.length >= 2) {
        matches.push({
          slotAId: bronzeSlots[0].id,
          round: "bronze",
          side: "center",
          pairIndex: 0,
          teamA: bronzeSlots[0].home_team ? { id: bronzeSlots[0].home_team_id!, ...bronzeSlots[0].home_team } : null,
          teamALabel: bronzeSlots[0].slot_label ?? "Bronze team 1",
          teamB: bronzeSlots[1].home_team ? { id: bronzeSlots[1].home_team_id!, ...bronzeSlots[1].home_team } : null,
          teamBLabel: bronzeSlots[1].slot_label ?? "Bronze team 2",
          winnerTeamId: bronzeSlots[0].winner_team_id,
        });
      }

      // Fetch user predictions
      if (user && matches.length > 0) {
        const slotAIds = matches.map((m) => m.slotAId);
        const { data: preds } = await supabase
          .from("knockout_predictions")
          .select("slot_id, predicted_team_id, points_awarded")
          .eq("user_id", user.id)
          .in("slot_id", slotAIds);

        for (const p of preds ?? []) {
          if (p.predicted_team_id) {
            userPredictions[p.slot_id] = {
              teamId: p.predicted_team_id,
              pointsAwarded: p.points_awarded ?? 0,
            };
          }
        }
      }
    }
  }

  // Fallback to static labels if no DB data yet
  if (leftRounds.length === 0 || leftRounds[0].length === 0) {
    const leftR32 = [
      "1E","3 ABCDF","1I","3 CDFGH","2A","2B","1F","2C",
      "2K","2L","1H","2J","1D","3 BEFIJ","1G","3 AEHIJ",
    ];
    const rightR32 = [
      "1C","2F","2E","2I","1A","3 CEFHI","1L","3 EHIJK",
      "1J","2H","2D","2G","1B","3 EFGIJ","1K","3 DEIJL",
    ];
    leftRounds = [leftR32];
    rightRounds = [rightR32];
    for (let r = 1; r < 5; r++) {
      leftRounds.push(Array(leftRounds[r - 1].length / 2).fill(""));
      rightRounds.push(Array(rightRounds[r - 1].length / 2).fill(""));
    }
  }

  return (
    <div className="space-y-8">
      {/* Visual bracket */}
      <div className="min-h-[400px] bg-black flex flex-col items-center py-8 rounded-2xl">
        <h2 className="text-3xl font-extrabold text-white mb-6 tracking-widest">WORLD CHAMPIONS</h2>
        <div className="overflow-x-auto w-full">
          <div className="flex flex-row items-center px-4" style={{ minWidth: "max-content", margin: "0 auto" }}>

            {/* LEFT BRACKET: R32 on far left, Final closest to center */}
            {leftRounds.map((round, r) => (
              <React.Fragment key={r}>
                <Column items={round} />
                {r < leftRounds.length - 1 && (
                  <Connector fromCount={round.length} side="left" />
                )}
              </React.Fragment>
            ))}
            <svg width={24} height={H} style={{ flexShrink: 0 }}>
              <line x1={0} y1={H / 2} x2={24} y2={H / 2} stroke="#a3e635" strokeWidth={2} />
            </svg>

            {/* CENTER */}
            <div style={{ height: H, width: 140 }} className="flex flex-col items-center justify-center shrink-0 mx-4">
              <span className="text-6xl mb-2">🏆</span>
              <div className="text-lime-400 font-extrabold text-xs text-center mb-1 tracking-widest">FIFA WORLD CUP 2026</div>
              <div className="w-28 h-8 bg-lime-400 text-black font-bold flex items-center justify-center rounded mt-3 text-sm">WINNER</div>
              <div className="w-28 h-8 bg-lime-200 text-black font-semibold flex items-center justify-center rounded mt-2 text-xs">BRONZE WINNER</div>
            </div>

            <svg width={24} height={H} style={{ flexShrink: 0 }}>
              <line x1={0} y1={H / 2} x2={24} y2={H / 2} stroke="#a3e635" strokeWidth={2} />
            </svg>
            {/* RIGHT BRACKET */}
            {[...rightRounds].reverse().map((round, r, arr) => (
              <React.Fragment key={r}>
                <Column items={round} />
                {r < arr.length - 1 && (
                  <Connector fromCount={arr[r + 1].length} side="right" />
                )}
              </React.Fragment>
            ))}

          </div>
        </div>
      </div>

      {/* Predictions section */}
      {user ? (
        <KnockoutPredictionsClient matches={matches} userPredictions={userPredictions} />
      ) : (
        <div className="rounded-2xl border border-ink/10 bg-white p-6 text-center text-sm text-ink/50">
          <a href="/login" className="text-field hover:underline font-medium">Log in</a> to make knockout predictions.
        </div>
      )}
    </div>
  );
}
