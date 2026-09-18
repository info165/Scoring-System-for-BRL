import React, { useState } from 'react';
import { 
  Play, 
  SkipForward, 
  Tv, 
  Users, 
  ArrowUpDown, 
  CheckCircle, 
  Clock, 
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { PublicDisplayState } from '../../types';

interface LiveControlViewProps {
  setActiveTab: (tab: string) => void;
}

export const LiveControlView: React.FC<LiveControlViewProps> = ({ setActiveTab }) => {
  const {
    state,
    currentSchool,
    upNextSchool,
    followingSchool,
    activeRobotWarMatch,
    setActiveRobotWarMatch,
    advanceQueue,
    setCurrentTeamManually,
    reorderQueue,
    setDisplayState,
    setCurrentRound,
    setCompetitionStatus
  } = useCompetition();

  const [selectedQueueTeamId, setSelectedQueueTeamId] = useState<string>('');
  const isRobotWar = state.currentRound === 3;
  const roundKey = state.currentRound === 3 ? 1 : state.currentRound;
  const currentQueue = state.runQueue[roundKey] || { currentSchoolId: null, queueSchoolIds: [], completedSchoolIds: [] };

  const queuedSchools = currentQueue.queueSchoolIds
    .map(id => state.schools.find(s => s.id === id))
    .filter(Boolean) as typeof state.schools;

  const completedSchools = currentQueue.completedSchoolIds
    .map(id => state.schools.find(s => s.id === id))
    .filter(Boolean) as typeof state.schools;

  const getMatchLabel = (match: (typeof state.robotWarMatches)[number]) => {
    const teamA = state.schools.find(s => s.id === match.teamAId);
    const teamB = state.schools.find(s => s.id === match.teamBId);
    return `${teamA?.name || 'TBD'} vs ${teamB?.name || 'TBD'}`;
  };

  const scheduledMatches = state.robotWarMatches.filter(m => m.status === 'scheduled');
  const completedMatches = state.robotWarMatches.filter(m => m.status === 'completed');
  const upNextMatch = scheduledMatches.find(m => m.id !== activeRobotWarMatch?.id) || null;
  const followingMatch = scheduledMatches.filter(m => m.id !== upNextMatch?.id).find(m => m.id !== activeRobotWarMatch?.id) || null;

  const activeMatchTeamA = activeRobotWarMatch ? state.schools.find(s => s.id === activeRobotWarMatch.teamAId) : null;
  const activeMatchTeamB = activeRobotWarMatch ? state.schools.find(s => s.id === activeRobotWarMatch.teamBId) : null;

  const moveQueueItem = (index: number, direction: 'up' | 'down') => {
    const list = [...currentQueue.queueSchoolIds];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    reorderQueue(list);
  };

  const displayModes: { id: PublicDisplayState; label: string; desc: string }[] = [
    { id: 'welcome', label: '1. Welcome Arena', desc: 'BRL 2026 event kick-off screen' },
    { id: 'current_round', label: '2. Current Round', desc: 'Active round title and rules summary' },
    { id: 'live_run', label: '3. Now Playing / Run', desc: 'Current team playing, score & queue' },
    { id: 'leaderboard', label: '4. Live Leaderboard', desc: 'Stage-wide official ranking table' },
    { id: 'robot_war', label: '5. Robot War Match', desc: 'Head-to-head arena combat split screen' },
    { id: 'winner', label: '6. Grand Champion', desc: 'Championship celebration & podium screen' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Active Round and Display Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-4 gap-4">
        <div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            BHARAT ROBOTICS LEAGUE 2026 • ARENA CONTROL
          </div>
          <h2 className="text-xl font-display font-bold text-white mt-0.5">
            Run Order & Presentation Controller
          </h2>
          <p className="text-xs text-slate-400">
            Advancing the queue here immediately updates the HDMI public display.
          </p>
        </div>

        {/* Round Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          {[
            { r: 1 as const, label: 'Round 1: Push' },
            { r: 2 as const, label: 'Round 2: Pull' },
            { r: 3 as const, label: 'Round 3: War' },
          ].map((item) => (
            <button
              key={item.r}
              onClick={() => setCurrentRound(item.r)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                state.currentRound === item.r
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-Column Arena Queue Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Current Active Team (Now Playing) */}
        <div className="bg-[#0e1832] border-2 border-emerald-500/70 rounded-2xl p-5 relative overflow-hidden shadow-xl shadow-emerald-950/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>NOW PLAYING</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                ROUND {state.currentRound}
              </span>
            </div>

            {isRobotWar ? (
              activeRobotWarMatch ? (
                <div className="space-y-3 mt-2">
                  <div className="text-xl font-display font-bold text-white leading-tight">
                    <span>{activeMatchTeamA?.name || 'TBD'}</span>
                    <span className="text-red-400 mx-2">VS</span>
                    <span>{activeMatchTeamB?.name || 'TBD'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
                      Match #{activeRobotWarMatch.matchNumber}
                    </span>
                    <span className="text-sm font-semibold text-slate-200">
                      {activeRobotWarMatch.matchNotes || 'Arena Match'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="font-semibold text-white">No Match Currently Active</p>
                  <p className="text-xs text-slate-400 mt-1">Schedule a match in Round 3 or select one below.</p>
                </div>
              )
            ) : currentSchool ? (
              <div className="space-y-3 mt-2">
                <div className="text-2xl font-display font-bold text-white leading-tight">
                  {currentSchool.name}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
                    {currentSchool.teamNumber}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">
                    {currentSchool.teamName}
                  </span>
                  <span className="text-xs text-slate-400">• {currentSchool.city}</span>
                </div>

                {currentSchool.students && currentSchool.students.length > 0 && (
                  <div className="text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block font-medium mb-0.5">Pilots / Engineers:</span>
                    <span className="text-slate-200">{currentSchool.students.join(', ')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-semibold text-white">No Team Currently Active</p>
                <p className="text-xs text-slate-400 mt-1">Select a school from the queue below or advance.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (state.currentRound === 1) setActiveTab('round_1');
                  else if (state.currentRound === 2) setActiveTab('round_2');
                  else setActiveTab('round_3');
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20"
              >
                <span>Enter & Publish Score</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  if (isRobotWar) {
                    if (upNextMatch) setActiveRobotWarMatch(upNextMatch.id);
                  } else {
                    advanceQueue();
                  }
                }}
                disabled={isRobotWar && !upNextMatch}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-40"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>{isRobotWar ? 'NEXT MATCH' : 'NEXT TEAM'}</span>
              </button>
            </div>

            {/* Set Current Team / Match Manually */}
            <div className="pt-2">
              <label className="text-[11px] text-slate-400 block mb-1">
                {isRobotWar ? 'Force Set Active Match (Direct Override):' : 'Force Set Current Team (Direct Override):'}
              </label>
              {isRobotWar ? (
                <select
                  value={activeRobotWarMatch?.id || ''}
                  onChange={(e) => {
                    if (e.target.value) setActiveRobotWarMatch(e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Match --</option>
                  {state.robotWarMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      Match #{m.matchNumber}: {getMatchLabel(m)}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={currentSchool?.id || ''}
                  onChange={(e) => {
                    if (e.target.value) setCurrentTeamManually(e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Team --</option>
                  {state.schools.filter(s => s.isActive).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.teamName})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Up Next & Following (Pit Queue) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Staging & Pit Queue</span>
              </h3>
              <span className="text-xs text-slate-400">
                {isRobotWar ? `${scheduledMatches.length} Matches Scheduled` : `${queuedSchools.length} Teams Waiting`}
              </span>
            </div>

            {/* UP NEXT Preview Card */}
            <div className="bg-slate-950/80 border border-cyan-500/40 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-[11px] text-cyan-400 font-bold mb-1">
                <span>1. UP NEXT (ON DECK)</span>
                <span className="text-slate-400">Position 1</span>
              </div>
              {isRobotWar ? (
                upNextMatch ? (
                  <div>
                    <div className="text-base font-bold text-white truncate">
                      {getMatchLabel(upNextMatch)}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      Match #{upNextMatch.matchNumber} • {upNextMatch.matchNotes || 'Arena Match'}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-1">No upcoming match scheduled</div>
                )
              ) : upNextSchool ? (
                <div>
                  <div className="text-base font-bold text-white truncate">
                    {upNextSchool.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {upNextSchool.teamName} • {upNextSchool.teamNumber} • {upNextSchool.city}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-1">No upcoming team in slot</div>
              )}
            </div>

            {/* FOLLOWING Preview Card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mb-1">
                <span>2. FOLLOWING</span>
                <span className="text-slate-400">Position 2</span>
              </div>
              {isRobotWar ? (
                followingMatch ? (
                  <div>
                    <div className="text-sm font-bold text-slate-200 truncate">
                      {getMatchLabel(followingMatch)}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      Match #{followingMatch.matchNumber} • {followingMatch.matchNotes || 'Arena Match'}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-1">No further matches scheduled</div>
                )
              ) : followingSchool ? (
                <div>
                  <div className="text-sm font-bold text-slate-200 truncate">
                    {followingSchool.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {followingSchool.teamName} • {followingSchool.teamNumber} • {followingSchool.city}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-1">End of queue</div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
            Pressing <span className="text-emerald-400 font-bold">{isRobotWar ? 'NEXT MATCH' : 'NEXT TEAM'}</span> advances <em>UP NEXT</em> into the arena.
          </div>
        </div>

        {/* Public Display Screen Controller */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Tv className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Display Screen Mode
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              LIVE SYNC ACTIVE
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Switch what is shown on the HDMI projector/LED screen for the audience:
          </p>

          <div className="space-y-2">
            {displayModes.map((dm) => (
              <button
                key={dm.id}
                onClick={() => setDisplayState(dm.id)}
                className={`w-full p-2.5 rounded-xl text-left transition border flex items-center justify-between ${
                  state.displayState === dm.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">{dm.label}</div>
                  <div className={`text-[11px] ${state.displayState === dm.id ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                    {dm.desc}
                  </div>
                </div>
                {state.displayState === dm.id && (
                  <span className="w-2 h-2 rounded-full bg-black"></span>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Full Queue Ordering & Completed Teams List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Run Queue List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>
                {isRobotWar ? `Remaining Matches (${scheduledMatches.length})` : `Remaining Run Queue (${queuedSchools.length})`}
              </span>
            </h3>
            <span className="text-xs text-slate-400">
              {isRobotWar ? 'Schedule matches in the Round 3 tab' : 'Use arrows to adjust order'}
            </span>
          </div>

          {isRobotWar ? (
            scheduledMatches.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No scheduled matches remaining for Round 3.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {scheduledMatches.map((match, index) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="font-mono font-bold text-slate-400 w-5 text-right">
                        {index + 1}.
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-white truncate block">{getMatchLabel(match)}</span>
                        <span className="text-[11px] text-slate-400">Match #{match.matchNumber} • {match.matchNotes || 'Arena Match'}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={() => setActiveRobotWarMatch(match.id)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-amber-500 hover:text-black text-amber-400 text-[10px] font-bold rounded transition ml-1"
                      >
                        Make Active
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : queuedSchools.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              All teams have completed their runs for Round {state.currentRound}.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {queuedSchools.map((school, index) => (
                <div
                  key={school.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs hover:border-slate-700 transition"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="font-mono font-bold text-slate-400 w-5 text-right">
                      {index + 1}.
                    </span>
                    <div className="truncate">
                      <span className="font-bold text-white truncate block">{school.name}</span>
                      <span className="text-[11px] text-slate-400">{school.teamName} • {school.teamNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      onClick={() => moveQueueItem(index, 'up')}
                      disabled={index === 0}
                      title="Move up in queue"
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveQueueItem(index, 'down')}
                      disabled={index === queuedSchools.length - 1}
                      title="Move down in queue"
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => setCurrentTeamManually(school.id)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-amber-500 hover:text-black text-amber-400 text-[10px] font-bold rounded transition ml-1"
                    >
                      Make Active
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Teams in this Round */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>
                {isRobotWar ? `Completed Matches (${completedMatches.length})` : `Completed Runs (${completedSchools.length})`}
              </span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono">Round {state.currentRound}</span>
          </div>

          {isRobotWar ? (
            completedMatches.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No completed matches recorded yet for Round 3.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {completedMatches.map((match) => {
                  const teamA = state.schools.find(s => s.id === match.teamAId);
                  const teamB = state.schools.find(s => s.id === match.teamBId);
                  const winner = match.result === 'team_a_win' ? teamA : match.result === 'team_b_win' ? teamB : null;
                  const resultLabel = match.result === 'draw' ? 'Draw' : winner ? `Winner: ${winner.name}` : 'Pending';

                  return (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs"
                    >
                      <div className="truncate">
                        <span className="font-medium text-slate-200 truncate block">{getMatchLabel(match)}</span>
                        <span className="text-[11px] text-slate-400">Match #{match.matchNumber} • {resultLabel}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {match.teamAPoints}-{match.teamBPoints}
                        </span>
                        <button
                          onClick={() => setActiveRobotWarMatch(match.id)}
                          title="Open this match again for review or correction"
                          className="text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-800"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : completedSchools.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No completed runs recorded yet for this round.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {completedSchools.map((school, index) => {
                const teamScore = state.scores[school.id];
                const scoreValue = state.currentRound === 1 
                  ? teamScore?.round1?.calculatedScore 
                  : state.currentRound === 2 
                    ? teamScore?.round2?.calculatedScore 
                    : teamScore?.round3Score;

                return (
                  <div
                    key={school.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs"
                  >
                    <div className="truncate">
                      <span className="font-medium text-slate-200 truncate block">{school.name}</span>
                      <span className="text-[11px] text-slate-400">{school.teamName} ({school.teamNumber})</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {scoreValue !== undefined ? `${scoreValue} pts` : 'Pending Score'}
                      </span>
                      <button
                        onClick={() => setCurrentTeamManually(school.id)}
                        title="Put back in arena for re-run"
                        className="text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-800"
                      >
                        Re-run
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
