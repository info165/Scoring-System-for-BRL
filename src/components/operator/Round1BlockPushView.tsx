import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Edit3, 
  Send, 
  Clock, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Check, 
  Tv, 
  Undo2,
  X,
  Flame,
  LayoutGrid
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { useAuth } from '../../context/AuthContext';
import { useArenaTimer } from '../../hooks/useArenaTimer';
import { 
  OFFICIAL_BLOCK_WEIGHTS, 
  BLOCK_PUSH_CONFIG, 
  calculateBlockPushScore 
} from '../../data/officialRules';
import { PushBlockStatus } from '../../types';

export const Round1BlockPushView: React.FC = () => {
  const { 
    state, 
    currentSchool, 
    upNextSchool, 
    saveBlockPushDraft, 
    publishBlockPushScore, 
    discardDraftRun,
    advanceQueue,
    setDisplayState,
    setCurrentTeamManually,
    startActiveRun,
    updateActiveRunBlock,
    stopActiveRun,
    restartActiveRun,
    unlockActiveRunReview
  } = useCompetition();

  const { currentUser, userRole } = useAuth();

  const {
    remainingSeconds,
    formattedTime,
    status: timerStatus,
    isUrgent,
    isTimeOver,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer
  } = useArenaTimer(1);

  // Evaluator Mode view state (true by default)
  const [evaluatorMode, setEvaluatorMode] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Active school selection
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  
  // 6 official blocks: weightId -> 'none' | 'complete' | 'incomplete'
  const [blockStatuses, setBlockStatuses] = useState<Record<string, PushBlockStatus>>({
    '200g': 'none',
    '500g': 'none',
    '700g': 'none',
    '1kg': 'none',
    '2kg': 'none',
    '4kg': 'none',
  });

  // Score override / discrepancy modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [manualTimeBonus, setManualTimeBonus] = useState<number | null>(null);
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  
  // Reset run confirmation modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // Success / Feedback alert
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Keep selectedSchoolId in sync with current queue team
  useEffect(() => {
    if (currentSchool && (!selectedSchoolId || selectedSchoolId !== currentSchool.id)) {
      setSelectedSchoolId(currentSchool.id);
    } else if (!selectedSchoolId && state.schools.length > 0) {
      setSelectedSchoolId(state.schools[0].id);
    }
  }, [currentSchool, state.schools, selectedSchoolId]);

  // Marks on screen. A run that is under way (or just stopped) is the source of truth; otherwise
  // the saved score is shown. Keyed on the data itself, not the whole scores map, so unrelated
  // saves from other operators or tabs cannot reset what is on screen. An official score is never
  // used as the starting point of a new run.
  const savedRound1Key = JSON.stringify(state.scores[selectedSchoolId]?.round1 ?? null);
  const liveRun = state.activeRun;
  const liveRunIsThisTeams = !!liveRun && !!selectedSchoolId && liveRun.schoolId === selectedSchoolId;
  const liveRunKey = liveRunIsThisTeams ? JSON.stringify({ s: liveRun!.status, b: liveRun!.blocks }) : 'none';
  useEffect(() => {
    if (!selectedSchoolId) return;
    const none: Record<string, PushBlockStatus> = {
      '200g': 'none',
      '500g': 'none',
      '700g': 'none',
      '1kg': 'none',
      '2kg': 'none',
      '4kg': 'none',
    };

    if (liveRunIsThisTeams && (liveRun!.status === 'RUNNING' || liveRun!.status === 'STOPPED')) {
      setBlockStatuses({ ...none, ...liveRun!.blocks });
      return;
    }
    if (liveRunIsThisTeams && liveRun!.status === 'READY') {
      setBlockStatuses(none);
      setOperatorNotes('');
      setManualTimeBonus(null);
      return;
    }

    const existing = state.scores[selectedSchoolId]?.round1;
    if (existing) {
      const statuses = { ...none };
      if (existing.blocks && Array.isArray(existing.blocks)) {
        existing.blocks.forEach(b => {
          if (statuses[b.weightId] !== undefined) {
            statuses[b.weightId] = b.status;
          }
        });
      }
      setBlockStatuses(statuses);
      setOperatorNotes(existing.notes || '');
    } else {
      setBlockStatuses(none);
      setOperatorNotes('');
      setManualTimeBonus(null);
    }
  }, [selectedSchoolId, savedRound1Key, liveRunKey]);

  // Run state logic:
  // - idle: READY TO START (Time bonus is inactive = 0 pts)
  // - running: LIVE RUN IN PROGRESS (Time bonus = remaining seconds)
  // - stopped: REVIEW / READY TO PUBLISH (Time bonus = frozen remaining seconds)
  // - time_over: REVIEW / READY TO PUBLISH (Time bonus = 0 pts)
  const isRunStarted = timerStatus === 'running' || timerStatus === 'stopped' || timerStatus === 'time_over' || manualTimeBonus !== null;
  const effectiveTimeLeft = !isRunStarted
    ? 120
    : timerStatus === 'time_over'
      ? 0
      : (manualTimeBonus !== null ? manualTimeBonus : remainingSeconds);

  const timeBonusEarned = !isRunStarted
    ? 0
    : timerStatus === 'time_over'
      ? 0
      : effectiveTimeLeft;

  // Active blocks payload for official calculation
  const activeInputBlocks = OFFICIAL_BLOCK_WEIGHTS.map(def => ({
    weightId: def.id,
    status: blockStatuses[def.id] || 'none'
  }));

  const activeSchool = state.schools.find(s => s.id === selectedSchoolId);
  const existingScore = activeSchool ? state.scores[activeSchool.id]?.round1 : null;
  const isPublished = !!(existingScore && !existingScore.isDraft);
  // An official score exists and this team is being run again; the official score stays untouched
  // until the new score is published.
  const isRerunInProgress = isPublished && liveRunIsThisTeams && (liveRun!.status === 'RUNNING' || liveRun!.status === 'STOPPED');

  // Authoritative calculation
  const calculatedBlockScore = activeInputBlocks.reduce((sum, item) => {
    const blockDef = OFFICIAL_BLOCK_WEIGHTS.find(b => b.id === item.weightId);
    if (!blockDef) return sum;
    if (item.status === 'complete') return sum + blockDef.fullPoints;
    if (item.status === 'incomplete') return sum + blockDef.incompletePoints;
    return sum;
  }, 0);

  const scoreCalculation = {
    blocks: activeInputBlocks.map(item => {
      const blockDef = OFFICIAL_BLOCK_WEIGHTS.find(b => b.id === item.weightId)!;
      const pts = item.status === 'complete' ? blockDef.fullPoints : item.status === 'incomplete' ? blockDef.incompletePoints : 0;
      return {
        weightId: item.weightId,
        status: item.status,
        pointsAwarded: pts
      };
    }),
    blockScore: calculatedBlockScore,
    timeLeftSeconds: effectiveTimeLeft,
    timeBonus: timeBonusEarned,
    finalScore: calculatedBlockScore + timeBonusEarned
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Block status handlers (fast 1-touch actions)
  const handleMarkBlock = (weightId: string, status: PushBlockStatus) => {
    setBlockStatuses(prev => ({
      ...prev,
      [weightId]: status
    }));

    // Update active run state (in-memory & cloud broadcast)
    updateActiveRunBlock(weightId, status, currentUser);

    // Auto-save draft quietly in background so state is never lost
    if (selectedSchoolId && isRunStarted) {
      const updatedBlocks = OFFICIAL_BLOCK_WEIGHTS.map(def => ({
        weightId: def.id,
        status: def.id === weightId ? status : (blockStatuses[def.id] || 'none')
      }));
      const blockPts = updatedBlocks.reduce((sum, item) => {
        const blockDef = OFFICIAL_BLOCK_WEIGHTS.find(b => b.id === item.weightId);
        if (!blockDef) return sum;
        if (item.status === 'complete') return sum + blockDef.fullPoints;
        if (item.status === 'incomplete') return sum + blockDef.incompletePoints;
        return sum;
      }, 0);

      saveBlockPushDraft(selectedSchoolId, {
        blocks: updatedBlocks.map(item => {
          const blockDef = OFFICIAL_BLOCK_WEIGHTS.find(b => b.id === item.weightId)!;
          const pts = item.status === 'complete' ? blockDef.fullPoints : item.status === 'incomplete' ? blockDef.incompletePoints : 0;
          return { weightId: item.weightId, status: item.status, pointsAwarded: pts };
        }),
        blockScore: blockPts,
        timeLeftSeconds: effectiveTimeLeft,
        timeBonus: timeBonusEarned,
        finalScore: blockPts + timeBonusEarned,
        isDraft: true,
        notes: operatorNotes
      });
    }
  };

  const handleClearBlock = (weightId: string) => {
    handleMarkBlock(weightId, 'none');
  };

  // Timer START
  const handleStartTimer = () => {
    setBlockStatuses({ '200g': 'none', '500g': 'none', '700g': 'none', '1kg': 'none', '2kg': 'none', '4kg': 'none' });
    setOperatorNotes('');
    setManualTimeBonus(null);
    startTimer(120);
    startActiveRun(selectedSchoolId, 1, currentUser);
  };

  // Timer STOP
  const handleStopTimer = () => {
    stopTimer();
    stopActiveRun(currentUser, effectiveTimeLeft);
    if (selectedSchoolId) {
      saveBlockPushDraft(selectedSchoolId, {
        ...scoreCalculation,
        isDraft: true,
        notes: operatorNotes
      });
    }
  };

  // Reset current run (restores 01:20, clears all blocks, and discards draft without saving to database)
  const handleConfirmResetRun = () => {
    setBlockStatuses({
      '200g': 'none',
      '500g': 'none',
      '700g': 'none',
      '1kg': 'none',
      '2kg': 'none',
      '4kg': 'none',
    });
    setManualTimeBonus(null);
    setOperatorNotes('');
    resetTimer(120);
    setIsResetConfirmOpen(false);

    restartActiveRun(selectedSchoolId, 1, currentUser);

    if (selectedSchoolId) {
      discardDraftRun(selectedSchoolId, 1);
    }

    setFeedbackMsg({ text: 'Run reset. Timer restored to 01:20 and score reset to 0.', type: 'info' });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // PUBLISH SCORE
  const handlePublishScore = () => {
    if (!selectedSchoolId) return;

    publishBlockPushScore(selectedSchoolId, {
      ...scoreCalculation,
      notes: operatorNotes
    });

    setFeedbackMsg({ 
      text: `Score of ${scoreCalculation.finalScore} PTS published for ${activeSchool?.name} (${activeSchool?.teamName})!`, 
      type: 'success' 
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // NEXT TEAM (Advance queue and reset for new team)
  const handleNextTeam = () => {
    advanceQueue();
    // Reset local run state for next team
    setBlockStatuses({
      '200g': 'none',
      '500g': 'none',
      '700g': 'none',
      '1kg': 'none',
      '2kg': 'none',
      '4kg': 'none',
    });
    setManualTimeBonus(null);
    setOperatorNotes('');
    resetTimer(120);
  };

  // Count pushed blocks
  const recordedCount = Object.values(blockStatuses).filter(s => s !== 'none').length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3 pb-8 select-none">
      
      {/* 1. COMPACT TOP HEADER BAR FOR EVALUATOR MODE */}
      <header className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 sm:px-5 flex items-center justify-between shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <img 
            src="/brl-logo.png" 
            alt="BRL Logo" 
            className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 font-display tracking-wider">
                BHARAT ROBOTICS LEAGUE 2026
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold font-mono uppercase">
                ROUND 1
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>POD 1 • LIVE</span>
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-display font-bold text-white tracking-wide">
              ROBO PUSH EVALUATOR CONSOLE
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          {/* Arena Display Shortcut */}
          <button
            onClick={() => setDisplayState('live_run')}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-700/60 rounded-xl text-xs font-semibold text-blue-200 transition"
            title="Launch synced Arena Screen"
          >
            <Tv className="w-3.5 h-3.5 text-blue-400" />
            <span>Arena Display</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-amber-400 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* View Mode Toggle */}
          <button
            onClick={() => setEvaluatorMode(!evaluatorMode)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
            <span>{evaluatorMode ? 'Admin View' : 'Evaluator View'}</span>
          </button>
        </div>
      </header>

      {/* Global Feedback notification */}
      {feedbackMsg && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200' 
            : 'bg-blue-950/80 border-blue-500 text-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackMsg(null)}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. MAIN EVALUATOR WORKSPACE (COMPACT, TOUCH-OPTIMIZED 2-PANEL LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* LEFT 7 COLS: CURRENT TEAM & BLOCK SELECTION CONTROLS */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* A. CURRENT TEAM & UP NEXT CARD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              
              {/* Now Playing */}
              <div>
                <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>NOW PLAYING (CURRENT TEAM)</span>
                </div>
                {activeSchool ? (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white leading-tight truncate">
                      {activeSchool.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-500/30">
                        {activeSchool.teamNumber}
                      </span>
                      <span className="text-sm font-bold text-amber-300 truncate">
                        {activeSchool.teamName}
                      </span>
                      <span className="text-xs text-slate-400">• {activeSchool.city}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic">No team currently staged</div>
                )}
              </div>

              {/* Up Next in Queue */}
              <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>UP NEXT (ON DECK)</span>
                </div>
                {upNextSchool ? (
                  <div>
                    <div className="text-sm sm:text-base font-display font-bold text-slate-200 truncate">
                      {upNextSchool.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {upNextSchool.teamName} ({upNextSchool.teamNumber})
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">End of round queue</div>
                )}

                {/* Quick School Switcher (for emergencies) */}
                <div className="mt-2">
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => {
                      setSelectedSchoolId(e.target.value);
                      setCurrentTeamManually(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                  >
                    {state.schools.map(s => (
                      <option key={s.id} value={s.id}>
                        Switch Team: {s.teamNumber} - {s.name} ({s.teamName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* B. THE 6 OFFICIAL BLOCK BUTTONS (LARGE, TOUCH-FRIENDLY, INSTANT RECORDING) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  OFFICIAL BLOCK WEIGHTS (6 BLOCKS)
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                <span className="text-white font-bold">{recordedCount}</span> / 6 Recorded
              </div>
            </div>

            {/* Grid of 6 Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {OFFICIAL_BLOCK_WEIGHTS.map((block) => {
                const currentStatus = blockStatuses[block.id] || 'none';
                const isComplete = currentStatus === 'complete';
                const isIncomplete = currentStatus === 'incomplete';
                const isRecorded = currentStatus !== 'none';
                const points = isComplete 
                  ? block.fullPoints 
                  : isIncomplete 
                    ? block.incompletePoints 
                    : 0;

                return (
                  <div
                    key={block.id}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      isComplete
                        ? 'bg-emerald-950/50 border-emerald-500 shadow-md shadow-emerald-950/40'
                        : isIncomplete
                          ? 'bg-amber-950/50 border-amber-500 shadow-md shadow-amber-950/40'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Block Header Info */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-display font-black text-white">
                        {block.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Max {block.fullPoints} pts
                      </span>
                    </div>

                    {/* Status Badge when Recorded */}
                    {isRecorded ? (
                      <div className="space-y-2">
                        <div className={`py-1 px-2 rounded-lg text-xs font-bold font-mono flex items-center justify-between ${
                          isComplete 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>{isComplete ? 'COMPLETE' : 'INCOMPLETE'}</span>
                          </span>
                          <span className="text-sm font-black">+{points} PTS</span>
                        </div>

                        {/* Edit / Change Button */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                          <button
                            onClick={() => handleMarkBlock(block.id, isComplete ? 'incomplete' : 'complete')}
                            className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 rounded-lg transition"
                          >
                            Set {isComplete ? 'Incomplete (50%)' : 'Complete (100%)'}
                          </button>
                          <button
                            onClick={() => handleClearBlock(block.id)}
                            className="py-1 px-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-[11px] font-semibold rounded-lg border border-rose-800/50 transition"
                            title="Clear block status"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Instant 1-Touch Action Buttons when Unrecorded */
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleMarkBlock(block.id, 'complete')}
                          className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition flex flex-col items-center justify-center leading-tight cursor-pointer"
                        >
                          <span className="text-[11px]">COMPLETE</span>
                          <span className="font-mono text-xs font-black">+{block.fullPoints} pts</span>
                        </button>

                        <button
                          onClick={() => handleMarkBlock(block.id, 'incomplete')}
                          className="py-2.5 px-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs font-bold rounded-lg shadow transition flex flex-col items-center justify-center leading-tight cursor-pointer"
                        >
                          <span className="text-[11px]">INCOMPLETE</span>
                          <span className="font-mono text-xs font-black">+{block.incompletePoints} pts</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT 5 COLS: TIMER, LIVE SCORE ACCUMULATION & ACTION WORKFLOW */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* C. 120-SECOND COUNTDOWN TIMER & CONTROLS */}
          <div className={`rounded-2xl border-2 p-4 sm:p-5 shadow-xl transition-all duration-300 ${
            isTimeOver
              ? 'bg-red-950/60 border-red-600'
              : isUrgent
                ? 'bg-red-950/40 border-red-500 animate-pulse'
                : 'bg-slate-900/95 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className={`w-3.5 h-3.5 ${isUrgent || isTimeOver ? 'text-red-400' : 'text-blue-400'}`} />
                <span>TIME REMAINING</span>
              </span>

              {isUrgent && (
                <span className="text-xs font-mono font-bold text-red-400 flex items-center gap-1 animate-bounce">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>FINAL 10s!</span>
                </span>
              )}

              {isTimeOver && (
                <span className="text-xs font-mono font-bold text-red-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>TIME OVER</span>
                </span>
              )}
            </div>

            {/* Big Prominent Timer Display */}
            <div className="text-center py-2">
              {isTimeOver ? (
                <div>
                  <div className="text-6xl sm:text-7xl font-mono font-black text-red-500 tracking-wider">
                    00:00
                  </div>
                  <div className="text-sm font-display font-black text-red-400 uppercase mt-0.5">
                    TIME OVER (0 TIME BONUS)
                  </div>
                </div>
              ) : (
                <div className={`text-6xl sm:text-7xl font-mono font-black tracking-tight ${
                  isUrgent 
                    ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                    : timerStatus === 'running' 
                      ? 'text-amber-400' 
                      : 'text-white'
                }`}>
                  {formattedTime}
                </div>
              )}

              <div className="text-xs font-mono text-slate-400 mt-1">
                Time Left: <span className="font-bold text-white">{effectiveTimeLeft}s</span> (Bonus: +{effectiveTimeLeft} pts)
              </div>
            </div>

            {/* PRIMARY TIMER ACTION BUTTON: START OR HUGE RED STOP */}
            <div className="mt-3">
              {timerStatus === 'running' ? (
                /* HUGE RED STOP BUTTON */
                <button
                  onClick={handleStopTimer}
                  className="w-full py-4 px-6 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-display font-black text-2xl sm:text-3xl rounded-xl shadow-2xl shadow-red-900/60 border-2 border-red-400 flex items-center justify-center gap-3 transition cursor-pointer"
                >
                  <Square className="w-7 h-7 fill-white" />
                  <span>STOP RUN</span>
                </button>
              ) : (
                /* LARGE GREEN START BUTTON (AVAILABLE ONLY ONCE PER RUN UNTIL RESET) */
                <button
                  onClick={handleStartTimer}
                  disabled={timerStatus === 'stopped' || isTimeOver}
                  className={`w-full py-3.5 px-6 font-display font-black text-xl rounded-xl shadow-xl flex items-center justify-center gap-2.5 transition ${
                    timerStatus === 'stopped' || isTimeOver
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 border-2 border-emerald-400 cursor-pointer'
                  }`}
                >
                  <Play className="w-6 h-6 fill-white" />
                  <span>{timerStatus === 'stopped' ? 'TIMER STOPPED' : 'START 120s RUN'}</span>
                </button>
              )}
            </div>

            {/* Secondary: Restart / Reset Run Control */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Official limit: 120 seconds
              </span>
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="text-xs font-mono font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESTART RUN</span>
              </button>
            </div>
          </div>

          {/* D. LIVE SCORE ACCUMULATION & REVIEW CARD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                  {isRerunInProgress
                    ? 'RE-RUN IN PROGRESS'
                    : isPublished 
                    ? 'OFFICIAL PUBLISHED SCORE' 
                    : (timerStatus === 'stopped' || isTimeOver)
                      ? 'SCORE REVIEW & CONFIRMATION'
                      : 'LIVE SCORE PREVIEW'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isRerunInProgress
                    ? `Official score ${existingScore?.finalScore} stays on the leaderboard until you press UPDATE PUBLISHED SCORE`
                    : isPublished
                    ? 'Live on Arena Secondary Display & Leaderboard'
                    : (timerStatus === 'stopped' || isTimeOver)
                      ? 'Run stopped. Review before publishing.'
                      : timerStatus === 'running'
                        ? 'Draft run in progress (Not official)'
                        : 'Staged for start (Timer idle)'}
                </span>
              </div>

              {isRerunInProgress ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1">
                  <span>RE-RUN (NOT OFFICIAL YET)</span>
                </span>
              ) : isPublished ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>PUBLISHED</span>
                </span>
              ) : (timerStatus === 'stopped' || isTimeOver) ? (
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1">
                  <span>READY TO PUBLISH</span>
                </span>
              ) : timerStatus === 'running' ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>DRAFT / LIVE</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-black uppercase tracking-wider">
                  READY TO START
                </span>
              )}
            </div>

            {/* Score Breakdown Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 font-mono text-[11px]">BLOCK POINTS</div>
                <div className="text-2xl font-display font-black text-white mt-0.5">
                  {scoreCalculation.blockScore}
                  <span className="text-xs font-normal text-slate-400 ml-1">pts</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 font-mono text-[11px] flex justify-between">
                  <span>TIME BONUS</span>
                  <span className="text-slate-500">
                    {!isRunStarted ? '0s' : isTimeOver ? '0s' : `${effectiveTimeLeft}s`}
                  </span>
                </div>
                <div className="text-2xl font-display font-black text-cyan-400 mt-0.5">
                  {scoreCalculation.timeBonus > 0 ? `+${scoreCalculation.timeBonus}` : '0'}
                  <span className="text-xs font-normal text-slate-400 ml-1">pts</span>
                </div>
              </div>
            </div>

            {/* FINAL SCORE DISPLAY */}
            <div className="bg-gradient-to-r from-blue-950/80 via-slate-950 to-blue-950/80 border-2 border-blue-500/50 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono font-bold text-blue-300 uppercase tracking-wider">
                  {isPublished && !isRerunInProgress ? 'OFFICIAL SCORE' : 'CALCULATED SCORE'}
                </div>
                <div className="text-xs text-slate-400">
                  {scoreCalculation.blockScore} (Blocks) + {scoreCalculation.timeBonus} (Time Bonus)
                </div>
              </div>
              <div className="text-4xl sm:text-5xl font-display font-black text-amber-400 tracking-tight">
                {scoreCalculation.finalScore}
                <span className="text-xs font-normal text-slate-400 ml-1.5">PTS</span>
              </div>
            </div>

            {/* E. CONFIRMATION & PUBLISH ACTIONS */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                {/* Edit Score Discrepancy Button */}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Manual adjustment / add evaluator notes"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Score</span>
                </button>

                {/* Restart Run Button */}
                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-600/60 rounded-xl text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Restart Run</span>
                </button>
              </div>

              {/* PUBLISH SCORE BUTTON */}
              <button
                onClick={handlePublishScore}
                disabled={timerStatus === 'running'}
                className={`w-full py-3 px-4 rounded-xl font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition ${
                  timerStatus === 'running'
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : isPublished
                      ? 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500 cursor-pointer'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/40 border border-blue-400 cursor-pointer'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isPublished ? 'UPDATE PUBLISHED SCORE' : 'PUBLISH SCORE'}</span>
              </button>

              {/* NEXT TEAM BUTTON */}
              <button
                onClick={handleNextTeam}
                className={`w-full py-3.5 px-4 rounded-xl font-display font-black text-base flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                  isPublished
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/40 border-2 border-amber-300 ring-2 ring-amber-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-2 border-amber-500/40'
                }`}
              >
                <span>NEXT TEAM</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* 3. EDIT SCORE DISCREPANCY MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Adjust Score / Discrepancy</span>
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  MANUAL TIME BONUS / TIME LEFT (SECONDS):
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={manualTimeBonus !== null ? manualTimeBonus : effectiveTimeLeft}
                  onChange={(e) => setManualTimeBonus(Math.max(0, Math.min(120, Number(e.target.value))))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base focus:border-blue-500 focus:outline-none"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Overrides automatic timer calculation (0 - 120 pts).
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  EVALUATOR OPERATOR NOTES:
                </label>
                <textarea
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="E.g., 700g block boundary checked by arena referee..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:border-blue-500 focus:outline-none h-20"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                <span className="text-slate-400">Calculated Final Score:</span>
                <span className="text-xl font-mono font-black text-amber-400">
                  {scoreCalculation.blockScore + (manualTimeBonus !== null ? manualTimeBonus : effectiveTimeLeft)} PTS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setManualTimeBonus(null);
                  setIsEditModalOpen(false);
                }}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Reset to Live Timer
              </button>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition"
              >
                Apply Adjustments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. RESET RUN CONFIRMATION MODAL */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600/60 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-display font-bold text-white">
                Reset Current Run?
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will clear all block selections, restore the timer to <strong className="text-white">01:20</strong>, and reset the score for <strong className="text-amber-300">{activeSchool ? `${activeSchool.name} (${activeSchool.teamName})` : 'the active team'}</strong>.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetRun}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
