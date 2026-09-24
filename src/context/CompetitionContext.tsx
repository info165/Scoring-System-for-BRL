import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  CompetitionState, 
  School, 
  BlockPushScore, 
  BlockPullScore, 
  RobotWarMatch, 
  CompetitionStatus, 
  PublicDisplayState,
  LeaderboardFilter,
  AuditLogEntry,
  PitType,
  ArenaTimerState,
  PublishedRunResult,
  ActiveRunState,
  PushBlockStatus,
  AppUser
} from '../types';
import { 
  OFFICIAL_BLOCK_WEIGHTS,
  BLOCK_PUSH_CONFIG,
  BLOCK_PULL_CONFIG,
  ROBO_WAR_CONFIG,
  calculateBlockPushScore,
  calculateBlockPullScore,
  calculateRoboWarScore
} from '../data/officialRules';
import { 
  initFirebaseAuth, 
  testConnection, 
  subscribeToCompetitionState, 
  saveCompetitionStateToFirestore,
  loadCompetitionStateFromServer,
  firebaseConfig
} from '../lib/firebase';

// Browser copies are namespaced by database, so a copy saved while pointing at one database can
// never be mistaken for (or pushed into) another.
const DB_KEY = firebaseConfig.firestoreDatabaseId || '(default)';
const STORAGE_KEY = `BRL_2026_COMPETITION_STATE_V3::${DB_KEY}`;
const SYNC_CHANNEL_NAME = `BRL_2026_SYNC_CHANNEL::${DB_KEY}`;

export type CloudStatus = 'loading' | 'ready' | 'error';

// Unique per open tab. Every save is stamped with it, which lets Undo detect changes made by anyone else.
const SESSION_ID: string =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'tab_' + Math.random().toString(36).slice(2) + Date.now().toString(36);

export interface LeaderboardRow {
  rank: number;
  isTied: boolean;
  tiedTeamCount: number;
  school: School;
  round1Score: number;
  round2Score: number;
  round3Score: number;
  totalScore: number;
  totalPenalties: number;
  hasPlayedAny: boolean;
  isCurrentPlaying: boolean;
}

interface CompetitionContextType {
  state: CompetitionState;
  leaderboard: LeaderboardRow[];
  hasActiveTie: boolean;
  cloudStatus: CloudStatus;
  cloudError: string | null;
  tiedRanks: number[];
  currentSchool: School | null;
  upNextSchool: School | null;
  followingSchool: School | null;
  activeRobotWarMatch: RobotWarMatch | null;
  grandWinner: { school: School; row: LeaderboardRow; isTiedWinner: boolean } | null;
  
  // Navigation / State controls
  setCurrentRound: (round: 1 | 2 | 3) => void;
  setDisplayState: (state: PublicDisplayState) => void;
  setLeaderboardFilter: (filter: LeaderboardFilter) => void;
  setCompetitionStatus: (status: CompetitionStatus) => void;
  
  // Queue Management
  advanceQueue: () => void;
  setCurrentTeamManually: (schoolId: string) => void;
  reorderQueue: (newQueueIds: string[]) => void;
  
  // Scoring Operations
  saveBlockPushDraft: (schoolId: string, scoreData: BlockPushScore) => void;
  publishBlockPushScore: (schoolId: string, scoreData: Omit<BlockPushScore, 'isDraft' | 'publishedAt'>) => void;
  discardDraftRun: (schoolId: string, round?: 1 | 2) => void;
  
  saveBlockPullDraft: (schoolId: string, scoreData: BlockPullScore) => void;
  publishBlockPullScore: (schoolId: string, scoreData: Omit<BlockPullScore, 'isDraft' | 'publishedAt'>) => void;
  
  // Robo War Operations
  createRobotWarMatch: (teamAId: string, teamBId: string, matchNotes?: string, challengerId?: string | null) => string;
  setMatchChallenger: (matchId: string, challengerId: string | null) => void;
  deleteRobotWarMatch: (matchId: string) => void;
  setActiveRobotWarMatch: (matchId: string | null) => void;
  saveRobotWarDraft: (matchId: string, result: 'team_a' | 'team_b' | 'draw', pitType: PitType | null, timeLeftSeconds: number, notes?: string) => void;
  publishRobotWarResult: (matchId: string, result: 'team_a' | 'team_b' | 'draw', pitType: PitType | null, timeLeftSeconds: number, notes?: string) => void;
  
  // School Master Data
  addSchool: (school: Omit<School, 'id'>) => void;
  editSchool: (id: string, updates: Partial<School>) => void;
  deleteSchool: (id: string) => void;
  clearAllSchools: () => void;
  
  // Winner Mode
  setGrandWinner: (schoolId: string | null) => void;
  triggerWinnerMode: (schoolId?: string) => void;
  exitWinnerMode: () => void;
  
  // Audits & Corrections
  correctScoreManually: (round: 1 | 2 | 3, schoolId: string, newScore: number, reason: string) => void;
  resetAllScores: () => void;
  importState: (newState: CompetitionState) => void;
  undoLastAction: () => Promise<void>;
  undoNotice: string | null;
  dismissUndoNotice: () => void;
  canUndo: boolean;
  
  // View mode helper
  isDisplayMode: boolean;
  setIsDisplayMode: (val: boolean) => void;

  // Live Arena Timer Synchronization
  arenaTimer: ArenaTimerState;
  startArenaTimer: (round?: 1 | 2 | 3, schoolId?: string, duration?: number, matchId?: string) => void;
  stopArenaTimer: (explicitTimeLeft?: number) => void;
  resetArenaTimer: (duration?: number, round?: 1 | 2 | 3, matchId?: string) => void;

  // Authoritative Active Run Controls (synced across controller, evaluator, and display)
  startActiveRun: (schoolId?: string, round?: 1 | 2 | 3, user?: AppUser) => void;
  updateActiveRunBlock: (weightId: string, status: PushBlockStatus, user?: AppUser) => void;
  stopActiveRun: (user?: AppUser, explicitTimeLeft?: number) => void;
  restartActiveRun: (schoolId?: string, round?: 1 | 2 | 3, user?: AppUser) => void;
  unlockActiveRunReview: () => void;

  // Cloud & Firebase Real-time Sync
  isFirebaseConnected: boolean;
  isFirebaseSyncing: boolean;
  lastCloudSync: string | null;
  forceCloudSync: () => Promise<void>;
}

export const DEFAULT_ACTIVE_RUN: ActiveRunState = {
  status: 'READY',
  round: 1,
  schoolId: null,
  timeAllocated: 120,
  timeLeftSeconds: 120,
  timeBonus: 0,
  blockScore: 0,
  finalScore: 0,
  startTimestamp: null,
  stopTimestamp: null,
  blocks: {
    '200g': 'none',
    '500g': 'none',
    '700g': 'none',
    '1kg': 'none',
    '2kg': 'none',
    '4kg': 'none'
  },
  operatorNotes: '',
  isLockedForReview: false,
  manualTimeBonus: null
};

export const DEFAULT_ARENA_TIMER: ArenaTimerState = {
  status: 'idle',
  totalDurationSeconds: 120,
  remainingSeconds: 120,
  startTimestamp: null,
  stopTimestamp: null,
  round: 1,
  schoolId: null
};

// The built-in starting point is an EMPTY tournament. It must never contain demo schools or
// scores: any code path that ends up writing this object to the cloud would otherwise
// replace real data with fake data.
const defaultInitialState: CompetitionState = {
  eventName: 'Bharat Robotics League',
  year: '2026',
  eventDate: '29 September 2026',
  status: 'live',
  currentRound: 1,
  displayState: 'live_run',
  leaderboardFilter: 'all',
  activeRobotWarMatchId: null,
  grandWinnerSchoolId: null,
  runQueue: {
    1: { currentSchoolId: null, queueSchoolIds: [], completedSchoolIds: [] },
    2: { currentSchoolId: null, queueSchoolIds: [], completedSchoolIds: [] }
  },
  schools: [],
  scores: {},
  robotWarMatches: [],
  auditLogs: [],
  arenaTimer: DEFAULT_ARENA_TIMER,
  activeRun: DEFAULT_ACTIVE_RUN,
  lastPublishedResult: null,
  lastUpdated: 0
};

