"use client";

import { useState, useTransition } from "react";
import { saveKnockoutPrediction } from "./actions";

const ROUND_LABELS: Record<string, string> = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter Finals",
  sf: "Semi Finals",
  final: "Final",
  bronze: "Bronze",
};

const ROUND_PTS: Record<string, { exact: number; outcome: number }> = {
  r32: { exact: 3, outcome: 1 },
  r16: { exact: 6, outcome: 2 },
  qf: { exact: 9, outcome: 3 },
  sf: { exact: 12, outcome: 4 },
  final: { exact: 12, outcome: 4 },
  bronze: { exact: 12, outcome: 4 },
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
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId: string | null;
};

export type Prediction = { homeScore: number; awayScore: number; pointsAwarded: number };

const ROUND_ORDER = ["r32", "r16", "qf", "sf", "final", "bronze"];

function MatchCard({
  match,
  prediction,
}: {
  match: KnockoutMatch;
  prediction: Prediction | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [homeInput, setHomeInput] = useState<string>(
    prediction?.homeScore?.toString() ?? ""
  );
  const [awayInput, setAwayInput] = useState<string>(
    prediction?.awayScore?.toString() ?? ""
  );
  const [saved, setSaved] = useState(!!prediction);
  const [error, setError] = useState<string | null>(null);

  const decided = match.homeScore != null && match.awayScore != null;
  const locked = decided;
  const pts = ROUND_PTS[match.round];

  function handleSave() {
    const h = parseInt(homeInput, 10);
    const a = parseInt(awayInput, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0 || h > 99 || a > 99) {
      setError("Enter valid scores (0-99)");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveKnockoutPrediction(match.slotAId, h, a);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  const teamAName = match.teamA?.name ?? match.teamALabel;
  const teamBName = match.teamB?.name ?? match.teamBLabel;
  const teamAFlag = match.teamA?.flag_url;
  const teamBFlag = match.teamB?.flag_url;

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4 space-y-3">
      {/* Teams + score row */}
      <div className="flex items-center gap-2 text-sm">
        {/* Team A */}
        <div className="flex flex-1 items-center gap-2 justify-end min-w-0">
          <span className="font-medium truncate text-right">{teamAName}</span>
          {teamAFlag ? (
            <img src={teamAFlag} alt="" className="h-5 w-7 object-cover rounded-sm shrink-0" />
          ) : (
            <span className="h-5 w-7 rounded-sm bg-ink/10 shrink-0" />
          )}
        </div>

        {/* Score inputs or actual result */}
        <div className="flex items-center gap-1 shrink-0">
          {locked ? (
            <>
              <span className="w-8 text-center rounded bg-sand px-1 py-1 text-sm font-bold">
                {match.homeScore}
              </span>
              <span className="text-ink/40 font-bold">-</span>
              <span className="w-8 text-center rounded bg-sand px-1 py-1 text-sm font-bold">
                {match.awayScore}
              </span>
            </>
          ) : (
            <>
              <input
                type="number"
                min={0}
                max={99}
                value={homeInput}
                onChange={(e) => { setSaved(false); setHomeInput(e.target.value); }}
                className="w-10 rounded border border-ink/20 px-1 py-1 text-center text-sm font-bold focus:border-field focus:outline-none"
                placeholder="-"
              />
              <span className="text-ink/40 font-bold">-</span>
              <input
                type="number"
                min={0}
                max={99}
                value={awayInput}
                onChange={(e) => { setSaved(false); setAwayInput(e.target.value); }}
                className="w-10 rounded border border-ink/20 px-1 py-1 text-center text-sm font-bold focus:border-field focus:outline-none"
                placeholder="-"
              />
            </>
          )}
        </div>

        {/* Team B */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          {teamBFlag ? (
            <img src={teamBFlag} alt="" className="h-5 w-7 object-cover rounded-sm shrink-0" />
          ) : (
            <span className="h-5 w-7 rounded-sm bg-ink/10 shrink-0" />
          )}
          <span className="font-medium truncate">{teamBName}</span>
        </div>
      </div>

      {/* Your prediction vs result (if decided) */}
      {decided && prediction && (
        <div className="flex items-center justify-between text-xs rounded-lg bg-sand/50 px-3 py-2">
          <span className="text-ink/50">
            Your pick: <span className="font-semibold text-ink">{prediction.homeScore}-{prediction.awayScore}</span>
          </span>
          {prediction.pointsAwarded > 0 ? (
            <span className="font-bold text-field">+{prediction.pointsAwarded} pts</span>
          ) : (
            <span className="text-clay/80 font-medium">0 pts</span>
          )}
        </div>
      )}

      {decided && !prediction && (
        <p className="text-xs text-ink/30 text-center">No prediction made</p>
      )}

      {/* Save button (only when not locked) */}
      {!locked && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-field px-3 py-1.5 text-xs font-semibold text-white hover:bg-field/80 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Saving..." : saved ? "Saved" : "Save"}
          </button>
          {error && <span className="text-xs text-clay">{error}</span>}
          {!error && (
            <span className="text-xs text-ink/30">
              {pts.exact}pts exact / {pts.outcome}pt winner
            </span>
          )}
        </div>
      )}
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
        Predict the score of each match. Exact score earns max points; correct winner earns partial points.
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
            <span className="ml-1 opacity-60">({ROUND_PTS[r].exact}/{ROUND_PTS[r].outcome}pt)</span>
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
