"use client";

import { useState } from "react";

export interface ActivityEntry {
  id: string;
  type: "peek" | "snipe";
  username: string;
  displayName: string | null;
  targetUsername?: string;
  targetDisplayName?: string | null;
  matchLabel: string;
  timestamp: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const INITIAL_COUNT = 5;

export default function RoomActivityLog({ entries }: { entries: ActivityEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, INITIAL_COUNT);

  return (
    <div className="rounded-lg border border-ink/10 bg-white px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">📋 Activity Log</h3>
        {!expanded && entries.length > INITIAL_COUNT && (
          <button onClick={() => setExpanded(true)} className="text-xs text-field hover:underline">
            +{entries.length - INITIAL_COUNT} more
          </button>
        )}
        {expanded && (
          <button onClick={() => setExpanded(false)} className="text-xs text-ink/40 hover:underline">
            Show less
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-ink/30">No activity yet. Peek or snipe a match to see it here.</p>
      ) : (
        <div className={`flex flex-col divide-y divide-ink/5 overflow-y-auto transition-all ${expanded ? "max-h-[600px]" : ""}`}>
          {visible.map((e) => {
            const actor = e.displayName || e.username;
            const target = e.targetDisplayName || e.targetUsername;
            return (
              <div key={e.id} className="flex items-start gap-2.5 py-2">
                <span className="text-base leading-none shrink-0 mt-0.5">
                  {e.type === "peek" ? "👁️" : "🎯"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink leading-snug">
                    <span className="font-semibold">{actor}</span>
                    {e.type === "peek"
                      ? <> peeked at <span className="font-medium">{e.matchLabel}</span></>
                      : <> sniped <span className="font-medium">{target}</span> · <span className="font-medium">{e.matchLabel}</span></>
                    }
                  </p>
                  <p className="text-[10px] text-ink/30 mt-0.5">{formatTime(e.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
