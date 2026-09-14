import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  Swords, 
  Layers, 
  ArrowRight, 
  Play, 
  AlertCircle,
  TrendingUp,
  Sparkles,
  Tv
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const { 
    state, 
    leaderboard, 
    currentSchool, 
    upNextSchool, 
    followingSchool, 
    advanceQueue,
    setDisplayState,
    setCurrentRound,
    triggerWinnerMode
  } = useCompetition();

  const totalSchools = state.schools.filter(s => s.isActive).length;
  const currentRoundKey = state.currentRound === 3 ? 1 : state.currentRound;
  const currentQueue = state.runQueue[currentRoundKey] || { completedSchoolIds: [], queueSchoolIds: [] };
  const completedCount = currentQueue.completedSchoolIds.length;
  const remainingCount = Math.max(0, totalSchools - completedCount);
  const progressPercent = totalSchools > 0 ? Math.round((completedCount / totalSchools) * 100) : 0;

  const currentLeader = leaderboard[0];
  const completedWarMatches = state.robotWarMatches.filter(m => m.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Event Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#0d162d] to-slate-900 border border-amber-500/20 p-6 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial-glow pointer-events-none opacity-40"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>29 SEPTEMBER 2026 • OFFICIAL COMPETITION STAGE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-wide">
              Bharat Robotics League 2026 Live Control
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Central scoring room interface. Changes published here instantly broadcast to the HDMI public display without page refresh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('live_control')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Live Arena Queue</span>
            </button>
            <button
              onClick={() => triggerWinnerMode()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-sm rounded-xl border border-amber-500/30 transition flex items-center space-x-2"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Podium / Winner</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Schools */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Teams</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-display font-bold text-white">
              {totalSchools}
            </div>
            <span className="text-[11px] text-slate-400">Active participants</span>
          </div>
        </div>

        {/* Round Progress */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">R{state.currentRound} Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-display font-bold text-emerald-400">
              {completedCount} <span className="text-sm font-normal text-slate-400">/ {totalSchools}</span>
            </div>
            <span className="text-[11px] text-slate-400">{progressPercent}% complete</span>
          </div>
        </div>

        {/* Schools Remaining */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Remaining</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-display font-bold text-amber-400">
              {remainingCount}
            </div>
            <span className="text-[11px] text-slate-400">Teams in queue</span>
          </div>
        </div>

        {/* Current Round */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Current Round</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-display font-bold text-purple-300 truncate">
              {state.currentRound === 1 && 'Round 1: Push'}
              {state.currentRound === 2 && 'Round 2: Pull'}
              {state.currentRound === 3 && 'Round 3: War'}
            </div>
            <span className="text-[11px] text-slate-400">Active scoring stage</span>
          </div>
        </div>

        {/* Current Leader */}
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between col-span-2 md:col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Current Leader
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              {currentLeader ? `${currentLeader.totalScore} PTS` : '0 PTS'}
            </span>
          </div>
          <div className="mt-2 truncate">
            <div className="text-sm font-bold text-white truncate">
              {currentLeader ? currentLeader.school.name : 'Awaiting scores'}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {currentLeader ? `${currentLeader.school.teamName} (${currentLeader.school.teamNumber})` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
          <span>Round {state.currentRound} Execution Progress</span>
          <span>{completedCount} of {totalSchools} Teams Completed ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Active Run Order & Queue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Run Order Cards */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h2 className="text-lg font-display font-bold text-white">Live Arena Run Order</h2>
            </div>
            <button
              onClick={() => setActiveTab('live_control')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              Full Queue Manager <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* NOW PLAYING */}
            <div className="bg-[#121c38] border-2 border-emerald-500/60 rounded-xl p-4 relative overflow-hidden shadow-lg shadow-emerald-950/40">
              <div className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Now Playing</span>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">CURRENT TEAM</div>
              <div className="text-base font-bold text-white mt-1 leading-snug truncate">
                {currentSchool ? currentSchool.name : 'None Selected'}
              </div>
              <div className="text-xs text-cyan-300 font-medium truncate mt-0.5">
                {currentSchool ? `${currentSchool.teamName} • ${currentSchool.teamNumber}` : '—'}
              </div>
              <div className="text-[11px] text-slate-400 mt-2 truncate">
                {currentSchool ? currentSchool.city : ''}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (state.currentRound === 1) setActiveTab('round_1');
                    else if (state.currentRound === 2) setActiveTab('round_2');
                    else setActiveTab('round_3');
                  }}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  Score Run <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={advanceQueue}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition shadow-sm"
                >
                  Next Team
                </button>
              </div>
            </div>

            {/* UP NEXT */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">UP NEXT</div>
                <div className="text-base font-bold text-slate-200 mt-1 leading-snug truncate">
                  {upNextSchool ? upNextSchool.name : 'End of Queue'}
                </div>
                <div className="text-xs text-slate-400 font-medium truncate mt-0.5">
                  {upNextSchool ? `${upNextSchool.teamName} • ${upNextSchool.teamNumber}` : '—'}
                </div>
                <div className="text-[11px] text-slate-500 mt-2 truncate">
                  {upNextSchool ? upNextSchool.city : ''}
                </div>
              </div>
              <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 mt-3">
                Prepping in pit area
              </div>
            </div>

            {/* FOLLOWING */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FOLLOWING</div>
                <div className="text-base font-bold text-slate-300 mt-1 leading-snug truncate">
                  {followingSchool ? followingSchool.name : 'None'}
                </div>
                <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {followingSchool ? `${followingSchool.teamName} • ${followingSchool.teamNumber}` : '—'}
                </div>
                <div className="text-[11px] text-slate-600 mt-2 truncate">
                  {followingSchool ? followingSchool.city : ''}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-800/80 mt-3">
                Robot inspection
              </div>
            </div>
          </div>
        </div>

        {/* Public Display State Control Widget */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-display font-bold text-white">Public Display Mode</h2>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
              HDMI Output
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Select the screen active on the stage LED wall or projector:
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'welcome', label: 'Welcome Screen' },
              { id: 'current_round', label: 'Round Objectives' },
              { id: 'live_run', label: 'Now Playing (Live)' },
              { id: 'leaderboard', label: 'Full Leaderboard' },
              { id: 'robot_war', label: 'Robot War Battle' },
              { id: 'winner', label: 'Grand Champion' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setDisplayState(st.id as any)}
                className={`p-2.5 rounded-lg text-left text-xs font-semibold transition border ${
                  state.displayState === st.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] text-slate-400">
              Active Display: <strong className="text-white uppercase font-mono">{state.displayState}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Round Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Round 1 Card */}
        <div 
          onClick={() => {
            setCurrentRound(1);
            setActiveTab('round_1');
          }}
          className="cursor-pointer bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-5 transition group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-cyan-400 mb-2">
            <span>ROUND 1</span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">BLOCK PUSH</span>
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
            Block Push Challenge
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Target zones, precision weight displacement, autonomous bonuses & penalties.
          </p>
          <div className="mt-4 flex items-center text-xs text-amber-400 font-semibold group-hover:translate-x-1 transition">
            <span>Open Round 1 Scoring</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Round 2 Card */}
        <div 
          onClick={() => {
            setCurrentRound(2);
            setActiveTab('round_2');
          }}
          className="cursor-pointer bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 transition group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-2">
            <span>ROUND 2</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">BLOCK PULL</span>
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">
            Block Pull Challenge
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            High-friction sled tow, 1.0kg to 5.0kg tiers, distance factors, traction bonuses.
          </p>
          <div className="mt-4 flex items-center text-xs text-amber-400 font-semibold group-hover:translate-x-1 transition">
            <span>Open Round 2 Scoring</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Round 3 Card */}
        <div 
          onClick={() => {
            setCurrentRound(3);
            setActiveTab('round_3');
          }}
          className="cursor-pointer bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/40 rounded-xl p-5 transition group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-400 mb-2">
            <span>ROUND 3</span>
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300">ROBOT WAR</span>
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition">
            Robot War Arena
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Head-to-head combat face-offs, knockout & decision scoring, arena domination.
          </p>
          <div className="mt-4 flex items-center text-xs text-amber-400 font-semibold group-hover:translate-x-1 transition">
            <span>Open Robot War Matchups</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
};
