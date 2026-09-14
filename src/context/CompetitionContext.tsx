import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  CompetitionState, 
  School, 
  BlockPushScore, 
  BlockPullScore, 
  RobotWarMatch, 
  CompetitionStatus, 
  PublicDisplayState,
  AuditLogEntry
} from '../types';
import { INITIAL_DEMO_SCHOOLS, INITIAL_PRESET_MATCHES } from '../data/demoSchools';
import { 
  OFFICIAL_BLOCK_PUSH_TIERS, 
  OFFICIAL_PUSH_ZONES,
  OFFICIAL_BLOCK_PULL_TIERS, 
  OFFICIAL_PULL_DISTANCES,
  OFFICIAL_ROBOT_WAR_RULES 
} from '../data/officialRules';

const STORAGE_KEY = 'BRL_2026_COMPETITION_STATE_V2';
const SYNC_CHANNEL_NAME = 'BRL_2026_SYNC_CHANNEL';

export interface LeaderboardRow {
  rank: number;
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
  currentSchool: School | null;
  upNextSchool: School | null;
  followingSchool: School | null;
  activeRobotWarMatch: RobotWarMatch | null;
  grandWinner: { school: School; row: LeaderboardRow } | null;
  
  // Navigation / State controls
  setCurrentRound: (round: 1 | 2 | 3) => void;
  setDisplayState: (state: PublicDisplayState) => void;
  setCompetitionStatus: (status: CompetitionStatus) => void;
  
  // Queue Management
  advanceQueue: () => void;
  setCurrentTeamManually: (schoolId: string) => void;
  reorderQueue: (newQueueIds: string[]) => void;
  
  // Scoring Operations
  saveBlockPushDraft: (schoolId: string, scoreData: Partial<BlockPushScore>) => void;
  publishBlockPushScore: (schoolId: string, scoreData: Omit<BlockPushScore, 'isDraft' | 'publishedAt'>) => void;
  
  saveBlockPullDraft: (schoolId: string, scoreData: Partial<BlockPullScore>) => void;
  publishBlockPullScore: (schoolId: string, scoreData: Omit<BlockPullScore, 'isDraft' | 'publishedAt'>) => void;
  
  // Robot War Operations
  createRobotWarMatch: (teamAId: string, teamBId: string, matchNotes?: string) => string;
  setActiveRobotWarMatch: (matchId: string | null) => void;
  saveRobotWarDraft: (matchId: string, result: RobotWarMatch['result'], winType?: RobotWarMatch['winType'], notes?: string) => void;
  publishRobotWarResult: (matchId: string, result: 'team_a_win' | 'team_b_win' | 'draw', winType?: RobotWarMatch['winType'], notes?: string) => void;
  
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
  undoLastAction: () => void;
  canUndo: boolean;
  
  // View mode helper
  isDisplayMode: boolean;
  setIsDisplayMode: (val: boolean) => void;
}

