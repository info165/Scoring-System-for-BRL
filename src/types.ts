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

// --- ROUND 1: BLOCK PUSH CHALLENGE ---
export type PushBlockStatus = 'none' | 'complete' | 'incomplete';

export interface BlockPushBlockEntry {
  weightId: string; // '200g' | '500g' | '700g' | '1kg' | '2kg' | '4kg'
  weightLabel: string;
  status: PushBlockStatus; // complete (100%), incomplete (50%), none (0%)
  pointsEarned: number;
}

export interface BlockPushScore {
  blocks: BlockPushBlockEntry[];
  blockScore: number;
  timeLeftSeconds: number; // 0 to 120s
  timeBonus: number; // 1 pt per unused sec
  finalScore: number; // blockScore + timeBonus
  calculatedScore: number; // backwards compatibility alias for finalScore
  penaltyPoints?: number; // 0 in official push rules
  isDraft: boolean;
  publishedAt?: string;
  notes?: string;
}

// --- ROUND 2: BLOCK PULL CHALLENGE ---
export interface BlockPullScore {
  pulledBlockIds: string[]; // IDs of weights successfully pulled
  blockScore: number; // sum of pulled block weights
  timeLeftSeconds: number; // 0 to 120s
  timeBonus: number; // 1 pt per unused sec
  boundaryTouches: number; // count >= 0
  boundaryPenalty: number; // boundaryTouches * 5
  finalScore: number; // Math.max(0, blockScore + timeBonus - boundaryPenalty)
  calculatedScore: number; // backwards compatibility alias
  penaltyPoints: number; // alias for boundaryPenalty
  isDraft: boolean;
  publishedAt?: string;
  notes?: string;
}

// --- ROUND 3: ROBO WAR ---
export type PitType = 'in_pit' | 'out_pit';
export type WarResult = 'team_a_win' | 'team_b_win' | 'draw' | 'pending';

export interface RobotWarMatch {
  id: string;
  matchNumber: number;
  teamAId: string;
  teamBId: string;
  result: WarResult;
  winnerId?: string | null;
  pitType?: PitType | null;
  timeLeftSeconds: number; // 0 to 90s
  multiplier?: number | null; // 3 for in-pit, 2 for out-pit
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
  oldScore?: number | null;
  newScore?: number;
  operatorNote?: string;
  details?: Record<string, any>;
}

export type LeaderboardFilter = 'all' | 1 | 2 | 3;

export interface CompetitionState {
  eventName: string;
  year: string;
  eventDate: string;
  status: CompetitionStatus;
  currentRound: 1 | 2 | 3;
  displayState: PublicDisplayState;
  leaderboardFilter: LeaderboardFilter;
  activeRobotWarMatchId: string | null;
  grandWinnerSchoolId: string | null;
  runQueue: Record<1 | 2, RunQueue>;
  schools: School[];
  scores: Record<string, TeamScoreRecord>; // keyed by schoolId
  robotWarMatches: RobotWarMatch[];
  auditLogs: AuditLogEntry[];
  lastUpdated: number;
}
