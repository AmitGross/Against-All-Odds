"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminGroupLocksClient({
  tournamentId,
  groupNames,
  initialLockMap,
}: {
  tournamentId: string;
  groupNames: string[];
  initialLockMap: Record<string, boolean>;
}) {
  const [lockMap, setLockMap] = useState<Record<string, boolean>>(initialLockMap);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function toggleLock(groupName: string) {
    const newVal = !lockMap[groupName];
    setSaving(groupName);
    setMessage("");

    const { error } = await supabase.from("group_locks").upsert(
      {
        tournament_id: tournamentId,
        group_name: groupName,
        is_locked: newVal,
      },
      { onConflict: "tournament_id,group_name" }
    );

    setSaving(null);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setLockMap((prev) => ({ ...prev, [groupName]: newVal }));
      setMessage(`Group ${groupName} ${newVal ? "locked" : "unlocked"}.`);
      setTimeout(() => setMessage(""), 2000);
    }
  }

  async function lockAll() {
    setSaving("all");
    setMessage("");
    const rows = groupNames.map((g) => ({
      tournament_id: tournamentId,
      group_name: g,
      is_locked: true,
    }));
    const { error } = await supabase
      .from("group_locks")
      .upsert(rows, { onConflict: "tournament_id,group_name" });
    setSaving(null);
    if (error) { setMessage(`Error: ${error.message}`); return; }
    const newMap = { ...lockMap };
    for (const g of groupNames) newMap[g] = true;
    setLockMap(newMap);
    setMessage("All groups locked.");
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="p-2 bg-field/20 text-field rounded text-sm">{message}</div>
      )}

      <div className="flex gap-2">
        <button
          onClick={lockAll}
          disabled={saving === "all"}
          className="rounded bg-clay/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-clay disabled:opacity-50"
        >
          {saving === "all" ? "Locking…" : "Lock All Groups"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {groupNames.map((g) => {
          const locked = !!lockMap[g];
          return (
            <div
              key={g}
              className={`flex items-center justify-between rounded-lg border px-4 py-3
                ${locked ? "border-clay/30 bg-clay/5" : "border-ink/10 bg-white"}`}
            >
              <span className="font-bold text-sm">Group {g}</span>
              <button
                onClick={() => toggleLock(g)}
                disabled={saving === g}
                className={`rounded px-3 py-1 text-xs font-semibold transition-colors
                  ${locked
                    ? "bg-clay/10 text-clay hover:bg-clay/20"
                    : "bg-field/10 text-field hover:bg-field/20"
                  } disabled:opacity-50`}
              >
                {saving === g ? "…" : locked ? "🔒 Unlock" : "🔓 Lock"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