const defaultInitialState: CompetitionState = {
  eventName: 'Bharat Robotics League',
  year: '2026',
  eventDate: '29 September 2026',
  status: 'live',
  currentRound: 1,
  displayState: 'live_run',
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
    // Pre-populate realistic published score samples for demonstration, clearly marked
    'sch_bombay_scottish': {
      schoolId: 'sch_bombay_scottish',
      round1: {
        weightTierId: 'push_tier_3',
        weightCategoryLabel: 'Category 3: Heavy Block (1 kg)',
        basePoints: 70,
        quantity: 1,
        targetZone: 'bullseye',
        zoneMultiplier: 2.0,
        timeSeconds: 48,
        bonusCleanRun: true,
        bonusSpeedRun: true,
        bonusPoints: 35,
        penaltyBoundary: 0,
        penaltyReset: 0,
        penaltyPoints: 0,
        calculatedScore: 175,
        isDraft: false,
        publishedAt: '2026-09-29T10:15:00Z',
        notes: 'Exceptional autonomous center positioning'
      },
      round2: {
        pullTierId: 'pull_tier_3',
        pullTierLabel: 'Tier 3: 3.0 kg Sled Tow',
        basePoints: 115,
        distanceAchieved: 'full',
        distanceMultiplier: 1.0,
        timeSeconds: 38,
        bonusSpeed: true,
        bonusZeroSlip: true,
        bonusPoints: 40,
        penaltyLineFoul: 0,
        penaltyDisconnect: 0,
        penaltyPoints: 0,
        calculatedScore: 155,
        isDraft: false,
        publishedAt: '2026-09-29T11:20:00Z'
      },
      round3Score: 75,
      totalScore: 405
    },
    'sch_kv_iit_powai': {
      schoolId: 'sch_kv_iit_powai',
      round1: {
        weightTierId: 'push_tier_4',
        weightCategoryLabel: 'Category 4: Super Heavy Block (1.75 kg)',
        basePoints: 110,
        quantity: 1,
        targetZone: 'middle',
        zoneMultiplier: 1.5,
        timeSeconds: 52,
        bonusCleanRun: true,
        bonusSpeedRun: true,
        bonusPoints: 35,
        penaltyBoundary: 1,
        penaltyReset: 0,
        penaltyPoints: 5,
        calculatedScore: 195,
        isDraft: false,
        publishedAt: '2026-09-29T10:30:00Z'
      },
      round2: {
        pullTierId: 'pull_tier_4',
        pullTierLabel: 'Tier 4: 4.0 kg Heavy Titan',
        basePoints: 160,
        distanceAchieved: 'full',
        distanceMultiplier: 1.0,
        timeSeconds: 42,
        bonusSpeed: true,
        bonusZeroSlip: false,
        bonusPoints: 25,
        penaltyLineFoul: 0,
        penaltyDisconnect: 0,
        penaltyPoints: 0,
        calculatedScore: 185,
        isDraft: false,
        publishedAt: '2026-09-29T11:45:00Z'
      },
      round3Score: 35,
      totalScore: 415
    },
    'sch_nps_blr': {
      schoolId: 'sch_nps_blr',
      round1: {
        weightTierId: 'push_tier_2',
        weightCategoryLabel: 'Category 2: Medium Block (500g)',
        basePoints: 40,
        quantity: 2,
        targetZone: 'bullseye',
        zoneMultiplier: 2.0,
        timeSeconds: 59,
        bonusCleanRun: true,
        bonusSpeedRun: true,
        bonusPoints: 35,
        penaltyBoundary: 0,
        penaltyReset: 0,
        penaltyPoints: 0,
        calculatedScore: 195,
        isDraft: false,
        publishedAt: '2026-09-29T10:45:00Z'
      },
      round2: null,
      round3Score: 0,
      totalScore: 195
    }
  },
  robotWarMatches: INITIAL_PRESET_MATCHES,
  auditLogs: [
    {
      id: 'log_01',
      timestamp: '09:30 AM',
      round: 1,
      schoolName: 'Bombay Scottish School',
      teamName: 'TitanForge 9',
      action: 'Score published',
      newScore: 175,
      operatorNote: 'Flawless run validated by chief referee'
    },
    {
      id: 'log_02',
      timestamp: '09:48 AM',
      round: 1,
      schoolName: 'Kendriya Vidyalaya IIT Powai',
      teamName: 'Vidyut CyberBots',
      action: 'Score published',
      newScore: 195,
      operatorNote: 'Approved Category 4 push'
    }
  ],
  lastUpdated: Date.now()
};

const CompetitionContext = createContext<CompetitionContextType | null>(null);

