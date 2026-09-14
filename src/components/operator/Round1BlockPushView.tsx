import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Save, 
  Send, 
  RotateCcw, 
  SkipForward, 
  AlertCircle, 
  Clock, 
  Layers, 
  Sparkles, 
  CheckCircle2,
  Info,
  Tv,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  OFFICIAL_BLOCK_WEIGHTS, 
  BLOCK_PUSH_CONFIG, 
  calculateBlockPushScore 
} from '../../data/officialRules';
import { PushBlockStatus, BlockPushBlockEntry } from '../../types';

export const Round1BlockPushView: React.FC = () => {
  const { 
    state, 
    currentSchool, 
    saveBlockPushDraft, 
    publishBlockPushScore, 
    advanceQueue,
    setDisplayState
  } = useCompetition();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  
  // State for the 6 official blocks: weightId -> 'none' | 'complete' | 'incomplete'
  const [blockStatuses, setBlockStatuses] = useState<Record<string, PushBlockStatus>>({
    '200g': 'none',
    '500g': 'none',
    '700g': 'none',
    '1kg': 'none',
    '2kg': 'none',
    '4kg': 'none',
  });

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(45);
  const [notes, setNotes] = useState<string>('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Sync with current queue team
  useEffect(() => {
    if (!selectedSchoolId && currentSchool) {
      setSelectedSchoolId(currentSchool.id);
    } else if (!selectedSchoolId && state.schools.length > 0) {
      setSelectedSchoolId(state.schools[0].id);
    }
  }, [currentSchool, state.schools, selectedSchoolId]);

  // Load existing draft or score when selected school changes
  useEffect(() => {
    if (selectedSchoolId) {
      const existing = state.scores[selectedSchoolId]?.round1;
      if (existing) {
        const statuses: Record<string, PushBlockStatus> = {
          '200g': 'none',
          '500g': 'none',
          '700g': 'none',
          '1kg': 'none',
          '2kg': 'none',
          '4kg': 'none',
        };
        if (existing.blocks && Array.isArray(existing.blocks)) {
          existing.blocks.forEach(b => {
            if (statuses[b.weightId] !== undefined) {
              statuses[b.weightId] = b.status;
            }
          });
        }
        setBlockStatuses(statuses);
        setTimeLeftSeconds(existing.timeLeftSeconds ?? 0);
        setNotes(existing.notes || '');
      } else {
        // Reset defaults
        setBlockStatuses({
          '200g': 'none',
          '500g': 'none',
          '700g': 'none',
          '1kg': 'none',
          '2kg': 'none',
          '4kg': 'none',
        });
        setTimeLeftSeconds(45);
        setNotes('');
      }
    }
  }, [selectedSchoolId, state.scores]);

  // Prepare calculation payload
  const activeInputBlocks = OFFICIAL_BLOCK_WEIGHTS.map(def => ({
    weightId: def.id,
    status: blockStatuses[def.id] || 'none'
  }));

  const scoreCalculation = calculateBlockPushScore(activeInputBlocks, timeLeftSeconds);

  const activeSchool = state.schools.find(s => s.id === selectedSchoolId);
  const existingScore = activeSchool ? state.scores[activeSchool.id]?.round1 : null;
  const isPublished = !!(existingScore && !existingScore.isDraft);

  const handleSetStatus = (weightId: string, status: PushBlockStatus) => {
    setBlockStatuses(prev => ({
      ...prev,
      [weightId]: status
    }));
  };

  const handleResetAllBlocks = () => {
    setBlockStatuses({
      '200g': 'none',
      '500g': 'none',
      '700g': 'none',
      '1kg': 'none',
      '2kg': 'none',
      '4kg': 'none',
    });
    setTimeLeftSeconds(0);
  };

  const handleSaveDraft = () => {
    if (!selectedSchoolId) return;
    saveBlockPushDraft(selectedSchoolId, {
      ...scoreCalculation,
      isDraft: true,
      notes
    });
    setFeedbackMsg({ text: 'Draft saved. Public display remains unchanged.', type: 'info' });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handlePublishConfirmed = () => {
    if (!selectedSchoolId) return;
    publishBlockPushScore(selectedSchoolId, {
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

  const pushedCount = Object.values(blockStatuses).filter(s => s !== 'none').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner - Blue theme */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-blue-950/80 border-2 border-blue-600/40 rounded-2xl p-5 shadow-xl shadow-blue-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-display font-black text-xl shadow-lg shadow-blue-600/30">
              R1
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span>ROUND 1 • OFFICIAL SCORING ENGINE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                BLOCK PUSH CHALLENGE
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Total Time: 120s • Complete inside box: 100% pts • Any portion outside: 50% pts • Unused seconds: 1 pt/sec bonus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setDisplayState('live_run')}
              className="px-3 py-2 bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Show live run on big screen"
            >
              <Tv className="w-3.5 h-3.5 text-blue-400" />
              <span>Show on Arena Screen</span>
            </button>
            <button
              onClick={advanceQueue}
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

      {/* Main Scoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: School Selector & 6 Block Entry */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* School Selector Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Competing School / Team
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:border-blue-500 text-sm"
              >
                {state.schools.map((school) => {
                  const hasScored = state.scores[school.id]?.round1 && !state.scores[school.id]?.round1?.isDraft;
                  const isCurrent = currentSchool?.id === school.id;
                  return (
                    <option key={school.id} value={school.id}>
                      {isCurrent ? '▶ [NOW PLAYING] ' : ''}
                      {school.name} ({school.teamNumber} - {school.teamName})
                      {hasScored ? ` • Published: ${state.scores[school.id]?.round1?.finalScore} pts` : ''}
                    </option>
                  );
                })}
              </select>

              {currentSchool && selectedSchoolId !== currentSchool.id && (
                <button
                  type="button"
                  onClick={() => setSelectedSchoolId(currentSchool.id)}
                  className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition whitespace-nowrap"
                >
                  Jump to Current Playing ({currentSchool.teamNumber})
                </button>
              )}
            </div>

            {/* School Details Badge */}
            {activeSchool && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/30">
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

          {/* Block Weights & Status Entry Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Push Challenge Blocks (Official 6 Weights)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click status for each block pushed. Each physical block is recorded once to prevent duplicate errors.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetAllBlocks}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Blocks</span>
              </button>
            </div>

            {/* Blocks List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {OFFICIAL_BLOCK_WEIGHTS.map((weightDef) => {
                const currentStatus = blockStatuses[weightDef.id] || 'none';
                const isComplete = currentStatus === 'complete';
                const isIncomplete = currentStatus === 'incomplete';
                const isNone = currentStatus === 'none';

                let earnedPts = 0;
                if (isComplete) earnedPts = weightDef.fullPoints;
                if (isIncomplete) earnedPts = weightDef.incompletePoints;

                return (
                  <div
                    key={weightDef.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isComplete 
                        ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/40' 
                        : isIncomplete 
                          ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-950/30' 
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-display font-black text-white">
                            {weightDef.label}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Full: {weightDef.fullPoints} pts / Half: {weightDef.incompletePoints} pts
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {weightDef.description}
                        </div>
                      </div>

                      <div className="text-right pl-2">
                        <div className={`text-xl font-display font-black ${
                          isComplete ? 'text-blue-400' : isIncomplete ? 'text-indigo-300' : 'text-slate-600'
                        }`}>
                          +{earnedPts}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase font-mono">
                          {earnedPts > 0 ? 'EARNED' : '0 PTS'}
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800/80 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSetStatus(weightDef.id, 'none')}
                        className={`py-1.5 px-2 rounded-md font-semibold transition ${
                          isNone 
                            ? 'bg-slate-800 text-slate-200 shadow-sm' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Not Pushed
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(weightDef.id, 'incomplete')}
                        className={`py-1.5 px-2 rounded-md font-bold transition flex items-center justify-center gap-1 ${
                          isIncomplete 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-slate-300 hover:text-white hover:bg-slate-900'
                        }`}
                        title="Any portion of block remains outside designated box (50% points)"
                      >
                        <span>Incomplete (50%)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(weightDef.id, 'complete')}
                        className={`py-1.5 px-2 rounded-md font-bold transition flex items-center justify-center gap-1 ${
                          isComplete 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-slate-300 hover:text-white hover:bg-slate-900'
                        }`}
                        title="Pushed completely inside designated box (100% points)"
                      >
                        <Check className="w-3 h-3" />
                        <span>Complete (100%)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtotal of Blocks */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-sm">
              <span className="text-slate-400 font-medium">
                Pushed Blocks: <strong className="text-white">{pushedCount} of 6</strong>
              </span>
              <span className="text-blue-400 font-display font-bold text-base">
                Subtotal Block Points: {scoreCalculation.blockScore} pts
              </span>
            </div>
          </div>

          {/* Time Remaining & Bonus Input */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="font-display font-bold text-white text-base">
                  Time Allocation & Time Bonus
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800">
                1 UNUSED SEC = +1 POINT
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Time Left / Unused (0 to 120 seconds):
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-display font-black text-blue-400">
                    {timeLeftSeconds}s
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    +{timeLeftSeconds} pts bonus
                  </span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max="120"
                step="1"
                value={timeLeftSeconds}
                onChange={(e) => setTimeLeftSeconds(Number(e.target.value))}
                className="w-full accent-blue-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: '0s (Timeout)', val: 0 },
                  { label: '15s', val: 15 },
                  { label: '30s', val: 30 },
                  { label: '45s', val: 45 },
                  { label: '60s', val: 60 },
                  { label: '75s', val: 75 },
                  { label: '90s', val: 90 },
                  { label: '120s (Instant)', val: 120 },
                ].map(preset => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setTimeLeftSeconds(preset.val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition border ${
                      timeLeftSeconds === preset.val
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Referee Notes */}
            <div className="pt-3 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Referee / Inspection Notes (Optional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 4kg block rested partially on outer line; awarded 50% points"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Instant Score Breakdown & Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Calculation Summary Card */}
          <div className="bg-gradient-to-b from-slate-900 to-[#0c162d] border-2 border-blue-500/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>LIVE SCORE PREVIEW</span>
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            </div>
            
            <div className="mt-2 mb-4">
              <div className="text-5xl font-display font-black text-white tracking-tight">
                {scoreCalculation.finalScore}
                <span className="text-lg font-normal text-blue-300 ml-2 font-mono">PTS</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Official calculated total for Round 1
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5 py-4 border-t border-b border-blue-500/20 text-xs">
              
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Blocks Score ({pushedCount} pushed):</span>
                <span className="font-mono font-bold text-white text-sm">
                  {scoreCalculation.blockScore} pts
                </span>
              </div>

              {/* List pushed blocks */}
              <div className="pl-2 space-y-1 text-[11px] text-slate-400 font-mono">
                {scoreCalculation.blocks.filter(b => b.status !== 'none').map(b => (
                  <div key={b.weightId} className="flex items-center justify-between">
                    <span>
                      • {b.weightLabel} ({b.status === 'complete' ? 'Complete 100%' : 'Incomplete 50%'}):
                    </span>
                    <span className={b.status === 'complete' ? 'text-blue-300' : 'text-indigo-300'}>
                      +{b.pointsEarned}
                    </span>
                  </div>
                ))}
                {pushedCount === 0 && (
                  <div className="text-slate-500 italic">No blocks selected yet</div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-300">Time Left Bonus ({scoreCalculation.timeLeftSeconds}s):</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  +{scoreCalculation.timeBonus} pts
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-bold">
                <span className="text-white text-sm">Final Round 1 Score:</span>
                <span className="font-mono text-base text-blue-400">
                  {scoreCalculation.finalScore} pts
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                disabled={!selectedSchoolId}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Score Preview & Publish</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={!selectedSchoolId}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Local Draft (Do Not Publish)</span>
              </button>
            </div>

            {/* Fast workflow tip */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Publishing immediately updates the Arena LED screen, recalculates the official leaderboard, and logs an audit entry.
              </span>
            </div>
          </div>

          {/* Official Rule Reference Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Official BRL 2026 Rules - Round 1</span>
            </h4>
            <ul className="text-slate-400 space-y-1 list-disc list-inside text-[11px]">
              <li>Time allocation: 120 seconds per run</li>
              <li>Pushed completely inside designated box: 100% points</li>
              <li>Any portion of block remains outside: 50% points</li>
              <li>Time Bonus: 1 pt per unused second (Time Left)</li>
              <li>Maximum possible score: 330 + 120 = 450 pts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CONFIRMATION & SCORE PREVIEW MODAL */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-blue-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                SCORE PREVIEW & CONFIRMATION
              </div>
              <h3 className="text-2xl font-display font-black text-white mt-1">
                Publish Round 1 Score
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify the calculation breakdown below before making this score live on the auditorium screen.
              </p>
            </div>

            {/* School details */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-mono">Competing Team</div>
              <div className="text-lg font-bold text-white mt-0.5">{activeSchool?.name}</div>
              <div className="text-sm text-blue-300 font-mono">
                {activeSchool?.teamNumber} • {activeSchool?.teamName}
              </div>
            </div>

            {/* Full Breakdown */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-sm">
              <div className="flex justify-between items-center text-xs text-slate-400 font-semibold border-b border-slate-800 pb-2">
                <span>COMPONENT</span>
                <span>AWARDED</span>
              </div>

              {scoreCalculation.blocks.map(b => (
                <div key={b.weightId} className="flex justify-between items-center text-xs">
                  <span className="text-slate-300">
                    {b.weightLabel} Block:
                  </span>
                  <span className={`font-mono font-bold ${b.status === 'none' ? 'text-slate-500' : 'text-white'}`}>
                    {b.status === 'complete' ? `Complete (100%) = +${b.pointsEarned} pts` : b.status === 'incomplete' ? `Incomplete (50%) = +${b.pointsEarned} pts` : 'Not Pushed (0)'}
                  </span>
                </div>
              ))}

              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-300 font-semibold">Subtotal Block Points:</span>
                <span className="font-mono font-bold text-blue-300">+{scoreCalculation.blockScore} pts</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Time Bonus ({scoreCalculation.timeLeftSeconds}s left × 1):</span>
                <span className="font-mono font-bold text-emerald-400">+{scoreCalculation.timeBonus} pts</span>
              </div>

              <div className="flex justify-between items-center text-base pt-3 border-t-2 border-slate-700 font-bold">
                <span className="text-white">FINAL ROUND 1 SCORE:</span>
                <span className="text-2xl font-display font-black text-blue-400">
                  {scoreCalculation.finalScore} PTS
                </span>
              </div>
            </div>

            {notes && (
              <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <strong className="text-slate-300">Note:</strong> {notes}
              </div>
            )}

            {/* Dialog Actions */}
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
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
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
