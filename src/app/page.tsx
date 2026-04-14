"use client";

import { useState } from "react";
import Link from "next/link";

/* ── helpers ──────────────────────────────────────────── */

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
          <span className="text-2xl" aria-hidden>{icon}</span>
          <span className="font-bold text-lg">{title}</span>
        </div>
        <span className="text-ink/40 text-xl font-light select-none">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-6 pb-6 pt-1 space-y-4">{children}</div>}
    </div>
  );
}

function ScoreRow({ label, exact, outcome }: { label: string; exact: number; outcome: number }) {
  return (
    <tr className="border-t border-ink/5">
      <td className="py-2.5 pr-4 text-sm font-medium">{label}</td>
      <td className="py-2.5 px-4 text-center">
        <span className="inline-block rounded-full bg-field/15 text-field font-bold px-3 py-0.5 text-sm">+{exact}</span>
      </td>
      <td className="py-2.5 pl-4 text-center">
        <span className="inline-block rounded-full bg-clay/10 text-clay font-bold px-3 py-0.5 text-sm">+{outcome}</span>
      </td>
    </tr>
  );
}

/* ── page ─────────────────────────────────────────────── */

export default function HomePage() {
  const [allOpen, setAllOpen] = useState(false);

  return (
    <div className="space-y-20 pb-12">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative rounded-2xl overflow-hidden bg-ink text-white px-8 py-16 text-center">
        {/* stadium grass gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink to-field/30 pointer-events-none" />
        {/* subtle pitch lines */}
        <div className="absolute inset-0 flex items-end justify-center pb-0 pointer-events-none opacity-10">
          <svg viewBox="0 0 800 200" className="w-full" fill="none" stroke="white" strokeWidth="1.5">
            <ellipse cx="400" cy="200" rx="200" ry="80" />
            <line x1="400" y1="120" x2="400" y2="200" />
            <rect x="300" y="150" width="200" height="50" />
            <rect x="350" y="170" width="100" height="30" />
          </svg>
        </div>

        <div className="relative z-10 space-y-6">
          {/* soccer ball SVG */}
          <div className="flex justify-center">
            <svg viewBox="0 0 80 80" width="80" height="80" className="drop-shadow-xl">
              <circle cx="40" cy="40" r="36" fill="white" stroke="#10212B" strokeWidth="2" />
              <polygon points="40,10 52,22 48,36 32,36 28,22" fill="#10212B" />
              <polygon points="62,30 72,42 64,54 50,50 48,36 62,30" fill="#10212B" />
              <polygon points="62,30 52,22 40,10 50,6 66,18" fill="#10212B" opacity="0.4"/>
              <polygon points="18,30 28,22 32,36 18,46 8,40" fill="#10212B" />
              <polygon points="18,46 32,50 30,64 16,66 8,52" fill="#10212B" opacity="0.4"/>
              <polygon points="32,50 48,50 50,64 40,72 30,64" fill="#10212B" />
            </svg>
          </div>

          <div>
            <p className="text-field text-sm font-semibold tracking-widest uppercase mb-2">FIFA World Cup 2026</p>
            <h1 className="text-5xl font-black tracking-tight leading-tight">
              Against<br />
              <span className="text-field">All Odds</span>
            </h1>
          </div>

          <p className="text-white/70 text-lg max-w-md mx-auto leading-relaxed">
            The ultimate prediction game for the biggest tournament on Earth.
            Predict scores, call group winners, and nail the knockout bracket.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/login"
              className="rounded-xl bg-field px-6 py-3 font-bold text-white hover:bg-field/90 transition-colors shadow-lg"
            >
              Join the Game →
            </Link>
            <Link
              href="/matches"
              className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors"
            >
              View Matches
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="space-y-6">
        <h2 className="text-2xl font-extrabold text-center">Everything you need to play</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Predict Matches */}
          <div className="rounded-2xl border border-ink/10 bg-white p-6 space-y-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-field/10 flex items-center justify-center">
              {/* scoreboard icon */}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M8 12h.01M12 12h.01M16 12h.01"/>
                <line x1="2" y1="9" x2="22" y2="9"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg">Predict Every Match</h3>
            <p className="text-ink/60 text-sm leading-relaxed">
              Call the exact score for all 72 group-stage matches. Every goal matters — the closer your prediction, the more points you earn.
            </p>
          </div>

          {/* Group Standings */}
          <div className="rounded-2xl border border-ink/10 bg-white p-6 space-y-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-clay/10 flex items-center justify-center">
              {/* table/standings icon */}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#C7643B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v4H3z"/><path d="M3 10h18v4H3z"/><path d="M3 17h18v4H3z"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg">Pick Group Winners</h3>
            <p className="text-ink/60 text-sm leading-relaxed">
              Predict who tops each of the 12 groups. Live standings update in real-time as matches are played — watch your predictions come to life.
            </p>
          </div>

          {/* Knockout Bracket */}
          <div className="rounded-2xl border border-ink/10 bg-white p-6 space-y-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-field/10 flex items-center justify-center">
              {/* bracket icon */}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="6" x2="8" y2="6"/>
                <line x1="2" y1="18" x2="8" y2="18"/>
                <line x1="8" y1="6" x2="8" y2="18"/>
                <line x1="8" y1="12" x2="13" y2="12"/>
                <line x1="13" y1="9" x2="13" y2="15"/>
                <line x1="13" y1="9" x2="22" y2="9"/>
                <line x1="13" y1="15" x2="22" y2="15"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg">Full Knockout Bracket</h3>
            <p className="text-ink/60 text-sm leading-relaxed">
              Follow the Round of 32 all the way to the Final. The bracket updates live as winners are decided, and populates the next round automatically.
            </p>
          </div>

          {/* Rooms */}
          <div className="rounded-2xl border border-ink/10 bg-white p-6 space-y-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-clay/10 flex items-center justify-center">
              {/* friends icon */}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#C7643B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/>
                <path d="M3 20c0-3.3 2.7-6 6-6h2c1.1 0 2.1.3 3 .8"/>
                <path d="M14 19c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg">Compete with Friends</h3>
            <p className="text-ink/60 text-sm leading-relaxed">
              Create private rooms, invite your squad, and settle the debate once and for all. A live leaderboard tracks who really knows their football.
            </p>
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-extrabold text-center">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            {
              step: "1",
              icon: (
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              ),
              title: "Sign Up",
              desc: "Create your free account in seconds. No credit card, no nonsense.",
            },
            {
              step: "2",
              icon: (
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              ),
              title: "Make Your Picks",
              desc: "Predict match scores, group winners, and knockout results before they're locked.",
            },
            {
              step: "3",
              icon: (
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="8 6 2 12 8 18"/><polyline points="16 6 22 12 16 18"/>
                </svg>
              ),
              title: "Watch & Win",
              desc: "Points rack up in real time. Climb the leaderboard and brag to your friends.",
            },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="space-y-3">
              <div className="flex flex-col items-center gap-2">
                <span className="w-9 h-9 rounded-full bg-field text-white font-black text-sm flex items-center justify-center shadow">
                  {step}
                </span>
                <div className="w-14 h-14 rounded-full bg-field/10 flex items-center justify-center">
                  {icon}
                </div>
              </div>
              <h3 className="font-bold text-base">{title}</h3>
              <p className="text-ink/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TOURNAMENT FACTS ─────────────────────────────────── */}
      <section className="rounded-2xl bg-ink text-white px-8 py-10">
        <h2 className="text-xl font-extrabold mb-6 text-center tracking-wide">
          🏆 FIFA World Cup 2026 — Fast Facts
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { num: "48", label: "Teams" },
            { num: "104", label: "Matches" },
            { num: "3", label: "Host Nations" },
            { num: "12", label: "Groups" },
          ].map(({ num, label }) => (
            <div key={label} className="space-y-1">
              <p className="text-4xl font-black text-field">{num}</p>
              <p className="text-white/60 text-sm">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-white/50 text-xs mt-8">
          Hosted by USA 🇺🇸 · Canada 🇨🇦 · Mexico 🇲🇽 &nbsp;·&nbsp; June – July 2026
        </p>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="text-center space-y-4">
        <h2 className="text-2xl font-extrabold">Ready to prove you know football?</h2>
        <p className="text-ink/60">Predictions lock when matches kick off. Don&apos;t miss your window.</p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-field px-8 py-3 font-bold text-white hover:bg-field/90 transition-colors shadow-lg text-lg"
        >
          Start Predicting →
        </Link>
      </section>

      {/* ── WANT TO KNOW MORE ─────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">Want to know more?</h2>
          <button
            onClick={() => setAllOpen((v) => !v)}
            className="text-sm text-field font-semibold hover:underline"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>

        <div className="space-y-3">

          <SectionToggle title="Getting started" icon="🚀" defaultOpen={false}>
            <ol className="space-y-4 list-none">
              {[
                { n: "1", title: "Create a free account", desc: "Head to Login and sign up with your email. Set a display name on your Dashboard — this is what teammates and the leaderboard will show." },
                { n: "2", title: "Make your picks before kick-off", desc: "Predictions lock the moment a match kicks off, so get yours in early. You can edit right up until then." },
                { n: "3", title: "Watch the points roll in", desc: "Once results are entered, your score updates automatically. Track everything on the Leaderboard." },
              ].map(({ n, title, desc }) => (
                <li key={n} className="flex gap-4">
                  <span className="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-field text-white font-black text-xs flex items-center justify-center">{n}</span>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-ink/60 text-sm leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </SectionToggle>

          <SectionToggle title="What you predict" icon="📋">
            <div className="space-y-5">
              {[
                { icon: "⚽", title: "Match scores", desc: "Predict the exact final score for every group-stage match (72 games). You earn points for an exact score or just for calling the right result (win/draw/loss)." },
                { icon: "📊", title: "Group winners", desc: "Pick who tops each of the 12 groups. The live standings table updates in real time as matches finish." },
                { icon: "🗂️", title: "Knockout bracket", desc: "Predict the winner of every knockout match from the Round of 32 through to the Final. The bracket populates automatically as group winners are confirmed. You can also predict the score of each knockout match for bonus points." },
                { icon: "🌍", title: "Global predictions", desc: "Before the tournament: call the overall champion, the golden boot winner, top-scoring nation, and more. These are one-time locks that pay off big." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2"><span>{icon}</span> {title}</h4>
                  <p className="text-sm text-ink/60 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </SectionToggle>

          <SectionToggle title="How scoring works" icon="🎯">
            <div className="space-y-5">
              <p className="text-sm text-ink/60 leading-relaxed">
                Every match has two ways to score points. Exact scores are worth more — but even calling the right result (win/draw/loss) earns you something. Stakes go up in the knockout rounds.
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
                💡 <strong>Odd One Out bonus:</strong> If you&apos;re the only person in your room who predicted a different result — and you got it right — your points for that match are <strong>doubled</strong>.
              </div>
            </div>
          </SectionToggle>

          <SectionToggle title="Built-in prediction model" icon="🤖">
            <div className="space-y-4">
              <p className="text-sm text-ink/60 leading-relaxed">
                Don&apos;t know the teams? No time to research? Just let the model pick — it&apos;ll submit an educated prediction on your behalf. Or use it as a second opinion before you decide.
              </p>
              <div className="space-y-3">
                {[
                  { icon: "📊", title: "What it looks at", desc: "Recent form, head-to-head record, Elo ratings, FIFA rankings, days of rest, and how far into the tournament each team is." },
                  { icon: "🔄", title: "Always up to date", desc: "Every time a match finishes, the model retrains on the new result and updates its remaining predictions automatically. No manual steps." },
                  { icon: "🎯", title: "What it gives you", desc: "A predicted scoreline and the probability of a win, draw, or loss for each team. Take it or leave it." },
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

          <SectionToggle title="Private rooms — compete with friends" icon="🏠">
            <div className="space-y-5">
              <p className="text-sm text-ink/60 leading-relaxed">
                Rooms are where the real competition happens. Create a private room, share the invite code, and your friends join instantly — no admin approval needed.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: "📋", title: "Live standings", desc: "A real-time leaderboard showing every member's total points, updated after each result." },
                  { icon: "📅", title: "Watch party planner", desc: "Schedule up to 8 matches to watch together. Each slot can be locked by the room owner so plans are set." },
                  { icon: "🧠", title: "Telepathy viewer", desc: "See how every roommate predicted the same match, side by side. Find out who thinks alike." },
                  { icon: "🎨", title: "Drawing board", desc: "A shared canvas for the whole room — draw tactics, write notes, doodle predictions. Auto-saved." },
                  { icon: "⚙️", title: "Scoring rules", desc: "Choose between Classic rules or House rules to customise how points are calculated for your group." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex gap-3 rounded-xl border border-ink/8 bg-sand/30 p-4">
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

          <SectionToggle title="Tips & strategy" icon="💡">
            <ul className="space-y-3">
              {[
                { tip: "Lock in knockouts early", detail: "Bracket slots freeze as soon as a group finishes. If you wait until the last minute, some teams may already be confirmed — making your pick feel obvious." },
                { tip: "Don't just predict the favourite", detail: "The Odd One Out bonus rewards bold calls. If you're confident in an upset, go for it — a correct dark-horse pick can vault you up the leaderboard in one match." },
                { tip: "Group predictions matter", detail: "Picking the right group winner costs nothing and can separate you from players who just focus on match scores." },
                { tip: "Use the room drawing board for tactics", detail: "Before big matches, use the shared canvas to map out your predictions with your room — it's also just fun." },
                { tip: "Check the Telepathy viewer", detail: "After a match locks, see who in your room agreed with you and who went against. Knowing who has similar instincts helps with watch party planning." },
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

          <SectionToggle title="Extra rules & features" icon="🔜">
            <p className="text-sm text-ink/60 leading-relaxed mb-2">
              Additional custom rules and features you can layer on top of the base game — coming soon.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: "🏅", title: "Badges", desc: "Earn badges for streaks and bold calls — Prophet, Odd One Out, Iron Nerve, and more." },
                { icon: "🃏", title: "Jokers", desc: "Play a 2× or 3× multiplier on any match. Limited uses per tournament." },
                { icon: "⚔️", title: "Face-to-Face", desc: "Challenge a roommate to a duel. The rest of the room bets on who wins — everyone who calls it right gets rewarded." },
                { icon: "👁️", title: "Joker reveals", desc: "Spend a joker to peek at the most popular prediction before locking in your own." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3 rounded-xl border border-ink/8 bg-sand/30 p-4">
                  <span className="text-xl mt-0.5">{icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs text-ink/55 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionToggle>

          <SectionToggle title="Frequently asked questions" icon="❓">
            <div className="space-y-5">
              {[
                { q: "Is it free?", a: "Yes, completely free. No purchases, no premium tiers." },
                { q: "When do predictions lock?", a: "The moment a match kicks off. You can change your prediction any time before then." },
                { q: "Can I be in multiple rooms?", a: "Yes — join as many rooms as you like. Your predictions are global; what changes between rooms is who you're competing against and the room-specific features." },
                { q: "What happens to knockout predictions when a team gets eliminated?", a: "Your prediction stands but scores 0 — it's part of the risk." },
                { q: "How are scores entered?", a: "Results are fetched automatically after each match via a scheduled job. Points update on their own — no manual input needed. The prediction model also retrains on the latest results in the background." },
              ].map(({ q, a }) => (
                <div key={q} className="space-y-1">
                  <p className="font-semibold text-sm">{q}</p>
                  <p className="text-sm text-ink/60 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </SectionToggle>

        </div>
      </section>

    </div>
  );
}

