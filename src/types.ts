export type CompetitionStatus = 'not_started' | 'live' | 'paused' | 'completed';

export type PublicDisplayState = 
  | 'welcome' 
  | 'current_round' 
  | 'live_run' 
  | 'leaderboard' 
  | 'robot_war' 
  | 'winner';

export interface School {
  id: string;
  name: string;
  teamName: string;
  teamNumber: string; // e.g. "BRL-26-01"
  city: string;
  students: string[];
  logoUrl?: string;
  teamPhotoUrl?: string;
  isActive: boolean;
}

export interface BlockPushScore {
  weightTierId: string;
  weightCategoryLabel: string;
  basePoints: number;
  quantity: number;
  targetZone: 'outer' | 'middle' | 'bullseye';
  zoneMultiplier: number;
  timeSeconds?: number;
  bonusCleanRun: boolean;
  bonusSpeedRun: boolean;
  bonusPoints: number;
  penaltyBoundary: number;
  penaltyReset: number;
  penaltyPoints: number;
  calculatedScore: number;
  isDraft: boolean;
  publishedAt?: string;
  notes?: string;
}

export interface BlockPullScore {
  pullTierId: string;
  pullTierLabel: string;
  basePoints: number;
  distanceAchieved: 'full' | 'three_quarters' | 'half' | 'quarter';
  distanceMultiplier: number;
  timeSeconds?: number;
  bonusSpeed: boolean;
  bonusZeroSlip: boolean;
  bonusPoints: number;
  penaltyLineFoul: number;
  penaltyDisconnect: number;
  penaltyPoints: number;
  calculatedScore: number;
  isDraft: boolean;
  publishedAt?: string;
  notes?: string;
}

export type WarResult = 'team_a_win' | 'team_b_win' | 'draw' | 'pending';
export type WarWinType = 'knockout' | 'judges_decision' | 'draw' | 'disqualification';

export interface RobotWarMatch {
  id: string;
  matchNumber: number;
  teamAId: string;
  teamBId: string;
  result: WarResult;
  winType?: WarWinType;
  teamAPoints: number;
  teamBPoints: number;
  matchNotes?: string;
  status: 'scheduled' | 'live' | 'completed';
  isDraft: boolean;
  publishedAt?: string;
}

export interface TeamScoreRecord {
  schoolId: string;
  round1: BlockPushScore | null;
  round2: BlockPullScore | null;
  round3Score: number; // accumulated from published Robot War matches
  totalScore: number;
}

export interface RunQueue {
  currentSchoolId: string | null;
  queueSchoolIds: string[]; // upcoming
  completedSchoolIds: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  round: number;
  schoolName: string;
  teamName: string;
  action: string;
  oldScore?: number;
  newScore?: number;
  operatorNote?: string;
}

export interface CompetitionState {
  eventName: string;
  year: string;
  eventDate: string;
  status: CompetitionStatus;
  currentRound: 1 | 2 | 3;
  displayState: PublicDisplayState;
  activeRobotWarMatchId: string | null;
  grandWinnerSchoolId: string | null;
  runQueue: Record<1 | 2, RunQueue>;
  schools: School[];
  scores: Record<string, TeamScoreRecord>; // keyed by schoolId
  robotWarMatches: RobotWarMatch[];
  auditLogs: AuditLogEntry[];
  lastUpdated: number;
}
