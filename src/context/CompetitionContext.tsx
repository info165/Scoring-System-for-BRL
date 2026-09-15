import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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
  PitType
} from '../types';
import { INITIAL_DEMO_SCHOOLS, INITIAL_PRESET_MATCHES } from '../data/demoSchools';
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
  fetchCompetitionStateFromFirestore 
} from '../lib/firebase';

const STORAGE_KEY = 'BRL_2026_COMPETITION_STATE_V3';
const SYNC_CHANNEL_NAME = 'BRL_2026_SYNC_CHANNEL';

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
  
  saveBlockPullDraft: (schoolId: string, scoreData: BlockPullScore) => void;
  publishBlockPullScore: (schoolId: string, scoreData: Omit<BlockPullScore, 'isDraft' | 'publishedAt'>) => void;
  
  // Robot War Operations
  createRobotWarMatch: (teamAId: string, teamBId: string, matchNotes?: string) => string;
  setActiveRobotWarMatch: (matchId: string | null) => void;
  saveRobotWarDraft: (matchId: string, winner: 'team_a' | 'team_b', pitType: PitType, timeLeftSeconds: number, notes?: string) => void;
  publishRobotWarResult: (matchId: string, winner: 'team_a' | 'team_b', pitType: PitType, timeLeftSeconds: number, notes?: string) => void;
  
  // School Master Data
  addSchool: (school: Omit<School, 'id'>) => void;
  editSchool: (id: string, updates: Partial<School>) => void;
  deleteSchool: (id: string) => void;
  loadDemoSchools: () => void;
  clearAllSchools: () => void;
  
  // Winner Mode
  setGrandWinner: (schoolId: string | null) => void;
  triggerWinnerMode: (schoolId?: string) => void;
  exitWinnerMode: () => void;
  
  // Audits & Corrections
  correctScoreManually: (round: 1 | 2 | 3, schoolId: string, newScore: number, reason: string) => void;
  resetAllCompetitionData: () => void;
  resetAllScores: () => void;
  importState: (newState: CompetitionState) => void;
  undoLastAction: () => void;
  canUndo: boolean;
  
  // View mode helper
  isDisplayMode: boolean;
  setIsDisplayMode: (val: boolean) => void;

  // Cloud & Firebase Real-time Sync
  isFirebaseConnected: boolean;
  isFirebaseSyncing: boolean;
  lastCloudSync: string | null;
  forceCloudSync: () => Promise<void>;
}

// Initial demo score records pre-calculated with the official BRL 2026 rules
const samplePushDPS = calculateBlockPushScore(
  [
    { weightId: '4kg', status: 'complete' }, // 100
    { weightId: '2kg', status: 'complete' }  // 80
  ],
  25 // Time left = 25s -> Bonus = 25
);

const samplePullDPS = calculateBlockPullScore(
  ['2kg', '1kg', '500g'], // 80 + 60 + 30 = 170
  30, // Time left = 30s -> Bonus = 30
  1 // 1 touch -> Penalty = 5
); // 170 + 30 - 5 = 195

const samplePushBombay = calculateBlockPushScore(
  [
    { weightId: '1kg', status: 'complete' },  // 60
    { weightId: '700g', status: 'complete' }, // 40
    { weightId: '200g', status: 'complete' }  // 20
  ],
  35 // Time left = 35s -> Bonus = 35
); // 120 + 35 = 155

const samplePullBombay = calculateBlockPullScore(
  ['2kg', '1kg'], // 80 + 60 = 140
  25, // Time left = 25s -> Bonus = 25
  1 // 1 touch -> Penalty = 5
); // 140 + 25 - 5 = 160

const samplePushKVPowai = calculateBlockPushScore(
  [
    { weightId: '2kg', status: 'complete' },   // 80
    { weightId: '500g', status: 'complete' },  // 30
    { weightId: '4kg', status: 'incomplete' }  // 50 (100 * 50%)
  ],
  20 // Time left = 20s -> Bonus = 20
); // 160 + 20 = 180

const samplePullKVPowai = calculateBlockPullScore(
  ['4kg', '700g'], // 100 + 40 = 140
  15, // Time left = 15s -> Bonus = 15
  0 // 0 touches
); // 140 + 15 = 155

