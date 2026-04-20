"use client";

import { useState } from "react";
import { voteOnQuestion } from "./actions";

export interface VotableQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  points: number;
  myVote: "a" | "b" | null;
}

interface Props {
  roomId: string;
  questions: VotableQuestion[];
}

export default function MatchQuestionVoter({ roomId, questions }: Props) {
  const [votes, setVotes] = useState<Record<string, "a" | "b" | null>>(
    () => Object.fromEntries(questions.map((q) => [q.id, q.myVote]))
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleVote(qId: string, answer: "a" | "b") {
    setLoading((p) => ({ ...p, [qId]: true }));
    setErrors((p) => ({ ...p, [qId]: "" }));
    const result = await voteOnQuestion(roomId, qId, answer);
    setLoading((p) => ({ ...p, [qId]: false }));
    if (result.error) {
      setErrors((p) => ({ ...p, [qId]: result.error! }));
    } else {
      setVotes((p) => ({ ...p, [qId]: answer }));
    }
  }

  return (
    <div className="mt-2 space-y-2 border-t border-ink/10 pt-2">
      {questions.map((q) => (
        <div key={q.id} className="rounded bg-field/8 border border-field/15 px-2.5 py-2 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-ink/80 leading-snug">💬 {q.questionText}</p>
            <span className="shrink-0 text-[10px] text-field/60 font-semibold">
              {q.points}pt{q.points !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex gap-1.5">
            {(["a", "b"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => handleVote(q.id, opt)}
                disabled={loading[q.id]}
                className={`flex-1 rounded px-2 py-1.5 text-[11px] font-medium border transition-colors ${
                  votes[q.id] === opt
                    ? "bg-field text-white border-field"
                    : "bg-white text-ink/60 border-ink/15 hover:border-field/50 hover:text-ink"
                } disabled:opacity-50`}
              >
                {opt.toUpperCase()}: {opt === "a" ? q.optionA : q.optionB}
              </button>
            ))}
          </div>
          {votes[q.id] && (
            <p className="text-[10px] text-ink/40">
              Your pick: <span className="font-medium text-ink/60">{votes[q.id]!.toUpperCase()} — {votes[q.id] === "a" ? q.optionA : q.optionB}</span>
              {" · "}<span className="italic">answer revealed after the match</span>
            </p>
          )}
          {errors[q.id] && (
            <p className="text-[10px] text-red-500">{errors[q.id]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
