"use client";

import { useState, useTransition } from "react";
import { usePeekToken, useSnipeToken } from "./actions";

interface Prediction {
  userId: string;
  username: string;
  displayName: string | null;
  home: number | null;
  away: number | null;
}

interface TelepathyMatch {
  matchId: string;
  label: string;
  roundLabel: string | null;
  homeName: string;
  awayName: string;
  startsAt: string;
  homeScore: number | null;
  awayScore: number | null;
  homeFlagUrl: string | null;
  awayFlagUrl: string | null;
  isLocked: boolean;
  predictions: Prediction[];
}

interface Props {
  matches: TelepathyMatch[];
  roomId: string;
  currentUserId: string;
  peekGranted: number;
  peekUsed: number;
  peekedMatchIds: Set<string>;
  snipeGranted: number;
  snipeUsed: number;
  // key: `${matchId}::${targetUserId}`
  snipedTargetKeys: Set<string>;
}

export default function TelepathyViewer({ matches, roomId, currentUserId, peekGranted, peekUsed, peekedMatchIds, snipeGranted, snipeUsed, snipedTargetKeys }: Props) {
  const defaultIndex = Math.max(0, matches.findIndex((m) => !m.isLocked));
  const [index, setIndex] = useState(defaultIndex);
  const [localPeeked, setLocalPeeked] = useState<Set<string>>(new Set(peekedMatchIds));
  const [localUsed, setLocalUsed] = useState(peekUsed);
  const [pending, startTransition] = useTransition();
  const [peekError, setPeekError] = useState<string | null>(null);

  // Snipe state
  const [localSniped, setLocalSniped] = useState<Set<string>>(new Set(snipedTargetKeys));
  const [localSnipeUsed, setLocalSnipeUsed] = useState(snipeUsed);
  const [snipePending, startSnipeTransition] = useTransition();
  const [snipeError, setSnipeError] = useState<string | null>(null);

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-4 flex flex-col items-center justify-center h-full min-h-[200px]">
        <p className="text-sm text-ink/40 text-center">No locked or finished matches yet.</p>
      </div>
    );
  }

  const match = matches[index];
  const isPeeked = localPeeked.has(match.matchId);
  const peeksRemaining = peekGranted - localUsed;
  const snipesRemaining = snipeGranted - localSnipeUsed;
  const isGroupMatch = !match.matchId.startsWith("ko:");
  const canPeek = !match.isLocked && !isPeeked && peeksRemaining > 0 && isGroupMatch;
  const showScores = match.isLocked || isPeeked;

  function snipeKey(matchId: string, targetUserId: string) {
    return `${matchId}::${targetUserId}`;
  }

  function handlePeek() {
    setPeekError(null);
    startTransition(async () => {
      const isKo = match.matchId.startsWith("ko:");
      const target = isKo
        ? { knockoutSlotId: match.matchId.replace("ko:", "") }
        : { matchId: match.matchId };

      const result = await usePeekToken(roomId, target);
      if (result.error) {
        setPeekError(result.error);
      } else {
        setLocalPeeked((prev) => new Set([...prev, match.matchId]));
        setLocalUsed((u) => u + 1);
      }
    });
  }

  function handleSnipe(targetUserId: string) {
    setSnipeError(null);
    startSnipeTransition(async () => {
      const isKo = match.matchId.startsWith("ko:");
      const target = isKo
        ? { knockoutSlotId: match.matchId.replace("ko:", "") }
        : { matchId: match.matchId };

      const result = await useSnipeToken(roomId, targetUserId, target);
      if (result.error) {
        setSnipeError(result.error);
      } else {
        setLocalSniped((prev) => new Set([...prev, snipeKey(match.matchId, targetUserId)]));
        setLocalSnipeUsed((u) => u + 1);
      }
    });
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="text-ink/40 hover:text-ink disabled:opacity-20 text-lg px-1"
        >
          ◄
        </button>
        <div className="text-center flex-1 min-w-0">
          {match.roundLabel && (
            <p className={`text-xs mb-0.5 ${match.isLocked ? "text-ink/40" : "text-amber-500 font-medium"}`}>
              {match.roundLabel}
            </p>
          )}
          <div className="flex items-center justify-center gap-1.5">
            {match.homeFlagUrl && (
              <img src={match.homeFlagUrl} alt="" className="w-5 h-3.5 rounded-sm border border-ink/10 shrink-0" />
            )}
            <span className="text-sm font-semibold leading-tight">{match.homeName}</span>
            <span className="text-xs text-ink/40">vs</span>
            <span className="text-sm font-semibold leading-tight">{match.awayName}</span>
            {match.awayFlagUrl && (
              <img src={match.awayFlagUrl} alt="" className="w-5 h-3.5 rounded-sm border border-ink/10 shrink-0" />
            )}
          </div>
          {!match.isLocked ? (
            <p className="text-xs text-ink/40 mt-0.5">
              Kicks off {new Date(match.startsAt).toLocaleDateString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          ) : match.homeScore !== null && match.awayScore !== null ? (
            <p className="text-xs text-ink/40 mt-0.5">
              Result: {match.homeScore} - {match.awayScore}
            </p>
          ) : null}
        </div>
        <button
          onClick={() => setIndex((i) => Math.min(matches.length - 1, i + 1))}
          disabled={index === matches.length - 1}
          className="text-ink/40 hover:text-ink disabled:opacity-20 text-lg px-1"
        >
          ►
        </button>
      </div>
      <p className="text-center text-xs text-ink/30">{index + 1} / {matches.length}</p>

      {/* Peek button or status for upcoming matches */}
      {!match.isLocked && (
        <div className="flex flex-col items-center gap-1">
          {isPeeked ? (
            <p className="text-xs text-amber-600 font-medium">Peeked - all predictions revealed</p>
          ) : canPeek ? (
            <button
              onClick={handlePeek}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {pending ? "Using peek..." : `👁️ Peek all (${peeksRemaining} left)`}
            </button>
          ) : peekGranted === 0 ? null : (
            <p className="text-xs text-ink/30">No peeks remaining ({peekGranted} used).</p>
          )}
          {peekError && <p className="text-xs text-red-500">{peekError}</p>}
          {snipeError && <p className="text-xs text-red-500">{snipeError}</p>}
        </div>
      )}

      {/* Token counters */}
      {!match.isLocked && !isPeeked && (peekGranted > 0 || snipeGranted > 0) && (
        <div className="flex items-center justify-center gap-4 text-xs text-ink/40">
          {peekGranted > 0 && <span>👁️ {peeksRemaining} peek{peeksRemaining !== 1 ? "s" : ""} left</span>}
          {snipeGranted > 0 && <span>🎯 {snipesRemaining} snipe{snipesRemaining !== 1 ? "s" : ""} left</span>}
        </div>
      )}

      {/* Predictions table */}
      <div className="overflow-y-auto max-h-[300px] rounded-lg border border-ink/10">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-ink/10 bg-ink/5 text-xs text-ink/50 uppercase">
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-center">Pred.</th>
              {!match.isLocked && !isPeeked && snipeGranted > 0 && (
                <th className="px-3 py-2 text-center w-16">Snipe</th>
              )}
            </tr>
          </thead>
          <tbody>
            {match.predictions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-xs text-ink/40">
                  No predictions submitted.
                </td>
              </tr>
            ) : (
              match.predictions.map((p) => {
                const isSelf = p.userId === currentUserId;
                const isSniped = localSniped.has(snipeKey(match.matchId, p.userId));
                const showThisScore = showScores || isSniped;
                const canSnipeThis = !match.isLocked && !isPeeked && !isSelf && !isSniped && snipesRemaining > 0;
                return (
                  <tr key={p.userId} className="border-b border-ink/5 last:border-0">
                    <td className="px-3 py-2 text-sm">{p.displayName || p.username}</td>
                    <td className="px-3 py-2 text-center font-mono font-medium">
                      {showThisScore
                        ? p.home !== null && p.away !== null
                          ? `${p.home} - ${p.away}`
                          : <span className="text-ink/30">-</span>
                        : <span className="text-ink/40">?</span>
                      }
                    </td>
                    {!match.isLocked && !isPeeked && snipeGranted > 0 && (
                      <td className="px-3 py-2 text-center">
                        {isSelf ? null : isSniped ? (
                          <span className="text-xs text-rose-400">🎯</span>
                        ) : canSnipeThis ? (
                          <button
                            onClick={() => handleSnipe(p.userId)}
                            disabled={snipePending}
                            className="rounded px-2 py-0.5 text-xs font-medium bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 transition-colors"
                            title={`Snipe ${p.displayName || p.username}'s prediction`}
                          >
                            🎯
                          </button>
                        ) : (
                          <span className="text-xs text-ink/20">🎯</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}