// Round 1 block rows can arrive with only weightId + status; fill in the label and points
// so every screen (HDMI result, history, exports) reads the same complete shape.
const normalizeBlockEntries = (blocks: any[] | undefined): BlockPushScore['blocks'] =>
  (blocks || []).map((b) => {
    const def = OFFICIAL_BLOCK_WEIGHTS.find(w => w.id === b.weightId);
    const status = b.status || 'none';
    const pointsEarned = def
      ? (status === 'complete' ? def.fullPoints : status === 'incomplete' ? def.incompletePoints : 0)
      : (b.pointsEarned ?? b.pointsAwarded ?? 0);
    return {
      weightId: b.weightId,
      weightLabel: def?.label || b.weightLabel || b.weightId,
      status,
      pointsEarned
    };
  });

// An official (published) Round 1 score must never be overwritten by an in-progress run. While a team
// is being re-run, the run lives only in activeRun; the official score is replaced only when the new
// score is explicitly published.
const hasPublishedRound1 = (scores: CompetitionState['scores'], schoolId: string | null | undefined): boolean =>
  !!schoolId && !!scores[schoolId]?.round1 && !scores[schoolId]!.round1!.isDraft;

// ---- Round 3 challenger rule -------------------------------------------------------------
// In a challenger match the challenger (the team playing for the second time) never earns points,
// whatever the result; only the other team can score. A team's Round 3 score is always worked out
// from all of its matches, so a later challenger match can never remove points from its first one.
const recordedRound3Points = (
  match: { teamAId: string; teamBId: string; challengerId?: string | null },
  teamAPoints: number,
  teamBPoints: number
) => ({
  teamAPoints: match.challengerId && match.challengerId === match.teamAId ? 0 : teamAPoints,
  teamBPoints: match.challengerId && match.challengerId === match.teamBId ? 0 : teamBPoints
});

const round3PointsFor = (schoolId: string, matches: RobotWarMatch[]): number =>
  matches.reduce((sum, m) => {
    if (m.status !== 'completed' || m.isDraft || m.challengerId === schoolId) return sum;
    if (m.teamAId === schoolId) return sum + (m.teamAPoints || 0);
    if (m.teamBId === schoolId) return sum + (m.teamBPoints || 0);
    return sum;
  }, 0);

const rebuildRound3Scores = (
  scores: CompetitionState['scores'],
  matches: RobotWarMatch[],
  schoolIds: string[]
): CompetitionState['scores'] => {
  const updated = { ...scores };
  schoolIds.forEach((schoolId) => {
    const current = updated[schoolId] || { schoolId, round1: null, round2: null, round3Score: 0, totalScore: 0 };
    const r1 = current.round1 && !current.round1.isDraft ? current.round1.finalScore : 0;
    const r2 = current.round2 && !current.round2.isDraft ? current.round2.finalScore : 0;
    const r3 = round3PointsFor(schoolId, matches);
    updated[schoolId] = { ...current, round3Score: r3, totalScore: r1 + r2 + r3 };
  });
  return updated;
};

const CompetitionContext = createContext<CompetitionContextType | null>(null);

