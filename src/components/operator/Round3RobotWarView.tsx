import React, { useState } from 'react';
import {
  Swords,
  Trophy,
  Send,
  Save,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Flame,
  Tv,
  Info,
  Check,
  Trash2,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { useArenaTimer } from '../../hooks/useArenaTimer';
import { formatBrlTimer } from '../../utils/arenaAudio';
import { ROBO_WAR_CONFIG, calculateRoboWarScore } from '../../data/officialRules';
import { PitType } from '../../types';

export const Round3RobotWarView: React.FC = () => {
  const {
    state,
    activeRobotWarMatch,
    setActiveRobotWarMatch,
    createRobotWarMatch,
    deleteRobotWarMatch,
    saveRobotWarDraft,
    publishRobotWarResult,
    setDisplayState
  } = useCompetition();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamA, setNewTeamA] = useState('');
  const [newTeamB, setNewTeamB] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [confirmDeleteMatchId, setConfirmDeleteMatchId] = useState<string | null>(null);

  // Active match input states
  const [selectedWinner, setSelectedWinner] = useState<'team_a' | 'team_b' | 'draw' | null>(
    activeRobotWarMatch?.result === 'team_a_win'
      ? 'team_a'
      : activeRobotWarMatch?.result === 'team_b_win'
        ? 'team_b'
        : activeRobotWarMatch?.result === 'draw'
          ? 'draw'
          : null
  );

  const [pitType, setPitType] = useState<PitType>(
    activeRobotWarMatch?.pitType || 'in_pit'
  );

  // Time left as saved for the match, or typed in by hand. While a fight clock is running or has just
  // been stopped, the clock's own value is used instead (see timeLeftSeconds below).
  const [storedTimeLeft, setStoredTimeLeft] = useState<number>(
    activeRobotWarMatch?.timeLeftSeconds ?? 30
  );
  const [manualTime, setManualTime] = useState<boolean>(false);
  const setManualTimeLeft = (sec: number) => {
    setManualTime(true);
    setStoredTimeLeft(sec);
  };

  // 90 second fight clock (shared with the HDMI battle screen). It only counts for the match it was
  // started for.
  const {
    remainingSeconds,
    status: rawTimerStatus,
    isUrgent,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer
  } = useArenaTimer(3);
  const ownsTimer = !!activeRobotWarMatch && state.arenaTimer?.matchId === activeRobotWarMatch.id;
  const timerStatus = ownsTimer ? rawTimerStatus : 'idle';
  const isTimerRunning = timerStatus === 'running';
  const timerFinished = timerStatus === 'stopped' || timerStatus === 'time_over';
  const clockSeconds = ownsTimer ? remainingSeconds : 90;
  const frozenSeconds = timerStatus === 'time_over' ? 0 : remainingSeconds;
  // Running: seconds left right now. Stopped: the frozen seconds, unless typed in by hand.
  const timeLeftSeconds = isTimerRunning
    ? remainingSeconds
    : (timerFinished && !manualTime ? frozenSeconds : storedTimeLeft);

  const [matchNotes, setMatchNotes] = useState<string>(activeRobotWarMatch?.matchNotes || '');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sync when the saved data of the active match changes. Keyed on the data itself, so an unrelated
  // save (the clock starting, another operator) cannot wipe what is being entered.
  const savedMatchKey = activeRobotWarMatch
    ? JSON.stringify([activeRobotWarMatch.id, activeRobotWarMatch.result, activeRobotWarMatch.pitType ?? null, activeRobotWarMatch.timeLeftSeconds, activeRobotWarMatch.matchNotes ?? ''])
    : 'none';
  React.useEffect(() => {
    if (activeRobotWarMatch) {
      if (activeRobotWarMatch.result === 'team_a_win') setSelectedWinner('team_a');
      else if (activeRobotWarMatch.result === 'team_b_win') setSelectedWinner('team_b');
      else if (activeRobotWarMatch.result === 'draw') setSelectedWinner('draw');
      else setSelectedWinner(null);

      setPitType(activeRobotWarMatch.pitType || 'in_pit');
      setStoredTimeLeft(activeRobotWarMatch.timeLeftSeconds ?? 30);
      // A match that already has a saved result shows that saved time, not the clock.
      setManualTime(activeRobotWarMatch.result !== 'pending');
      setMatchNotes(activeRobotWarMatch.matchNotes || '');
    }
  }, [savedMatchKey]);

  const handleStartTimer = () => {
    if (!activeRobotWarMatch) return;
    setSelectedWinner(null);
    setPitType('in_pit');
    setManualTime(false);
    setStoredTimeLeft(0);
    startTimer(90, 3, undefined, activeRobotWarMatch.id);
    setDisplayState('robot_war');
  };
  const handleStopTimer = () => {
    stopTimer();
  };
  const handleRestartTimer = () => {
    resetTimer(90, activeRobotWarMatch?.id);
    setSelectedWinner(null);
    setManualTime(false);
    setStoredTimeLeft(0);
  };

  const teamASchool = state.schools.find(s => s.id === activeRobotWarMatch?.teamAId);
  const teamBSchool = state.schools.find(s => s.id === activeRobotWarMatch?.teamBId);

  // Live calculation
  const calculation = selectedWinner
    ? calculateRoboWarScore(selectedWinner, selectedWinner === 'draw' ? null : pitType, timeLeftSeconds)
    : {
        multiplier: pitType === 'in_pit' ? 3 : 2,
        timeLeftSeconds,
        teamAPoints: 0,
        teamBPoints: 0,
        winnerPoints: 0,
        loserPoints: 0
      };

  const isFormValid = !!(
    activeRobotWarMatch &&
    teamASchool &&
    teamBSchool &&
    selectedWinner &&
    (selectedWinner === 'draw' || pitType) &&
    timeLeftSeconds >= 0 &&
    timeLeftSeconds <= 90
  );

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamA || !newTeamB || newTeamA === newTeamB) return;
    createRobotWarMatch(newTeamA, newTeamB, newNotes);
    setIsCreateModalOpen(false);
    setNewTeamA('');
    setNewTeamB('');
    setNewNotes('');
  };

  const handleSaveDraft = () => {
    if (!activeRobotWarMatch || !selectedWinner) {
      setFeedbackMsg({ text: 'Please select a winner (or Draw) before saving draft.', type: 'error' });
      return;
    }
    saveRobotWarDraft(activeRobotWarMatch.id, selectedWinner, selectedWinner === 'draw' ? null : pitType, timeLeftSeconds, matchNotes);
    setFeedbackMsg({ text: 'Match draft saved. Public display unchanged.', type: 'info' });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handlePublishConfirmed = () => {
    if (!isFormValid || !activeRobotWarMatch || !selectedWinner) {
      setFeedbackMsg({ text: 'Validation Error: Team A, Team B, Winner/Draw, Pit Type, and Time Left are required.', type: 'error' });
      return;
    }

    publishRobotWarResult(activeRobotWarMatch.id, selectedWinner, selectedWinner === 'draw' ? null : pitType, timeLeftSeconds, matchNotes);
    setIsPreviewModalOpen(false);
    if (selectedWinner === 'draw') {
      setFeedbackMsg({
        text: `Robot War result published! Match ended in a draw — both teams awarded ${ROBO_WAR_CONFIG.drawPoints} PTS.`,
        type: 'success'
      });
    } else {
      const winnerSchool = selectedWinner === 'team_a' ? teamASchool : teamBSchool;
      setFeedbackMsg({
        text: `Robot War result published! ${winnerSchool?.name} awarded ${calculation.winnerPoints} PTS.`,
        type: 'success'
      });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner - Red theme */}
      <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border-2 border-red-600/40 rounded-2xl p-5 shadow-xl shadow-red-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white font-display font-black text-xl shadow-lg shadow-red-600/30">
              R3
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                <span>ROUND 3 • OFFICIAL SCORING ENGINE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
                <span>ROBO WAR COMBAT ARENA</span>
                <Flame className="w-5 h-5 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Total Time: 90s • Winner Takes All (Loser gets 0 pts) • IN-PIT: Time Left × 3 pts • OUT-PIT: Time Left × 2 pts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setDisplayState('robot_war')}
              className="px-3 py-2 bg-red-900/60 hover:bg-red-800/80 text-red-200 border border-red-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Show battle screen on auditorium display"
            >
              <Tv className="w-3.5 h-3.5 text-red-400" />
              <span>Show Battle on Arena Screen</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Schedule Match</span>
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200' 
            : feedbackMsg.type === 'error'
              ? 'bg-rose-950/60 border-rose-500 text-rose-200'
              : 'bg-blue-950/60 border-blue-500 text-blue-200'
        }`}>
          <div className="flex items-center space-x-2 text-sm font-semibold">
            {feedbackMsg.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackMsg(null)}
            className="text-xs underline text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Matches Selector Carousel / Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Scheduled Arena Matches</span>
          <span className="text-[11px] font-mono text-slate-400">Total: {state.robotWarMatches.length}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {state.robotWarMatches.map(match => {
            const teamA = state.schools.find(s => s.id === match.teamAId);
            const teamB = state.schools.find(s => s.id === match.teamBId);
            const isActive = activeRobotWarMatch?.id === match.id;
            const isCompleted = match.status === 'completed' && !match.isDraft;

            return (
              <div
                key={match.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveRobotWarMatch(match.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveRobotWarMatch(match.id); }}
                className={`relative p-3 rounded-xl border text-left transition cursor-pointer ${
                  isActive
                    ? 'bg-red-950/60 border-red-500 ring-1 ring-red-500 shadow-md shadow-red-950/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1 pr-5">
                  <span className="font-bold text-slate-300">MATCH #{match.matchNumber}</span>
                  {isCompleted ? (
                    <span className="text-emerald-400 font-bold">COMPLETED</span>
                  ) : match.isDraft ? (
                    <span className="text-amber-400 font-bold">DRAFT</span>
                  ) : (
                    <span className="text-slate-500">SCHEDULED</span>
                  )}
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {teamA?.name || 'Team A'}
                </div>
                <div className="text-[11px] text-red-400 font-mono">vs</div>
                <div className="text-xs font-bold text-white truncate">
                  {teamB?.name || 'Team B'}
                </div>

                {!isCompleted && (
                  <button
                    type="button"
                    title="Remove this scheduled match"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteMatchId(match.id);
                    }}
                    className="absolute top-2.5 right-2.5 p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Scoring Workspace */}
      {activeRobotWarMatch && teamASchool && teamBSchool ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left 8 Cols: Fight Controls & Inputs */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Versus Combat Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>HEAD-TO-HEAD COMBATANTS • MATCH #{activeRobotWarMatch.matchNumber}</span>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                  Official 90s Fight
                </span>
              </div>

              {/* Red vs Blue Split Pick */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Team A Picker */}
                <div 
                  onClick={() => setSelectedWinner('team_a')}
                  className={`p-5 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden ${
                    selectedWinner === 'team_a'
                      ? 'bg-red-950/60 border-red-500 shadow-xl shadow-red-950/50 ring-2 ring-red-500'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      TEAM A • {teamASchool.teamNumber}
                    </span>
                    {selectedWinner === 'team_a' && (
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1 uppercase tracking-wider">
                        <Trophy className="w-3.5 h-3.5" /> WINNER
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-display font-black text-white leading-snug">
                    {teamASchool.name}
                  </h3>
                  <div className="text-sm font-semibold text-red-300 mt-0.5">
                    {teamASchool.teamName}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {teamASchool.city}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Awarded Points:</span>
                    <span className={`text-2xl font-display font-black ${
                      selectedWinner === 'team_a' || selectedWinner === 'draw' ? 'text-red-400' : 'text-slate-600'
                    }`}>
                      {selectedWinner === 'team_a' ? `${calculation.winnerPoints} PTS` : selectedWinner === 'draw' ? `${calculation.teamAPoints} PTS` : '0 PTS'}
                    </span>
                  </div>
                </div>

                {/* Team B Picker */}
                <div 
                  onClick={() => setSelectedWinner('team_b')}
                  className={`p-5 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden ${
                    selectedWinner === 'team_b'
                      ? 'bg-red-950/60 border-red-500 shadow-xl shadow-red-950/50 ring-2 ring-red-500'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      TEAM B • {teamBSchool.teamNumber}
                    </span>
                    {selectedWinner === 'team_b' && (
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1 uppercase tracking-wider">
                        <Trophy className="w-3.5 h-3.5" /> WINNER
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-display font-black text-white leading-snug">
                    {teamBSchool.name}
                  </h3>
                  <div className="text-sm font-semibold text-blue-300 mt-0.5">
                    {teamBSchool.teamName}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {teamBSchool.city}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Awarded Points:</span>
                    <span className={`text-2xl font-display font-black ${
                      selectedWinner === 'team_b' || selectedWinner === 'draw' ? 'text-red-400' : 'text-slate-600'
                    }`}>
                      {selectedWinner === 'team_b' ? `${calculation.winnerPoints} PTS` : selectedWinner === 'draw' ? `${calculation.teamBPoints} PTS` : '0 PTS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Draw Option */}
              <button
                type="button"
                onClick={() => setSelectedWinner('draw')}
                className={`mt-4 w-full p-4 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                  selectedWinner === 'draw'
                    ? 'bg-amber-950/50 border-amber-500 shadow-lg shadow-amber-950/40 ring-2 ring-amber-500'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-left">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    NO KNOCKOUT
                  </span>
                  <div className="font-display font-black text-white mt-1.5">Match Ended in a Draw</div>
                  <div className="text-xs text-slate-400 mt-0.5">Neither robot pushed the other into a pit — both teams share points equally.</div>
                </div>
                <span className={`text-2xl font-display font-black ${selectedWinner === 'draw' ? 'text-amber-400' : 'text-slate-600'}`}>
                  {ROBO_WAR_CONFIG.drawPoints} PTS EACH
                </span>
              </button>

              {!selectedWinner && (
                <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-200 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Click the team that won the match, or select Draw (winner takes all; losing team receives 0 points; a draw awards {ROBO_WAR_CONFIG.drawPoints} points to each team).</span>
                </div>
              )}
            </div>

            {/* Pit Type Selection: IN-PIT vs OUT-PIT (not applicable to a draw) */}
            {selectedWinner !== 'draw' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-display font-bold text-white text-base">
                    Scoring Pit Area (Multiplier)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select where the opposing robot was pushed or eliminated.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* IN-PIT (x3) */}
                <button
                  type="button"
                  onClick={() => setPitType('in_pit')}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                    pitType === 'in_pit'
                      ? 'bg-red-950/60 border-red-500 shadow-md shadow-red-950/40 ring-1 ring-red-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-black text-white text-base">
                      1. IN-PIT
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono font-bold text-xs border border-red-500/30">
                      ×3 MULTIPLIER
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Opposing robot pushed directly into the designated arena pit.
                  </p>
                  <div className="mt-3 text-xs font-mono font-bold text-red-400">
                    Formula: Time Left × 3
                  </div>
                </button>

                {/* OUT-PIT (x2) */}
                <button
                  type="button"
                  onClick={() => setPitType('out_pit')}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                    pitType === 'out_pit'
                      ? 'bg-orange-950/60 border-orange-500 shadow-md shadow-orange-950/40 ring-1 ring-orange-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-black text-white text-base">
                      2. OUT-PIT
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono font-bold text-xs border border-orange-500/30">
                      ×2 MULTIPLIER
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Opposing robot pushed outside the arena perimeter / out of boundary.
                  </p>
                  <div className="mt-3 text-xs font-mono font-bold text-orange-400">
                    Formula: Time Left × 2
                  </div>
                </button>
              </div>
            </div>
            )}

            {/* Fight clock: Start / Stop the 90 second fight (also drives the HDMI battle screen clock) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-red-400" />
                  <h3 className="font-display font-bold text-white text-sm">Fight Clock (90 seconds)</h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {isTimerRunning ? 'FIGHT IN PROGRESS' : timerFinished ? 'CLOCK STOPPED' : 'READY TO START'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className={`text-5xl font-mono font-black tracking-tight ${
                    isTimerRunning && isUrgent ? 'text-red-500' : isTimerRunning ? 'text-amber-400' : 'text-slate-100'
                  }`}>
                    {formatBrlTimer(clockSeconds)}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Time Left: {clockSeconds}s • press STOP the moment the fight ends
                  </div>
                </div>

                <div className="flex-1 max-w-xs space-y-2">
                  {isTimerRunning ? (
                    <button
                      type="button"
                      onClick={handleStopTimer}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-display font-black text-lg rounded-xl border-2 border-red-400 flex items-center justify-center gap-2 transition"
                    >
                      <Square className="w-5 h-5 fill-white" />
                      <span>STOP FIGHT</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartTimer}
                      disabled={!activeRobotWarMatch || timerFinished}
                      className={`w-full py-3 font-display font-black text-lg rounded-xl flex items-center justify-center gap-2 transition ${
                        timerFinished || !activeRobotWarMatch
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400'
                      }`}
                    >
                      <Play className="w-5 h-5 fill-white" />
                      <span>{timerFinished ? 'CLOCK STOPPED' : 'START 90s FIGHT'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRestartTimer}
                    className="w-full text-xs font-mono font-bold text-rose-400 hover:text-rose-300 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESTART FIGHT</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Time Left Slider (0 to 90s) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-red-400" />
                  <h3 className="font-display font-bold text-white text-base">
                    Fight Time Left (Seconds Unused)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-red-950 text-red-300 border border-red-800">
                  0 TO 90 SECONDS
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 uppercase font-bold">Time Left:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-display font-black text-red-400">
                      {timeLeftSeconds}s
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ({90 - timeLeftSeconds}s elapsed)
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="90"
                  step="1"
                  value={timeLeftSeconds}
                  onChange={(e) => setManualTimeLeft(Number(e.target.value))}
                  disabled={isTimerRunning}
                  className="w-full accent-red-500 h-2 bg-slate-950 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                />

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {[
                    { label: '0s (End of Fight)', val: 0 },
                    { label: '15s Left', val: 15 },
                    { label: '30s Left', val: 30 },
                    { label: '45s Left', val: 45 },
                    { label: '60s Left', val: 60 },
                    { label: '75s Left', val: 75 },
                    { label: '90s (Instant KO)', val: 90 },
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setManualTimeLeft(item.val)}
                      disabled={isTimerRunning}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition border ${
                        timeLeftSeconds === item.val
                          ? 'bg-red-600 text-white border-red-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Notes */}
              <div className="pt-3 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Arena Referee Notes (Optional):
                </label>
                <input
                  type="text"
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  placeholder="e.g. Clean chassis push into pit at 0:50 mark"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Live Preview & Publish */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-gradient-to-b from-slate-900 to-[#220c0c] border-2 border-red-500/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>LIVE SCORE PREVIEW</span>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
              </div>

              <div className="mt-2 mb-4">
                <div className="text-5xl font-display font-black text-white tracking-tight">
                  {selectedWinner === 'draw' ? calculation.teamAPoints : calculation.winnerPoints}
                  <span className="text-lg font-normal text-red-300 ml-2 font-mono">PTS</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {selectedWinner === 'draw'
                    ? 'Awarded to Both Teams (Draw)'
                    : `Awarded to Winner (${selectedWinner ? (selectedWinner === 'team_a' ? teamASchool.teamName : teamBSchool.teamName) : 'Select Winner'})`}
                </div>
              </div>

              {/* Formula & Breakdown */}
              <div className="space-y-2.5 py-4 border-t border-b border-red-500/20 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">{selectedWinner === 'draw' ? 'Result:' : 'Winner:'}</span>
                  <span className="font-bold text-white">
                    {selectedWinner === 'draw' ? 'Draw' : selectedWinner ? (selectedWinner === 'team_a' ? teamASchool.name : teamBSchool.name) : 'None'}
                  </span>
                </div>

                {selectedWinner !== 'draw' && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Scoring Area:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {pitType === 'in_pit' ? 'IN-PIT (×3)' : 'OUT-PIT (×2)'}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Time Left:</span>
                  <span className="font-mono font-bold text-red-300">
                    {timeLeftSeconds} seconds
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-300">Calculation:</span>
                  <span className="font-mono font-bold text-white">
                    {selectedWinner === 'draw'
                      ? `Draw = ${ROBO_WAR_CONFIG.drawPoints} pts each`
                      : `${timeLeftSeconds} × ${calculation.multiplier} = ${calculation.winnerPoints} pts`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">{selectedWinner === 'draw' ? 'Other Team:' : 'Loser Points:'}</span>
                  <span className="font-mono font-bold text-slate-500">
                    {selectedWinner === 'draw' ? `${ROBO_WAR_CONFIG.drawPoints} pts (Draw)` : '0 pts (Winner Takes All)'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  disabled={!isFormValid || isTimerRunning}
                  className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-500 text-white font-display font-bold text-sm rounded-xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Score Preview & Publish</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={!selectedWinner || isTimerRunning}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Local Draft (Do Not Publish)</span>
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  Result updates both teams' Round 3 and Total Score on the live leaderboard simultaneously.
                </span>
              </div>
            </div>

            {/* Official Rule Reference Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Info className="w-3.5 h-3.5 text-red-400" />
                <span>Official BRL 2026 Rules - Round 3</span>
              </h4>
              <ul className="text-slate-400 space-y-1 list-disc list-inside text-[11px]">
                <li>Total Time: 90 seconds per fight</li>
                <li>IN-PIT formula: Time Left × 3 pts</li>
                <li>OUT-PIT formula: Time Left × 2 pts</li>
                <li>Only winning team receives points</li>
                <li>Losing team receives 0 points</li>
                <li>Draw: both teams receive {ROBO_WAR_CONFIG.drawPoints} pts each</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Swords className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-base font-medium text-slate-300">No Robot War match selected.</p>
          <p className="text-xs text-slate-500 mt-1">Select an arena match above or click "Schedule Match" to add one.</p>
        </div>
      )}

      {/* CONFIRMATION & PREVIEW MODAL */}
      {isPreviewModalOpen && activeRobotWarMatch && teamASchool && teamBSchool && selectedWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-red-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <div>
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider">
                SCORE PREVIEW & CONFIRMATION
              </div>
              <h3 className="text-2xl font-display font-black text-white mt-1">
                Publish Robot War Result
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify the combat breakdown below before broadcasting this match result to the auditorium.
              </p>
            </div>

            {/* Combatants */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-mono">Team A</span>
                <div className="font-bold text-white truncate">{teamASchool.name}</div>
                <div className="text-red-400 font-mono font-bold text-sm mt-1">
                  {selectedWinner === 'team_a'
                    ? `${calculation.winnerPoints} PTS (WINNER)`
                    : selectedWinner === 'draw'
                      ? `${calculation.teamAPoints} PTS (DRAW)`
                      : '0 PTS (LOSER)'}
                </div>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-mono">Team B</span>
                <div className="font-bold text-white truncate">{teamBSchool.name}</div>
                <div className="text-blue-400 font-mono font-bold text-sm mt-1">
                  {selectedWinner === 'team_b'
                    ? `${calculation.winnerPoints} PTS (WINNER)`
                    : selectedWinner === 'draw'
                      ? `${calculation.teamBPoints} PTS (DRAW)`
                      : '0 PTS (LOSER)'}
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{selectedWinner === 'draw' ? 'Result:' : 'Winning Team:'}</span>
                <span className="font-bold text-white text-sm">
                  {selectedWinner === 'draw' ? 'Draw' : selectedWinner === 'team_a' ? teamASchool.name : teamBSchool.name}
                </span>
              </div>

              {selectedWinner !== 'draw' && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Scoring Area:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {pitType === 'in_pit' ? 'IN-PIT (×3 Multiplier)' : 'OUT-PIT (×2 Multiplier)'}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Time Left:</span>
                <span className="font-mono font-bold text-red-300">
                  {timeLeftSeconds} seconds (out of 90s)
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t-2 border-slate-700 font-bold">
                <span className="text-white text-sm">{selectedWinner === 'draw' ? 'EACH TEAM AWARDED:' : 'WINNER AWARDED SCORE:'}</span>
                <span className="text-2xl font-display font-black text-red-400">
                  {selectedWinner === 'draw' ? calculation.teamAPoints : calculation.winnerPoints} PTS
                </span>
              </div>
            </div>

            {matchNotes && (
              <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <strong className="text-slate-300">Referee Note:</strong> {matchNotes}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Back to Edit
              </button>

              <button
                type="button"
                onClick={handlePublishConfirmed}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Publish Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MATCH MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-red-500/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5">
            <h3 className="text-xl font-display font-bold text-white">
              Schedule New Robot War Match
            </h3>

            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Team A (Red Corner):
                </label>
                <select
                  value={newTeamA}
                  onChange={(e) => setNewTeamA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="">Select Team A School...</option>
                  {state.schools.map(s => (
                    <option key={s.id} value={s.id} disabled={s.id === newTeamB}>
                      {s.name} ({s.teamNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Team B (Blue Corner):
                </label>
                <select
                  value={newTeamB}
                  onChange={(e) => setNewTeamB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="">Select Team B School...</option>
                  {state.schools.map(s => (
                    <option key={s.id} value={s.id} disabled={s.id === newTeamA}>
                      {s.name} ({s.teamNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Match Stage / Label:
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Semi-Final #1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTeamA || !newTeamB || newTeamA === newTeamB}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  Add Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MATCH CONFIRMATION MODAL */}
      {confirmDeleteMatchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-5">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              <span>Remove Scheduled Match?</span>
            </h3>
            <p className="text-xs text-slate-400">
              This removes the match entirely. This cannot be undone. Completed/published matches cannot be removed this way.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteMatchId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteRobotWarMatch(confirmDeleteMatchId);
                  setConfirmDeleteMatchId(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
