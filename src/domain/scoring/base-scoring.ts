import type { Prediction, MatchResult, BaseScoringResult } from "@/types/domain";
import { getOutcomeFromScore } from "./outcome";
import {
  SCORING_RULE_VERSION,
  EXACT_SCORE_POINTS,
  CORRECT_OUTCOME_POINTS,
  WRONG_POINTS,
  KNOCKOUT_POINTS,
} from "@/config/scoring";

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

export function scoreKnockoutPrediction(
  prediction: Prediction,
  result: MatchResult,
  round: string
): BaseScoringResult {
  const points = KNOCKOUT_POINTS[round] ?? { exact: EXACT_SCORE_POINTS, outcome: CORRECT_OUTCOME_POINTS };

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
    basePoints = points.exact;
  } else if (wasOutcomeCorrect) {
    basePoints = points.outcome;
  }

  return {
    basePoints,
    globalPoints: basePoints,
    wasExact,
    wasOutcomeCorrect,
    ruleVersion: SCORING_RULE_VERSION,
  };
}
