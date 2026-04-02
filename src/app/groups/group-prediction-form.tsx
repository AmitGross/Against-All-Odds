"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Team {
  id: string;
  name: string;
  flag_url: string | null;
}

interface GroupPredictionFormProps {
  tournamentId: string;
  groupName: string;
  teams: Team[];
  isLocked: boolean;
  isLoggedIn: boolean;
  existingPrediction: {
    first_place_team_id: string;
    second_place_team_id: string;
  } | null;
}

export default function GroupPredictionForm({
  tournamentId,
  groupName,
  teams,
  isLocked,
  isLoggedIn,
  existingPrediction,
}: GroupPredictionFormProps) {
  const [first, setFirst] = useState(existingPrediction?.first_place_team_id ?? "");
  const [second, setSecond] = useState(existingPrediction?.second_place_team_id ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existingPrediction);
  const [error, setError] = useState("");

  if (!isLoggedIn) {
    return (
      <div className="px-4 py-3 border-t border-ink/10 text-xs text-ink/40">
        Log in to predict the group winner
      </div>
    );
  }

  if (isLocked) {
    if (existingPrediction) {
      const t1 = teams.find((t) => t.id === existingPrediction.first_place_team_id);
      const t2 = teams.find((t) => t.id === existingPrediction.second_place_team_id);
      return (
        <div className="px-4 py-3 border-t border-ink/10 bg-ink/5 flex items-center gap-3 text-sm">
          <span className="text-ink/40 text-xs">Your picks (locked):</span>
          {t1 && (
            <span className="flex items-center gap-1 font-medium">
              <span className="text-xs text-field">1st</span>
              {t1.flag_url && <img src={t1.flag_url} alt="" className="w-5 h-3.5 rounded-sm object-cover" />}
              {t1.name}
            </span>
          )}
          {t2 && (
            <>
              <span className="text-ink/30">·</span>
              <span className="flex items-center gap-1 font-medium">
                <span className="text-xs text-ink/50">2nd</span>
                {t2.flag_url && <img src={t2.flag_url} alt="" className="w-5 h-3.5 rounded-sm object-cover" />}
                {t2.name}
              </span>
            </>
          )}
          <span className="ml-auto text-xs text-clay">🔒 Locked</span>
        </div>
      );
    }
    return (
      <div className="px-4 py-3 border-t border-ink/10 text-xs text-clay">
        🔒 Predictions locked for this group
      </div>
    );
  }

  async function handleSave() {
    setError("");
    if (!first || !second) {
      setError("Pick both 1st and 2nd place.");
      return;
    }
    if (first === second) {
      setError("1st and 2nd must be different teams.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not logged in."); setSaving(false); return; }

    const { error: err } = await supabase.from("group_predictions").upsert(
      {
        user_id: user.id,
        tournament_id: tournamentId,
        group_name: groupName,
        first_place_team_id: first,
        second_place_team_id: second,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tournament_id,group_name" }
    );

    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
  }

  return (
    <div className="px-4 py-3 border-t border-ink/10 space-y-2">
      <p className="text-xs font-medium text-ink/60">Your group prediction</p>
      <div className="flex flex-wrap items-end gap-3">
        {/* 1st place */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-field font-medium">1st Place</label>
          <select
            className="rounded border border-ink/20 px-2 py-1 text-sm bg-white min-w-[140px]"
            value={first}
            onChange={(e) => { setFirst(e.target.value); setSaved(false); }}
          >
            <option value="">— Pick team —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.id === second}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2nd place */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink/50 font-medium">2nd Place</label>
          <select
            className="rounded border border-ink/20 px-2 py-1 text-sm bg-white min-w-[140px]"
            value={second}
            onChange={(e) => { setSecond(e.target.value); setSaved(false); }}
          >
            <option value="">— Pick team —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.id === first}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`rounded px-4 py-1.5 text-sm font-semibold text-white transition-colors
            ${saved ? "bg-field" : "bg-field/80 hover:bg-field"}
            disabled:opacity-50`}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