const defaultInitialState: CompetitionState = {
  eventName: 'Bharat Robotics League',
  year: '2026',
  eventDate: '29 September 2026',
  status: 'live',
  currentRound: 1,
  displayState: 'live_run',
  leaderboardFilter: 'all',
  activeRobotWarMatchId: 'match_1',
  grandWinnerSchoolId: null,
  runQueue: {
    1: {
      currentSchoolId: 'sch_delhi_public',
      queueSchoolIds: [
        'sch_mothers_int', 
        'sch_bombay_scottish', 
        'sch_kv_iit_powai', 
        'sch_nps_blr', 
        'sch_modern_school', 
        'sch_st_xaviers_kol', 
        'sch_doon_school', 
        'sch_hps_begumpet', 
        'sch_dav_chennai'
      ],
      completedSchoolIds: []
    },
    2: {
      currentSchoolId: 'sch_delhi_public',
      queueSchoolIds: [
        'sch_mothers_int', 
        'sch_bombay_scottish', 
        'sch_kv_iit_powai', 
        'sch_nps_blr', 
        'sch_modern_school', 
        'sch_st_xaviers_kol', 
        'sch_doon_school', 
        'sch_hps_begumpet', 
        'sch_dav_chennai'
      ],
      completedSchoolIds: []
    }
  },
  schools: INITIAL_DEMO_SCHOOLS,
  scores: {
    'sch_delhi_public': {
      schoolId: 'sch_delhi_public',
      round1: {
        ...samplePushDPS,
        isDraft: false,
        publishedAt: '2026-09-29T10:05:00Z',
        notes: 'Exceptional autonomous placement of 4kg and 2kg blocks'
      },
      round2: {
        ...samplePullDPS,
        isDraft: false,
        publishedAt: '2026-09-29T11:10:00Z',
        notes: 'High-torque triple payload tow'
      },
      round3Score: 120, // Match 1 In-Pit (40s * 3)
      totalScore: samplePushDPS.finalScore + samplePullDPS.finalScore + 120 // 205 + 195 + 120 = 520
    },
    'sch_bombay_scottish': {
      schoolId: 'sch_bombay_scottish',
      round1: {
        ...samplePushBombay,
        isDraft: false,
        publishedAt: '2026-09-29T10:20:00Z',
        notes: 'Clean run, 3 blocks pushed completely inside target zone'
      },
      round2: {
        ...samplePullBombay,
        isDraft: false,
        publishedAt: '2026-09-29T11:25:00Z'
      },
      round3Score: 90, // Match 2 In-Pit (30s * 3)
      totalScore: samplePushBombay.finalScore + samplePullBombay.finalScore + 90 // 155 + 160 + 90 = 405
    },
    'sch_kv_iit_powai': {
      schoolId: 'sch_kv_iit_powai',
      round1: {
        ...samplePushKVPowai,
        isDraft: false,
        publishedAt: '2026-09-29T10:35:00Z',
        notes: '4kg block partially in zone (awarded 50% incomplete points)'
      },
      round2: {
        ...samplePullKVPowai,
        isDraft: false,
        publishedAt: '2026-09-29T11:40:00Z'
      },
      round3Score: 0, // Match 2 loss
      totalScore: samplePushKVPowai.finalScore + samplePullKVPowai.finalScore // 180 + 155 + 0 = 335
    }
  },
  robotWarMatches: [
    {
      id: 'match_1',
      matchNumber: 1,
      teamAId: 'sch_delhi_public',
      teamBId: 'sch_mothers_int',
      result: 'team_a_win',
      winnerId: 'sch_delhi_public',
      pitType: 'in_pit',
      timeLeftSeconds: 40,
      multiplier: 3,
      teamAPoints: 120,
      teamBPoints: 0,
      status: 'completed',
      isDraft: false,
      publishedAt: '2026-09-29T12:15:00Z',
      matchNotes: 'DPS executed arena push into IN-PIT with 40s remaining (40s × 3 = 120 pts).'
    },
    {
      id: 'match_2',
      matchNumber: 2,
      teamAId: 'sch_bombay_scottish',
      teamBId: 'sch_kv_iit_powai',
      result: 'team_a_win',
      winnerId: 'sch_bombay_scottish',
      pitType: 'in_pit',
      timeLeftSeconds: 30,
      multiplier: 3,
      teamAPoints: 90,
      teamBPoints: 0,
      status: 'completed',
      isDraft: false,
      publishedAt: '2026-09-29T12:35:00Z',
      matchNotes: 'Bombay Scottish pushed opponent into IN-PIT with 30s remaining (30s × 3 = 90 pts).'
    },
    {
      id: 'match_3',
      matchNumber: 3,
      teamAId: 'sch_nps_blr',
      teamBId: 'sch_dav_chennai',
      result: 'pending',
      timeLeftSeconds: 0,
      teamAPoints: 0,
      teamBPoints: 0,
      status: 'scheduled',
      isDraft: false,
      matchNotes: 'Southern Zone Quarter-Final'
    },
    {
      id: 'match_4',
      matchNumber: 4,
      teamAId: 'sch_modern_school',
      teamBId: 'sch_st_xaviers_kol',
      result: 'pending',
      timeLeftSeconds: 0,
      teamAPoints: 0,
      teamBPoints: 0,
      status: 'scheduled',
      isDraft: false,
      matchNotes: 'Inter-City Quarter-Final'
    }
  ],
  auditLogs: [
    {
      id: 'log_01',
      timestamp: '10:05 AM',
      round: 1,
      schoolName: 'Delhi Public School, R.K. Puram',
      teamName: 'CyberVanguard',
      action: 'Score published: 205 (Blocks: 180, Time Bonus: 25s)',
      newScore: 205
    },
    {
      id: 'log_02',
      timestamp: '11:10 AM',
      round: 2,
      schoolName: 'Delhi Public School, R.K. Puram',
      teamName: 'CyberVanguard',
      action: 'Score published: 195 (Blocks: 170, Time: 30s, Penalty: 1 touch = -5)',
      newScore: 195
    },
    {
      id: 'log_03',
      timestamp: '12:15 PM',
      round: 3,
      schoolName: 'Delhi Public School vs The Mother\'s International',
      teamName: 'Match #1',
      action: 'Robo War published: DPS win via IN-PIT (40s × 3 = 120 pts)',
      newScore: 120
    }
  ],
  lastUpdated: 0
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

  const commitState = useCallback((newState: CompetitionState, allowUndo: boolean = true) => {
    const stateWithTimestamp: CompetitionState = {
      ...newState,
      lastUpdated: Date.now()
    };

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
    saveCompetitionStateToFirestore(stateWithTimestamp)
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
    setIsFirebaseSyncing(true);
    try {
      await saveCompetitionStateToFirestore(state);
      setIsFirebaseConnected(true);
      setLastCloudSync(new Date().toLocaleTimeString());
    } finally {
      setIsFirebaseSyncing(false);
    }
  }, [state]);

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

    // Check if cloud already has existing tournament data, or seed initial tournament state
    fetchCompetitionStateFromFirestore()
      .then((cloudData) => {
        if (cloudData && cloudData.eventName && Array.isArray(cloudData.schools)) {
          if (!cloudData.lastUpdated || cloudData.lastUpdated > (state.lastUpdated || 0)) {
            setState(cloudData);
            setIsFirebaseConnected(true);
            setLastCloudSync(new Date().toLocaleTimeString());
          }
        } else {
          // Cloud empty: seed with default tournament structure so remote screens populate immediately
          saveCompetitionStateToFirestore(state).catch(e => console.warn('Initial cloud seed:', e));
        }
      })
      .catch((err) => console.warn('Cloud fetch on start:', err));

    // Listen to real-time updates from Firebase Firestore across all operators and screens
    unsubscribe = subscribeToCompetitionState(
      (cloudState) => {
        setState((currentLocal) => {
          if (cloudState.lastUpdated && currentLocal.lastUpdated && cloudState.lastUpdated <= currentLocal.lastUpdated) {
            return currentLocal;
          }
          setIsFirebaseConnected(true);
          setLastCloudSync(new Date().toLocaleTimeString());
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
            } catch (err) {
              console.warn('Local storage cache failed:', err);
            }
          }
          return cloudState;
        });
      },
      (error) => {
        console.warn('Firestore subscription status:', error.message);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Live multi-window synchronization via BroadcastChannel and StorageEvent
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data?.type === 'BRL_STATE_UPDATE' && event.data.state) {
        setState(event.data.state);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setState(parsed);
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
    if (!currentQ || !currentQ.currentSchoolId) return;

    const oldCurrent = currentQ.currentSchoolId;
    const nextCurrent = currentQ.queueSchoolIds[0] || null;
    const remainingQueue = currentQ.queueSchoolIds.slice(1);
    const newCompleted = [...currentQ.completedSchoolIds.filter(id => id !== oldCurrent), oldCurrent];

    const currentSchoolObj = state.schools.find(s => s.id === oldCurrent);
    const nextSchoolObj = state.schools.find(s => s.id === nextCurrent);

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: state.currentRound,
      schoolName: currentSchoolObj?.name || 'Unknown',
      teamName: currentSchoolObj?.teamName || '',
      action: `Next Team advanced: Now playing is ${nextSchoolObj?.name || 'End of Queue'}`
    };

    commitState({
      ...state,
      runQueue: {
        ...state.runQueue,
        [roundKey]: {
          currentSchoolId: nextCurrent,
          queueSchoolIds: remainingQueue,
          completedSchoolIds: newCompleted
        }
      },
      auditLogs: [log, ...state.auditLogs.slice(0, 49)],
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const setCurrentTeamManually = useCallback((schoolId: string) => {
    const roundKey: 1 | 2 = state.currentRound === 3 ? 1 : state.currentRound;
    const currentQ = state.runQueue[roundKey];
    if (!currentQ) return;

    const filteredQueue = currentQ.queueSchoolIds.filter(id => id !== schoolId);
    commitState({
      ...state,
      runQueue: {
        ...state.runQueue,
        [roundKey]: {
          ...currentQ,
          currentSchoolId: schoolId,
          queueSchoolIds: filteredQueue
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

  // Round 1 (Block Push) - Draft vs Publish
  const saveBlockPushDraft = useCallback((schoolId: string, scoreData: BlockPushScore) => {
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
    
    const publishedScore: BlockPushScore = {
      ...scoreData,
      isDraft: false,
      publishedAt: new Date().toISOString()
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
        ? `Block Push score corrected: ${oldScore} → ${publishedScore.finalScore}`
        : `Block Push score published: ${publishedScore.finalScore} (Blocks: ${publishedScore.blockScore}, Time Bonus: ${publishedScore.timeBonus})`,
      oldScore: oldScore > 0 ? oldScore : undefined,
      newScore: publishedScore.finalScore,
      operatorNote: publishedScore.notes
    };

    commitState({
      ...state,
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

  // Round 2 (Block Pull) - Draft vs Publish
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
        ? `Block Pull score corrected: ${oldScore} → ${publishedScore.finalScore}` 
        : `Block Pull score published: ${publishedScore.finalScore} (Blocks: ${publishedScore.blockScore}, Bonus: ${publishedScore.timeBonus}, Penalty: ${publishedScore.boundaryPenalty})`,
      oldScore: oldScore > 0 ? oldScore : undefined,
      newScore: publishedScore.finalScore,
      operatorNote: publishedScore.notes
    };

    commitState({
      ...state,
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
  const createRobotWarMatch = useCallback((teamAId: string, teamBId: string, matchNotes?: string): string => {
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

  const setActiveRobotWarMatch = useCallback((matchId: string | null) => {
    commitState({
      ...state,
      activeRobotWarMatchId: matchId,
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const saveRobotWarDraft = useCallback((
    matchId: string, 
    winner: 'team_a' | 'team_b', 
    pitType: PitType, 
    timeLeftSeconds: number, 
    notes?: string
  ) => {
    const calculated = calculateRoboWarScore(winner, pitType, timeLeftSeconds);

    const updatedMatches = state.robotWarMatches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          result: winner === 'team_a' ? ('team_a_win' as const) : ('team_b_win' as const),
          winnerId: winner === 'team_a' ? m.teamAId : m.teamBId,
          pitType,
          timeLeftSeconds: calculated.timeLeftSeconds,
          multiplier: calculated.multiplier,
          teamAPoints: calculated.teamAPoints,
          teamBPoints: calculated.teamBPoints,
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
    winner: 'team_a' | 'team_b', 
    pitType: PitType, 
    timeLeftSeconds: number, 
    notes?: string
  ) => {
    const match = state.robotWarMatches.find(m => m.id === matchId);
    if (!match) return;

    const calculated = calculateRoboWarScore(winner, pitType, timeLeftSeconds);
    const winnerSchoolId = winner === 'team_a' ? match.teamAId : match.teamBId;
    const loserSchoolId = winner === 'team_a' ? match.teamBId : match.teamAId;

    const teamASchool = state.schools.find(s => s.id === match.teamAId);
    const teamBSchool = state.schools.find(s => s.id === match.teamBId);
    const winnerSchool = state.schools.find(s => s.id === winnerSchoolId);

    const updatedMatches = state.robotWarMatches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          result: winner === 'team_a' ? ('team_a_win' as const) : ('team_b_win' as const),
          winnerId: winnerSchoolId,
          pitType,
          timeLeftSeconds: calculated.timeLeftSeconds,
          multiplier: calculated.multiplier,
          teamAPoints: calculated.teamAPoints,
          teamBPoints: calculated.teamBPoints,
          status: 'completed' as const,
          isDraft: false,
          publishedAt: new Date().toISOString(),
          matchNotes: notes ?? m.matchNotes
        };
      }
      return m;
    });

    // Update Round 3 scores for both teams (Winner gets points, Loser gets 0)
    const updatedScores = { ...state.scores };

    // Winner team update
    const currentScoreW = updatedScores[winnerSchoolId] || {
      schoolId: winnerSchoolId,
      round1: null,
      round2: null,
      round3Score: 0,
      totalScore: 0
    };
    const r1W = (currentScoreW.round1 && !currentScoreW.round1.isDraft) ? currentScoreW.round1.finalScore : 0;
    const r2W = (currentScoreW.round2 && !currentScoreW.round2.isDraft) ? currentScoreW.round2.finalScore : 0;
    updatedScores[winnerSchoolId] = {
      ...currentScoreW,
      round3Score: calculated.winnerPoints,
      totalScore: r1W + r2W + calculated.winnerPoints
    };

    // Loser team update
    const currentScoreL = updatedScores[loserSchoolId] || {
      schoolId: loserSchoolId,
      round1: null,
      round2: null,
      round3Score: 0,
      totalScore: 0
    };
    const r1L = (currentScoreL.round1 && !currentScoreL.round1.isDraft) ? currentScoreL.round1.finalScore : 0;
    const r2L = (currentScoreL.round2 && !currentScoreL.round2.isDraft) ? currentScoreL.round2.finalScore : 0;
    updatedScores[loserSchoolId] = {
      ...currentScoreL,
      round3Score: 0,
      totalScore: r1L + r2L
    };

    const pitLabel = pitType === 'in_pit' ? 'IN-PIT (×3)' : 'OUT-PIT (×2)';
    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: 3,
      schoolName: `${teamASchool?.name || 'A'} vs ${teamBSchool?.name || 'B'}`,
      teamName: `Match #${match.matchNumber}`,
      action: `Robo War: ${winnerSchool?.name} won via ${pitLabel} (${calculated.timeLeftSeconds}s left = ${calculated.winnerPoints} pts)`,
      newScore: calculated.winnerPoints,
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

    commitState({
      ...state,
      schools: [...state.schools, newSchool],
      runQueue: {
        1: {
          ...state.runQueue[1],
          queueSchoolIds: [...state.runQueue[1].queueSchoolIds, newId]
        },
        2: {
          ...state.runQueue[2],
          queueSchoolIds: [...state.runQueue[2].queueSchoolIds, newId]
        }
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

    commitState({
      ...state,
      schools: updatedSchools,
      scores: updatedScores,
      runQueue: {
        1: {
          currentSchoolId: state.runQueue[1].currentSchoolId === id ? null : state.runQueue[1].currentSchoolId,
          queueSchoolIds: state.runQueue[1].queueSchoolIds.filter(x => x !== id),
          completedSchoolIds: state.runQueue[1].completedSchoolIds.filter(x => x !== id)
        },
        2: {
          currentSchoolId: state.runQueue[2].currentSchoolId === id ? null : state.runQueue[2].currentSchoolId,
          queueSchoolIds: state.runQueue[2].queueSchoolIds.filter(x => x !== id),
          completedSchoolIds: state.runQueue[2].completedSchoolIds.filter(x => x !== id)
        }
      },
      lastUpdated: Date.now()
    });
  }, [state, commitState]);

  const loadDemoSchools = useCallback(() => {
    commitState({
      ...defaultInitialState,
      lastUpdated: Date.now()
    });
  }, [commitState]);

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

  const resetAllCompetitionData = useCallback(() => {
    commitState({
      ...defaultInitialState,
      auditLogs: [{
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: 1,
        schoolName: 'System',
        teamName: 'Master Reset',
        action: 'Competition reset performed by operator'
      }],
      lastUpdated: Date.now()
    });
  }, [commitState]);

  const resetAllScores = useCallback(() => {
    commitState({
      ...state,
      scores: {},
      robotWarMatches: state.robotWarMatches.map(m => ({
        ...m,
        result: 'pending',
        winnerId: undefined,
        timeLeftSeconds: 0,
        teamAPoints: 0,
        teamBPoints: 0,
        status: 'scheduled'
      })),
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

  const undoLastAction = useCallback(() => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    commitState(previous, false);
  }, [historyStack, commitState]);

  return (
    <CompetitionContext.Provider
      value={{
        state,
        leaderboard,
        hasActiveTie,
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
        saveBlockPullDraft,
        publishBlockPullScore,
        createRobotWarMatch,
        setActiveRobotWarMatch,
        saveRobotWarDraft,
        publishRobotWarResult,
        addSchool,
        editSchool,
        deleteSchool,
        loadDemoSchools,
        clearAllSchools,
        setGrandWinner,
        triggerWinnerMode,
        exitWinnerMode,
        correctScoreManually,
        resetAllCompetitionData,
        resetAllScores,
        importState,
        undoLastAction,
        canUndo: historyStack.length > 0,
        isDisplayMode,
        setIsDisplayMode,
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
