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
  home_team: { code: string; name: string };
  away_team: { code: string; name: string };
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
       home_team:teams!matches_home_team_id_fkey(code, name),
       away_team:teams!matches_away_team_id_fkey(code, name)`
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
                      awayTeamName={m.away_team.name}
                      awayCode={m.away_team.code}
                      startsAt={m.starts_at}
                      status={m.status}
                      homeScore90={m.home_score_90}
                      awayScore90={m.away_score_90}
                      existingPrediction={prediction}
                      locked={isLocked}
                    />
                  ) : (
                    <div className="flex flex-1 items-center justify-center gap-3 text-sm">
                      <span className="w-36 text-right font-medium">
                        {m.home_team.name}
                      </span>

                      {m.status === "finished" ? (
                        <span className="mx-2 rounded bg-ink px-3 py-1 text-sm font-bold text-sand">
                          {m.home_score_90} – {m.away_score_90}
                        </span>
                      ) : (
                        <span className="mx-2 rounded bg-sand px-3 py-1 text-xs text-ink/60">
                          {new Date(m.starts_at).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "UTC",
                            hour12: false,
                          })}{" "}
                          UTC
                        </span>
                      )}

                      <span className="w-36 font-medium">
                        {m.away_team.name}
                      </span>
                      <span className="ml-2 text-xs text-ink/30">Log in to predict</span>
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
