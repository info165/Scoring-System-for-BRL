import React, { useState } from 'react';
import { 
  Swords, 
  Trophy, 
  Send, 
  Save, 
  Plus, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  AlertTriangle,
  Flame,
  Tv
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { OFFICIAL_ROBOT_WAR_RULES } from '../../data/officialRules';
import { RobotWarMatch, WarWinType } from '../../types';

export const Round3RobotWarView: React.FC = () => {
  const { 
    state, 
    activeRobotWarMatch, 
    setActiveRobotWarMatch, 
    createRobotWarMatch, 
    saveRobotWarDraft, 
    publishRobotWarResult,
    setDisplayState
  } = useCompetition();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamA, setNewTeamA] = useState('');
  const [newTeamB, setNewTeamB] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Current match scoring state
  const [selectedResult, setSelectedResult] = useState<'team_a_win' | 'team_b_win' | 'draw' | 'pending'>(
    activeRobotWarMatch?.result || 'pending'
  );
  const [selectedWinType, setSelectedWinType] = useState<WarWinType>(
    activeRobotWarMatch?.winType || 'knockout'
  );
  const [matchNotes, setMatchNotes] = useState<string>(activeRobotWarMatch?.matchNotes || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync when active match changes
  React.useEffect(() => {
    if (activeRobotWarMatch) {
      setSelectedResult(activeRobotWarMatch.result);
      setSelectedWinType(activeRobotWarMatch.winType || 'knockout');
      setMatchNotes(activeRobotWarMatch.matchNotes || '');
    }
  }, [activeRobotWarMatch]);

  const teamASchool = state.schools.find(s => s.id === activeRobotWarMatch?.teamAId);
  const teamBSchool = state.schools.find(s => s.id === activeRobotWarMatch?.teamBId);

  // Calculate live preview points according to official rules
  let previewPointsA = 0;
  let previewPointsB = 0;

  if (selectedResult === 'team_a_win') {
    if (selectedWinType === 'knockout') {
      previewPointsA = OFFICIAL_ROBOT_WAR_RULES.knockout.winnerPoints;
      previewPointsB = OFFICIAL_ROBOT_WAR_RULES.knockout.loserPoints;
    } else if (selectedWinType === 'disqualification') {
      previewPointsA = OFFICIAL_ROBOT_WAR_RULES.disqualification.winnerPoints;
      previewPointsB = OFFICIAL_ROBOT_WAR_RULES.disqualification.loserPoints;
    } else {
      previewPointsA = OFFICIAL_ROBOT_WAR_RULES.judgesDecision.winnerPoints;
      previewPointsB = OFFICIAL_ROBOT_WAR_RULES.judgesDecision.loserPoints;
    }
  } else if (selectedResult === 'team_b_win') {
    if (selectedWinType === 'knockout') {
      previewPointsB = OFFICIAL_ROBOT_WAR_RULES.knockout.winnerPoints;
      previewPointsA = OFFICIAL_ROBOT_WAR_RULES.knockout.loserPoints;
    } else if (selectedWinType === 'disqualification') {
      previewPointsB = OFFICIAL_ROBOT_WAR_RULES.disqualification.winnerPoints;
      previewPointsA = OFFICIAL_ROBOT_WAR_RULES.disqualification.loserPoints;
    } else {
      previewPointsB = OFFICIAL_ROBOT_WAR_RULES.judgesDecision.winnerPoints;
      previewPointsA = OFFICIAL_ROBOT_WAR_RULES.judgesDecision.loserPoints;
    }
  } else if (selectedResult === 'draw') {
    previewPointsA = OFFICIAL_ROBOT_WAR_RULES.draw.teamAPoints;
    previewPointsB = OFFICIAL_ROBOT_WAR_RULES.draw.teamBPoints;
  }

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamA || !newTeamB || newTeamA === newTeamB) return;
    const matchId = createRobotWarMatch(newTeamA, newTeamB, newNotes);
    setActiveRobotWarMatch(matchId);
    setIsCreateModalOpen(false);
    setNewTeamA('');
    setNewTeamB('');
    setNewNotes('');
  };

  const handleSaveDraft = () => {
    if (!activeRobotWarMatch) return;
    saveRobotWarDraft(activeRobotWarMatch.id, selectedResult, selectedWinType, matchNotes);
    setSuccessMsg('Match draft saved. Public display unchanged.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handlePublish = () => {
    if (!activeRobotWarMatch || selectedResult === 'pending') return;
    publishRobotWarResult(activeRobotWarMatch.id, selectedResult, selectedWinType, matchNotes);
    setSuccessMsg('Robot War result officially published! Big screen & leaderboard updated.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-5 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4" />
            <span>Combat Arena Control</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            ROUND 3: ROBOT WAR HEAD-TO-HEAD
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Direct arena face-offs. Assign official knockout, judges decision, or draw point allocations.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setDisplayState('robot_war')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Show War View on Stage</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-rose-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Combat Match</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs text-emerald-300 shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">BROADCASTED</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2-Columns: Head-to-Head Arena Scoring Station */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeRobotWarMatch ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
              
              {/* Match Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                    ARENA MATCH #{activeRobotWarMatch.matchNumber}
                  </div>
                  <div className="text-sm text-slate-300 font-medium mt-0.5">
                    {activeRobotWarMatch.matchNotes || 'Official Tournament Matchup'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      activeRobotWarMatch.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {activeRobotWarMatch.status}
                  </span>
                </div>
              </div>

              {/* Head-to-Head Split Card */}
              <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                
                {/* Team A Card */}
                <div
                  onClick={() => setSelectedResult('team_a_win')}
                  className={`cursor-pointer sm:col-span-5 p-4 rounded-xl border-2 transition ${
                    selectedResult === 'team_a_win'
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-950/60'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 mb-1">
                    <span>TEAM A (RED/BLUE CORNER)</span>
                    <span className="font-mono">{teamASchool?.teamNumber}</span>
                  </div>
                  <div className="text-base font-bold text-white leading-tight">
                    {teamASchool?.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {teamASchool?.teamName} • {teamASchool?.city}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Awarded Points:</span>
                    <span className="font-mono text-xl font-bold text-cyan-300">
                      {previewPointsA} pts
                    </span>
                  </div>
                </div>

                {/* VS Emblem */}
                <div className="sm:col-span-1 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-slate-900 border border-rose-500/40 flex items-center justify-center font-display font-bold text-xs text-rose-400 shadow-md">
                    VS
                  </div>
                </div>

                {/* Team B Card */}
                <div
                  onClick={() => setSelectedResult('team_b_win')}
                  className={`cursor-pointer sm:col-span-5 p-4 rounded-xl border-2 transition ${
                    selectedResult === 'team_b_win'
                      ? 'bg-rose-950/60 border-rose-400 shadow-lg shadow-rose-950/60'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-rose-400 mb-1">
                    <span>TEAM B (OPPOSING CORNER)</span>
                    <span className="font-mono">{teamBSchool?.teamNumber}</span>
                  </div>
                  <div className="text-base font-bold text-white leading-tight">
                    {teamBSchool?.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {teamBSchool?.teamName} • {teamBSchool?.city}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Awarded Points:</span>
                    <span className="font-mono text-xl font-bold text-rose-300">
                      {previewPointsB} pts
                    </span>
                  </div>
                </div>

              </div>

              {/* Match Outcome Selector */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Select Match Victory Outcome
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedResult('team_a_win')}
                    className={`py-3 px-2 rounded-xl text-center text-xs font-bold transition border ${
                      selectedResult === 'team_a_win'
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    TEAM A WINS
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedResult('draw')}
                    className={`py-3 px-2 rounded-xl text-center text-xs font-bold transition border ${
                      selectedResult === 'draw'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    TECHNICAL DRAW (50-50)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedResult('team_b_win')}
                    className={`py-3 px-2 rounded-xl text-center text-xs font-bold transition border ${
                      selectedResult === 'team_b_win'
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    TEAM B WINS
                  </button>
                </div>
              </div>

              {/* Victory Classification (Knockout vs Judges Decision vs DQ) */}
              {selectedResult !== 'draw' && selectedResult !== 'pending' && (
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-slate-400 block">
                    Victory Classification (Official BRL Scoring Structure)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedWinType('knockout')}
                      className={`p-2.5 rounded-lg text-left text-xs border transition ${
                        selectedWinType === 'knockout'
                          ? 'bg-rose-950/60 border-rose-500 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-rose-300 font-bold">Knockout / Arena Out</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">100 pts vs 20 pts</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedWinType('judges_decision')}
                      className={`p-2.5 rounded-lg text-left text-xs border transition ${
                        selectedWinType === 'judges_decision'
                          ? 'bg-amber-950/60 border-amber-500 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-amber-300 font-bold">Judges Decision</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">75 pts vs 35 pts</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedWinType('disqualification')}
                      className={`p-2.5 rounded-lg text-left text-xs border transition ${
                        selectedWinType === 'disqualification'
                          ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-purple-300 font-bold">Rule Disqualification</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">90 pts vs 0 pts</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Match Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Arena Match Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Robot War Quarter-Final • Flip knockout at 1m 24s"
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={selectedResult === 'pending'}
                  className="w-full sm:flex-1 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-rose-600/20 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>PUBLISH ROBOT WAR RESULT (LIVE)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1.5"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Save Draft</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Swords className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-white">No Robot War Match Selected</h3>
              <p className="text-xs text-slate-500 mt-1">Select an existing match from the list or create a new pairing.</p>
            </div>
          )}

        </div>

        {/* Right Column: Tournament Matches List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Swords className="w-4 h-4 text-rose-400" />
              <span>Combat Match List ({state.robotWarMatches.length})</span>
            </h3>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
            >
              + Add Match
            </button>
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {state.robotWarMatches.map((m) => {
              const teamA = state.schools.find(s => s.id === m.teamAId);
              const teamB = state.schools.find(s => s.id === m.teamBId);
              const isSelected = activeRobotWarMatch?.id === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => setActiveRobotWarMatch(m.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="font-bold text-slate-400">MATCH #{m.matchNumber}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        m.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white truncate">
                    {teamA?.name} <span className="text-rose-400">vs</span> {teamB?.name}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                    <span>
                      {m.result === 'team_a_win' && `Winner: ${teamA?.teamName}`}
                      {m.result === 'team_b_win' && `Winner: ${teamB?.teamName}`}
                      {m.result === 'draw' && 'Result: Draw (50-50)'}
                      {m.result === 'pending' && 'Result: Scheduled'}
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {m.teamAPoints} - {m.teamBPoints}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Create Match Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-display font-bold text-white">Create Robot War Matchup</h3>
            <form onSubmit={handleCreateMatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Team A (Corner 1) *</label>
                <select
                  required
                  value={newTeamA}
                  onChange={(e) => setNewTeamA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Choose Team A --</option>
                  {state.schools.filter(s => s.isActive && s.id !== newTeamB).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.teamName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Team B (Corner 2) *</label>
                <select
                  required
                  value={newTeamB}
                  onChange={(e) => setNewTeamB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Choose Team B --</option>
                  {state.schools.filter(s => s.isActive && s.id !== newTeamA).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.teamName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Match Description / Bracket Note</label>
                <input
                  type="text"
                  placeholder="e.g. Semi-Final Clash #1"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
                >
                  Create Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
