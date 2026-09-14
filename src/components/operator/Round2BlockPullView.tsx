import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Send, 
  RotateCcw, 
  SkipForward, 
  Clock, 
  ShieldAlert, 
  Layers, 
  CheckCircle2,
  Anchor
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  OFFICIAL_BLOCK_PULL_TIERS, 
  OFFICIAL_PULL_DISTANCES, 
  OFFICIAL_PULL_BONUSES, 
  OFFICIAL_PULL_PENALTIES 
} from '../../data/officialRules';
import { BlockPullScore } from '../../types';

export const Round2BlockPullView: React.FC = () => {
  const { 
    state, 
    currentSchool, 
    saveBlockPullDraft, 
    publishBlockPullScore, 
    advanceQueue 
  } = useCompetition();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');

  // Form parameters
  const [tierId, setTierId] = useState<string>(OFFICIAL_BLOCK_PULL_TIERS[1].id); // default Tier 2
  const [distance, setDistance] = useState<'full' | 'three_quarters' | 'half' | 'quarter'>('full');
  const [timeSeconds, setTimeSeconds] = useState<number>(42);
  const [bonusSpeed, setBonusSpeed] = useState<boolean>(false);
  const [bonusZeroSlip, setBonusZeroSlip] = useState<boolean>(false);
  const [penaltyLineFoul, setPenaltyLineFoul] = useState<number>(0);
  const [penaltyDisconnect, setPenaltyDisconnect] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync selected school
  useEffect(() => {
    if (!selectedSchoolId && currentSchool) {
      setSelectedSchoolId(currentSchool.id);
    } else if (!selectedSchoolId && state.schools.length > 0) {
      setSelectedSchoolId(state.schools[0].id);
    }
  }, [currentSchool, state.schools, selectedSchoolId]);

  // Load existing draft or published score
  useEffect(() => {
    if (selectedSchoolId) {
      const existing = state.scores[selectedSchoolId]?.round2;
      if (existing) {
        setTierId(existing.pullTierId);
        setDistance(existing.distanceAchieved);
        setTimeSeconds(existing.timeSeconds || 45);
        setBonusSpeed(existing.bonusSpeed);
        setBonusZeroSlip(existing.bonusZeroSlip);
        setPenaltyLineFoul(existing.penaltyLineFoul);
        setPenaltyDisconnect(existing.penaltyDisconnect);
        setNotes(existing.notes || '');
      } else {
        setTierId(OFFICIAL_BLOCK_PULL_TIERS[1].id);
        setDistance('full');
        setTimeSeconds(42);
        setBonusSpeed(false);
        setBonusZeroSlip(false);
        setPenaltyLineFoul(0);
        setPenaltyDisconnect(0);
        setNotes('');
      }
    }
  }, [selectedSchoolId, state.scores]);

  const selectedTier = OFFICIAL_BLOCK_PULL_TIERS.find(t => t.id === tierId) || OFFICIAL_BLOCK_PULL_TIERS[0];
  const selectedDistObj = OFFICIAL_PULL_DISTANCES.find(d => d.id === distance) || OFFICIAL_PULL_DISTANCES[0];

  // Automatic calculation based on official BRL rules
  const basePoints = selectedTier.basePoints;
  const distanceCalculated = Math.round(basePoints * selectedDistObj.multiplier);

  const bonusPoints = 
    (bonusSpeed ? OFFICIAL_PULL_BONUSES.sub45sSpeed : 0) +
    (bonusZeroSlip ? OFFICIAL_PULL_BONUSES.zeroWheelSlip : 0);

  const penaltyPoints = 
    (penaltyLineFoul * OFFICIAL_PULL_PENALTIES.laneBoundaryTouch) +
    (penaltyDisconnect * OFFICIAL_PULL_PENALTIES.cableHitchDisconnect);

  const calculatedScore = Math.max(0, distanceCalculated + bonusPoints - penaltyPoints);

  const activeSchool = state.schools.find(s => s.id === selectedSchoolId);
  const existingScore = activeSchool ? state.scores[activeSchool.id]?.round2 : null;
  const isPublished = !!(existingScore && !existingScore.isDraft);

  const handleSaveDraft = () => {
    if (!selectedSchoolId) return;
    saveBlockPullDraft(selectedSchoolId, {
      pullTierId: selectedTier.id,
      pullTierLabel: selectedTier.name,
      basePoints,
      distanceAchieved: distance,
      distanceMultiplier: selectedDistObj.multiplier,
      timeSeconds,
      bonusSpeed,
      bonusZeroSlip,
      bonusPoints,
      penaltyLineFoul,
      penaltyDisconnect,
      penaltyPoints,
      calculatedScore,
      notes
    });
    setSaveSuccessMsg('Draft saved locally. Public display remains untouched.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handlePublish = () => {
    if (!selectedSchoolId) return;
    publishBlockPullScore(selectedSchoolId, {
      pullTierId: selectedTier.id,
      pullTierLabel: selectedTier.name,
      basePoints,
      distanceAchieved: distance,
      distanceMultiplier: selectedDistObj.multiplier,
      timeSeconds,
      bonusSpeed,
      bonusZeroSlip,
      bonusPoints,
      penaltyLineFoul,
      penaltyDisconnect,
      penaltyPoints,
      calculatedScore,
      notes
    });
    setSaveSuccessMsg('Round 2 score published! Public display and leaderboard updated.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleClear = () => {
    setTierId(OFFICIAL_BLOCK_PULL_TIERS[1].id);
    setDistance('full');
    setTimeSeconds(45);
    setBonusSpeed(false);
    setBonusZeroSlip(false);
    setPenaltyLineFoul(0);
    setPenaltyDisconnect(0);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-5 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Anchor className="w-4 h-4" />
            <span>Official Scoring Station</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            ROUND 2: BLOCK PULL CHALLENGE
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Heavy sled towing drag test. Score mass tiers, distance markers, high-speed bonuses, and rail deductions.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Official Scoring:</span>
          <span className="font-bold text-amber-300">BRL Pull Sled Calibration</span>
        </div>
      </div>

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
        
        {/* Left 2-Columns: Controls */}
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
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
            >
              {state.schools.filter(s => s.isActive).map(school => (
                <option key={school.id} value={school.id}>
                  {school.teamNumber} — {school.name} ({school.teamName})
                </option>
              ))}
            </select>
          </div>

          {/* Section 1: Sled Pull Weight Tier */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                1. Sled Load Tier (Towing Mass)
              </label>
              <span className="text-[11px] text-slate-400">Official BRL weight steps</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {OFFICIAL_BLOCK_PULL_TIERS.map(tier => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setTierId(tier.id)}
                  className={`p-3 rounded-xl text-left border transition ${
                    tierId === tier.id
                      ? 'bg-amber-950/60 border-amber-400 shadow-md shadow-amber-950/50 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">{tier.weight}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                      {tier.basePoints} pts
                    </span>
                  </div>
                  <div className="text-xs font-semibold mt-1 text-white truncate">{tier.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{tier.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Distance Achieved */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                2. Track Distance Completed
              </label>
              <span className="font-mono text-xs font-bold text-amber-400">
                {selectedDistObj.multiplier}x Factor
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {OFFICIAL_PULL_DISTANCES.map(dist => (
                <button
                  key={dist.id}
                  type="button"
                  onClick={() => setDistance(dist.id)}
                  className={`p-3 rounded-xl text-center font-medium text-xs transition border ${
                    distance === dist.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-sm font-bold font-mono">{dist.multiplier * 100}%</div>
                  <div className="text-[11px] truncate mt-0.5">{dist.label.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Tow Bonuses and Rail Penalties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bonuses */}
            <div className="bg-slate-950/60 border border-emerald-900/40 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Traction & Speed Bonuses
              </span>
              <label className="flex items-center space-x-2.5 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bonusSpeed}
                  onChange={(e) => setBonusSpeed(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span className="flex-1">Sub-45s High-Speed Run</span>
                <span className="font-mono text-emerald-400 font-bold">+{OFFICIAL_PULL_BONUSES.sub45sSpeed} pts</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bonusZeroSlip}
                  onChange={(e) => setBonusZeroSlip(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span className="flex-1">Zero Wheel Slip / Flawless Grip</span>
                <span className="font-mono text-emerald-400 font-bold">+{OFFICIAL_PULL_BONUSES.zeroWheelSlip} pts</span>
              </label>
            </div>

            {/* Penalties */}
            <div className="bg-slate-950/60 border border-rose-900/40 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                Track Deductions & Fouls
              </span>
              <div className="flex items-center justify-between text-xs text-slate-200">
                <span>Lane Safety Rail Touch (-10 pts ea)</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPenaltyLineFoul(Math.max(0, penaltyLineFoul - 1))}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold w-4 text-center">{penaltyLineFoul}</span>
                  <button
                    type="button"
                    onClick={() => setPenaltyLineFoul(penaltyLineFoul + 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-200">
                <span>Tow Hitch Disconnect (-20 pts ea)</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPenaltyDisconnect(Math.max(0, penaltyDisconnect - 1))}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold w-4 text-center">{penaltyDisconnect}</span>
                  <button
                    type="button"
                    onClick={() => setPenaltyDisconnect(penaltyDisconnect + 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Pull Track Referee Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Completed 5.0kg pull in 38.4 seconds without slip"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

        </div>

        {/* Right Column: Calculation Breakdown Card & Actions */}
        <div className="space-y-6">
          
          {/* Official Calculation Breakdown Box (Mandatory Requirement) */}
          <div className="bg-[#191306] border-2 border-amber-500/50 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  BLOCK PULL BREAKDOWN
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
                <span className="text-slate-400">Base Tow Points:</span>
                <span className="font-mono font-bold text-slate-200">{basePoints} pts</span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Distance Factor:</span>
                <span className="font-mono font-bold text-amber-300">
                  {selectedDistObj.label.split(' ')[0]} ({selectedDistObj.multiplier * 100}%)
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Distance Points:</span>
                <span className="font-mono font-bold text-white">{distanceCalculated} pts</span>
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

            {/* Final Round 2 Score Display */}
            <div className="pt-3 border-t-2 border-amber-500/40 bg-slate-950/60 rounded-xl p-4 text-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                FINAL ROUND 2 SCORE
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
              <Save className="w-4 h-4 text-amber-400" />
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

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
            <span className="text-amber-400 font-bold block">Operator Safeguard:</span>
            <span>
              Drafts remain private to this control terminal. The HDMI public scoreboard only updates when <strong>PUBLISH SCORE</strong> is clicked.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
