export type MatchStage =
  | "group"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type MatchStatus = "scheduled" | "live" | "finished";

export type RoomJoinType = "password" | "invite_link";

export type MembershipRole = "owner" | "member";

export type MatchOutcome = "home_win" | "draw" | "away_win";

export interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  createdBy: string;
  joinType: RoomJoinType;
  inviteCode: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface RoomMembership {
  id: string;
  roomId: string;
  userId: string;
  role: MembershipRole;
  joinedAt: string;
}

export interface Team {
  id: string;
  code: string;
  name: string;
  flagUrl: string | null;
}

export interface Match {
  id: string;
  tournamentId: string;
  stage: MatchStage;
  groupName: string | null;
  homeTeamId: string;
  awayTeamId: string;
  startsAt: string;
  status: MatchStatus;
  homeScore90: number | null;
  awayScore90: number | null;
  homeScore120: number | null;
  awayScore120: number | null;
  penaltyWinnerTeamId: string | null;
  winningTeamId: string | null;
  isLocked: boolean;
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  predictedHomeScore90: number;
  predictedAwayScore90: number;
  predictedHomeScore120: number | null;
  predictedAwayScore120: number | null;
  predictedPenaltyWinnerTeamId: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface PredictionScore {
  predictionId: string;
  userId: string;
  matchId: string;
  basePoints: number;
  globalPoints: number;
  ruleVersion: string;
  scoredAt: string;
}

export interface RoomPredictionBonus {
  roomId: string;
  predictionId: string;
  userId: string;
  matchId: string;
  bonusType: "outlier";
  bonusPoints: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string | null;
  totalPoints: number;
  rank: number;
}

export interface RoomLeaderboardEntry extends LeaderboardEntry {
  roomId: string;
  basePoints: number;
  bonusPoints: number;
}

export interface MatchResult {
  matchId: string;
  outcome: MatchOutcome;
  homeScore90: number;
  awayScore90: number;
  homeScore120: number | null;
  awayScore120: number | null;
  penaltyWinnerTeamId: string | null;
}

export interface BaseScoringResult {
  basePoints: number;
  globalPoints: number;
  wasExact: boolean;
  wasOutcomeCorrect: boolean;
  ruleVersion: string;
}

export interface OutlierBonusResult {
  roomId: string;
  userId: string;
  predictionId: string;
  bonusPoints: number;
  applied: boolean;
}
