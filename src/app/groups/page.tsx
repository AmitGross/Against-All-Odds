import { createServerSupabaseClient } from "@/lib/supabase/server";
import Image from "next/image";

interface TeamRow {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
}

interface MatchRow {
  group_name: string;
  home_score_90: number | null;
  away_score_90: number | null;
  status: string;
  home_team: { id: string; name: string; code: string; flag_url: string | null };
  away_team: { id: string; name: string; code: string; flag_url: string | null };
}

function buildStandings(matches: MatchRow[]): Record<string, TeamRow[]> {
  const groups: Record<string, Record<string, TeamRow>> = {};

  for (const m of matches) {
    const g = m.group_name;
    if (!groups[g]) groups[g] = {};

    for (const team of [m.home_team, m.away_team]) {
      if (!groups[g][team.id]) {
        groups[g][team.id] = {
          id: team.id,
          name: team.name,
          code: team.code,
          flag_url: team.flag_url,
          mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0,
        };
      }
    }

    // Only count completed matches
    if (m.home_score_90 === null || m.away_score_90 === null) continue;

    const hs = m.home_score_90;
    const as_ = m.away_score_90;
    const home = groups[g][m.home_team.id];
    const away = groups[g][m.away_team.id];

    home.mp++;
    away.mp++;
    home.gf += hs;
    home.ga += as_;
    away.gf += as_;
    away.ga += hs;

    if (hs > as_) {
      home.w++;
      away.l++;
    } else if (hs < as_) {
      away.w++;
      home.l++;
    } else {
      home.d++;
      away.d++;
    }
  }

  // Sort each group: pts desc, gd desc, gf desc, name asc
  const result: Record<string, TeamRow[]> = {};
  for (const [g, teamsMap] of Object.entries(groups)) {
    result[g] = Object.values(teamsMap).sort((a, b) => {
      const ptsA = a.w * 3 + a.d;
      const ptsB = b.w * 3 + b.d;
      if (ptsB !== ptsA) return ptsB - ptsA;
      const gdA = a.gf - a.ga;
      const gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name);
    });
  }
  return result;
}

export default async function GroupsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!tournament) {
    return <p className="text-ink/60 p-6">No active tournament found.</p>;
  }

  const { data: rawMatches } = await supabase
    .from("matches")
    .select(`
      group_name, home_score_90, away_score_90, status,
      home_team:teams!matches_home_team_id_fkey(id, name, code, flag_url),
      away_team:teams!matches_away_team_id_fkey(id, name, code, flag_url)
    `)
    .eq("tournament_id", tournament.id)
    .eq("stage", "group")
    .not("group_name", "is", null)
    .order("group_name");

  const matches = (rawMatches ?? []) as unknown as MatchRow[];
  const standings = buildStandings(matches);
  const groupNames = Object.keys(standings).sort();

  return (
    <div className="space-y-8 px-4 py-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold tracking-wide">Group Standings</h1>
      {groupNames.map((g) => {
        const rows = standings[g];
        return (
          <div key={g} className="rounded-xl overflow-hidden border border-ink/10">
            {/* Group header */}
            <div className="bg-ink/80 text-white px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-ink/40">World Cup</span>
              <span className="font-bold text-sm">Group {g}</span>
            </div>

            {/* Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink/10 text-ink/50 text-xs uppercase">
                  <th className="text-left px-3 py-2 w-full">Team</th>
                  <th className="px-2 py-2 text-center">MP</th>
                  <th className="px-2 py-2 text-center">W</th>
                  <th className="px-2 py-2 text-center">D</th>
                  <th className="px-2 py-2 text-center">L</th>
                  <th className="px-2 py-2 text-center">GD</th>
                  <th className="px-2 py-2 text-center font-bold text-ink">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((team, idx) => {
                  const pts = team.w * 3 + team.d;
                  const gd = team.gf - team.ga;
                  const qualified = idx < 2;
                  return (
                    <tr
                      key={team.id}
                      className={`border-t border-ink/10 ${qualified ? "bg-field/5" : ""}`}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-ink/40 text-xs w-4">{idx + 1}</span>
                          {team.flag_url ? (
                            <img
                              src={team.flag_url}
                              alt={team.name}
                              className="w-6 h-4 rounded-sm object-cover border border-ink/10"
                            />
                          ) : (
                            <span className="w-6 h-4 rounded-sm bg-ink/10 inline-block" />
                          )}
                          <span className="font-medium">{team.name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center text-ink/60">{team.mp}</td>
                      <td className="px-2 py-2 text-center">{team.w}</td>
                      <td className="px-2 py-2 text-center">{team.d}</td>
                      <td className="px-2 py-2 text-center">{team.l}</td>
                      <td className="px-2 py-2 text-center text-ink/60">
                        {gd > 0 ? `+${gd}` : gd}
                      </td>
                      <td className="px-2 py-2 text-center font-bold">{pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