export const CompetitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check URL param ?mode=display or #display for direct launch
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

  // Push state update helper with broadcast & localStorage
  const commitState = useCallback((newState: CompetitionState, allowUndo: boolean = true) => {
    if (allowUndo) {
      setHistoryStack(prev => [...prev.slice(-15), state]);
    }
    setState(newState);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        // Cross-tab broadcast
        const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.postMessage({ type: 'BRL_STATE_UPDATE', state: newState });
        channel.close();
      } catch (e) {
        console.error('Broadcast / storage error:', e);
      }
    }
  }, [state]);

  // Listen to BroadcastChannel and localStorage events for 0-latency multi-tab sync
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

  // Compute Leaderboard deterministically based on official tie-breaking rules:
  // 1. Total score (Round 1 + Round 2 + Round 3)
  // 2. Highest Round 3 score
  // 3. Highest Round 2 score
  // 4. Highest Round 1 score
  // 5. Lowest cumulative penalties
  const leaderboard = useMemo<LeaderboardRow[]>(() => {
    const currentQueue = state.runQueue[state.currentRound === 3 ? 1 : state.currentRound];
    const currentPlayingId = currentQueue?.currentSchoolId;

    const rows: LeaderboardRow[] = state.schools
      .filter(s => s.isActive)
      .map(school => {
        const scoreRecord = state.scores[school.id];
        const r1Score = (scoreRecord?.round1 && !scoreRecord.round1.isDraft) ? scoreRecord.round1.calculatedScore : 0;
        const r2Score = (scoreRecord?.round2 && !scoreRecord.round2.isDraft) ? scoreRecord.round2.calculatedScore : 0;
        const r3Score = scoreRecord?.round3Score || 0;
        
        const r1Penalties = (scoreRecord?.round1 && !scoreRecord.round1.isDraft) ? scoreRecord.round1.penaltyPoints : 0;
        const r2Penalties = (scoreRecord?.round2 && !scoreRecord.round2.isDraft) ? scoreRecord.round2.penaltyPoints : 0;
        const totalPenalties = r1Penalties + r2Penalties;

        const total = r1Score + r2Score + r3Score;
        const hasPlayedAny = (r1Score > 0 || r2Score > 0 || r3Score > 0 || !!scoreRecord?.round1 || !!scoreRecord?.round2);

        return {
          rank: 0,
          school,
          round1Score: r1Score,
          round2Score: r2Score,
          round3Score: r3Score,
          totalScore: total,
          totalPenalties,
          hasPlayedAny,
          isCurrentPlaying: school.id === currentPlayingId
        };
      });

    // Deterministic sorting with official BRL tie-breaking
    rows.sort((a, b) => {
      // Primary: Total Score descending
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      // Tie-break 1: Round 3 (Robot War) points descending
      if (b.round3Score !== a.round3Score) return b.round3Score - a.round3Score;
      // Tie-break 2: Round 2 (Block Pull) points descending
      if (b.round2Score !== a.round2Score) return b.round2Score - a.round2Score;
      // Tie-break 3: Round 1 (Block Push) points descending
      if (b.round1Score !== a.round1Score) return b.round1Score - a.round1Score;
      // Tie-break 4: Lowest cumulative penalties ascending
      if (a.totalPenalties !== b.totalPenalties) return a.totalPenalties - b.totalPenalties;
      // Tie-break 5: Alphabetical by School Name
      return a.school.name.localeCompare(b.school.name);
    });

    // Assign sequential ranks
    return rows.map((row, index) => ({
      ...row,
      rank: index + 1
    }));
  }, [state.schools, state.scores, state.currentRound, state.runQueue]);

  // Queue school entities
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
    if (!state.grandWinnerSchoolId && leaderboard.length > 0) {
      const topRow = leaderboard[0];
      return { school: topRow.school, row: topRow };
    }
    const found = leaderboard.find(l => l.school.id === state.grandWinnerSchoolId);
    if (found) return { school: found.school, row: found };
    return leaderboard[0] ? { school: leaderboard[0].school, row: leaderboard[0] } : null;
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
      action: `Advanced run queue: Next playing is ${nextSchoolObj?.name || 'End of Queue'}`
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
  const saveBlockPushDraft = useCallback((schoolId: string, scoreData: Partial<BlockPushScore>) => {
    const existing = state.scores[schoolId]?.round1;
    const draft: BlockPushScore = {
      weightTierId: scoreData.weightTierId || existing?.weightTierId || OFFICIAL_BLOCK_PUSH_TIERS[0].id,
      weightCategoryLabel: scoreData.weightCategoryLabel || existing?.weightCategoryLabel || OFFICIAL_BLOCK_PUSH_TIERS[0].name,
      basePoints: scoreData.basePoints ?? existing?.basePoints ?? OFFICIAL_BLOCK_PUSH_TIERS[0].basePoints,
      quantity: scoreData.quantity ?? existing?.quantity ?? 1,
      targetZone: scoreData.targetZone || existing?.targetZone || 'outer',
      zoneMultiplier: scoreData.zoneMultiplier ?? existing?.zoneMultiplier ?? 1.0,
      timeSeconds: scoreData.timeSeconds ?? existing?.timeSeconds ?? 60,
      bonusCleanRun: scoreData.bonusCleanRun ?? existing?.bonusCleanRun ?? false,
      bonusSpeedRun: scoreData.bonusSpeedRun ?? existing?.bonusSpeedRun ?? false,
      bonusPoints: scoreData.bonusPoints ?? existing?.bonusPoints ?? 0,
      penaltyBoundary: scoreData.penaltyBoundary ?? existing?.penaltyBoundary ?? 0,
      penaltyReset: scoreData.penaltyReset ?? existing?.penaltyReset ?? 0,
      penaltyPoints: scoreData.penaltyPoints ?? existing?.penaltyPoints ?? 0,
      calculatedScore: scoreData.calculatedScore ?? existing?.calculatedScore ?? 0,
      isDraft: true,
      notes: scoreData.notes ?? existing?.notes ?? ''
    };

    // Keep draft locally; do not affect public published state
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
          round1: draft
        }
      },
      lastUpdated: Date.now()
    }, false); // don't push draft to undo history
  }, [state, commitState]);

  const publishBlockPushScore = useCallback((schoolId: string, scoreData: Omit<BlockPushScore, 'isDraft' | 'publishedAt'>) => {
    const school = state.schools.find(s => s.id === schoolId);
    const existing = state.scores[schoolId];
    const oldScore = (existing?.round1 && !existing.round1.isDraft) ? existing.round1.calculatedScore : 0;
    
    const publishedScore: BlockPushScore = {
      ...scoreData,
      isDraft: false,
      publishedAt: new Date().toISOString()
    };

    const r2 = (existing?.round2 && !existing.round2.isDraft) ? existing.round2.calculatedScore : 0;
    const r3 = existing?.round3Score || 0;
    const newTotal = publishedScore.calculatedScore + r2 + r3;

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: 1,
      schoolName: school?.name || 'Unknown',
      teamName: school?.teamName || '',
      action: oldScore > 0 ? `Score corrected: ${oldScore} → ${publishedScore.calculatedScore}` : `Score published: ${publishedScore.calculatedScore}`,
      oldScore: oldScore > 0 ? oldScore : undefined,
      newScore: publishedScore.calculatedScore,
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
  const saveBlockPullDraft = useCallback((schoolId: string, scoreData: Partial<BlockPullScore>) => {
    const existing = state.scores[schoolId]?.round2;
    const draft: BlockPullScore = {
      pullTierId: scoreData.pullTierId || existing?.pullTierId || OFFICIAL_BLOCK_PULL_TIERS[0].id,
      pullTierLabel: scoreData.pullTierLabel || existing?.pullTierLabel || OFFICIAL_BLOCK_PULL_TIERS[0].name,
      basePoints: scoreData.basePoints ?? existing?.basePoints ?? OFFICIAL_BLOCK_PULL_TIERS[0].basePoints,
      distanceAchieved: scoreData.distanceAchieved || existing?.distanceAchieved || 'full',
      distanceMultiplier: scoreData.distanceMultiplier ?? existing?.distanceMultiplier ?? 1.0,
      timeSeconds: scoreData.timeSeconds ?? existing?.timeSeconds ?? 50,
      bonusSpeed: scoreData.bonusSpeed ?? existing?.bonusSpeed ?? false,
      bonusZeroSlip: scoreData.bonusZeroSlip ?? existing?.bonusZeroSlip ?? false,
      bonusPoints: scoreData.bonusPoints ?? existing?.bonusPoints ?? 0,
      penaltyLineFoul: scoreData.penaltyLineFoul ?? existing?.penaltyLineFoul ?? 0,
      penaltyDisconnect: scoreData.penaltyDisconnect ?? existing?.penaltyDisconnect ?? 0,
      penaltyPoints: scoreData.penaltyPoints ?? existing?.penaltyPoints ?? 0,
      calculatedScore: scoreData.calculatedScore ?? existing?.calculatedScore ?? 0,
      isDraft: true,
      notes: scoreData.notes ?? existing?.notes ?? ''
    };

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
          round2: draft
        }
      },
      lastUpdated: Date.now()
    }, false);
  }, [state, commitState]);

  const publishBlockPullScore = useCallback((schoolId: string, scoreData: Omit<BlockPullScore, 'isDraft' | 'publishedAt'>) => {
    const school = state.schools.find(s => s.id === schoolId);
    const existing = state.scores[schoolId];
    const oldScore = (existing?.round2 && !existing.round2.isDraft) ? existing.round2.calculatedScore : 0;
    
    const publishedScore: BlockPullScore = {
      ...scoreData,
      isDraft: false,
      publishedAt: new Date().toISOString()
    };

    const r1 = (existing?.round1 && !existing.round1.isDraft) ? existing.round1.calculatedScore : 0;
    const r3 = existing?.round3Score || 0;
    const newTotal = r1 + publishedScore.calculatedScore + r3;

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: 2,
      schoolName: school?.name || 'Unknown',
      teamName: school?.teamName || '',
      action: oldScore > 0 ? `Score corrected: ${oldScore} → ${publishedScore.calculatedScore}` : `Score published: ${publishedScore.calculatedScore}`,
      oldScore: oldScore > 0 ? oldScore : undefined,
      newScore: publishedScore.calculatedScore,
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

  // Round 3 (Robot War)
  const createRobotWarMatch = useCallback((teamAId: string, teamBId: string, matchNotes?: string): string => {
    const newId = `match_${Date.now()}`;
    const newMatch: RobotWarMatch = {
      id: newId,
      matchNumber: state.robotWarMatches.length + 1,
      teamAId,
      teamBId,
      result: 'pending',
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

  const saveRobotWarDraft = useCallback((matchId: string, result: RobotWarMatch['result'], winType?: RobotWarMatch['winType'], notes?: string) => {
    let teamAPts = 0;
    let teamBPts = 0;
    if (result === 'team_a_win') {
      if (winType === 'knockout') {
        teamAPts = OFFICIAL_ROBOT_WAR_RULES.knockout.winnerPoints;
        teamBPts = OFFICIAL_ROBOT_WAR_RULES.knockout.loserPoints;
      } else if (winType === 'disqualification') {
        teamAPts = OFFICIAL_ROBOT_WAR_RULES.disqualification.winnerPoints;
        teamBPts = OFFICIAL_ROBOT_WAR_RULES.disqualification.loserPoints;
      } else {
        teamAPts = OFFICIAL_ROBOT_WAR_RULES.judgesDecision.winnerPoints;
        teamBPts = OFFICIAL_ROBOT_WAR_RULES.judgesDecision.loserPoints;
      }
    } else if (result === 'team_b_win') {
      if (winType === 'knockout') {
        teamBPts = OFFICIAL_ROBOT_WAR_RULES.knockout.winnerPoints;
        teamAPts = OFFICIAL_ROBOT_WAR_RULES.knockout.loserPoints;
      } else if (winType === 'disqualification') {
        teamBPts = OFFICIAL_ROBOT_WAR_RULES.disqualification.winnerPoints;
        teamAPts = OFFICIAL_ROBOT_WAR_RULES.disqualification.loserPoints;
      } else {
        teamBPts = OFFICIAL_ROBOT_WAR_RULES.judgesDecision.winnerPoints;
        teamAPts = OFFICIAL_ROBOT_WAR_RULES.judgesDecision.loserPoints;
      }
    } else if (result === 'draw') {
      teamAPts = OFFICIAL_ROBOT_WAR_RULES.draw.teamAPoints;
      teamBPts = OFFICIAL_ROBOT_WAR_RULES.draw.teamBPoints;
    }

    const updatedMatches = state.robotWarMatches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          result,
          winType,
          teamAPoints: teamAPts,
          teamBPoints: teamBPts,
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
    result: 'team_a_win' | 'team_b_win' | 'draw', 
    winType: RobotWarMatch['winType'] = 'knockout', 
    notes?: string
  ) => {
    let teamAPts = 0;
    let teamBPts = 0;

    if (result === 'team_a_win') {
      if (winType === 'knockout') {
        teamAPts = OFFICIAL_ROBOT_WAR_RULES.knockout.winnerPoints;
        teamBPts = OFFICIAL_ROBOT_WAR_RULES.knockout.loserPoints;
      } else if (winType === 'disqualification') {
        teamAPts = OFFICIAL_ROBOT_WAR_RULES.disqualification.winnerPoints;
        teamBPts = OFFICIAL_ROBOT_WAR_RULES.disqualification.loserPoints;
      } else {
        teamAPts = OFFICIAL_ROBOT_WAR_RULES.judgesDecision.winnerPoints;
        teamBPts = OFFICIAL_ROBOT_WAR_RULES.judgesDecision.loserPoints;
      }
    } else if (result === 'team_b_win') {
      if (winType === 'knockout') {
        teamBPts = OFFICIAL_ROBOT_WAR_RULES.knockout.winnerPoints;
        teamAPts = OFFICIAL_ROBOT_WAR_RULES.knockout.loserPoints;
      } else if (winType === 'disqualification') {
        teamBPts = OFFICIAL_ROBOT_WAR_RULES.disqualification.winnerPoints;
        teamAPts = OFFICIAL_ROBOT_WAR_RULES.disqualification.loserPoints;
      } else {
        teamBPts = OFFICIAL_ROBOT_WAR_RULES.judgesDecision.winnerPoints;
        teamAPts = OFFICIAL_ROBOT_WAR_RULES.judgesDecision.loserPoints;
      }
    } else if (result === 'draw') {
      teamAPts = OFFICIAL_ROBOT_WAR_RULES.draw.teamAPoints;
      teamBPts = OFFICIAL_ROBOT_WAR_RULES.draw.teamBPoints;
    }

    const match = state.robotWarMatches.find(m => m.id === matchId);
    if (!match) return;

    const teamASchool = state.schools.find(s => s.id === match.teamAId);
    const teamBSchool = state.schools.find(s => s.id === match.teamBId);

    const updatedMatches = state.robotWarMatches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          result,
          winType,
          teamAPoints: teamAPts,
          teamBPoints: teamBPts,
          status: 'completed' as const,
          isDraft: false,
          publishedAt: new Date().toISOString(),
          matchNotes: notes ?? m.matchNotes
        };
      }
      return m;
    });

    // Update Round 3 accumulated points for both teams
    const updatedScores = { ...state.scores };

    // Team A
    const currentScoreA = updatedScores[match.teamAId] || {
      schoolId: match.teamAId,
      round1: null,
      round2: null,
      round3Score: 0,
      totalScore: 0
    };
    const r1A = (currentScoreA.round1 && !currentScoreA.round1.isDraft) ? currentScoreA.round1.calculatedScore : 0;
    const r2A = (currentScoreA.round2 && !currentScoreA.round2.isDraft) ? currentScoreA.round2.calculatedScore : 0;
    updatedScores[match.teamAId] = {
      ...currentScoreA,
      round3Score: teamAPts,
      totalScore: r1A + r2A + teamAPts
    };

    // Team B
    const currentScoreB = updatedScores[match.teamBId] || {
      schoolId: match.teamBId,
      round1: null,
      round2: null,
      round3Score: 0,
      totalScore: 0
    };
    const r1B = (currentScoreB.round1 && !currentScoreB.round1.isDraft) ? currentScoreB.round1.calculatedScore : 0;
    const r2B = (currentScoreB.round2 && !currentScoreB.round2.isDraft) ? currentScoreB.round2.calculatedScore : 0;
    updatedScores[match.teamBId] = {
      ...currentScoreB,
      round3Score: teamBPts,
      totalScore: r1B + r2B + teamBPts
    };

    const winnerName = result === 'team_a_win' 
      ? teamASchool?.name 
      : result === 'team_b_win' 
        ? teamBSchool?.name 
        : 'Draw Match';

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: 3,
      schoolName: `${teamASchool?.name || 'A'} vs ${teamBSchool?.name || 'B'}`,
      teamName: `Match #${match.matchNumber}`,
      action: `Robot War Result: ${winnerName} (${teamAPts} - ${teamBPts})`,
      newScore: teamAPts
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

    // Also add to queues
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
      ...state,
      schools: INITIAL_DEMO_SCHOOLS,
      runQueue: {
        1: {
          currentSchoolId: INITIAL_DEMO_SCHOOLS[0].id,
          queueSchoolIds: INITIAL_DEMO_SCHOOLS.slice(1).map(s => s.id),
          completedSchoolIds: []
        },
        2: {
          currentSchoolId: INITIAL_DEMO_SCHOOLS[0].id,
          queueSchoolIds: INITIAL_DEMO_SCHOOLS.slice(1).map(s => s.id),
          completedSchoolIds: []
        }
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
      oldScore = existing.round1?.calculatedScore || 0;
      updatedScores[schoolId] = {
        ...existing,
        round1: {
          ...(existing.round1 || {
            weightTierId: OFFICIAL_BLOCK_PUSH_TIERS[0].id,
            weightCategoryLabel: 'Manual Correction',
            basePoints: newScore,
            quantity: 1,
            targetZone: 'outer',
            zoneMultiplier: 1.0,
            bonusCleanRun: false,
            bonusSpeedRun: false,
            bonusPoints: 0,
            penaltyBoundary: 0,
            penaltyReset: 0,
            penaltyPoints: 0,
            notes: ''
          }),
          calculatedScore: newScore,
          isDraft: false,
          publishedAt: new Date().toISOString(),
          notes: `[Manual Correction] ${reason}`
        },
        totalScore: newScore + (existing.round2?.calculatedScore || 0) + existing.round3Score
      };
    } else if (round === 2) {
      oldScore = existing.round2?.calculatedScore || 0;
      updatedScores[schoolId] = {
        ...existing,
        round2: {
          ...(existing.round2 || {
            pullTierId: OFFICIAL_BLOCK_PULL_TIERS[0].id,
            pullTierLabel: 'Manual Correction',
            basePoints: newScore,
            distanceAchieved: 'full',
            distanceMultiplier: 1.0,
            bonusSpeed: false,
            bonusZeroSlip: false,
            bonusPoints: 0,
            penaltyLineFoul: 0,
            penaltyDisconnect: 0,
            penaltyPoints: 0,
            notes: ''
          }),
          calculatedScore: newScore,
          isDraft: false,
          publishedAt: new Date().toISOString(),
          notes: `[Manual Correction] ${reason}`
        },
        totalScore: (existing.round1?.calculatedScore || 0) + newScore + existing.round3Score
      };
    } else if (round === 3) {
      oldScore = existing.round3Score || 0;
      updatedScores[schoolId] = {
        ...existing,
        round3Score: newScore,
        totalScore: (existing.round1?.calculatedScore || 0) + (existing.round2?.calculatedScore || 0) + newScore
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
      schools: INITIAL_DEMO_SCHOOLS,
      scores: {},
      robotWarMatches: INITIAL_PRESET_MATCHES,
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

  const undoLastAction = useCallback(() => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    setState(previous);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(previous));
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.postMessage({ type: 'BRL_STATE_UPDATE', state: previous });
      channel.close();
    }
  }, [historyStack]);

  return (
    <CompetitionContext.Provider
      value={{
        state,
        leaderboard,
        currentSchool,
        upNextSchool,
        followingSchool,
        activeRobotWarMatch,
        grandWinner,
        setCurrentRound,
        setDisplayState,
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
        undoLastAction,
        canUndo: historyStack.length > 0,
        isDisplayMode,
        setIsDisplayMode
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
