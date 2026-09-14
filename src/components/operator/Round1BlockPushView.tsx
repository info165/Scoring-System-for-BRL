import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Save, 
  Send, 
  RotateCcw, 
  SkipForward, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  Trophy, 
  Info,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  OFFICIAL_BLOCK_PUSH_TIERS, 
  OFFICIAL_PUSH_ZONES, 
  OFFICIAL_PUSH_BONUSES, 
  OFFICIAL_PUSH_PENALTIES 
} from '../../data/officialRules';
import { BlockPushScore } from '../../types';

export const Round1BlockPushView: React.FC = () => {
  const { 
    state, 
    currentSchool, 
    saveBlockPushDraft, 
    publishBlockPushScore, 
    advanceQueue 
  } = useCompetition();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');

  // Form parameters
  const [tierId, setTierId] = useState<string>(OFFICIAL_BLOCK_PUSH_TIERS[1].id); // default category 2
  const [quantity, setQuantity] = useState<number>(1);
  const [targetZone, setTargetZone] = useState<'outer' | 'middle' | 'bullseye'>('middle');
  const [timeSeconds, setTimeSeconds] = useState<number>(55);
  const [bonusCleanRun, setBonusCleanRun] = useState<boolean>(false);
  const [bonusSpeedRun, setBonusSpeedRun] = useState<boolean>(false);
  const [penaltyBoundary, setPenaltyBoundary] = useState<number>(0);
  const [penaltyReset, setPenaltyReset] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync selected school with current team if not already chosen
  useEffect(() => {
    if (!selectedSchoolId && currentSchool) {
      setSelectedSchoolId(currentSchool.id);
    } else if (!selectedSchoolId && state.schools.length > 0) {
      setSelectedSchoolId(state.schools[0].id);
    }
  }, [currentSchool, state.schools, selectedSchoolId]);

  // Load existing draft or published score when school selection changes
  useEffect(() => {
    if (selectedSchoolId) {
      const existing = state.scores[selectedSchoolId]?.round1;
      if (existing) {
        setTierId(existing.weightTierId);
        setQuantity(existing.quantity || 1);
        setTargetZone(existing.targetZone || 'middle');
        setTimeSeconds(existing.timeSeconds || 60);
        setBonusCleanRun(existing.bonusCleanRun);
        setBonusSpeedRun(existing.bonusSpeedRun);
        setPenaltyBoundary(existing.penaltyBoundary);
        setPenaltyReset(existing.penaltyReset);
        setNotes(existing.notes || '');
      } else {
        // Reset to defaults
        setTierId(OFFICIAL_BLOCK_PUSH_TIERS[1].id);
        setQuantity(1);
        setTargetZone('middle');
        setTimeSeconds(55);
        setBonusCleanRun(false);
        setBonusSpeedRun(false);
        setPenaltyBoundary(0);
        setPenaltyReset(0);
        setNotes('');
      }
    }
  }, [selectedSchoolId, state.scores]);

  const selectedTier = OFFICIAL_BLOCK_PUSH_TIERS.find(t => t.id === tierId) || OFFICIAL_BLOCK_PUSH_TIERS[0];
  const selectedZoneObj = OFFICIAL_PUSH_ZONES.find(z => z.id === targetZone) || OFFICIAL_PUSH_ZONES[0];

  // Automatic calculation based on official rules
  const basePoints = selectedTier.basePoints * quantity;
  const zoneCalculated = Math.round(basePoints * selectedZoneObj.multiplier);
  
  const bonusPoints = 
    (bonusCleanRun ? OFFICIAL_PUSH_BONUSES.cleanAutonomousRun : 0) +
    (bonusSpeedRun ? OFFICIAL_PUSH_BONUSES.speedUnder60s : 0);

  const penaltyPoints = 
    (penaltyBoundary * OFFICIAL_PUSH_PENALTIES.boundaryBreach) +
    (penaltyReset * OFFICIAL_PUSH_PENALTIES.robotManualReset);

  const calculatedScore = Math.max(0, zoneCalculated + bonusPoints - penaltyPoints);

  const activeSchool = state.schools.find(s => s.id === selectedSchoolId);
  const existingScore = activeSchool ? state.scores[activeSchool.id]?.round1 : null;
  const isPublished = !!(existingScore && !existingScore.isDraft);

  const handleSaveDraft = () => {
    if (!selectedSchoolId) return;
    saveBlockPushDraft(selectedSchoolId, {
      weightTierId: selectedTier.id,
      weightCategoryLabel: selectedTier.name,
      basePoints,
      quantity,
      targetZone,
      zoneMultiplier: selectedZoneObj.multiplier,
      timeSeconds,
      bonusCleanRun,
      bonusSpeedRun,
      bonusPoints,
      penaltyBoundary,
      penaltyReset,
      penaltyPoints,
      calculatedScore,
      notes
    });
    setSaveSuccessMsg('Draft saved locally. Public display remains untouched.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handlePublish = () => {
    if (!selectedSchoolId) return;
    publishBlockPushScore(selectedSchoolId, {
      weightTierId: selectedTier.id,
      weightCategoryLabel: selectedTier.name,
      basePoints,
      quantity,
      targetZone,
      zoneMultiplier: selectedZoneObj.multiplier,
      timeSeconds,
      bonusCleanRun,
      bonusSpeedRun,
      bonusPoints,
      penaltyBoundary,
      penaltyReset,
      penaltyPoints,
      calculatedScore,
      notes
    });
    setSaveSuccessMsg('Score officially published! Public display and leaderboard updated.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleClear = () => {
    setTierId(OFFICIAL_BLOCK_PUSH_TIERS[1].id);
    setQuantity(1);
    setTargetZone('outer');
    setTimeSeconds(60);
    setBonusCleanRun(false);
    setBonusSpeedRun(false);
    setPenaltyBoundary(0);
    setPenaltyReset(0);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-5 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Official Scoring Station</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            ROUND 1: BLOCK PUSH CHALLENGE
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Record mass categories, target positioning, autonomous precision bonuses, and boundary penalties.
          </p>
        </div>

        {/* Status Callout */}
        <div className="flex items-center space-x-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Official Scoring:</span>
          <span className="font-bold text-cyan-300">BRL Master Rulebook 2026</span>
        </div>
      </div>

      {/* Success Banner Notification */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs text-emerald-300 shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">BROADCASTED</span>
        </div>
      )}

      {/* Main Scoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2-Columns: Controls & Inputs */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          
          {/* School Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Select Competing School / Team
              </label>
              {currentSchool && (
                <button
                  type="button"
                  onClick={() => setSelectedSchoolId(currentSchool.id)}
                  className="text-[11px] text-amber-400 hover:underline font-semibold"
                >
                  Use Current Playing Team ({currentSchool.teamNumber})
                </button>
              )}
            </div>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-cyan-500"
            >
              {state.schools.filter(s => s.isActive).map(school => (
                <option key={school.id} value={school.id}>
                  {school.teamNumber} — {school.name} ({school.teamName})
                </option>
              ))}
            </select>
          </div>

          {/* Section 1: Block Weight Category */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                1. Block Mass Category (Weight Tier)
              </label>
              <span className="text-[11px] text-slate-400">Fixed official point values</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {OFFICIAL_BLOCK_PUSH_TIERS.map(tier => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setTierId(tier.id)}
                  className={`p-3 rounded-xl text-left border transition ${
                    tierId === tier.id
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-950/50 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">{tier.weightRange}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200">
                      {tier.basePoints} pts
                    </span>
                  </div>
                  <div className="text-xs font-semibold mt-1 text-white truncate">{tier.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{tier.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Quantity and Target Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Quantity */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Blocks Pushed (Quantity)
                </label>
                <span className="font-mono text-xs font-bold text-amber-400">{quantity} Blocks</span>
              </div>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold transition border ${
                      quantity === q
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Zone Multiplier */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Target Zone Placed
                </label>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {selectedZoneObj.multiplier}x Multiplier
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {OFFICIAL_PUSH_ZONES.map(zone => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setTargetZone(zone.id)}
                    className={`p-2 rounded-lg text-center font-semibold text-xs transition border ${
                      targetZone === zone.id
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-[11px] truncate">{zone.label.split(' ')[0]}</div>
                    <div className="text-[10px] font-mono opacity-80">{zone.multiplier}x</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Bonuses & Penalties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bonuses */}
            <div className="bg-slate-950/60 border border-emerald-900/40 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Bonuses Awarded
              </span>
              <label className="flex items-center space-x-2.5 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bonusCleanRun}
                  onChange={(e) => setBonusCleanRun(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span className="flex-1">Clean Run / Precision Alignment</span>
                <span className="font-mono text-emerald-400 font-bold">+{OFFICIAL_PUSH_BONUSES.cleanAutonomousRun} pts</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bonusSpeedRun}
                  onChange={(e) => setBonusSpeedRun(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span className="flex-1">Sub-60s Rapid Completion</span>
                <span className="font-mono text-emerald-400 font-bold">+{OFFICIAL_PUSH_BONUSES.speedUnder60s} pts</span>
              </label>
            </div>

            {/* Penalties */}
            <div className="bg-slate-950/60 border border-rose-900/40 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                Deductions / Penalties
              </span>
              <div className="flex items-center justify-between text-xs text-slate-200">
                <span>Boundary Touching (-5 pts ea)</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPenaltyBoundary(Math.max(0, penaltyBoundary - 1))}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold w-4 text-center">{penaltyBoundary}</span>
                  <button
                    type="button"
                    onClick={() => setPenaltyBoundary(penaltyBoundary + 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-200">
                <span>Robot Manual Reset (-15 pts ea)</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPenaltyReset(Math.max(0, penaltyReset - 1))}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold w-4 text-center">{penaltyReset}</span>
                  <button
                    type="button"
                    onClick={() => setPenaltyReset(penaltyReset + 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Referee Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Referee / Arena Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Flawless bullseye landing under 45 seconds"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

        </div>

        {/* Right Column: Score Breakdown Card & Actions */}
        <div className="space-y-6">
          
          {/* Official Calculation Breakdown Box (Mandatory Requirement) */}
          <div className="bg-[#0c152c] border-2 border-cyan-500/50 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  BLOCK PUSH BREAKDOWN
                </span>
                <span className="text-sm font-bold text-white">
                  {activeSchool?.name || 'Selected Team'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isPublished
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isPublished ? 'PUBLISHED LIVE' : 'UNPUBLISHED DRAFT'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 divide-y divide-slate-800/80">
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Weight / Category:</span>
                <span className="font-semibold text-white text-right max-w-[170px] truncate">
                  {selectedTier.name}
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Base Points ({quantity}x):</span>
                <span className="font-mono font-bold text-slate-200">{basePoints} pts</span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Zone Multiplier:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {selectedZoneObj.label.split(' ')[0]} ({selectedZoneObj.multiplier}x)
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Zone Points:</span>
                <span className="font-mono font-bold text-white">{zoneCalculated} pts</span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Bonus:</span>
                <span className="font-mono font-bold text-emerald-400">+{bonusPoints} pts</span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Penalty:</span>
                <span className="font-mono font-bold text-rose-400">-{penaltyPoints} pts</span>
              </div>
            </div>

            {/* Final Round 1 Score Display */}
            <div className="pt-3 border-t-2 border-cyan-500/40 bg-slate-950/60 rounded-xl p-4 text-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                FINAL ROUND 1 SCORE
              </div>
              <div className="text-4xl font-display font-bold text-amber-400 mt-1">
                {calculatedScore}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">OFFICIAL POINTS</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Publish Score (Updates Public Display) */}
            <button
              onClick={handlePublish}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>PUBLISH SCORE (LIVE UPDATE)</span>
            </button>

            {/* Save Draft (Does NOT update Public Display) */}
            <button
              onClick={handleSaveDraft}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4 text-cyan-400" />
              <span>SAVE DRAFT (DOES NOT UPDATE DISPLAY)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleClear}
                className="py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>CLEAR</span>
              </button>

              <button
                onClick={advanceQueue}
                className="py-2 bg-slate-900 hover:bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>NEXT TEAM</span>
              </button>
            </div>
          </div>

          {/* Operator Notice */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
            <span className="text-amber-400 font-bold block">Operator Safeguard:</span>
            <span>
              Drafts allow you to stage and verify points with referees prior to broadcasting. Only pressing <strong>PUBLISH SCORE</strong> will transmit to the big screen.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
