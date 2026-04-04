import Link from "next/link";

export default function HomePage() {
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
        <p className="text-ink/60">Predictions lock when matches kick off. Don't miss your window.</p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-field px-8 py-3 font-bold text-white hover:bg-field/90 transition-colors shadow-lg text-lg"
        >
          Start Predicting →
        </Link>
      </section>

    </div>
  );
}

