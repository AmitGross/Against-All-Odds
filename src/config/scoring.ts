export const SCORING_RULE_VERSION = "v1";

// Group stage points
export const EXACT_SCORE_POINTS = 3;
export const CORRECT_OUTCOME_POINTS = 1;
export const WRONG_POINTS = 0;

// Knockout round scoring: { exact, outcome }
export const KNOCKOUT_POINTS: Record<string, { exact: number; outcome: number }> = {
  r32:    { exact: 3,  outcome: 1 }, // Round of 32 — same as group stage
  r16:    { exact: 6,  outcome: 2 }, // Round of 16
  qf:     { exact: 9,  outcome: 3 }, // Quarter-finals
  sf:     { exact: 12, outcome: 4 }, // Semi-finals
  final:  { exact: 12, outcome: 4 }, // Final
  bronze: { exact: 12, outcome: 4 }, // 3rd place play-off
};
