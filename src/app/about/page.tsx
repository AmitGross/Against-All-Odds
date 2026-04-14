"use client";

import { useState } from "react";
import Link from "next/link";

/* ── tiny helpers ─────────────────────────────────────── */

function SectionToggle({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-ink/10 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-sand/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            {icon}
          </span>
          <span className="font-bold text-lg">{title}</span>
        </div>
        <span className="text-ink/40 text-xl font-light select-none">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && <div className="px-6 pb-6 pt-1 space-y-4">{children}</div>}
    </div>
  );
}

function ScoreRow({
  label,
  exact,
  outcome,
}: {
  label: string;
  exact: number;
  outcome: number;
}) {
  return (
    <tr className="border-t border-ink/5">
      <td className="py-2.5 pr-4 text-sm font-medium">{label}</td>
      <td className="py-2.5 px-4 text-center">
        <span className="inline-block rounded-full bg-field/15 text-field font-bold px-3 py-0.5 text-sm">
          +{exact}
        </span>
      </td>
      <td className="py-2.5 pl-4 text-center">
        <span className="inline-block rounded-full bg-clay/10 text-clay font-bold px-3 py-0.5 text-sm">
          +{outcome}
        </span>
      </td>
    </tr>
  );
}

/* ── main page ────────────────────────────────────────── */

