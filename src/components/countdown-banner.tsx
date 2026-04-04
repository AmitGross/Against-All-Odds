import { createServerSupabaseClient } from "@/lib/supabase/server";
import NextMatchBanner from "./next-match-banner";

export default async function CountdownBanner() {
  try {
    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();

    // Find the earliest upcoming scheduled match
    const { data: first } = await supabase
      .from("matches")
      .select("starts_at")
      .eq("status", "scheduled")
      .gt("starts_at", now)
      .order("starts_at", { ascending: true })
      .limit(1)
      .single();

    if (!first) return null;

    // Fetch all matches that share that same start time
    const { data: matches } = await supabase
      .from("matches")
      .select(
        "id, starts_at, home_team:home_team_id(name, flag_url), away_team:away_team_id(name, flag_url)"
      )
      .eq("status", "scheduled")
      .eq("starts_at", first.starts_at);

    if (!matches || matches.length === 0) return null;

    const normalised = matches.map((m: any) => ({
      id: m.id as string,
      starts_at: m.starts_at as string,
      home_team: {
        name: m.home_team?.name ?? "TBD",
        flag_url: m.home_team?.flag_url ?? null,
      },
      away_team: {
        name: m.away_team?.name ?? "TBD",
        flag_url: m.away_team?.flag_url ?? null,
      },
    }));

    return <NextMatchBanner matches={normalised} />;
  } catch {
    return null;
  }
}
