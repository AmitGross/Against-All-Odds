"use client";

import { useEffect, useState } from "react";

interface MatchInfo {
  id: string;
  starts_at: string;
  home_team: { name: string; flag_url: string | null };
  away_team: { name: string; flag_url: string | null };
}

function formatMatchDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

function useCountdown(targetIso: string) {
  const [diff, setDiff] = useState<number | null>(null);

  useEffect(() => {
    setDiff(new Date(targetIso).getTime() - Date.now());
    const timer = setInterval(() => {
      setDiff(new Date(targetIso).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetIso]);

  if (diff === null || diff <= 0) return null; // not yet hydrated or match started

  const totalSecs = Math.floor(diff / 1000);
  const totalHours = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  return `${totalHours}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function MatchCountdown({ match }: { match: MatchInfo }) {
  const countdown = useCountdown(match.starts_at);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Flags row */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Home flag */}
        {match.home_team.flag_url ? (
          <img
            src={match.home_team.flag_url}
            alt={match.home_team.name}
            title={match.home_team.name}
            className="w-8 h-5 rounded-sm object-cover border border-white/20 shrink-0"
          />
        ) : (
          <span className="text-xs font-medium text-white/80">{match.home_team.name}</span>
        )}

        <span className="text-white/40 text-xs font-bold">vs</span>

        {/* Away flag */}
        {match.away_team.flag_url ? (
          <img
            src={match.away_team.flag_url}
            alt={match.away_team.name}
            title={match.away_team.name}
            className="w-8 h-5 rounded-sm object-cover border border-white/20 shrink-0"
          />
        ) : (
          <span className="text-xs font-medium text-white/80">{match.away_team.name}</span>
        )}
      </div>

      {/* Countdown */}
      <span className="font-mono text-sm font-bold text-field tabular-nums">
        {countdown ?? <span className="text-clay">LIVE</span>}
      </span>

      {/* Match date/time */}
      <span className="text-white/40 text-xs">{formatMatchDateTime(match.starts_at)}</span>
    </div>
  );
}

export default function NextMatchBanner({ matches }: { matches: MatchInfo[] }) {
  if (matches.length === 0) return null;

  return (
    <div className="bg-ink text-white px-4 py-2 flex items-center gap-2 flex-wrap justify-center text-sm border-b border-white/10">
      <span className="text-white/40 text-xs uppercase tracking-wider shrink-0">Next up</span>
      <div className="flex items-center gap-4 flex-wrap justify-center">
        {matches.map((m) => (
          <MatchCountdown key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}
