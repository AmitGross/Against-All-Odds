import type { Prediction, MatchResult, BaseScoringResult } from "@/types/domain";
import { getOutcomeFromScore } from "./outcome";
import {
  SCORING_RULE_VERSION,
  EXACT_SCORE_POINTS,
  CORRECT_OUTCOME_POINTS,
  WRONG_POINTS,
} from "@/config/scoring";

// TODO: Implement knockout scoring once point rules are finalized

export function scoreGroupPrediction(
  prediction: Prediction,
  result: MatchResult
): BaseScoringResult {
  const predictedOutcome = getOutcomeFromScore(
    prediction.predictedHomeScore90,
    prediction.predictedAwayScore90
  );

  const wasExact =
    prediction.predictedHomeScore90 === result.homeScore90 &&
    prediction.predictedAwayScore90 === result.awayScore90;

  const wasOutcomeCorrect = predictedOutcome === result.outcome;

  let basePoints = WRONG_POINTS;
  if (wasExact) {
    basePoints = EXACT_SCORE_POINTS;
  } else if (wasOutcomeCorrect) {
    basePoints = CORRECT_OUTCOME_POINTS;
  }

  return {
    basePoints,
    globalPoints: basePoints,
    wasExact,
    wasOutcomeCorrect,
    ruleVersion: SCORING_RULE_VERSION,
  };
}
