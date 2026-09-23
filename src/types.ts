export type CompetitionStatus = 'not_started' | 'live' | 'paused' | 'completed';

export type PublicDisplayState = 
  | 'welcome' 
  | 'current_round' 
  | 'live_run' 
  | 'result_reveal'
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
  timeAllocatedSeconds?: number; // 120
  timeUsedSeconds?: number; // 120 - timeLeftSeconds
  timeLeftSeconds: number; // 0 to 120s
  timeBonus: number; // 1 pt per unused sec
  finalScore: number; // blockScore + timeBonus
  calculatedScore: number; // backwards compatibility alias for finalScore
  penaltyPoints?: number; // 0 in official push rules
  isDraft: boolean;
  publicationStatus?: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string;
  notes?: string;
  eventName?: string;
  year?: string;
  schoolName?: string;
  teamName?: string;
  teamNumber?: string;
}

export interface PublishedRunResult {
  round: 1 | 2 | 3;
  schoolId: string;
  schoolName: string;
  teamName: string;
  teamNumber: string;
  city: string;
  eventName: string;
  year: string;
  timeAllocated: number; // 120
  timeLeft: number; // e.g. 45
  timeUsed: number; // 120 - 45 = 75
  timeBonus: number; // 45
  penaltyPoints: number; // 0
  blockScore: number; // e.g. 70
  finalScore: number; // 115
  publicationStatus: 'PUBLISHED';
  publishedAt: string;
  blocks?: BlockPushBlockEntry[];
  round2Details?: {
    pulledBlocks: string[];
    boundaryTouches: number;
    boundaryPenalty: number;
  };
  round3Details?: {
    teamAName: string;
    teamBName: string;
    winnerName: string;
    pitType?: PitType | null;
    multiplier?: number | null;
  };
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

export type UserRole = 'ADMIN' | 'CONTROLLER' | 'EVALUATOR';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: string;
  lastLogin?: string;
  isActive?: boolean;
}

export type RunStatus = 'READY' | 'RUNNING' | 'STOPPED' | 'PUBLISHED';

export interface ActiveRunState {
  status: RunStatus;
  round: 1 | 2 | 3;
  schoolId: string | null;
  timeAllocated: number; // 120
  timeLeftSeconds: number; // 120 down to 0
  timeBonus: number;
  blockScore: number;
  finalScore: number;
  startTimestamp: number | null; // epoch ms
  stopTimestamp: number | null; // epoch ms
  blocks: Record<string, PushBlockStatus>;
  operatorNotes: string;
  isLockedForReview: boolean;
  manualTimeBonus: number | null;
  stoppedBy?: {
    email: string;
    displayName: string;
    role: string;
  };
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
  userEmail?: string;
  userName?: string;
  userRole?: string;
  details?: Record<string, any>;
}

export type LeaderboardFilter = 'all' | 1 | 2 | 3;

export type ArenaTimerStatus = 'idle' | 'running' | 'stopped' | 'time_over';

export interface ArenaTimerState {
  status: ArenaTimerStatus;
  totalDurationSeconds: number; // 120
  remainingSeconds: number; // 120 down to 0
  startTimestamp: number | null; // epoch ms
  stopTimestamp: number | null; // epoch ms
  round: 1 | 2 | 3;
  schoolId: string | null;
}

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
  arenaTimer?: ArenaTimerState;
  activeRun?: ActiveRunState;
  lastPublishedResult?: PublishedRunResult | null;
  lastUpdated: number;
  // Identifies the browser tab that made the most recent save, so Undo can tell its own saves from
  // changes made by anyone else.
  lastWriter?: string;
}
