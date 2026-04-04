import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/logout-button";
import UsernameEditor from "./username-editor";
import ProfileDetailsEditor from "./profile-details-editor";
import WindowPicker from "./window-picker";
import GlobalPredictionCard from "./global-prediction-card";

const WINDOW_MS: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "2d":  2  * 24 * 60 * 60 * 1000,
  "1w":  7  * 24 * 60 * 60 * 1000,
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const { window: windowParam } = await searchParams;
  const windowKey = windowParam && WINDOW_MS[windowParam] ? windowParam : "24h";
  const windowMs = WINDOW_MS[windowKey];
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("username, username_set, display_name, age, country")
    .eq("id", user.id)
    .single();

  // Sum all scored points for this user
  const [{ data: scoreRows }, { data: globalScoreRows }] = await Promise.all([
    supabase.from("prediction_scores").select("base_points").eq("user_id", user.id),
    supabase.from("global_predictions").select("points_awarded").eq("user_id", user.id),
  ]);

  const matchPoints = (scoreRows ?? []).reduce((sum, r) => sum + (r.base_points ?? 0), 0);
  const globalPoints = (globalScoreRows ?? []).reduce((sum, r) => sum + (r.points_awarded ?? 0), 0);
  const totalPoints = matchPoints + globalPoints;

  // Matches starting within the chosen window
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMs);

  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select("id, starts_at, is_locked, home_team:home_team_id(name), away_team:away_team_id(name)")
    .eq("status", "scheduled")
    .eq("is_locked", false)
    .gt("starts_at", now.toISOString())
    .lte("starts_at", windowEnd.toISOString());

  const upcoming = upcomingMatches ?? [];

  // Which of those does the user already have a prediction for?
  const upcomingIds = upcoming.map((m: any) => m.id as string);
  const { data: existingPredictions } = upcomingIds.length > 0
    ? await supabase
        .from("predictions")
        .select("match_id")
        .eq("user_id", user.id)
        .in("match_id", upcomingIds)
    : { data: [] };

  const predictedMatchIds = new Set((existingPredictions ?? []).map((p: any) => p.match_id as string));
  const missingMatches = upcoming.filter((m: any) => !predictedMatchIds.has(m.id));

  // Global predictions data
  const [{ data: globalSettings }, { data: allTeams }, { data: allPlayers }, { data: userGlobalPicks }] = await Promise.all([
    supabase.from("global_prediction_settings").select("*"),
    supabase.from("teams").select("id, name, flag_url").order("name"),
    supabase.from("players").select("id, name").order("name"),
    supabase.from("global_predictions").select("type, team_id, player_id, points_awarded").eq("user_id", user.id),
  ]);

  const settingsMap = Object.fromEntries((globalSettings ?? []).map((s: any) => [s.type, s]));
  const picksMap = Object.fromEntries((userGlobalPicks ?? []).map((p: any) => [p.type, p]));

  const profile = {
    username: profileRow?.username ?? user.email ?? "unknown",
    usernameSet: profileRow?.username_set ?? false,
    age: profileRow?.age ?? null,
    country: profileRow?.country ?? null,
    totalPoints,
  };

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Dashboard</h2>
        <LogoutButton />
      </div>

      {/* ── Section 1: Profile Card ── */}
      <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Profile</h3>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">

          {/* Avatar placeholder */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-field/20 text-3xl font-bold text-field">
            {profile.usernameSet ? profile.username.charAt(0).toUpperCase() : "?"}
          </div>

          <div className="flex-1 space-y-4">
            {/* Username row */}
            <UsernameEditor current={profile.username} isSet={profile.usernameSet} />

            {/* Age + Country row */}
            <ProfileDetailsEditor initialAge={profile.age} initialCountry={profile.country} />
          </div>
        </div>
      </section>

      {/* ── Section 2: Score Card ── */}
      <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">My Score</h3>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-black text-field">{profile.totalPoints}</span>
          <span className="mb-1 text-sm text-ink/40">points</span>
        </div>
        <p className="mt-1 text-xs text-ink/40">Updates after each match is finalized by the admin.</p>
      </section>

      {/* ── Section 3: Prediction Reminder ── */}
      <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/40">Upcoming Predictions</h3>
          <Suspense fallback={null}>
            <WindowPicker current={windowKey} />
          </Suspense>
        </div>
        {missingMatches.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-field/10 px-4 py-3">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-sm font-semibold text-field">You&apos;re all caught up!</p>
              <p className="text-xs text-ink/50">
                {upcoming.length === 0
                  ? `No matches in the next ${windowKey === "24h" ? "24 hours" : windowKey === "2d" ? "2 days" : windowKey === "1w" ? "week" : "year"}.`
                  : `All matches in the next ${windowKey === "24h" ? "24 hours" : windowKey === "2d" ? "2 days" : windowKey === "1w" ? "week" : "year"} have predictions.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-clay/10 px-4 py-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-clay">
                  {missingMatches.length} match{missingMatches.length !== 1 ? "es" : ""} without a prediction!
                </p>
                <p className="text-xs text-ink/50">These matches kick off in the next {windowKey === "24h" ? "24 hours" : windowKey === "2d" ? "2 days" : windowKey === "1w" ? "week" : "year"}.</p>
              </div>
            </div>
            <ul className="space-y-1">
              {missingMatches.map((m: any) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg border border-clay/20 bg-clay/5 px-3 py-2 text-sm">
                  <span className="font-medium">
                    {m.home_team?.name ?? "?"} vs {m.away_team?.name ?? "?"}
                  </span>
                  <span className="text-xs text-ink/40">
                    {new Date(m.starts_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="/matches"
              className="inline-block rounded bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-clay/90 transition-colors"
            >
              Go predict now →
            </a>
          </div>
        )}
      </section>

      {/* ── Section 4: Global Predictions ── */}
      <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">
          Global Predictions
        </h3>
        <p className="mb-5 text-xs text-ink/50">
          Each correct global prediction earns you <span className="font-semibold text-clay">10 points</span>.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {["winner", "top_scorer", "assist_leader"].map((t) => {
            const s = settingsMap[t];
            const pick = picksMap[t] ?? null;
            return (
              <GlobalPredictionCard
                key={t}
                type={t}
                isLocked={s?.is_locked ?? false}
                teams={allTeams ?? []}
                players={allPlayers ?? []}
                currentPick={pick ? { teamId: pick.team_id, playerId: pick.player_id } : null}
                pointsAwarded={pick?.points_awarded ?? 0}
              />
            );
          })}
        </div>
      </section>

    </div>
  );
}

