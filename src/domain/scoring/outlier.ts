import type { Prediction, MatchResult, OutlierBonusResult } from "@/types/domain";
import { getOutcomeFromScore } from "./outcome";

/**
 * Evaluate the Outlier bonus for a single room and match.
 *
 * Rule: if exactly ONE member in the room predicted a different outcome
 * than every other member, and that prediction is correct, their base
 * points are doubled (bonus = base points).
 */
export function evaluateOutlierBonus(
  roomId: string,
  predictions: Array<{ prediction: Prediction; basePoints: number }>,
  result: MatchResult
): OutlierBonusResult | null {
  if (predictions.length < 2) return null;

  const outcomeCounts = new Map<string, Prediction[]>();

  for (const { prediction } of predictions) {
    const outcome = getOutcomeFromScore(
      prediction.predictedHomeScore90,
      prediction.predictedAwayScore90
    );
    const existing = outcomeCounts.get(outcome) ?? [];
    existing.push(prediction);
    outcomeCounts.set(outcome, existing);
  }

  // Find an outcome chosen by exactly one person
  let outlierPrediction: Prediction | null = null;
  for (const [, preds] of outcomeCounts) {
    if (preds.length === 1) {
      // Must also confirm every OTHER member chose a DIFFERENT outcome
      // (i.e. this is the only unique one among otherwise-unanimous others)
      const totalOthers = predictions.length - 1;
      const othersAgree = predictions.length - preds.length === totalOthers;
      if (othersAgree) {
        outlierPrediction = preds[0];
      }
      break;
    }
  }

  if (!outlierPrediction) return null;

  const outlierOutcome = getOutcomeFromScore(
    outlierPrediction.predictedHomeScore90,
    outlierPrediction.predictedAwayScore90
  );

  if (outlierOutcome !== result.outcome) return null;

  const entry = predictions.find(
    (p) => p.prediction.id === outlierPrediction!.id
  );

  return {
    roomId,
    userId: outlierPrediction.userId,
    predictionId: outlierPrediction.id,
    bonusPoints: entry?.basePoints ?? 0,
    applied: true,
  };
}
