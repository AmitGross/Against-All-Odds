import { createServerSupabaseClient } from "@/lib/supabase/server";
import PredictionForm from "./prediction-form";

interface MatchRow {
  id: string;
  group_name: string;
  starts_at: string;
  status: string;
  is_locked: boolean;
  home_score_90: number | null;
  away_score_90: number | null;
  home_team: { code: string; name: string; flag_url: string | null };
  away_team: { code: string; name: string; flag_url: string | null };
}

interface PredictionRow {
  id: string;
  match_id: string;
  predicted_home_score_90: number;
  predicted_away_score_90: number;
}

export default async function MatchesPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch matches
  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `id, group_name, starts_at, status, is_locked, home_score_90, away_score_90,
       home_team:teams!matches_home_team_id_fkey(code, name, flag_url),
       away_team:teams!matches_away_team_id_fkey(code, name, flag_url)`
    )
    .eq("stage", "group")
    .order("starts_at", { ascending: true });

  if (error) {
    return <p className="text-red-600">Failed to load matches.</p>;
  }

  // Fetch current user's predictions
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let predictionsMap: Record<string, PredictionRow> = {};
  if (user) {
    const { data: predictions } = await supabase
      .from("predictions")
      .select("id, match_id, predicted_home_score_90, predicted_away_score_90")
      .eq("user_id", user.id);

    if (predictions) {
      for (const p of predictions as PredictionRow[]) {
        predictionsMap[p.match_id] = p;
      }
    }
  }

  // Group matches by date
  const grouped: Record<string, MatchRow[]> = {};
  for (const m of (matches ?? []) as unknown as MatchRow[]) {
    const dateKey = new Date(m.starts_at).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(m);
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Group Stage Matches</h2>

      {Object.entries(grouped).map(([date, dayMatches]) => (
        <section key={date}>
          <h3 className="mb-3 text-lg font-semibold text-field">{date}</h3>
          <div className="space-y-2">
            {dayMatches.map((m) => {
              const prediction = predictionsMap[m.id] ?? null;
              const isLocked = m.is_locked || m.status === "finished" || m.status === "live";

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border border-ink/10 bg-white px-4 py-3"
                >
                  <span className="w-8 shrink-0 text-xs font-medium text-ink/40">
                    {m.group_name}
                  </span>

                  {user ? (
                    <PredictionForm
                      matchId={m.id}
                      homeTeamName={m.home_team.name}
                      homeCode={m.home_team.code}
                      homeFlagUrl={m.home_team.flag_url}
                      awayTeamName={m.away_team.name}
                      awayCode={m.away_team.code}
                      awayFlagUrl={m.away_team.flag_url}
                      startsAt={m.starts_at}
                      status={m.status}
                      homeScore90={m.home_score_90}
                      awayScore90={m.away_score_90}
                      existingPrediction={prediction}
                      locked={isLocked}
                    />
                  ) : (
                    <div className="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2 text-sm min-w-0">
                      {/* Mobile */}
                      <div className="flex sm:hidden flex-col w-full gap-1">
                        <div className="flex items-center justify-between w-full">
                          <span className="flex items-center gap-1.5 font-medium">
                            {m.home_team.flag_url && <img src={m.home_team.flag_url} alt={m.home_team.code + ' flag'} className="w-6 h-4 rounded-sm border border-ink/10 shrink-0" />}
                            <span>{m.home_team.name}</span>
                          </span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <span>{m.away_team.name}</span>
                            {m.away_team.flag_url && <img src={m.away_team.flag_url} alt={m.away_team.code + ' flag'} className="w-6 h-4 rounded-sm border border-ink/10 shrink-0" />}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          {m.status === "finished" ? (
                            <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-sand">{m.home_score_90} – {m.away_score_90}</span>
                          ) : (
                            <span className="rounded bg-sand px-2 py-0.5 text-xs text-ink/60">{new Date(m.starts_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false })} UTC</span>
                          )}
                        </div>
                      </div>
                      {/* Desktop */}
                      <span className="hidden sm:flex flex-1 text-right font-medium items-center gap-1 justify-end min-w-0">
                        {m.home_team.flag_url && <img src={m.home_team.flag_url} alt={m.home_team.code + ' flag'} className="inline-block w-5 h-3.5 rounded-sm border border-ink/10 shrink-0" />}
                        {m.home_team.name}
                      </span>
                      {m.status === "finished" ? (
                        <span className="hidden sm:inline mx-2 rounded bg-red-600 px-3 py-1 text-sm font-bold text-sand">{m.home_score_90} – {m.away_score_90}</span>
                      ) : (
                        <span className="hidden sm:inline mx-2 rounded bg-sand px-3 py-1 text-xs text-ink/60">{new Date(m.starts_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false })} UTC</span>
                      )}
                      <span className="hidden sm:flex flex-1 font-medium items-center gap-1 min-w-0">
                        {m.away_team.flag_url && <img src={m.away_team.flag_url} alt={m.away_team.code + ' flag'} className="inline-block w-5 h-3.5 rounded-sm border border-ink/10 shrink-0" />}
                        {m.away_team.name}
                      </span>
                      <span className="hidden sm:inline ml-1 text-xs text-ink/30 shrink-0">Log in</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {Object.keys(grouped).length === 0 && (
        <p className="text-sm text-ink/60">No matches found.</p>
      )}
    </div>
  );
}
