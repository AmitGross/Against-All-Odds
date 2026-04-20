"use client";

import { useState } from "react";
import { submitMatchQuestion, withdrawMatchQuestion } from "./actions";

export interface QuestionMatch {
  id: string;
  homeName: string;
  awayName: string;
  homeFlagUrl: string | null;
  awayFlagUrl: string | null;
  startsAt: string | null;
}

export interface ExistingQuestion {
  id: string;
  matchId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  status: "pending" | "approved" | "rejected";
}

interface Props {
  roomId: string;
  matches: QuestionMatch[];
  existingQuestions: ExistingQuestion[];
  pendingCount: number;
}

function formatMatchDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
    " UTC"
  );
}

export default function MatchQuestionForm({ roomId, matches, existingQuestions, pendingCount }: Props) {
  const existingByMatch = new Map(existingQuestions.map((q) => [q.matchId, q]));

  // Per-match form state
  const [forms, setForms] = useState<Record<string, { question: string; optionA: string; optionB: string }>>(
    () => Object.fromEntries(matches.map((m) => [m.id, { question: "", optionA: "", optionB: "" }]))
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});

  function setField(matchId: string, field: "question" | "optionA" | "optionB", value: string) {
    setForms((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [field]: value } }));
  }

  async function handleSubmit(matchId: string) {
    const f = forms[matchId];
    if (!f) return;
    setLoading((p) => ({ ...p, [matchId]: true }));
    setErrors((p) => ({ ...p, [matchId]: "" }));
    setSuccess((p) => ({ ...p, [matchId]: false }));

    const result = await submitMatchQuestion(roomId, matchId, f.question, f.optionA, f.optionB);

    setLoading((p) => ({ ...p, [matchId]: false }));
    if (result.error) {
      setErrors((p) => ({ ...p, [matchId]: result.error! }));
    } else {
      setSuccess((p) => ({ ...p, [matchId]: true }));
      setForms((p) => ({ ...p, [matchId]: { question: "", optionA: "", optionB: "" } }));
    }
  }

  async function handleWithdraw(matchId: string, questionId: string) {
    setLoading((p) => ({ ...p, [matchId]: true }));
    const result = await withdrawMatchQuestion(roomId, questionId);
    setLoading((p) => ({ ...p, [matchId]: false }));
    if (result.error) {
      setErrors((p) => ({ ...p, [matchId]: result.error! }));
    }
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">💬 Match Questions</h3>
        <span className="text-[10px] text-ink/40">{pendingCount}/10 pending</span>
      </div>

      {matches.length === 0 ? (
        <p className="text-xs text-ink/30">No upcoming matches to submit questions for.</p>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[540px] pr-0.5">
          {matches.map((m) => {
            const existing = existingByMatch.get(m.id);
            const isLoading = loading[m.id] ?? false;
            const error = errors[m.id] ?? "";
            const didSucceed = success[m.id] ?? false;

            return (
              <div key={m.id} className="rounded-md border border-ink/10 bg-ink/[0.02] p-3 space-y-2">
                {/* Match header */}
                <div className="flex items-center gap-1.5">
                  {m.homeFlagUrl && (
                    <img src={m.homeFlagUrl} alt={m.homeName} className="w-5 h-[13px] object-cover rounded-[2px]" />
                  )}
                  <span className="text-xs font-semibold truncate">{m.homeName}</span>
                  <span className="text-[10px] text-ink/30">vs</span>
                  <span className="text-xs font-semibold truncate">{m.awayName}</span>
                  {m.awayFlagUrl && (
                    <img src={m.awayFlagUrl} alt={m.awayName} className="w-5 h-[13px] object-cover rounded-[2px]" />
                  )}
                  {m.startsAt && (
                    <span className="ml-auto text-[10px] text-ink/30 whitespace-nowrap">{formatMatchDate(m.startsAt)}</span>
                  )}
                </div>

                {existing ? (
                  /* Already submitted — show the question */
                  <div className="space-y-1.5">
                    <div className="rounded bg-field/10 border border-field/20 px-2.5 py-2 space-y-1">
                      <p className="text-xs font-medium">{existing.questionText}</p>
                      <div className="flex gap-2 text-[10px] text-ink/60">
                        <span className="rounded bg-ink/5 px-1.5 py-0.5">A: {existing.optionA}</span>
                        <span className="rounded bg-ink/5 px-1.5 py-0.5">B: {existing.optionB}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-medium ${
                        existing.status === "approved" ? "text-green-600" :
                        existing.status === "rejected" ? "text-red-400" :
                        "text-ink/40"
                      }`}>
                        {existing.status === "approved" ? "✓ Approved" :
                         existing.status === "rejected" ? "✗ Rejected" :
                         "⏳ Pending review"}
                      </span>
                      {existing.status === "pending" && (
                        <button
                          onClick={() => handleWithdraw(m.id, existing.id)}
                          disabled={isLoading}
                          className="text-[10px] text-ink/30 hover:text-red-400 transition-colors disabled:opacity-40"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                    {error && <p className="text-[10px] text-red-500">{error}</p>}
                  </div>
                ) : didSucceed ? (
                  <p className="text-xs text-green-600 font-medium">✓ Question submitted!</p>
                ) : (
                  /* Submission form */
                  <div className="space-y-1.5">
                    <textarea
                      value={forms[m.id]?.question ?? ""}
                      onChange={(e) => setField(m.id, "question", e.target.value)}
                      placeholder="Your question…"
                      maxLength={200}
                      rows={2}
                      className="w-full rounded border border-ink/15 bg-white px-2.5 py-1.5 text-xs placeholder:text-ink/30 resize-none focus:outline-none focus:border-field/60"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={forms[m.id]?.optionA ?? ""}
                        onChange={(e) => setField(m.id, "optionA", e.target.value)}
                        placeholder="Option A"
                        maxLength={100}
                        className="rounded border border-ink/15 bg-white px-2.5 py-1.5 text-xs placeholder:text-ink/30 focus:outline-none focus:border-field/60"
                      />
                      <input
                        type="text"
                        value={forms[m.id]?.optionB ?? ""}
                        onChange={(e) => setField(m.id, "optionB", e.target.value)}
                        placeholder="Option B"
                        maxLength={100}
                        className="rounded border border-ink/15 bg-white px-2.5 py-1.5 text-xs placeholder:text-ink/30 focus:outline-none focus:border-field/60"
                      />
                    </div>
                    {error && <p className="text-[10px] text-red-500">{error}</p>}
                    <button
                      onClick={() => handleSubmit(m.id)}
                      disabled={isLoading || pendingCount >= 10}
                      className="w-full rounded bg-field text-white text-xs font-medium py-1.5 hover:bg-field/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Submitting…" : "Submit Question"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
