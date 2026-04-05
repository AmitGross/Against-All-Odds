"use client";

import { useState, useTransition, useOptimistic } from "react";
import { saveKnockoutPrediction } from "./actions";

const ROUND_LABELS: Record<string, string> = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter Finals",
  sf: "Semi Finals",
  final: "Final",
  bronze: "Bronze",
};

const ROUND_PTS: Record<string, number> = {
  r32: 1, r16: 2, qf: 3, sf: 4, final: 4, bronze: 4,
};

export type KnockoutMatch = {
  slotAId: string;
  round: string;
  side: string;
  pairIndex: number;
  teamA: { id: string; name: string; flag_url: string | null } | null;
  teamALabel: string;
  teamB: { id: string; name: string; flag_url: string | null } | null;
  teamBLabel: string;
  winnerTeamId: string | null;
};

type Prediction = { teamId: string; pointsAwarded: number };

const ROUND_ORDER = ["r32", "r16", "qf", "sf", "final", "bronze"];

function MatchCard({
  match,
  prediction,
}: {
  match: KnockoutMatch;
  prediction: Prediction | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticPick, setOptimisticPick] = useState<string | null>(
    prediction?.teamId ?? null
  );
  const [error, setError] = useState<string | null>(null);

  const decided = !!match.winnerTeamId;
  const pts = ROUND_PTS[match.round] ?? 0;

  function pickTeam(teamId: string) {
    if (decided || isPending) return;
    setOptimisticPick(teamId);
    setError(null);
    startTransition(async () => {
      const result = await saveKnockoutPrediction(match.slotAId, teamId);
      if (result.error) {
        setError(result.error);
        setOptimisticPick(prediction?.teamId ?? null);
      }
    });
  }

  function TeamButton({
    team,
    label,
  }: {
    team: { id: string; name: string; flag_url: string | null } | null;
    label: string;
  }) {
    const teamId = team?.id;
    const isPicked = optimisticPick === teamId;
    const isWinner = decided && match.winnerTeamId === teamId;
    const isLoser = decided && match.winnerTeamId !== teamId;
    const userCorrect = isWinner && isPicked;
    const userWrong = isLoser && isPicked;
    const hasTeam = !!team;

    let cls =
      "flex-1 flex flex-col items-center gap-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all ";

    if (!hasTeam) {
      cls += "border-ink/10 bg-ink/5 text-ink/30 cursor-not-allowed";
    } else if (userCorrect) {
      cls += "border-field bg-field/10 text-field cursor-default";
    } else if (userWrong) {
      cls += "border-clay/30 bg-clay/5 text-ink/40 cursor-default";
    } else if (isLoser && !isPicked) {
      cls += "border-ink/10 bg-ink/5 text-ink/30 cursor-default";
    } else if (isPicked) {
      cls += "border-field bg-field/10 text-field";
    } else if (decided) {
      cls += "border-ink/10 text-ink/50 cursor-default";
    } else {
      cls += "border-ink/20 hover:border-field hover:bg-field/5 cursor-pointer";
    }

    return (
      <button
        className={cls}
        onClick={() => teamId && pickTeam(teamId)}
        disabled={!hasTeam || decided || isPending}
        title={!hasTeam ? label : undefined}
      >
        {team?.flag_url && (
          <img src={team.flag_url} alt="" className="h-6 w-9 object-cover rounded-sm" />
        )}
        <span className="text-center leading-tight">
          {team?.name ?? <span className="italic text-ink/30">{label}</span>}
        </span>
        {userCorrect && <span className="text-xs font-bold text-field">+{pts} pts ✓</span>}
        {userWrong && <span className="text-xs text-clay/70">Wrong pick</span>}
        {isWinner && !isPicked && <span className="text-xs text-field/70">Winner</span>}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex gap-3 items-stretch">
        <TeamButton team={match.teamA} label={match.teamALabel} />
        <div className="flex items-center text-xs text-ink/30 font-medium shrink-0">vs</div>
        <TeamButton team={match.teamB} label={match.teamBLabel} />
      </div>
      {!decided && !match.teamA && !match.teamB && (
        <p className="mt-2 text-xs text-ink/30 text-center">Teams TBD after group stage</p>
      )}
      {!decided && (match.teamA || match.teamB) && !optimisticPick && (
        <p className="mt-2 text-xs text-ink/40 text-center">Click a team to predict the winner</p>
      )}
      {error && <p className="mt-2 text-xs text-clay text-center">{error}</p>}
      {isPending && <p className="mt-2 text-xs text-ink/30 text-center">Saving…</p>}
    </div>
  );
}

export default function KnockoutPredictionsClient({
  matches,
  userPredictions,
}: {
  matches: KnockoutMatch[];
  userPredictions: Record<string, Prediction>;
}) {
  const rounds = ROUND_ORDER.filter((r) => matches.some((m) => m.round === r));
  const [activeRound, setActiveRound] = useState(rounds[0] ?? "r32");

  const roundMatches = matches.filter((m) => m.round === activeRound);

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/40">
        My Knockout Predictions
      </h3>
      <p className="mb-4 text-xs text-ink/50">
        Pick the winner of each match. Correct picks earn {" "}
        <span className="font-semibold text-clay">1–4 pts</span> depending on the round.
      </p>

      {/* Round tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {rounds.map((r) => (
          <button
            key={r}
            onClick={() => setActiveRound(r)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              activeRound === r
                ? "bg-field text-white"
                : "bg-ink/5 text-ink/60 hover:bg-ink/10"
            }`}
          >
            {ROUND_LABELS[r]}
            <span className="ml-1 opacity-60">({ROUND_PTS[r]}pt)</span>
          </button>
        ))}
      </div>

      {/* Match cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {roundMatches.map((match) => (
          <MatchCard
            key={match.slotAId}
            match={match}
            prediction={userPredictions[match.slotAId] ?? null}
          />
        ))}
      </div>

      {roundMatches.length === 0 && (
        <p className="text-sm text-ink/40 text-center py-6">No matches in this round yet.</p>
      )}
    </div>
  );
}
