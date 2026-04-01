import type { MatchOutcome } from "@/types/domain";

export function getOutcomeFromScore(
  homeScore: number,
  awayScore: number
): MatchOutcome {
  if (homeScore > awayScore) return "home_win";
  if (homeScore < awayScore) return "away_win";
  return "draw";
}