export const CompetitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDisplayMode, setIsDisplayMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('mode') === 'display' || window.location.hash === '#display';
    }
    return false;
  });

  const [state, setState] = useState<CompetitionState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.eventName && parsed.schools) {
            return parsed;
          }
        }
      } catch (err) {
        console.error('Failed to parse saved state:', err);
      }
    }
    return defaultInitialState;
  });

  const [historyStack, setHistoryStack] = useState<CompetitionState[]>([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(false);
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);

  // The database is the single source of truth. Nothing may be written until the tournament
  // record has been read successfully, so a slow or failed read can never push local or
  // starter data over the real tournament.
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('loading');
  const [cloudError, setCloudError] = useState<string | null>(null);
  const cloudReadyRef = useRef<boolean>(false);

  // Undo safety. History snapshots are only valid while every save since them was made by this tab.
  const historyLenRef = useRef<number>(0);
  historyLenRef.current = historyStack.length;
  const lastSaveRef = useRef<Promise<void>>(Promise.resolve());
  const [undoNotice, setUndoNotice] = useState<string | null>(null);
  const undoNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showUndoNotice = useCallback((message: string) => {
    setUndoNotice(message);
    if (undoNoticeTimerRef.current) clearTimeout(undoNoticeTimerRef.current);
    undoNoticeTimerRef.current = setTimeout(() => setUndoNotice(null), 9000);
  }, []);

  const dismissUndoNotice = useCallback(() => {
    if (undoNoticeTimerRef.current) clearTimeout(undoNoticeTimerRef.current);
    setUndoNotice(null);
  }, []);

  // Someone else changed the data: every older history snapshot now predates their change, so
  // restoring one would wipe it out. Drop them all and tell the operator why Undo went away.
  const invalidateUndo = useCallback(() => {
    if (historyLenRef.current > 0) {
      showUndoNotice('Undo is no longer available: someone else changed the data after your last action, so it cannot be undone safely.');
    }
    setHistoryStack([]);
  }, [showUndoNotice]);

  // Always holds the newest committed state, even between renders.
  const stateRef = useRef<CompetitionState>(state);
  stateRef.current = state;

  const commitState = useCallback((newState: CompetitionState, allowUndo: boolean = true) => {
    if (!cloudReadyRef.current) {
      console.warn('Change ignored: not connected to the database yet, so nothing was saved.');
      return;
    }
    // Callers build newState from the render-time `state`. When several handlers commit in the
    // same tick, the later ones would overwrite the earlier ones with stale data. Apply only the
    // top-level fields this caller actually changed on top of the latest committed state.
    const merged: CompetitionState = { ...stateRef.current };
    (Object.keys(newState) as (keyof CompetitionState)[]).forEach((key) => {
      if (newState[key] !== state[key]) {
        (merged as any)[key] = newState[key];
      }
    });
    const stateWithTimestamp: CompetitionState = {
      ...merged,
      lastUpdated: Date.now(),
      lastWriter: SESSION_ID
    };
    stateRef.current = stateWithTimestamp;

    if (allowUndo) {
      setHistoryStack(prev => [...prev.slice(-15), state]);
    }
    setState(stateWithTimestamp);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
        const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.postMessage({ type: 'BRL_STATE_UPDATE', state: stateWithTimestamp });
        channel.close();
      } catch (e) {
        console.error('Broadcast / storage error:', e);
      }
    }

    // Synchronize to Firestore database in real-time
    setIsFirebaseSyncing(true);
    // Remembered so Undo can wait for this save to finish before it checks the database.
    lastSaveRef.current = saveCompetitionStateToFirestore(stateWithTimestamp)
      .then(() => {
        setIsFirebaseConnected(true);
        setIsFirebaseSyncing(false);
        setLastCloudSync(new Date().toLocaleTimeString());
      })
      .catch((err) => {
        console.warn('Real-time Firestore sync error:', err);
        setIsFirebaseSyncing(false);
      });
  }, [state]);

  const forceCloudSync = useCallback(async () => {
    if (!cloudReadyRef.current) return;
    setIsFirebaseSyncing(true);
    try {
      // Look before writing: if the database holds newer data than this screen, take it instead of
      // overwriting it, and if the read fails write nothing at all.
      const result = await loadCompetitionStateFromServer();
      if (result.kind === 'error') {
        console.warn('Sync skipped, the database could not be read:', result.message);
        return;
      }
      if (result.kind === 'found' && (result.data.lastUpdated || 0) > (stateRef.current.lastUpdated || 0)) {
        if (result.data.lastWriter !== SESSION_ID) invalidateUndo();
        stateRef.current = result.data;
        setState(result.data);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
        } catch (err) {
          console.warn('Local storage cache failed:', err);
        }
      } else {
        await saveCompetitionStateToFirestore({ ...stateRef.current, lastWriter: SESSION_ID });
      }
      setIsFirebaseConnected(true);
      setLastCloudSync(new Date().toLocaleTimeString());
    } finally {
      setIsFirebaseSyncing(false);
    }
  }, [invalidateUndo]);

  // Firebase Auth initialization & real-time Firestore database sync
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    initFirebaseAuth()
      .then((user) => {
        if (user) setIsFirebaseConnected(true);
        return testConnection();
      })
      .then((connected) => {
        if (connected) setIsFirebaseConnected(true);
      })
      .catch((err) => {
        console.warn('Firebase connection check:', err);
      });

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // Adopt the database's tournament record as the working state and allow edits from now on.
    // `null` means the server confirmed there is no record yet: start empty; the first real edit
    // creates it. Local or starter data is never written to the cloud on its own.
    const adoptCloud = (data: CompetitionState | null) => {
      const next: CompetitionState = data ?? { ...defaultInitialState };
      stateRef.current = next;
      cloudReadyRef.current = true;
      setState(next);
      setCloudError(null);
      setCloudStatus('ready');
      setIsFirebaseConnected(true);
      setLastCloudSync(new Date().toLocaleTimeString());
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Local storage cache failed:', err);
      }
    };

    const loadFromCloud = async () => {
      if (cancelled || cloudReadyRef.current) return;
      const result = await loadCompetitionStateFromServer();
      if (cancelled || cloudReadyRef.current) return;
      if (result.kind === 'found') {
        adoptCloud(result.data);
      } else if (result.kind === 'missing') {
        adoptCloud(null);
      } else {
        // Could not read the database: stay read-only and keep retrying. Never write.
        console.warn('Cannot read the tournament record yet:', result.message);
        setCloudError(result.message);
        setCloudStatus('error');
        retryTimer = setTimeout(loadFromCloud, 4000);
      }
    };
    loadFromCloud();

    // Listen to real-time updates from Firebase Firestore across all operators and screens
    unsubscribe = subscribeToCompetitionState(
      (cloudState) => {
        if (!cloudReadyRef.current) {
          adoptCloud(cloudState);
          return;
        }
        const current = stateRef.current;
        if (cloudState.lastUpdated && current.lastUpdated && cloudState.lastUpdated <= current.lastUpdated) {
          return;
        }
        // A save made by anyone other than this tab invalidates this tab's Undo history.
        if (cloudState.lastWriter !== SESSION_ID) invalidateUndo();
        stateRef.current = cloudState;
        setState(cloudState);
        setIsFirebaseConnected(true);
        setLastCloudSync(new Date().toLocaleTimeString());
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
          } catch (err) {
            console.warn('Local storage cache failed:', err);
          }
        }
      },
      (error) => {
        console.warn('Firestore subscription status:', error.message);
      }
    );

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Live multi-window synchronization via BroadcastChannel and StorageEvent
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // A copy from another tab is only adopted once this tab has read the database itself, and only
    // when it is strictly newer than what this tab already has. An older or unverified copy must
    // never replace the current state, because the next edit would then save it to the cloud.
    const adoptIfNewer = (incoming: CompetitionState | null | undefined) => {
      if (!cloudReadyRef.current || !incoming || !incoming.lastUpdated) return;
      if (incoming.lastUpdated <= (stateRef.current.lastUpdated || 0)) return;
      // Another tab's save is somebody else's change as far as this tab's Undo is concerned.
      if (incoming.lastWriter !== SESSION_ID) invalidateUndo();
      stateRef.current = incoming;
      setState(incoming);
    };

    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data?.type === 'BRL_STATE_UPDATE' && event.data.state) {
        adoptIfNewer(event.data.state);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          adoptIfNewer(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Storage sync parse failed', err);
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // -------------------------------------------------------------------------
  // OFFICIAL LEADERBOARD CALCULATION
  // RULE: DO NOT invent or assume a tie-break rule.
  // Sort primarily by Total Score. If two or more teams share the same Total Score,
  // DO NOT arbitrarily split them: they share the exact same rank, are flagged with
  // isTied: true, and must be visually surfaced for referee/organizer decision!
  // -------------------------------------------------------------------------
  const { leaderboard, hasActiveTie, tiedRanks } = useMemo(() => {
    const roundKey: 1 | 2 = state.currentRound === 3 ? 1 : state.currentRound;
    const currentQueue = state.runQueue[roundKey];
    const currentPlayingId = currentQueue?.currentSchoolId;

    // Collect each team's score record
    const rows = state.schools
      .filter(s => s.isActive)
      .map(school => {
        const scoreRecord = state.scores[school.id];
        const r1Score = (scoreRecord?.round1 && !scoreRecord.round1.isDraft) ? scoreRecord.round1.finalScore : 0;
        const r2Score = (scoreRecord?.round2 && !scoreRecord.round2.isDraft) ? scoreRecord.round2.finalScore : 0;
        const r3Score = scoreRecord?.round3Score || 0;
        const total = r1Score + r2Score + r3Score;

        const r2Penalties = (scoreRecord?.round2 && !scoreRecord.round2.isDraft) ? scoreRecord.round2.boundaryPenalty : 0;
        const hasPlayedAny = (r1Score > 0 || r2Score > 0 || r3Score > 0 || !!scoreRecord?.round1 || !!scoreRecord?.round2);

        return {
          rank: 0,
          isTied: false,
          tiedTeamCount: 1,
          school,
          round1Score: r1Score,
          round2Score: r2Score,
          round3Score: r3Score,
          totalScore: total,
          totalPenalties: r2Penalties,
          hasPlayedAny,
          isCurrentPlaying: school.id === currentPlayingId
        };
      });

    // Primary sort: Total Score descending.
    // Secondary: keep order stable alphabetically by school name so identical scores stay grouped.
    rows.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.school.name.localeCompare(b.school.name);
    });

    // Assign ranks with explicit TIE detection (Standard Competition Ranking 1224)
    const tiedRankSet = new Set<number>();
    let currentRank = 1;

    for (let i = 0; i < rows.length; i++) {
      if (i > 0 && rows[i].totalScore === rows[i - 1].totalScore) {
        rows[i].rank = rows[i - 1].rank;
      } else {
        rows[i].rank = currentRank;
      }
      currentRank++;
    }

    // Now count occurrences of each rank to flag ties (only if score > 0 or hasPlayedAny to avoid unplayed 0-pt spam)
    const rankCounts: Record<number, number> = {};
    rows.forEach(r => {
      if (r.hasPlayedAny && r.totalScore > 0) {
        rankCounts[r.rank] = (rankCounts[r.rank] || 0) + 1;
      }
    });

    rows.forEach(r => {
      const count = rankCounts[r.rank] || 1;
      if (count > 1) {
        r.isTied = true;
        r.tiedTeamCount = count;
        tiedRankSet.add(r.rank);
      }
    });

    return {
      leaderboard: rows,
      hasActiveTie: tiedRankSet.size > 0,
      tiedRanks: Array.from(tiedRankSet).sort((a, b) => a - b)
    };
  }, [state.schools, state.scores, state.currentRound, state.runQueue]);

  // Active queue entities
  const activeQueue = state.runQueue[state.currentRound === 3 ? 1 : state.currentRound] || {
    currentSchoolId: null,
    queueSchoolIds: [],
    completedSchoolIds: []
  };

  const currentSchool = useMemo(() => {
    return state.schools.find(s => s.id === activeQueue.currentSchoolId) || null;
  }, [state.schools, activeQueue.currentSchoolId]);

  const upNextSchool = useMemo(() => {
    const nextId = activeQueue.queueSchoolIds[0];
    return state.schools.find(s => s.id === nextId) || null;
  }, [state.schools, activeQueue.queueSchoolIds]);

  const followingSchool = useMemo(() => {
    const folId = activeQueue.queueSchoolIds[1];
    return state.schools.find(s => s.id === folId) || null;
  }, [state.schools, activeQueue.queueSchoolIds]);

  const activeRobotWarMatch = useMemo(() => {
    return state.robotWarMatches.find(m => m.id === state.activeRobotWarMatchId) || state.robotWarMatches[0] || null;
  }, [state.robotWarMatches, state.activeRobotWarMatchId]);

  const grandWinner = useMemo(() => {
    if (leaderboard.length === 0) return null;

    if (state.grandWinnerSchoolId) {
      const found = leaderboard.find(l => l.school.id === state.grandWinnerSchoolId);
      if (found) {
        return { school: found.school, row: found, isTiedWinner: found.isTied && found.rank === 1 };
      }
    }
    const topRow = leaderboard[0];
    return {
      school: topRow.school,
      row: topRow,
      isTiedWinner: topRow.isTied && topRow.rank === 1
    };
  }, [state.grandWinnerSchoolId, leaderboard]);

  // Navigation controls
  const setCurrentRound = useCallback((round: 1 | 2 | 3) => {
    commitState({
      ...state,
      currentRound: round,
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const setDisplayState = useCallback((displayState: PublicDisplayState) => {
    commitState({
      ...state,
      displayState,
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const setLeaderboardFilter = useCallback((leaderboardFilter: LeaderboardFilter) => {
    commitState({
      ...state,
      leaderboardFilter,
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const setCompetitionStatus = useCallback((status: CompetitionStatus) => {
    commitState({
      ...state,
      status,
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  // Queue Advance ("NEXT TEAM")
  const advanceQueue = useCallback(() => {
    const roundKey: 1 | 2 = state.currentRound === 3 ? 1 : state.currentRound;
    const currentQ = state.runQueue[roundKey];
    if (!currentQ) return;

    // Nobody is playing yet (fresh start or after a reset): bring the first queued team on.
    if (!currentQ.currentSchoolId) {
      const [first, ...rest] = currentQ.queueSchoolIds;
      if (!first) return;
      commitState({
        ...state,
        runQueue: {
          ...state.runQueue,
          [roundKey]: { ...currentQ, currentSchoolId: first, queueSchoolIds: rest }
        },
        lastUpdated: Date.now()
      });
      return;
    }

    const oldCurrent = currentQ.currentSchoolId;
    const nextCurrent = currentQ.queueSchoolIds[0] || null;
    const remainingQueue = currentQ.queueSchoolIds.slice(1);

    // Only mark a team "completed" once they actually have a published score for
    // this round. If the operator hits Next Team before publishing (e.g. skipping
    // a team temporarily), send them back to the end of the queue instead of
    // silently marking them done with no score.
    const scoreRecord = state.scores[oldCurrent];
    const isScored = roundKey === 1
      ? !!(scoreRecord?.round1 && !scoreRecord.round1.isDraft)
      : !!(scoreRecord?.round2 && !scoreRecord.round2.isDraft);

    const newCompleted = isScored
      ? [...currentQ.completedSchoolIds.filter(id => id !== oldCurrent), oldCurrent]
      : currentQ.completedSchoolIds.filter(id => id !== oldCurrent);
    const newQueue = isScored
      ? remainingQueue
      : [...remainingQueue, oldCurrent];

    const currentSchoolObj = state.schools.find(s => s.id === oldCurrent);
    const nextSchoolObj = state.schools.find(s => s.id === nextCurrent);

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: state.currentRound,
      schoolName: currentSchoolObj?.name || 'Unknown',
      teamName: currentSchoolObj?.teamName || '',
      action: isScored
        ? `Next Team advanced: Now playing is ${nextSchoolObj?.name || 'End of Queue'}`
        : `Next Team advanced (${currentSchoolObj?.name || 'previous team'} skipped without a score, returned to end of queue): Now playing is ${nextSchoolObj?.name || 'End of Queue'}`
    };

    const nextArenaTimer: ArenaTimerState = {
      status: 'idle',
      totalDurationSeconds: 120,
      remainingSeconds: 120,
      startTimestamp: null,
      stopTimestamp: null,
      round: state.currentRound,
      schoolId: nextCurrent
    };

    const nextActiveRun: ActiveRunState = {
      status: 'READY',
      round: state.currentRound,
      schoolId: nextCurrent,
      timeAllocated: 120,
      timeLeftSeconds: 120,
      timeBonus: 0,
      blockScore: 0,
      finalScore: 0,
      startTimestamp: null,
      stopTimestamp: null,
      blocks: {
        '200g': 'none',
        '500g': 'none',
        '700g': 'none',
        '1kg': 'none',
        '2kg': 'none',
        '4kg': 'none'
      },
      operatorNotes: '',
      isLockedForReview: false,
      manualTimeBonus: null,
      stoppedBy: undefined
    };

    commitState({
      ...state,
      displayState: 'live_run',
      lastPublishedResult: null,
      activeRun: nextActiveRun,
      runQueue: {
        ...state.runQueue,
        [roundKey]: {
          currentSchoolId: nextCurrent,
          queueSchoolIds: newQueue,
          completedSchoolIds: newCompleted
        }
      },
      arenaTimer: nextArenaTimer,
      auditLogs: [log, ...state.auditLogs.slice(0, 49)],
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const setCurrentTeamManually = useCallback((schoolId: string) => {
    const roundKey: 1 | 2 = state.currentRound === 3 ? 1 : state.currentRound;
    const currentQ = state.runQueue[roundKey];
    if (!currentQ) return;

    // The team being replaced must not disappear: a scored team is completed, an unscored one
    // goes back to the front of the queue.
    const previous = currentQ.currentSchoolId;
    const prevRecord = previous ? state.scores[previous] : null;
    const prevScored = previous
      ? !!(roundKey === 1
          ? prevRecord?.round1 && !prevRecord.round1.isDraft
          : prevRecord?.round2 && !prevRecord.round2.isDraft)
      : false;
    const returning = previous && previous !== schoolId;

    // Picking a completed team again is a re-run: it leaves the completed list.
    const completed = currentQ.completedSchoolIds.filter(id => id !== schoolId);
    let queue = currentQ.queueSchoolIds.filter(id => id !== schoolId);
    if (returning && previous) {
      if (prevScored) {
        if (!completed.includes(previous)) completed.push(previous);
      } else if (!queue.includes(previous)) {
        queue = [previous, ...queue];
      }
    }

    commitState({
      ...state,
      runQueue: {
        ...state.runQueue,
        [roundKey]: {
          ...currentQ,
          currentSchoolId: schoolId,
          queueSchoolIds: queue,
          completedSchoolIds: completed
        }
      },
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const reorderQueue = useCallback((newQueueIds: string[]) => {
    const roundKey: 1 | 2 = state.currentRound === 3 ? 1 : state.currentRound;
    commitState({
      ...state,
      runQueue: {
        ...state.runQueue,
        [roundKey]: {
          ...state.runQueue[roundKey],
          queueSchoolIds: newQueueIds
        }
      },
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  // Round 1 (Robo Push) - Draft vs Publish
  const saveBlockPushDraft = useCallback((schoolId: string, scoreData: BlockPushScore) => {
    if (hasPublishedRound1(state.scores, schoolId)) return;
    const teamScore = state.scores[schoolId] || {
      schoolId,
      round1: null,
      round2: null,
      round3Score: 0,
      totalScore: 0
    };

    commitState({
      ...state,
      scores: {
        ...state.scores,
        [schoolId]: {
          ...teamScore,
          round1: {
            ...scoreData,
            blocks: normalizeBlockEntries(scoreData.blocks),
            isDraft: true
          }
        }
      },
      lastUpdated: Date.now()
    }, false);
  }, [state, commitState]);

  const publishBlockPushScore = useCallback((schoolId: string, scoreData: Omit<BlockPushScore, 'isDraft' | 'publishedAt'>) => {
    const school = state.schools.find(s => s.id === schoolId);
    const existing = state.scores[schoolId];
    const oldScore = (existing?.round1 && !existing.round1.isDraft) ? existing.round1.finalScore : 0;
    const nowIso = new Date().toISOString();
    
    const publishedScore: BlockPushScore = {
      ...scoreData,
      blocks: normalizeBlockEntries(scoreData.blocks),
      calculatedScore: scoreData.finalScore,
      timeAllocatedSeconds: 120,
      timeUsedSeconds: Math.max(0, 120 - scoreData.timeLeftSeconds),
      publicationStatus: 'PUBLISHED',
      isDraft: false,
      publishedAt: nowIso,
      eventName: state.eventName || 'Bharat Robotics League',
      year: state.year || '2026',
      schoolName: school?.name,
      teamName: school?.teamName,
      teamNumber: school?.teamNumber
    };

    const r2 = (existing?.round2 && !existing.round2.isDraft) ? existing.round2.finalScore : 0;
    const r3 = existing?.round3Score || 0;
    const newTotal = publishedScore.finalScore + r2 + r3;

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: 1,
      schoolName: school?.name || 'Unknown',
      teamName: school?.teamName || '',
      action: oldScore > 0 
        ? `Robo Push score corrected: ${oldScore} → ${publishedScore.finalScore}`
        : `Robo Push score published: ${publishedScore.finalScore} (Blocks: ${publishedScore.blockScore}, Time Bonus: ${publishedScore.timeBonus})`,
      oldScore: oldScore > 0 ? oldScore : null,
      newScore: publishedScore.finalScore,
      operatorNote: publishedScore.notes
    };

    const publishedResult: PublishedRunResult = {
      round: 1,
      schoolId,
      schoolName: school?.name || 'Unknown School',
      teamName: school?.teamName || 'Unknown Team',
      teamNumber: school?.teamNumber || '',
      city: school?.city || '',
      eventName: state.eventName || 'Bharat Robotics League',
      year: state.year || '2026',
      timeAllocated: 120,
      timeLeft: publishedScore.timeLeftSeconds,
      timeUsed: Math.max(0, 120 - publishedScore.timeLeftSeconds),
      timeBonus: publishedScore.timeBonus,
      penaltyPoints: 0,
      blockScore: publishedScore.blockScore,
      finalScore: publishedScore.finalScore,
      publicationStatus: 'PUBLISHED',
      publishedAt: nowIso,
      blocks: publishedScore.blocks
    };

    const publishedRun: ActiveRunState = {
      ...(state.activeRun || DEFAULT_ACTIVE_RUN),
      status: 'PUBLISHED',
      finalScore: publishedScore.finalScore,
      blockScore: publishedScore.blockScore,
      timeBonus: publishedScore.timeBonus,
      timeLeftSeconds: publishedScore.timeLeftSeconds,
      isLockedForReview: true
    };

    commitState({
      ...state,
      displayState: 'result_reveal',
      lastPublishedResult: publishedResult,
      activeRun: publishedRun,
      scores: {
        ...state.scores,
        [schoolId]: {
          schoolId,
          round1: publishedScore,
          round2: existing?.round2 || null,
          round3Score: r3,
          totalScore: newTotal
        }
      },
      auditLogs: [log, ...state.auditLogs.slice(0, 49)],
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  // Discard draft run without writing to database or creating audit records
  const discardDraftRun = useCallback((schoolId: string, round: 1 | 2 = 1) => {
    const existing = state.scores[schoolId];
    const roundKey = round === 1 ? 'round1' : 'round2';
    const currentScore = existing ? existing[roundKey] : null;

    let updatedScores = { ...state.scores };
    if (currentScore && currentScore.isDraft) {
      updatedScores[schoolId] = {
        ...existing,
        [roundKey]: null
      };
    }

    const resetTimer: ArenaTimerState = {
      status: 'idle',
      totalDurationSeconds: 120,
      remainingSeconds: 120,
      startTimestamp: null,
      stopTimestamp: null,
      round: state.currentRound,
      schoolId
    };

    const resetRun: ActiveRunState = {
      status: 'READY',
      round: state.currentRound,
      schoolId,
      timeAllocated: 120,
      timeLeftSeconds: 120,
      timeBonus: 0,
      blockScore: 0,
      finalScore: 0,
      startTimestamp: null,
      stopTimestamp: null,
      blocks: {
        '200g': 'none',
        '500g': 'none',
        '700g': 'none',
        '1kg': 'none',
        '2kg': 'none',
        '4kg': 'none'
      },
      operatorNotes: '',
      isLockedForReview: false,
      manualTimeBonus: null,
      stoppedBy: undefined
    };

    commitState({
      ...state,
      scores: updatedScores,
      arenaTimer: resetTimer,
      activeRun: resetRun,
      lastUpdated: Date.now()
    }, false);
  }, [state, commitState]);

  // Round 2 (Robo Pull) - Draft vs Publish
  const saveBlockPullDraft = useCallback((schoolId: string, scoreData: BlockPullScore) => {
    const teamScore = state.scores[schoolId] || {
      schoolId,
      round1: null,
      round2: null,
      round3Score: 0,
      totalScore: 0
    };

    commitState({
      ...state,
      scores: {
        ...state.scores,
        [schoolId]: {
          ...teamScore,
          round2: {
            ...scoreData,
            isDraft: true
          }
        }
      },
      lastUpdated: Date.now()
    }, false);
  }, [state, commitState]);

  const publishBlockPullScore = useCallback((schoolId: string, scoreData: Omit<BlockPullScore, 'isDraft' | 'publishedAt'>) => {
    const school = state.schools.find(s => s.id === schoolId);
    const existing = state.scores[schoolId];
    const oldScore = (existing?.round2 && !existing.round2.isDraft) ? existing.round2.finalScore : 0;
    
    const publishedScore: BlockPullScore = {
      ...scoreData,
      isDraft: false,
      publishedAt: new Date().toISOString()
    };

    const r1 = (existing?.round1 && !existing.round1.isDraft) ? existing.round1.finalScore : 0;
    const r3 = existing?.round3Score || 0;
    const newTotal = r1 + publishedScore.finalScore + r3;

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: 2,
      schoolName: school?.name || 'Unknown',
      teamName: school?.teamName || '',
      action: oldScore > 0 
        ? `Robo Pull score corrected: ${oldScore} → ${publishedScore.finalScore}` 
        : `Robo Pull score published: ${publishedScore.finalScore} (Blocks: ${publishedScore.blockScore}, Bonus: ${publishedScore.timeBonus}, Penalty: ${publishedScore.boundaryPenalty})`,
      oldScore: oldScore > 0 ? oldScore : null,
      newScore: publishedScore.finalScore,
      operatorNote: publishedScore.notes
    };

    const publishedResult: PublishedRunResult = {
      round: 2,
      schoolId,
      schoolName: school?.name || 'Unknown School',
      teamName: school?.teamName || 'Unknown Team',
      teamNumber: school?.teamNumber || '',
      city: school?.city || '',
      eventName: state.eventName || 'Bharat Robotics League',
      year: state.year || '2026',
      timeAllocated: 120,
      timeLeft: publishedScore.timeLeftSeconds,
      timeUsed: Math.max(0, 120 - publishedScore.timeLeftSeconds),
      timeBonus: publishedScore.timeBonus,
      penaltyPoints: publishedScore.boundaryPenalty,
      blockScore: publishedScore.blockScore,
      finalScore: publishedScore.finalScore,
      publicationStatus: 'PUBLISHED',
      publishedAt: publishedScore.publishedAt || new Date().toISOString(),
      round2Details: {
        pulledBlocks: publishedScore.pulledBlockIds,
        boundaryTouches: publishedScore.boundaryTouches,
        boundaryPenalty: publishedScore.boundaryPenalty
      }
    };

    commitState({
      ...state,
      displayState: 'result_reveal',
      lastPublishedResult: publishedResult,
      scores: {
        ...state.scores,
        [schoolId]: {
          schoolId,
          round1: existing?.round1 || null,
          round2: publishedScore,
          round3Score: r3,
          totalScore: newTotal
        }
      },
      auditLogs: [log, ...state.auditLogs.slice(0, 49)],
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  // Round 3 (Robo War)
  const createRobotWarMatch = useCallback((teamAId: string, teamBId: string, matchNotes?: string, challengerId?: string | null): string => {
    const newId = `match_${Date.now()}`;
    const newMatch: RobotWarMatch = {
      id: newId,
      matchNumber: state.robotWarMatches.length + 1,
      teamAId,
      teamBId,
      result: 'pending',
      timeLeftSeconds: 0,
      teamAPoints: 0,
      teamBPoints: 0,
      status: 'scheduled',
      isDraft: false,
      challengerId: challengerId && (challengerId === teamAId || challengerId === teamBId) ? challengerId : null,
      matchNotes: matchNotes || `Arena Match #${state.robotWarMatches.length + 1}`
    };

    commitState({
      ...state,
      robotWarMatches: [...state.robotWarMatches, newMatch],
      activeRobotWarMatchId: newId,
      lastUpdated: Date.now()
    });
    return newId;
  }, [state, commitState]);

  const setMatchChallenger = useCallback((matchId: string, challengerId: string | null) => {
    const match = state.robotWarMatches.find(m => m.id === matchId);
    if (!match) return;
    if (challengerId && challengerId !== match.teamAId && challengerId !== match.teamBId) return;

    let updatedMatches = state.robotWarMatches.map(m => (m.id === matchId ? { ...m, challengerId } : m));

    // A match that already has a result gets its recorded points, and both teams' totals, redone.
    const target = updatedMatches.find(m => m.id === matchId)!;
    if (target.result !== 'pending') {
      const key = target.result === 'team_a_win' ? 'team_a' : target.result === 'team_b_win' ? 'team_b' : 'draw';
      const calc = calculateRoboWarScore(key, key === 'draw' ? null : (target.pitType ?? null), target.timeLeftSeconds);
      const rec = recordedRound3Points(target, calc.teamAPoints, calc.teamBPoints);
      updatedMatches = updatedMatches.map(m => (m.id === matchId ? { ...m, ...rec } : m));
    }

    commitState({
      ...state,
      robotWarMatches: updatedMatches,
      scores: rebuildRound3Scores(state.scores, updatedMatches, [match.teamAId, match.teamBId]),
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const deleteRobotWarMatch = useCallback((matchId: string) => {
    const updatedMatches = state.robotWarMatches.filter(m => m.id !== matchId);
    commitState({
      ...state,
      robotWarMatches: updatedMatches,
      activeRobotWarMatchId: state.activeRobotWarMatchId === matchId ? null : state.activeRobotWarMatchId,
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const setActiveRobotWarMatch = useCallback((matchId: string | null) => {
    commitState({
      ...state,
      activeRobotWarMatchId: matchId,
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const saveRobotWarDraft = useCallback((
    matchId: string,
    result: 'team_a' | 'team_b' | 'draw',
    pitType: PitType | null,
    timeLeftSeconds: number,
    notes?: string
  ) => {
    const calculated = calculateRoboWarScore(result, pitType, timeLeftSeconds);

    const updatedMatches = state.robotWarMatches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          result: result === 'team_a' ? ('team_a_win' as const) : result === 'team_b' ? ('team_b_win' as const) : ('draw' as const),
          winnerId: result === 'team_a' ? m.teamAId : result === 'team_b' ? m.teamBId : null,
          pitType: result === 'draw' ? null : (pitType ?? null),
          timeLeftSeconds: calculated.timeLeftSeconds,
          multiplier: calculated.multiplier ?? null,
          ...recordedRound3Points(m, calculated.teamAPoints, calculated.teamBPoints),
          matchNotes: notes ?? m.matchNotes,
          isDraft: true
        };
      }
      return m;
    });

    commitState({
      ...state,
      robotWarMatches: updatedMatches,
      lastUpdated: Date.now()
    }, false);
  }, [state, commitState]);

  const publishRobotWarResult = useCallback((
    matchId: string,
    result: 'team_a' | 'team_b' | 'draw',
    pitType: PitType | null,
    timeLeftSeconds: number,
    notes?: string
  ) => {
    const match = state.robotWarMatches.find(m => m.id === matchId);
    if (!match) return;

    const calculated = calculateRoboWarScore(result, pitType, timeLeftSeconds);

    const teamASchool = state.schools.find(s => s.id === match.teamAId);
    const teamBSchool = state.schools.find(s => s.id === match.teamBId);

    const updatedMatches = state.robotWarMatches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          result: result === 'team_a' ? ('team_a_win' as const) : result === 'team_b' ? ('team_b_win' as const) : ('draw' as const),
          winnerId: result === 'team_a' ? m.teamAId : result === 'team_b' ? m.teamBId : null,
          pitType: result === 'draw' ? null : (pitType ?? null),
          timeLeftSeconds: calculated.timeLeftSeconds,
          multiplier: calculated.multiplier ?? null,
          ...recordedRound3Points(m, calculated.teamAPoints, calculated.teamBPoints),
          status: 'completed' as const,
          isDraft: false,
          publishedAt: new Date().toISOString(),
          matchNotes: notes ?? m.matchNotes
        };
      }
      return m;
    });

    // Round 3 scores are rebuilt from every match the two teams have played, so a challenger match
    // can never overwrite the points earned in a team's original match.
    const updatedScores = rebuildRound3Scores(state.scores, updatedMatches, [match.teamAId, match.teamBId]);

    let action: string;
    if (result === 'draw') {
      action = `Robo War: Match #${match.matchNumber} ended in a draw (${calculated.timeLeftSeconds}s left, 50 pts each)`;
    } else {
      const winnerSchool = result === 'team_a' ? teamASchool : teamBSchool;
      const pitLabel = pitType === 'in_pit' ? 'IN-PIT (×3)' : 'OUT-PIT (×2)';
      const winnerIsChallenger = !!match.challengerId && match.challengerId === winnerSchool?.id;
      action = winnerIsChallenger
        ? `Robo War (challenger match): ${winnerSchool?.name} won via ${pitLabel} but is the challenger, so no points are recorded`
        : `Robo War: ${winnerSchool?.name} won via ${pitLabel} (${calculated.timeLeftSeconds}s left = ${calculated.winnerPoints} pts)`;
    }
    if (match.challengerId) {
      const challengerSchool = state.schools.find(s => s.id === match.challengerId);
      if (!/challenger/.test(action)) action += ` [${challengerSchool?.name || 'Challenger'} is the challenger and earns no points]`;
    }

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: 3,
      schoolName: `${teamASchool?.name || 'A'} vs ${teamBSchool?.name || 'B'}`,
      teamName: `Match #${match.matchNumber}`,
      action,
      newScore: (result === 'team_a' && match.challengerId === match.teamAId) || (result === 'team_b' && match.challengerId === match.teamBId) ? 0 : calculated.winnerPoints,
      operatorNote: notes
    };

    commitState({
      ...state,
      robotWarMatches: updatedMatches,
      scores: updatedScores,
      auditLogs: [log, ...state.auditLogs.slice(0, 49)],
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  // Master Data: Schools
  const addSchool = useCallback((schoolData: Omit<School, 'id'>) => {
    const newId = `sch_${Date.now()}`;
    const newSchool: School = {
      ...schoolData,
      id: newId
    };

    const addToQueue = (q: typeof state.runQueue[1]) =>
      !q.currentSchoolId && q.queueSchoolIds.length === 0
        ? { ...q, currentSchoolId: newId }
        : { ...q, queueSchoolIds: [...q.queueSchoolIds, newId] };

    commitState({
      ...state,
      schools: [...state.schools, newSchool],
      runQueue: {
        1: addToQueue(state.runQueue[1]),
        2: addToQueue(state.runQueue[2])
      },
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const editSchool = useCallback((id: string, updates: Partial<School>) => {
    commitState({
      ...state,
      schools: state.schools.map(s => s.id === id ? { ...s, ...updates } : s),
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const deleteSchool = useCallback((id: string) => {
    const updatedSchools = state.schools.filter(s => s.id !== id);
    const updatedScores = { ...state.scores };
    delete updatedScores[id];

    // If the deleted team was on stage, the next waiting team steps up instead of leaving it empty.
    const removeFromQueue = (q: typeof state.runQueue[1]) => {
      const queue = q.queueSchoolIds.filter(x => x !== id);
      const wasCurrent = q.currentSchoolId === id;
      return {
        currentSchoolId: wasCurrent ? (queue[0] || null) : q.currentSchoolId,
        queueSchoolIds: wasCurrent ? queue.slice(1) : queue,
        completedSchoolIds: q.completedSchoolIds.filter(x => x !== id)
      };
    };

    const updatedRobotWarMatches = state.robotWarMatches.filter(
      m => m.teamAId !== id && m.teamBId !== id
    );
    const activeMatchRemoved = !updatedRobotWarMatches.some(m => m.id === state.activeRobotWarMatchId);

    commitState({
      ...state,
      schools: updatedSchools,
      scores: updatedScores,
      robotWarMatches: updatedRobotWarMatches,
      activeRobotWarMatchId: activeMatchRemoved ? null : state.activeRobotWarMatchId,
      runQueue: {
        1: removeFromQueue(state.runQueue[1]),
        2: removeFromQueue(state.runQueue[2])
      },
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const clearAllSchools = useCallback(() => {
    commitState({
      ...state,
      schools: [],
      scores: {},
      robotWarMatches: [],
      runQueue: {
        1: { currentSchoolId: null, queueSchoolIds: [], completedSchoolIds: [] },
        2: { currentSchoolId: null, queueSchoolIds: [], completedSchoolIds: [] }
      },
      grandWinnerSchoolId: null,
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  // Winner Mode
  const setGrandWinner = useCallback((schoolId: string | null) => {
    commitState({
      ...state,
      grandWinnerSchoolId: schoolId,
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const triggerWinnerMode = useCallback((schoolId?: string) => {
    const winnerId = schoolId || (leaderboard[0] ? leaderboard[0].school.id : null);
    commitState({
      ...state,
      grandWinnerSchoolId: winnerId,
      displayState: 'winner',
      lastUpdated: Date.now()
    });
  }, [state, leaderboard, commitState]);

  const exitWinnerMode = useCallback(() => {
    commitState({
      ...state,
      displayState: 'leaderboard',
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  // Score Correction with manual override & audit
  const correctScoreManually = useCallback((round: 1 | 2 | 3, schoolId: string, newScore: number, reason: string) => {
    const school = state.schools.find(s => s.id === schoolId);
    const existing = state.scores[schoolId] || {
      schoolId,
      round1: null,
      round2: null,
      round3Score: 0,
      totalScore: 0
    };

    let oldScore = 0;
    const updatedScores = { ...state.scores };

    if (round === 1) {
      oldScore = existing.round1?.finalScore || 0;
      updatedScores[schoolId] = {
        ...existing,
        round1: {
          blocks: OFFICIAL_BLOCK_WEIGHTS.map(w => ({
            weightId: w.id,
            weightLabel: w.label,
            status: 'none',
            pointsEarned: 0
          })),
          blockScore: newScore,
          timeLeftSeconds: 0,
          timeBonus: 0,
          finalScore: newScore,
          calculatedScore: newScore,
          isDraft: false,
          publishedAt: new Date().toISOString(),
          notes: `[Manual Correction] ${reason}`
        },
        totalScore: newScore + (existing.round2?.finalScore || 0) + existing.round3Score
      };
    } else if (round === 2) {
      oldScore = existing.round2?.finalScore || 0;
      updatedScores[schoolId] = {
        ...existing,
        round2: {
          pulledBlockIds: [],
          blockScore: newScore,
          timeLeftSeconds: 0,
          timeBonus: 0,
          boundaryTouches: 0,
          boundaryPenalty: 0,
          penaltyPoints: 0,
          finalScore: newScore,
          calculatedScore: newScore,
          isDraft: false,
          publishedAt: new Date().toISOString(),
          notes: `[Manual Correction] ${reason}`
        },
        totalScore: (existing.round1?.finalScore || 0) + newScore + existing.round3Score
      };
    } else if (round === 3) {
      oldScore = existing.round3Score || 0;
      updatedScores[schoolId] = {
        ...existing,
        round3Score: newScore,
        totalScore: (existing.round1?.finalScore || 0) + (existing.round2?.finalScore || 0) + newScore
      };
    }

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round,
      schoolName: school?.name || 'Unknown',
      teamName: school?.teamName || '',
      action: `Referee correction: Round ${round} (${oldScore} → ${newScore})`,
      oldScore,
      newScore,
      operatorNote: reason
    };

    commitState({
      ...state,
      scores: updatedScores,
      auditLogs: [log, ...state.auditLogs.slice(0, 49)],
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const resetAllScores = useCallback(() => {
    const activeSchoolIds = state.schools.filter(s => s.isActive).map(s => s.id);

    commitState({
      ...state,
      scores: {},
      robotWarMatches: state.robotWarMatches.map(m => ({
        ...m,
        result: 'pending',
        winnerId: null,
        pitType: null,
        multiplier: null,
        timeLeftSeconds: 0,
        teamAPoints: 0,
        teamBPoints: 0,
        status: 'scheduled',
        isDraft: false
      })),
      arenaTimer: DEFAULT_ARENA_TIMER,
      activeRun: DEFAULT_ACTIVE_RUN,
      lastPublishedResult: null,
      auditLogs: [{
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: state.currentRound,
        schoolName: 'System',
        teamName: 'Reset Scores',
        action: 'All scores reset by operator (teams and scheduled matches kept)'
      }, ...state.auditLogs.slice(0, 49)],
      runQueue: {
        1: { currentSchoolId: activeSchoolIds[0] || null, queueSchoolIds: activeSchoolIds.slice(1), completedSchoolIds: [] },
        2: { currentSchoolId: activeSchoolIds[0] || null, queueSchoolIds: activeSchoolIds.slice(1), completedSchoolIds: [] }
      },
      grandWinnerSchoolId: null,
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const importState = useCallback((newState: CompetitionState) => {
    commitState({
      ...newState,
      lastUpdated: Date.now()
    });
  }, [commitState]);

  // Undo puts back an older copy of the whole tournament. That is only safe while every save since
  // then was made by this tab; otherwise it would silently erase another operator's newer work.
  // So the database is checked first, and the undo is refused if anyone else has saved since.
  const undoLastAction = useCallback(async () => {
    if (historyStack.length === 0 || !cloudReadyRef.current) return;

    // Let this tab's own pending save land first, so it is not mistaken for someone else's.
    await lastSaveRef.current;
    const result = await loadCompetitionStateFromServer();
    if (result.kind !== 'found') {
      showUndoNotice('Undo is unavailable right now: the database could not be checked. Nothing was changed.');
      return;
    }
    if (result.data.lastWriter !== SESSION_ID) {
      invalidateUndo();
      showUndoNotice('Undo blocked: someone else changed the data after your last action, so it cannot be undone safely. Nothing was changed.');
      return;
    }

    const previous = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    commitState(previous, false);
  }, [historyStack, commitState, invalidateUndo, showUndoNotice]);

  // Arena Timer Synchronization Callbacks
  const startArenaTimer = useCallback((round: 1 | 2 | 3 = state.currentRound, schoolId?: string, duration: number = 120, matchId?: string) => {
    const startTimestamp = Date.now();
    const newTimer: ArenaTimerState = {
      status: 'running',
      totalDurationSeconds: duration,
      remainingSeconds: duration,
      startTimestamp,
      stopTimestamp: null,
      round,
      schoolId: schoolId || currentSchool?.id || null,
      matchId: matchId ?? null
    };
    commitState({
      ...state,
      arenaTimer: newTimer,
      lastUpdated: Date.now()
    }, false);
  }, [state, commitState, currentSchool]);

  const stopArenaTimer = useCallback((explicitTimeLeft?: number) => {
    if (!state.arenaTimer) return;
    const now = Date.now();
    let frozen: number;
    if (typeof explicitTimeLeft === 'number') {
      frozen = Math.max(0, Math.min(state.arenaTimer.totalDurationSeconds || 120, explicitTimeLeft));
    } else {
      const start = state.arenaTimer.startTimestamp || now;
      const elapsed = Math.floor((now - start) / 1000);
      frozen = Math.max(0, (state.arenaTimer.totalDurationSeconds || 120) - elapsed);
    }
    const newTimer: ArenaTimerState = {
      ...state.arenaTimer,
      status: 'stopped',
      remainingSeconds: frozen,
      stopTimestamp: now
    };
    commitState({
      ...state,
      arenaTimer: newTimer,
      lastUpdated: Date.now()
    }, false);
  }, [state, commitState]);

  const resetArenaTimer = useCallback((duration: number = 120, round?: 1 | 2 | 3, matchId?: string) => {
    const newTimer: ArenaTimerState = {
      status: 'idle',
      totalDurationSeconds: duration,
      remainingSeconds: duration,
      startTimestamp: null,
      stopTimestamp: null,
      round: round ?? state.currentRound,
      schoolId: currentSchool?.id || null,
      matchId: matchId ?? null
    };
    commitState({
      ...state,
      arenaTimer: newTimer,
      lastUpdated: Date.now()
    }, false);
  }, [state, commitState, currentSchool]);

  // Synchronized Active Run Controls
  const startActiveRun = useCallback((schoolId?: string, round: 1 | 2 | 3 = 1, user?: AppUser) => {
    const roundKey: 1 | 2 = (round === 3 ? 1 : round) as 1 | 2;
    const targetSchoolId = schoolId || state.runQueue[roundKey]?.currentSchoolId || state.schools[0]?.id || null;
    const school = state.schools.find(s => s.id === targetSchoolId);
    const startTimestamp = Date.now();

    const newActiveRun: ActiveRunState = {
      status: 'RUNNING',
      round,
      schoolId: targetSchoolId,
      timeAllocated: 120,
      timeLeftSeconds: 120,
      timeBonus: 0,
      blockScore: 0,
      finalScore: 0,
      startTimestamp,
      stopTimestamp: null,
      blocks: {
        '200g': 'none',
        '500g': 'none',
        '700g': 'none',
        '1kg': 'none',
        '2kg': 'none',
        '4kg': 'none'
      },
      operatorNotes: '',
      isLockedForReview: false,
      manualTimeBonus: null,
      stoppedBy: undefined
    };

    const newTimer: ArenaTimerState = {
      status: 'running',
      totalDurationSeconds: 120,
      remainingSeconds: 120,
      startTimestamp,
      stopTimestamp: null,
      round,
      schoolId: targetSchoolId
    };

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round,
      schoolName: school?.name || 'Current Team',
      teamName: school?.teamName || '',
      action: `RUN STARTED (120s timer active)`,
      userEmail: user?.email,
      userName: user?.displayName,
      userRole: user?.role
    };

    commitState({
      ...state,
      activeRun: newActiveRun,
      arenaTimer: newTimer,
      displayState: 'live_run',
      auditLogs: [log, ...state.auditLogs.slice(0, 49)],
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const updateActiveRunBlock = useCallback((weightId: string, status: PushBlockStatus) => {
    const currentRun = state.activeRun || DEFAULT_ACTIVE_RUN;
    const updatedBlocks = {
      ...currentRun.blocks,
      [weightId]: status
    };

    const newBlockScore = OFFICIAL_BLOCK_WEIGHTS.reduce((sum, def) => {
      const st = updatedBlocks[def.id] || 'none';
      if (st === 'complete') return sum + def.fullPoints;
      if (st === 'incomplete') return sum + def.incompletePoints;
      return sum;
    }, 0);

    const bonus = currentRun.status === 'STOPPED' 
      ? currentRun.timeBonus 
      : (currentRun.status === 'RUNNING' ? currentRun.timeLeftSeconds : 0);
    const newFinalScore = newBlockScore + bonus;

    const updatedRun: ActiveRunState = {
      ...currentRun,
      blocks: updatedBlocks,
      blockScore: newBlockScore,
      finalScore: newFinalScore
    };

    let updatedScores = { ...state.scores };
    if (currentRun.schoolId && !hasPublishedRound1(state.scores, currentRun.schoolId)) {
      const existing = updatedScores[currentRun.schoolId] || {
        schoolId: currentRun.schoolId,
        round1: null,
        round2: null,
        round3Score: 0,
        totalScore: 0
      };

      updatedScores[currentRun.schoolId] = {
        ...existing,
        round1: {
          blocks: OFFICIAL_BLOCK_WEIGHTS.map(def => ({
            weightId: def.id,
            weightLabel: def.label,
            status: updatedBlocks[def.id] || 'none',
            pointsEarned: (updatedBlocks[def.id] === 'complete' ? def.fullPoints : (updatedBlocks[def.id] === 'incomplete' ? def.incompletePoints : 0))
          })),
          blockScore: newBlockScore,
          timeLeftSeconds: currentRun.timeLeftSeconds,
          timeBonus: bonus,
          finalScore: newFinalScore,
          calculatedScore: newFinalScore,
          isDraft: true,
          notes: currentRun.operatorNotes
        }
      };
    }

    commitState({
      ...state,
      activeRun: updatedRun,
      scores: updatedScores,
      lastUpdated: Date.now()
    }, false);
  }, [state, commitState]);

  const stopActiveRun = useCallback((user?: AppUser, explicitTimeLeft?: number) => {
    const currentRun = state.activeRun || DEFAULT_ACTIVE_RUN;
    const now = Date.now();
    let frozenSeconds: number;

    if (typeof explicitTimeLeft === 'number') {
      frozenSeconds = Math.max(0, Math.min(120, explicitTimeLeft));
    } else if (currentRun.startTimestamp) {
      const elapsed = Math.floor((now - currentRun.startTimestamp) / 1000);
      frozenSeconds = Math.max(0, 120 - elapsed);
    } else {
      frozenSeconds = currentRun.timeLeftSeconds || 0;
    }

    const bonus = frozenSeconds;
    const totalScore = currentRun.blockScore + bonus;

    const stoppedRun: ActiveRunState = {
      ...currentRun,
      status: 'STOPPED',
      timeLeftSeconds: frozenSeconds,
      timeBonus: bonus,
      finalScore: totalScore,
      stopTimestamp: now,
      isLockedForReview: true,
      stoppedBy: user ? {
        email: user.email,
        displayName: user.displayName,
        role: user.role
      } : undefined
    };

    const stoppedTimer: ArenaTimerState = {
      status: 'stopped',
      totalDurationSeconds: 120,
      remainingSeconds: frozenSeconds,
      startTimestamp: currentRun.startTimestamp,
      stopTimestamp: now,
      round: currentRun.round,
      schoolId: currentRun.schoolId
    };

    const school = state.schools.find(s => s.id === currentRun.schoolId);

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: currentRun.round,
      schoolName: school?.name || 'Current Team',
      teamName: school?.teamName || '',
      action: `RUN STOPPED: ${frozenSeconds}s remaining (+${bonus} bonus). Score: ${totalScore} pts`,
      newScore: totalScore,
      userEmail: user?.email,
      userName: user?.displayName,
      userRole: user?.role
    };

    let updatedScores = { ...state.scores };
    if (currentRun.schoolId && !hasPublishedRound1(state.scores, currentRun.schoolId)) {
      const existing = updatedScores[currentRun.schoolId] || {
        schoolId: currentRun.schoolId,
        round1: null,
        round2: null,
        round3Score: 0,
        totalScore: 0
      };

      updatedScores[currentRun.schoolId] = {
        ...existing,
        round1: {
          blocks: OFFICIAL_BLOCK_WEIGHTS.map(def => ({
            weightId: def.id,
            weightLabel: def.label,
            status: currentRun.blocks[def.id] || 'none',
            pointsEarned: (currentRun.blocks[def.id] === 'complete' ? def.fullPoints : (currentRun.blocks[def.id] === 'incomplete' ? def.incompletePoints : 0))
          })),
          blockScore: currentRun.blockScore,
          timeLeftSeconds: frozenSeconds,
          timeBonus: bonus,
          finalScore: totalScore,
          calculatedScore: totalScore,
          isDraft: true,
          notes: currentRun.operatorNotes
        }
      };
    }

    commitState({
      ...state,
      activeRun: stoppedRun,
      arenaTimer: stoppedTimer,
      scores: updatedScores,
      auditLogs: [log, ...state.auditLogs.slice(0, 49)],
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const restartActiveRun = useCallback((schoolId?: string, round: 1 | 2 | 3 = 1, user?: AppUser) => {
    const roundKey: 1 | 2 = (round === 3 ? 1 : round) as 1 | 2;
    const targetSchoolId = schoolId || state.runQueue[roundKey]?.currentSchoolId || state.schools[0]?.id || null;
    const school = state.schools.find(s => s.id === targetSchoolId);

    const resetRun: ActiveRunState = {
      status: 'READY',
      round,
      schoolId: targetSchoolId,
      timeAllocated: 120,
      timeLeftSeconds: 120,
      timeBonus: 0,
      blockScore: 0,
      finalScore: 0,
      startTimestamp: null,
      stopTimestamp: null,
      blocks: {
        '200g': 'none',
        '500g': 'none',
        '700g': 'none',
        '1kg': 'none',
        '2kg': 'none',
        '4kg': 'none'
      },
      operatorNotes: '',
      isLockedForReview: false,
      manualTimeBonus: null,
      stoppedBy: undefined
    };

    const resetTimer: ArenaTimerState = {
      status: 'idle',
      totalDurationSeconds: 120,
      remainingSeconds: 120,
      startTimestamp: null,
      stopTimestamp: null,
      round,
      schoolId: targetSchoolId
    };

    let updatedScores = { ...state.scores };
    if (targetSchoolId && updatedScores[targetSchoolId]) {
      const existing = updatedScores[targetSchoolId];
      if (existing.round1?.isDraft) {
        updatedScores[targetSchoolId] = {
          ...existing,
          round1: null,
          totalScore: (existing.round2?.finalScore || 0) + existing.round3Score
        };
      }
    }

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round,
      schoolName: school?.name || 'Current Team',
      teamName: school?.teamName || '',
      action: `RUN RESTARTED: Draft discarded, timer reset to 01:20`,
      userEmail: user?.email,
      userName: user?.displayName,
      userRole: user?.role
    };

    commitState({
      ...state,
      activeRun: resetRun,
      arenaTimer: resetTimer,
      scores: updatedScores,
      auditLogs: [log, ...state.auditLogs.slice(0, 49)],
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const unlockActiveRunReview = useCallback(() => {
    if (!state.activeRun) return;
    commitState({
      ...state,
      activeRun: {
        ...state.activeRun,
        isLockedForReview: false
      },
      lastUpdated: Date.now()
    }, false);
  }, [state, commitState]);

  const arenaTimerValue = state.arenaTimer || DEFAULT_ARENA_TIMER;

  return (
    <CompetitionContext.Provider
      value={{
        state,
        leaderboard,
        hasActiveTie,
        cloudStatus,
        cloudError,
        tiedRanks,
        currentSchool,
        upNextSchool,
        followingSchool,
        activeRobotWarMatch,
        grandWinner,
        setCurrentRound,
        setDisplayState,
        setLeaderboardFilter,
        setCompetitionStatus,
        advanceQueue,
        setCurrentTeamManually,
        reorderQueue,
        saveBlockPushDraft,
        publishBlockPushScore,
        discardDraftRun,
        saveBlockPullDraft,
        publishBlockPullScore,
        createRobotWarMatch,
        setMatchChallenger,
        deleteRobotWarMatch,
        setActiveRobotWarMatch,
        saveRobotWarDraft,
        publishRobotWarResult,
        addSchool,
        editSchool,
        deleteSchool,
        clearAllSchools,
        setGrandWinner,
        triggerWinnerMode,
        exitWinnerMode,
        correctScoreManually,
        resetAllScores,
        importState,
        undoLastAction,
        undoNotice,
        dismissUndoNotice,
        canUndo: historyStack.length > 0,
        isDisplayMode,
        setIsDisplayMode,
        arenaTimer: arenaTimerValue,
        startArenaTimer,
        stopArenaTimer,
        resetArenaTimer,
        startActiveRun,
        updateActiveRunBlock,
        stopActiveRun,
        restartActiveRun,
        unlockActiveRunReview,
        isFirebaseConnected,
        isFirebaseSyncing,
        lastCloudSync,
        forceCloudSync
      }}
    >
      {children}
    </CompetitionContext.Provider>
  );
};

export const useCompetition = () => {
  const context = useContext(CompetitionContext);
  if (!context) {
    throw new Error('useCompetition must be used within CompetitionProvider');
  }
  return context;
};