export default function AboutPage() {
  const [allOpen, setAllOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-16">

      {/* ── HERO ── */}
      <section className="relative rounded-2xl overflow-hidden bg-ink text-white px-8 py-14 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink to-field/30 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex justify-center">
            <svg viewBox="0 0 80 80" width="64" height="64" className="drop-shadow-xl">
              <circle cx="40" cy="40" r="36" fill="white" stroke="#10212B" strokeWidth="2" />
              <polygon points="40,10 52,22 48,36 32,36 28,22" fill="#10212B" />
              <polygon points="62,30 72,42 64,54 50,50 48,36 62,30" fill="#10212B" />
              <polygon points="18,30 28,22 32,36 18,46 8,40" fill="#10212B" />
              <polygon points="32,50 48,50 50,64 40,72 30,64" fill="#10212B" />
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Against <span className="text-field">All Odds</span>
          </h1>
          <p className="text-white/70 max-w-md mx-auto leading-relaxed">
            A free prediction game for the 2026 FIFA World Cup. Predict scores,
            call brackets, compete with friends — all in one place.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-field px-6 py-2.5 font-bold text-white hover:bg-field/90 transition-colors shadow-lg"
          >
            Join the Game →
          </Link>
        </div>
      </section>

      {/* ── QUICK OVERVIEW CARDS ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {[
          { emoji: "⚽", label: "104 Matches", sub: "to predict" },
          { emoji: "🏆", label: "48 Teams", sub: "12 groups" },
          { emoji: "🎯", label: "Score Points", sub: "exact or outcome" },
          { emoji: "🏠", label: "Private Rooms", sub: "for your crew" },
        ].map(({ emoji, label, sub }) => (
          <div
            key={label}
            className="rounded-xl border border-ink/10 bg-white p-4 space-y-1"
          >
            <div className="text-2xl">{emoji}</div>
            <p className="font-bold text-sm">{label}</p>
            <p className="text-ink/50 text-xs">{sub}</p>
          </div>
        ))}
      </section>

      {/* ── EXPAND ALL / COLLAPSE ALL ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold">How everything works</h2>
        <button
          onClick={() => setAllOpen((v) => !v)}
          className="text-sm text-field font-semibold hover:underline"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* ── ACCORDIONS ── */}
      <div className="space-y-3">

        {/* 1 – Getting started */}
        <SectionToggle title="Getting started" icon="🚀" defaultOpen={true}>
          <ol className="space-y-4 list-none">
            {[
              {
                n: "1",
                title: "Create a free account",
                desc: 'Head to Login and sign up with your email. Set a display name on your Dashboard — this is what teammates and the leaderboard will show.',
              },
              {
                n: "2",
                title: "Make your picks before kick-off",
                desc: "Predictions lock the moment a match kicks off, so get yours in early. You can edit right up until then.",
              },
              {
                n: "3",
                title: "Watch the points roll in",
                desc: "Once results are entered, your score updates automatically. Track everything on the Leaderboard.",
              },
            ].map(({ n, title, desc }) => (
              <li key={n} className="flex gap-4">
                <span className="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-field text-white font-black text-xs flex items-center justify-center">
                  {n}
                </span>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-ink/60 text-sm leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </SectionToggle>

        {/* 2 – What you predict */}
        <SectionToggle title="What you predict" icon="📋">
          <div className="space-y-5">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span>⚽</span> Match scores
              </h4>
              <p className="text-sm text-ink/60 leading-relaxed">
                Predict the exact final score for every group-stage match (72 games).
                You earn points for an exact score or just for calling the right
                result (win/draw/loss).
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span>📊</span> Group winners
              </h4>
              <p className="text-sm text-ink/60 leading-relaxed">
                Pick who tops each of the 12 groups. The live standings table
                updates in real time as matches finish.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span>🗂️</span> Knockout bracket
              </h4>
              <p className="text-sm text-ink/60 leading-relaxed">
                Predict the winner of every knockout match from the Round of 32
                through to the Final. The bracket is populated automatically as
                group winners are confirmed. You can also predict the score of each
                knockout match for bonus points.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span>🌍</span> Global predictions
              </h4>
              <p className="text-sm text-ink/60 leading-relaxed">
                Before the tournament: call the overall champion, the golden boot
                winner, top-scoring nation, and more. These are one-time locks that
                pay off big.
              </p>
            </div>
          </div>
        </SectionToggle>

        {/* 3 – Scoring */}
        <SectionToggle title="How scoring works" icon="🎯">
          <div className="space-y-5">
            <p className="text-sm text-ink/60 leading-relaxed">
              Every match has two ways to score points. Exact scores are worth
              more — but even calling the right result (win/draw/loss) earns you
              something. Stakes go up in the knockout rounds.
            </p>

            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-ink/40 pb-2 pr-4">Round</th>
                  <th className="text-center text-xs font-semibold text-field pb-2 px-4">Exact score</th>
                  <th className="text-center text-xs font-semibold text-clay pb-2 pl-4">Right result</th>
                </tr>
              </thead>
              <tbody>
                <ScoreRow label="Group stage" exact={3} outcome={1} />
                <ScoreRow label="Round of 32" exact={3} outcome={1} />
                <ScoreRow label="Round of 16" exact={6} outcome={2} />
                <ScoreRow label="Quarter-finals" exact={9} outcome={3} />
                <ScoreRow label="Semi-finals" exact={12} outcome={4} />
                <ScoreRow label="3rd place / Final" exact={12} outcome={4} />
              </tbody>
            </table>

            <div className="rounded-xl bg-sand/50 border border-ink/5 p-4 text-sm text-ink/70 leading-relaxed">
              💡 <strong>Odd One Out bonus:</strong> If you&apos;re the only person
              in your room who predicted a different result — and you got it right
              — your points for that match are <strong>doubled</strong>. Everyone
              else picks Team A wins; you call the draw and nail it — boom.
            </div>
          </div>
        </SectionToggle>

        {/* 4 – Model */}
        <SectionToggle title="Built-in prediction model" icon="🤖">
          <div className="space-y-4">
            <p className="text-sm text-ink/60 leading-relaxed">
              Don&apos;t know the teams? No time to research? Just let the model
              pick — it&apos;ll submit an educated prediction on your behalf. Or
              use it as a second opinion before you decide. Either way, you&apos;re
              never stuck staring at a blank scoreline.
            </p>

            <div className="space-y-3">
              {[
                {
                  icon: "📊",
                  title: "What it looks at",
                  desc: "Recent form, head-to-head record, Elo ratings, FIFA rankings, days of rest, and how far into the tournament each team is.",
                },
                {
                  icon: "🔄",
                  title: "Always up to date",
                  desc: "Every time a match finishes, the model retrains on the new result and updates its remaining predictions automatically. No manual steps.",
                },
                {
                  icon: "🎯",
                  title: "What it gives you",
                  desc: "A predicted scoreline and the probability of a win, draw, or loss for each team. Take it or leave it.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <span className="text-lg mt-0.5">{icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs text-ink/55 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionToggle>

        {/* 5 – Rooms */}
        <SectionToggle title="Private rooms — compete with friends" icon="🏠">
          <div className="space-y-5">
            <p className="text-sm text-ink/60 leading-relaxed">
              Rooms are where the real competition happens. Create a private room,
              share the invite code, and your friends join instantly — no admin
              approval needed.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "📋",
                  title: "Live standings",
                  desc: "A real-time leaderboard showing every member's total points, updated after each result.",
                },
                {
                  icon: "📅",
                  title: "Watch party planner",
                  desc: "Schedule up to 8 matches to watch together. Each slot can be locked by the room owner so plans are set.",
                },
                {
                  icon: "🧠",
                  title: "Telepathy viewer",
                  desc: "See how every roommate predicted the same match, side by side. Find out who thinks alike.",
                },
                {
                  icon: "🎨",
                  title: "Drawing board",
                  desc: "A shared canvas for the whole room — draw tactics, write notes, doodle predictions. Auto-saved.",
                },
                {
                  icon: "⚙️",
                  title: "Scoring rules",
                  desc: "Choose between Classic rules or House rules to customise how points are calculated for your group.",
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="flex gap-3 rounded-xl border border-ink/8 bg-sand/30 p-4"
                >
                  <span className="text-xl mt-0.5">{icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs text-ink/55 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-field/8 border border-field/20 p-4 space-y-1">
              <p className="font-semibold text-sm text-field">How to join a room</p>
              <ol className="text-sm text-ink/60 space-y-1 list-decimal list-inside">
                <li>Go to <strong>Rooms</strong> in the navigation</li>
                <li>Click <strong>Join a room</strong> and enter the 6-character invite code</li>
                <li>You&apos;re in — your predictions are immediately visible to everyone</li>
              </ol>
            </div>
          </div>
        </SectionToggle>

        {/* 5 – Tips */}
        <SectionToggle title="Tips & strategy" icon="💡">
          <ul className="space-y-3">
            {[
              {
                tip: "Lock in knockouts early",
                detail:
                  "Bracket slots freeze as soon as a group finishes. If you wait until the last minute, some teams may already be confirmed — making your pick feel obvious (and worth less socially, even if points are the same).",
              },
              {
                tip: "Don't just predict the favourite",
                detail:
                  "The outlier bonus rewards bold calls. If you're confident in an upset, go for it — a correct dark-horse pick can vault you up the leaderboard in one match.",
              },
              {
                tip: "Group predictions matter",
                detail:
                  "Picking the right group winner costs nothing and can separate you from players who just focus on match scores.",
              },
              {
                tip: "Use the room drawing board for tactics",
                detail:
                  "Before big matches, use the shared canvas to map out your predictions visually with your room — it's also just fun.",
              },
              {
                tip: "Check the Telepathy viewer",
                detail:
                  "After a match locks, see who in your room agreed with you and who went against. Knowing who has similar instincts helps with watch party planning.",
              },
            ].map(({ tip, detail }) => (
              <li key={tip} className="flex gap-3">
                <span className="text-field font-black text-sm mt-0.5">→</span>
                <div>
                  <p className="font-semibold text-sm">{tip}</p>
                  <p className="text-xs text-ink/55 leading-relaxed">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionToggle>

        {/* 6 – Coming soon */}
        <SectionToggle title="Extra rules & features" icon="🔜">
          <p className="text-sm text-ink/60 leading-relaxed">
            Additional custom rules and features you can layer on top of the base game — coming soon.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: "🏅",
                title: "Badges",
                desc: "Earn badges for streaks and bold calls — Prophet, Odd One Out, Iron Nerve, and more.",
              },
              {
                icon: "🃏",
                title: "Jokers",
                desc: "Play a 2× or 3× multiplier on any match. Limited uses per tournament.",
              },
              {
                icon: "⚔️",
                title: "Face-to-Face",
                desc: "Challenge a roommate to a duel. The rest of the room bets on who wins — everyone who calls it right gets rewarded.",
              },
              {
                icon: "👁️",
                title: "Joker reveals",
                desc: "Spend a joker to peek at the most popular prediction before locking in your own.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-3 rounded-xl border border-ink/8 bg-sand/30 p-4"
              >
                <span className="text-xl mt-0.5">{icon}</span>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-ink/55 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionToggle>

        {/* 7 – FAQ */}
        <SectionToggle title="Frequently asked questions" icon="❓">
          <div className="space-y-5">
            {[
              {
                q: "Is it free?",
                a: "Yes, completely free. No purchases, no premium tiers.",
              },
              {
                q: "When do predictions lock?",
                a: "The moment a match kicks off. You can change your prediction any time before then.",
              },
              {
                q: "Can I be in multiple rooms?",
                a: "Yes — join as many rooms as you like. Your predictions are global; what changes between rooms is who you're competing against and the room-specific features (watch party, drawing board, etc.).",
              },
              {
                q: "What happens to knockout predictions when a team gets eliminated?",
                a: "Your prediction stands but scores 0 — if you correctly called the team in a later round before they were eliminated, those predictions simply won't convert. It's part of the risk.",
              },
              {
                q: "How are scores entered?",
                a: "Results are fetched automatically after each match via a scheduled job. Points update on their own — no manual input needed. The prediction model also retrains on the latest results in the background.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="space-y-1">
                <p className="font-semibold text-sm">{q}</p>
                <p className="text-sm text-ink/60 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </SectionToggle>

      </div>

      {/* ── FOOTER CTA ── */}
      <section className="rounded-2xl bg-ink text-white text-center px-8 py-10 space-y-4">
        <h2 className="text-xl font-extrabold">Ready to play?</h2>
        <p className="text-white/60 text-sm">
          Predictions lock when matches kick off. Don&apos;t miss your window.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/login"
            className="rounded-xl bg-field px-6 py-2.5 font-bold text-white hover:bg-field/90 transition-colors shadow"
          >
            Start Predicting →
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/20 px-6 py-2.5 font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </section>

    </div>
  );
}
