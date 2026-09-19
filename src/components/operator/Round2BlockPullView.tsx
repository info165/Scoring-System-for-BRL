import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Save, 
  Send, 
  RotateCcw, 
  SkipForward, 
  Clock, 
  ShieldAlert, 
  Layers, 
  CheckCircle2,
  Tv,
  Info,
  Minus,
  Plus,
  Play,
  Square
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { useArenaTimer } from '../../hooks/useArenaTimer';
import { 
  OFFICIAL_BLOCK_WEIGHTS, 
  BLOCK_PULL_CONFIG, 
  calculateBlockPullScore 
} from '../../data/officialRules';

export const Round2BlockPullView: React.FC = () => {
  const { 
    state, 
    currentSchool, 
    saveBlockPullDraft, 
    publishBlockPullScore, 
    advanceQueue,
    setDisplayState
  } = useCompetition();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  
  // Selected weights pulled: array of weight IDs (e.g. ['200g', '1kg'])
  const [pulledBlockIds, setPulledBlockIds] = useState<string[]>([]);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [boundaryTouches, setBoundaryTouches] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Arena timer (shared with the HDMI screen). It only counts as this team's Round 2 run
  // when it was started for Round 2 and for the team currently selected here.
  const {
    remainingSeconds,
    formattedTime,
    status: rawTimerStatus,
    isUrgent,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer
  } = useArenaTimer(2);
  const ownsTimer = state.arenaTimer?.round === 2 && state.arenaTimer?.schoolId === selectedSchoolId;
  const timerStatus = ownsTimer ? rawTimerStatus : 'idle';
  const isTimerRunning = timerStatus === 'running';
  const timerFinished = timerStatus === 'stopped' || timerStatus === 'time_over';
  const displaySeconds = ownsTimer ? remainingSeconds : 120;

  // Once the operator types/slides a time by hand it overrides the frozen clock value.
  const [manualTime, setManualTime] = useState<boolean>(false);
  const setManualTimeLeft = (sec: number) => {
    setManualTime(true);
    setTimeLeftSeconds(sec);
  };

  // Sync selected school with queue
  useEffect(() => {
    if (!selectedSchoolId && currentSchool) {
      setSelectedSchoolId(currentSchool.id);
    } else if (!selectedSchoolId && state.schools.length > 0) {
      setSelectedSchoolId(state.schools[0].id);
    }
  }, [currentSchool, state.schools, selectedSchoolId]);

  // Load existing draft or score. Keyed on this team's saved data (not the whole scores map)
  // so another operator's or another team's update cannot wipe entries typed here.
  const savedRound2Key = JSON.stringify(state.scores[selectedSchoolId]?.round2 ?? null);
  useEffect(() => {
    if (selectedSchoolId) {
      const existing = state.scores[selectedSchoolId]?.round2;
      if (existing) {
        setPulledBlockIds(existing.pulledBlockIds || []);
        setTimeLeftSeconds(existing.timeLeftSeconds ?? 0);
        setBoundaryTouches(existing.boundaryTouches ?? 0);
        setNotes(existing.notes || '');
      } else {
        setPulledBlockIds([]);
        setTimeLeftSeconds(0);
        setBoundaryTouches(0);
        setNotes('');
      }
    }
  }, [selectedSchoolId, savedRound2Key]);

  // Running: live seconds left. Ended (Stop / time over): the frozen seconds, unless the
  // operator overrode them by hand. Otherwise: the value loaded from a saved draft/score.
  const frozenSeconds = timerStatus === 'time_over' ? 0 : remainingSeconds;
  const effectiveTimeLeft = isTimerRunning
    ? remainingSeconds
    : (timerFinished && !manualTime ? frozenSeconds : timeLeftSeconds);

  const scoreCalculation = calculateBlockPullScore(
    pulledBlockIds,
    effectiveTimeLeft,
    boundaryTouches
  );

  const activeSchool = state.schools.find(s => s.id === selectedSchoolId);
  const existingScore = activeSchool ? state.scores[activeSchool.id]?.round2 : null;
  const isPublished = !!(existingScore && !existingScore.isDraft);

  const toggleBlockPull = (weightId: string) => {
    setPulledBlockIds(prev => 
      prev.includes(weightId) 
        ? prev.filter(id => id !== weightId)
        : [...prev, weightId]
    );
  };

  const handleReset = () => {
    setPulledBlockIds([]);
    setTimeLeftSeconds(0);
    setBoundaryTouches(0);
    setManualTime(false);
  };

  const handleStartTimer = () => {
    if (!selectedSchoolId) return;
    handleReset();
    startTimer(120, 2, selectedSchoolId);
    setDisplayState('live_run');
  };

  const handleStopTimer = () => {
    stopTimer();
  };

  const handleRestartTimer = () => {
    resetTimer(120);
    handleReset();
  };

  const handleSaveDraft = () => {
    if (!selectedSchoolId) return;
    saveBlockPullDraft(selectedSchoolId, {
      ...scoreCalculation,
      isDraft: true,
      notes
    });
    setFeedbackMsg({ text: 'Round 2 draft saved. Big screen display unchanged.', type: 'info' });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handlePublishConfirmed = () => {
    if (!selectedSchoolId) return;
    publishBlockPullScore(selectedSchoolId, {
      ...scoreCalculation,
      notes
    });
    setIsPreviewModalOpen(false);
    setFeedbackMsg({ 
      text: `Score of ${scoreCalculation.finalScore} PTS officially published for ${activeSchool?.name}!`, 
      type: 'success' 
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner - Green theme */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-600/40 rounded-2xl p-5 shadow-xl shadow-emerald-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-display font-black text-xl shadow-lg shadow-emerald-600/30">
              R2
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>ROUND 2 • OFFICIAL SCORING ENGINE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                BLOCK PULL CHALLENGE
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Total Time: 120s • Full points per pulled block • Time Left: 1 pt/sec bonus • Boundary Touch: -5 pts penalty each
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setDisplayState('live_run')}
              className="px-3 py-2 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Show live run on auditorium screen"
            >
              <Tv className="w-3.5 h-3.5 text-emerald-400" />
              <span>Show on Arena Screen</span>
            </button>
            <button
              onClick={() => { advanceQueue(); resetTimer(120); handleReset(); }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Advance queue to next team"
            >
              <SkipForward className="w-3.5 h-3.5 text-amber-400" />
              <span>Next Team</span>
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200' 
            : 'bg-blue-950/60 border-blue-500 text-blue-200'
        }`}>
          <div className="flex items-center space-x-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: School, Pulled Blocks, Time Left, Boundary Penalties */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* School Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Competing School / Team
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500 text-sm"
              >
                {state.schools.map((school) => {
                  const hasScored = state.scores[school.id]?.round2 && !state.scores[school.id]?.round2?.isDraft;
                  const isCurrent = currentSchool?.id === school.id;
                  return (
                    <option key={school.id} value={school.id}>
                      {isCurrent ? '▶ [NOW PLAYING] ' : ''}
                      {school.name} ({school.teamNumber} - {school.teamName})
                      {hasScored ? ` • Published: ${state.scores[school.id]?.round2?.finalScore} pts` : ''}
                    </option>
                  );
                })}
              </select>

              {currentSchool && selectedSchoolId !== currentSchool.id && (
                <button
                  type="button"
                  onClick={() => setSelectedSchoolId(currentSchool.id)}
                  className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition whitespace-nowrap"
                >
                  Jump to Current Playing ({currentSchool.teamNumber})
                </button>
              )}
            </div>

            {/* School Details Badge */}
            {activeSchool && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                    {activeSchool.teamNumber}
                  </span>
                  <span className="font-bold text-white">{activeSchool.teamName}</span>
                  <span className="text-slate-400">• {activeSchool.city}</span>
                </div>

                <div className="flex items-center gap-2">
                  {isPublished ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      Score Published ({existingScore?.finalScore} pts)
                    </span>
                  ) : existingScore?.isDraft ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                      Draft Saved ({existingScore.finalScore} pts)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      Not Yet Scored
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Blocks Successfully Pulled (6 official weights) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Blocks Successfully Pulled Across Finish Line</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click on blocks successfully towed. Each block awards its official full points.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Selections</span>
              </button>
            </div>

            {/* 6 Block Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {OFFICIAL_BLOCK_WEIGHTS.map((weightDef) => {
                const isSelected = pulledBlockIds.includes(weightDef.id);

                return (
                  <button
                    key={weightDef.id}
                    type="button"
                    onClick={() => toggleBlockPull(weightDef.id)}
                    className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/50 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-2xl font-display font-black text-white">
                        {weightDef.label}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected 
                          ? 'bg-emerald-500 text-slate-950' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '+'}
                      </div>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <span className={`text-lg font-display font-black ${
                        isSelected ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        +{weightDef.fullPoints} PTS
                      </span>
                      <span className="text-[10px] uppercase font-mono text-slate-500">
                        {isSelected ? 'PULLED' : 'NOT PULLED'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {weightDef.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Subtotal of Pulled Blocks */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-sm">
              <span className="text-slate-400 font-medium">
                Pulled Blocks: <strong className="text-white">{pulledBlockIds.length} of 6</strong>
              </span>
              <span className="text-emerald-400 font-display font-bold text-base">
                Subtotal Block Points: {scoreCalculation.blockScore} pts
              </span>
            </div>
          </div>

          {/* Arena Timer: Start / Stop the 120 second run (also drives the HDMI countdown) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display font-bold text-white text-sm">Arena Timer</h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                {isTimerRunning ? 'RUN IN PROGRESS' : timerFinished ? 'RUN ENDED' : 'READY TO START'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className={`text-5xl font-mono font-black tracking-tight ${
                  isTimerRunning && isUrgent ? 'text-red-500' : isTimerRunning ? 'text-amber-400' : 'text-slate-100'
                }`}>
                  {formattedTime && ownsTimer ? formattedTime : '01:20'}
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  Time Left: {displaySeconds}s (Bonus: +{displaySeconds} pts)
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
                    <span>STOP RUN</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartTimer}
                    disabled={!selectedSchoolId || timerFinished}
                    className={`w-full py-3 font-display font-black text-lg rounded-xl flex items-center justify-center gap-2 transition ${
                      timerFinished || !selectedSchoolId
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400'
                    }`}
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>{timerFinished ? 'TIMER STOPPED' : 'START 120s RUN'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRestartTimer}
                  className="w-full text-xs font-mono font-bold text-rose-400 hover:text-rose-300 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESTART RUN</span>
                </button>
              </div>
            </div>
          </div>

          {/* Time Remaining (Bonus) and Boundary Touches (Penalty) in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Time Remaining Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-display font-bold text-white text-sm">
                    Time Left Bonus
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">
                  +1 PT / SEC
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Seconds Unused:</span>
                <span className="text-2xl font-display font-black text-emerald-400">
                  {effectiveTimeLeft}s
                  <span className="text-xs font-normal text-slate-400 ml-1.5">(+{effectiveTimeLeft} pts)</span>
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="120"
                step="1"
                value={effectiveTimeLeft}
                disabled={isTimerRunning}
                onChange={(e) => setManualTimeLeft(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-950 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[0, 15, 30, 45, 60, 90, 120].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setManualTimeLeft(sec)}
                    disabled={isTimerRunning}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition border disabled:opacity-40 disabled:cursor-not-allowed ${
                      effectiveTimeLeft === sec
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Boundary Touches (Penalties) Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <h3 className="font-display font-bold text-white text-sm">
                    Boundary Penalty
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-rose-400">
                  -5 PTS / TOUCH
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Boundary Touches:</span>
                <span className="text-2xl font-display font-black text-rose-400">
                  {boundaryTouches}
                  <span className="text-xs font-normal text-slate-400 ml-1.5">
                    (-{scoreCalculation.boundaryPenalty} pts)
                  </span>
                </span>
              </div>

              {/* Stepper Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBoundaryTouches(prev => Math.max(0, prev - 1))}
                  className="flex-1 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-700 rounded-xl text-slate-300 font-bold flex items-center justify-center gap-1 text-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Decrease</span>
                </button>

                <div className="w-16 text-center font-display font-black text-xl text-white bg-slate-950 py-1.5 rounded-xl border border-slate-800">
                  {boundaryTouches}
                </div>

                <button
                  type="button"
                  onClick={() => setBoundaryTouches(prev => prev + 1)}
                  className="flex-1 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/50 rounded-xl text-rose-200 font-bold flex items-center justify-center gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+1 Touch (-5 pts)</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                Rule: Robot touching the lane boundary or crossing perimeter line deducts 5 points per touch.
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pull Lane Inspection Notes:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 2-member team coordination; 1 boundary brush at turn 2"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Right 4 Cols: Live Preview & Publish */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-gradient-to-b from-slate-900 to-[#0b1f19] border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>LIVE SCORE PREVIEW</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            
            <div className="mt-2 mb-4">
              <div className="text-5xl font-display font-black text-white tracking-tight">
                {scoreCalculation.finalScore}
                <span className="text-lg font-normal text-emerald-300 ml-2 font-mono">PTS</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Official calculated total for Round 2
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2.5 py-4 border-t border-b border-emerald-500/20 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Blocks Score ({pulledBlockIds.length} pulled):</span>
                <span className="font-mono font-bold text-white text-sm">
                  +{scoreCalculation.blockScore} pts
                </span>
              </div>

              {/* Selected blocks list */}
              <div className="pl-2 space-y-1 text-[11px] text-slate-400 font-mono">
                {pulledBlockIds.map(id => {
                  const def = OFFICIAL_BLOCK_WEIGHTS.find(w => w.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between">
                      <span>• {def?.label} Sled Pull:</span>
                      <span className="text-emerald-300">+{def?.fullPoints}</span>
                    </div>
                  );
                })}
                {pulledBlockIds.length === 0 && (
                  <div className="text-slate-500 italic">No blocks selected yet</div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-300">Time Left Bonus ({scoreCalculation.timeLeftSeconds}s):</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  +{scoreCalculation.timeBonus} pts
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Boundary Touches ({scoreCalculation.boundaryTouches} × 5):</span>
                <span className={`font-mono font-bold text-sm ${scoreCalculation.boundaryPenalty > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  -{scoreCalculation.boundaryPenalty} pts
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-bold">
                <span className="text-white text-sm">Final Round 2 Score:</span>
                <span className="font-mono text-base text-emerald-400">
                  {scoreCalculation.finalScore} pts
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                disabled={!selectedSchoolId || isTimerRunning}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Score Preview & Publish</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={!selectedSchoolId || isTimerRunning}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Local Draft (Do Not Publish)</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Publishing immediately updates the Arena LED screen, recalculates the official leaderboard, and logs an audit entry.
              </span>
            </div>
          </div>

          {/* Official Rule Reference Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official BRL 2026 Rules - Round 2</span>
            </h4>
            <ul className="text-slate-400 space-y-1 list-disc list-inside text-[11px]">
              <li>Time allocation: 120 seconds per run</li>
              <li>Two-member team: Member 1 hooks, Member 2 drives</li>
              <li>Full points per block pulled past finish line</li>
              <li>Time Bonus: 1 pt per unused second</li>
              <li>Boundary penalty: -5 pts per touch</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SCORE PREVIEW CONFIRMATION MODAL */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                SCORE PREVIEW & CONFIRMATION
              </div>
              <h3 className="text-2xl font-display font-black text-white mt-1">
                Publish Round 2 Score
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify the calculation breakdown below before making this score live on the auditorium screen.
              </p>
            </div>

            {/* School details */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-mono">Competing Team</div>
              <div className="text-lg font-bold text-white mt-0.5">{activeSchool?.name}</div>
              <div className="text-sm text-emerald-300 font-mono">
                {activeSchool?.teamNumber} • {activeSchool?.teamName}
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-sm">
              <div className="flex justify-between items-center text-xs text-slate-400 font-semibold border-b border-slate-800 pb-2">
                <span>COMPONENT</span>
                <span>AWARDED</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Blocks Pulled ({pulledBlockIds.length} of 6):</span>
                <span className="font-mono font-bold text-white">+{scoreCalculation.blockScore} pts</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Time Left Bonus ({scoreCalculation.timeLeftSeconds}s × 1):</span>
                <span className="font-mono font-bold text-emerald-400">+{scoreCalculation.timeBonus} pts</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Boundary Touches ({scoreCalculation.boundaryTouches} touches × 5):</span>
                <span className={`font-mono font-bold ${scoreCalculation.boundaryPenalty > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  -{scoreCalculation.boundaryPenalty} pts
                </span>
              </div>

              <div className="flex justify-between items-center text-base pt-3 border-t-2 border-slate-700 font-bold">
                <span className="text-white">FINAL ROUND 2 SCORE:</span>
                <span className="text-2xl font-display font-black text-emerald-400">
                  {scoreCalculation.finalScore} PTS
                </span>
              </div>
            </div>

            {notes && (
              <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <strong className="text-slate-300">Note:</strong> {notes}
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
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Publish Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
