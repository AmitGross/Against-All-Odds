"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PredictionFormProps {
  matchId: string;
  homeTeamName: string;
  homeCode: string;
  awayTeamName: string;
  awayCode: string;
  startsAt: string;
  status: string;
  homeScore90: number | null;
  awayScore90: number | null;
  existingPrediction: {
    id: string;
    predicted_home_score_90: number;
    predicted_away_score_90: number;
  } | null;
  locked: boolean;
}

export default function PredictionForm({
  matchId,
  homeTeamName,
  homeCode,
  awayTeamName,
  awayCode,
  startsAt,
  status,
  homeScore90,
  awayScore90,
  existingPrediction,
  locked,
}: PredictionFormProps) {
  const [homeScore, setHomeScore] = useState<string>(
    existingPrediction?.predicted_home_score_90?.toString() ?? ""
  );
  const [awayScore, setAwayScore] = useState<string>(
    existingPrediction?.predicted_away_score_90?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existingPrediction);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0 || h > 99 || a > 99) {
      setError("Enter valid scores (0–99).");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not logged in.");
      setSaving(false);
      return;
    }

    const { error: err } = await supabase.from("predictions").upsert(
      {
        user_id: user.id,
        match_id: matchId,
        predicted_home_score_90: h,
        predicted_away_score_90: a,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,match_id" }
    );

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
  }

  const centerElement =
    status === "finished" ? (
      <span className="mx-2 rounded bg-ink px-3 py-1 text-sm font-bold text-sand">
        {homeScore90} – {awayScore90}
      </span>
    ) : (
      <span className="mx-2 rounded bg-sand px-3 py-1 text-xs text-ink/60">
        {new Date(startsAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
          hour12: false,
        })}{" "}
        UTC
      </span>
    );

  if (locked) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-sm">
        <span className="w-36 text-right font-medium">{homeTeamName}</span>
        {existingPrediction ? (
          <span className="mx-1 rounded bg-field/10 px-2 py-0.5 text-xs font-semibold text-field">
            {existingPrediction.predicted_home_score_90}
          </span>
        ) : (
          <span className="w-7" />
        )}
        {centerElement}
        {existingPrediction ? (
          <span className="mx-1 rounded bg-field/10 px-2 py-0.5 text-xs font-semibold text-field">
            {existingPrediction.predicted_away_score_90}
          </span>
        ) : (
          <span className="w-7" />
        )}
        <span className="w-36 font-medium">{awayTeamName}</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 items-center justify-center gap-2 text-sm"
    >
      <span className="w-36 text-right font-medium">{homeTeamName}</span>
      <input
        type="number"
        min={0}
        max={99}
        value={homeScore}
        onChange={(e) => {
          setHomeScore(e.target.value);
          setSaved(false);
        }}
        placeholder="–"
        className="w-10 rounded border border-ink/20 px-1 py-0.5 text-center text-xs font-semibold focus:border-field focus:outline-none"
        aria-label={`${homeCode} score prediction`}
      />
      {centerElement}
      <input
        type="number"
        min={0}
        max={99}
        value={awayScore}
        onChange={(e) => {
          setAwayScore(e.target.value);
          setSaved(false);
        }}
        placeholder="–"
        className="w-10 rounded border border-ink/20 px-1 py-0.5 text-center text-xs font-semibold focus:border-field focus:outline-none"
        aria-label={`${awayCode} score prediction`}
      />
      <span className="w-36 font-medium">{awayTeamName}</span>
      <button
        type="submit"
        disabled={saving || saved}
        className={`ml-2 rounded px-2 py-0.5 text-xs font-medium transition ${
          saved
            ? "bg-red-200 text-red-700"
            : "bg-red-600 text-white hover:bg-red-700"
        } disabled:opacity-50`}
      >
        {saving ? "…" : saved ? "✓" : "Save"}
      </button>
      {error && <span className="ml-1 text-xs text-red-600">{error}</span>}
    </form>
  );
}
