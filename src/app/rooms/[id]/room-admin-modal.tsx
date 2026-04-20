"use client";

import { useState, useTransition } from "react";
import { setAllPeekTokens, setAllSnipeTokens, toggleRulesLock, resetAllTokenUsed, approveQuestion, rejectQuestion, setQuestionCorrectAnswer } from "./actions";

interface Member {
  userId: string;
}

export interface AdminQuestion {
  id: string;
  matchId: string;
  matchLabel: string;       // "Team A vs Team B"
  submitterName: string;
  questionText: string;
  optionA: string;
  optionB: string;
  correctAnswer: "a" | "b" | null;
  status: "pending" | "approved" | "rejected";
  points: number;
  isMatchLocked: boolean;   // true when match is locked/finished
  approvedCountForMatch: number;
}

interface Props {
  roomId: string;
  members: Member[];
  peeksPerPlayer: number;
  snipesPerPlayer: number;
  rulesLocked: boolean;
  tournamentStarted: boolean;
  allQuestions: AdminQuestion[];
}

export default function RoomAdminModal({ roomId, members, peeksPerPlayer, snipesPerPlayer, rulesLocked, tournamentStarted, allQuestions }: Props) {
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(rulesLocked);
  const [peekCount, setPeekCount] = useState(peeksPerPlayer);
  const [snipeCount, setSnipeCount] = useState(snipesPerPlayer);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [snipeSaveError, setSnipeSaveError] = useState<string | null>(null);
  const [snipeSaveSuccess, setSnipeSaveSuccess] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [saveTransition, startSave] = useTransition();
  const [snipeSaveTransition, startSnipeSave] = useTransition();
  const [lockTransition, startLock] = useTransition();
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetTransition, startReset] = useTransition();

  // Local optimistic state for questions
  const [questions, setQuestions] = useState<AdminQuestion[]>(allQuestions);
  const [qLoading, setQLoading] = useState<Record<string, boolean>>({});
  const [qError, setQError] = useState<Record<string, string>>({});
  // Points per question (admin sets before approving)
  const [qPoints, setQPoints] = useState<Record<string, number>>(
    () => Object.fromEntries(allQuestions.map((q) => [q.id, q.points ?? 1]))
  );
  // Correct answer per question (admin marks post-match)
  const [qCorrect, setQCorrect] = useState<Record<string, "a" | "b" | null>>(
    () => Object.fromEntries(allQuestions.map((q) => [q.id, q.correctAnswer]))
  );
  const [qCorrectLoading, setQCorrectLoading] = useState<Record<string, boolean>>({});
  const [qCorrectError, setQCorrectError] = useState<Record<string, string>>({});
  const [qCorrectFeedback, setQCorrectFeedback] = useState<Record<string, number>>({});

  const [activeTab, setActiveTab] = useState<"tokens" | "questions">("tokens");

  const pendingCount = questions.filter((q) => q.status === "pending").length;

  const isFullyLocked = locked || tournamentStarted;

  function handleSave() {
    setSaveError(null); setSaveSuccess(false);
    startSave(async () => {
      const entries = members.map((m) => ({ userId: m.userId, granted: peekCount }));
      const result = await setAllPeekTokens(roomId, entries);
      if (result.error) setSaveError(result.error); else setSaveSuccess(true);
    });
  }

  function handleSnipeSave() {
    setSnipeSaveError(null); setSnipeSaveSuccess(false);
    startSnipeSave(async () => {
      const entries = members.map((m) => ({ userId: m.userId, granted: snipeCount }));
      const result = await setAllSnipeTokens(roomId, entries);
      if (result.error) setSnipeSaveError(result.error); else setSnipeSaveSuccess(true);
    });
  }

  function handleReset() {
    setResetError(null); setResetSuccess(false);
    startReset(async () => {
      const result = await resetAllTokenUsed(roomId);
      if (result.error) setResetError(result.error); else setResetSuccess(true);
    });
  }

  function handleToggleLock() {
    setLockError(null);
    startLock(async () => {
      const result = await toggleRulesLock(roomId);
      if (result.error) setLockError(result.error);
      else setLocked(result.locked ?? !locked);
    });
  }

  async function handleApprove(qId: string) {
    setQLoading((p) => ({ ...p, [qId]: true }));
    setQError((p) => ({ ...p, [qId]: "" }));
    const pts = qPoints[qId] ?? 1;
    const result = await approveQuestion(roomId, qId, pts);
    setQLoading((p) => ({ ...p, [qId]: false }));
    if (result.error) {
      setQError((p) => ({ ...p, [qId]: result.error! }));
    } else {
      setQuestions((prev) => {
        const q = prev.find((x) => x.id === qId);
        if (!q) return prev;
        const newApprovedCount = q.approvedCountForMatch + 1;
        return prev.map((x) =>
          x.id === qId
            ? { ...x, status: "approved" as const, points: pts, approvedCountForMatch: newApprovedCount }
            : x.matchId === q.matchId && x.id !== qId
            ? { ...x, approvedCountForMatch: newApprovedCount }
            : x
        );
      });
    }
  }

  async function handleMarkCorrect(qId: string, answer: "a" | "b") {
    setQCorrectLoading((p) => ({ ...p, [qId]: true }));
    setQCorrectError((p) => ({ ...p, [qId]: "" }));
    const result = await setQuestionCorrectAnswer(roomId, qId, answer);
    setQCorrectLoading((p) => ({ ...p, [qId]: false }));
    if (result.error) {
      setQCorrectError((p) => ({ ...p, [qId]: result.error! }));
    } else {
      setQCorrect((p) => ({ ...p, [qId]: answer }));
      setQCorrectFeedback((p) => ({ ...p, [qId]: result.winnersCount ?? 0 }));
    }
  }

  async function handleReject(qId: string) {
    setQLoading((p) => ({ ...p, [qId]: true }));
    setQError((p) => ({ ...p, [qId]: "" }));
    const result = await rejectQuestion(roomId, qId);
    setQLoading((p) => ({ ...p, [qId]: false }));
    if (result.error) {
      setQError((p) => ({ ...p, [qId]: result.error! }));
    } else {
      setQuestions((prev) =>
        prev.map((x) => (x.id === qId ? { ...x, status: "rejected" as const } : x))
      );
    }
  }

  // Group questions by match for display
  const questionsByMatch = new Map<string, { label: string; items: AdminQuestion[] }>();
  for (const q of questions) {
    if (!questionsByMatch.has(q.matchId)) {
      questionsByMatch.set(q.matchId, { label: q.matchLabel, items: [] });
    }
    questionsByMatch.get(q.matchId)!.items.push(q);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink/5 transition-colors"
      >
        ⚙️ Room Admin
        {pendingCount > 0 && (
          <span className="rounded-full bg-clay text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center">
            {pendingCount}
          </span>
        )}
      </button>

      {!open ? null : (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg rounded-xl border border-ink/10 bg-white shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 shrink-0">
              <h2 className="text-lg font-semibold">⚙️ Room Admin</h2>
              <button onClick={() => setOpen(false)} className="text-ink/40 hover:text-ink text-xl leading-none" aria-label="Close">×</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-ink/10 shrink-0">
              <button
                onClick={() => setActiveTab("tokens")}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === "tokens" ? "border-b-2 border-field text-field" : "text-ink/50 hover:text-ink"}`}
              >
                Tokens & Rules
              </button>
              <button
                onClick={() => setActiveTab("questions")}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${activeTab === "questions" ? "border-b-2 border-field text-field" : "text-ink/50 hover:text-ink"}`}
              >
                Questions
                {pendingCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-clay text-white text-[9px] font-bold px-1.5 py-0.5 inline-block">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="overflow-y-auto flex-1 px-5 py-4">

              {activeTab === "tokens" && (
                <div className="space-y-5">
                  {/* Lock panel */}
                  <div className="rounded-lg border border-ink/10 bg-ink/5 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Rules lock</p>
                        <p className="text-xs text-ink/50 mt-0.5">
                          {tournamentStarted
                            ? "🔒 Permanently locked — tournament already started."
                            : locked
                              ? "Locked manually. Unlock to make changes."
                              : "Unlocked — changes to rules allowed."}
                        </p>
                      </div>
                      {!tournamentStarted && (
                        <button
                          onClick={handleToggleLock}
                          disabled={lockTransition}
                          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${locked ? "bg-field text-white hover:bg-field/90" : "bg-clay text-white hover:bg-clay/90"} disabled:opacity-50`}
                        >
                          {lockTransition ? "..." : locked ? "Unlock" : "Lock"}
                        </button>
                      )}
                    </div>
                    {lockError && <p className="text-xs text-red-500">{lockError}</p>}
                  </div>

                  {/* Peek tokens */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">👁️ Peek Tokens per player</p>
                      <p className="text-xs text-ink/50 mt-0.5">Reveals ALL players&apos; predictions for one match before kick-off.{isFullyLocked && " (Locked — read only.)"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="number" min={0} value={peekCount}
                        onChange={(e) => { setPeekCount(Math.max(0, parseInt(e.target.value, 10) || 0)); setSaveSuccess(false); setSaveError(null); }}
                        disabled={isFullyLocked}
                        className="w-20 rounded-lg border border-ink/20 px-3 py-2 text-center text-sm disabled:bg-ink/5 disabled:text-ink/40 focus:outline-none focus:ring-1 focus:ring-field"
                      />
                      <span className="text-xs text-ink/50">peeks per player</span>
                    </div>
                    {!isFullyLocked && (
                      <div className="flex items-center justify-between">
                        <div>{saveError && <p className="text-xs text-red-500">{saveError}</p>}{saveSuccess && <p className="text-xs text-field font-medium">Saved!</p>}</div>
                        <button onClick={handleSave} disabled={saveTransition} className="rounded-lg bg-field px-4 py-1.5 text-sm font-medium text-white hover:bg-field/90 disabled:opacity-50 transition-colors">
                          {saveTransition ? "Saving..." : "Save"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Snipe tokens */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">🎯 Snipe Tokens per player</p>
                      <p className="text-xs text-ink/50 mt-0.5">Reveals ONE chosen player&apos;s prediction for one match before kick-off.{isFullyLocked && " (Locked — read only.)"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="number" min={0} value={snipeCount}
                        onChange={(e) => { setSnipeCount(Math.max(0, parseInt(e.target.value, 10) || 0)); setSnipeSaveSuccess(false); setSnipeSaveError(null); }}
                        disabled={isFullyLocked}
                        className="w-20 rounded-lg border border-ink/20 px-3 py-2 text-center text-sm disabled:bg-ink/5 disabled:text-ink/40 focus:outline-none focus:ring-1 focus:ring-field"
                      />
                      <span className="text-xs text-ink/50">snipes per player</span>
                    </div>
                    {!isFullyLocked && (
                      <div className="flex items-center justify-between">
                        <div>{snipeSaveError && <p className="text-xs text-red-500">{snipeSaveError}</p>}{snipeSaveSuccess && <p className="text-xs text-field font-medium">Saved!</p>}</div>
                        <button onClick={handleSnipeSave} disabled={snipeSaveTransition} className="rounded-lg bg-field px-4 py-1.5 text-sm font-medium text-white hover:bg-field/90 disabled:opacity-50 transition-colors">
                          {snipeSaveTransition ? "Saving..." : "Save"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reset used counts */}
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
                    <p className="text-sm font-medium text-red-700">🔄 Reset token usage</p>
                    <p className="text-xs text-red-500">Resets all peek &amp; snipe used counts to 0 for every player. Reveals already made stay visible.</p>
                    <div className="flex items-center justify-between">
                      <div>{resetError && <p className="text-xs text-red-500">{resetError}</p>}{resetSuccess && <p className="text-xs text-green-600 font-medium">Reset done!</p>}</div>
                      <button onClick={handleReset} disabled={resetTransition} className="rounded-lg bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                        {resetTransition ? "Resetting..." : "Reset Used"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "questions" && (
                <div className="space-y-4">
                  {questionsByMatch.size === 0 ? (
                    <p className="text-sm text-ink/40 py-4 text-center">No questions submitted yet.</p>
                  ) : (
                    [...questionsByMatch.entries()].map(([matchId, { label, items }]) => {
                      const approvedCount = items.filter((q) => q.status === "approved").length;
                      return (
                        <div key={matchId} className="rounded-lg border border-ink/10 p-3 space-y-2">
                          {/* Match header */}
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold">{label}</p>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${approvedCount >= 2 ? "bg-field/10 text-field" : "bg-ink/5 text-ink/40"}`}>
                              {approvedCount}/2 approved
                            </span>
                          </div>

                          {/* Questions */}
                          <div className="space-y-2">
                            {items.map((q) => {
                              const isLoading = qLoading[q.id] ?? false;
                              const err = qError[q.id] ?? "";
                              const canApprove = q.status === "pending" && approvedCount < 2;
                              return (
                                <div
                                  key={q.id}
                                  className={`rounded border px-3 py-2 space-y-1.5 text-xs ${
                                    q.status === "approved"
                                      ? "border-field/30 bg-field/5"
                                      : q.status === "rejected"
                                      ? "border-ink/10 bg-ink/[0.02] opacity-60"
                                      : "border-ink/15 bg-white"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 space-y-0.5">
                                      <p className="font-medium leading-snug">{q.questionText}</p>
                                      <div className="flex gap-2 text-ink/50">
                                        <span className={`rounded px-1.5 py-0.5 ${
                                          q.correctAnswer === "a" ? "bg-field/15 text-field font-semibold" : "bg-ink/5"
                                        }`}>A: {q.optionA}{q.correctAnswer === "a" ? " ✓" : ""}</span>
                                        <span className={`rounded px-1.5 py-0.5 ${
                                          q.correctAnswer === "b" ? "bg-field/15 text-field font-semibold" : "bg-ink/5"
                                        }`}>B: {q.optionB}{q.correctAnswer === "b" ? " ✓" : ""}</span>
                                      </div>
                                      <p className="text-[10px] text-ink/30">by {q.submitterName}</p>
                                      {q.status === "approved" && (
                                        <p className="text-[10px] text-field/70 font-medium">{q.points} pt{q.points !== 1 ? "s" : ""}</p>
                                      )}
                                    </div>
                                    {/* Status badge */}
                                    <span className={`shrink-0 text-[10px] font-medium ${
                                      q.status === "approved" ? "text-green-600" :
                                      q.status === "rejected" ? "text-red-400" :
                                      "text-ink/40"
                                    }`}>
                                      {q.status === "approved" ? "✓ Approved" : q.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                                    </span>
                                  </div>

                                  {/* Mark correct answer — available any time after approval */}
                                  {q.status === "approved" && (
                                    <div className="pt-1 border-t border-ink/8 space-y-1">
                                      {qCorrect[q.id] ? (
                                        <div className="space-y-1">
                                          <p className="text-[10px] text-green-600 font-medium">
                                            ✓ Correct: {qCorrect[q.id]!.toUpperCase()} — {qCorrect[q.id] === "a" ? q.optionA : q.optionB}
                                            <span className="ml-1.5 text-ink/30">
                                              ({q.points}pt{q.points !== 1 ? "s" : ""} awarded to {qCorrectFeedback[q.id] ?? "?"} player{(qCorrectFeedback[q.id] ?? 0) !== 1 ? "s" : ""})
                                            </span>
                                          </p>
                                          <div className="flex gap-1.5">
                                            {(["a", "b"] as const).filter((o) => o !== qCorrect[q.id]).map((opt) => (
                                              <button
                                                key={opt}
                                                onClick={() => handleMarkCorrect(q.id, opt)}
                                                disabled={qCorrectLoading[q.id]}
                                                className="text-[10px] text-ink/30 hover:text-red-400 transition-colors disabled:opacity-40"
                                              >
                                                Change to {opt.toUpperCase()}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="text-[10px] text-ink/40">Mark correct:</span>
                                          {(["a", "b"] as const).map((opt) => (
                                            <button
                                              key={opt}
                                              onClick={() => handleMarkCorrect(q.id, opt)}
                                              disabled={qCorrectLoading[q.id]}
                                              className="rounded border border-field/30 text-field text-[10px] font-semibold px-2.5 py-0.5 hover:bg-field/10 disabled:opacity-40 transition-colors"
                                            >
                                              {qCorrectLoading[q.id] ? "..." : `${opt.toUpperCase()}: ${opt === "a" ? q.optionA : q.optionB}`}
                                            </button>
                                          ))}
                                          {qCorrectError[q.id] && (
                                            <span className="text-[10px] text-red-500">{qCorrectError[q.id]}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {q.status === "pending" && (
                                    <div className="flex flex-wrap gap-1.5 items-center pt-0.5">
                                      <div className="flex items-center gap-1">
                                        <label className="text-[10px] text-ink/40">Pts:</label>
                                        <input
                                          type="number"
                                          min={1}
                                          max={100}
                                          value={qPoints[q.id] ?? 1}
                                          onChange={(e) => setQPoints((p) => ({ ...p, [q.id]: Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1)) }))}
                                          className="w-12 rounded border border-ink/20 px-1.5 py-0.5 text-[10px] text-center focus:outline-none focus:border-field/60"
                                        />
                                      </div>
                                      <button
                                        onClick={() => handleApprove(q.id)}
                                        disabled={isLoading || !canApprove}
                                        title={!canApprove && approvedCount >= 2 ? "2 questions already approved for this match" : undefined}
                                        className="rounded bg-field text-white text-[10px] font-medium px-2.5 py-1 hover:bg-field/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                      >
                                        {isLoading ? "..." : "Approve"}
                                      </button>
                                      <button
                                        onClick={() => handleReject(q.id)}
                                        disabled={isLoading}
                                        className="rounded border border-red-200 text-red-500 text-[10px] font-medium px-2.5 py-1 hover:bg-red-50 disabled:opacity-40 transition-colors"
                                      >
                                        {isLoading ? "..." : "Reject"}
                                      </button>
                                      {err && <span className="text-[10px] text-red-500">{err}</span>}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
