import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import MatchResultForm from "./match-result-form";

interface MatchRow {
  id: string;
  group_name: string;
  starts_at: string;
  status: string;
  home_score_90: number | null;
  away_score_90: number | null;
  home_team: { name: string };
  away_team: { name: string };
}

export default async function AdminMatchesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return <p className="text-red-600">Access denied. Admin only.</p>;
  }

  const { data: matches } = await supabase
    .from("matches")
    .select(
      `id, group_name, starts_at, status, home_score_90, away_score_90,
       home_team:teams!matches_home_team_id_fkey(name),
       away_team:teams!matches_away_team_id_fkey(name)`
    )
    .eq("stage", "group")
    .order("starts_at", { ascending: true });

  // Group by date
  const grouped: Record<string, MatchRow[]> = {};
  for (const m of (matches ?? []) as unknown as MatchRow[]) {
    const dateKey = new Date(m.starts_at).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    (grouped[dateKey] ??= []).push(m);
  }

  const total = matches?.length ?? 0;
  const finished = (matches ?? []).filter(
    (m: unknown) => (m as MatchRow).status === "finished"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin — Match Results</h2>
        <p className="text-sm text-ink/60">
          {finished}/{total} matches finalized
        </p>
      </div>

      {Object.entries(grouped).map(([date, dayMatches]) => (
        <section key={date}>
          <h3 className="mb-2 text-sm font-semibold text-field">{date}</h3>
          <div className="space-y-1">
            {dayMatches.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-3 rounded border px-3 py-2 ${
                  m.status === "finished"
                    ? "border-field/20 bg-field/5"
                    : "border-ink/10 bg-white"
                }`}
              >
                <span className="w-6 text-xs text-ink/40">
                  {m.group_name}
                </span>
                <MatchResultForm
                  matchId={m.id}
                  homeTeam={m.home_team.name}
                  awayTeam={m.away_team.name}
                  currentHomeScore={m.home_score_90}
                  currentAwayScore={m.away_score_90}
                  status={m.status}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
